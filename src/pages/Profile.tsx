
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
import { Shield, Star, Award, BookMarked, Heart, Sparkles, Users, Calendar, MapPin } from 'lucide-react';
import ProfileTabs from '@/components/profile/ProfileTabs';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

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
        console.log('Loading profile for username:', username);
        
        // Check if it's the current user first
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
          console.log('No profile found for username:', username);
          setError(t('profile.profileNotFound'));
          return;
        }
        
        console.log('Profile loaded successfully:', data);
        setProfileUser(data);
        setIsCurrentUser(false);
        
        // Check friendship status only if needed and user is authenticated
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
          <Card className="mb-8 border border-border/50 shadow-lg">
            <div className="h-32 md:h-40 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 animate-pulse"></div>
            <div className="px-6 pb-6 -mt-16 relative">
              <div className="flex flex-col md:flex-row md:items-end gap-6">
                <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-full border-4 border-background shadow-lg" />
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          </Card>
          <Card className="border shadow-sm">
            <div className="p-6">
              <div className="flex justify-between mb-6">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-32" />
              </div>
              <Skeleton className="h-64 w-full" />
            </div>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="container py-6 max-w-4xl mx-auto">
          <Card className="mb-6 border-2 border-destructive/20 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-destructive/10">
                  <Shield className="h-8 w-8 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">{t('profile.notFound')}</h2>
                <p className="text-muted-foreground text-lg">{error}</p>
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
      <div className="container py-6 md:py-8 max-w-4xl mx-auto">
        {isEditingProfile ? (
          <Card className="mb-8 border-2 border-primary/20 shadow-lg">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">{t('profile.editProfile')}</h3>
              </div>
              <ProfilePictureUpload />
              <div className="flex gap-3 mt-8">
                <Button variant="outline" onClick={() => setIsEditingProfile(false)}>
                  {t('common.cancel')}
                </Button>
                <Button onClick={() => setIsEditingProfile(false)}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="overflow-hidden border border-border/50 shadow-xl rounded-3xl backdrop-blur-sm bg-gradient-to-br from-background via-background to-muted/30">
              <div className="h-40 md:h-48 bg-gradient-to-br from-primary/40 via-primary/20 to-accent/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent"></div>
                <div className="absolute inset-0">
                  <motion.div 
                    className="absolute top-8 right-8 w-32 h-32 bg-primary/10 rounded-full blur-2xl"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.3, 0.6, 0.3]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity 
                    }}
                  />
                  <motion.div 
                    className="absolute bottom-4 left-8 w-24 h-24 bg-accent/20 rounded-full blur-xl"
                    animate={{ 
                      scale: [1.1, 1, 1.1],
                      opacity: [0.4, 0.2, 0.4]
                    }}
                    transition={{ 
                      duration: 2, 
                      repeat: Infinity 
                    }}
                  />
                </div>
                
                {/* Stats Bar */}
                <div className="absolute top-6 left-6 right-6">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2">
                      {profileUser?.class && (
                        <Badge variant="secondary" className="bg-background/90 text-foreground backdrop-blur-md">
                          <Calendar className="h-3 w-3 mr-1" />
                          {profileUser.class}
                        </Badge>
                      )}
                      {profileUser?.location && (
                        <Badge variant="secondary" className="bg-background/90 text-foreground backdrop-blur-md">
                          <MapPin className="h-3 w-3 mr-1" />
                          {profileUser.location}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex gap-3">
                      <motion.div 
                        className="p-3 rounded-2xl bg-background/90 backdrop-blur-md shadow-lg border border-white/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Award className="h-5 w-5 text-primary" />
                      </motion.div>
                      <motion.div 
                        className="p-3 rounded-2xl bg-background/90 backdrop-blur-md shadow-lg border border-white/20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Sparkles className="h-5 w-5 text-accent" />
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-8 pb-8 -mt-20 relative">
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
              </div>
            </Card>
          </motion.div>
        )}

        <Card className="border border-border/50 shadow-xl rounded-3xl backdrop-blur-sm bg-gradient-to-br from-background to-muted/20">
          <CardContent className="p-8 md:p-10">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-primary/10">
                  <BookMarked className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Profile Content
                </h3>
              </div>
              <div className="h-px bg-gradient-to-r from-primary/20 via-accent/20 to-transparent mb-8"></div>
            </div>
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
