import { useEffect, useRef } from 'react';

interface VideoCallProps {
  roomName: string;
  onClose: () => void;
}

const VideoCall = ({ roomName, onClose }: VideoCallProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://meet.jit.si') {
        return;
      }
      
      // Handle Jitsi Meet events
      if (event.data && event.data.eventType === 'readyToClose') {
        onClose();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-video-bg/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-full max-h-[90vh] rounded-2xl overflow-hidden shadow-video bg-video-surface border border-video-border">
        <div className="flex items-center justify-between p-4 bg-video-surface border-b border-video-border">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
            <h2 className="text-lg font-semibold text-primary-foreground">
              Video Call - {roomName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors"
            aria-label="Leave call"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <iframe
          ref={iframeRef}
          src={`https://meet.jit.si/${roomName}?config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.enableWelcomePage=false&config.prejoinPageEnabled=false`}
          allow="camera; microphone; fullscreen; display-capture; autoplay"
          allowFullScreen
          className="w-full h-[calc(100%-80px)] border-0"
          title={`Video call room: ${roomName}`}
        />
      </div>
    </div>
  );
};

export default VideoCall;