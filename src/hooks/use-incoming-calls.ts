import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

interface IncomingCall {
  callerId: string;
  callerUsername?: string;
  callerDisplayName?: string;
  callerAvatar?: string | null;
  channelId: string;
  isVideo?: boolean;
  startTime?: number;
}

export const useIncomingCalls = () => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const channelsRef = useRef<Map<string, any>>(new Map());
  const friendsRef = useRef<string[]>([]);
  const callStartTimeRef = useRef<number | null>(null);

  // Helper to send a call message to the chat
  const sendCallMessage = useCallback(async (
    receiverId: string,
    callType: 'outgoing' | 'incoming' | 'missed' | 'declined' | 'no_answer',
    isVideo: boolean = true,
    duration?: number
  ) => {
    if (!user?.id) return;
    
    const content = `[CALL:${callType}:${isVideo}:${duration || ''}]`;
    
    try {
      await supabase.from('messages').insert({
        sender_id: user.id,
        receiver_id: receiverId,
        content,
        is_read: false
      });
    } catch (error) {
      console.error('Error sending call message:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Fetch friends to set up call listeners for each potential caller
    const setupCallListeners = async () => {
      try {
        // Get all friends (accepted friend requests in either direction)
        const { data: friendsData } = await supabase
          .from('friends')
          .select('user_id, friend_id')
          .eq('status', 'accepted')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (!friendsData) return;

        // Extract friend IDs
        const friendIds = friendsData.map(f => 
          f.user_id === user.id ? f.friend_id : f.user_id
        ).filter(Boolean) as string[];

        friendsRef.current = friendIds;

        // Create a channel for each friend to listen for their calls
        friendIds.forEach(friendId => {
          const channelId = [user.id, friendId].sort().join('_');
          
          // Skip if already listening
          if (channelsRef.current.has(channelId)) return;

          const channel = supabase.channel(`call_${channelId}`, {
            config: { broadcast: { self: false } }
          });

          channel
            .on('broadcast', { event: 'call_request' }, ({ payload }) => {
              if (payload.targetId === user.id) {
                console.log('Incoming call from:', payload.callerId);
                callStartTimeRef.current = Date.now();
                setIncomingCall({
                  callerId: payload.callerId,
                  callerUsername: payload.callerUsername,
                  callerDisplayName: payload.callerDisplayName,
                  callerAvatar: payload.callerAvatar,
                  channelId,
                  isVideo: payload.isVideo !== false,
                  startTime: Date.now()
                });
              }
            })
            .on('broadcast', { event: 'call_end' }, ({ payload }) => {
              // Clear incoming call if the caller ended it
              if (incomingCall?.callerId === payload.callerId || payload.targetId === user.id) {
                // If we had an incoming call that wasn't answered, mark as missed
                if (incomingCall && callStartTimeRef.current) {
                  sendCallMessage(incomingCall.callerId, 'missed', incomingCall.isVideo);
                }
                setIncomingCall(null);
                callStartTimeRef.current = null;
              }
            })
            .on('broadcast', { event: 'call_timeout' }, ({ payload }) => {
              // Caller timed out waiting for answer
              if (payload.targetId === user.id && incomingCall) {
                sendCallMessage(payload.callerId, 'missed', true);
                setIncomingCall(null);
                callStartTimeRef.current = null;
              }
            })
            .subscribe((status) => {
              console.log(`Call listener for ${channelId}:`, status);
            });

          channelsRef.current.set(channelId, channel);
        });
      } catch (error) {
        console.error('Error setting up call listeners:', error);
      }
    };

    setupCallListeners();

    // Also listen for friend list changes to update listeners
    const friendsChannel = supabase
      .channel('friends_changes_for_calls')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'friends',
          filter: `or(user_id.eq.${user.id},friend_id.eq.${user.id})`
        },
        () => {
          // Refresh listeners when friends change
          setupCallListeners();
        }
      )
      .subscribe();

    return () => {
      // Clean up all channels
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
      supabase.removeChannel(friendsChannel);
    };
  }, [user?.id, sendCallMessage]);

  const clearIncomingCall = useCallback(() => {
    // Send rejection to the caller before clearing
    if (incomingCall && channelsRef.current.has(incomingCall.channelId)) {
      const channel = channelsRef.current.get(incomingCall.channelId);
      channel?.send({
        type: 'broadcast',
        event: 'call_rejected',
        payload: { targetId: incomingCall.callerId }
      });
      
      // Send declined message
      sendCallMessage(incomingCall.callerId, 'declined', incomingCall.isVideo);
    }
    setIncomingCall(null);
    callStartTimeRef.current = null;
  }, [incomingCall, sendCallMessage]);

  const acceptIncomingCall = useCallback(() => {
    // Just clear the state - the acceptance is handled in the VideoCallModal
    callStartTimeRef.current = null;
    setIncomingCall(null);
  }, []);

  return { incomingCall, clearIncomingCall, acceptIncomingCall, sendCallMessage };
};
