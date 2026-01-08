import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/auth';
import { useAdmin } from '@/hooks/use-admin';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Button } from '@/component/ui/button';
import OnlineStatus from '@/component/OnlineStatus';
import ChatStreak from './ChatStreak';
import { useChatStreak } from '@/hooks/use-chat-streak';
import { ArrowLeft, MoreVertical, UserPlus, Info, Search, BellOff, Bell, LogOut, Pencil, Trash2, Palette, Video } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/component/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/component/ui/alert-dialog';
import GroupMembersManager from './GroupMembersManager';
import MessageSearch from './MessageSearch';
import { GroupInfoEditor } from './GroupInfoEditor';

interface Contact {
  id: string;
  username?: string;
  displayName?: string;
  avatar: string | null;
  name?: string;
  memberCount?: number;
  isGroup?: boolean;
}

interface ChatHeaderProps {
  contact: Contact | null;
  onOpenUserActions: () => void;
  onBack?: () => void;
  isGroupChat?: boolean;
  onMembersUpdated?: () => void;
  onLeaveGroup?: (groupId: string) => void;
  onMuteGroup?: (groupId: string) => void;
  onUnmuteGroup?: (groupId: string) => void;
  onDeleteGroup?: (groupId: string) => void;
  messages?: any[];
  onMessageSelect?: (messageId: string) => void;
  isMuted?: boolean;
  isCreator?: boolean;
  onOpenThemeSelector?: () => void;
  onStartVideoCall?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  contact, 
  onOpenUserActions, 
  onBack, 
  isGroupChat, 
  onMembersUpdated,
  onLeaveGroup,
  onMuteGroup,
  onUnmuteGroup,
  onDeleteGroup,
  messages = [],
  onMessageSelect,
  isMuted = false,
  isCreator = false,
  onOpenThemeSelector,
  onStartVideoCall
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [showMembersManager, setShowMembersManager] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const isGroup = isGroupChat || contact?.isGroup;
  
  // Get streak data for direct messages only
  const { streakCount, isActive: streakActive } = useChatStreak(
    user?.id,
    !isGroup ? contact?.id || null : null
  );

  if (!contact) return null;

  const displayName = contact.name || contact.displayName || contact.username || 'Unknown';

  const handleLeaveGroup = () => {
    if (isGroup && contact.id && onLeaveGroup) {
      onLeaveGroup(contact.id);
      setShowLeaveDialog(false);
      navigate('/messages');
    }
  };

  const handleMuteToggle = () => {
    if (!isGroup || !contact.id) return;
    
    if (isMuted && onUnmuteGroup) {
      onUnmuteGroup(contact.id);
    } else if (!isMuted && onMuteGroup) {
      onMuteGroup(contact.id);
    }
  };

  const handleDeleteGroup = () => {
    if (isGroup && contact.id && onDeleteGroup) {
      onDeleteGroup(contact.id);
      setShowDeleteDialog(false);
      navigate('/messages');
    }
  };

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 flex justify-between items-center dark:border-gray-800 sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onBack || (() => navigate(-1))}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="relative">
          <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
            <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={displayName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!isGroup && (
            <div className="absolute -bottom-1 -right-1">
              <OnlineStatus userId={contact.id} size="md" />
            </div>
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg line-clamp-1">
              {displayName}
            </h3>
            {/* Streak indicator for direct messages */}
            {!isGroup && streakCount > 0 && (
              <ChatStreak 
                streakCount={streakCount} 
                isActive={streakActive} 
                size="sm" 
              />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {isGroup ? (
              <span>{contact.memberCount || 0} members</span>
            ) : (
              <>
                <span>@{contact.username}</span>
                <span>•</span>
                <OnlineStatus userId={contact.id} showLastActive showLabel />
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {/* Video call button - Admin only */}
        {isAdmin && !isGroup && onStartVideoCall && (
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-primary"
            onClick={onStartVideoCall}
            title="Start video call"
          >
            <Video className="h-5 w-5" />
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isGroup && (
              <>
                {isCreator && (
                  <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Group Info
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => setShowMembersManager(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Members
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSearch(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Search Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenThemeSelector}>
                  <Palette className="h-4 w-4 mr-2" />
                  Chat Theme
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleMuteToggle}>
                  {isMuted ? (
                    <>
                      <Bell className="h-4 w-4 mr-2" />
                      Unmute Group
                    </>
                  ) : (
                    <>
                      <BellOff className="h-4 w-4 mr-2" />
                      Mute Group
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setShowLeaveDialog(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Leave Group
                </DropdownMenuItem>
                {isCreator && (
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Group
                  </DropdownMenuItem>
                )}
              </>
            )}
            {!isGroup && contact.username && (
              <>
                <DropdownMenuItem onClick={() => navigate(`/profile/${contact.username}`)}>
                  {t('messages.viewProfile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSearch(true)}>
                  <Search className="h-4 w-4 mr-2" />
                  Search Messages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onOpenThemeSelector}>
                  <Palette className="h-4 w-4 mr-2" />
                  Chat Theme
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem>
              {t('messages.muteNotifications')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {t('messages.clearChat')}
            </DropdownMenuItem>
            {!isGroup && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onOpenUserActions}
                  className="text-destructive focus:text-destructive"
                >
                  {t('messages.reportUser')}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isGroup && contact && (
        <>
          <GroupMembersManager
            groupId={contact.id}
            open={showMembersManager}
            onOpenChange={setShowMembersManager}
            onMembersUpdated={onMembersUpdated}
          />
          
          <MessageSearch
            open={showSearch}
            onOpenChange={setShowSearch}
            messages={messages}
            onMessageSelect={onMessageSelect || (() => {})}
          />

          <GroupInfoEditor
            groupId={contact.id}
            currentName={contact.name || ''}
            currentDescription={(contact as any).description || ''}
            currentAvatar={(contact as any).avatar_url || contact.avatar || null}
            open={showEditDialog}
            onOpenChange={setShowEditDialog}
            onUpdate={() => onMembersUpdated?.()}
          />

          <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave Group?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to leave "{displayName}"? You won't receive any messages from this group anymore.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeaveGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Leave Group
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Group?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to permanently delete "{displayName}"? This action cannot be undone and all messages will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Delete Group
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}

      {!isGroup && (
        <MessageSearch
          open={showSearch}
          onOpenChange={setShowSearch}
          messages={messages}
          onMessageSelect={onMessageSelect || (() => {})}
        />
      )}
    </div>
  );
};

export default ChatHeader;
