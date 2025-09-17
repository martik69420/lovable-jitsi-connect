import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '@/component/layout/AppLayout';
import ContactsList from '@/component/messaging/ContactsList';
import ChatHeader from '@/component/messaging/ChatHeader';
import MessagesList from '@/component/messaging/MessagesList';
import MessageInput from '@/component/messaging/MessageInput';
import { TypingIndicator } from '@/component/messaging/TypingIndicator';
import { Card } from '@/component/ui/card';
import { useAuth } from '@/context/auth';
import { useLanguage } from '@/context/LanguageContext';
import useMessages, { Friend, Group } from '@/hooks/use-messages';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Contact interface that works with both friends and groups
interface Contact {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isGroup?: boolean;
}

// Message interface for MessagesList component
interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id?: string;
  group_id?: string;
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

const Messages = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const {
    contacts: rawContacts,
    messages: rawMessages,
    loading,
    sendMessage,
    fetchMessages,
    fetchFriends,
    fetchGroups,
    markMessagesAsRead,
    deleteMessage,
    reactToMessage
  } = useMessages();

  // Transform contacts to match ContactsList interface
  const contacts: Contact[] = rawContacts.map((contact) => {
    if ('isGroup' in contact) {
      // Group contact
      return {
        id: contact.id,
        username: contact.name,
        displayName: contact.name,
        avatar: contact.avatar_url || null,
        isGroup: true
      };
    } else {
      // Friend contact
      return {
        id: contact.id,
        username: contact.username,
        displayName: contact.displayName,
        avatar: contact.avatar
      };
    }
  });

  // Transform messages to match MessagesList interface
  const messages: Message[] = rawMessages.map((msg) => ({
    id: msg.id,
    content: msg.content,
    created_at: msg.created_at,
    sender_id: msg.sender_id,
    receiver_id: msg.receiver_id,
    group_id: msg.group_id,
    is_read: msg.is_read,
    image_url: msg.image_url,
    reactions: msg.reactions,
    status: msg.status
  }));

  // Check for userId in URL params
  useEffect(() => {
    const userIdFromParams = searchParams.get('userId') || searchParams.get('user');
    if (userIdFromParams) {
      setSelectedUserId(userIdFromParams);
    }
  }, [searchParams]);

  // Fetch friends and groups on mount
  useEffect(() => {
    if (user?.id) {
      console.log('User authenticated, fetching friends and groups...');
      fetchFriends();
      fetchGroups();
    }
  }, [user?.id, fetchFriends, fetchGroups]);

  // Fetch messages and user data when selectedUserId changes
  useEffect(() => {
    if (selectedUserId && user?.id) {
      console.log('Fetching messages for selected user:', selectedUserId);
      
      const loadMessages = async () => {
        await fetchMessages(selectedUserId);
        
        // Find the selected contact (friend or group)
        let contact = contacts.find(c => c.id === selectedUserId);
        const isGroup = contact && 'isGroup' in contact;
        
        // If not found in contacts (might not be loaded yet), fetch user directly
        if (!contact) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', selectedUserId)
              .single();
              
            if (data) {
              contact = {
                id: data.id,
                username: data.username || 'Unknown',
                displayName: data.display_name || data.username || 'Unknown User',
                avatar: data.avatar_url || '/placeholder.svg'
              };
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
            // Create fallback contact for unknown users
            contact = {
              id: selectedUserId,
              username: 'unknown',
              displayName: 'Unknown User',
              avatar: '/placeholder.svg'
            };
          }
        }
        
        setSelectedUser(contact);
        
        // Mark messages as read after fetching
        setTimeout(() => {
          markMessagesAsRead(selectedUserId, isGroup);
        }, 300);
      };
      
      loadMessages();
    }
  }, [selectedUserId, user?.id, fetchMessages, contacts, markMessagesAsRead]);

  const handleSelectUser = (userId: string) => {
    console.log('Selecting user:', userId);
    setSelectedUserId(userId);
    const contact = rawContacts.find(c => c.id === userId);
    
    // Transform contact for selectedUser state
    if (contact) {
      if ('isGroup' in contact) {
        setSelectedUser({
          id: contact.id,
          username: contact.name,
          displayName: contact.name,
          avatar: contact.avatar_url || null,
          isGroup: true
        });
      } else {
        setSelectedUser({
          id: contact.id,
          username: contact.username,
          displayName: contact.displayName,
          avatar: contact.avatar
        });
      }
    }
  };

  const handleSendMessage = async (content: string, imageFile?: File, gifUrl?: string) => {
    if (selectedUserId && selectedUser) {
      setIsSending(true);
      const isGroup = selectedUser.isGroup || false;
      try {
        await sendMessage(selectedUserId, content, imageFile, gifUrl, isGroup);
      } finally {
        setIsSending(false);
      }
    }
  };

  const setActiveContact = (contact: Contact) => {
    console.log('Setting active contact:', contact);
    setSelectedUserId(contact.id);
    setSelectedUser(contact);
  };

  const handleNewChat = () => {
    console.log('New chat clicked');
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">{t('messages.title')}</h1>
          <p className="text-muted-foreground">{t('messages.chatWithFriends')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Contacts List - Hidden on mobile when chat is active */}
          <div className={`lg:col-span-4 ${selectedUser ? 'hidden lg:block' : 'block'}`}>
            <Card className="h-full">
              <ContactsList
                contacts={contacts}
                activeContactId={selectedUserId || ''}
                setActiveContact={setActiveContact}
                isLoading={loading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onNewChat={handleNewChat}
              />
            </Card>
          </div>

          {/* Chat Area - Hidden on mobile when no chat selected */}
          <div className={`lg:col-span-8 ${!selectedUser ? 'hidden lg:block' : 'block'}`}>
            <Card className="h-full flex flex-col">
              {selectedUser ? (
                <>
                  <div className="border-b">
                    <ChatHeader 
                      contact={selectedUser} 
                      onOpenUserActions={() => console.log('Open user actions')}
                      onBack={() => {
                        setSelectedUserId(null);
                        setSelectedUser(null);
                      }}
                    />
                  </div>
                  <div className="flex-1 min-h-0 flex flex-col">
                    <div className="flex-1">
                      <MessagesList
                        messages={messages}
                        optimisticMessages={[]}
                        currentUserId={user?.id || ''}
                        isLoading={loading}
                        onDeleteMessage={deleteMessage}
                        onReactToMessage={reactToMessage}
                      />
                    </div>
                    {selectedUserId && (
                      <TypingIndicator receiverId={selectedUserId} />
                    )}
                  </div>
                  <MessageInput 
                    onSendMessage={handleSendMessage}
                    isSending={isSending}
                    receiverId={selectedUserId || undefined}
                  />
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">{t('messages.noConversation')}</h3>
                    <p className="text-muted-foreground mt-1">
                      {t('messages.selectContact')}
                    </p>
                    {contacts.length === 0 && !loading && (
                      <p className="text-sm text-muted-foreground mt-2">
                        You don't have any contacts yet. Add some friends or create a group to start messaging!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;