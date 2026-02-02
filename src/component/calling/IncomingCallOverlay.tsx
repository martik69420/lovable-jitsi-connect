import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Volume2, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Button } from '@/component/ui/button';

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

  // Load volume from localStorage
  useEffect(() => {
    const savedVolume = localStorage.getItem('call_ringtone_volume');
    if (savedVolume) {
      setRingVolume(parseFloat(savedVolume));
    }
  }, []);

  // Play ringtone when call comes in
  useEffect(() => {
    if (open) {
      // Create audio element for ringtone
      audioRef.current = new Audio('/ringtone.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = ringVolume;
      
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
  }, [open, ringVolume]);

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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-lg"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="flex flex-col items-center gap-6 p-8"
          >
            {/* Pulsing ring effect */}
            <div className="relative">
              <motion.div
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-green-500"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                className="absolute inset-0 rounded-full bg-green-500"
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
              <motion.p
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-muted-foreground flex items-center justify-center gap-2"
              >
                {isVideoCall ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                Incoming {isVideoCall ? 'video' : 'voice'} call...
              </motion.p>
            </div>

            {/* Call actions */}
            <div className="flex items-center gap-8 mt-4">
              {/* Reject button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="flex flex-col items-center gap-2"
              >
                <Button
                  size="lg"
                  variant="destructive"
                  className="rounded-full h-20 w-20 shadow-lg shadow-destructive/30"
                  onClick={handleReject}
                >
                  <PhoneOff className="h-8 w-8" />
                </Button>
                <span className="text-sm text-muted-foreground">Decline</span>
              </motion.div>

              {/* Accept button */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="flex flex-col items-center gap-2"
              >
                <Button
                  size="lg"
                  className="rounded-full h-20 w-20 bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/30"
                  onClick={handleAccept}
                >
                  <Phone className="h-8 w-8" />
                </Button>
                <span className="text-sm text-muted-foreground">Accept</span>
              </motion.div>
            </div>

            {/* Volume indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
              <Volume2 className="h-3 w-3" />
              <span>Volume: {Math.round(ringVolume * 100)}%</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IncomingCallOverlay;
