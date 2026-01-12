import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

export const useUnreadMessages = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      updateDocumentTitle(0);
      return;
    }

    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .is('group_id', null); // Only count direct messages

      if (error) {
        console.error('Error fetching unread count:', error);
        return;
      }

      const safeCount = count || 0;
      setUnreadCount(safeCount);
      updateDocumentTitle(safeCount);
    } catch (error) {
      console.error('Error fetching unread messages count:', error);
    }
  }, [user?.id]);

  const updateDocumentTitle = (count: number) => {
    const baseTitle = 'Campus Connect';
    if (count > 0) {
      document.title = `${baseTitle} (${count})`;
    } else {
      document.title = baseTitle;
    }
  };

  // Subscribe to real-time message updates
  useEffect(() => {
    if (!user?.id) {
      updateDocumentTitle(0);
      return;
    }

    // Initial fetch
    fetchUnreadCount();

    // Set up real-time subscription for new messages and read status changes
    const channel = supabase
      .channel('unread_messages_tracker')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          // New message received - refresh count
          fetchUnreadCount();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        () => {
          // Message read status changed - refresh count
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      // Reset title when component unmounts
      document.title = 'Campus Connect';
    };
  }, [user?.id, fetchUnreadCount]);

  return { unreadCount, fetchUnreadCount };
};