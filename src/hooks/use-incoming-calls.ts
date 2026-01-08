import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

interface IncomingCall {
  callerId: string;
  callerUsername?: string;
  callerDisplayName?: string;
  callerAvatar?: string | null;
}

export const useIncomingCalls = () => {
  const { user } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    // Listen for incoming calls from all potential callers
    // We create a channel that listens for calls to this user
    const channel = supabase.channel(`incoming_calls_${user.id}`, {
      config: { broadcast: { self: false } }
    });

    channel
      .on('broadcast', { event: 'call_request' }, ({ payload }) => {
        if (payload.targetId === user.id) {
          setIncomingCall({
            callerId: payload.callerId,
            callerUsername: payload.callerUsername,
            callerDisplayName: payload.callerDisplayName,
            callerAvatar: payload.callerAvatar
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const clearIncomingCall = () => {
    setIncomingCall(null);
  };

  return { incomingCall, clearIncomingCall };
};