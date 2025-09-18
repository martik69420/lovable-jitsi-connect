
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Message {
  id: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  image_url?: string;
  reactions?: Record<string, string[]>;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

interface UseMessagesResult {
  friends: Friend[];
  messages: Message[];
  loading: boolean;
  sendMessage: (receiverId: string, content: string, imageFile?: File, gifUrl?: string) => Promise<void>;
  fetchMessages: (contactId: string) => Promise<void>;
  fetchFriends: () => Promise<void>;
  markMessagesAsRead: (senderId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
}

const useMessages = (): UseMessagesResult => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentContactId, setCurrentContactId] = useState<string | null>(null);

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

      const friendsList = profilesData?.map(profile => ({
        id: profile.id,
        username: profile.username || profile.id.slice(0, 8),
        displayName: profile.display_name || profile.username || `User ${profile.id.slice(0, 8)}`,
        avatar: profile.avatar_url
      })) || [];

      console.log('Final friends list:', friendsList);
      setFriends(friendsList);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (contactId: string) => {
    setLoading(true);
    setCurrentContactId(contactId);
    console.log('Setting current contact ID to:', contactId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      console.log('Fetching messages between', user.id, 'and', contactId);

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(id, username, display_name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, username, display_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
        return;
      }

      console.log('Messages fetched:', data?.length || 0, 'messages');
      const typedMessages = (data || []).map(msg => ({
        ...msg,
        reactions: (msg.reactions || {}) as Record<string, string[]>
      })) as Message[];
      
      console.log('Setting messages:', typedMessages);
      setMessages(typedMessages);
      
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

      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
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
          ? { ...msg, is_read: true }
          : msg
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
          const newMessage = payload.new as any;
          
          // Check if this user is involved in this message
          const isInvolvedUser = newMessage.sender_id === user.id || newMessage.receiver_id === user.id;
          
          if (isInvolvedUser) {
            // Fetch sender profile information if missing
            if (!newMessage.sender) {
              try {
                const { data: senderProfile } = await supabase
                  .from('profiles')
                  .select('id, username, display_name, avatar_url')
                  .eq('id', newMessage.sender_id)
                  .single();
                
                if (senderProfile) {
                  newMessage.sender = senderProfile;
                }
              } catch (error) {
                console.error('Error fetching sender profile:', error);
              }
            }
            
            // Check if this message belongs to current conversation
            const belongsToCurrentConversation = !currentContactId || 
              (newMessage.sender_id === currentContactId && newMessage.receiver_id === user.id) ||
              (newMessage.sender_id === user.id && newMessage.receiver_id === currentContactId);
            
            if (belongsToCurrentConversation) {
              console.log('➡️ Adding message to current conversation');
              setMessages(prev => {
                // Prevent duplicates
                const exists = prev.some(msg => msg.id === newMessage.id);
                if (exists) {
                  console.log('⚠️ Message already exists, skipping');
                  return prev;
                }
                
                const updatedMessages = [...prev, {
                  ...newMessage,
                  reactions: (newMessage.reactions || {}) as Record<string, string[]>
                }].sort((a, b) => 
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                );
                
                console.log('✅ Message added to conversation');
                return updatedMessages;
              });
              
              // Auto-mark as read if user is receiving the message
              if (newMessage.receiver_id === user.id && currentContactId === newMessage.sender_id) {
                console.log('📖 Auto-marking message as read');
                setTimeout(() => {
                  markMessagesAsRead(newMessage.sender_id);
                }, 300);
              }
            } else {
              console.log('📝 Message for different conversation');
            }
          } else {
            console.log('👤 Message not for this user');
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
        async (payload) => {
          console.log('🔄 Message updated via realtime:', payload);
          const updatedMessage = payload.new as any;
          
          // Check if this user is involved in this message
          const isInvolvedUser = updatedMessage.sender_id === user.id || updatedMessage.receiver_id === user.id;
          
          if (isInvolvedUser) {
            // Fetch sender profile information if missing
            if (!updatedMessage.sender && updatedMessage.sender_id) {
              try {
                const { data: senderProfile } = await supabase
                  .from('profiles')
                  .select('id, username, display_name, avatar_url')
                  .eq('id', updatedMessage.sender_id)
                  .single();
                
                if (senderProfile) {
                  updatedMessage.sender = senderProfile;
                }
              } catch (error) {
                console.error('Error fetching sender profile:', error);
              }
            }
            
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
  }, [currentContactId, markMessagesAsRead]);

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

  const sendMessage = useCallback(async (receiverId: string, content: string, imageFile?: File, gifUrl?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Prevent sending empty messages without content, image, or gif
      if (!content.trim() && !imageFile && !gifUrl) return;

      console.log('Sending message from', user.id, 'to', receiverId, ':', content);

      // Create optimistic message for immediate UI feedback
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        sender_id: user.id,
        receiver_id: receiverId,
        content: content || (imageFile ? '[Image]' : (gifUrl ? '[GIF]' : '')),
        created_at: new Date().toISOString(),
        is_read: false,
        reactions: {},
        status: 'sending'
      };

      // Add optimistic message to UI
      setMessages(prev => [...prev, optimisticMessage]);

      let imageUrl: string | null = null;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const messageData: any = {
        sender_id: user.id,
        receiver_id: receiverId,
        content: content || (imageUrl ? '[Image]' : (gifUrl ? '[GIF]' : '')),
        is_read: false
      };

      if (imageUrl) {
        messageData.image_url = imageUrl;
      } else if (gifUrl) {
        messageData.image_url = gifUrl;
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

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id); // Only allow deleting own messages

      if (error) {
        console.error('Error deleting message:', error);
        return;
      }

      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, []);

  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get current message
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const currentReactions = message.reactions || {};
      const userReactions = currentReactions[emoji] || [];
      
      let updatedReactions;
      if (userReactions.includes(user.id)) {
        // Remove reaction
        const filteredUsers = userReactions.filter(id => id !== user.id);
        if (filteredUsers.length === 0) {
          updatedReactions = { ...currentReactions };
          delete updatedReactions[emoji];
        } else {
          updatedReactions = { ...currentReactions, [emoji]: filteredUsers };
        }
      } else {
        // Add reaction
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

      // Update local state
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? { ...msg, reactions: updatedReactions } : msg
      ));
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  }, [messages]);

  return {
    friends,
    messages,
    loading,
    sendMessage,
    fetchMessages,
    fetchFriends,
    markMessagesAsRead,
    deleteMessage,
    reactToMessage
  };
};

export default useMessages;
