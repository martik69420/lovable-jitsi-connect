import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/component/ui/dialog';
import { Input } from '@/component/ui/input';
import { ScrollArea } from '@/component/ui/scroll-area';
import { Button } from '@/component/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';

interface ContactLike {
  id: string;
  username?: string;
  displayName?: string;
  name?: string;
  avatar?: string | null;
  avatar_url?: string | null;
  isGroup?: boolean;
}

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: any | null;
  friends: ContactLike[];
  groups: ContactLike[];
  onSelect: (targetId: string, isGroup: boolean) => void;
}

const ForwardMessageDialog: React.FC<ForwardMessageDialogProps> = ({ open, onOpenChange, message, friends, groups, onSelect }) => {
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const all = [
      ...groups.map((g) => ({ ...g, isGroup: true })),
      ...friends.map((f) => ({ ...f, isGroup: false }))
    ];
    const q = query.trim().toLowerCase();
    return q
      ? all.filter((c) => (c.name || c.displayName || c.username || '').toLowerCase().includes(q))
      : all;
  }, [friends, groups, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Forward message</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="text-sm text-muted-foreground">Select a chat to forward to</div>
          <ScrollArea className="max-h-80">
            <div className="space-y-1">
              {items.map((c) => {
                const name = c.name || c.displayName || c.username || 'Unknown';
                const avatar = c.avatar_url || c.avatar || '/placeholder.svg';
                return (
                  <button key={`${c.id}-${c.isGroup ? 'g' : 'u'}`} className="w-full p-2 rounded-lg hover:bg-muted flex items-center gap-3" onClick={() => onSelect(c.id, !!c.isGroup)}>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={avatar} alt={name} />
                      <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-muted-foreground">{c.isGroup ? 'Group' : 'Direct message'}</div>
                    </div>
                    <Button size="sm" variant="secondary">Forward</Button>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ForwardMessageDialog;
