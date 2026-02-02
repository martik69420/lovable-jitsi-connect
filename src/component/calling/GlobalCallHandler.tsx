import React, { useState, useCallback } from 'react';
import { useIncomingCalls } from '@/hooks/use-incoming-calls';
import IncomingCallOverlay from './IncomingCallOverlay';
import VideoCallModal from '@/component/messaging/VideoCallModal';

const GlobalCallHandler: React.FC = () => {
  const { incomingCall, clearIncomingCall, acceptIncomingCall, sendCallMessage } = useIncomingCalls();
  const [showCallModal, setShowCallModal] = useState(false);
  const [acceptedCall, setAcceptedCall] = useState<{
    callerId: string;
    callerUsername?: string;
    callerDisplayName?: string;
    callerAvatar?: string | null;
    channelId: string;
    isVideo?: boolean;
  } | null>(null);

  const handleAcceptCall = useCallback(() => {
    if (incomingCall) {
      setAcceptedCall(incomingCall);
      setShowCallModal(true);
      acceptIncomingCall(); // Don't send rejection, just clear
    }
  }, [incomingCall, acceptIncomingCall]);

  const handleRejectCall = useCallback(() => {
    clearIncomingCall(); // This sends rejection message
  }, [clearIncomingCall]);

  const handleCloseCallModal = useCallback(() => {
    setShowCallModal(false);
    setAcceptedCall(null);
  }, []);

  const handleCallEnd = useCallback((type: 'outgoing' | 'incoming' | 'missed' | 'declined' | 'no_answer', duration?: number) => {
    if (acceptedCall) {
      sendCallMessage(acceptedCall.callerId, type, acceptedCall.isVideo !== false, duration);
    }
  }, [acceptedCall, sendCallMessage]);

  return (
    <>
      {/* Incoming call overlay - shows fullscreen when receiving a call */}
      <IncomingCallOverlay
        open={!!incomingCall}
        callerName={incomingCall?.callerDisplayName || incomingCall?.callerUsername || 'Unknown'}
        callerAvatar={incomingCall?.callerAvatar}
        isVideoCall={incomingCall?.isVideo !== false}
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />

      {/* Video call modal - opens after accepting the call */}
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
