import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { 
  Activity, 
  Users, 
  MessageSquare, 
  Heart, 
  Image, 
  Trophy, 
  Calendar,
  MapPin,
  Star,
  Clock,
  TrendingUp,
  Gift
} from 'lucide-react';
import { useAuth } from '@/context/auth';

interface ProfileActivityProps {
  userId: string;
  isOwnProfile: boolean;
}

interface ActivityStats {
  postsCount: number;
  likesReceived: number;
  commentsCount: number;
  friendsCount: number;
  joinDate: string;
  totalViews: number;
  activeStreak: number;
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
    commentsCount: 0,
    friendsCount: 0,
    joinDate: '',
    totalViews: 0,
    activeStreak: 0
  });
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivityData();
  }, [userId]);

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      // Fetch basic stats
      const [postsData, likesData, commentsData, friendsData, profileData] = await Promise.all([
        supabase.from('posts').select('id').eq('user_id', userId),
        supabase.from('likes').select('id').eq('user_id', userId),
        supabase.from('comments').select('id').eq('user_id', userId),
        supabase.from('friends').select('id').or(`user_id.eq.${userId},friend_id.eq.${userId}`).eq('status', 'accepted'),
        supabase.from('profiles').select('created_at').eq('id', userId).single()
      ]);

      // Fetch user achievements
      const { data: achievementsData } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .eq('unlocked', true);

      setStats({
        postsCount: postsData.data?.length || 0,
        likesReceived: likesData.data?.length || 0,
        commentsCount: commentsData.data?.length || 0,
        friendsCount: friendsData.data?.length || 0,
        joinDate: profileData.data?.created_at || '',
        totalViews: Math.floor(Math.random() * 1000) + 100, // Simulated
        activeStreak: Math.floor(Math.random() * 30) + 1 // Simulated
      });

      setAchievements(achievementsData || []);

      // Simulate recent activities
      setActivities([
        {
          id: '1',
          type: 'post',
          content: 'Created a new post',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          target: 'Amazing sunset today!'
        },
        {
          id: '2', 
          type: 'like',
          content: 'Liked a post',
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          target: "John's latest photo"
        },
        {
          id: '3',
          type: 'friend',
          content: 'Made a new friend',
          created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          target: 'Sarah Johnson'
        }
      ]);

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
      {/* Activity Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="animate-slide-up hover:shadow-lg transition-all duration-300">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-primary/10 rounded-full">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div className="text-2xl font-bold text-primary">{stats.postsCount}</div>
            <div className="text-sm text-muted-foreground">Posts</div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up hover:shadow-lg transition-all duration-300" style={{ animationDelay: '0.1s' }}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <Heart className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-500">{stats.likesReceived}</div>
            <div className="text-sm text-muted-foreground">Likes</div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up hover:shadow-lg transition-all duration-300" style={{ animationDelay: '0.2s' }}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-500">{stats.friendsCount}</div>
            <div className="text-sm text-muted-foreground">Friends</div>
          </CardContent>
        </Card>

        <Card className="animate-slide-up hover:shadow-lg transition-all duration-300" style={{ animationDelay: '0.3s' }}>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-100 dark:bg-green-900/20 rounded-full">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-500">{stats.totalViews}</div>
            <div className="text-sm text-muted-foreground">Views</div>
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
          <Card className="animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activities.map((activity, index) => (
                  <div 
                    key={activity.id} 
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors animate-slide-right"
                    style={{ animationDelay: `${index * 0.1}s` }}
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
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <Card className="animate-slide-up">
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
                      className="flex items-center gap-3 p-3 border rounded-lg hover:shadow-md transition-shadow animate-bounce-in"
                      style={{ animationDelay: `${index * 0.1}s` }}
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
          <Card className="animate-slide-up">
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
                    <span className="text-sm font-medium">Active Streak</span>
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-orange-500">{stats.activeStreak}</span>
                      <span className="text-sm text-muted-foreground">days</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Member Since</span>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(stats.joinDate)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Total Comments</span>
                    <span className="text-lg font-bold text-blue-500">{stats.commentsCount}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Profile Views</span>
                    <span className="text-lg font-bold text-green-500">{stats.totalViews}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Engagement Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {stats.postsCount > 0 ? Math.round((stats.likesReceived / stats.postsCount) * 100) : 0}%
                    </span>
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