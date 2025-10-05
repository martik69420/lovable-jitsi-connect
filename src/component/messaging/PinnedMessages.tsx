import React from 'react';
import { Pin, X } from 'lucide-react';
import { Button } from '@/component/ui/button';
import { ScrollArea } from '@/component/ui/scroll-area';
import { Card } from '@/component/ui/card';

interface Message {
  id: string;
  content: string;
  sender?: {
    display_name: string;
    username: string;
  };
  created_at: string;
}

interface PinnedMessagesProps {
  messages: Message[];
  onUnpin: (messageId: string) => void;
  onMessageClick: (messageId: string) => void;
  canUnpin?: boolean;
}

const PinnedMessages: React.FC<PinnedMessagesProps> = ({
  messages,
  onUnpin,
  onMessageClick,
  canUnpin = false
}) => {
  if (messages.length === 0) return null;

  return (
    <Card className="mx-4 mt-4 border-l-4 border-l-primary">
      <div className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Pin className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Pinned Messages</span>
        </div>
        <ScrollArea className={messages.length > 2 ? 'max-h-32' : ''}>
          <div className="space-y-2">
            {messages.map((message) => (
              <div
                key={message.id}
                className="flex items-start gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors group/pinned"
                onClick={() => onMessageClick(message.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    {message.sender?.display_name || message.sender?.username || 'Unknown'}
                  </p>
                  <p className="text-sm line-clamp-2">{message.content}</p>
                </div>
                {canUnpin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover/pinned:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnpin(message.id);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};

export default PinnedMessages;
