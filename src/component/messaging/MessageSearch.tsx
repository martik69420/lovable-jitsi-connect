import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/component/ui/input';
import { Button } from '@/component/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/component/ui/dialog';
import { ScrollArea } from '@/component/ui/scroll-area';
import { format } from 'date-fns';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender?: {
    display_name: string;
    username: string;
  };
}

interface MessageSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: Message[];
  onMessageSelect: (messageId: string) => void;
}

const MessageSearch: React.FC<MessageSearchProps> = ({
  open,
  onOpenChange,
  messages,
  onMessageSelect
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMessages([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const results = messages.filter(msg => 
      msg.content.toLowerCase().includes(query)
    );
    setFilteredMessages(results);
  }, [searchQuery, messages]);

  const handleMessageClick = (messageId: string) => {
    onMessageSelect(messageId);
    onOpenChange(false);
    setSearchQuery('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Search Messages</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search in conversation..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <ScrollArea className="h-96">
            {searchQuery && filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No messages found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    className="p-3 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                    onClick={() => handleMessageClick(message.id)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">
                        {message.sender?.display_name || message.sender?.username || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">{message.content}</p>
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

export default MessageSearch;
