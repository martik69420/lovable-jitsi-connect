import { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface VideoCallLandingProps {
  onJoinCall: () => void;
}

const VideoCallLanding = ({ onJoinCall }: VideoCallLandingProps) => {
  const [isJoining, setIsJoining] = useState(false);

  const handleJoinCall = () => {
    setIsJoining(true);
    setTimeout(() => {
      onJoinCall();
      setIsJoining(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-surface flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-6">
            Lovable Video Call
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Connect instantly with high-quality video calls. No downloads, no sign-ups required.
            Just click and start your meeting.
          </p>
        </div>

        {/* Main Call Card */}
        <Card className="p-8 bg-card/80 backdrop-blur-sm border shadow-glow mb-8">
          <div className="space-y-6">
            {/* Call Preview Area */}
            <div className="aspect-video bg-gradient-video rounded-xl flex items-center justify-center border border-video-border">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-card-foreground mb-2">
                  Ready to start your call?
                </h3>
                <p className="text-muted-foreground">
                  Room: <span className="font-mono text-primary">lovableRoom</span>
                </p>
              </div>
            </div>

            {/* Join Button */}
            <Button
              onClick={handleJoinCall}
              disabled={isJoining}
              className="w-full h-14 text-lg font-semibold bg-gradient-primary hover:opacity-90 transition-all duration-300 shadow-glow"
            >
              {isJoining ? (
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Joining Call...</span>
                </div>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Join Video Call
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 bg-card/60 backdrop-blur-sm">
            <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Secure & Private</h3>
            <p className="text-sm text-muted-foreground">
              End-to-end encryption ensures your conversations stay private
            </p>
          </Card>

          <Card className="p-6 bg-card/60 backdrop-blur-sm">
            <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Lightning Fast</h3>
            <p className="text-sm text-muted-foreground">
              Instant connection with no downloads or installations required
            </p>
          </Card>

          <Card className="p-6 bg-card/60 backdrop-blur-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="font-semibold mb-2">Multi-Platform</h3>
            <p className="text-sm text-muted-foreground">
              Works seamlessly across all devices and browsers
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VideoCallLanding;