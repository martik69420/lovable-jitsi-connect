
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Bell, Volume2, Phone, Play } from 'lucide-react';

export const NotificationSettings = () => {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [ringtoneVolume, setRingtoneVolume] = useState(() => {
    const saved = localStorage.getItem('call_ringtone_volume');
    return saved ? parseFloat(saved) : 0.5;
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: user?.settings?.emailNotifications ?? true,
    pushNotifications: user?.settings?.pushNotifications ?? true,
    friendRequests: true,
    messages: true,
    mentions: true,
    comments: true
  });
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setRingtoneVolume(newVolume);
    localStorage.setItem('call_ringtone_volume', newVolume.toString());
  };
  
  const playTestRingtone = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current = new Audio('/ringtone.mp3');
    audioRef.current.volume = ringtoneVolume;
    audioRef.current.play().catch(err => console.log('Could not play ringtone:', err));
    
    // Stop after 3 seconds
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }, 3000);
  };
  
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

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
            <h3 className="text-base font-medium mb-4 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Call Settings
            </h3>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">Ringtone Volume</Label>
                    <p className="text-sm text-muted-foreground">
                      Adjust the volume for incoming call ringtones
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={playTestRingtone}
                    className="flex items-center gap-2"
                  >
                    <Play className="h-3 w-3" />
                    Test
                  </Button>
                </div>
                <div className="flex items-center gap-4">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={[ringtoneVolume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.01}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground min-w-[3rem] text-right">
                    {Math.round(ringtoneVolume * 100)}%
                  </span>
                </div>
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
