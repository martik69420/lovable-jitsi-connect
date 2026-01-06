import React, { memo, useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Settings, 
  UserPlus, 
  UserMinus, 
  Shield,
  MessageSquare
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface ProfileHeaderProps {
  user: {
    id: string;
    username: string;
    displayName?: string;
    display_name?: string;
    bio?: string;
    avatar_url?: string;
    avatar?: string;
    school?: string;
    created_at?: string;
    createdAt?: string;
    isAdmin?: boolean;
    is_admin?: boolean;
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
  const navigate = useNavigate();
  const [stats, setStats] = useState({ posts: 0, friends: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      try {
        // Fetch post count
        const { count: postCount } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        // Fetch friend count
        const { count: friendCount } = await supabase
          .from('friends')
          .select('*', { count: 'exact', head: true })
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted');

        setStats({
          posts: postCount || 0,
          friends: friendCount || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
  }, [user?.id]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getInitials = (name?: string) => {
    if (!name || typeof name !== 'string') return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = user?.display_name || user?.displayName || user?.username || 'Unknown User';
  const isAdmin = user?.is_admin || user?.isAdmin;
  const avatarUrl = user?.avatar_url || user?.avatar;
  const createdAt = user?.created_at || user?.createdAt;

  return (
    <div className="flex flex-col sm:flex-row items-start gap-6">
      {/* Avatar */}
      <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-background shadow-lg">
        <AvatarImage 
          src={avatarUrl && avatarUrl !== '/placeholder.svg' ? avatarUrl : undefined} 
          alt={displayName}
          className="object-cover"
        />
        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 space-y-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">
              {displayName}
            </h1>
            {isAdmin && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Shield className="h-3 w-3" />
                Admin
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">@{user?.username || 'unknown'}</p>
        </div>
        
        {user?.bio && (
          <p className="text-foreground/80 text-sm max-w-xl">
            {user.bio}
          </p>
        )}
        
        {/* Stats */}
        <div className="flex gap-6 text-sm">
          <div>
            <span className="font-semibold text-foreground">{stats.posts}</span>{' '}
            <span className="text-muted-foreground">Posts</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">{stats.friends}</span>{' '}
            <span className="text-muted-foreground">Friends</span>
          </div>
        </div>

        {createdAt && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Joined {formatDate(createdAt)}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 self-start">
        {isCurrentUser ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
            Edit
          </Button>
        ) : (
          <>
            {isFriend ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={onRemoveFriend}
                disabled={loading}
                className="gap-2"
              >
                <UserMinus className="h-4 w-4" />
                Remove Friend
              </Button>
            ) : (
              <Button 
                size="sm"
                onClick={onAddFriend}
                disabled={loading}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Add Friend
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/messages')}
              className="gap-2"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
});

ProfileHeader.displayName = 'ProfileHeader';

export default ProfileHeader;
