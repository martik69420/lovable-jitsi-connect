import React, { useState, useCallback } from 'react';
import { useIncomingCalls } from '@/hooks/use-incoming-calls';
import IncomingCallOverlay from './IncomingCallOverlay';
import VideoCallModal from '@/component/messaging/VideoCallModal';

const GlobalCallHandler: React.FC = () => {
  const { incomingCall, clearIncomingCall, acceptIncomingCall } = useIncomingCalls();
  const [showCallModal, setShowCallModal] = useState(false);
  const [acceptedCall, setAcceptedCall] = useState<{
    callerId: string;
    callerUsername?: string;
    callerDisplayName?: string;
    callerAvatar?: string | null;
    channelId: string;
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

  return (
    <>
      {/* Incoming call overlay - shows fullscreen when receiving a call */}
      <IncomingCallOverlay
        open={!!incomingCall}
        callerName={incomingCall?.callerDisplayName || incomingCall?.callerUsername || 'Unknown'}
        callerAvatar={incomingCall?.callerAvatar}
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
        />
      )}
    </>
  );
};

export default GlobalCallHandler;
