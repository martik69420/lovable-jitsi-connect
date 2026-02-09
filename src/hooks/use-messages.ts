
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  read_at?: string | null;
  image_url?: string;
  media_url?: string;
  media_type?: string;
  reactions?: Record<string, string[]>;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  group_id?: string;
  edited_at?: string;
  reply_to?: string;
  is_pinned?: boolean;
  forwarded_from?: string;
  shared_post_id?: string;
  reply_message?: Message;
  sender?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageTime?: string;
}

export interface Group {
  id: string;
  name: string;
  avatar_url: string | null;
  description: string | null;
  memberCount?: number;
  isGroup: true;
  announcement_message?: string | null;
  announcement_updated_at?: string | null;
  created_by?: string;
}

export type Contact = Friend | Group;

interface UseMessagesResult {
  friends: Friend[];
  groups: Group[];
  messages: Message[];
  loading: boolean;
  sendMessage: (receiverId: string, content: string, imageFile?: File, gifUrl?: string, groupId?: string, replyTo?: string, forwardedFrom?: string, voiceBlob?: Blob, sharedPostId?: string) => Promise<void>;
  fetchMessages: (contactId: string, isGroup?: boolean) => Promise<void>;
  fetchFriends: () => Promise<void>;
  fetchGroups: () => Promise<void>;
  markMessagesAsRead: (senderId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  createGroup: (name: string, description: string, memberIds: string[]) => Promise<Group | null>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  pinMessage: (messageId: string, isPinned: boolean) => Promise<void>;
  muteGroup: (groupId: string, mutedUntil?: Date) => Promise<void>;
  unmuteGroup: (groupId: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
  updateGroup: (groupId: string, name: string, description: string, avatarUrl?: string) => Promise<void>;
}

const useMessages = (): UseMessagesResult => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentContactId, setCurrentContactId] = useState<string | null>(null);
  const [isGroupChat, setIsGroupChat] = useState(false);

