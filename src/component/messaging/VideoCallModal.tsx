import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/component/ui/dialog';
import { Button } from '@/component/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
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

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  open,
  onClose,
  contact,
  isIncoming = false,
  callerId,
  callerInfo
}) => {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const hasSetRemoteDescRef = useRef(false);

  const targetId = isIncoming ? callerId : contact.id;
  const displayInfo = isIncoming ? callerInfo : contact;
  const displayName = displayInfo?.displayName || displayInfo?.username || 'User';
  const channelId = user?.id && targetId ? [user.id, targetId].sort().join('_') : null;

  const cleanup = useCallback(() => {
    console.log('Cleaning up call resources...');
    
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Stopped track:', track.kind);
      });
      localStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    pendingCandidatesRef.current = [];
    hasSetRemoteDescRef.current = false;
  }, []);

  const startCallTimer = useCallback(() => {
    if (callTimerRef.current) return;
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const handleEndCall = useCallback((sendEvent = true) => {
    console.log('Ending call, sendEvent:', sendEvent);
    
    if (sendEvent && channelRef.current && targetId) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call_end',
        payload: { targetId }
      });
    }
    
    setCallStatus('ended');
    cleanup();
    onClose();
  }, [cleanup, onClose, targetId]);

  const processPendingCandidates = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc || !hasSetRemoteDescRef.current) return;
    
    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(candidate);
        console.log('Added pending ICE candidate');
      } catch (e) {
        console.error('Error adding pending ICE candidate:', e);
      }
    }
    pendingCandidatesRef.current = [];
  }, []);

  useEffect(() => {
    if (!open || !user?.id || !targetId || !channelId) return;

    let isSetupComplete = false;

    const setupCall = async () => {
      try {
        console.log('Setting up call, isIncoming:', isIncoming);
        
        // Get local media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Setup WebRTC peer connection
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        peerConnectionRef.current = pc;

        // Add local tracks to the connection
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
          console.log('Added local track:', track.kind);
        });

        // Handle incoming remote tracks
        pc.ontrack = (event) => {
          console.log('Received remote track:', event.track.kind);
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            if (callStatus !== 'connected') {
              setCallStatus('connected');
              startCallTimer();
            }
          }
        };

        // Monitor connection state
        pc.onconnectionstatechange = () => {
          console.log('Connection state:', pc.connectionState);
          if (pc.connectionState === 'connected') {
            setCallStatus('connected');
            startCallTimer();
          } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
            toast.error('Call disconnected');
            handleEndCall(false);
          }
        };

        pc.oniceconnectionstatechange = () => {
          console.log('ICE connection state:', pc.iceConnectionState);
        };

        // Setup signaling channel
        const channel = supabase.channel(`call_${channelId}`, {
          config: { broadcast: { self: false } }
        });

        channel
          .on('broadcast', { event: 'call_offer' }, async ({ payload }) => {
            console.log('Received offer from:', payload.callerId);
            if (payload.targetId !== user.id) return;
            
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(payload.offer));
              hasSetRemoteDescRef.current = true;
              await processPendingCandidates();
              
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              
              channel.send({
                type: 'broadcast',
                event: 'call_answer',
                payload: { answer, targetId: payload.callerId, answererId: user.id }
              });
              
              setCallStatus('connecting');
            } catch (e) {
              console.error('Error handling offer:', e);
            }
          })
          .on('broadcast', { event: 'call_answer' }, async ({ payload }) => {
            console.log('Received answer from:', payload.answererId);
            if (payload.targetId !== user.id) return;
            
            try {
              if (pc.signalingState === 'have-local-offer') {
                await pc.setRemoteDescription(new RTCSessionDescription(payload.answer));
                hasSetRemoteDescRef.current = true;
                await processPendingCandidates();
                setCallStatus('connecting');
              }
            } catch (e) {
              console.error('Error handling answer:', e);
            }
          })
          .on('broadcast', { event: 'ice_candidate' }, async ({ payload }) => {
            if (payload.targetId !== user.id || !payload.candidate) return;
            
            const candidate = new RTCIceCandidate(payload.candidate);
            
            if (hasSetRemoteDescRef.current && pc.remoteDescription) {
              try {
                await pc.addIceCandidate(candidate);
                console.log('Added ICE candidate');
              } catch (e) {
                console.error('Error adding ICE candidate:', e);
              }
            } else {
              pendingCandidatesRef.current.push(candidate);
              console.log('Queued ICE candidate for later');
            }
          })
          .on('broadcast', { event: 'call_accepted' }, async ({ payload }) => {
            console.log('Call accepted by:', payload.accepterId);
            if (payload.targetId !== user.id) return;
            
            // Create and send offer
            try {
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              
              channel.send({
                type: 'broadcast',
                event: 'call_offer',
                payload: { offer, callerId: user.id, targetId }
              });
              
              setCallStatus('connecting');
            } catch (e) {
              console.error('Error creating offer:', e);
            }
          })
          .on('broadcast', { event: 'call_end' }, ({ payload }) => {
            console.log('Remote party ended call');
            toast.info('Call ended');
            handleEndCall(false);
          })
          .on('broadcast', { event: 'call_rejected' }, ({ payload }) => {
            if (payload.targetId === user.id) {
              toast.info('Call was declined');
              handleEndCall(false);
            }
          })
          .subscribe((status) => {
            console.log('Signaling channel status:', status);
            if (status === 'SUBSCRIBED') {
              isSetupComplete = true;
              
              if (!isIncoming) {
                // Send call request
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
                callTimeoutRef.current = setTimeout(() => {
                  if (callStatus === 'calling') {
                    toast.error('Call not answered');
                    handleEndCall(false);
                  }
                }, 30000);
              } else {
                setCallStatus('ringing');
              }
            }
          });

        channelRef.current = channel;

        // Handle ICE candidates
        pc.onicecandidate = (event) => {
          if (event.candidate && channelRef.current) {
            channelRef.current.send({
              type: 'broadcast',
              event: 'ice_candidate',
              payload: { candidate: event.candidate, senderId: user.id, targetId }
            });
          }
        };

      } catch (error) {
        console.error('Error setting up call:', error);
        toast.error('Failed to access camera/microphone');
        onClose();
      }
    };

    setupCall();

    return () => {
      if (isSetupComplete) {
        cleanup();
      }
    };
  }, [open, user?.id, targetId, channelId, isIncoming]);

  const handleAcceptCall = useCallback(async () => {
    console.log('Accepting call from:', callerId);
    setCallStatus('connecting');
    
    if (channelRef.current && callerId) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call_accepted',
        payload: { accepterId: user?.id, targetId: callerId }
      });
    }
  }, [callerId, user?.id]);

  const handleRejectCall = useCallback(() => {
    console.log('Rejecting call');
    if (channelRef.current && callerId) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call_rejected',
        payload: { targetId: callerId }
      });
    }
    handleEndCall(false);
  }, [callerId, handleEndCall]);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  }, []);

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
          {(callStatus === 'calling' || callStatus === 'ringing' || callStatus === 'connecting' || callStatus === 'idle') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={displayInfo?.avatar || undefined} />
                <AvatarFallback className="text-2xl bg-primary">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-2xl font-semibold text-white mb-2">{displayName}</h2>
              <p className="text-gray-400">
                {callStatus === 'idle' && 'Starting...'}
                {callStatus === 'calling' && 'Calling...'}
                {callStatus === 'ringing' && 'Incoming call...'}
                {callStatus === 'connecting' && 'Connecting...'}
              </p>
              
              {isIncoming && callStatus === 'ringing' && (
                <div className="flex gap-4 mt-8">
                  <Button
                    size="lg"
                    variant="destructive"
                    className="rounded-full h-16 w-16"
                    onClick={handleRejectCall}
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
              
              {!isIncoming && callStatus === 'calling' && (
                <div className="flex gap-4 mt-8">
                  <Button
                    size="lg"
                    variant="destructive"
                    className="rounded-full h-16 w-16"
                    onClick={() => handleEndCall()}
                  >
                    <PhoneOff className="h-6 w-6" />
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
          
          {/* Controls - show when connected */}
          {callStatus === 'connected' && (
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCallModal;
