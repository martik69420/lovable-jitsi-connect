
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlusIcon, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

interface ProfileFriendsProps {
  username?: string;
  userId?: string;
}

interface FriendType {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

const ProfileFriends: React.FC<ProfileFriendsProps> = ({ username, userId }) => {
  const { user: currentUser } = useAuth();
  const [friends, setFriends] = useState<FriendType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    const fetchFriends = async () => {
      setIsLoading(true);
      try {
        // Determine whose profile we're viewing
        let profileUserId = userId;
        
        if (!profileUserId && username) {
          // Fetch user ID from username
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single();
          
          profileUserId = profileData?.id;
        }

        if (!profileUserId) {
          setIsLoading(false);
          return;
        }

        // Check if viewing own profile
        const viewingOwnProfile = currentUser?.id === profileUserId;
        setIsOwnProfile(viewingOwnProfile);

        // If not own profile, check privacy settings
        if (!viewingOwnProfile) {
          const { data: settings } = await supabase
            .from('user_settings')
            .select('privacy_profile')
            .eq('user_id', profileUserId)
            .single();

          // Default is public (friends visible), check if set to private
          if (settings?.privacy_profile === 'private') {
            setIsPrivate(true);
            setIsLoading(false);
            return;
          }
        }

        // Fetch friends where user is either user_id or friend_id
        const { data: friendsAsUser, error: error1 } = await supabase
          .from('friends')
          .select(`
            friend_id,
            profiles!friends_friend_id_fkey (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('user_id', profileUserId)
          .eq('status', 'accepted');

        const { data: friendsAsFriend, error: error2 } = await supabase
          .from('friends')
          .select(`
            user_id,
            profiles!friends_user_id_fkey (
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('friend_id', profileUserId)
          .eq('status', 'accepted');

        if (error1) console.error('Error fetching friends (as user):', error1);
        if (error2) console.error('Error fetching friends (as friend):', error2);

        const friendsList: FriendType[] = [];

        // Add friends where user is user_id
        friendsAsUser?.forEach((f: any) => {
          if (f.profiles) {
            friendsList.push({
              id: f.profiles.id,
              username: f.profiles.username,
              displayName: f.profiles.display_name,
              avatar: f.profiles.avatar_url
            });
          }
        });

        // Add friends where user is friend_id
        friendsAsFriend?.forEach((f: any) => {
          if (f.profiles && !friendsList.find(fr => fr.id === f.profiles.id)) {
            friendsList.push({
              id: f.profiles.id,
              username: f.profiles.username,
              displayName: f.profiles.display_name,
              avatar: f.profiles.avatar_url
            });
          }
        });

        setFriends(friendsList);
      } catch (error) {
        console.error('Error fetching friends:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();
  }, [username, userId, currentUser?.id]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (isPrivate && !isOwnProfile) {
    return (
      <div className="p-8 text-center">
        <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">Friends list is private</p>
        <p className="text-sm text-muted-foreground mt-2">
          This user has chosen to hide their friends list
        </p>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-muted-foreground">No friends to display</p>
        {isOwnProfile && (
          <Link to="/friends/add">
            <Button variant="outline" className="mt-4">
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Find Friends
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Friends ({friends.length})</h3>
        {isOwnProfile && (
          <Link to="/friends/add">
            <Button variant="outline" size="sm">
              <UserPlusIcon className="mr-2 h-4 w-4" />
              Find Friends
            </Button>
          </Link>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {friends.map((friend) => (
          <Link to={`/profile/${friend.username}`} key={friend.id}>
            <Card className="overflow-hidden hover:bg-accent/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage 
                      src={friend.avatar || '/placeholder.svg'} 
                      alt={friend.displayName} 
                    />
                    <AvatarFallback>
                      {friend.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{friend.displayName}</p>
                    <p className="text-sm text-muted-foreground">@{friend.username}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ProfileFriends;
