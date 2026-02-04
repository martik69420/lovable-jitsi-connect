import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { useAdmin } from '@/hooks/use-admin';
import AppLayout from '@/components/layout/AppLayout';
import AdminFeatures from '@/components/admin/AdminFeatures';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Flag, Settings, Search, Trash2, Ban, CheckCircle, BarChart3, MessageSquare, Bell, Database, Activity, Eye, UserX, UserCheck, ExternalLink, ClipboardList, TestTube2, Heart, UserPlus, Gamepad2, AtSign, Share2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useNotification } from '@/context/NotificationContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
  is_online: boolean;
  hasAdminRole?: boolean;
  isBanned?: boolean;
}

interface AdminPost {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
  images?: string[];
  profiles: {
    username: string;
    display_name: string;
  };
}

interface AdminReport {
  id: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
  user_id: string;
  post_id?: string;
  reported_user_id?: string;
  post?: {
    content: string;
    user_id: string;
    images?: string[];
    profiles?: {
      username: string;
      display_name: string;
    };
  };
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalMessages: number;
  pendingReports: number;
  newUsersToday: number;
}

interface DailyStats {
  date: string;
  users: number;
  posts: number;
  messages: number;
}

interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  admin_profile?: {
    username: string;
    display_name: string;
  };
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { isAdmin, loading: adminLoading, grantAdminRole, revokeAdminRole, checkUserIsAdmin, banUser, unbanUser, isUserBanned, adminDeletePost, getAuditLogs } = useAdmin();
  const { triggerTestToast } = useNotification();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalPosts: 0,
    totalMessages: 0,
    pendingReports: 0,
    newUsersToday: 0,
  });

  // Ban dialog state
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<AdminUser | null>(null);
  const [banReason, setBanReason] = useState('');

  // Post preview dialog
  const [postPreviewOpen, setPostPreviewOpen] = useState(false);
  const [previewPost, setPreviewPost] = useState<AdminPost | null>(null);

  useEffect(() => {
    let cancelled = false;

    const guard = async () => {
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      if (adminLoading) return;
      
      if (!isAdmin) {
        toast({
          title: 'Access Denied',
          description: "You don't have admin privileges.",
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      if (!cancelled) {
        fetchAdminData();
      }
    };

    guard();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isAdmin, adminLoading, navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;

      // Fetch admin roles for all users
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .eq('role', 'admin');

      // Fetch banned users
      const { data: bansData } = await supabase
        .from('user_bans')
        .select('user_id');

      const adminUserIds = new Set(rolesData?.map(r => r.user_id) || []);
      const bannedUserIds = new Set(bansData?.map(b => b.user_id) || []);

      const usersWithRoles = (usersData || []).map(u => ({
        ...u,
        hasAdminRole: adminUserIds.has(u.id),
        isBanned: bannedUserIds.has(u.id)
      }));

      setUsers(usersWithRoles);

      // Fetch posts with user info
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Fetch reports with post data
      const { data: reportsData, error: reportsError } = await supabase
        .from('post_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;

      // Fetch post data for each report
      const reportsWithPosts = await Promise.all(
        (reportsData || []).map(async (report) => {
          if (report.post_id) {
            const { data: postData } = await supabase
              .from('posts')
              .select(`
                content,
                user_id,
                images,
                profiles:user_id (
                  username,
                  display_name
                )
              `)
              .eq('id', report.post_id)
              .single();
            return { ...report, post: postData };
          }
          return report;
        })
      );

      setReports(reportsWithPosts);

      // Fetch message count
      const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true });

      // Calculate daily stats for the last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        return date.toISOString().split('T')[0];
      });

      const dailyStatsData = last7Days.map(date => {
        const dayStart = new Date(date);
        const dayEnd = new Date(date);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const usersCount = (usersData || []).filter(u => {
          const created = new Date(u.created_at);
          return created >= dayStart && created < dayEnd;
        }).length;

        const postsCount = (postsData || []).filter(p => {
          const created = new Date(p.created_at);
          return created >= dayStart && created < dayEnd;
        }).length;

        return {
          date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          users: usersCount,
          posts: postsCount,
          messages: 0
        };
      });

      setDailyStats(dailyStatsData);

      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = (usersData || []).filter(u => 
        new Date(u.created_at) >= today
      ).length;

      setStats({
        totalUsers: usersData?.length || 0,
        activeUsers: (usersData || []).filter(u => u.is_online).length,
        totalPosts: postsData?.length || 0,
        totalMessages: messageCount || 0,
        pendingReports: (reportsData || []).filter(r => r.status === 'pending').length,
        newUsersToday,
      });

      // Fetch audit logs
      const logs = await getAuditLogs(100);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId: string, authorUsername?: string) => {
    try {
      await adminDeletePost(postId, authorUsername);
      setPosts(posts.filter(p => p.id !== postId));
      
      // Refresh audit logs
      const logs = await getAuditLogs(100);
      setAuditLogs(logs);
      
      toast({
        title: "Success",
        description: "Post deleted successfully"
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive"
      });
    }
  };

  const toggleUserAdmin = async (userId: string, hasAdminRole: boolean, username?: string) => {
    try {
      if (hasAdminRole) {
        await revokeAdminRole(userId, username);
      } else {
        await grantAdminRole(userId, username);
      }

      setUsers(users.map(u => 
        u.id === userId ? { ...u, hasAdminRole: !hasAdminRole } : u
      ));
      
      // Refresh audit logs
      const logs = await getAuditLogs(100);
      setAuditLogs(logs);
      
      toast({
        title: "Success",
        description: `User ${!hasAdminRole ? 'promoted to' : 'demoted from'} admin`
      });
    } catch (error) {
      console.error('Error updating user admin status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive"
      });
    }
  };

  const handleBanUser = async () => {
    if (!userToBan) return;
    
    try {
      await banUser(userToBan.id, banReason, true, undefined, userToBan.username);
      setUsers(users.map(u => 
        u.id === userToBan.id ? { ...u, isBanned: true } : u
      ));
      
      // Refresh audit logs
      const logs = await getAuditLogs(100);
      setAuditLogs(logs);
      
      toast({
        title: "Success",
        description: `${userToBan.display_name} has been banned`
      });
      setBanDialogOpen(false);
      setUserToBan(null);
      setBanReason('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to ban user",
        variant: "destructive"
      });
    }
  };

  const handleUnbanUser = async (userId: string, username?: string) => {
    try {
      await unbanUser(userId, username);
      setUsers(users.map(u => 
        u.id === userId ? { ...u, isBanned: false } : u
      ));
      
      // Refresh audit logs
      const logs = await getAuditLogs(100);
      setAuditLogs(logs);
      
      toast({
        title: "Success",
        description: "User has been unbanned"
      });
    } catch (error) {
      console.error('Error unbanning user:', error);
      toast({
        title: "Error",
        description: "Failed to unban user",
        variant: "destructive"
      });
    }
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('post_reports')
        .update({ status })
        .eq('id', reportId);

      if (error) throw error;

      setReports(reports.map(r => 
        r.id === reportId ? { ...r, status } : r
      ));
      
      toast({
        title: "Success",
        description: `Report marked as ${status}`
      });
    } catch (error) {
      console.error('Error updating report status:', error);
      toast({
        title: "Error",
        description: "Failed to update report status",
        variant: "destructive"
      });
    }
  };

  const openPostPreview = (post: AdminPost) => {
    setPreviewPost(post);
    setPostPreviewOpen(true);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-8">
          <div className="text-center">Loading admin panel...</div>
        </div>
      </AppLayout>
    );
  }

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="container mx-auto py-8 space-y-8">
        <div className="flex items-center gap-3 animate-slide-up">
          <Shield className="h-8 w-8 text-primary animate-glow" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Admin Panel
            </h1>
            <p className="text-muted-foreground animate-slide-right" style={{ animationDelay: '0.2s' }}>
              Manage users, content, and platform settings
            </p>
          </div>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-sm text-muted-foreground">Total Users</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.totalUsers}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Online Now</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.activeUsers}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-500" />
                <span className="text-sm text-muted-foreground">Total Posts</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.totalPosts}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-orange-500" />
                <span className="text-sm text-muted-foreground">Messages</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.totalMessages}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Flag className="h-5 w-5 text-red-500" />
                <span className="text-sm text-muted-foreground">Pending Reports</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.pendingReports}</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border-cyan-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-cyan-500" />
                <span className="text-sm text-muted-foreground">New Today</span>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.newUsersToday}</p>
            </CardContent>
          </Card>
        </div>

        <AdminFeatures />

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="reports">Reports ({reports.filter(r => r.status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${u.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            {u.display_name}
                            {u.isBanned && (
                              <Badge variant="destructive" className="text-xs">Banned</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">@{u.username}</div>
                          <div className="text-sm text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.hasAdminRole && (
                          <Badge className="bg-primary/10 text-primary">Admin</Badge>
                        )}
                        <Button
                          variant={u.hasAdminRole ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleUserAdmin(u.id, u.hasAdminRole || false, u.username)}
                        >
                          {u.hasAdminRole ? 'Remove Admin' : 'Make Admin'}
                        </Button>
                        {u.isBanned ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnbanUser(u.id, u.username)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Unban
                          </Button>
                        ) : (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setUserToBan(u);
                              setBanDialogOpen(true);
                            }}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Ban
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            <Card>
              <CardHeader>
                <CardTitle>Content Management</CardTitle>
                <CardDescription>Review and moderate user posts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-sm text-muted-foreground">
                          @{post.profiles?.username} • {new Date(post.created_at).toLocaleDateString()}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deletePost(post.id, post.profiles?.username)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="mb-2">{post.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5" />
                  Content Reports
                </CardTitle>
                <CardDescription>Review and resolve user reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reports.map((report) => (
                    <div key={report.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{report.reason}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(report.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Badge className={
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500' :
                          report.status === 'resolved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-500' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-500'
                        }>
                          {report.status}
                        </Badge>
                      </div>
                      
                      {/* Report details */}
                      {report.details && (
                        <p className="text-sm mb-3 text-muted-foreground">{report.details}</p>
                      )}

                      {/* Post Preview */}
                      {report.post && (
                        <div className="bg-muted/50 rounded-lg p-3 mb-3 border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">
                              Reported post by @{report.post.profiles?.username || 'unknown'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/post/${report.post_id}`)}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          </div>
                          <p className="text-sm line-clamp-3">{report.post.content}</p>
                          {report.post.images && report.post.images.length > 0 && (
                            <div className="flex gap-2 mt-2">
                              {report.post.images.slice(0, 3).map((img, i) => (
                                <img 
                                  key={i} 
                                  src={img} 
                                  alt="" 
                                  className="w-16 h-16 object-cover rounded"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {report.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'resolved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => updateReportStatus(report.id, 'rejected')}
                          >
                            <Ban className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                          {report.post_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                deletePost(report.post_id!, report.post?.profiles?.username);
                                updateReportStatus(report.id, 'resolved');
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete Post
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                  {reports.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No reports found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Platform Analytics
                </CardTitle>
                <CardDescription>View platform usage and engagement metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-4">User Signups (Last 7 Days)</h3>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={dailyStats}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }} 
                            />
                            <Area 
                              type="monotone" 
                              dataKey="users" 
                              stroke="hsl(var(--primary))" 
                              fill="hsl(var(--primary) / 0.2)" 
                              strokeWidth={2}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-4">Posts (Last 7 Days)</h3>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyStats}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="date" className="text-xs" />
                            <YAxis className="text-xs" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--background))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }} 
                            />
                            <Bar dataKey="posts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        User Activity
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Active users (24h)</span>
                          <span className="font-medium">{stats.activeUsers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">New registrations today</span>
                          <span className="font-medium">{stats.newUsersToday}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total registered users</span>
                          <span className="font-medium">{stats.totalUsers}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-4 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Content Stats
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total posts</span>
                          <span className="font-medium">{stats.totalPosts}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Total messages</span>
                          <span className="font-medium">{stats.totalMessages}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Pending reports</span>
                          <span className="font-medium text-destructive">{stats.pendingReports}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-4 flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Moderation Queue
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Pending reports</span>
                          <span className="font-medium text-amber-500">{reports.filter(r => r.status === 'pending').length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Resolved reports</span>
                          <span className="font-medium text-green-500">{reports.filter(r => r.status === 'resolved').length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Rejected reports</span>
                          <span className="font-medium text-muted-foreground">{reports.filter(r => r.status === 'rejected').length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium mb-4 flex items-center gap-2">
                        <Database className="h-4 w-4" />
                        Storage & Data
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Database tables active</span>
                          <span className="font-medium">Active</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">File storage</span>
                          <span className="font-medium">Configured</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Audit Log
                </CardTitle>
                <CardDescription>Track all admin actions and changes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {auditLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No audit logs found
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                        <div className={`p-2 rounded-full ${
                          log.action.includes('ban') ? 'bg-red-100 dark:bg-red-900/30' :
                          log.action.includes('admin') ? 'bg-purple-100 dark:bg-purple-900/30' :
                          log.action.includes('delete') ? 'bg-orange-100 dark:bg-orange-900/30' :
                          'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                          {log.action.includes('ban') && <Ban className="h-4 w-4 text-red-600 dark:text-red-400" />}
                          {log.action.includes('unban') && <UserCheck className="h-4 w-4 text-green-600 dark:text-green-400" />}
                          {log.action.includes('grant_admin') && <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                          {log.action.includes('revoke_admin') && <UserX className="h-4 w-4 text-purple-600 dark:text-purple-400" />}
                          {log.action.includes('delete') && <Trash2 className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {log.action === 'ban_user' && 'User Banned'}
                              {log.action === 'unban_user' && 'User Unbanned'}
                              {log.action === 'grant_admin' && 'Admin Granted'}
                              {log.action === 'revoke_admin' && 'Admin Revoked'}
                              {log.action === 'delete_post' && 'Post Deleted'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.target_type}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {log.details && typeof log.details === 'object' && (
                              <>
                                {(log.details as Record<string, unknown>).username && (
                                  <span>Target: @{String((log.details as Record<string, unknown>).username)} • </span>
                                )}
                                {(log.details as Record<string, unknown>).author && (
                                  <span>Author: @{String((log.details as Record<string, unknown>).author)} • </span>
                                )}
                                {(log.details as Record<string, unknown>).reason && (
                                  <span>Reason: {String((log.details as Record<string, unknown>).reason)} • </span>
                                )}
                              </>
                            )}
                            By {log.admin_profile?.display_name || 'Admin'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(log.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Platform Settings
                </CardTitle>
                <CardDescription>Configure global platform settings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">User Registration</h3>
                    <p className="text-sm text-muted-foreground mb-3">Control who can register for the platform</p>
                    <Button variant="outline">Configure Registration</Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Content Moderation</h3>
                    <p className="text-sm text-muted-foreground mb-3">Set up automated content filtering</p>
                    <Button variant="outline">Configure Moderation</Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <TestTube2 className="h-4 w-4" />
                      Test Notifications
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">Test the notification toast system with different notification types</p>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => triggerTestToast('message')}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => triggerTestToast('friend')}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Friend Request
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => triggerTestToast('like')}
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Like
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => triggerTestToast('comment')}
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Comment
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => triggerTestToast('mention')}
                      >
                        <AtSign className="h-4 w-4 mr-1" />
                        Mention
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => triggerTestToast('game')}
                      >
                        <Gamepad2 className="h-4 w-4 mr-1" />
                        Game Invite
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => triggerTestToast('share')}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Notification Settings</h3>
                    <p className="text-sm text-muted-foreground mb-3">Manage platform-wide notifications</p>
                    <Button variant="outline">Configure Notifications</Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Security Settings</h3>
                    <p className="text-sm text-muted-foreground mb-3">Configure authentication and security options</p>
                    <Button variant="outline">Configure Security</Button>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-2">Backup & Export</h3>
                    <p className="text-sm text-muted-foreground mb-3">Export data and configure backups</p>
                    <Button variant="outline">Manage Backups</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Ban User Dialog */}
      <Dialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ban User</DialogTitle>
            <DialogDescription>
              Ban {userToBan?.display_name} (@{userToBan?.username}) from the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Reason for ban (optional)"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBanDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBanUser}>
              <Ban className="h-4 w-4 mr-1" />
              Ban User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Preview Dialog */}
      <Dialog open={postPreviewOpen} onOpenChange={setPostPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Post Preview</DialogTitle>
          </DialogHeader>
          {previewPost && (
            <div className="py-4">
              <div className="text-sm text-muted-foreground mb-2">
                By @{previewPost.profiles?.username}
              </div>
              <p className="whitespace-pre-wrap">{previewPost.content}</p>
              {previewPost.images && previewPost.images.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {previewPost.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="w-24 h-24 object-cover rounded" />
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPostPreviewOpen(false)}>
              Close
            </Button>
            {previewPost && (
              <Button 
                variant="destructive" 
                onClick={() => {
                  deletePost(previewPost.id);
                  setPostPreviewOpen(false);
                }}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Post
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default AdminPanel;