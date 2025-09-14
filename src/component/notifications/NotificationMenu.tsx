
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, MessageSquare, Heart, Check, UserPlus, User, Megaphone, Trash2, AtSign, X, Loader2 } from 'lucide-react';
import {
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { cn } from "@/lib/utils";

interface NotificationMenuProps {
  onClose?: () => void;
}

const NotificationMenu = ({ onClose }: NotificationMenuProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAlertOpen, setIsAlertOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deletingIds, setDeletingIds] = React.useState<string[]>([]);
  
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
  
  // Define fallback texts for missing translation keys
  const notificationTexts = {
    all: "All Notifications",
    unread: "New",
    empty: "No notifications",
    markAllRead: "Mark all as read",
    clearAll: "Clear all",
    enable: "Enable",
    viewAll: "View all notifications",
    today: "Today", 
    yesterday: "Yesterday",
    older: "Older",
    emptyDesc: "You don't have any notifications yet"
  };
  
  // Refresh notifications when menu opens
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);
  
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
    e.stopPropagation(); // Prevent notification click event
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
  
  // Group notifications by time (Today, Yesterday, Older)
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
  
  const notificationGroups = groupNotifications();
  
  const renderNotificationItem = (notification: any) => (
    <DropdownMenuItem
      key={notification.id}
      className={cn(
        "flex items-start p-3 cursor-pointer group", 
        !notification.read ? 'bg-muted/60' : ''
      )}
      onClick={() => handleNotificationClick(notification)}
    >
      <div className="flex gap-3 w-full">
        {notification.sender?.avatar ? (
          <Avatar className="h-9 w-9 border">
            <AvatarImage src={notification.sender.avatar} alt={notification.sender.name || ''} />
            <AvatarFallback className="bg-primary/10">
              {notification.sender.name?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className="rounded-full bg-muted p-2 h-9 w-9 flex items-center justify-center">
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
        
        <div className="flex items-center">
          {!notification.read && (
            <div className="mr-2">
              <span className="ml-auto bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-medium">
                {notifications.filter(n => !n.read).length}
              </span>
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
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
    </DropdownMenuItem>
  );
  
  return (
    <>
      <DropdownMenuContent align="end" className="w-[320px] sm:w-[350px]">
        <DropdownMenuLabel className="flex justify-between items-center p-4 border-b">
          <span className="text-lg font-semibold">{notificationTexts.all}</span>
          <div className="flex space-x-2">
            {!isNotificationPermissionGranted && 'Notification' in window && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleNotificationPermission} 
                className="h-8 px-2 text-xs"
                title="Enable push notifications"
              >
                <Bell className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{notificationTexts.enable}</span>
              </Button>
            )}
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllAsRead} className="h-8 px-2 text-xs">
                <Check className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">{notificationTexts.markAllRead}</span>
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleClearAllNotifications} 
              className={cn(
                "h-8 px-2 text-xs",
                notifications.length === 0 ? "opacity-50 cursor-not-allowed" : ""
              )}
              disabled={isDeleting || notifications.length === 0}
            >
              {isDeleting ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Trash2 className="h-3 w-3 mr-1" />
              )}
              <span className="hidden sm:inline">{notificationTexts.clearAll}</span>
            </Button>
          </div>
        </DropdownMenuLabel>
        
        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            <DropdownMenuGroup>
              {notificationGroups.today.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                    {notificationTexts.today}
                  </div>
                  {notificationGroups.today.map(renderNotificationItem)}
                </>
              )}
              
              {notificationGroups.yesterday.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                    {notificationTexts.yesterday}
                  </div>
                  {notificationGroups.yesterday.map(renderNotificationItem)}
                </>
              )}
              
              {notificationGroups.older.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/30">
                    {notificationTexts.older}
                  </div>
                  {notificationGroups.older.map(renderNotificationItem)}
                </>
              )}
            </DropdownMenuGroup>
          ) : (
            <div className="px-4 py-10 text-center">
              <Bell className="mx-auto h-10 w-10 text-muted-foreground opacity-25 mb-3" />
              <p className="text-sm font-medium">{notificationTexts.empty}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {notificationTexts.emptyDesc}
              </p>
            </div>
          )}
        </ScrollArea>
        
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          className="py-2 justify-center font-medium text-primary text-center"
          onClick={() => {
            navigate('/notifications');
            if (onClose) onClose();
          }}
        >
          {notificationTexts.viewAll}
        </DropdownMenuItem>
      </DropdownMenuContent>

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
              className="bg-red-600 hover:bg-red-700"
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
