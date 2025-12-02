
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, UserRoundX, UserCog, Eye, GlobeIcon, MessagesSquare, Users, Tags } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

export const PrivacySettings: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'everyone',
    onlineStatus: true,
    friendRequests: true,
    showActivity: true,
    allowMessages: 'everyone',
    allowTags: true,
    dataSharing: false,
    showEmail: false,
    publicLikedPosts: false,
    publicSavedPosts: false,
    showBio: true,
    showFriends: true,
    showPosts: true,
    showClass: true,
    showLocation: true,
  });
  
  // Load settings from Supabase on mount
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.id) return;
      
      const { data } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      if (data) {
        setPrivacySettings(prev => ({
          ...prev,
          profileVisibility: data.privacy_profile || 'everyone',
          onlineStatus: data.privacy_online_status ?? true,
          showActivity: data.privacy_activity_status ?? true,
          dataSharing: data.privacy_data_sharing ?? false,
        }));
      }
      
      // Also load from user.settings if available
      if (user?.settings?.privacy) {
        setPrivacySettings(prev => ({
          ...prev,
          ...user.settings.privacy,
          publicLikedPosts: user.settings?.publicLikedPosts ?? false,
          publicSavedPosts: user.settings?.publicSavedPosts ?? false,
        }));
      }
    };
    
    loadSettings();
  }, [user?.id]);
  
  const handlePrivacyChange = (key: string, value: string | boolean) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const savePrivacySettings = async () => {
    if (!user) return;
    
    setIsSaving(true);
    
    try {
      // Save to user_settings table in Supabase
      await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          privacy_profile: privacySettings.profileVisibility,
          privacy_online_status: privacySettings.onlineStatus,
          privacy_activity_status: privacySettings.showActivity,
          privacy_read_receipts: true,
          privacy_searchable: true,
          privacy_data_sharing: privacySettings.dataSharing,
        }, { onConflict: 'user_id' });
      
      // Also save to profiles.settings via updateUserProfile if available
      if (updateUserProfile) {
        await updateUserProfile({
          settings: {
            privacy: {
              profileVisibility: privacySettings.profileVisibility,
              onlineStatus: privacySettings.onlineStatus,
              friendRequests: privacySettings.friendRequests,
              showActivity: privacySettings.showActivity,
              allowMessages: privacySettings.allowMessages,
              allowTags: privacySettings.allowTags,
              dataSharing: privacySettings.dataSharing,
              showEmail: privacySettings.showEmail,
              showBio: privacySettings.showBio,
              showFriends: privacySettings.showFriends,
              showPosts: privacySettings.showPosts,
              showClass: privacySettings.showClass,
              showLocation: privacySettings.showLocation,
            },
            publicLikedPosts: privacySettings.publicLikedPosts,
            publicSavedPosts: privacySettings.publicSavedPosts,
            emailNotifications: user.settings?.emailNotifications ?? true,
            pushNotifications: user.settings?.pushNotifications ?? true,
            theme: user.settings?.theme || 'system',
          }
        });
      }
      
      toast({
        title: "Privacy settings updated",
        description: "Your privacy preferences have been saved."
      });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
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
        <h2 className="text-2xl font-semibold mb-2">Privacy</h2>
        <p className="text-muted-foreground">Control your privacy settings and who can see your information</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Privacy & Safety</CardTitle>
              <CardDescription>Control your privacy settings and who can see your information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          <div className="space-y-4">
            <h3 className="text-base font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              Profile Visibility
            </h3>
            
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="profile-visibility">Who can see your profile</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose who can view your full profile information
                  </p>
                </div>
                <Select 
                  value={privacySettings.profileVisibility}
                  onValueChange={(value) => handlePrivacyChange('profileVisibility', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="school">School Only</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="show-email">Show email on profile</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Allow others to see your email address
                  </p>
                </div>
                <Switch 
                  id="show-email"
                  checked={privacySettings.showEmail}
                  onCheckedChange={(checked) => handlePrivacyChange('showEmail', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="online-status">Show online status</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Let others see when you're active
                  </p>
                </div>
                <Switch 
                  id="online-status"
                  checked={privacySettings.onlineStatus}
                  onCheckedChange={(checked) => handlePrivacyChange('onlineStatus', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="show-activity">Activity Status</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Let others see your recent activity
                  </p>
                </div>
                <Switch 
                  id="show-activity"
                  checked={privacySettings.showActivity}
                  onCheckedChange={(checked) => handlePrivacyChange('showActivity', checked)}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-base font-medium flex items-center gap-2">
              <MessagesSquare className="h-4 w-4 text-primary" />
              Messaging & Connections
            </h3>
            
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="message-permissions">Who can message you</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Control who can send you direct messages
                  </p>
                </div>
                <Select 
                  value={privacySettings.allowMessages}
                  onValueChange={(value) => handlePrivacyChange('allowMessages', value)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="everyone">Everyone</SelectItem>
                    <SelectItem value="school">School Only</SelectItem>
                    <SelectItem value="friends">Friends Only</SelectItem>
                    <SelectItem value="none">No One</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="friend-requests">Allow friend requests</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Let people send you friend requests
                  </p>
                </div>
                <Switch 
                  id="friend-requests"
                  checked={privacySettings.friendRequests}
                  onCheckedChange={(checked) => handlePrivacyChange('friendRequests', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="allow-tags">Allow tagging</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Let others tag you in posts and comments
                  </p>
                </div>
                <Switch 
                  id="allow-tags"
                  checked={privacySettings.allowTags}
                  onCheckedChange={(checked) => handlePrivacyChange('allowTags', checked)}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-base font-medium flex items-center gap-2">
              <UserCog className="h-4 w-4 text-primary" />
              Profile Content Visibility
            </h3>
            
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="show-bio">Show bio on profile</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Let others see your bio
                  </p>
                </div>
                <Switch 
                  id="show-bio"
                  checked={privacySettings.showBio}
                  onCheckedChange={(checked) => handlePrivacyChange('showBio', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="show-class">Show class on profile</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Let others see your class
                  </p>
                </div>
                <Switch 
                  id="show-class"
                  checked={privacySettings.showClass}
                  onCheckedChange={(checked) => handlePrivacyChange('showClass', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="show-location">Show location on profile</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Let others see your location
                  </p>
                </div>
                <Switch 
                  id="show-location"
                  checked={privacySettings.showLocation}
                  onCheckedChange={(checked) => handlePrivacyChange('showLocation', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="show-friends">Show friends list</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Let others see your friends on your profile
                  </p>
                </div>
                <Switch 
                  id="show-friends"
                  checked={privacySettings.showFriends}
                  onCheckedChange={(checked) => handlePrivacyChange('showFriends', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="show-posts">Show posts on profile</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Let others see your posts on your profile
                  </p>
                </div>
                <Switch 
                  id="show-posts"
                  checked={privacySettings.showPosts}
                  onCheckedChange={(checked) => handlePrivacyChange('showPosts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="public-liked">Public liked posts</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Make your liked posts visible to others
                  </p>
                </div>
                <Switch 
                  id="public-liked"
                  checked={privacySettings.publicLikedPosts}
                  onCheckedChange={(checked) => handlePrivacyChange('publicLikedPosts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <Label htmlFor="public-saved">Public saved posts</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Make your saved posts visible to others
                  </p>
                </div>
                <Switch 
                  id="public-saved"
                  checked={privacySettings.publicSavedPosts}
                  onCheckedChange={(checked) => handlePrivacyChange('publicSavedPosts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="data-sharing" className="font-medium">Data sharing</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Allow anonymized data to improve Campus Connect
                  </p>
                </div>
                <Switch 
                  id="data-sharing"
                  checked={privacySettings.dataSharing}
                  onCheckedChange={(checked) => handlePrivacyChange('dataSharing', checked)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={savePrivacySettings} 
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Privacy Settings"}
            </Button>
          </div>
        </motion.div>
      </CardContent>
    </Card>
    </div>
  );
};
