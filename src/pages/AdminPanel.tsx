import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import AppLayout from '@/components/layout/AppLayout';
import AdminFeatures from '@/components/admin/AdminFeatures';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Flag, Settings, Search, Trash2, Ban, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AdminUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  is_admin: boolean;
  created_at: string;
  is_online: boolean;
}

interface AdminPost {
  id: string;
  content: string;
  user_id: string;
  created_at: string;
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
}

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [reports, setReports] = useState<AdminReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!user?.isAdmin) {
      navigate('/');
      toast({
        title: "Access Denied",
        description: "You don't have admin privileges.",
        variant: "destructive"
      });
      return;
    }

    fetchAdminData();
  }, [isAuthenticated, user, navigate]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

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

      // Fetch reports
      const { data: reportsData, error: reportsError } = await supabase
        .from('post_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (reportsError) throw reportsError;
      setReports(reportsData || []);
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

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== postId));
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

  const toggleUserAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !currentStatus })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(u => 
        u.id === userId ? { ...u, is_admin: !currentStatus } : u
      ));
      
      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'promoted to' : 'demoted from'} admin`
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

        <AdminFeatures />

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
            <TabsTrigger value="reports">Reports ({reports.filter(r => r.status === 'pending').length})</TabsTrigger>
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
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${user.is_online ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <div>
                          <div className="font-medium">{user.display_name}</div>
                          <div className="text-sm text-muted-foreground">@{user.username}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.is_admin && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">Admin</span>}
                        <Button
                          variant={user.is_admin ? "destructive" : "default"}
                          size="sm"
                          onClick={() => toggleUserAdmin(user.id, user.is_admin)}
                        >
                          {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                        </Button>
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
                          onClick={() => deletePost(post.id)}
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
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          report.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          report.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                      {report.details && (
                        <p className="text-sm mb-3">{report.details}</p>
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
                    <h3 className="font-medium mb-2">Notification Settings</h3>
                    <p className="text-sm text-muted-foreground mb-3">Manage platform-wide notifications</p>
                    <Button variant="outline">Configure Notifications</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminPanel;