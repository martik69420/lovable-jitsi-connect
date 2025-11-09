
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, MessageSquare, Heart, Check, UserPlus, User, Megaphone, Trash2, AtSign, X, Loader2, Settings as SettingsIcon } from 'lucide-react';
import { SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useNotification } from '@/context/NotificationContext';
import { useLanguage } from '@/context/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NotificationPreferences } from './NotificationPreferences';
import { cn } from "@/lib/utils";

interface NotificationMenuProps {
  onClose?: () => void;
}

// Sound utility
const playNotificationSound = () => {
  try {
    const preferences = localStorage.getItem('notificationPreferences');
    const soundEnabled = preferences ? JSON.parse(preferences).soundEnabled : true;
    
    if (!soundEnabled) return;

    // Create a simple beep using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

const NotificationMenu = ({ onClose }: NotificationMenuProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deletingIds, setDeletingIds] = React.useState<string[]>([]);
  const [showPreferences, setShowPreferences] = React.useState(false);
  const [activeFilter, setActiveFilter] = React.useState<string>('all');
  const [newNotificationIds, setNewNotificationIds] = React.useState<string[]>([]);
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAllNotifications,
    deleteNotification,
    fetchNotifications, 
    requestNotificationPermission,
    isNotificationPermissionGranted
  } = useNotification();
  
  const notificationTexts = {
    all: "All",
    empty: "No notifications",
    enable: "Enable",
    yesterday: "Yesterday",
    older: "Older",
    emptyDesc: "You don't have any notifications yet",
  };
  
  // Track previous notification count for detecting new notifications
  const prevNotificationCountRef = React.useRef(notifications.length);
  
  // Refresh notifications when menu opens
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Detect new notifications and play sound + animation
  useEffect(() => {
    if (notifications.length > prevNotificationCountRef.current) {
      const newIds = notifications
        .slice(0, notifications.length - prevNotificationCountRef.current)
        .map(n => n.id);
      
      setNewNotificationIds(newIds);
      playNotificationSound();
      
      // Remove animation after 3 seconds
      setTimeout(() => {
        setNewNotificationIds([]);
      }, 3000);
    }
    prevNotificationCountRef.current = notifications.length;
  }, [notifications.length]);
  
  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type and url
    if (notification.url) {
      navigate(notification.url);
      if (onClose) onClose();
    } else if (notification.relatedId && notification.type === 'like') {
      navigate(`/posts/${notification.relatedId}`);
      if (onClose) onClose();
    } else if (notification.relatedId && notification.type === 'comment') {
      navigate(`/posts/${notification.relatedId}`);
      if (onClose) onClose();
    } else if (notification.relatedId && notification.type === 'friend') {
      navigate(`/profile/${notification.relatedId}`);
      if (onClose) onClose();
    } else if (notification.type === 'message') {
      navigate('/messages');
      if (onClose) onClose();
    } else if (notification.type === 'mention' && notification.relatedId) {
      navigate(`/posts/${notification.relatedId}`);
      if (onClose) onClose();
    }
  };
  
  const handleNotificationPermission = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      toast({
        title: "Notifications enabled",
        description: "You will now receive push notifications",
      });
    } else {
      toast({
        title: "Notification permission denied",
        description: "Enable notifications in your browser settings to receive alerts",
        variant: "destructive"
      });
    }
  };

  const handleClearAllNotifications = () => {
    setIsAlertOpen(true);
  };

  const confirmClearAllNotifications = async () => {
    setIsDeleting(true);
    try {
      await clearAllNotifications();
      toast({
        title: "Success",
        description: "All notifications cleared",
      });
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast({
        title: "Error",
        description: "Failed to clear notifications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setIsAlertOpen(false);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingIds(prev => [...prev, id]);
    
    try {
      await deleteNotification(id);
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    } finally {
      setDeletingIds(prev => prev.filter(itemId => itemId !== id));
    }
  };
  
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'friend':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'mention':
        return <AtSign className="h-4 w-4 text-purple-500" />;
      case 'message':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'system':
        return <Megaphone className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };
  
  // Group notifications by time
  const groupNotifications = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const groups = {
      today: [] as any[],
      yesterday: [] as any[],
      older: [] as any[]
    };
    
    notifications.forEach(notification => {
      const notifDate = new Date(notification.timestamp);
      if (notifDate >= today) {
        groups.today.push(notification);
      } else if (notifDate >= yesterday && notifDate < today) {
        groups.yesterday.push(notification);
      } else {
        groups.older.push(notification);
      }
    });
    
    return groups;
  };
  
  const renderNotificationItem = (notification: any) => {
    const isNew = newNotificationIds.includes(notification.id);
    
    return (
      <div
        key={notification.id}
        className={cn(
          "flex items-start p-3 cursor-pointer group rounded-lg hover:bg-muted/50 transition-all duration-300", 
          !notification.read ? 'bg-muted/60' : '',
          isNew && 'animate-fade-in scale-in border-2 border-primary/50'
        )}
        onClick={() => handleNotificationClick(notification)}
      >
        <div className="flex gap-3 w-full">
          {notification.sender?.avatar ? (
            <Avatar className={cn("h-10 w-10 border", isNew && "ring-2 ring-primary animate-pulse")}>
              <AvatarImage src={notification.sender.avatar} alt={notification.sender.name || ''} />
              <AvatarFallback className="bg-primary/10">
                {notification.sender.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className={cn("rounded-full bg-muted p-2 h-10 w-10 flex items-center justify-center", isNew && "animate-pulse")}>
              {getNotificationIcon(notification.type)}
            </div>
          )}
          
          <div className="flex-1 space-y-1 min-w-0">
            <p className="text-sm leading-tight font-medium line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {!notification.read && (
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => handleDeleteNotification(e, notification.id)}
              disabled={deletingIds.includes(notification.id)}
            >
              {deletingIds.includes(notification.id) ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
              <span className="sr-only">Delete notification</span>
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Filter notifications based on active tab
  const filteredNotifications = () => {
    switch (activeFilter) {
      case 'likes':
        return notifications.filter(n => n.type === 'like');
      case 'comments':
        return notifications.filter(n => n.type === 'comment');
      case 'friends':
        return notifications.filter(n => n.type === 'friend');
      case 'mentions':
        return notifications.filter(n => n.type === 'mention');
      default:
        return notifications;
    }
  };

  const notificationGroups = groupNotifications();
  const displayedNotifications = activeFilter === 'all' ? notificationGroups : {
    today: filteredNotifications().filter(n => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return new Date(n.timestamp) >= today;
    }),
    yesterday: filteredNotifications().filter(n => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const notifDate = new Date(n.timestamp);
      return notifDate >= yesterday && notifDate < today;
    }),
    older: filteredNotifications().filter(n => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      return new Date(n.timestamp) < yesterday;
    })
  };

  // Show preferences view
  if (showPreferences) {
    return (
      <>
        <SheetContent side="left" className="w-[400px] sm:w-[450px] p-0">
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreferences(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
              <SheetTitle className="text-xl font-bold">Notification Settings</SheetTitle>
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-80px)]">
            <NotificationPreferences />
          </ScrollArea>
        </SheetContent>
      </>
    );
  }
  
  return (
    <>
      <SheetContent side="left" className="w-[400px] sm:w-[450px] p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">Notifications</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPreferences(true)}
              className="h-8 w-8"
            >
              <SettingsIcon className="h-4 w-4" />
            </Button>
          </div>
        </SheetHeader>

        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="flex-1">
          <div className="px-4 py-3 border-b">
            <TabsList className="w-full grid grid-cols-5 h-auto">
              <TabsTrigger value="all" className="text-xs py-2">
                {notificationTexts.all}
              </TabsTrigger>
              <TabsTrigger value="likes" className="text-xs py-2">
                <Heart className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="comments" className="text-xs py-2">
                <MessageSquare className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="friends" className="text-xs py-2">
                <UserPlus className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="mentions" className="text-xs py-2">
                <AtSign className="h-3 w-3" />
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-6 py-3 border-b flex gap-2">
            {!isNotificationPermissionGranted && 'Notification' in window && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNotificationPermission} 
                className="h-8 text-xs"
              >
                <Bell className="h-3 w-3 mr-1" />
                {notificationTexts.enable}
              </Button>
            )}
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="h-8 text-xs">
                <Check className="h-3 w-3 mr-1" />
                Mark Read
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAllNotifications} 
              className={cn(
                "h-8 text-xs",
                notifications.length === 0 ? "opacity-50 cursor-not-allowed" : ""
              )}
              disabled={isDeleting || notifications.length === 0}
            >
              {isDeleting ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-3 w-3 mr-1" />
              )}
              Clear
            </Button>
          </div>
          
          <ScrollArea className="h-[calc(100vh-240px)]">
            {filteredNotifications().length > 0 ? (
              <div className="px-4 py-2">
                {displayedNotifications.today.length > 0 && (
                  <div className="mb-4">
                    <div className="px-2 py-2 text-xs font-semibold text-foreground">
                      Earlier
                    </div>
                    <div className="space-y-1">
                      {displayedNotifications.today.map(renderNotificationItem)}
                    </div>
                  </div>
                )}
                
                {displayedNotifications.yesterday.length > 0 && (
                  <div className="mb-4">
                    <div className="px-2 py-2 text-xs font-semibold text-foreground">
                      {notificationTexts.yesterday}
                    </div>
                    <div className="space-y-1">
                      {displayedNotifications.yesterday.map(renderNotificationItem)}
                    </div>
                  </div>
                )}
                
                {displayedNotifications.older.length > 0 && (
                  <div className="mb-4">
                    <div className="px-2 py-2 text-xs font-semibold text-foreground">
                      {notificationTexts.older}
                    </div>
                    <div className="space-y-1">
                      {displayedNotifications.older.map(renderNotificationItem)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-6 py-16 text-center">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground opacity-25 mb-4" />
                <p className="text-sm font-medium">{notificationTexts.empty}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {notificationTexts.emptyDesc}
                </p>
              </div>
            )}
          </ScrollArea>
        </Tabs>
      </SheetContent>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete all your notifications from the database. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmClearAllNotifications}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                'Clear All'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default NotificationMenu;