  const fetchFriends = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        setLoading(false);
        return;
      }

      console.log('Fetching friends for user:', user.id);

      const { data: friendsData, error: friendsError } = await supabase
        .from('friends')
        .select('user_id, friend_id')
        .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (friendsError) {
        console.error('Error fetching friends:', friendsError);
        setLoading(false);
        return;
      }

      console.log('Friends data from database:', friendsData);

      if (!friendsData || friendsData.length === 0) {
        console.log('No friends found for user');
        setFriends([]);
        setLoading(false);
        return;
      }

      const friendIds = friendsData.map(f => 
        f.user_id === user.id ? f.friend_id : f.user_id
      ).filter(id => id !== user.id);
      
      console.log('Friend IDs:', friendIds);

      if (friendIds.length === 0) {
        console.log('No valid friend IDs found');
        setFriends([]);
        setLoading(false);
        return;
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', friendIds);

      if (profilesError) {
        console.error('Error fetching friend profiles:', profilesError);
        setLoading(false);
        return;
      }

      console.log('Profiles data:', profilesData);

      // Fetch unread counts and last message for each friend
      const friendsListWithUnread = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', profile.id)
            .eq('receiver_id', user.id)
            .eq('is_read', false)
            .is('group_id', null);

          // Fetch most recent message
          const { data: lastMsgData } = await supabase
            .from('messages')
            .select('content, created_at')
            .is('group_id', null)
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${profile.id}),and(sender_id.eq.${profile.id},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            id: profile.id,
            username: profile.username || profile.id.slice(0, 8),
            displayName: profile.display_name || profile.username || `User ${profile.id.slice(0, 8)}`,
            avatar: profile.avatar_url,
            unreadCount: count || 0,
            lastMessage: lastMsgData?.content || '',
            lastMessageTime: lastMsgData?.created_at || ''
          };
        })
      );

      console.log('Final friends list with unread counts:', friendsListWithUnread);
      setFriends(friendsListWithUnread);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: memberData, error: memberError } = await supabase
        .from('group_members' as any)
        .select('group_id')
        .eq('user_id', user.id);

      if (memberError || !memberData) {
        console.error('Error fetching group memberships:', memberError);
        return;
      }

      const groupIds = memberData.map((m: any) => m.group_id);
      if (groupIds.length === 0) {
        setGroups([]);
        return;
      }

      const { data: groupsData, error: groupsError } = await supabase
        .from('groups' as any)
        .select('id, name, avatar_url, description, created_by')
        .in('id', groupIds);

      if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        return;
      }

      // Count members for each group
      const groupsList = await Promise.all((groupsData || []).map(async (group: any) => {
        const { count } = await supabase
          .from('group_members' as any)
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        return {
          id: group.id,
          name: group.name,
          avatar_url: group.avatar_url,
          description: group.description,
          created_by: group.created_by,
          memberCount: count || 0,
          isGroup: true as const
        };
      }));

      setGroups(groupsList);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  }, []);

  const fetchMessages = useCallback(async (contactId: string, isGroup = false) => {
    setLoading(true);
    setCurrentContactId(contactId);
    setIsGroupChat(isGroup);
    console.log('Setting current contact ID to:', contactId, 'isGroup:', isGroup);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let data: any[] = [];
      let error: any = null;

      if (isGroup) {
        console.log('Fetching group messages for group:', contactId);
        const result = await supabase
          .from('messages' as any)
          .select('*')
          .eq('group_id', contactId)
          .order('created_at', { ascending: true });
        data = result.data || [];
        error = result.error;
      } else {
        console.log('Fetching messages between', user.id, 'and', contactId);
        const result = await supabase
          .from('messages' as any)
          .select('*')
          .is('group_id', null)
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
          .order('created_at', { ascending: true });
        data = result.data || [];
        error = result.error;
      }

      if (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
        return;
      }

      // Batch fetch all unique sender profiles in one query
      const uniqueSenderIds = [...new Set(data.map(msg => msg.sender_id))];
      
      let profilesMap: Record<string, any> = {};
      if (uniqueSenderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .in('id', uniqueSenderIds);
        
        if (profiles) {
          profilesMap = profiles.reduce((acc, profile) => {
            acc[profile.id] = profile;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Map messages with profiles from cache
      const messagesWithProfiles = data.map((msg: any) => ({
        ...msg,
        sender: profilesMap[msg.sender_id] || null,
        reactions: (msg.reactions || {}) as Record<string, string[]>
      }));

      setMessages(messagesWithProfiles as Message[]);
      
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markMessagesAsRead = useCallback(async (senderId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const readTimestamp = new Date().toISOString();
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true, read_at: readTimestamp })
        .eq('sender_id', senderId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.sender_id === senderId && msg.receiver_id === user.id && !msg.is_read
          ? { ...msg, is_read: true, read_at: readTimestamp }
          : msg
      ));

      // Reset unread count for this friend
      setFriends(prev => prev.map(friend => 
        friend.id === senderId ? { ...friend, unreadCount: 0 } : friend
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, []);

  // Set up real-time subscription for messages
  useEffect(() => {
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('🔄 Setting up real-time subscription for user:', user.id);

      // Create a unique channel for this user
      const channelName = `messages_${user.id}`;
      const channel = supabase.channel(channelName);

      // Listen for INSERT events (new messages)
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          console.log('🆕 New message received via realtime:', payload);
          const newMessage = payload.new as Message;
          
          // Check if this message belongs to a group or direct message
          const isGroupMessage = !!newMessage.group_id;
          const belongsToGroup = isGroupMessage && isGroupChat && newMessage.group_id === currentContactId;
          const isDirectMessage = !isGroupMessage && (newMessage.sender_id === user.id || newMessage.receiver_id === user.id);
          const belongsToCurrentDirectChat = isDirectMessage && !isGroupChat &&
            ((newMessage.sender_id === currentContactId && newMessage.receiver_id === user.id) ||
             (newMessage.sender_id === user.id && newMessage.receiver_id === currentContactId));
          
          // Update unread count and lastMessage for friends list
          if (!isGroupMessage && newMessage.receiver_id === user.id) {
            // Create a notification for the new message
            if (newMessage.sender_id !== currentContactId) {
              // Fetch sender info for notification
              const { data: senderProfile } = await supabase
                .from('profiles')
                .select('display_name, username')
                .eq('id', newMessage.sender_id)
                .single();
              
              const senderName = senderProfile?.display_name || senderProfile?.username || 'Someone';
              
              await supabase.from('notifications').insert({
                user_id: user.id,
                type: 'message',
                content: `${senderName} sent you a message`,
                related_id: newMessage.id,
                url: `/messages?userId=${newMessage.sender_id}`
              });
            }
            
            setFriends(prev => prev.map(friend => {
              if (friend.id === newMessage.sender_id) {
                return { 
                  ...friend, 
                  unreadCount: newMessage.sender_id !== currentContactId 
                    ? (friend.unreadCount || 0) + 1 
                    : friend.unreadCount,
                  lastMessage: newMessage.content,
                  lastMessageTime: newMessage.created_at
                };
              }
              return friend;
            }));
          }
          
          // Also update if current user sent the message (update lastMessage)
          if (!isGroupMessage && newMessage.sender_id === user.id) {
            setFriends(prev => prev.map(friend => {
              if (friend.id === newMessage.receiver_id) {
                return { 
                  ...friend, 
                  lastMessage: newMessage.content,
                  lastMessageTime: newMessage.created_at
                };
              }
              return friend;
            }));
          }
          
          if (belongsToGroup || belongsToCurrentDirectChat) {
            console.log('➡️ Adding message to current conversation');
            
            // Fetch sender profile
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, username, display_name, avatar_url')
              .eq('id', newMessage.sender_id)
              .single();
            
            setMessages(prev => {
              // Prevent duplicates
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) {
                console.log('⚠️ Message already exists, skipping');
                return prev;
              }
              
              const updatedMessages = [...prev, {
                ...newMessage,
                sender: profile,
                reactions: (newMessage.reactions || {}) as Record<string, string[]>
              }].sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              
              console.log('✅ Message added to conversation');
              return updatedMessages;
            });
            
            // Auto-mark as read if user is receiving the message (direct messages only)
            if (!isGroupMessage && newMessage.receiver_id === user.id && currentContactId === newMessage.sender_id) {
              console.log('📖 Auto-marking message as read');
              setTimeout(() => {
                markMessagesAsRead(newMessage.sender_id);
              }, 300);
            }
          } else {
            console.log('📝 Message for different conversation');
          }
        }
      );

      // Listen for UPDATE events (message reactions, read status)
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('🔄 Message updated via realtime:', payload);
          const updatedMessage = payload.new as Message;
          
          // Check if this user is involved in this message
          const isInvolvedUser = updatedMessage.sender_id === user.id || updatedMessage.receiver_id === user.id;
          
          if (isInvolvedUser) {
            const belongsToCurrentConversation = !currentContactId || 
              (updatedMessage.sender_id === currentContactId && updatedMessage.receiver_id === user.id) ||
              (updatedMessage.sender_id === user.id && updatedMessage.receiver_id === currentContactId);
            
            if (belongsToCurrentConversation) {
              console.log('🔄 Updating message in current conversation');
              setMessages(prev => prev.map(msg => 
                msg.id === updatedMessage.id ? {
                  ...updatedMessage,
                  reactions: (updatedMessage.reactions || {}) as Record<string, string[]>
                } : msg
              ));
            }
          }
        }
      );

      // Listen for DELETE events
      channel.on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('🗑️ Message deleted via realtime:', payload);
          const deletedMessage = payload.old as Message;
          
          // Check if this user is involved in this message
          const isInvolvedUser = deletedMessage.sender_id === user.id || deletedMessage.receiver_id === user.id;
          
          if (isInvolvedUser) {
            const belongsToCurrentConversation = !currentContactId || 
              (deletedMessage.sender_id === currentContactId && deletedMessage.receiver_id === user.id) ||
              (deletedMessage.sender_id === user.id && deletedMessage.receiver_id === currentContactId);
            
            if (belongsToCurrentConversation) {
              console.log('🗑️ Removing message from current conversation');
              setMessages(prev => prev.filter(msg => msg.id !== deletedMessage.id));
            }
          }
        }
      );

      // Subscribe to the channel
      channel.subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to real-time messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Failed to subscribe to real-time messages');
        }
      });

      return () => {
        console.log('🧹 Cleaning up real-time subscription');
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup.then(cleanupFn => cleanupFn?.());
    };
  }, [currentContactId, markMessagesAsRead, isGroupChat]);

  const uploadImage = async (imageFile: File): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { data, error } = await supabase.storage
        .from('message-images')
        .upload(`public/${fileName}`, imageFile);

      if (error) {
        console.error('Error uploading image:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(`public/${fileName}`);

      return publicUrl;
    } catch (error) {
      console.error('Exception during image upload:', error);
      return null;
    }
  };

  const uploadVoice = async (voiceBlob: Blob): Promise<string | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const fileName = `${user.id}/${Date.now()}-voice.webm`;
      const { data, error } = await supabase.storage
        .from('voice-messages')
        .upload(fileName, voiceBlob, {
          contentType: 'audio/webm'
        });

      if (error) {
        console.error('Error uploading voice:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('voice-messages')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Exception during voice upload:', error);
      return null;
    }
  };

  const sendMessage = useCallback(async (receiverId: string, content: string, imageFile?: File, gifUrl?: string, groupId?: string, replyTo?: string, forwardedFrom?: string, voiceBlob?: Blob, sharedPostId?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Prevent sending empty messages without content, image, gif, voice, or shared post
      if (!content.trim() && !imageFile && !gifUrl && !voiceBlob && !sharedPostId) return;

      console.log('Sending message from', user.id, groupId ? `to group ${groupId}` : `to ${receiverId}`, ':', content);

      // Fetch current user profile for optimistic message
      const { data: currentUserProfile } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', user.id)
        .single();

      // Create optimistic message for immediate UI feedback
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        sender_id: user.id,
        receiver_id: groupId ? '' : receiverId,
        content: content || (imageFile ? '[Image]' : (gifUrl ? '[GIF]' : (voiceBlob ? '[Voice Message]' : (sharedPostId ? '[Shared Post]' : '')))),
        created_at: new Date().toISOString(),
        is_read: false,
        reactions: {},
        status: 'sending',
        group_id: groupId,
        reply_to: replyTo,
        forwarded_from: forwardedFrom,
        shared_post_id: sharedPostId,
        sender: currentUserProfile || undefined
      };

      // Add optimistic message to UI
      setMessages(prev => [...prev, optimisticMessage]);

      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      let voiceUrl: string | null = null;
      if (voiceBlob) {
        voiceUrl = await uploadVoice(voiceBlob);
      }

      const messageData: any = {
        sender_id: user.id,
        content: content || (imageUrl ? '[Image]' : (gifUrl ? '[GIF]' : (voiceUrl ? '[Voice Message]' : (sharedPostId ? '[Shared Post]' : '')))),
        is_read: false
      };

      if (groupId) {
        messageData.group_id = groupId;
      } else {
        messageData.receiver_id = receiverId;
      }

      if (replyTo) {
        messageData.reply_to = replyTo;
      }

      if (forwardedFrom) {
        messageData.forwarded_from = forwardedFrom;
      }

      if (sharedPostId) {
        messageData.shared_post_id = sharedPostId;
      }

      if (imageUrl) {
        messageData.image_url = imageUrl;
      } else if (gifUrl) {
        messageData.image_url = gifUrl;
      }

      if (voiceUrl) {
        messageData.media_url = voiceUrl;
        messageData.media_type = 'audio';
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select('*')
        .single();

      if (error) {
        console.error('Error sending message:', error);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        return;
      }

      console.log('Message sent successfully:', data);
      
      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { 
          ...data, 
          reactions: (data.reactions || {}) as Record<string, string[]>
        } as Message : msg
      ));
      
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, []);

  const createGroup = useCallback(async (name: string, description: string, memberIds: string[]): Promise<Group | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Create the group
      const { data: groupData, error: groupError } = await supabase
        .from('groups' as any)
        .insert({
          name,
          description,
          created_by: user.id
        })
        .select('*')
        .single() as any;

      if (groupError || !groupData) {
        console.error('Error creating group:', groupError);
        return null;
      }

      // Add members (creator is auto-added by DB trigger)
      const membersToAdd = memberIds.map(id => ({ group_id: groupData.id as string, user_id: id, role: 'member' }));

      const { error: membersError } = await supabase
        .from('group_members' as any)
        .insert(membersToAdd);

      if (membersError) {
        console.error('Error adding group members:', membersError);
        return null;
      }

      const newGroup: Group = {
        id: groupData.id as string,
        name: groupData.name as string,
        avatar_url: groupData.avatar_url as string | null,
        description: groupData.description as string | null,
        memberCount: (membersToAdd.length + 1),
        isGroup: true
      };

      setGroups(prev => [...prev, newGroup]);
      return newGroup;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) {
        console.error('Error deleting message:', error);
        return;
      }

      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, []);

  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const currentReactions = message.reactions || {};
      const userReactions = currentReactions[emoji] || [];
      
      let updatedReactions;
      if (userReactions.includes(user.id)) {
        const filteredUsers = userReactions.filter(id => id !== user.id);
        if (filteredUsers.length === 0) {
          updatedReactions = { ...currentReactions };
          delete updatedReactions[emoji];
        } else {
          updatedReactions = { ...currentReactions, [emoji]: filteredUsers };
        }
      } else {
        updatedReactions = { ...currentReactions, [emoji]: [...userReactions, user.id] };
      }

      const { error } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);

      if (error) {
        console.error('Error updating message reactions:', error);
        return;
      }

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, reactions: updatedReactions } : msg
      ));
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  }, [messages]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .update({ 
          content: newContent,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('sender_id', user.id);

      if (error) {
        console.error('Error editing message:', error);
        return;
      }

      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newContent, edited_at: new Date().toISOString() }
          : msg
      ));
    } catch (error) {
      console.error('Error editing message:', error);
    }
  }, []);

  const pinMessage = useCallback(async (messageId: string, isPinned: boolean) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_pinned: isPinned })
        .eq('id', messageId);

      if (error) {
        console.error('Error pinning message:', error);
        return;
      }

      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, is_pinned: isPinned } : msg
      ));
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  }, []);

  const muteGroup = useCallback(async (groupId: string, mutedUntil?: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('muted_groups')
        .upsert({
          user_id: user.id,
          group_id: groupId,
          muted_until: mutedUntil?.toISOString() || null
        });

      if (error) {
        console.error('Error muting group:', error);
      }
    } catch (error) {
      console.error('Error muting group:', error);
    }
  }, []);

  const unmuteGroup = useCallback(async (groupId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('muted_groups')
        .delete()
        .eq('user_id', user.id)
        .eq('group_id', groupId);

      if (error) {
        console.error('Error unmuting group:', error);
      }
    } catch (error) {
      console.error('Error unmuting group:', error);
    }
  }, []);

  const leaveGroup = useCallback(async (groupId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('user_id', user.id)
        .eq('group_id', groupId);

      if (error) {
        console.error('Error leaving group:', error);
        return;
      }

      // Remove group from local state
      setGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  }, []);

  const deleteGroup = useCallback(async (groupId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Delete group (messages and members will cascade delete)
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
        .eq('created_by', user.id);

      if (error) {
        console.error('Error deleting group:', error);
        return;
      }

      // Remove group from local state
      setGroups(prev => prev.filter(g => g.id !== groupId));
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  }, []);

  const updateGroup = useCallback(async (groupId: string, name: string, description: string, avatarUrl?: string) => {
    try {
      const updateData: any = { name, description };
      if (avatarUrl !== undefined) {
        updateData.avatar_url = avatarUrl;
      }

      const { error } = await supabase
        .from('groups')
        .update(updateData)
        .eq('id', groupId);

      if (error) {
        console.error('Error updating group:', error);
        return;
      }

      // Update local state
      setGroups(prev => prev.map(g => 
        g.id === groupId 
          ? { ...g, name, description, avatar_url: avatarUrl ?? g.avatar_url }
          : g
      ));
    } catch (error) {
      console.error('Error updating group:', error);
    }
  }, []);

  return {
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
  };
};

export default useMessages;
