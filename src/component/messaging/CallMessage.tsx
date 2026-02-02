import React from 'react';
import { Phone, PhoneOff, PhoneIncoming, PhoneOutgoing, Video } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/component/ui/button';

export interface CallMessageData {
  type: 'outgoing' | 'incoming' | 'missed' | 'declined' | 'no_answer';
  isVideo?: boolean;
  duration?: number; // in seconds
  timestamp: string;
}

interface CallMessageProps {
  data: CallMessageData;
  isOwn: boolean;
  onCallBack?: () => void;
}

const CallMessage: React.FC<CallMessageProps> = ({ data, isOwn, onCallBack }) => {
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds} secs`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (secs === 0) return `${mins} min`;
    return `${mins} min ${secs} secs`;
  };

  const getCallInfo = () => {
    const CallIcon = data.isVideo ? Video : Phone;
    
    switch (data.type) {
      case 'outgoing':
        return {
          icon: <PhoneOutgoing className="h-5 w-5 text-green-500" />,
          label: data.isVideo ? 'Video call' : 'Voice call',
          sublabel: data.duration ? formatDuration(data.duration) : 'Outgoing',
          bgClass: isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
        };
      case 'incoming':
        return {
          icon: <PhoneIncoming className="h-5 w-5 text-green-500" />,
          label: data.isVideo ? 'Video call' : 'Voice call',
          sublabel: data.duration ? formatDuration(data.duration) : 'Incoming',
          bgClass: isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
        };
      case 'missed':
        return {
          icon: <PhoneIncoming className="h-5 w-5 text-red-500" />,
          label: 'Missed call',
          sublabel: 'Tap to call back',
          bgClass: 'bg-muted',
          showCallBack: true
        };
      case 'declined':
        return {
          icon: <PhoneOff className="h-5 w-5 text-red-500" />,
          label: data.isVideo ? 'Video call' : 'Voice call',
          sublabel: 'Declined',
          bgClass: isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
        };
      case 'no_answer':
        return {
          icon: <PhoneOff className="h-5 w-5 text-orange-500" />,
          label: data.isVideo ? 'Video call' : 'Voice call',
          sublabel: 'No answer',
          bgClass: isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
        };
      default:
        return {
          icon: <Phone className="h-5 w-5" />,
          label: 'Call',
          sublabel: '',
          bgClass: 'bg-muted'
        };
    }
  };

  const callInfo = getCallInfo();

  return (
    <div 
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl ${callInfo.bgClass} ${
        callInfo.showCallBack ? 'cursor-pointer hover:opacity-90' : ''
      }`}
      onClick={callInfo.showCallBack ? onCallBack : undefined}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-background/20 flex items-center justify-center">
        {callInfo.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{callInfo.label}</p>
        <p className={`text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
          {callInfo.sublabel}
        </p>
      </div>
      <span className={`text-xs ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
        {format(new Date(data.timestamp), 'HH:mm')}
      </span>
    </div>
  );
};

export default CallMessage;
