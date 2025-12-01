import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ProfileHeader from '@/components/profile/ProfileHeader';
import { useAuth } from '@/context/auth';
import { useLanguage } from '@/context/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import ProfilePictureUpload from '@/components/profile/ProfilePictureUpload';
import { Shield, MapPin, GraduationCap } from 'lucide-react';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { supabase } from '@/integrations/supabase/client';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = useMemo(() => {
    return user && user.username === username;
  }, [user?.username, username]);

  useEffect(() => {
    const loadProfileData = async () => {
      if (!username) {
        setError(t('profile.profileNotFound'));
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        if (user && user.username === username) {
          setProfileUser(user);
          setIsCurrentUser(true);
          setIsLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle();
          
        if (error) {
          console.error('Error loading profile:', error);
          setError(t('profile.failedToLoad'));
          return;
        }
        
        if (!data) {
          setError(t('profile.profileNotFound'));
          return;
        }
        
        setProfileUser(data);
        setIsCurrentUser(false);
        
        if (user && user.id && data.id && user.id !== data.id) {
          const { data: friendData } = await supabase
            .from('friends')
            .select('*')
            .or(`and(user_id.eq.${user.id},friend_id.eq.${data.id}),and(friend_id.eq.${user.id},user_id.eq.${data.id})`)
            .eq('status', 'accepted')
            .maybeSingle();
            
          setIsFriend(!!friendData);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError(t('profile.unexpectedError'));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfileData();
  }, [username, t, user?.id, user?.username]);

  const handleAddFriend = async () => {
    if (!user || !profileUser) return;
    
    try {
      await supabase
        .from('friends')
        .insert([
          { user_id: user.id, friend_id: profileUser.id, status: 'pending' }
        ]);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleRemoveFriend = async () => {
    if (!user || !profileUser) return;
    
    try {
      await supabase
        .from('friends')
        .delete()
        .or(`and(user_id.eq.${user.id},friend_id.eq.${profileUser.id}),and(friend_id.eq.${user.id},user_id.eq.${profileUser.id})`);
        
      setIsFriend(false);
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container py-6 max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <Skeleton className="h-28 w-28 rounded-full" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-64" />
                  <div className="flex gap-6">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container py-6 max-w-4xl mx-auto">
          <Card className="border-destructive/20">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <Shield className="h-6 w-6 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold">{t('profile.notFound')}</h2>
                <p className="text-muted-foreground">{error}</p>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container py-6 max-w-4xl mx-auto space-y-6">
        {isEditingProfile ? (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('profile.editProfile')}</h3>
              <ProfilePictureUpload />
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={() => setIsEditingProfile(false)}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              {/* Info badges */}
              {(profileUser?.class || profileUser?.location || profileUser?.school) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {profileUser?.class && (
                    <Badge variant="secondary" className="text-xs">
                      <GraduationCap className="h-3 w-3 mr-1" />
                      {profileUser.class}
                    </Badge>
                  )}
                  {profileUser?.location && (
                    <Badge variant="secondary" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {profileUser.location}
                    </Badge>
                  )}
                  {profileUser?.school && (
                    <Badge variant="outline" className="text-xs">
                      {profileUser.school}
                    </Badge>
                  )}
                </div>
              )}
              
              <ProfileHeader 
                user={profileUser || { 
                  id: '', 
                  username: username || '', 
                  displayName: username || '',
                  display_name: username || ''
                }}
                isCurrentUser={isCurrentUser}
                isFriend={isFriend}
                onAddFriend={handleAddFriend}
                onRemoveFriend={handleRemoveFriend}
                loading={false} 
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <ProfileTabs 
              username={username || ''} 
              isOwnProfile={isCurrentUser}
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Profile;
