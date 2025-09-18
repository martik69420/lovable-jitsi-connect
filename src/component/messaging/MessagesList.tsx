
import React, { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Check, CheckCheck, Clock, Trash2, Heart, ThumbsUp, Laugh } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isToday, isYesterday } from 'date-fns';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  is_read: boolean;
  sender?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  image_url?: string;
  reactions?: Record<string, string[]>;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface MessagesListProps {
  messages: Message[];
  optimisticMessages: Message[];
  currentUserId: string;
  isLoading: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
}

const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  optimisticMessages,
  currentUserId,
  isLoading,
  onDeleteMessage,
  onReactToMessage
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const allMessages = [...messages, ...optimisticMessages];

  const scrollToBottom = () => {
    if (!isUserScrolled) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Only scroll to bottom on component mount or when user sends a message
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  useEffect(() => {
    if (messagesEndRef.current && shouldAutoScroll && !isLoading && !isUserScrolling) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShouldAutoScroll(false);
    }
  }, [messages.length, shouldAutoScroll, isLoading, isUserScrolling]);

  // Auto-scroll on new messages from others or own messages
  useEffect(() => {
    const lastMessage = allMessages[allMessages.length - 1];
    if (lastMessage) {
      // Always scroll for new messages
      setShouldAutoScroll(true);
      setTimeout(() => {
        if (messagesEndRef.current) {
          messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [allMessages.length]);

  // Track user scrolling
  const handleScroll = (e: React.UIEvent) => {
    const element = e.currentTarget;
    const isScrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;
    
    if (!isScrolledToBottom) {
      setIsUserScrolling(true);
    } else {
      setIsUserScrolling(false);
      setShouldAutoScroll(true);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    onDeleteMessage?.(messageId);
  };

  const handleReactToMessage = (messageId: string, emoji: string) => {
    onReactToMessage?.(messageId, emoji);
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    } else {
      return format(date, 'MMM d, HH:mm');
    }
  };

  const getMessageStatus = (message: Message, isOwn: boolean): 'sending' | 'sent' | 'delivered' | 'read' => {
    if (!isOwn) return 'read';
    if (message.status) return message.status;
    if (!message.id || message.id.startsWith('temp-')) return 'sending';
    if (message.is_read) return 'read';
    return 'delivered';
  };

  const renderMessageStatus = (message: Message, isOwn: boolean) => {
    if (!isOwn) return null;
    
    const status = getMessageStatus(message, isOwn);
    const iconClass = "h-3 w-3";
    
    switch (status) {
      case 'sending':
        return <Clock className={`${iconClass} text-muted-foreground animate-pulse`} />;
      case 'sent':
        return <Check className={`${iconClass} text-muted-foreground`} />;
      case 'delivered':
        return <CheckCheck className={`${iconClass} text-gray-500 dark:text-gray-400`} />;
      case 'read':
        return <CheckCheck className={`${iconClass} text-blue-400 dark:text-blue-300`} />;
      default:
        return <Check className={`${iconClass} text-muted-foreground`} />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-background">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full max-w-xs rounded-2xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1" onScroll={handleScroll}>
        {allMessages.map((message, index) => {
          const isOwn = message.sender_id === currentUserId;
          const showAvatar = !isOwn && (
            index === allMessages.length - 1 || 
            allMessages[index + 1]?.sender_id !== message.sender_id
          );
          const showName = !isOwn && (
            index === 0 || 
            allMessages[index - 1]?.sender_id !== message.sender_id
          );

          return (
            <div
              key={message.id || `temp-${index}`}
              className={`flex gap-3 group hover:bg-muted/30 rounded-lg p-2 transition-colors ${
                isOwn ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isOwn && (
                <div className="w-10 flex justify-center items-end">
                  {showAvatar ? (
                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                      <AvatarImage 
                        src={message.sender?.avatar_url || '/placeholder.svg'} 
                        alt={message.sender?.username || message.sender?.display_name || 'User'} 
                      />
                      <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {(message.sender?.username || message.sender?.display_name || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                </div>
              )}
              
              <div className={`max-w-[70%] space-y-1 ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                {showName && !isOwn && (
                  <span className="text-sm font-semibold text-foreground px-4">
                    {message.sender?.username || message.sender?.display_name || 'Unknown'}
                  </span>
                )}
                
                <div
                  className={`relative group/message ${
                    isOwn
                      ? 'bg-primary text-primary-foreground ml-auto rounded-[20px] rounded-br-md shadow-md'
                      : 'bg-muted text-foreground rounded-[20px] rounded-bl-md border border-border/50'
                  } ${getMessageStatus(message, isOwn) === 'sending' ? 'opacity-70' : 'opacity-100'}
                  px-4 py-3 max-w-full break-words transition-all duration-200 hover:shadow-lg`}
                >
                  {/* Message Options Dropdown */}
                  <div className="absolute -top-2 right-2 opacity-0 group-hover/message:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-background/90 hover:bg-background">
                          <span className="text-xs">⋯</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleReactToMessage(message.id, '❤️')}>
                          <Heart className="mr-2 h-4 w-4" />
                          React with ❤️
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReactToMessage(message.id, '👍')}>
                          <ThumbsUp className="mr-2 h-4 w-4" />
                          React with 👍
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleReactToMessage(message.id, '😂')}>
                          <Laugh className="mr-2 h-4 w-4" />
                          React with 😂
                        </DropdownMenuItem>
                        {isOwn && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {message.image_url && (
                    <div className="mb-3">
                      <img
                        src={message.image_url}
                        alt="Message attachment"
                        className="rounded-xl max-w-full h-auto max-h-80 object-cover border border-border/20"
                      />
                    </div>
                  )}
                  
                  {message.content && (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                      {message.content}
                    </p>
                  )}

                  {/* Reactions */}
                  {message.reactions && Object.keys(message.reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {Object.entries(message.reactions).map(([emoji, userIds]) => (
                        <button
                          key={emoji}
                          onClick={() => handleReactToMessage(message.id, emoji)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                            userIds.includes(currentUserId)
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-muted hover:bg-muted/80 border border-border'
                          }`}
                        >
                          <span>{emoji}</span>
                          <span>{userIds.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className={`flex items-center gap-1.5 mt-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    <span className={`text-xs ${
                      isOwn 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {formatMessageTime(message.created_at)}
                    </span>
                    {renderMessageStatus(message, isOwn)}
                  </div>
                </div>
              </div>
              
              {isOwn && <div className="w-10" />}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
    </div>
  );
};

export default MessagesList;
