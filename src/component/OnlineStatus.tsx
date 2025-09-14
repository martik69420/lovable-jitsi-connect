
import React from 'react';
import useOnlineStatus from '@/hooks/use-online-status';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/component/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import { Wifi, WifiOff, Clock } from 'lucide-react';

interface OnlineStatusProps {
  userId: string;
  showLabel?: boolean;
  className?: string;
  showLastActive?: boolean;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const OnlineStatus: React.FC<OnlineStatusProps> = ({ 
  userId, 
  showLabel = false, 
  className = '',
  showLastActive = true,
  showIcon = false,
  size = 'sm'
}) => {
  const { isUserOnline, onlineStatuses, getUserStatus } = useOnlineStatus([userId]);
  
  if (!userId) return null;
  
  const lastActive = onlineStatuses[userId]?.lastActive;
  const status = getUserStatus(userId);
  
  const getLastActiveText = () => {
    if (!lastActive) return 'Never seen';
    
    try {
      const now = new Date();
      const lastActiveDate = new Date(lastActive);
      const diffInMinutes = (now.getTime() - lastActiveDate.getTime()) / (1000 * 60);
      
      if (diffInMinutes < 5) return 'Just now';
      return `Active ${formatDistanceToNow(lastActiveDate, { addSuffix: true })}`;
    } catch (error) {
      console.error("Error formatting last active time:", error);
      return 'Never seen';
    }
  };
  
  const isOnline = status === 'online';
  const isAway = status === 'away';
  
  const getSizeClasses = () => {
    switch (size) {
      case 'lg': return 'h-4 w-4';
      case 'md': return 'h-3 w-3';
      default: return 'h-2.5 w-2.5';
    }
  };
  
  const getStatusColor = () => {
    if (isOnline) return 'bg-green-500 border-green-500/20 shadow-sm shadow-green-500/30';
    if (isAway) return 'bg-yellow-500 border-yellow-500/20 shadow-sm shadow-yellow-500/30';
    return 'bg-gray-500 border-gray-500/20 shadow-sm';
  };
  
  const getStatusAnimation = () => {
    if (isOnline) return 'animate-pulse absolute inline-flex h-full w-full rounded-full bg-green-400/60';
    return '';
  };
  
  const getStatusText = () => {
    if (isOnline) return 'Online';
    if (isAway) return 'Away';
    return getLastActiveText();
  };
  
  const getStatusIcon = () => {
    const iconSize = size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5';
    if (isOnline) return <Wifi className={`${iconSize} text-green-500`} />;
    if (isAway) return <Clock className={`${iconSize} text-yellow-500`} />;
    return <WifiOff className={`${iconSize} text-gray-400`} />;
  };
  
  const getTooltipText = () => {
    if (isOnline) return 'Online now';
    if (isAway) return 'Away';
    return getLastActiveText();
  };
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={`flex items-center gap-1.5 ${className}`}>
          {showIcon ? (
            getStatusIcon()
          ) : (
            <span 
              className={`relative flex ${getSizeClasses()} ${getStatusColor()} rounded-full border-2 border-background`}
            >
              {isOnline && (
                <span className={getStatusAnimation()}></span>
              )}
            </span>
          )}
          
          {showLabel && (
            <span className={`text-xs ${isOnline ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          )}
          
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-sm">{getTooltipText()}</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default OnlineStatus;
