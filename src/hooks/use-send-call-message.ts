import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

export const useSendCallMessage = () => {
  const { user } = useAuth();

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

  return { sendCallMessage };
};
