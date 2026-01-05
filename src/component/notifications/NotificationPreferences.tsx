import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Heart, MessageSquare, UserPlus, AtSign, Megaphone, Clock, Volume2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationPreferences, NotificationPreferences as NotifPrefs } from '@/hooks/use-notification-preferences';

export function NotificationPreferences() {
  const { preferences, savePreferences, isLoading } = useNotificationPreferences();
  const { toast } = useToast();
  const [localPrefs, setLocalPrefs] = useState<NotifPrefs>(preferences);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await savePreferences(localPrefs);
      toast({
        title: 'Success',
        description: 'Notification preferences saved',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save preferences',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updatePreference = (key: keyof NotifPrefs, value: boolean | string) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Notification Types</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose which notifications you want to receive
        </p>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500/10">
                <Heart className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <Label htmlFor="likes" className="text-sm font-medium">Likes</Label>
                <p className="text-xs text-muted-foreground">When someone likes your posts</p>
              </div>
            </div>
            <Switch
              id="likes"
              checked={localPrefs.likes}
              onCheckedChange={(checked) => updatePreference('likes', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <Label htmlFor="comments" className="text-sm font-medium">Comments</Label>
                <p className="text-xs text-muted-foreground">When someone comments on your posts</p>
              </div>
            </div>
            <Switch
              id="comments"
              checked={localPrefs.comments}
              onCheckedChange={(checked) => updatePreference('comments', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <UserPlus className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <Label htmlFor="friends" className="text-sm font-medium">Friend Requests</Label>
                <p className="text-xs text-muted-foreground">When someone sends you a friend request</p>
              </div>
            </div>
            <Switch
              id="friends"
              checked={localPrefs.friends}
              onCheckedChange={(checked) => updatePreference('friends', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-purple-500/10">
                <AtSign className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <Label htmlFor="mentions" className="text-sm font-medium">Mentions</Label>
                <p className="text-xs text-muted-foreground">When someone mentions you</p>
              </div>
            </div>
            <Switch
              id="mentions"
              checked={localPrefs.mentions}
              onCheckedChange={(checked) => updatePreference('mentions', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-blue-500/10">
                <MessageSquare className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <Label htmlFor="messages" className="text-sm font-medium">Messages</Label>
                <p className="text-xs text-muted-foreground">When you receive new messages</p>
              </div>
            </div>
            <Switch
              id="messages"
              checked={localPrefs.messages}
              onCheckedChange={(checked) => updatePreference('messages', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-orange-500/10">
                <Megaphone className="h-4 w-4 text-orange-500" />
              </div>
              <div>
                <Label htmlFor="system" className="text-sm font-medium">System</Label>
                <p className="text-xs text-muted-foreground">Important updates and announcements</p>
              </div>
            </div>
            <Switch
              id="system"
              checked={localPrefs.system}
              onCheckedChange={(checked) => updatePreference('system', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-4">Sound & Quiet Hours</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Volume2 className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="sound" className="text-sm font-medium">Notification Sound</Label>
                <p className="text-xs text-muted-foreground">Play sound for new notifications</p>
              </div>
            </div>
            <Switch
              id="sound"
              checked={localPrefs.soundEnabled}
              onCheckedChange={(checked) => updatePreference('soundEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-muted">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <Label htmlFor="quietHours" className="text-sm font-medium">Quiet Hours</Label>
                <p className="text-xs text-muted-foreground">Mute all notifications during these hours</p>
              </div>
            </div>
            <Switch
              id="quietHours"
              checked={localPrefs.quietHoursEnabled}
              onCheckedChange={(checked) => updatePreference('quietHoursEnabled', checked)}
            />
          </div>

          {localPrefs.quietHoursEnabled && (
            <div className="ml-4 p-4 bg-muted/50 rounded-lg border space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label htmlFor="quietStart" className="text-xs text-muted-foreground">Start Time</Label>
                  <input
                    id="quietStart"
                    type="time"
                    value={localPrefs.quietHoursStart}
                    onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border rounded-md text-sm"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="quietEnd" className="text-xs text-muted-foreground">End Time</Label>
                  <input
                    id="quietEnd"
                    type="time"
                    value={localPrefs.quietHoursEnd}
                    onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                    className="w-full mt-1 px-3 py-2 bg-background border rounded-md text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                No notifications will be shown during quiet hours
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
