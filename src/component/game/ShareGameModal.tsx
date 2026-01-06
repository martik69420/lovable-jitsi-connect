import React, { useState, useEffect, useMemo } from "react";
import { Send, Search, Gamepad, Rocket, Circle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/component/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth";

interface ShareGameModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameType: 'pong' | 'asteroids' | 'geometrydash';
}

interface Contact {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  isGroup?: boolean;
}

const gameData = {
  pong: {
    name: 'Pong',
    description: '2-player ping pong',
    icon: Circle,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  asteroids: {
    name: 'Asteroids',
    description: 'Space shooter co-op',
    icon: Rocket,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
  geometrydash: {
    name: 'Geometry Dash',
    description: 'Rhythm-based platformer race',
    icon: Gamepad,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10'
  }
};

const ShareGameModal: React.FC<ShareGameModalProps> = ({ 
  open, 
  onOpenChange, 
  gameType 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  
  const game = gameData[gameType];
  const Icon = game?.icon || Gamepad;

  useEffect(() => {
    if (open && user) {
      fetchContactsAndGroups();
    }
  }, [open, user]);

  const fetchContactsAndGroups = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Fetch friends
      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select(`
          friend_id,
          profiles!friends_friend_id_fkey (
            id,
            username,
            display_name,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'accepted');

      if (friendsError) throw friendsError;

      const friendsList: Contact[] = friendsData?.map((f: any) => ({
        id: f.profiles.id,
        username: f.profiles.username,
        display_name: f.profiles.display_name,
        avatar_url: f.profiles.avatar_url,
        isGroup: false
      })) || [];

      // Fetch groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('group_members')
        .select(`
          group_id,
          groups (
            id,
            name,
            avatar_url
          )
        `)
        .eq('user_id', user.id);

      if (groupsError) throw groupsError;

      const groupsList: Contact[] = groupsData?.map((g: any) => ({
        id: g.groups.id,
        username: g.groups.name,
        display_name: g.groups.name,
        avatar_url: g.groups.avatar_url,
        isGroup: true
      })) || [];

      setContacts(friendsList);
      setGroups(groupsList);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    const allItems = [...contacts, ...groups];
    if (!query.trim()) return allItems;
    
    const lowerQuery = query.toLowerCase();
    return allItems.filter(item =>
      item.display_name.toLowerCase().includes(lowerQuery) ||
      item.username.toLowerCase().includes(lowerQuery)
    );
  }, [contacts, groups, query]);

  const handleShare = async (targetId: string, isGroup: boolean) => {
    if (!user) return;
    
    try {
      // Share game using a special format in content
      const messageData: any = {
        sender_id: user.id,
        content: `[GAME:${gameType}]`,
        is_read: false
      };

      if (isGroup) {
        messageData.group_id = targetId;
      } else {
        messageData.receiver_id = targetId;
      }

      const { error } = await supabase
        .from('messages')
        .insert([messageData]);

      if (error) throw error;

      toast({
        title: "Game shared!",
        description: `${game?.name || 'Game'} shared to ${isGroup ? 'group' : 'chat'} successfully.`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error sharing game:', error);
      toast({
        title: "Error",
        description: "Failed to share game. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Game</DialogTitle>
          <DialogDescription>
            Invite a friend to play {game?.name || 'this game'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Game Preview */}
          <div className={`flex items-center gap-3 p-3 rounded-lg border ${game?.bgColor || 'bg-muted'}`}>
            <div className={`p-2 rounded-lg bg-background`}>
              <Icon className={`h-6 w-6 ${game?.color || 'text-primary'}`} />
            </div>
            <div>
              <h4 className="font-semibold">{game?.name || 'Game'}</h4>
              <p className="text-xs text-muted-foreground">{game?.description}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">Game</Badge>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts or groups..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[250px] pr-4">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No contacts found</div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={item.avatar_url || '/placeholder.svg'} />
                        <AvatarFallback>{item.display_name[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{item.display_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.isGroup ? 'Group' : `@${item.username}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleShare(item.id, item.isGroup || false)}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareGameModal;
