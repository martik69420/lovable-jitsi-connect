import React, { useState, useEffect } from 'react';
import { Button } from '@/component/ui/button';
import { Input } from '@/component/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/component/ui/dialog';
import { Badge } from '@/component/ui/badge';
import { ScrollArea } from '@/component/ui/scroll-area';
import { Plus, Users, X, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

interface GroupChatCreatorProps {
  onGroupCreated?: (group: { id: string; name: string; members: string[] }) => void;
}

interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
}

const GroupChatCreator: React.FC<GroupChatCreatorProps> = ({ onGroupCreated }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch friends when dialog opens
  useEffect(() => {
    if (open && user?.id) {
      fetchFriends();
    }
  }, [open, user?.id]);

  const fetchFriends = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('friends')
        .select(`
          friend_id,
          profiles!friends_friend_id_fkey (
            id, username, display_name, avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (error) throw error;

      const friendsData = data?.map(f => ({
        id: f.profiles.id,
        username: f.profiles.username,
        displayName: f.profiles.display_name || f.profiles.username,
        avatar: f.profiles.avatar_url || '/placeholder.svg'
      })) || [];

      setFriends(friendsData);
    } catch (error) {
      console.error('Error fetching friends:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive"
      });
      return;
    }

    if (selectedMembers.length === 0) {
      toast({
        title: "Error", 
        description: "Please select at least one member",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      // Create the group - the trigger will automatically set created_by
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          description: description || null,
          created_by: user!.id
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add group members (including creator as admin)
      const membersToAdd = [
        { group_id: group.id, user_id: user!.id, role: 'admin' },
        ...selectedMembers.map(member => ({
          group_id: group.id,
          user_id: member.id,
          role: 'member'
        }))
      ];

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(membersToAdd);

      if (membersError) throw membersError;

      toast({
        title: "Success!",
        description: `Group "${groupName}" created successfully!`,
      });

      // Reset form
      setGroupName('');
      setDescription('');
      setSelectedMembers([]);
      setSearchQuery('');
      setOpen(false);

      // Notify parent
      if (onGroupCreated) {
        onGroupCreated({ 
          id: group.id, 
          name: groupName, 
          members: selectedMembers.map(m => m.id) 
        });
      }
    } catch (error) {
      console.error('Error creating group:', error);
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleMember = (friend: Friend) => {
    setSelectedMembers(prev => 
      prev.find(m => m.id === friend.id)
        ? prev.filter(m => m.id !== friend.id)
        : [...prev, friend]
    );
  };

  const removeMember = (friendId: string) => {
    setSelectedMembers(prev => prev.filter(m => m.id !== friendId));
  };

  const filteredFriends = friends.filter(friend =>
    friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Group Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Group Chat
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[80vh]">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Group Name</label>
              <Input
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description (Optional)</label>
              <Input
                placeholder="What's this group about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Selected Members */}
          {selectedMembers.length > 0 && (
            <div>
              <label className="text-sm font-medium">Selected Members ({selectedMembers.length})</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedMembers.map(member => (
                  <Badge key={member.id} variant="secondary" className="gap-1">
                    {member.displayName}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeMember(member.id)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add Members */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Members</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search friends..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <ScrollArea className="h-40 border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredFriends.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {friends.length === 0 ? 'No friends available' : 'No friends match your search'}
                  </p>
                ) : (
                  filteredFriends.map(friend => {
                    const isSelected = selectedMembers.some(m => m.id === friend.id);
                    return (
                      <div
                        key={friend.id}
                        onClick={() => toggleMember(friend)}
                        className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors
                          ${isSelected ? 'bg-primary/20 border border-primary/30' : 'hover:bg-muted/50'}
                        `}
                      >
                        <img
                          src={friend.avatar}
                          alt={friend.displayName}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-medium">{friend.displayName}</p>
                          <p className="text-xs text-muted-foreground">@{friend.username}</p>
                        </div>
                        {isSelected && (
                          <div className="ml-auto">
                            <div className="h-2 w-2 bg-primary rounded-full" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!groupName.trim() || selectedMembers.length === 0 || loading}
              className="flex-1"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupChatCreator;