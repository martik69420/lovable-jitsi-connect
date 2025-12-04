import React, { useState, useEffect, useCallback } from 'react';
import NotificationToast from './NotificationToast';
import { Notification, useNotification } from '@/context/NotificationContext';
import { supabase } from '@/integrations/supabase/client';

interface ToastNotification extends Notification {
  toastId: string;
}

const NotificationToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [shownIds, setShownIds] = useState<Set<string>>(new Set());
  const { 
    notifications, 
    markAsRead, 
    showMessageNotifications,
    showFriendNotifications,
    showLikeNotifications 
  } = useNotification();

  // Add a new toast
  const addToast = useCallback((notification: Notification) => {
    const toastId = `${notification.id}-${Date.now()}`;
    setToasts(prev => {
      // Limit to 3 toasts max
      const newToasts = [...prev, { ...notification, toastId }];
      if (newToasts.length > 3) {
        return newToasts.slice(-3);
      }
      return newToasts;
    });
    setShownIds(prev => new Set(prev).add(notification.id));
  }, []);

  // Remove a toast
  const removeToast = useCallback((toastId: string) => {
    setToasts(prev => prev.filter(t => t.toastId !== toastId));
  }, []);

  // Handle mark as read
  const handleMarkAsRead = useCallback((notification: ToastNotification) => {
    markAsRead(notification.id);
    removeToast(notification.toastId);
  }, [markAsRead, removeToast]);

  // Handle custom actions
  const handleAction = useCallback(async (action: string, notification: ToastNotification) => {
    if (action === 'accept' && notification.type === 'friend' && notification.relatedId) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          // Accept friend request
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
    markAsRead(notification.id);
  }, [markAsRead]);

  // Listen for new unread notifications
  useEffect(() => {
    const unreadNotifications = notifications.filter(n => !n.read && !shownIds.has(n.id));
    
    unreadNotifications.forEach(notification => {
      // Check if we should show this type of notification
      const shouldShow = 
        (notification.type === 'message' && showMessageNotifications) ||
        (notification.type === 'friend' && showFriendNotifications) ||
        (notification.type === 'like' && showLikeNotifications) ||
        notification.type === 'mention' ||
        notification.type === 'comment' ||
        notification.type === 'game' ||
        notification.type === 'share';

      if (shouldShow) {
        addToast(notification);
      }
    });
  }, [notifications, shownIds, addToast, showMessageNotifications, showFriendNotifications, showLikeNotifications]);

  // Set up real-time listener for new notifications
  useEffect(() => {
    const setupRealtimeListener = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const channel = supabase
        .channel('notification-toasts')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${session.user.id}`
          },
          async (payload) => {
            const newNotification = payload.new as any;
            
            // Get sender info if available
            let sender = undefined;
            if (newNotification.related_id) {
              const { data: userData } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url')
                .eq('id', newNotification.related_id)
                .single();

              if (userData) {
                sender = {
                  id: userData.id,
                  name: userData.display_name,
                  avatar: userData.avatar_url || undefined
                };
              }
            }

            const notification: Notification = {
              id: newNotification.id,
              type: newNotification.type,
              message: newNotification.content,
              timestamp: newNotification.created_at,
              read: newNotification.is_read,
              relatedId: newNotification.related_id,
              url: newNotification.url,
              sender
            };

            // Check preferences
            const shouldShow = 
              (notification.type === 'message' && showMessageNotifications) ||
              (notification.type === 'friend' && showFriendNotifications) ||
              (notification.type === 'like' && showLikeNotifications) ||
              notification.type === 'mention' ||
              notification.type === 'comment' ||
              notification.type === 'game' ||
              notification.type === 'share';

            if (shouldShow && !notification.read) {
              addToast(notification);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupRealtimeListener();
  }, [addToast, showMessageNotifications, showFriendNotifications, showLikeNotifications]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
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
