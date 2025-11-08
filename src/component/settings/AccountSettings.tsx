
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth';
import { Shield, Mail, Key } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const AccountSettings = () => {
  const { user, updateProfile } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully"
      });
      
      setIsChangingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email update initiated. Please check your new email for confirmation."
      });
      
      setIsChangingEmail(false);
      setNewEmail('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update email",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    setIsUpdating(true);
    try {
      // Delete user profile first
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // Sign out user
      await supabase.auth.signOut();

      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Account Settings</h2>
        <p className="text-muted-foreground">Manage your account credentials and security</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Account Settings</CardTitle>
              <CardDescription>Manage your account credentials and security</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
        <div className="grid gap-6">
          <div className="flex items-center gap-4">
            <Mail className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <Label htmlFor="email" className="text-base">Email Address</Label>
              {!isChangingEmail ? (
                <div className="mt-2 flex gap-4">
                  <Input 
                    id="email" 
                    value={user?.email || ""} 
                    disabled 
                    className="bg-muted"
                  />
                  <Button variant="outline" onClick={() => setIsChangingEmail(true)}>
                    Change Email
                  </Button>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <Input
                    type="email"
                    placeholder="New email address"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handleEmailChange}
                      disabled={isUpdating}
                      size="sm"
                    >
                      {isUpdating ? 'Updating...' : 'Update Email'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsChangingEmail(false);
                        setNewEmail('');
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Key className="h-5 w-5 text-primary" />
            <div className="flex-1">
              <Label htmlFor="password" className="text-base">Password</Label>
              {!isChangingPassword ? (
                <div className="mt-2 flex gap-4">
                  <Input 
                    id="password" 
                    type="password" 
                    value="••••••••" 
                    disabled 
                    className="bg-muted"
                  />
                  <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                    Change Password
                  </Button>
                </div>
              ) : (
                <div className="mt-2 space-y-2">
                  <Input
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePasswordChange}
                      disabled={isUpdating}
                      size="sm"
                    >
                      {isUpdating ? 'Updating...' : 'Update Password'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsChangingPassword(false);
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-6 mt-6">
            <Button 
              variant="outline" 
              className="text-destructive border-destructive hover:bg-destructive/10"
              onClick={handleDeleteAccount}
              disabled={isUpdating}
            >
              {isUpdating ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
    </div>
  );
};
