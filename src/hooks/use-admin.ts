import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

export const useAdmin = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user?.id) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
      setLoading(false);
    };

    checkAdminRole();
  }, [user?.id]);

  const grantAdminRole = async (userId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' });

    if (error) {
      // Check if already exists
      if (error.code === '23505') {
        return { success: true, message: 'User already has admin role' };
      }
      throw error;
    }
    return { success: true, message: 'Admin role granted' };
  };

  const revokeAdminRole = async (userId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (error) throw error;
    return { success: true, message: 'Admin role revoked' };
  };

  const checkUserIsAdmin = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    if (error) {
      console.error('Error checking user admin status:', error);
      return false;
    }
    return !!data;
  };

  const banUser = async (userId: string, reason?: string, isPermanent = true, expiresAt?: Date) => {
    const { error } = await supabase
      .from('user_bans')
      .insert({
        user_id: userId,
        banned_by: user?.id,
        reason,
        is_permanent: isPermanent,
        expires_at: expiresAt?.toISOString()
      });

    if (error) {
      if (error.code === '23505') {
        throw new Error('User is already banned');
      }
      throw error;
    }
    return { success: true };
  };

  const unbanUser = async (userId: string) => {
    const { error } = await supabase
      .from('user_bans')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true };
  };

  const isUserBanned = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_bans')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error checking ban status:', error);
      return false;
    }
    
    if (!data) return false;
    
    // Check if ban has expired
    if (!data.is_permanent && data.expires_at) {
      return new Date(data.expires_at) > new Date();
    }
    
    return true;
  };

  const adminDeletePost = async (postId: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    return { success: true };
  };

  return {
    isAdmin,
    loading,
    grantAdminRole,
    revokeAdminRole,
    checkUserIsAdmin,
    banUser,
    unbanUser,
    isUserBanned,
    adminDeletePost
  };
};
