import React, { useEffect, useState } from 'react';
import { X, MessageCircle, Check, Gamepad2, Heart, UserPlus, Share2, Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Button } from '@/component/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Notification } from '@/context/NotificationContext';

interface NotificationToastProps {
  notification: Notification;
  onDismiss: () => void;
  onMarkAsRead: () => void;
  onAction?: (action: string) => void;
}

const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onDismiss,
  onMarkAsRead,
  onAction,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));
    
    // Auto-dismiss after 6 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 6000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss();
    }, 300);
  };

  const handleMarkAsRead = () => {
    onMarkAsRead();
    handleDismiss();
  };

  const handleReply = () => {
    if (notification.type === 'message' && notification.sender?.id) {
      navigate(`/messages?user=${notification.sender.id}`);
      // Mark as read when navigating to the message
      onMarkAsRead();
    }
    onAction?.('reply');
    handleDismiss();
  };

  const handleViewProfile = () => {
    if (notification.sender?.id) {
      navigate(`/profile/${notification.sender.id}`);
    }
    handleDismiss();
  };

  const handleAcceptFriend = () => {
    onAction?.('accept');
    // Mark as read when accepting
    onMarkAsRead();
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
      // Mark as read when viewing the related content
      onMarkAsRead();
    }
    handleDismiss();
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'message':
        return <MessageCircle className="h-4 w-4" />;
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
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeLabel = () => {
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
      case 'system':
        return 'System';
      default:
        return 'Notification';
    }
  };

  const renderActions = () => {
    switch (notification.type) {
      case 'message':
        return (
          <>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              onClick={handleReply}
            >
              Reply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleMarkAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark Read
            </Button>
          </>
        );
      case 'friend':
        return (
          <>
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs"
              onClick={handleAcceptFriend}
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleViewProfile}
            >
              View Profile
            </Button>
          </>
        );
      case 'game':
        return (
          <>
            <Button
              size="sm"
              variant="default"
              className="h-7 text-xs"
              onClick={handleJoinGame}
            >
              <Gamepad2 className="h-3 w-3 mr-1" />
              Join
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              onClick={handleReply}
            >
              Reply
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleDismiss}
            >
              Ignore
            </Button>
          </>
        );
      case 'share':
        return (
          <>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              onClick={handleViewPost}
            >
              View
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleReply}
            >
              Reply
            </Button>
          </>
        );
      case 'like':
      case 'comment':
      case 'mention':
        return (
          <>
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-xs"
              onClick={handleViewPost}
            >
              View Post
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={handleMarkAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark Read
            </Button>
          </>
        );
      default:
        return (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            onClick={handleMarkAsRead}
          >
            <Check className="h-3 w-3 mr-1" />
            Mark Read
          </Button>
        );
    }
  };

  // Check if this is a game invite (based on message content or type)
  const isGameInvite = notification.type === 'game' || 
                       notification.message?.toLowerCase().includes('game') || 
                       notification.message?.toLowerCase().includes('play');

  return (
    <div
      className={cn(
        "relative w-80 bg-card border border-border rounded-xl shadow-lg overflow-hidden transition-all duration-300",
        isVisible && !isExiting ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}
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
          className="h-6 w-6"
          onClick={handleDismiss}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3">
        <div className="flex items-start gap-3">
          {notification.sender && (
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage src={notification.sender.avatar} />
              <AvatarFallback>
                {notification.sender.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            {notification.sender && (
              <p className="font-semibold text-sm text-foreground truncate">
                {notification.sender.name}
              </p>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {notification.message}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border">
          {renderActions()}
        </div>
      </div>

      {/* Progress bar for auto-dismiss */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted">
        <div 
          className="h-full bg-primary transition-all ease-linear"
          style={{
            animation: 'shrink 6s linear forwards'
          }}
        />
      </div>

      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default NotificationToast;
