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
import { useChatPreferences } from '@/hooks/use-chat-preferences';
import { ThemeSelector } from '@/component/messaging/ThemeSelectorDialog';
import PinnedMessages from '@/component/messaging/PinnedMessages';
import ForwardMessageDialog from '@/component/messaging/ForwardMessageDialog';

const Messages = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [forwardMessage, setForwardMessage] = useState<any | null>(null);
  
  const [replyingTo, setReplyingTo] = useState<{ id: string; content: string; sender: string } | null>(null);
  
  const { preferences, savePreferences } = useChatPreferences(
    user?.id,
    selectedUserId,
    isGroupChat ? 'group' : 'direct'
  );
  
  const {
    friends,
    groups,
    messages,
    loading,
    sendMessage,
    fetchMessages,
    fetchFriends,
    fetchGroups,
    markMessagesAsRead,
    deleteMessage,
    reactToMessage,
    createGroup,
    editMessage,
    pinMessage,
    muteGroup,
    unmuteGroup,
    leaveGroup,
    deleteGroup,
    updateGroup
  } = useMessages();

  // Check for userId in URL params
  useEffect(() => {
    const userIdFromParams = searchParams.get('userId') || searchParams.get('user');
    if (userIdFromParams) {
      setSelectedUserId(userIdFromParams);
      setIsGroupChat(false);
    }
  }, [searchParams]);

  // Fetch friends and groups on mount
  useEffect(() => {
    if (user?.id) {
      console.log('User authenticated, fetching friends and groups...');
      fetchFriends();
      fetchGroups();
    }
  }, [user?.id]);

  // Fetch messages and user/group data when selectedUserId changes
  useEffect(() => {
    if (selectedUserId && user?.id) {
      console.log('Fetching messages for selected contact:', selectedUserId, 'isGroup:', isGroupChat);
      
      const loadMessages = async () => {
        await fetchMessages(selectedUserId, isGroupChat);
        
        if (isGroupChat) {
          // Find the group
          const group = groups.find(g => g.id === selectedUserId);
          setSelectedUser(group);
        } else {
          // Find the friend
          let friend = friends.find(f => f.id === selectedUserId);
          
          // If not found in friends list, fetch user directly
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
        }
      };
      
      loadMessages();
    }
  }, [selectedUserId, isGroupChat, user?.id]);

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
        if (isGroupChat) {
          await sendMessage('', content, imageFile, gifUrl, selectedUserId);
        } else {
          await sendMessage(selectedUserId, content, imageFile, gifUrl);
        }
      } finally {
        setIsSending(false);
      }
    }
  };

  const setActiveContact = (contact: any, isGroup = false) => {
    console.log('Setting active contact:', contact, 'isGroup:', isGroup);
    setSelectedUserId(contact.id);
    setSelectedUser(contact);
    setIsGroupChat(isGroup);
  };

  const handleGroupCreated = async (groupId: string) => {
    // Refresh groups list
    await fetchGroups();
    // Select the newly created group
    const newGroup = groups.find(g => g.id === groupId);
    if (newGroup) {
      setActiveContact(newGroup, true);
    }
  };

  const handleNewChat = () => {
    console.log('New chat clicked');
  };

  // Get pinned messages
  const pinnedMessages = messages.filter(msg => msg.is_pinned);

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
                groups={groups}
                activeContactId={selectedUserId || ''}
                setActiveContact={setActiveContact}
                isLoading={loading}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onNewChat={handleNewChat}
                createGroup={createGroup}
                onGroupCreated={handleGroupCreated}
              />
            </Card>
          </div>

          {/* Chat Area - Hidden on mobile when no chat selected */}
          <div className={`flex-1 min-h-0 ml-6 ${!selectedUser ? 'hidden lg:block' : 'block'}`}>
            <Card 
              className="h-full flex flex-col overflow-hidden"
              style={{
                background: preferences.background || undefined,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              {selectedUser ? (
                <>
                  <div className="border-b bg-background/95 backdrop-blur-sm">
                    <ChatHeader 
                      contact={selectedUser} 
                      onOpenUserActions={() => console.log('Open user actions')}
                      onBack={() => {
                        setSelectedUserId(null);
                        setSelectedUser(null);
                      }}
                      isGroupChat={isGroupChat}
                      onMembersUpdated={() => {
                        fetchGroups();
                        if (selectedUserId && isGroupChat) {
                          const group = groups.find(g => g.id === selectedUserId);
                          if (group) setSelectedUser(group as any);
                        }
                      }}
                      onLeaveGroup={leaveGroup}
                      onMuteGroup={muteGroup}
                      onUnmuteGroup={unmuteGroup}
                      onDeleteGroup={deleteGroup}
                      isCreator={isGroupChat && (selectedUser as any)?.created_by === user?.id}
                      messages={messages}
                      onMessageSelect={(msgId) => {
                        const element = document.getElementById(`message-${msgId}`);
                        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }}
                      onOpenThemeSelector={() => setShowThemeSelector(true)}
                    />
                  </div>
                  <div 
                    className="flex-1 min-h-0 flex flex-col"
                    data-theme={preferences.theme}
                  >
                    {/* Pinned Messages */}
                    {pinnedMessages.length > 0 && (
                      <PinnedMessages
                        messages={pinnedMessages}
                        onUnpin={(msgId) => pinMessage(msgId, false)}
                        onMessageClick={(msgId) => {
                          const element = document.getElementById(`message-${msgId}`);
                          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        canUnpin={isGroupChat && (selectedUser as any)?.created_by === user?.id}
                      />
                    )}
                    
                    <div className="flex-1 min-h-0 flex flex-col">
                      <MessagesList
                        messages={messages}
                        optimisticMessages={[]}
                        currentUserId={user?.id || ''}
                        isLoading={loading}
                        onDeleteMessage={deleteMessage}
                        onReactToMessage={reactToMessage}
                        isGroupChat={isGroupChat}
                        onReply={(m:any) => setReplyingTo({ id: m.id, content: m.content, sender: m.sender?.display_name || m.sender?.username || 'Unknown' })}
                        onTogglePin={(id:string, isPinned:boolean) => pinMessage(id, !isPinned)}
                        onForward={(m:any) => setForwardMessage(m)}
                      />
                      {selectedUserId && (
                        <div className="mt-auto">
                          <TypingIndicator receiverId={selectedUserId} />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="bg-background/95 backdrop-blur-sm">
                    <MessageInput 
                      onSendMessage={handleSendMessage}
                      isSending={isSending}
                      receiverId={selectedUserId || undefined}
                      replyingTo={replyingTo}
                      onCancelReply={() => setReplyingTo(null)}
                    />
                  </div>
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

      {/* Theme Selector Dialog */}
      {showThemeSelector && (
        <ThemeSelector
          currentTheme={preferences.theme}
          currentBackground={preferences.background}
          onThemeChange={(theme) => savePreferences({ theme })}
          onBackgroundChange={(background) => savePreferences({ background })}
          onClose={() => setShowThemeSelector(false)}
        />
      )}

      {/* Forward Message Dialog */}
      <ForwardMessageDialog
        open={!!forwardMessage}
        onOpenChange={(open) => !open && setForwardMessage(null)}
        message={forwardMessage}
        friends={friends as any}
        groups={groups as any}
        onSelect={async (targetId: string, isGroup: boolean) => {
          if (!forwardMessage) return;
          try {
            if (isGroup) {
              await sendMessage('', forwardMessage.content || '', undefined, undefined, targetId);
            } else {
              await sendMessage(targetId, forwardMessage.content || '');
            }
          } finally {
            setForwardMessage(null);
          }
        }}
      />
    </AppLayout>
  );
};

export default Messages;