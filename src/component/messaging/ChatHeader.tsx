
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import OnlineStatus from '@/components/OnlineStatus';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Contact {
  id: string;
  username: string;
  displayName: string;
  avatar: string | null;
}

interface ChatHeaderProps {
  contact: Contact | null;
  onOpenUserActions: () => void;
  onBack?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ contact, onOpenUserActions, onBack }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!contact) return null;

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
            <AvatarImage src={contact.avatar || "/placeholder.svg"} alt={contact.displayName || contact.username} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
              {(contact.displayName || contact.username).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1">
            <OnlineStatus userId={contact.id} size="md" />
          </div>
        </div>
        <div>
          <h3 className="font-semibold text-lg line-clamp-1">
            {contact.displayName}
          </h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>@{contact.username}</span>
            <span>•</span>
            <OnlineStatus userId={contact.id} showLastActive showLabel />
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
            <DropdownMenuItem onClick={() => navigate(`/profile/${contact.username}`)}>
              {t('messages.viewProfile')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {t('messages.muteNotifications')}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {t('messages.clearChat')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onOpenUserActions}
              className="text-destructive focus:text-destructive"
            >
              {t('messages.reportUser')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatHeader;
