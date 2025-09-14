
interface Window {
  adsbygoogle: any[];
}

// Extend the NotificationOptions interface to include missing properties
interface NotificationOptions {
  vibrate?: number[];
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  badge?: string;
  timestamp?: number;
  data?: any;
  tag?: string;
  silent?: boolean;
}

// Add the NotificationAction type
interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}
