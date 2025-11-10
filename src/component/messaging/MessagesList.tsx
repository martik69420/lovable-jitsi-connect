
import React, { useEffect, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Check, CheckCheck, Clock, Trash2, Heart, ThumbsUp, Laugh, Reply, CornerUpRight, Pin } from 'lucide-react';
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
    id?: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  image_url?: string;
  reactions?: Record<string, string[]>;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  group_id?: string;
  is_pinned?: boolean;
}

interface MessagesListProps {
  messages: Message[];
  optimisticMessages: Message[];
  currentUserId: string;
  isLoading: boolean;
  onDeleteMessage?: (messageId: string) => void;
  onReactToMessage?: (messageId: string, emoji: string) => void;
  isGroupChat?: boolean;
  onReply?: (message: Message) => void;
  onForward?: (message: Message) => void;
  onTogglePin?: (messageId: string, isPinned: boolean) => void;
}

const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  optimisticMessages,
  currentUserId,
  isLoading,
  onDeleteMessage,
  onReactToMessage,
  isGroupChat,
  onReply,
  onForward,
  onTogglePin
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

  const handleDeleteMessage = (messageId: string) => onDeleteMessage?.(messageId);
  const handleReactToMessage = (messageId: string, emoji: string) => onReactToMessage?.(messageId, emoji);
  const handleReply = (message: Message) => onReply?.(message);
  const handleForward = (message: Message) => onForward?.(message);
  const handleTogglePin = (message: Message) => onTogglePin?.(message.id, !!message.is_pinned);

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

  // Group messages by date
  const groupMessagesByDate = (messages: Message[]) => {
    const grouped: { [key: string]: Message[] } = {};
    
    messages.forEach((message) => {
      const date = new Date(message.created_at);
      let dateKey: string;
      
      if (isToday(date)) {
        dateKey = 'Today';
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday';
      } else {
        dateKey = format(date, 'MMMM d, yyyy');
      }
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(message);
    });
    
    return grouped;
  };

  const groupedMessages = groupMessagesByDate(allMessages);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto" onScroll={handleScroll}>
        <div className="p-4 space-y-6">
        {Object.entries(groupedMessages).map(([date, messages]) => (
          <div key={date} className="space-y-1">
            {/* Date separator */}
            <div className="flex justify-center my-4">
              <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                {date}
              </span>
            </div>
            
            {messages.map((message, index) => {
          const isOwn = message.sender_id === currentUserId;
          const showAvatar = isGroupChat ? (
            index === messages.length - 1 || 
            messages[index + 1]?.sender_id !== message.sender_id
          ) : (
            !isOwn && (
              index === messages.length - 1 || 
              messages[index + 1]?.sender_id !== message.sender_id
            )
          );
          const showName = isGroupChat ? (
            index === 0 || 
            messages[index - 1]?.sender_id !== message.sender_id
          ) : (
            !isOwn && (
              index === 0 || 
              messages[index - 1]?.sender_id !== message.sender_id
            )
          );

          return (
            <div
              key={message.id || `temp-${index}`}
              id={`message-${message.id}`}
              className={`flex gap-2 group transition-colors ${
                isOwn ? 'justify-end' : 'justify-start'
              }`}
            >
              {!isOwn && (
                <div className="w-8 flex justify-center items-end flex-shrink-0">
                  {showAvatar ? (
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={message.sender?.avatar_url || '/placeholder.svg'} 
                        alt={message.sender?.username || message.sender?.display_name || 'User'} 
                      />
                      <AvatarFallback className="text-xs font-medium">
                        {(message.sender?.username || message.sender?.display_name || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : null}
                </div>
              )}
              
              <div className="flex items-end gap-1.5 max-w-[65%]">
                {isOwn && (
                  <span className="text-xs text-muted-foreground self-end mb-1 whitespace-nowrap">
                    {format(new Date(message.created_at), 'HH:mm')}
                  </span>
                )}
                
                <div className="flex flex-col space-y-0.5">
                  {showName && !isOwn && (
                    <span className="text-xs font-semibold text-foreground px-3">
                      {message.sender?.display_name || message.sender?.username || 'Unknown'}
                    </span>
                  )}
                
                  <div
                    className={`relative group/message ${
                      isOwn
                        ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm'
                        : 'bg-muted text-foreground rounded-2xl rounded-bl-sm'
                    } ${getMessageStatus(message, isOwn) === 'sending' ? 'opacity-70' : 'opacity-100'}
                    px-3 py-2 max-w-full break-words transition-all duration-200`}
                  >
                  {/* Message Options Dropdown */}
                  <div className={`absolute ${isOwn ? '-top-2 left-2' : '-top-2 right-2'} opacity-0 group-hover/message:opacity-100 transition-opacity`}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 bg-background/90 hover:bg-background">
                          <span className="text-xs">⋯</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isOwn ? 'start' : 'end'} className="w-44">
                        <DropdownMenuItem onClick={() => handleReply(message)}>
                          <Reply className="mr-2 h-4 w-4" />
                          Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleForward(message)}>
                          <CornerUpRight className="mr-2 h-4 w-4" />
                          Forward
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTogglePin(message)}>
                          <Pin className="mr-2 h-4 w-4" />
                          {message.is_pinned ? 'Unpin' : 'Pin'}
                        </DropdownMenuItem>
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
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(message.reactions).map(([emoji, userIds]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReactToMessage(message.id, emoji)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
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
                  </div>
                </div>
                
                {!isOwn && (
                  <span className="text-xs text-muted-foreground self-end mb-1 whitespace-nowrap">
                    {format(new Date(message.created_at), 'HH:mm')}
                  </span>
                )}
              </div>
            </div>
          );
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default MessagesList;
