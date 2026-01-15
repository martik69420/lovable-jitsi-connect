
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useRef,
} from 'react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PushNotificationService from '@/services/PushNotificationService';

// Define the structure of a notification
export interface Notification {
  id: string;
  type: 'message' | 'like' | 'friend' | 'system' | 'comment' | 'mention' | 'coin' | 'game' | 'share' | 'save';
  message: string;
  timestamp: string;
  read: boolean;
  relatedId?: string;
  url?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// Define the context properties
export interface NotificationContextProps {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  markAsReadByType: (type: Notification['type'], relatedId?: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  showMessageNotifications: boolean;
  showLikeNotifications: boolean;
  showFriendNotifications: boolean;
  showSystemNotifications: boolean;
  toggleMessageNotifications: () => void;
  toggleLikeNotifications: () => void;
  toggleFriendNotifications: () => void;
  toggleSystemNotifications: () => void;
  requestNotificationPermission: () => Promise<boolean>;
  isNotificationPermissionGranted: boolean;
  enableAutomaticNotifications: (enable: boolean) => void;
  deleteNotification: (id: string) => Promise<void>;
  isLoading: boolean;
}

// Create the context with a default value
const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

// Mock users for sender data to make it look more real
const mockUsers = [
  { id: 'user1', name: 'Emma Johnson', avatar: 'https://i.pravatar.cc/150?img=1' },
  { id: 'user2', name: 'Liam Wilson', avatar: 'https://i.pravatar.cc/150?img=2' },
  { id: 'user3', name: 'Olivia Smith', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: 'user4', name: 'Noah Davis', avatar: 'https://i.pravatar.cc/150?img=4' },
  { id: 'user5', name: 'Ava Brown', avatar: 'https://i.pravatar.cc/150?img=5' },
];

// Notification Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showMessageNotifications, setShowMessageNotifications] = 
    useState(true);
  const [showLikeNotifications, setShowLikeNotifications] = useState(false);
  const [showFriendNotifications, setShowFriendNotifications] = useState(true);
  const [showSystemNotifications, setShowSystemNotifications] = useState(false);
  const [isNotificationPermissionGranted, setIsNotificationPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Add isLoading state
  const { toast } = useToast();
  
  // Use optional chaining with useNavigate for safety
  // This ensures the hook isn't called immediately if not in Router context
  const navigate = useRef<ReturnType<typeof useNavigate> | null>(null);
  const location = useLocation();
  
  // Set the navigate ref once we're sure we're inside a Router
  try {
    navigate.current = useNavigate();
  } catch (error) {
    console.error("Router context not available for navigation");
  }
  
  const pushNotificationService = PushNotificationService.getInstance();

  // By default, we want to focus on friend-related notifications
  useEffect(() => {
    pushNotificationService.setAutomaticNotifications(true);
  }, []);

  // Calculate the number of unread notifications correctly
  const unreadCount = notifications.filter((notification) => 
    !notification.read
  ).length;

  // Check notification permission on component mount
  useEffect(() => {
    // Only check if browser supports Notification API
    if ('Notification' in window) {
      setIsNotificationPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  // Request permission for push notifications
  const requestNotificationPermission = async () => {
    const granted = await pushNotificationService.requestPermission();
    setIsNotificationPermissionGranted(granted);
    return granted;
  };

  // Function to enable or disable automatic notifications
  const enableAutomaticNotifications = (enable: boolean) => {
    pushNotificationService.setAutomaticNotifications(enable);
  };

  // Generate a random notification to make the system look real
  const generateRandomNotification = (id: string): Notification => {
    const types: Array<Notification['type']> = ['message', 'like', 'friend', 'comment', 'mention'];
    const type = types[Math.floor(Math.random() * types.length)];
    const sender = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    const minutesAgo = Math.floor(Math.random() * 60 * 24); // Random time within last 24h
    
    let message = '';
    let relatedId = `post${Math.floor(Math.random() * 100)}`;
    
    switch (type) {
      case 'message':
        message = `${sender.name} sent you a new message`;
        break;
      case 'like':
        message = `${sender.name} liked your post`;
        break;
      case 'friend':
        message = `${sender.name} sent you a friend request`;
        relatedId = sender.id;
        break;
      case 'comment':
        message = `${sender.name} commented on your post`;
        break;
      case 'mention':
        message = `${sender.name} mentioned you in a comment`;
        break;
      default:
        message = `New notification from ${sender.name}`;
    }
    
    return {
      id,
      type,
      message,
      timestamp: new Date(Date.now() - minutesAgo * 60000).toISOString(),
      read: Math.random() > 0.7, // 30% chance of being unread
      relatedId,
      sender
    };
  };

  // Function to fetch notifications (replace with your actual data fetching logic)
  const fetchNotifications = useCallback(async () => {
    // Set loading state to true when fetching starts
    setIsLoading(true);
    
    // Try to fetch from database if user is authenticated
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;
        
        if (data) {
          // Map database notifications to our format with real user data
          const formattedNotifications: Notification[] = await Promise.all(data.map(async (n) => {
            // If notification has a user ID related to it, get user info
            let sender = undefined;
            if (n.related_id && n.type === 'friend') {
              const { data: userData } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url')
                .eq('id', n.related_id)
                .single();
                
              if (userData) {
                sender = {
                  id: userData.id,
                  name: userData.display_name,
                  avatar: userData.avatar_url || undefined
                };
              }
            }
            
            return {
              id: n.id,
              type: n.type as any,
              message: n.content,
              timestamp: n.created_at,
              read: n.is_read,
              relatedId: n.related_id,
              url: n.url,
              sender
            };
          }));
          
          setNotifications(formattedNotifications);
          setIsLoading(false); // Set loading to false after data is processed
          return;
        }
      }

      // Generate mock notifications if no authenticated user or no data
      const mockNotifications: Notification[] = Array.from({ length: 8 }).map((_, i) => 
        generateRandomNotification(`mock-${i}`)
      );
      
      // Sort by date, newest first
      mockNotifications.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      setNotifications(mockNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      // Fall back to mock data in case of error
      const mockNotifications: Notification[] = Array.from({ length: 5 }).map((_, i) => 
        generateRandomNotification(`error-fallback-${i}`)
      );
      setNotifications(mockNotifications);
    } finally {
      // Ensure loading state is set to false regardless of success or failure
      setIsLoading(false);
    }
  }, []);

  // Fetch notifications on component mount
  useEffect(() => {
    fetchNotifications();

    // Set up subscription for realtime notifications
    const notificationsChannel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          // Refresh notifications when there's a change
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
    };
  }, [fetchNotifications]);

  // Process new notifications for push notification
  useEffect(() => {
    // Find unread notifications and show push notification for them
    const unreadNotifications = notifications.filter(
      notification => !notification.read && 
        (notification.type === 'friend' || 
         (notification.type === 'message' && showMessageNotifications) ||
         (notification.type === 'mention'))
    );
    
    if (unreadNotifications.length > 0) {
      // Only show the most recent unread notification as a push notification
      const latestNotification = unreadNotifications[0];
      
      // In-app toast notifications are handled by NotificationToastContainer
      // Native OS notifications are disabled - we only use in-app toasts
    }
  }, [notifications, showMessageNotifications, showFriendNotifications]);

  // Function to mark a notification as read
  const markAsRead = async (id: string) => {
    try {
      // Update in database if possible
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', id);
      }
      
      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) =>
          notification.id === id ? { ...notification, read: true } : notification
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Function to mark notifications as read by type and optionally by relatedId
  const markAsReadByType = async (type: Notification['type'], relatedId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        let query = supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', session.user.id)
          .eq('type', type)
          .eq('is_read', false);
        
        if (relatedId) {
          query = query.eq('related_id', relatedId);
        }
        
        await query;
      }
      
      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => {
          if (notification.type === type && !notification.read) {
            if (relatedId) {
              return notification.relatedId === relatedId 
                ? { ...notification, read: true } 
                : notification;
            }
            return { ...notification, read: true };
          }
          return notification;
        })
      );
    } catch (error) {
      console.error("Error marking notifications as read by type:", error);
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      // Update in database if possible
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', session.user.id)
          .eq('is_read', false);
      }
      
      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({ ...notification, read: true }))
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Function to delete a single notification - updated to properly handle database deletion
  const deleteNotification = async (id: string) => {
    try {
      // Delete from database if possible
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('id', id);
          
        if (error) {
          console.error("Database error deleting notification:", error);
          throw error;
        }
      }
      
      // Update local state
      setNotifications((prevNotifications) =>
        prevNotifications.filter((notification) => notification.id !== id)
      );
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      toast({
        title: "Error",
        description: "Failed to delete notification. Please try again.",
        variant: "destructive"
      });
      throw error; // Re-throw to allow handling in the component
    }
  };

  // Function to clear all notifications - updated to properly delete from database
  const clearAllNotifications = async () => {
    try {
      // Delete from database if possible
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user?.id) {
        const { error } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', session.user.id);
          
        if (error) {
          console.error("Database error clearing notifications:", error);
          throw error;
        }
      }
      
      // Update local state
      setNotifications([]);
    } catch (error: any) {
      console.error("Error clearing notifications:", error);
      toast({
        title: "Error",
        description: "Failed to clear notifications. Please try again.",
        variant: "destructive"
      });
      throw error; // Re-throw to allow handling in the component
    }
  };

  // Toggle message notifications
  const toggleMessageNotifications = () => {
    setShowMessageNotifications((prev) => !prev);
  };

  // Toggle like notifications
  const toggleLikeNotifications = () => {
    setShowLikeNotifications((prev) => !prev);
  };

  // Toggle friend notifications
  const toggleFriendNotifications = () => {
    setShowFriendNotifications((prev) => !prev);
  };

  // Toggle system notifications
  const toggleSystemNotifications = () => {
    setShowSystemNotifications((prev) => !prev);
  };

  // Modified version of the provider that safely handles navigation
  const safeNavigate = useCallback((path: string, options?: { replace?: boolean }) => {
    if (navigate.current) {
      navigate.current(path, options);
    } else {
      console.warn("Navigation attempted before router was initialized");
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      markAsReadByType,
      clearAllNotifications,
      showMessageNotifications,
      showLikeNotifications,
      showFriendNotifications,
      showSystemNotifications,
      toggleMessageNotifications,
      toggleLikeNotifications,
      toggleFriendNotifications,
      toggleSystemNotifications,
      requestNotificationPermission,
      isNotificationPermissionGranted,
      enableAutomaticNotifications,
      deleteNotification,
      isLoading
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Custom hook to use the notification context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      'useNotification must be used within a NotificationProvider'
    );
  }
  return context;
};
