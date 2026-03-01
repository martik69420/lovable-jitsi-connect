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
  const incomingCallRef = useRef<IncomingCall | null>(null);

  // Keep ref in sync
  useEffect(() => {
    incomingCallRef.current = incomingCall;
  }, [incomingCall]);

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
      console.log('Call message sent:', content);
    } catch (error) {
      console.error('Error sending call message:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const setupCallListeners = async () => {
      try {
        const { data: friendsData } = await supabase
          .from('friends')
          .select('user_id, friend_id')
          .eq('status', 'accepted')
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

        if (!friendsData) return;

        const friendIds = friendsData.map(f => 
          f.user_id === user.id ? f.friend_id : f.user_id
        ).filter(Boolean) as string[];

        friendIds.forEach(friendId => {
          const channelId = [user.id, friendId].sort().join('_');
          
          if (channelsRef.current.has(channelId)) return;

          const channel = supabase.channel(`call_${channelId}`, {
            config: { broadcast: { self: false } }
          });

          channel
            .on('broadcast', { event: 'call_request' }, ({ payload }) => {
              if (payload.targetId === user.id) {
                console.log('Incoming call from:', payload.callerId);
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
              const current = incomingCallRef.current;
              if (current?.callerId === payload.callerId || payload.targetId === user.id) {
                if (current) {
                  sendCallMessage(current.callerId, 'missed', current.isVideo !== false);
                }
                setIncomingCall(null);
              }
            })
            .on('broadcast', { event: 'call_timeout' }, ({ payload }) => {
              const current = incomingCallRef.current;
              if (payload.targetId === user.id && current) {
                sendCallMessage(payload.callerId, 'missed', true);
                setIncomingCall(null);
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
        () => setupCallListeners()
      )
      .subscribe();

    return () => {
      channelsRef.current.forEach(channel => {
        supabase.removeChannel(channel);
      });
      channelsRef.current.clear();
      supabase.removeChannel(friendsChannel);
    };
  }, [user?.id, sendCallMessage]);

  const clearIncomingCall = useCallback(() => {
    const current = incomingCallRef.current;
    if (current && channelsRef.current.has(current.channelId)) {
      const channel = channelsRef.current.get(current.channelId);
      channel?.send({
        type: 'broadcast',
        event: 'call_rejected',
        payload: { targetId: current.callerId }
      });
      sendCallMessage(current.callerId, 'declined', current.isVideo !== false);
    }
    setIncomingCall(null);
  }, [sendCallMessage]);

  const acceptIncomingCall = useCallback(() => {
    setIncomingCall(null);
  }, []);

  return { incomingCall, clearIncomingCall, acceptIncomingCall, sendCallMessage };
};
