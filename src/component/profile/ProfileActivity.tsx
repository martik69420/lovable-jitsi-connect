import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  Users, 
  MessageSquare, 
  Heart, 
  Trophy, 
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/context/auth';

interface ProfileActivityProps {
  userId: string;
  isOwnProfile: boolean;
}

interface ActivityStats {
  postsCount: number;
  likesReceived: number;
  friendsCount: number;
}

interface RecentActivity {
  id: string;
  type: 'post' | 'like' | 'comment' | 'friend';
  content: string;
  created_at: string;
  target?: string;
}

const ProfileActivity: React.FC<ProfileActivityProps> = ({ userId, isOwnProfile }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ActivityStats>({
    postsCount: 0,
    likesReceived: 0,
    friendsCount: 0
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);

  useEffect(() => {
    fetchActivityData();
  }, [userId]);

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      // Fetch basic stats
      const [postsData, friendsData, profileData] = await Promise.all([
        supabase.from('posts').select('id').eq('user_id', userId),
        supabase.from('friends').select('id').or(`user_id.eq.${userId},friend_id.eq.${userId}`).eq('status', 'accepted'),
        supabase.from('profiles').select('created_at, avatar_url').eq('id', userId).single()
      ]);

      // Fetch total likes received on user's posts
      const { data: userPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', userId);
      
      let likesReceived = 0;
      if (userPosts && userPosts.length > 0) {
        const postIds = userPosts.map(p => p.id);
        const { count } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .in('post_id', postIds);
        likesReceived = count || 0;
      }

      // Fetch user achievements
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('unlocked', true);

      setStats({
        postsCount: postsData.data?.length || 0,
        likesReceived: likesReceived,
        friendsCount: friendsData.data?.length || 0
      });

      setUserAvatar(profileData.data?.avatar_url || null);
      setAchievements(achievementsData || []);

      // Fetch real recent activities
      const recentActivities: RecentActivity[] = [];
      
      // Recent posts
      const { data: recentPosts } = await supabase
        .from('posts')
        .select('id, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3);
      
      if (recentPosts) {
        recentPosts.forEach(post => {
          recentActivities.push({
            id: `post-${post.id}`,
            type: 'post',
            content: 'Created a new post',
            created_at: post.created_at,
            target: post.content.slice(0, 50) + (post.content.length > 50 ? '...' : '')
          });
        });
      }

      // Recent likes given
      const { data: recentLikes } = await supabase
        .from('likes')
        .select('id, created_at, post_id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (recentLikes) {
        recentLikes.forEach(like => {
          recentActivities.push({
            id: `like-${like.id}`,
            type: 'like',
            content: 'Liked a post',
            created_at: like.created_at || new Date().toISOString()
          });
        });
      }

      // Sort by date
      recentActivities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setActivities(recentActivities.slice(0, 5));

    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'post': return <MessageSquare className="h-4 w-4" />;
      case 'like': return <Heart className="h-4 w-4" />;
      case 'comment': return <MessageSquare className="h-4 w-4" />;
      case 'friend': return <Users className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-64 bg-muted rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Activity Stats - 3 cards instead of 4 */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">{stats.postsCount}</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <Heart className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-500">{stats.likesReceived}</div>
            <div className="text-sm text-muted-foreground">Likes</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-500">{stats.friendsCount}</div>
            <div className="text-sm text-muted-foreground">Friends</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.length > 0 ? activities.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.content}</p>
                      {activity.target && (
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.target}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {achievements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <div 
                      key={achievement.id} 
                      className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="text-2xl">{achievement.icon}</div>
                      <div>
                        <h4 className="font-medium">{achievement.name}</h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        <Badge variant="secondary" className="mt-1">
                          {achievement.rarity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No achievements unlocked yet</p>
                  <p className="text-sm">Start posting and interacting to earn achievements!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Profile Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Posts</span>
                    <span className="text-lg font-bold text-primary">{stats.postsCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Friends</span>
                    <span className="text-lg font-bold text-blue-500">{stats.friendsCount}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Likes Received</span>
                    <span className="text-lg font-bold text-red-500">{stats.likesReceived}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Achievements</span>
                    <span className="text-lg font-bold text-purple-500">{achievements.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProfileActivity;