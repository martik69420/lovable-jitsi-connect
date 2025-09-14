
import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNotification } from '@/context/NotificationContext';
import { useToast } from '@/hooks/use-toast';

const NotificationPermissionBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const { requestNotificationPermission, isNotificationPermissionGranted } = useNotification();
  const { toast } = useToast();
  
  // Check if we should show the banner
  useEffect(() => {
    // Only show if notifications are supported and not already granted
    const shouldShow = 
      'Notification' in window && 
      Notification.permission !== 'granted' && 
      Notification.permission !== 'denied' && 
      !localStorage.getItem('notificationBannerDismissed');
      
    setShowBanner(shouldShow);
  }, [isNotificationPermissionGranted]);
  
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    
    if (granted) {
      toast({
        title: "Notifications enabled",
        description: "You'll receive push notifications for important updates",
      });
      setShowBanner(false);
    } else {
      toast({
        title: "Notifications disabled",
        description: "You can enable them later in your browser settings",
      });
    }
  };
  
  const handleDismiss = () => {
    localStorage.setItem('notificationBannerDismissed', 'true');
    setShowBanner(false);
  };
  
  if (!showBanner) {
    return null;
  }
  
  return (
    <div className="relative bg-primary/10 p-4 rounded-lg mb-4 flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="bg-primary/20 p-2 rounded-full">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="font-medium">Enable notifications</p>
          <p className="text-sm text-muted-foreground">
            Get notified about new messages, likes, and other important updates
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button size="sm" onClick={handleRequestPermission}>
          Enable
        </Button>
        <Button size="sm" variant="ghost" onClick={handleDismiss}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default NotificationPermissionBanner;
