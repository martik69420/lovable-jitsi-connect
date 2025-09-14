
import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarIcon, BookIcon, MapPinIcon, Pencil, Heart, GraduationCap, MapPin } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/context/auth/types';

interface ProfileAboutProps {
  username?: string;
  isEditable?: boolean;
}

const ProfileAbout: React.FC<ProfileAboutProps> = ({ username, isEditable = false }) => {
  const { user } = useAuth();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!username) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Check if it's the current user first
        if (user && user.username === username) {
          setProfileUser(user);
          setIsLoading(false);
          return;
        }

        // Fetch user profile from database
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          setError('Failed to load profile');
          return;
        }

        if (!data) {
          setError('User not found');
          return;
        }

        // Transform the database profile to match User type
        const transformedUser: User = {
          id: data.id,
          email: data.email || '',
          username: data.username,
          displayName: data.display_name || data.username,
          avatar: data.avatar_url,
          bio: data.bio,
          class: data.class,
          location: '', // Add location if available in your schema
          createdAt: data.created_at,
          coins: data.coins || 0,
          isAdmin: data.is_admin || false,
          interests: data.interests || [],
          settings: {
            publicLikedPosts: false,
            publicSavedPosts: false,
            emailNotifications: true,
            pushNotifications: true,
            theme: 'system',
            privacy: {
              profileVisibility: 'everyone',
              onlineStatus: true,
              friendRequests: true,
              showActivity: true,
              allowMessages: 'everyone',
              allowTags: true,
              dataSharing: false,
              showEmail: false
            }
          }
        };

        setProfileUser(transformedUser);
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [username, user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-28" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !profileUser) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            {error || 'User not found'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium">About</h3>
            {isEditable && !isEditing && (
              <Button variant="ghost" size="sm" onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Button>
            )}
          </div>
          
          <p className="text-muted-foreground mt-2">
            {profileUser?.bio || `No bio available for ${profileUser?.displayName || profileUser?.username}.`}
          </p>
          
          <div className="flex flex-wrap gap-2 pt-2">
            {profileUser.interests && profileUser.interests.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 text-red-500" />
                <span>{profileUser.interests.join(', ')}</span>
              </div>
            )}
             {profileUser.class && (
               <div className="flex items-center gap-2 text-sm text-muted-foreground">
                 <GraduationCap className="h-4 w-4 text-blue-500" />
                 <span>{profileUser.class}</span>
              </div>
            )}
            {profileUser.createdAt && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarIcon className="h-4 w-4 text-blue-500" />
                <span>Joined {new Date(profileUser.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileAbout;
