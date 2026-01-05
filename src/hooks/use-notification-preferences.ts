import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

export interface NotificationPreferences {
  likes: boolean;
  comments: boolean;
  friends: boolean;
  mentions: boolean;
  messages: boolean;
  system: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  soundEnabled: boolean;
}

const defaultPreferences: NotificationPreferences = {
  likes: true,
  comments: true,
  friends: true,
  mentions: true,
  messages: true,
  system: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  soundEnabled: true,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage and DB
  const loadPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      // First load from localStorage for immediate use
      const saved = localStorage.getItem('notificationPreferences');
      if (saved) {
        setPreferences({ ...defaultPreferences, ...JSON.parse(saved) });
      }

      // Then load from DB if user is logged in
      if (user?.id) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (data && !error) {
          const dbPrefs: NotificationPreferences = {
            likes: data.notif_post_likes ?? true,
            comments: data.notif_comment_replies ?? true,
            friends: data.notif_friend_requests ?? true,
            mentions: data.notif_mentions ?? true,
            messages: data.notif_messages ?? true,
            system: data.notif_announcements ?? true,
            quietHoursEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
            soundEnabled: true,
          };
          
          // Merge with localStorage preferences for quiet hours and sound
          const localSaved = localStorage.getItem('notificationPreferences');
          if (localSaved) {
            const localPrefs = JSON.parse(localSaved);
            dbPrefs.quietHoursEnabled = localPrefs.quietHoursEnabled ?? false;
            dbPrefs.quietHoursStart = localPrefs.quietHoursStart ?? '22:00';
            dbPrefs.quietHoursEnd = localPrefs.quietHoursEnd ?? '08:00';
            dbPrefs.soundEnabled = localPrefs.soundEnabled ?? true;
          }
          
          setPreferences(dbPrefs);
          localStorage.setItem('notificationPreferences', JSON.stringify(dbPrefs));
        }
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Save preferences to localStorage and DB
  const savePreferences = async (newPrefs: NotificationPreferences) => {
    localStorage.setItem('notificationPreferences', JSON.stringify(newPrefs));
    setPreferences(newPrefs);

    if (user?.id) {
      try {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            notif_post_likes: newPrefs.likes,
            notif_comment_replies: newPrefs.comments,
            notif_friend_requests: newPrefs.friends,
            notif_mentions: newPrefs.mentions,
            notif_messages: newPrefs.messages,
            notif_announcements: newPrefs.system,
          }, { onConflict: 'user_id' });
      } catch (error) {
        console.error('Error saving preferences to DB:', error);
      }
    }
  };

  // Check if we're in quiet hours
  const isInQuietHours = useCallback(() => {
    if (!preferences.quietHoursEnabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime < endTime;
    }
    
    return currentTime >= startTime && currentTime < endTime;
  }, [preferences.quietHoursEnabled, preferences.quietHoursStart, preferences.quietHoursEnd]);

  // Check if a notification type is enabled
  const isNotificationEnabled = useCallback((type: string) => {
    if (isInQuietHours()) return false;

    switch (type) {
      case 'like': return preferences.likes;
      case 'comment': return preferences.comments;
      case 'friend': return preferences.friends;
      case 'mention': return preferences.mentions;
      case 'message': return preferences.messages;
      case 'system': return preferences.system;
      default: return true;
    }
  }, [preferences, isInQuietHours]);

  // Check if sound is enabled
  const isSoundEnabled = useCallback(() => {
    if (isInQuietHours()) return false;
    return preferences.soundEnabled;
  }, [preferences.soundEnabled, isInQuietHours]);

  return {
    preferences,
    savePreferences,
    isLoading,
    isInQuietHours,
    isNotificationEnabled,
    isSoundEnabled,
    loadPreferences,
  };
}
