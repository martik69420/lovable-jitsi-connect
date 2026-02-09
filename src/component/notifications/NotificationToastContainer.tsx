import React, { useState, useEffect, useCallback, useRef } from 'react';
import NotificationToast from './NotificationToast';
import { Notification, useNotification } from '@/context/NotificationContext';
import { supabase } from '@/integrations/supabase/client';

interface ToastNotification extends Notification {
  toastId: string;
}

const NotificationToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const shownIdsRef = useRef<Set<string>>(new Set());
  const lastSeenNotificationIdsRef = useRef<Set<string>>(new Set());
  const { 
    markAsRead,
    fetchNotifications,
    notifications,
  } = useNotification();

  // Add a new toast
  const addToast = useCallback((notification: Notification) => {
    // Don't add if already shown (unless it's a test notification)
    if (shownIdsRef.current.has(notification.id) && !notification.id.startsWith('test-')) return;
    
    const toastId = `${notification.id}-${Date.now()}`;
    shownIdsRef.current.add(notification.id);
    
    setToasts(prev => {
      // Limit to 3 toasts max
      const newToasts = [...prev, { ...notification, toastId }];
      if (newToasts.length > 3) {
        return newToasts.slice(-3);
      }
      return newToasts;
    });
  }, []);

  // Remove a toast
  const removeToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  }, []);

  // Handle mark as read
  const handleMarkAsRead = useCallback((notification: ToastNotification) => {
    if (!notification.id.startsWith('test-')) {
      markAsRead(notification.id);
    }
    removeToast(notification.toastId);
  }, [markAsRead, removeToast]);

  // Handle custom actions
  const handleAction = useCallback(async (action: string, notification: ToastNotification) => {
    if (action === 'accept' && notification.type === 'friend' && notification.relatedId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          await supabase
            .from('friends')
            .update({ status: 'accepted' })
            .eq('user_id', notification.relatedId)
            .eq('friend_id', session.user.id);
        }
      } catch (error) {
        console.error('Error accepting friend request:', error);
      }
    }
    if (!notification.id.startsWith('test-')) {
      markAsRead(notification.id);
    }
    removeToast(notification.toastId);
  }, [markAsRead, removeToast]);

  // Listen for test notifications
  useEffect(() => {
    const handleTestNotification = (event: CustomEvent<Notification>) => {
      console.log('Test notification received:', event.detail);
      addToast(event.detail);
    };

    window.addEventListener('test-notification', handleTestNotification as EventListener);
    return () => {
      window.removeEventListener('test-notification', handleTestNotification as EventListener);
    };
  }, [addToast]);

  // Fallback: show toast for any newly fetched/added unread notification.
  // This ensures toasts work even if Realtime INSERT events are not delivered.
  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    // Track all ids we know about to detect "new" ones.
    const knownIds = lastSeenNotificationIdsRef.current;

    // We want newest-first behavior.
    const sorted = [...notifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const newlyArrived = sorted.filter((n) => !knownIds.has(n.id));

    // Mark current list as known.
    for (const n of notifications) {
      knownIds.add(n.id);
    }

    // Show toasts for new unread notifications.
    for (const n of newlyArrived) {
      if (n.id.startsWith('test-')) continue; // test handled by explicit event
      if (!n.read) {
        addToast(n);
      }
    }
  }, [notifications, addToast]);

  // Set up real-time listener for new notifications directly from DB
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    const setupRealtimeListener = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      channel = supabase
        .channel('notification-toasts-realtime')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`
          },
          async (payload) => {
            const newNotification = payload.new as Record<string, unknown>;
            console.log('New notification received:', newNotification);
            
            // Skip if already shown
            if (shownIdsRef.current.has(newNotification.id as string)) return;
            
            // Get sender info if available
            let sender = undefined;
            if (newNotification.related_id) {
              const { data: userData } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url')
                .eq('id', newNotification.related_id as string)
                .maybeSingle();

              if (userData) {
                sender = {
                  id: userData.id,
                  name: userData.display_name,
                  avatar: userData.avatar_url || undefined
                };
              }
            }

            const notification: Notification = {
              id: newNotification.id as string,
              type: newNotification.type as Notification['type'],
              message: newNotification.content as string,
              timestamp: newNotification.created_at as string,
              read: newNotification.is_read as boolean,
              relatedId: newNotification.related_id as string | undefined,
              url: newNotification.url as string | undefined,
              sender
            };

            // Show toast for unread notifications
            if (!notification.read) {
              addToast(notification);
              // Also refresh notifications list for the bell icon
              fetchNotifications();
            }
          }
        )
        .subscribe((status: string) => {
          console.log('Notification realtime subscription status:', status);
        });
    };

    setupRealtimeListener();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [addToast, fetchNotifications]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-auto">
      {toasts.map(toast => (
        <NotificationToast
          key={toast.toastId}
          notification={toast}
          onDismiss={() => removeToast(toast.toastId)}
          onMarkAsRead={() => handleMarkAsRead(toast)}
          onAction={(action) => handleAction(action, toast)}
        />
      ))}
    </div>
  );
};

export default NotificationToastContainer;
