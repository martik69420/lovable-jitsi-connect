import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Users, Video } from 'lucide-react';
import { Button } from '@/component/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

interface ActiveGroupCallBannerProps {
  groupId: string;
  groupName: string;
  onJoinCall: () => void;
}

interface ActiveCaller {
  id: string;
  username?: string;
  displayName?: string;
  avatar?: string | null;
}

const ActiveGroupCallBanner: React.FC<ActiveGroupCallBannerProps> = ({
  groupId,
  groupName,
  onJoinCall
}) => {
  const { user } = useAuth();
  const [isCallActive, setIsCallActive] = useState(false);
  const [callers, setCallers] = useState<ActiveCaller[]>([]);
  const [callDuration, setCallDuration] = useState(0);

  useEffect(() => {
    if (!groupId || !user?.id) return;

    const channelId = `group_call_${groupId}`;
    
    const channel = supabase.channel(channelId, {
      config: { broadcast: { self: true } }
    });

    channel
      .on('broadcast', { event: 'group_call_started' }, ({ payload }) => {
        console.log('Group call started:', payload);
        setIsCallActive(true);
        setCallers(prev => {
          if (prev.find(c => c.id === payload.callerId)) return prev;
          return [...prev, {
            id: payload.callerId,
            username: payload.callerUsername,
            displayName: payload.callerDisplayName,
            avatar: payload.callerAvatar
          }];
        });
      })
      .on('broadcast', { event: 'group_call_joined' }, ({ payload }) => {
        console.log('User joined group call:', payload);
        setCallers(prev => {
          if (prev.find(c => c.id === payload.userId)) return prev;
          return [...prev, {
            id: payload.userId,
            username: payload.username,
            displayName: payload.displayName,
            avatar: payload.avatar
          }];
        });
      })
      .on('broadcast', { event: 'group_call_left' }, ({ payload }) => {
        console.log('User left group call:', payload);
        setCallers(prev => prev.filter(c => c.id !== payload.userId));
      })
      .on('broadcast', { event: 'group_call_ended' }, () => {
        console.log('Group call ended');
        setIsCallActive(false);
        setCallers([]);
        setCallDuration(0);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user?.id]);

  // Duration counter
  useEffect(() => {
    if (!isCallActive) return;
    
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isCallActive]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Hide if current user is already in the call
  if (!isCallActive || callers.find(c => c.id === user?.id)) {
    return null;
  }

  return (
    <AnimatePresence>
      {isCallActive && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 mx-2 mb-2"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Animated phone icon */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0"
              >
                <Video className="h-5 w-5 text-white" />
              </motion.div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm text-green-500">Group Call Active</p>
                  <span className="text-xs text-muted-foreground">{formatDuration(callDuration)}</span>
                </div>
                
                {/* Show who's in the call */}
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex -space-x-2">
                    {callers.slice(0, 3).map(caller => (
                      <Avatar key={caller.id} className="h-5 w-5 border-2 border-background">
                        <AvatarImage src={caller.avatar || undefined} />
                        <AvatarFallback className="text-[8px] bg-primary text-primary-foreground">
                          {(caller.displayName || caller.username || '?').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {callers.length} {callers.length === 1 ? 'person' : 'people'}
                  </span>
                </div>
              </div>
            </div>

            {/* Join button */}
            <Button
              size="sm"
              className="bg-green-500 hover:bg-green-600 text-white flex-shrink-0"
              onClick={onJoinCall}
            >
              <Phone className="h-4 w-4 mr-1" />
              Join
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActiveGroupCallBanner;
