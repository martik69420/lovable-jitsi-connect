import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Heart, MessageSquare, UserPlus, AtSign, Megaphone, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

interface NotificationPreference {
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

export function NotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreference>({
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
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = () => {
    try {
      const saved = localStorage.getItem('notificationPreferences');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const savePreferences = () => {
    setIsSaving(true);
    try {
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));

      toast({
        title: 'Success',
        description: 'Notification preferences saved',
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreference, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Notification Types</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose which notifications you want to receive
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <Label htmlFor="likes" className="text-sm font-medium">Likes</Label>
                <p className="text-xs text-muted-foreground">When someone likes your posts</p>
              </div>
            </div>
            <Switch
              id="likes"
              checked={preferences.likes}
              onCheckedChange={(checked) => updatePreference('likes', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <Label htmlFor="comments" className="text-sm font-medium">Comments</Label>
                <p className="text-xs text-muted-foreground">When someone comments on your posts</p>
              </div>
            </div>
            <Switch
              id="comments"
              checked={preferences.comments}
              onCheckedChange={(checked) => updatePreference('comments', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-green-500" />
              <div>
                <Label htmlFor="friends" className="text-sm font-medium">Friend Requests</Label>
                <p className="text-xs text-muted-foreground">When someone sends you a friend request</p>
              </div>
            </div>
            <Switch
              id="friends"
              checked={preferences.friends}
              onCheckedChange={(checked) => updatePreference('friends', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AtSign className="h-5 w-5 text-purple-500" />
              <div>
                <Label htmlFor="mentions" className="text-sm font-medium">Mentions</Label>
                <p className="text-xs text-muted-foreground">When someone mentions you</p>
              </div>
            </div>
            <Switch
              id="mentions"
              checked={preferences.mentions}
              onCheckedChange={(checked) => updatePreference('mentions', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <div>
                <Label htmlFor="messages" className="text-sm font-medium">Messages</Label>
                <p className="text-xs text-muted-foreground">When you receive new messages</p>
              </div>
            </div>
            <Switch
              id="messages"
              checked={preferences.messages}
              onCheckedChange={(checked) => updatePreference('messages', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Megaphone className="h-5 w-5 text-orange-500" />
              <div>
                <Label htmlFor="system" className="text-sm font-medium">System</Label>
                <p className="text-xs text-muted-foreground">Important updates and announcements</p>
              </div>
            </div>
            <Switch
              id="system"
              checked={preferences.system}
              onCheckedChange={(checked) => updatePreference('system', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Sound & Quiet Hours</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5" />
              <div>
                <Label htmlFor="sound" className="text-sm font-medium">Notification Sound</Label>
                <p className="text-xs text-muted-foreground">Play sound for new notifications</p>
              </div>
            </div>
            <Switch
              id="sound"
              checked={preferences.soundEnabled}
              onCheckedChange={(checked) => updatePreference('soundEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5" />
              <div>
                <Label htmlFor="quietHours" className="text-sm font-medium">Quiet Hours</Label>
                <p className="text-xs text-muted-foreground">Mute notifications during specific hours</p>
              </div>
            </div>
            <Switch
              id="quietHours"
              checked={preferences.quietHoursEnabled}
              onCheckedChange={(checked) => updatePreference('quietHoursEnabled', checked)}
            />
          </div>

          {preferences.quietHoursEnabled && (
            <div className="ml-8 space-y-3 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="quietStart" className="text-xs text-muted-foreground">Start Time</Label>
                  <input
                    id="quietStart"
                    type="time"
                    value={preferences.quietHoursStart}
                    onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border rounded-md text-sm"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="quietEnd" className="text-xs text-muted-foreground">End Time</Label>
                  <input
                    id="quietEnd"
                    type="time"
                    value={preferences.quietHoursEnd}
                    onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border rounded-md text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={savePreferences} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
