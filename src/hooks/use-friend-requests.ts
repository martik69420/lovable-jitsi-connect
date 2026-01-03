import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

export const useFriendRequests = () => {
  const [requestCount, setRequestCount] = useState(0);
  const { user } = useAuth();

  const fetchRequestCount = useCallback(async () => {
    if (!user?.id) {
      setRequestCount(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('friends')
        .select('*', { count: 'exact', head: true })
        .eq('friend_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error fetching friend request count:', error);
        return;
      }

      setRequestCount(count || 0);
    } catch (error) {
      console.error('Error fetching friend requests count:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    fetchRequestCount();

    const channel = supabase
      .channel('friend_requests_tracker')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `friend_id=eq.${user.id}`
        },
        () => {
          fetchRequestCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchRequestCount]);

  return { requestCount, fetchRequestCount };
};
