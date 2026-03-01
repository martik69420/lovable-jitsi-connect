import React, { useState, useCallback, useRef } from 'react';
import { useIncomingCalls } from '@/hooks/use-incoming-calls';
import IncomingCallOverlay from './IncomingCallOverlay';
import VideoCallModal from '@/component/messaging/VideoCallModal';

interface AcceptedCall {
  callerId: string;
  callerUsername?: string;
  callerDisplayName?: string;
  callerAvatar?: string | null;
  channelId: string;
  isVideo?: boolean;
}

const GlobalCallHandler: React.FC = () => {
  const { incomingCall, clearIncomingCall, acceptIncomingCall, sendCallMessage } = useIncomingCalls();
  const [showCallModal, setShowCallModal] = useState(false);
  const [acceptedCall, setAcceptedCall] = useState<AcceptedCall | null>(null);
  const acceptedCallRef = useRef<AcceptedCall | null>(null);

  const handleAcceptCall = useCallback(() => {
    if (incomingCall) {
      const call = { ...incomingCall };
      setAcceptedCall(call);
      acceptedCallRef.current = call;
      setShowCallModal(true);
      acceptIncomingCall();
    }
  }, [incomingCall, acceptIncomingCall]);

  const handleRejectCall = useCallback(() => {
    clearIncomingCall();
  }, [clearIncomingCall]);

  const handleCloseCallModal = useCallback(() => {
    setShowCallModal(false);
    setAcceptedCall(null);
    acceptedCallRef.current = null;
  }, []);

  const handleCallEnd = useCallback((type: 'outgoing' | 'incoming' | 'missed' | 'declined' | 'no_answer', duration?: number) => {
    const call = acceptedCallRef.current;
    if (call) {
      sendCallMessage(call.callerId, type, call.isVideo !== false, duration);
    }
  }, [sendCallMessage]);

  return (
    <>
      <IncomingCallOverlay
        open={!!incomingCall}
        callerName={incomingCall?.callerDisplayName || incomingCall?.callerUsername || 'Unknown'}
        callerAvatar={incomingCall?.callerAvatar}
        isVideoCall={incomingCall?.isVideo !== false}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />

      {acceptedCall && (
        <VideoCallModal
          open={showCallModal}
          onClose={handleCloseCallModal}
          contact={{
            id: acceptedCall.callerId,
            username: acceptedCall.callerUsername,
            displayName: acceptedCall.callerDisplayName,
            avatar: acceptedCall.callerAvatar
          }}
          isIncoming={true}
          callerId={acceptedCall.callerId}
          callerInfo={{
            username: acceptedCall.callerUsername,
            displayName: acceptedCall.callerDisplayName,
            avatar: acceptedCall.callerAvatar
          }}
          onCallEnd={handleCallEnd}
        />
      )}
    </>
  );
};

export default GlobalCallHandler;
