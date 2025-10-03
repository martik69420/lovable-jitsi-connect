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
import useMessages from '@/hooks/use-messages';
import { MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Messages = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const {
    friends,
    messages,
    loading,
    sendMessage,
    fetchMessages,
    fetchFriends,
    markMessagesAsRead,
    deleteMessage,
    reactToMessage
  } = useMessages();

  // Check for userId in URL params
  useEffect(() => {
    const userIdFromParams = searchParams.get('userId') || searchParams.get('user');
    if (userIdFromParams) {
      setSelectedUserId(userIdFromParams);
    }
  }, [searchParams]);

  // Fetch friends on mount
  useEffect(() => {
    if (user?.id) {
      console.log('User authenticated, fetching friends...');
      fetchFriends();
    }
  }, [user?.id, fetchFriends]);

  // Fetch messages and user data when selectedUserId changes
  useEffect(() => {
    if (selectedUserId && user?.id) {
      console.log('Fetching messages for selected user:', selectedUserId);
      
      const loadMessages = async () => {
        await fetchMessages(selectedUserId);
        
        // Find the selected user from friends list first
        let friend = friends.find(f => f.id === selectedUserId);
        
        // If not found in friends (friends might not be loaded yet), fetch user directly
        if (!friend) {
          try {
            const { data } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', selectedUserId)
              .single();
              
            if (data) {
              friend = {
                id: data.id,
                username: data.username,
                displayName: data.display_name || data.username,
                avatar: data.avatar_url
              };
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        }
        
        setSelectedUser(friend);
        
        // Mark messages as read after fetching
        setTimeout(() => {
          markMessagesAsRead(selectedUserId);
        }, 300);
      };
      
      loadMessages();
    }
  }, [selectedUserId, user?.id, fetchMessages, friends, markMessagesAsRead]);

  const handleSelectUser = (userId: string) => {
    console.log('Selecting user:', userId);
    setSelectedUserId(userId);
    const friend = friends.find(f => f.id === userId);
    setSelectedUser(friend);
  };

  const handleSendMessage = async (content: string, imageFile?: File, gifUrl?: string) => {
    if (selectedUserId) {
      setIsSending(true);
      try {
        await sendMessage(selectedUserId, content, imageFile, gifUrl);
      } finally {
        setIsSending(false);
      }
    }
  };

  const setActiveContact = (contact: any) => {
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

        <div className="flex h-[calc(100vh-140px)] overflow-hidden">
          {/* Contacts List - Fixed sidebar */}
          <div className={`w-80 flex-shrink-0 ${selectedUser ? 'hidden lg:block' : 'block'}`}>
            <Card className="h-full">
              <ContactsList
                contacts={friends}
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
          <div className={`flex-1 min-h-0 ml-6 ${!selectedUser ? 'hidden lg:block' : 'block'}`}>
            <Card className="h-full flex flex-col overflow-hidden">
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
                    <div className="flex-1 min-h-0">
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
                    {friends.length === 0 && !loading && (
                      <p className="text-sm text-muted-foreground mt-2">
                        You don't have any friends yet. Add some friends to start messaging!
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