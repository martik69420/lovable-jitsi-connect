
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PencilLine, Heart, Bookmark, User, Activity, Users } from 'lucide-react';
import ProfilePosts from './ProfilePosts';
import ProfileLikedPosts from './ProfileLikedPosts';
import ProfileSavedPosts from './ProfileSavedPosts';
import ProfileAbout from './ProfileAbout';
import ProfileActivity from './ProfileActivity';
import ProfileFriends from './ProfileFriends';
import { useAuth } from '@/context/auth';

interface ProfileTabsProps {
  username: string;
  isOwnProfile: boolean;
}

const ProfileTabs: React.FC<ProfileTabsProps> = ({ username, isOwnProfile }) => {
  const { user } = useAuth();
  
  return (
    <Tabs defaultValue="posts" className="w-full">
      <TabsList className="grid grid-cols-3 md:grid-cols-6 mb-6 h-auto p-1 bg-muted/50">
        <TabsTrigger 
          value="posts" 
          className="flex gap-2 items-center py-2.5 px-3 text-sm data-[state=active]:bg-background"
        >
          <PencilLine className="h-4 w-4" />
          <span className="hidden sm:inline">Posts</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="about" 
          className="flex gap-2 items-center py-2.5 px-3 text-sm data-[state=active]:bg-background"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">About</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="activity" 
          className="flex gap-2 items-center py-2.5 px-3 text-sm data-[state=active]:bg-background"
        >
          <Activity className="h-4 w-4" />
          <span className="hidden sm:inline">Activity</span>
        </TabsTrigger>
        
        <TabsTrigger 
          value="friends" 
          className="flex gap-2 items-center py-2.5 px-3 text-sm data-[state=active]:bg-background"
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Friends</span>
        </TabsTrigger>
        
        {isOwnProfile && (
          <>
            <TabsTrigger 
              value="liked" 
              className="flex gap-2 items-center py-2.5 px-3 text-sm data-[state=active]:bg-background"
            >
              <Heart className="h-4 w-4" />
              <span className="hidden sm:inline">Liked</span>
            </TabsTrigger>
            <TabsTrigger 
              value="saved" 
              className="flex gap-2 items-center py-2.5 px-3 text-sm data-[state=active]:bg-background"
            >
              <Bookmark className="h-4 w-4" />
              <span className="hidden sm:inline">Saved</span>
            </TabsTrigger>
          </>
        )}
      </TabsList>

      <TabsContent value="posts" className="mt-0">
        <ProfilePosts username={username} />
      </TabsContent>
      
      <TabsContent value="about" className="mt-0">
        <ProfileAbout username={username} isEditable={isOwnProfile} />
      </TabsContent>

      <TabsContent value="activity" className="mt-0">
        <ProfileActivity userId={user?.id || ''} isOwnProfile={isOwnProfile} />
      </TabsContent>

      <TabsContent value="friends" className="mt-0">
        <ProfileFriends username={username} />
      </TabsContent>
      
      <TabsContent value="liked" className="mt-0">
        <ProfileLikedPosts username={username} />
      </TabsContent>
      
      <TabsContent value="saved" className="mt-0">
        <ProfileSavedPosts username={username} />
      </TabsContent>
    </Tabs>
  );
};

export default ProfileTabs;
