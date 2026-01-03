import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/component/ui/dialog';
import { Button } from '@/component/ui/button';
import { Input } from '@/component/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Badge } from '@/component/ui/badge';
import { Checkbox } from '@/component/ui/checkbox';
import { ScrollArea } from '@/component/ui/scroll-area';
import { UserPlus, Crown, Shield, User, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';

interface GroupMember {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
}

interface Friend {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

interface GroupMembersManagerProps {
  groupId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMembersUpdated?: () => void;
}

const GroupMembersManager: React.FC<GroupMembersManagerProps> = ({
  groupId,
  open,
  onOpenChange,
  onMembersUpdated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('member');

  useEffect(() => {
    if (open && groupId) {
      fetchData();
    }
  }, [open, groupId]);

  const fetchData = async () => {
    if (!user) return;
    
    try {
      // Fetch members first - get user_ids from group_members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select('id, user_id, role')
        .eq('group_id', groupId);

      if (membersError) throw membersError;
      
      const membersList = membersData || [];
      
      // Fetch profiles for all member user_ids
      const memberUserIds = membersList.map(m => m.user_id);
      let memberProfiles: Record<string, any> = {};
      
      if (memberUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', memberUserIds);
        
        if (profilesError) throw profilesError;
        
        profilesData?.forEach(p => {
          memberProfiles[p.id] = p;
        });
      }
      
      // Combine members with their profiles
      const membersWithProfiles = membersList.map(m => ({
        ...m,
        profiles: memberProfiles[m.user_id] || { username: 'Unknown', display_name: 'Unknown', avatar_url: null }
      }));
      
      setMembers(membersWithProfiles);
      
      // Find current user's role
      const userMember = membersList.find((m: any) => m.user_id === user?.id);
      if (userMember) {
        setCurrentUserRole(userMember.role);
      }

      // Fetch friends - check both directions
      const { data: friendsAsUser, error: friendsError1 } = await supabase
        .from('friends')
        .select('friend_id')
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      const { data: friendsAsFriend, error: friendsError2 } = await supabase
        .from('friends')
        .select('user_id')
        .eq('friend_id', user.id)
        .eq('status', 'accepted');

      if (friendsError1) throw friendsError1;
      if (friendsError2) throw friendsError2;

      // Collect all friend IDs
      const friendIds: string[] = [];
      friendsAsUser?.forEach((f: any) => {
        if (f.friend_id && !friendIds.includes(f.friend_id)) {
          friendIds.push(f.friend_id);
        }
      });
      friendsAsFriend?.forEach((f: any) => {
        if (f.user_id && !friendIds.includes(f.user_id)) {
          friendIds.push(f.user_id);
        }
      });

      // Fetch profiles for all friends
      let friendsList: Friend[] = [];
      if (friendIds.length > 0) {
        const { data: friendProfiles, error: friendProfilesError } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', friendIds);
        
        if (friendProfilesError) throw friendProfilesError;
        
        friendsList = (friendProfiles || []).map(p => ({
          id: p.id,
          username: p.username,
          display_name: p.display_name,
          avatar_url: p.avatar_url
        }));
      }

      // Filter out friends who are already members
      const availableFriends = friendsList.filter(f => !memberUserIds.includes(f.id));
      
      setFriends(availableFriends);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchMembers = async () => {
    await fetchData();
  };

  const fetchFriends = async () => {
    await fetchData();
  };

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) return;

    setIsLoading(true);
    try {
      const newMembers = selectedFriends.map(friendId => ({
        group_id: groupId,
        user_id: friendId,
        role: 'member'
      }));

      const { error } = await supabase
        .from('group_members')
        .insert(newMembers);

      if (error) throw error;

      toast({
        title: 'Members added',
        description: `Successfully added ${selectedFriends.length} member(s) to the group.`
      });

      setSelectedFriends([]);
      await fetchMembers();
      await fetchFriends();
      onMembersUpdated?.();
    } catch (error) {
      console.error('Error adding members:', error);
      toast({
        title: 'Error',
        description: 'Failed to add members to the group.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string, userId: string) => {
    if (currentUserRole !== 'admin') return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Member removed',
        description: 'Successfully removed member from the group.'
      });

      await fetchMembers();
      await fetchFriends();
      onMembersUpdated?.();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member from the group.',
        variant: 'destructive'
      });
    }
  };

  const filteredFriends = friends.filter(friend => {
    const query = searchQuery.toLowerCase();
    return (
      friend.username.toLowerCase().includes(query) ||
      friend.display_name.toLowerCase().includes(query)
    );
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const isAdmin = currentUserRole === 'admin';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Group Members</DialogTitle>
          <DialogDescription>
            Manage members and add new people to this group
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Members */}
          <div>
            <h3 className="font-semibold mb-2">Members ({members.length})</h3>
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-2 space-y-1">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profiles?.avatar_url || '/placeholder.svg'} />
                        <AvatarFallback>
                          {member.profiles?.display_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.profiles?.display_name}</p>
                        <p className="text-sm text-muted-foreground">
                          @{member.profiles?.username}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        {getRoleIcon(member.role)}
                        {member.role}
                      </Badge>
                      {isAdmin && member.user_id !== user?.id && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleRemoveMember(member.id, member.user_id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Add Members */}
          {isAdmin && (
            <div>
              <h3 className="font-semibold mb-2">Add Friends</h3>
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-2"
              />
              <ScrollArea className="h-48 border rounded-lg">
                <div className="p-2 space-y-1">
                  {filteredFriends.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      {friends.length === 0
                        ? 'All your friends are already in this group'
                        : 'No friends found'}
                    </p>
                  ) : (
                    filteredFriends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg"
                      >
                        <Checkbox
                          checked={selectedFriends.includes(friend.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedFriends([...selectedFriends, friend.id]);
                            } else {
                              setSelectedFriends(selectedFriends.filter(id => id !== friend.id));
                            }
                          }}
                        />
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={friend.avatar_url || '/placeholder.svg'} />
                          <AvatarFallback>
                            {friend.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{friend.display_name}</p>
                          <p className="text-sm text-muted-foreground">@{friend.username}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              {selectedFriends.length > 0 && (
                <Button
                  onClick={handleAddMembers}
                  disabled={isLoading}
                  className="w-full mt-2"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add {selectedFriends.length} member{selectedFriends.length > 1 ? 's' : ''}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupMembersManager;
