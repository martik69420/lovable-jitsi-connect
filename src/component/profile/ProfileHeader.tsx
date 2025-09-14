
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
    <div className="flex flex-col md:flex-row md:items-end gap-6">
      {/* Avatar Section */}
      <div className="relative">
        <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-background shadow-xl ring-2 ring-primary/20">
          <AvatarImage 
            src={user?.avatar_url || "/placeholder.svg"} 
            alt={displayName}
            className="object-cover"
          />
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 text-foreground font-bold text-lg md:text-2xl">
            {getInitials(displayName)}
          </AvatarFallback>
        </Avatar>
        
        {/* Status Indicators */}
        <div className="absolute -bottom-1 -right-1 flex gap-1">
          {user?.isAdmin && (
            <div className="p-1.5 rounded-full bg-destructive shadow-lg ring-2 ring-background">
              <Shield className="h-3 w-3 text-white" />
            </div>
          )}
          <div className="p-1.5 rounded-full bg-green-500 shadow-lg ring-2 ring-background">
            <div className="h-2 w-2 rounded-full bg-white"></div>
          </div>
        </div>
      </div>

      {/* User Info Section */}
      <div className="flex-1 space-y-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {displayName}
            </h1>
            {user?.isAdmin && (
              <span className="text-sm font-medium text-destructive flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            )}
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Joined {formatDate(user?.created_at)}
            </span>
          </div>
          <p className="text-muted-foreground text-lg">@{user?.username || 'unknown'}</p>
        </div>
        
        {user?.bio && (
          <p className="text-foreground leading-relaxed max-w-md">
            {user.bio}
          </p>
        )}
        
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {user?.school && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              <span>{user.school}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            <span>Joined {formatDate(user?.created_at)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>1.2K followers</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 md:flex-col md:items-end">
        {isCurrentUser ? (
          <Button variant="outline" className="flex items-center gap-2 shadow-sm">
            <Settings className="h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <>
            {isFriend ? (
              <Button 
                variant="outline" 
                onClick={onRemoveFriend}
                disabled={loading}
                className="flex items-center gap-2 shadow-sm"
              >
                <UserMinus className="h-4 w-4" />
                Unfollow
              </Button>
            ) : (
              <Button 
                onClick={onAddFriend}
                disabled={loading}
                className="flex items-center gap-2 shadow-sm"
              >
                <UserPlus className="h-4 w-4" />
                Follow
              </Button>
            )}
            <Button variant="outline" className="shadow-sm">
              Message
            </Button>
          </>
        )}
      </div>
    </div>
  );
});

ProfileHeader.displayName = 'ProfileHeader';

export default ProfileHeader;
