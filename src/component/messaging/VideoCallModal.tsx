import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/component/ui/dialog';
import { Button } from '@/component/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { toast } from 'sonner';

interface VideoCallModalProps {
  open: boolean;
  onClose: () => void;
  contact: {
    id: string;
    username?: string;
    displayName?: string;
    avatar?: string | null;
  };
  isIncoming?: boolean;
  callerId?: string;
  callerInfo?: {
    username?: string;
    displayName?: string;
    avatar?: string | null;
  };
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  open,
  onClose,
  contact,
  isIncoming = false,
  callerId,
  callerInfo
}) => {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<'calling' | 'ringing' | 'connected' | 'ended'>('calling');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const targetId = isIncoming ? callerId : contact.id;
  const displayInfo = isIncoming ? callerInfo : contact;
  const displayName = displayInfo?.displayName || displayInfo?.username || 'User';

  useEffect(() => {
    if (!open || !user?.id || !targetId) return;

    const setupCall = async () => {
      try {
        // Get local media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Setup WebRTC
        const configuration = {
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };
        const pc = new RTCPeerConnection(configuration);
        peerConnectionRef.current = pc;

        // Add local tracks
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Handle remote tracks
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setCallStatus('connected');
            startCallTimer();
          }
        };

        // Setup signaling channel
        const channelId = [user.id, targetId].sort().join('_');
        const channel = supabase.channel(`call_${channelId}`, {
          config: { broadcast: { self: false } }
        });

        channel
          .on('broadcast', { event: 'call_offer' }, async ({ payload }) => {
            if (payload.targetId === user.id && pc.signalingState === 'stable') {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              channel.send({
                type: 'broadcast',
                event: 'call_answer',
                payload: { answer, targetId: payload.callerId }
              });
            }
          })
          .on('broadcast', { event: 'call_answer' }, async ({ payload }) => {
            if (payload.targetId === user.id && pc.signalingState === 'have-local-offer') {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
            }
          })
          .on('broadcast', { event: 'ice_candidate' }, async ({ payload }) => {
            if (payload.targetId === user.id && payload.candidate) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
              } catch (e) {
                console.error('Error adding ICE candidate:', e);
              }
            }
          })
          .on('broadcast', { event: 'call_end' }, () => {
            handleEndCall(false);
          })
          .on('broadcast', { event: 'call_accepted' }, async () => {
            // Other user accepted, create and send offer
            setCallStatus('connected');
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            channel.send({
              type: 'broadcast',
              event: 'call_offer',
              payload: { offer, callerId: user.id, targetId }
            });
          })
          .subscribe();

        channelRef.current = channel;

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            channel.send({
              type: 'broadcast',
              event: 'ice_candidate',
              payload: { candidate: event.candidate, targetId }
            });
          }
        };

        if (!isIncoming) {
          // Send call request via message/notification
          setCallStatus('calling');
          channel.send({
            type: 'broadcast',
            event: 'call_request',
            payload: { 
              callerId: user.id, 
              callerUsername: user.username,
              callerDisplayName: user.displayName,
              callerAvatar: user.avatar,
              targetId
            }
          });
          
          // Timeout after 30 seconds
          setTimeout(() => {
            if (callStatus === 'calling') {
              toast.error('Call not answered');
              handleEndCall(false);
            }
          }, 30000);
        } else {
          // Accept incoming call
          setCallStatus('ringing');
        }

      } catch (error) {
        console.error('Error setting up call:', error);
        toast.error('Failed to access camera/microphone');
        onClose();
      }
    };

    setupCall();

    return () => {
      cleanup();
    };
  }, [open, user?.id, targetId, isIncoming]);

  const startCallTimer = () => {
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const cleanup = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  };

  const handleAcceptCall = async () => {
    setCallStatus('connected');
    channelRef.current?.send({
      type: 'broadcast',
      event: 'call_accepted',
      payload: { targetId: callerId }
    });
  };

  const handleEndCall = (sendEvent = true) => {
    if (sendEvent) {
      channelRef.current?.send({
        type: 'broadcast',
        event: 'call_end',
        payload: { targetId }
      });
    }
    setCallStatus('ended');
    cleanup();
    onClose();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={() => handleEndCall()}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 bg-gray-900 border-none overflow-hidden">
        <DialogTitle className="sr-only">Video Call with {displayName}</DialogTitle>
        
        {/* Remote Video (fullscreen) */}
        <div className="relative w-full h-full bg-gray-800">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Calling/Ringing overlay */}
          {callStatus !== 'connected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={displayInfo?.avatar || undefined} />
                <AvatarFallback className="text-2xl bg-primary">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-semibold text-white mb-2">{displayName}</h2>
              <p className="text-gray-400">
                {callStatus === 'calling' && 'Calling...'}
                {callStatus === 'ringing' && 'Incoming call...'}
              </p>
              
              {isIncoming && callStatus === 'ringing' && (
                <div className="flex gap-4 mt-8">
                  <Button
                    size="lg"
                    variant="destructive"
                    className="rounded-full h-16 w-16"
                    onClick={() => handleEndCall()}
                  >
                    <PhoneOff className="h-6 w-6" />
                  </Button>
                  <Button
                    size="lg"
                    className="rounded-full h-16 w-16 bg-green-500 hover:bg-green-600"
                    onClick={handleAcceptCall}
                  >
                    <Phone className="h-6 w-6" />
                  </Button>
                </div>
              )}
            </div>
          )}
          
          {/* Local Video (picture-in-picture) */}
          <div className="absolute bottom-24 right-4 w-48 h-36 rounded-lg overflow-hidden bg-gray-700 shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Call Duration */}
          {callStatus === 'connected' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 px-4 py-2 rounded-full">
              <span className="text-white font-mono">{formatDuration(callDuration)}</span>
            </div>
          )}
          
          {/* Controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
            <Button
              variant="ghost"
              size="lg"
              className={`rounded-full h-14 w-14 ${isMuted ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white hover:bg-white/20'}`}
              onClick={toggleMute}
            >
              {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              className={`rounded-full h-14 w-14 ${isVideoOff ? 'bg-red-500/20 text-red-500' : 'bg-white/10 text-white hover:bg-white/20'}`}
              onClick={toggleVideo}
            >
              {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
            </Button>
            
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full h-14 w-14"
              onClick={() => handleEndCall()}
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCallModal;
