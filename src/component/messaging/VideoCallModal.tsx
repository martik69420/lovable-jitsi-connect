import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/component/ui/dialog';
import { Button } from '@/component/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { 
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, 
  Maximize, Minimize, MonitorUp, FlipHorizontal2, Users,
  MoreVertical
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/component/ui/dropdown-menu';

interface Participant {
  id: string;
  username?: string;
  displayName?: string;
  avatar?: string | null;
  stream?: MediaStream;
  isMuted?: boolean;
  isVideoOff?: boolean;
}

interface VideoCallModalProps {
  open: boolean;
  onClose: () => void;
  contact: {
    id: string;
    username?: string;
    displayName?: string;
    avatar?: string | null;
    name?: string; // For groups
    memberCount?: number;
  };
  isIncoming?: boolean;
  callerId?: string;
  callerInfo?: {
    username?: string;
    displayName?: string;
    avatar?: string | null;
  };
  isGroupCall?: boolean;
  groupMembers?: Participant[];
  onCallEnd?: (type: 'outgoing' | 'incoming' | 'missed' | 'declined' | 'no_answer', duration?: number) => void;
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
  callerInfo,
  isGroupCall = false,
  groupMembers = [],
  onCallEnd
}) => {
  const { user } = useAuth();
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'ended'>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isCameraFlipped, setIsCameraFlipped] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<Map<string, Participant>>(new Map());
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const channelRef = useRef<any>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const hasSetRemoteDescRef = useRef(false);

  const targetId = isIncoming ? callerId : contact.id;
  const displayInfo = isIncoming ? callerInfo : contact;
  const displayName = displayInfo?.displayName || displayInfo?.username || (contact as any)?.name || 'User';
  const channelId = user?.id && targetId ? (isGroupCall ? `group_${contact.id}` : [user.id, targetId].sort().join('_')) : null;

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

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Cleanup group call connections
    peerConnectionsRef.current.forEach(pc => pc.close());
    peerConnectionsRef.current.clear();
    
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    
    pendingCandidatesRef.current = [];
    hasSetRemoteDescRef.current = false;
    setParticipants(new Map());
    setIsScreenSharing(false);
  }, []);

  const startCallTimer = useCallback(() => {
    if (callTimerRef.current) return;
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  }, []);

  const handleEndCall = useCallback((sendEvent = true, callEndType?: 'outgoing' | 'incoming' | 'no_answer' | 'declined') => {
    console.log('Ending call, sendEvent:', sendEvent, 'type:', callEndType);
    
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    
    if (sendEvent && channelRef.current && targetId) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'call_end',
        payload: { targetId, callerId: user?.id }
      });
    }

    // Send call message based on status
    if (onCallEnd && !isGroupCall) {
      const type = callEndType || (callStatus === 'connected' ? (isIncoming ? 'incoming' : 'outgoing') : 'no_answer');
      const duration = callStatus === 'connected' ? callDuration : undefined;
      onCallEnd(type, duration);
    }
    
    setCallStatus('ended');
    cleanup();
    onClose();
  }, [cleanup, onClose, targetId, user?.id, callStatus, callDuration, isIncoming, isGroupCall, onCallEnd]);

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

  // Fullscreen toggle
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.error('Fullscreen error:', e);
    }
  }, []);

  // Flip camera (mirror video)
  const toggleCameraFlip = useCallback(() => {
    setIsCameraFlipped(prev => !prev);
  }, []);

  // Switch between front/back camera on mobile
  const switchCamera = useCallback(async () => {
    if (!localStreamRef.current) return;

    const newFacingMode = facingMode === 'user' ? 'environment' : 'user';
    
    try {
      // Stop current video track
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.stop();
      }

      // Get new stream with different camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newFacingMode },
        audio: false
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      
      // Replace track in peer connection
      if (peerConnectionRef.current) {
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }
      }

      // Update local stream
      localStreamRef.current.removeTrack(videoTrack);
      localStreamRef.current.addTrack(newVideoTrack);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }

      setFacingMode(newFacingMode);
      toast.success(`Switched to ${newFacingMode === 'user' ? 'front' : 'back'} camera`);
    } catch (e) {
      console.error('Error switching camera:', e);
      toast.error('Could not switch camera');
    }
  }, [facingMode]);

  // Screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (!peerConnectionRef.current) return;

    try {
      if (isScreenSharing) {
        // Stop screen sharing, switch back to camera
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
          screenStreamRef.current = null;
        }

        // Get camera stream again
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: false
        });

        const videoTrack = cameraStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Update local stream
        const oldVideoTrack = localStreamRef.current?.getVideoTracks()[0];
        if (oldVideoTrack && localStreamRef.current) {
          localStreamRef.current.removeTrack(oldVideoTrack);
          localStreamRef.current.addTrack(videoTrack);
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
        }

        setIsScreenSharing(false);
        toast.success('Stopped screen sharing');
      } else {
        // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });

        screenStreamRef.current = screenStream;

        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Update local video preview
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        // Handle when user stops sharing via browser UI
        videoTrack.onended = () => {
          toggleScreenShare();
        };

        setIsScreenSharing(true);
        toast.success('Started screen sharing');
      }
    } catch (e) {
      console.error('Screen share error:', e);
      if ((e as Error).name !== 'NotAllowedError') {
        toast.error('Could not share screen');
      }
    }
  }, [isScreenSharing, facingMode]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Picture-in-Picture when tab loses focus
  useEffect(() => {
    if (!open || callStatus !== 'connected') return;

    const handleVisibilityChange = async () => {
      if (document.hidden && remoteVideoRef.current && callStatus === 'connected') {
        try {
          if (document.pictureInPictureEnabled && !document.pictureInPictureElement) {
            await remoteVideoRef.current.requestPictureInPicture();
          }
        } catch (e) {
          console.log('PiP not available:', e);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [open, callStatus]);

  useEffect(() => {
    if (!open || !user?.id || !targetId || !channelId) return;

    let isSetupComplete = false;

    const setupCall = async () => {
      try {
        console.log('Setting up call, isIncoming:', isIncoming, 'isGroupCall:', isGroupCall);
        
        // Get local media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
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
                    targetId,
                    isGroupCall
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
                // For incoming calls that were already accepted from the overlay,
                // immediately send acceptance and start connecting
                setCallStatus('connecting');
                channel.send({
                  type: 'broadcast',
                  event: 'call_accepted',
                  payload: { accepterId: user.id, targetId: callerId }
                });
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
  }, [open, user?.id, targetId, channelId, isIncoming, isGroupCall]);

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

  const participantCount = isGroupCall ? participants.size + 1 : 2;

  return (
    <Dialog open={open} onOpenChange={() => handleEndCall()}>
      <DialogContent className="max-w-4xl w-[95vw] h-[85vh] max-h-[700px] p-0 bg-gray-900 border-gray-800 overflow-hidden rounded-xl">
        <DialogTitle className="sr-only">Video Call with {displayName}</DialogTitle>
        
        <div ref={containerRef} className="relative w-full h-full bg-gray-900 flex flex-col">
          {/* Remote Video Area */}
          <div className="flex-1 relative min-h-0 bg-gray-800">
            {isGroupCall && participants.size > 1 ? (
              // Grid layout for group calls
              <div className={`w-full h-full grid gap-1 p-1 ${
                participantCount <= 2 ? 'grid-cols-1' :
                participantCount <= 4 ? 'grid-cols-2' :
                participantCount <= 9 ? 'grid-cols-3' : 'grid-cols-4'
              }`}>
                {Array.from(participants.values()).map(participant => (
                  <div key={participant.id} className="relative bg-gray-700 rounded-lg overflow-hidden">
                    <video
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                      ref={el => {
                        if (el && participant.stream) {
                          el.srcObject = participant.stream;
                        }
                      }}
                    />
                    <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-xs text-white">
                      {participant.displayName || participant.username}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Single remote video for 1:1 calls
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            )}
            
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8 border border-white/20">
                  <AvatarImage src={displayInfo?.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-white font-medium text-sm leading-tight">{displayName}</p>
                  <div className="flex items-center gap-2 text-xs">
                    {callStatus === 'connected' && (
                      <span className="text-gray-300">{formatDuration(callDuration)}</span>
                    )}
                    {isGroupCall && (
                      <span className="text-gray-400 flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {participantCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-8 w-8"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Calling/Connecting overlay */}
            {(callStatus === 'calling' || callStatus === 'ringing' || callStatus === 'connecting' || callStatus === 'idle') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95">
                <Avatar className="h-20 w-20 mb-3">
                  <AvatarImage src={displayInfo?.avatar || undefined} />
                  <AvatarFallback className="text-xl bg-primary">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-semibold text-white mb-1">{displayName}</h2>
                <p className="text-gray-400 text-sm">
                  {callStatus === 'idle' && 'Starting...'}
                  {callStatus === 'calling' && 'Calling...'}
                  {callStatus === 'ringing' && 'Incoming call...'}
                  {callStatus === 'connecting' && 'Connecting...'}
                </p>
                
                {isIncoming && callStatus === 'ringing' && (
                  <div className="flex gap-4 mt-6">
                    <Button
                      size="lg"
                      variant="destructive"
                      className="rounded-full h-14 w-14"
                      onClick={handleRejectCall}
                    >
                      <PhoneOff className="h-5 w-5" />
                    </Button>
                    <Button
                      size="lg"
                      className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600"
                      onClick={handleAcceptCall}
                    >
                      <Phone className="h-5 w-5" />
                    </Button>
                  </div>
                )}
                
                {!isIncoming && callStatus === 'calling' && (
                  <div className="flex gap-4 mt-6">
                    <Button
                      size="lg"
                      variant="destructive"
                      className="rounded-full h-14 w-14"
                      onClick={() => handleEndCall()}
                    >
                      <PhoneOff className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            {/* Local Video (PiP style) */}
            <div 
              className={`absolute bottom-16 right-3 w-28 sm:w-36 aspect-[4/3] rounded-lg overflow-hidden bg-gray-700 shadow-lg border border-gray-600 ${
                isCameraFlipped ? 'scale-x-[-1]' : ''
              }`}
            >
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {isVideoOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <VideoOff className="h-6 w-6 text-gray-400" />
                </div>
              )}
              {isScreenSharing && (
                <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Screen
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom controls bar */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 p-3 bg-gray-900 border-t border-gray-800">
            {/* Mute button */}
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full h-10 w-10 sm:h-11 sm:w-11 ${isMuted ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Mic className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
            
            {/* Video toggle button */}
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full h-10 w-10 sm:h-11 sm:w-11 ${isVideoOff ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              onClick={toggleVideo}
              title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
            >
              {isVideoOff ? <VideoOff className="h-4 w-4 sm:h-5 sm:w-5" /> : <Video className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>

            {/* Flip camera button */}
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full h-10 w-10 sm:h-11 sm:w-11 ${isCameraFlipped ? 'bg-primary text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              onClick={toggleCameraFlip}
              title="Flip camera view"
            >
              <FlipHorizontal2 className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* Screen share button */}
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full h-10 w-10 sm:h-11 sm:w-11 ${isScreenSharing ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              <MonitorUp className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>

            {/* More options dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full h-10 w-10 sm:h-11 sm:w-11 bg-gray-700 text-white hover:bg-gray-600"
                >
                  <MoreVertical className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="bg-gray-800 border-gray-700">
                <DropdownMenuItem 
                  onClick={switchCamera}
                  className="text-white hover:bg-gray-700 cursor-pointer"
                >
                  <FlipHorizontal2 className="h-4 w-4 mr-2" />
                  Switch Camera
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Hang up button */}
            <Button
              size="icon"
              className="rounded-full h-11 w-11 sm:h-12 sm:w-12 bg-red-500 hover:bg-red-600 text-white"
              onClick={() => handleEndCall()}
              title="End call"
            >
              <PhoneOff className="h-5 w-5 sm:h-6 sm:w-6" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCallModal;
