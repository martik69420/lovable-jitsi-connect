
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, TestTube2, MessageCircle, UserPlus, Heart, Gamepad2 } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

export const NotificationSettings = () => {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const { showTestNotification } = useNotification();
  const [isSaving, setIsSaving] = useState(false);
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: user?.settings?.emailNotifications ?? true,
    pushNotifications: user?.settings?.pushNotifications ?? true,
    friendRequests: true,
    messages: true,
    mentions: true,
    comments: true
  });

  const handleToggleChange = (key: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };

  const saveNotificationSettings = async () => {
    setIsSaving(true);
    try {
      const success = await updateUserProfile({
        settings: {
          ...user?.settings,
          ...notificationSettings
        }
      });

      if (success) {
        toast({
          title: "Notification settings updated",
          description: "Your notification preferences have been saved."
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update notification settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Notifications</h2>
        <p className="text-muted-foreground">Manage how you receive notifications</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Notification Settings</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Notifications Section */}
          <div>
            <h3 className="text-base font-medium mb-4">Test Notifications</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Click a button below to see how notifications will appear
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => showTestNotification('message')}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showTestNotification('friend')}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Friend Request
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showTestNotification('like')}
                className="gap-2"
              >
                <Heart className="h-4 w-4" />
                Like
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => showTestNotification('game')}
                className="gap-2"
              >
                <Gamepad2 className="h-4 w-4" />
                Game Invite
              </Button>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium mb-4">General</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications" className="text-base cursor-pointer">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={() => handleToggleChange('emailNotifications')}
                />
              </div>

              <div className="flex items-center justify-between border rounded-lg p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="pushNotifications" className="text-base cursor-pointer">
                    Push Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">Receive push notifications</p>
                </div>
                <Switch
                  id="pushNotifications"
                  checked={notificationSettings.pushNotifications}
                  onCheckedChange={() => handleToggleChange('pushNotifications')}
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium mb-4">Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between border rounded-lg p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="friendRequests" className="text-base cursor-pointer">
                    Friend Requests
                  </Label>
                  <p className="text-sm text-muted-foreground">Notify when someone sends a friend request</p>
                </div>
                <Switch
                  id="friendRequests"
                  checked={notificationSettings.friendRequests}
                  onCheckedChange={() => handleToggleChange('friendRequests')}
                />
              </div>

              <div className="flex items-center justify-between border rounded-lg p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="messages" className="text-base cursor-pointer">
                    Messages
                  </Label>
                  <p className="text-sm text-muted-foreground">Notify when you receive a message</p>
                </div>
                <Switch
                  id="messages"
                  checked={notificationSettings.messages}
                  onCheckedChange={() => handleToggleChange('messages')}
                />
              </div>

              <div className="flex items-center justify-between border rounded-lg p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="mentions" className="text-base cursor-pointer">
                    Mentions
                  </Label>
                  <p className="text-sm text-muted-foreground">Notify when someone mentions you</p>
                </div>
                <Switch
                  id="mentions"
                  checked={notificationSettings.mentions}
                  onCheckedChange={() => handleToggleChange('mentions')}
                />
              </div>

              <div className="flex items-center justify-between border rounded-lg p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="comments" className="text-base cursor-pointer">
                    Comments
                  </Label>
                  <p className="text-sm text-muted-foreground">Notify when someone comments on your post</p>
                </div>
                <Switch
                  id="comments"
                  checked={notificationSettings.comments}
                  onCheckedChange={() => handleToggleChange('comments')}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={saveNotificationSettings} 
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Notification Settings"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
