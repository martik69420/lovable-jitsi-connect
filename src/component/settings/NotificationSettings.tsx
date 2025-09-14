
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';

export const NotificationSettings = () => {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: user?.settings?.emailNotifications ?? true,
    pushNotifications: user?.settings?.pushNotifications ?? true,
    friendRequests: true,
    messages: true,
    mentions: true,
    comments: true,
  });
  
  const handleToggleChange = (key: string) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };
  
  const saveNotificationSettings = async () => {
    if (!user || !updateUserProfile) return;
    
    setIsSaving(true);
    
    try {
      const success = await updateUserProfile({
        settings: {
          ...user.settings,
          emailNotifications: notificationSettings.emailNotifications,
          pushNotifications: notificationSettings.pushNotifications,
          // We could save more notification preferences here if the API supported it
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
    <Card>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <CardTitle className="text-xl flex items-center">
          <Bell className="h-5 w-5 mr-2 text-primary" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Manage how and when you receive notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="emailNotifications">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              id="emailNotifications"
              checked={notificationSettings.emailNotifications}
              onCheckedChange={() => handleToggleChange('emailNotifications')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="pushNotifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications in browser</p>
            </div>
            <Switch
              id="pushNotifications"
              checked={notificationSettings.pushNotifications}
              onCheckedChange={() => handleToggleChange('pushNotifications')}
            />
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="font-medium mb-3">Notification Types</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="friendRequests">Friend Requests</Label>
                <Switch
                  id="friendRequests"
                  checked={notificationSettings.friendRequests}
                  onCheckedChange={() => handleToggleChange('friendRequests')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="messages">Messages</Label>
                <Switch
                  id="messages"
                  checked={notificationSettings.messages}
                  onCheckedChange={() => handleToggleChange('messages')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="mentions">Mentions</Label>
                <Switch
                  id="mentions"
                  checked={notificationSettings.mentions}
                  onCheckedChange={() => handleToggleChange('mentions')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="comments">Comments</Label>
                <Switch
                  id="comments"
                  checked={notificationSettings.comments}
                  onCheckedChange={() => handleToggleChange('comments')}
                />
              </div>
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
  );
};
