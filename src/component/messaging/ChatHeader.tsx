
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Button } from '@/component/ui/button';
import OnlineStatus from '@/component/OnlineStatus';
import { ArrowLeft, MoreVertical, UserPlus, Info } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/component/ui/dropdown-menu';
import GroupMembersManager from './GroupMembersManager';

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
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ contact, onOpenUserActions, onBack, isGroupChat, onMembersUpdated }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showMembersManager, setShowMembersManager] = useState(false);

  if (!contact) return null;

  const displayName = contact.name || contact.displayName || contact.username || 'Unknown';
  const isGroup = isGroupChat || contact.isGroup;

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
          <h3 className="font-semibold text-lg line-clamp-1">
            {displayName}
          </h3>
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isGroup && (
              <>
                <DropdownMenuItem onClick={() => setShowMembersManager(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Manage Members
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {!isGroup && contact.username && (
              <DropdownMenuItem onClick={() => navigate(`/profile/${contact.username}`)}>
                {t('messages.viewProfile')}
              </DropdownMenuItem>
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
        <GroupMembersManager
          groupId={contact.id}
          open={showMembersManager}
          onOpenChange={setShowMembersManager}
          onMembersUpdated={onMembersUpdated}
        />
      )}
    </div>
  );
};

export default ChatHeader;
