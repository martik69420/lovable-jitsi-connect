import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GroupChatCreatorProps {
  onGroupCreated?: (groupData: { name: string; members: string[] }) => void;
}

const GroupChatCreator: React.FC<GroupChatCreatorProps> = ({ onGroupCreated }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a group name",
        variant: "destructive"
      });
      return;
    }

    // For now, just show a message that group chats will be available soon
    toast({
      title: "Coming Soon!",
      description: "Group chats feature will be available in the next update. Stay tuned!",
    });

    setOpen(false);
    setGroupName('');
    setDescription('');

    // If callback provided, call it with placeholder data
    if (onGroupCreated) {
      onGroupCreated({ name: groupName, members: [] });
    }
  };

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
        <div className="space-y-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <h3 className="font-semibold mb-1">Group Chats Coming Soon!</h3>
            <p className="text-sm text-muted-foreground">
              We're working on bringing group chat functionality to the platform. 
              This feature will allow you to chat with multiple friends at once.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Group Name (Preview)</label>
              <Input
                placeholder="Enter group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description (Preview)</label>
              <Input
                placeholder="What's this group about?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGroup}
              disabled={!groupName.trim()}
              className="flex-1"
            >
              Preview Feature
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupChatCreator;