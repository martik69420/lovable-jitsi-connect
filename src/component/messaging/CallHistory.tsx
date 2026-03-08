import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneOff, PhoneMissed, Video } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Skeleton } from '@/component/ui/skeleton';

interface CallRecord {
  id: string;
  type: 'outgoing' | 'incoming' | 'missed' | 'declined' | 'no_answer';
  isVideo: boolean;
  duration?: number;
  timestamp: string;
  contactId: string;
  contactName: string;
  contactAvatar: string | null;
  contactUsername: string;
}

const CallHistory: React.FC = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    fetchCallHistory();
  }, [user?.id]);

  const fetchCallHistory = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      // Get messages that are call records (content starts with [CALL:)
      const { data, error } = await supabase
        .from('messages')
        .select('id, content, created_at, sender_id, receiver_id')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .like('content', '[CALL:%')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data) {
        setLoading(false);
        return;
      }

      // Get unique contact IDs
      const contactIds = new Set<string>();
      data.forEach(msg => {
        const cId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (cId) contactIds.add(cId);
      });

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, username')
        .in('id', Array.from(contactIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const records: CallRecord[] = data.map(msg => {
        const match = msg.content.match(/\[CALL:(\w+):(\w+):?(\d*)\]/);
        const contactId = msg.sender_id === user.id ? msg.receiver_id! : msg.sender_id;
        const profile = profileMap.get(contactId);

        return {
          id: msg.id,
          type: (match?.[1] || 'missed') as CallRecord['type'],
          isVideo: match?.[2] === 'true',
          duration: match?.[3] ? parseInt(match[3]) : undefined,
          timestamp: msg.created_at!,
          contactId,
          contactName: profile?.display_name || 'Unknown',
          contactAvatar: profile?.avatar_url || null,
          contactUsername: profile?.username || '',
        };
      });

      setCalls(records);
    } catch (err) {
      console.error('Error fetching call history:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    if (secs === 0) return `${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d');
  };

  const getCallIcon = (call: CallRecord) => {
    if (call.type === 'missed' || call.type === 'no_answer') {
      return <PhoneMissed className="h-4 w-4 text-destructive" />;
    }
    if (call.type === 'declined') {
      return <PhoneOff className="h-4 w-4 text-destructive" />;
    }
    if (call.type === 'outgoing') {
      return <PhoneOutgoing className="h-4 w-4 text-green-500" />;
    }
    return <PhoneIncoming className="h-4 w-4 text-green-500" />;
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
        <div className="bg-muted/40 p-4 rounded-full mb-4">
          <Phone className="h-8 w-8" />
        </div>
        <p className="font-medium mb-1">No calls yet</p>
        <p className="text-sm">Your call history will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {calls.map(call => (
        <div
          key={call.id}
          className="flex items-center gap-3 p-4 hover:bg-muted/50 border-b transition-colors dark:border-gray-800"
        >
          <Avatar className="h-10 w-10 flex-shrink-0">
            <AvatarImage src={call.contactAvatar || undefined} />
            <AvatarFallback>{call.contactName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{call.contactName}</p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {getCallIcon(call)}
              <span className="capitalize">{call.type === 'no_answer' ? 'No answer' : call.type}</span>
              {call.isVideo && <Video className="h-3 w-3" />}
              {call.duration != null && call.duration > 0 && (
                <span>· {formatDuration(call.duration)}</span>
              )}
            </div>
          </div>

          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatTime(call.timestamp)}
          </span>
        </div>
      ))}
    </div>
  );
};

export default CallHistory;
