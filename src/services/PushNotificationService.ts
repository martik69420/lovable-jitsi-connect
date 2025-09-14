
import type { Notification as AppNotification } from '@/context/NotificationContext';

class PushNotificationService {
  private static instance: PushNotificationService;
  private isPermissionGranted = false;
  private sendAutomaticNotifications = false; 
  private lastNotificationTime: Record<string, number> = {};
  private notificationCooldown = 60000; // 1 minute cooldown between similar notifications (except messages)

  private constructor() {
    this.checkPermission();
  }

  public static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  /**
   * Request permission to show notifications
   */
  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support desktop notification');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.isPermissionGranted = permission === 'granted';
      
      // If permission granted and service worker supported, register it
      if (this.isPermissionGranted && 'serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          console.log('Service Worker registered with scope:', registration.scope);
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      }
      
      return this.isPermissionGranted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Check if notification permission is already granted
   */
  private checkPermission(): void {
    if (!('Notification' in window)) {
      return;
    }
    
    this.isPermissionGranted = Notification.permission === 'granted';
    
    // Register service worker if permission is already granted
    if (this.isPermissionGranted && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js')
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    }
  }

  /**
   * Enable or disable automatic notifications
   */
  public setAutomaticNotifications(enable: boolean): void {
    this.sendAutomaticNotifications = enable;
  }

  /**
   * Play notification sound based on type
   */
  private playNotificationSound(type: string): void {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Configure sound based on notification type
      switch(type) {
        case 'friend':
          oscillator.type = 'triangle';
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          break;
          
        case 'mention':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(900, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(700, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          break;
          
        case 'message':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(750, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
          break;
          
        default:
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(500, audioContext.currentTime + 0.2);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      }
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Play sound
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * Show a native push notification
   */
  public showNotification(title: string, options?: NotificationOptions): void {
    if (!this.isPermissionGranted) {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      // Play notification sound based on type
      if (options?.data?.type) {
        this.playNotificationSound(options.data.type as string);
      }

      // Try to use service worker for notification if available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            // TypeScript now recognizes these properties with our extended interface
            vibrate: [200, 100, 200],
            ...options
          });
        });
      } else {
        // Fallback to standard notification
        const notification = new window.Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options
        });

        notification.onclick = () => {
          window.focus();
          notification.close();
          if (options?.data?.url) {
            window.location.href = options.data.url;
          }
        };
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Process and display an app notification as a push notification
   */
  public processNotification(notification: AppNotification): void {
    if (!this.isPermissionGranted || !this.sendAutomaticNotifications) {
      return;
    }
    
    // Check cooldown for this notification type (skip cooldown for messages)
    if (notification.type !== 'message') {
      const now = Date.now();
      const lastShown = this.lastNotificationTime[notification.type] || 0;
      if (now - lastShown < this.notificationCooldown) {
        return;
      }
      
      // Update last notification time
      this.lastNotificationTime[notification.type] = now;
    }

    const icon = notification.sender?.avatar || '/favicon.ico';
    const title = this.getNotificationTitle(notification);
    const body = notification.message;
    
    // Enhanced notification options
    const notificationOptions: NotificationOptions = {
      body,
      icon,
      tag: `${notification.type}-${notification.id}-${Date.now()}`, // Unique tag for each notification
      requireInteraction: notification.type === 'mention' || notification.type === 'friend' || notification.type === 'message', // Keep important notifications visible
      vibrate: [200, 100, 200], // Vibration pattern for mobile devices
      badge: '/favicon.ico',
      timestamp: Date.now(),
      actions: this.getNotificationActions(notification),
      data: {
        id: notification.id,
        type: notification.type,
        url: notification.url || this.getNotificationUrl(notification),
        relatedId: notification.relatedId,
        timestamp: notification.timestamp
      }
    };
    
    this.showNotification(title, notificationOptions);
  }

  /**
   * Get appropriate notification title based on type
   */
  private getNotificationTitle(notification: AppNotification): string {
    const senderName = notification.sender?.name || 'Campus Connect';
    
    switch (notification.type) {
      case 'like':
        return `${senderName} liked your post`;
      case 'comment':
        return `${senderName} commented on your post`;
      case 'friend':
        return `${senderName} sent you a friend request`;
      case 'message':
        return `New message from ${senderName}`;
      case 'mention':
        return `${senderName} mentioned you`;
      case 'system':
        return 'System Notification';
      case 'coin':
        return 'Coins Awarded! 🪙';
      default:
        return 'New notification';
    }
  }

  /**
   * Get URL based on notification type
   */
  private getNotificationUrl(notification: AppNotification): string {
    switch (notification.type) {
      case 'like':
      case 'comment':
        return notification.relatedId ? `/posts/${notification.relatedId}` : '/';
      case 'friend':
        return notification.sender?.id ? `/profile/${notification.sender.id}` : '/friends';
      case 'message':
        return '/messages';
      case 'mention':
        return notification.relatedId ? `/posts/${notification.relatedId}` : '/';
      case 'coin':
        return '/earn';
      default:
        return '/notifications';
    }
  }

  /**
   * Get action buttons for notifications based on type
   */
  private getNotificationActions(notification: AppNotification): NotificationAction[] {
    switch (notification.type) {
      case 'friend':
        return [
          {
            action: 'accept',
            title: 'Accept'
          },
          {
            action: 'decline',
            title: 'Decline'
          }
        ];
      case 'message':
        return [
          {
            action: 'reply',
            title: 'Reply'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ];
      default:
        return [];
    }
  }
}

export default PushNotificationService;
