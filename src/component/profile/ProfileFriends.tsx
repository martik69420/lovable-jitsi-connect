
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPlusIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProfileFriendsProps {
  username?: string;
}

interface FriendType {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

const ProfileFriends: React.FC<ProfileFriendsProps> = ({ username }) => {
  const [friends, setFriends] = useState<FriendType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch friends from an API
    // For now, we'll simulate with mock data
    const mockFriends = [
      { id: '1', username: 'johndoe', displayName: 'John Doe', avatar: '' },
      { id: '2', username: 'janedoe', displayName: 'Jane Doe', avatar: '' },
      { id: '3', username: 'bobsmith', displayName: 'Bob Smith', avatar: '' },
    ];
    
    // Simulate loading
    const timer = setTimeout(() => {
      setFriends(mockFriends);
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, [username]);

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

  if (friends.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-muted-foreground">No friends to display</p>
        <Button variant="outline" className="mt-4">
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Find Friends
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Friends ({friends.length})</h3>
        <Button variant="outline" size="sm">
          <UserPlusIcon className="mr-2 h-4 w-4" />
          Find Friends
        </Button>
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
