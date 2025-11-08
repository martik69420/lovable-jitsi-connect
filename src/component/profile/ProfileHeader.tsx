
import React, { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Settings, 
  UserPlus, 
  UserMinus, 
  Shield,
  Star,
  Crown,
  Verified
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ProfileHeaderProps {
  user: {
    id: string;
    username: string;
    displayName: string;
    bio?: string;
    avatar_url?: string;
    school?: string;
    created_at?: string;
    isAdmin?: boolean;
  };
  isCurrentUser: boolean;
  isFriend: boolean;
  onAddFriend: () => void;
  onRemoveFriend: () => void;
  loading: boolean;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = memo(({
  user,
  isCurrentUser,
  isFriend,
  onAddFriend,
  onRemoveFriend,
  loading
}) => {
  const { t } = useLanguage();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getInitials = (name?: string) => {
    if (!name || typeof name !== 'string') {
      return '?';
    }
    
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Ensure we have a valid display name
  const displayName = user?.displayName || user?.username || 'Unknown User';

  return (
    <div className="bg-card rounded-xl border border-border p-6 space-y-6">
      <div className="flex items-start gap-6">
        {/* Avatar Section */}
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-background">
            <AvatarImage 
              src={user?.avatar_url || "/placeholder.svg"} 
              alt={displayName}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-foreground font-bold text-2xl">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* User Info Section */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold text-foreground">
                {displayName}
              </h1>
              {user?.isAdmin && (
                <Badge variant="destructive" className="gap-1">
                  <Shield className="h-3 w-3" />
                  Admin
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">@{user?.username || 'unknown'}</p>
          </div>
          
          {user?.bio && (
            <p className="text-foreground/90 max-w-2xl">
              {user.bio}
            </p>
          )}
          
          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-semibold text-foreground">42</span>{' '}
              <span className="text-muted-foreground">Mutual friends</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">234</span>{' '}
              <span className="text-muted-foreground">Total friends</span>
            </div>
          </div>

          {user?.created_at && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Joined {formatDate(user?.created_at)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          {isCurrentUser ? (
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Edit profile
            </Button>
          ) : (
            <>
              {isFriend ? (
                <Button 
                  variant="outline" 
                  onClick={onRemoveFriend}
                  disabled={loading}
                  className="gap-2"
                >
                  <UserMinus className="h-4 w-4" />
                  Unfollow
                </Button>
              ) : (
                <Button 
                  onClick={onAddFriend}
                  disabled={loading}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Follow
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

ProfileHeader.displayName = 'ProfileHeader';

export default ProfileHeader;
