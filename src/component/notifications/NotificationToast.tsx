import React, { useEffect, useState } from 'react';
import { X, MessageCircle, Check, Gamepad2, Heart, UserPlus, Share2, Bell, Phone, PhoneOff, ChevronDown, Bookmark, Reply, Eye } from 'lucide-react';
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

const TOAST_DURATION = 15000; // 15 seconds (midpoint of 10-20)

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
    // Click on the notification itself
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
    // Check for call in message content
    const isCall = notification.message?.toLowerCase().includes('call');
    if (isCall) return <Phone className="h-4 w-4 text-green-500" />;
    
    switch (notification.type) {
      case 'message':
        return <MessageCircle className="h-4 w-4 text-primary" />;
      case 'like':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'friend':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-green-500" />;
      case 'mention':
        return <Bell className="h-4 w-4 text-yellow-500" />;
      case 'game':
        return <Gamepad2 className="h-4 w-4 text-purple-500" />;
      case 'share':
        return <Share2 className="h-4 w-4 text-cyan-500" />;
      case 'save':
        return <Bookmark className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = () => {
    // Check for call in message content
    const isCall = notification.message?.toLowerCase().includes('call');
    if (isCall) return 'Incoming Call';
    
    switch (notification.type) {
      case 'message':
        return 'New Message';
      case 'like':
        return 'New Like';
      case 'friend':
        return 'Friend Request';
      case 'comment':
        return 'New Comment';
      case 'mention':
        return 'Mentioned You';
      case 'game':
        return 'Game Invite';
      case 'share':
        return 'Shared with You';
      case 'save':
        return 'Post Saved';
      case 'system':
        return 'System';
      default:
        return 'Notification';
    }
  };

  const getActions = (): ActionButton[] => {
    // Check for call in message content
    const isCall = notification.message?.toLowerCase().includes('call');
    
    if (isCall) {
      return [
        { label: 'Pick Up', icon: <Phone className="h-3.5 w-3.5" />, onClick: handlePickUp, variant: 'default', primary: true },
        { label: 'Ignore', icon: <PhoneOff className="h-3.5 w-3.5" />, onClick: handleIgnore, variant: 'destructive' },
      ];
    }
    
    switch (notification.type) {
      case 'message':
        return [
          { label: 'Reply', icon: <Reply className="h-3.5 w-3.5" />, onClick: handleReply, variant: 'default', primary: true },
          { label: 'Ignore', onClick: handleIgnore, variant: 'ghost' },
        ];
      case 'friend':
        return [
          { label: 'Accept', icon: <Check className="h-3.5 w-3.5" />, onClick: handleAcceptFriend, variant: 'default', primary: true },
          { label: 'Decline', onClick: handleDeclineFriend, variant: 'ghost' },
          { label: 'View Profile', icon: <Eye className="h-3.5 w-3.5" />, onClick: handleViewProfile, variant: 'secondary' },
        ];
      case 'game':
        return [
          { label: 'Join Game', icon: <Gamepad2 className="h-3.5 w-3.5" />, onClick: handleJoinGame, variant: 'default', primary: true },
          { label: 'Reply', icon: <Reply className="h-3.5 w-3.5" />, onClick: handleReply, variant: 'secondary' },
          { label: 'Ignore', onClick: handleIgnore, variant: 'ghost' },
        ];
      case 'like':
      case 'comment':
      case 'mention':
      case 'save':
        return [
          { label: 'View Post', icon: <Eye className="h-3.5 w-3.5" />, onClick: handleViewPost, variant: 'default', primary: true },
          { label: 'Reply', icon: <Reply className="h-3.5 w-3.5" />, onClick: handleReply, variant: 'secondary' },
        ];
      case 'share':
        return [
          { label: 'View', icon: <Eye className="h-3.5 w-3.5" />, onClick: handleViewPost, variant: 'default', primary: true },
          { label: 'Reply', icon: <Reply className="h-3.5 w-3.5" />, onClick: handleReply, variant: 'secondary' },
        ];
      default:
        return [
          { label: 'Mark Read', icon: <Check className="h-3.5 w-3.5" />, onClick: onMarkAsRead, variant: 'ghost' },
        ];
    }
  };

  const renderActions = () => {
    const actions = getActions();
    
    if (actions.length <= 2) {
      // Show stacked buttons for 2 or fewer actions
      return (
        <div className="flex flex-col gap-1.5 min-w-[80px]">
          {actions.map((action, index) => (
            <Button
              key={action.label}
              size="sm"
              variant={action.variant || 'ghost'}
              className={cn(
                "h-7 text-xs justify-start",
                action.primary && "font-medium"
              )}
              onClick={action.onClick}
            >
              {action.icon && <span className="mr-1.5">{action.icon}</span>}
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
      <div className="flex flex-col gap-1.5 min-w-[80px]">
        <Button
          size="sm"
          variant={primaryAction.variant || 'default'}
          className="h-7 text-xs justify-start font-medium"
          onClick={primaryAction.onClick}
        >
          {primaryAction.icon && <span className="mr-1.5">{primaryAction.icon}</span>}
          {primaryAction.label}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs justify-between"
            >
              Options
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            {otherActions.map((action) => (
              <DropdownMenuItem
                key={action.label}
                onClick={action.onClick}
                className="text-xs cursor-pointer"
              >
                {action.icon && <span className="mr-2">{action.icon}</span>}
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
        "relative w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden transition-all duration-300",
        isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {getIcon()}
          <span className="font-medium">{getTypeLabel()}</span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive"
          onClick={handleDismiss}
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content - Clickable area */}
      <div 
        className="p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        onClick={handleMainClick}
      >
        <div className="flex items-start gap-3">
          {notification.sender && (
            <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-background">
              <AvatarImage src={notification.sender.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-medium">
                {notification.sender.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0 pr-2">
            {notification.sender && (
              <p className="font-semibold text-sm text-foreground truncate">
                {notification.sender.name}
              </p>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {notification.message}
            </p>
          </div>
          
          {/* Actions on the right side */}
          {renderActions()}
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden">
        <div 
          className={cn(
            "h-full bg-primary transition-all",
            isPaused ? "bg-primary/50" : ""
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
