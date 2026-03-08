import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Heart, MessageSquare, UserPlus, AtSign, Megaphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationPreferences, NotificationPreferences as NotifPrefs } from '@/hooks/use-notification-preferences';
import { useIsMobile } from '@/hooks/use-mobile';

export function NotificationPreferences() {
  const { preferences, savePreferences, isLoading } = useNotificationPreferences();
  const { toast } = useToast();
  const [localPrefs, setLocalPrefs] = useState<NotifPrefs>(preferences);
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();

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
    <div className="space-y-6 p-4 sm:p-6">
      {/* Mobile-only: Enable/Disable notifications entirely */}
      {isMobile && (
        <>
          <div>
            <h3 className="text-lg font-semibold mb-2">Notifications</h3>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Bell className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label htmlFor="enableNotifications" className="text-sm font-medium">Enable Notifications</Label>
                  <p className="text-xs text-muted-foreground">Turn on/off all notifications on mobile</p>
                </div>
              </div>
              <Switch
                id="enableNotifications"
                checked={localPrefs.mobileEnabled !== false}
                onCheckedChange={(checked) => updatePreference('mobileEnabled', checked)}
              />
            </div>
          </div>
          <Separator />
        </>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-2">Notification Types</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Choose which notifications you want to receive
        </p>
        
        <div className="space-y-3">
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

      <div className="flex justify-end pt-2">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}
