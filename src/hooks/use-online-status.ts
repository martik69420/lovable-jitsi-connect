
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

export interface UserStatus {
  isOnline: boolean | null;
  lastActive: string | null;
  status: 'online' | 'away' | 'offline';
}

export interface OnlineStatusHook {
  isUserOnline: (userId: string) => boolean;
  onlineStatuses: Record<string, UserStatus>;
  getUserStatus: (userId: string) => 'online' | 'away' | 'offline';
}

// Define a type for the payload coming from Supabase real-time subscription
interface StatusPayload {
  new: {
    user_id: string;
    is_online: boolean;
    last_active: string;
  };
}

const useOnlineStatus = (userIds: string[]): OnlineStatusHook => {
  const [onlineStatuses, setOnlineStatuses] = useState<Record<string, UserStatus>>({});
  const { user } = useAuth();

  // Helper function to determine status based on last activity
  const getStatusFromLastActive = (isOnline: boolean, lastActive: string | null): 'online' | 'away' | 'offline' => {
    if (!isOnline || !lastActive) return 'offline';
    
    const now = new Date();
    const lastActiveDate = new Date(lastActive);
    const diffInMinutes = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60);
    
    if (diffInMinutes <= 2) return 'online';  // Active within 2 minutes
    if (diffInMinutes <= 10) return 'away';   // Active within 10 minutes but not recent
    return 'offline';  // Inactive for more than 10 minutes
  };

  useEffect(() => {
    if (!userIds.length) {
      return;
    }

    const fetchInitialStatus = async () => {
      try {
        // Fetch from user_status table
        const { data, error } = await supabase
          .from('user_status')
          .select('user_id, is_online, last_active')
          .in('user_id', userIds);

        if (error) {
          console.error('Error fetching initial online status:', error);
          return;
        }

        const statusMap: Record<string, UserStatus> = {};
        data?.forEach(item => {
          const status = getStatusFromLastActive(item.is_online || false, item.last_active);
          statusMap[item.user_id] = {
            isOnline: status === 'online',
            lastActive: item.last_active || null,
            status
          };
        });

        setOnlineStatuses(statusMap);
      } catch (error) {
        console.error('Error fetching initial online status:', error);
      }
    };

    fetchInitialStatus();

    // Subscribe to realtime changes on the user_status table
    const statusChannel = supabase
      .channel('user-status-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_status',
          filter: `user_id=in.(${userIds.join(',')})`,
        },
        (payload: any) => {
          // Type check and guard for the payload
          if (payload && payload.new && typeof payload.new === 'object') {
            const newStatus = payload.new as {
              user_id: string;
              is_online: boolean;
              last_active: string;
            };
            
            // Verify required properties exist before using them
            if ('user_id' in newStatus) {
              const status = getStatusFromLastActive(newStatus.is_online || false, newStatus.last_active);
              setOnlineStatuses(prev => ({
                ...prev,
                [newStatus.user_id]: {
                  isOnline: status === 'online',
                  lastActive: newStatus.last_active || null,
                  status
                }
              }));
            }
          }
        }
      )
      .subscribe();

    // Update current user's online status
    const updateMyStatus = async () => {
      if (!user?.id) return;
      
      await supabase
        .from('user_status')
        .upsert(
          { user_id: user.id, is_online: true, last_active: new Date().toISOString() },
          { onConflict: 'user_id' }
        );
    };

    // Periodic check to update status for all tracked users
    const refreshStatuses = async () => {
      if (userIds.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('user_status')
          .select('user_id, is_online, last_active')
          .in('user_id', userIds);

        if (error) return;

        const statusMap: Record<string, UserStatus> = {};
        data?.forEach(item => {
          const status = getStatusFromLastActive(item.is_online || false, item.last_active);
          statusMap[item.user_id] = {
            isOnline: status === 'online',
            lastActive: item.last_active || null,
            status
          };
        });

        setOnlineStatuses(statusMap);
      } catch (error) {
        console.error('Error refreshing statuses:', error);
      }
    };
    
    if (user?.id) {
      updateMyStatus();
      
      // Set up intervals
      const statusInterval = setInterval(updateMyStatus, 30000); // Update every 30 seconds
      const refreshInterval = setInterval(refreshStatuses, 60000); // Refresh all statuses every minute
      
      // Set up event listeners for presence detection
      const handleBeforeUnload = async () => {
        await supabase
          .from('user_status')
          .update({ is_online: false, last_active: new Date().toISOString() })
          .eq('user_id', user.id);
      };
      
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          updateMyStatus();
        }
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        clearInterval(statusInterval);
        clearInterval(refreshInterval);
        supabase.removeChannel(statusChannel);
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
    
    return () => {
      supabase.removeChannel(statusChannel);
    };
  }, [userIds.join(','), user?.id]);

  const isUserOnline = (userId: string): boolean => {
    return onlineStatuses[userId]?.isOnline || false;
  };

  const getUserStatus = (userId: string): 'online' | 'away' | 'offline' => {
    return onlineStatuses[userId]?.status || 'offline';
  };

  return { 
    isUserOnline, 
    onlineStatuses,
    getUserStatus 
  };
};

export default useOnlineStatus;
