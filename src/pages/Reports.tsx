
import React, { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, Shield, User, FileText } from 'lucide-react';

interface Report {
  id: string;
  reason: string;
  details: string;
  status: string;
  created_at: string;
  post_id?: string;
  reported_user_id?: string;
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportType, setReportType] = useState<'post' | 'user'>('post');
  const [reportData, setReportData] = useState({
    targetId: '',
    reason: '',
    details: ''
  });

  useEffect(() => {
    if (user) {
      fetchMyReports();
    }
  }, [user]);

  const fetchMyReports = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Fetch post reports
      const { data: postReports } = await supabase
        .from('post_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Fetch user reports
      const { data: userReports } = await supabase
        .from('user_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const allReports = [
        ...(postReports || []),
        ...(userReports || [])
      ];

      setMyReports(allReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!user || !reportData.targetId || !reportData.reason) {
      toast({
        title: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const reportPayload = {
        user_id: user.id,
        reason: reportData.reason,
        details: reportData.details,
        status: 'pending'
      };

      if (reportType === 'post') {
        await supabase
          .from('post_reports')
          .insert([{ ...reportPayload, post_id: reportData.targetId }]);
      } else {
        await supabase
          .from('user_reports')
          .insert([{ ...reportPayload, reported_user_id: reportData.targetId }]);
      }

      toast({
        title: "Report submitted successfully",
        description: "We'll review your report and take appropriate action."
      });

      setReportData({ targetId: '', reason: '', details: '' });
      fetchMyReports();
    } catch (error) {
      console.error('Error submitting report:', error);
      toast({
        title: "Failed to submit report",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      pending: 'bg-yellow-500',
      reviewed: 'bg-blue-500',
      resolved: 'bg-green-500',
      rejected: 'bg-red-500'
    };

    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-500'}>
        {status}
      </Badge>
    );
  };

  return (
    <AppLayout>
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Report Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="my-reports">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="my-reports">My Reports</TabsTrigger>
                <TabsTrigger value="report-content">Report Content</TabsTrigger>
              </TabsList>
              
              <TabsContent value="my-reports" className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Loading reports...</p>
                  </div>
                ) : myReports.length === 0 ? (
                  <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">You have no reports</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myReports.map((report) => (
                      <Card key={report.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {report.post_id ? (
                                <FileText className="h-4 w-4" />
                              ) : (
                                <User className="h-4 w-4" />
                              )}
                              <span className="font-medium">
                                {report.post_id ? 'Post Report' : 'User Report'}
                              </span>
                              {getStatusBadge(report.status)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-1">
                              <strong>Reason:</strong> {report.reason}
                            </p>
                            {report.details && (
                              <p className="text-sm text-muted-foreground mb-2">
                                <strong>Details:</strong> {report.details}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Reported on {new Date(report.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="report-content" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Report Type</label>
                    <Select value={reportType} onValueChange={(value: 'post' | 'user') => setReportType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="post">Report a Post</SelectItem>
                        <SelectItem value="user">Report a User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      {reportType === 'post' ? 'Post ID' : 'Username'}
                    </label>
                    <Input
                      placeholder={reportType === 'post' ? 'Enter post ID' : 'Enter username'}
                      value={reportData.targetId}
                      onChange={(e) => setReportData({ ...reportData, targetId: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Reason *</label>
                    <Select value={reportData.reason} onValueChange={(value) => setReportData({ ...reportData, reason: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="spam">Spam</SelectItem>
                        <SelectItem value="harassment">Harassment</SelectItem>
                        <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                        <SelectItem value="misinformation">Misinformation</SelectItem>
                        <SelectItem value="violence">Violence or Threats</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Additional Details</label>
                    <Textarea
                      placeholder="Provide additional context about your report..."
                      value={reportData.details}
                      onChange={(e) => setReportData({ ...reportData, details: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <Button
                    onClick={handleSubmitReport}
                    disabled={isLoading || !reportData.targetId || !reportData.reason}
                    className="w-full"
                  >
                    {isLoading ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Reports;
