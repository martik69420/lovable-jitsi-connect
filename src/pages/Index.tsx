import { useState } from 'react';
import VideoCall from '../components/VideoCall';
import VideoCallLanding from '../components/VideoCallLanding';

const Index = () => {
  const [isInCall, setIsInCall] = useState(false);
  const roomName = 'lovableRoom123';

  const handleJoinCall = () => {
    setIsInCall(true);
  };

  const handleLeaveCall = () => {
    setIsInCall(false);
  };

  return (
    <>
      {isInCall ? (
        <VideoCall roomName={roomName} onClose={handleLeaveCall} />
      ) : (
        <VideoCallLanding onJoinCall={handleJoinCall} />
      )}
    </>
  );
};

export default Index;