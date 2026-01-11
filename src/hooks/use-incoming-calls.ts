import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

interface IncomingCall {
  callerId: string;
  callerUsername?: string;
  callerDisplayName?: string;
  callerAvatar?: string | null;
  channelId: string;
}

export const useIncomingCalls = () => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const channelsRef = useRef<Map<string, any>>(new Map());
  const friendsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    // Fetch friends to set up call listeners for each potential caller
    const setupCallListeners = async () => {
      try {
        // Get all friends (accepted friend requests in either direction)
        const { data: friendsData } = await supabase
          .from('friends')
          .select('user_id, friend_id')
          .eq('status', 'accepted')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (!friendsData) return;

        // Extract friend IDs
        const friendIds = friendsData.map(f => 
          f.user_id === user.id ? f.friend_id : f.user_id
        ).filter(Boolean) as string[];

        friendsRef.current = friendIds;

        // Create a channel for each friend to listen for their calls
        friendIds.forEach(friendId => {
          const channelId = [user.id, friendId].sort().join('_');
          
          // Skip if already listening
          if (channelsRef.current.has(channelId)) return;

          const channel = supabase.channel(`call_${channelId}`, {
            config: { broadcast: { self: false } }
          });

          channel
            .on('broadcast', { event: 'call_request' }, ({ payload }) => {
              if (payload.targetId === user.id) {
                console.log('Incoming call from:', payload.callerId);
                setIncomingCall({
                  callerId: payload.callerId,
                  callerUsername: payload.callerUsername,
                  callerDisplayName: payload.callerDisplayName,
                  callerAvatar: payload.callerAvatar,
                  channelId
                });
              }
            })
            .on('broadcast', { event: 'call_end' }, ({ payload }) => {
              // Clear incoming call if the caller ended it
              if (incomingCall?.callerId === payload.callerId || payload.targetId === user.id) {
                setIncomingCall(null);
              }
            })
            .subscribe((status) => {
              console.log(`Call listener for ${channelId}:`, status);
            });

          channelsRef.current.set(channelId, channel);
        });
      } catch (error) {
        console.error('Error setting up call listeners:', error);
      }
    };

    setupCallListeners();

    // Also listen for friend list changes to update listeners
    const friendsChannel = supabase
      .channel('friends_changes_for_calls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `or(user_id.eq.${user.id},friend_id.eq.${user.id})`
        },
        () => {
          // Refresh listeners when friends change
          setupCallListeners();
        }
      )
      .subscribe();

    return () => {
      // Clean up all channels
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
      supabase.removeChannel(friendsChannel);
    };
  }, [user?.id]);

  const clearIncomingCall = useCallback(() => {
    // Send rejection to the caller before clearing
    if (incomingCall && channelsRef.current.has(incomingCall.channelId)) {
      const channel = channelsRef.current.get(incomingCall.channelId);
      channel?.send({
        type: 'broadcast',
        event: 'call_rejected',
        payload: { targetId: incomingCall.callerId }
      });
    }
    setIncomingCall(null);
  }, [incomingCall]);

  const acceptIncomingCall = useCallback(() => {
    // Just clear the state - the acceptance is handled in the VideoCallModal
    setIncomingCall(null);
  }, []);

  return { incomingCall, clearIncomingCall, acceptIncomingCall };
};
