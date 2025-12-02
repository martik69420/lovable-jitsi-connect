import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/context/auth';
import { User, MapPin, Building2, Globe } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const ProfileSettings = () => {
  const { user, refreshUser } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    display_name: '',
    username: '',
    bio: '',
    class: '',
    location: '',
    website: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        display_name: user.displayName || '',
        username: user.username || '',
        bio: user.bio || '',
        class: user.class || '',
        location: user.location || '',
        website: localStorage.getItem('userWebsite') || ''
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfileData = async () => {
    if (!user?.id) return;
    
    setIsSaving(true);
    try {
      // Save website to localStorage
      localStorage.setItem('userWebsite', profileData.website);
      
      // Update profile directly in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profileData.display_name,
          username: profileData.username,
          bio: profileData.bio,
          class: profileData.class,
          location: profileData.location
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Refresh user data
      if (refreshUser) {
        await refreshUser();
      }

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Profile Settings</h2>
        <p className="text-muted-foreground">Update your public profile information</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Profile Information</CardTitle>
              <CardDescription>Update your public profile information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="display_name" className="text-base">Display Name</Label>
              <Input
                id="display_name"
                name="display_name"
                value={profileData.display_name}
                onChange={handleInputChange}
                placeholder="Your display name"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="username" className="text-base">Username</Label>
              <Input
                id="username"
                name="username"
                value={profileData.username}
                onChange={handleInputChange}
                placeholder="Your username"
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio" className="text-base">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              value={profileData.bio}
              onChange={handleInputChange}
              placeholder="Tell us about yourself..."
              rows={3}
              className="mt-2 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <Label htmlFor="class" className="text-base">Klas</Label>
                <Input
                  id="class"
                  name="class"
                  value={profileData.class}
                  onChange={handleInputChange}
                  placeholder="Jouw klas"
                  className="mt-2"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1">
                <Label htmlFor="location" className="text-base">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={profileData.location}
                  onChange={handleInputChange}
                  placeholder="Your location"
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1">
              <Label htmlFor="website" className="text-base">Website</Label>
              <Input
                id="website"
                name="website"
                type="url"
                value={profileData.website}
                onChange={handleInputChange}
                placeholder="https://yourwebsite.com"
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button 
              onClick={saveProfileData} 
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};