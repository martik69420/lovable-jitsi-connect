import React from 'react';
import { Edit2, Trash2, Reply, Pin, Forward, MoreVertical } from 'lucide-react';
import { Button } from '@/component/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/component/ui/dropdown-menu';

interface MessageActionsProps {
  messageId: string;
  isOwn: boolean;
  isPinned?: boolean;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onForward?: (messageId: string) => void;
  isGroupChat?: boolean;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  isOwn,
  isPinned,
  onEdit,
  onDelete,
  onReply,
  onPin,
  onForward,
  isGroupChat
}) => {
  return (
    <div className="absolute -top-2 right-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 bg-background/90 hover:bg-background shadow-sm"
          >
            <MoreVertical className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onReply && (
            <DropdownMenuItem onClick={() => onReply(messageId)}>
              <Reply className="mr-2 h-4 w-4" />
              Reply
            </DropdownMenuItem>
          )}
          
          {onForward && (
            <DropdownMenuItem onClick={() => onForward(messageId)}>
              <Forward className="mr-2 h-4 w-4" />
              Forward
            </DropdownMenuItem>
          )}
          
          {isGroupChat && onPin && (
            <DropdownMenuItem onClick={() => onPin(messageId)}>
              <Pin className={`mr-2 h-4 w-4 ${isPinned ? 'fill-current' : ''}`} />
              {isPinned ? 'Unpin' : 'Pin'} Message
            </DropdownMenuItem>
          )}
          
          {isOwn && (
            <>
              <DropdownMenuSeparator />
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(messageId)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(messageId)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default MessageActions;
