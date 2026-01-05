import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

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

  const logAuditAction = async (
    action: string,
    targetType: string,
    targetId?: string,
    details?: Record<string, unknown>
  ) => {
    if (!user?.id) return;
    
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      action,
      target_type: targetType,
      target_id: targetId || null,
      details: (details || {}) as unknown as import('@/integrations/supabase/types').Json
    });
  };

  const getAuditLogs = async (limit = 50): Promise<AuditLogEntry[]> => {
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    // Fetch admin profiles
    const adminIds = [...new Set((data || []).map(log => log.admin_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username, display_name')
      .in('id', adminIds);

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    return (data || []).map(log => ({
      ...log,
      admin_profile: profileMap.get(log.admin_id)
    })) as AuditLogEntry[];
  };

  const grantAdminRole = async (userId: string, username?: string) => {
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' });

    if (error) {
      if (error.code === '23505') {
        return { success: true, message: 'User already has admin role' };
      }
      throw error;
    }
    
    await logAuditAction('grant_admin', 'user', userId, { username });
    return { success: true, message: 'Admin role granted' };
  };

  const revokeAdminRole = async (userId: string, username?: string) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin');

    if (error) throw error;
    
    await logAuditAction('revoke_admin', 'user', userId, { username });
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

  const banUser = async (userId: string, reason?: string, isPermanent = true, expiresAt?: Date, username?: string) => {
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
    
    await logAuditAction('ban_user', 'user', userId, { reason, is_permanent: isPermanent, username });
    return { success: true };
  };

  const unbanUser = async (userId: string, username?: string) => {
    const { error } = await supabase
      .from('user_bans')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
    
    await logAuditAction('unban_user', 'user', userId, { username });
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
    
    if (!data.is_permanent && data.expires_at) {
      return new Date(data.expires_at) > new Date();
    }
    
    return true;
  };

  const adminDeletePost = async (postId: string, authorUsername?: string) => {
    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
    
    await logAuditAction('delete_post', 'post', postId, { author: authorUsername });
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
    adminDeletePost,
    getAuditLogs,
    logAuditAction
  };
};
