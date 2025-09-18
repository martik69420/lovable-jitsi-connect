import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Badge } from '@/component/ui/badge';
import { Button } from '@/component/ui/button';
import { Input } from '@/component/ui/input';
import { Skeleton } from '@/component/ui/skeleton';
import OnlineStatus from '@/component/OnlineStatus';
import { Search, PlusCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import GroupChatCreator from './GroupChatCreator';

interface Contact {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface ContactsListProps {
  contacts: Contact[];
  activeContactId: string;
  setActiveContact: (contact: Contact) => void;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNewChat: () => void;
}

const ContactsList: React.FC<ContactsListProps> = ({
  contacts,
  activeContactId,
  setActiveContact,
  isLoading,
  searchQuery,
  setSearchQuery,
  onNewChat,
}) => {
  const formatLastMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    
    const messageDate = new Date(dateString);
    const now = new Date();
    
    // If today, show time
    if (messageDate.toDateString() === now.toDateString()) {
      return messageDate.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    // If this week, show day name
    const diff = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 7) {
      return messageDate.toLocaleDateString(undefined, { weekday: 'short' });
    }
    
    // Otherwise show date
    return messageDate.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      contact.displayName.toLowerCase().includes(query) ||
      contact.username.toLowerCase().includes(query)
    );
  });

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-3 dark:border-gray-800 sticky top-0 bg-background z-10">
        <h2 className="text-xl font-bold mb-3">Messages</h2>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <GroupChatCreator />
          <Button variant="outline" size="icon" onClick={onNewChat}>
            <PlusCircle className="h-5 w-5" />
            <span className="sr-only">New message</span>
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto chat-scrollbar max-h-[calc(100vh-180px)]">
        {isLoading ? (
          // Loading skeletons
          <>
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border-b dark:border-gray-800">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </div>
            ))}
          </>
        ) : filteredContacts.length === 0 ? (
          // Empty state - check if it's due to search or no contacts
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
            <div className="bg-muted/40 p-4 rounded-full mb-4">
              <User className="h-8 w-8" />
            </div>
            {searchQuery.trim() ? (
              <>
                <p className="font-medium mb-1">No friends found</p>
                <p className="text-sm">Try adjusting your search terms</p>
              </>
            ) : (
              <>
                <p className="font-medium mb-1">No conversations yet</p>
                <p className="text-sm">Start messaging your friends</p>
                <Button onClick={onNewChat} className="mt-4" variant="outline">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Start a conversation
                </Button>
              </>
            )}
          </div>
        ) : (
          // Contact list
          filteredContacts.map((contact) => (
            <button
              key={contact.id}
              className={cn(
                'flex items-center gap-3 p-3 hover:bg-muted/50 w-full text-left border-b relative transition-colors dark:border-gray-800',
                contact.id === activeContactId && 'bg-muted'
              )}
              onClick={() => setActiveContact(contact)}
            >
              <div className="relative">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.displayName || contact.username} />
                  <AvatarFallback>
                    {contact.displayName?.charAt(0) || contact.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <OnlineStatus userId={contact.id} className="absolute -bottom-1 -right-1" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium truncate">
                    {contact.displayName}
                    <span className="font-normal text-muted-foreground text-sm ml-1">
                      @{contact.username}
                    </span>
                  </h3>
                  {contact.lastMessageTime && (
                    <span className="text-xs text-muted-foreground">
                      {formatLastMessageTime(contact.lastMessageTime)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {contact.lastMessage || "Start a conversation"}
                </p>
              </div>
              
              {(contact.unreadCount || 0) > 0 && (
                <span className="absolute top-3 right-3 bg-primary text-white h-5 min-w-5 flex items-center justify-center text-xs px-1.5 rounded-full font-medium">
                  {contact.unreadCount}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactsList;
