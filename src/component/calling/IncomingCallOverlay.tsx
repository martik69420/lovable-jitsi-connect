import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Volume2, Video, VolumeX } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Button } from '@/component/ui/button';
import { Slider } from '@/component/ui/slider';

interface IncomingCallOverlayProps {
  open: boolean;
  callerName: string;
  callerAvatar?: string | null;
  isVideoCall?: boolean;
  onAccept: () => void;
  onReject: () => void;
}

const IncomingCallOverlay: React.FC<IncomingCallOverlayProps> = ({
  open,
  callerName,
  callerAvatar,
  isVideoCall = true,
  onAccept,
  onReject
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ringVolume, setRingVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Load volume from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('call_ringtone_volume');
    if (savedVolume) {
      setRingVolume(parseFloat(savedVolume));
    }
  }, []);

  // Save volume to localStorage
  useEffect(() => {
    localStorage.setItem('call_ringtone_volume', ringVolume.toString());
  }, [ringVolume]);

  // Play ringtone when call comes in
  useEffect(() => {
    if (open) {
      // Create audio element for ringtone
      audioRef.current = new Audio('/ringtone.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = isMuted ? 0 : ringVolume;
      
      audioRef.current.play().catch(err => {
        console.log('Could not play ringtone:', err);
      });

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [open, ringVolume, isMuted]);

  // Update volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : ringVolume;
    }
  }, [ringVolume, isMuted]);

  const handleAccept = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onAccept();
  };

  const handleReject = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onReject();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/98 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="flex flex-col items-center gap-8 p-8 w-full max-w-sm"
          >
            {/* Pulsing ring effect */}
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-green-500"
                style={{ width: '140px', height: '140px', left: '-6px', top: '-6px' }}
              />
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                className="absolute inset-0 rounded-full bg-green-500"
                style={{ width: '140px', height: '140px', left: '-6px', top: '-6px' }}
              />
              <Avatar className="h-32 w-32 border-4 border-green-500/50 relative z-10">
                <AvatarImage src={callerAvatar || undefined} />
                <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
                  {callerName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Caller info */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-2">{callerName}</h2>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="flex items-center justify-center gap-2 text-muted-foreground"
              >
                {isVideoCall ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                <span className="text-lg">Incoming {isVideoCall ? 'video' : 'voice'} call...</span>
              </motion.div>
            </div>

            {/* Call actions */}
            <div className="flex items-center gap-10 mt-6">
              {/* Reject button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-3"
              >
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full h-20 w-20 shadow-lg shadow-destructive/30"
                  onClick={handleReject}
                >
                  <PhoneOff className="h-8 w-8" />
                </Button>
                <span className="text-sm text-muted-foreground font-medium">Decline</span>
              </motion.div>

              {/* Accept button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="flex flex-col items-center gap-3"
              >
                <Button
                  size="lg"
                  className="rounded-full h-20 w-20 bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
                  onClick={handleAccept}
                >
                  <Phone className="h-8 w-8" />
                </Button>
                <span className="text-sm text-muted-foreground font-medium">Accept</span>
              </motion.div>
            </div>

            {/* Volume controls */}
            <div className="flex flex-col items-center gap-3 mt-4 w-full max-w-[200px]">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={toggleMute}
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Volume2 className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
                <span className="text-xs text-muted-foreground min-w-[60px]">
                  {isMuted ? 'Muted' : `${Math.round(ringVolume * 100)}%`}
                </span>
              </div>
              
              {!isMuted && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="w-full px-4"
                >
                  <Slider
                    value={[ringVolume * 100]}
                    onValueChange={(value) => setRingVolume(value[0] / 100)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IncomingCallOverlay;
