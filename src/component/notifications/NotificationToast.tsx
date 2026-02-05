import React, { useEffect, useState } from 'react';
import { X, MessageCircle, Check, Gamepad2, Heart, UserPlus, Share2, Bell, Phone, PhoneOff, ChevronDown, Bookmark, Reply, Eye, AtSign } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Button } from '@/component/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@/context/NotificationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/component/ui/dropdown-menu';

interface NotificationToastProps {
  notification: Notification;
  onDismiss: () => void;
  onMarkAsRead: () => void;
  onAction?: (action: string) => void;
}

interface ActionButton {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: 'default' | 'secondary' | 'ghost' | 'destructive';
  primary?: boolean;
}

const TOAST_DURATION = 15000; // 15 seconds

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onMarkAsRead,
  onAction,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(TOAST_DURATION);
  const navigate = useNavigate();

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  useEffect(() => {
    if (isPaused) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 100) {
          handleDismiss();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleIgnore = () => {
    handleDismiss();
  };

  const handleReply = () => {
    if (notification.sender?.id) {
      navigate(`/messages?user=${notification.sender.id}`);
      onMarkAsRead();
    }
    onAction?.('reply');
    handleDismiss();
  };

  const handleOpenMessages = () => {
    if (notification.sender?.id) {
      navigate(`/messages?user=${notification.sender.id}`);
      onMarkAsRead();
    }
    handleDismiss();
  };

  const handlePickUp = () => {
    onAction?.('pickup');
    onMarkAsRead();
    handleDismiss();
  };

  const handleAcceptFriend = () => {
    onAction?.('accept');
    onMarkAsRead();
    handleDismiss();
  };

  const handleDeclineFriend = () => {
    onAction?.('decline');
    handleDismiss();
  };

  const handleViewProfile = () => {
    if (notification.sender?.id) {
      navigate(`/profile/${notification.sender.id}`);
    }
    handleDismiss();
  };

  const handleJoinGame = () => {
    if (notification.relatedId) {
      navigate(`/games/${notification.relatedId}`);
      onMarkAsRead();
    }
    onAction?.('join');
    handleDismiss();
  };

  const handleViewPost = () => {
    if (notification.relatedId) {
      navigate(`/post/${notification.relatedId}`);
      onMarkAsRead();
    } else if (notification.url) {
      navigate(notification.url);
      onMarkAsRead();
    }
    handleDismiss();
  };

  const handleLikePost = () => {
    onAction?.('like');
    handleDismiss();
  };

  const handleSharePost = () => {
    onAction?.('share');
    handleDismiss();
  };

  const handleSavePost = () => {
    onAction?.('save');
    handleDismiss();
  };

  const handleMainClick = () => {
    switch (notification.type) {
      case 'message':
        handleOpenMessages();
        break;
      case 'like':
      case 'comment':
      case 'mention':
      case 'share':
        handleViewPost();
        break;
      case 'friend':
        handleViewProfile();
        break;
      default:
        if (notification.url) {
          navigate(notification.url);
          onMarkAsRead();
        }
        handleDismiss();
    }
  };

  const getIcon = () => {
    const isCall = notification.message?.toLowerCase().includes('call');
    if (isCall) return <Phone className="h-5 w-5 text-green-500" />;
    
    switch (notification.type) {
      case 'message':
        return <MessageCircle className="h-5 w-5 text-primary" />;
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'friend':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'comment':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case 'mention':
        return <AtSign className="h-5 w-5 text-yellow-500" />;
      case 'game':
        return <Gamepad2 className="h-5 w-5 text-purple-500" />;
      case 'share':
        return <Share2 className="h-5 w-5 text-cyan-500" />;
      case 'save':
        return <Bookmark className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getActions = (): ActionButton[] => {
    const isCall = notification.message?.toLowerCase().includes('call');
    
    if (isCall) {
      return [
        { label: 'Pick Up', icon: <Phone className="h-4 w-4" />, onClick: handlePickUp, variant: 'default', primary: true },
        { label: 'Ignore', icon: <PhoneOff className="h-4 w-4" />, onClick: handleIgnore, variant: 'destructive' },
      ];
    }
    
    switch (notification.type) {
      case 'message':
        return [
          { label: 'Reply', icon: <Reply className="h-4 w-4" />, onClick: handleReply, variant: 'default', primary: true },
          { label: 'Ignore', onClick: handleIgnore, variant: 'ghost' },
        ];
      case 'friend':
        return [
          { label: 'Accept', icon: <Check className="h-4 w-4" />, onClick: handleAcceptFriend, variant: 'default', primary: true },
          { label: 'Decline', onClick: handleDeclineFriend, variant: 'ghost' },
          { label: 'View Profile', icon: <Eye className="h-4 w-4" />, onClick: handleViewProfile, variant: 'secondary' },
        ];
      case 'game':
        return [
          { label: 'Join Game', icon: <Gamepad2 className="h-4 w-4" />, onClick: handleJoinGame, variant: 'default', primary: true },
          { label: 'Reply', icon: <Reply className="h-4 w-4" />, onClick: handleReply, variant: 'secondary' },
          { label: 'Ignore', onClick: handleIgnore, variant: 'ghost' },
        ];
      case 'like':
      case 'comment':
      case 'mention':
      case 'save':
        return [
          { label: 'View Post', icon: <Eye className="h-4 w-4" />, onClick: handleViewPost, variant: 'default', primary: true },
          { label: 'Reply', icon: <Reply className="h-4 w-4" />, onClick: handleReply, variant: 'secondary' },
          { label: 'Like', icon: <Heart className="h-4 w-4" />, onClick: handleLikePost, variant: 'ghost' },
          { label: 'Share', icon: <Share2 className="h-4 w-4" />, onClick: handleSharePost, variant: 'ghost' },
        ];
      case 'share':
        return [
          { label: 'View', icon: <Eye className="h-4 w-4" />, onClick: handleViewPost, variant: 'default', primary: true },
          { label: 'Reply', icon: <Reply className="h-4 w-4" />, onClick: handleReply, variant: 'secondary' },
        ];
      default:
        return [
          { label: 'Dismiss', icon: <X className="h-4 w-4" />, onClick: handleDismiss, variant: 'ghost' },
        ];
    }
  };

  const renderActions = () => {
    const actions = getActions();
    
    if (actions.length <= 2) {
      return (
        <div className="flex flex-col gap-1.5 w-full border-t border-border pt-2 mt-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              size="sm"
              variant={action.variant || 'ghost'}
              className={cn(
                "h-8 text-xs justify-center w-full gap-2",
                action.primary && "font-medium"
              )}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      );
    }

    // Show primary action + dropdown for 3+ actions
    const primaryAction = actions.find(a => a.primary) || actions[0];
    const otherActions = actions.filter(a => a !== primaryAction);

    return (
      <div className="flex flex-col gap-1.5 w-full border-t border-border pt-2 mt-2">
        <Button
          size="sm"
          variant={primaryAction.variant || 'default'}
          className="h-8 text-xs justify-center w-full font-medium gap-2"
          onClick={(e) => {
            e.stopPropagation();
            primaryAction.onClick();
          }}
        >
          {primaryAction.icon}
          {primaryAction.label}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs justify-center w-full gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              More Options
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="min-w-[160px]">
            {otherActions.map((action) => (
              <DropdownMenuItem
                key={action.label}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                }}
                className="text-xs cursor-pointer gap-2"
              >
                {action.icon}
                {action.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  const progressPercent = (timeRemaining / TOAST_DURATION) * 100;

  return (
    <div
      className={cn(
        "relative w-80 sm:w-[340px] bg-card border border-border rounded-lg shadow-lg overflow-hidden transition-all duration-200 ease-out",
        isVisible && !isExiting 
          ? "translate-x-0 opacity-100" 
          : "translate-x-full opacity-0"
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Main content - clickable */}
      <div 
        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={handleMainClick}
      >
        <div className="flex items-start gap-3">
          {/* Icon or Avatar */}
          <div className="flex-shrink-0">
            {notification.sender?.avatar ? (
              <Avatar className="h-10 w-10 ring-2 ring-border">
                <AvatarImage src={notification.sender.avatar} />
                <AvatarFallback className="bg-muted text-muted-foreground">
                  {notification.sender.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                {getIcon()}
              </div>
            )}
          </div>
          
          {/* Text content */}
          <div className="flex-1 min-w-0 pr-6">
            {notification.sender?.name && (
              <p className="font-semibold text-sm text-foreground truncate">
                {notification.sender.name}
              </p>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              just now
            </p>
          </div>
          
          {/* Close button */}
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-2 right-2 h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              handleDismiss();
            }}
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Action buttons */}
        {renderActions()}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-muted">
        <div 
          className={cn(
            "h-full bg-primary transition-all",
            isPaused && "opacity-50"
          )}
          style={{
            width: `${progressPercent}%`,
            transition: isPaused ? 'none' : 'width 100ms linear'
          }}
        />
      </div>
    </div>
  );
};

export default NotificationToast;
