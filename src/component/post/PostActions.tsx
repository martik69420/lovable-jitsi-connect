
import React, { useState } from 'react';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { MessageSquare, Heart, Share2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import SavePostButton from './SavePostButton';
import ReportModal from '@/components/ReportModal';
import ShareModal, { ShareButton } from './ShareModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PostActionsProps {
  postId: string;
  isLiked: boolean;
  likeCount: number;
  commentCount: number;
  onLikeToggle: () => void;
  onShowComments: () => void;
  onShare: () => void;
  onDelete?: () => void;
  isOwnPost?: boolean;
  className?: string;
  postTitle?: string;
}

const PostActions: React.FC<PostActionsProps> = ({
  postId,
  isLiked,
  likeCount,
  commentCount,
  onLikeToggle,
  onShowComments,
  onShare,
  onDelete,
  isOwnPost = false,
  className = '',
  postTitle = '',
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const handleReport = () => {
    if (!user) {
      toast({
        title: t('common.signInRequired'),
        description: t('post.signInToReport'),
        variant: "destructive"
      });
      return;
    }
    setShowReportModal(true);
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setShowDeleteConfirm(false);
  };

  const handleCopyLink = () => {
    try {
      const postUrl = `${window.location.origin}/post/${postId}`;
      navigator.clipboard.writeText(postUrl);
      toast({
        title: t('post.linkCopied'),
        description: t('post.linkCopiedDesc'),
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: t('common.error'),
        description: t('post.linkCopyFailed'),
        variant: "destructive"
      });
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
    if (onShare) onShare();
  };

  return (
    <>
      <div className={`flex items-center justify-between ${className}`}>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={`text-muted-foreground hover:text-foreground ${isLiked ? 'text-red-500' : ''}`}
            onClick={onLikeToggle}
          >
            <Heart
              className={`h-4 w-4 mr-1 ${isLiked ? 'fill-red-500 text-red-500' : ''}`}
            />
            {likeCount > 0 && <span>{likeCount}</span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={onShowComments}
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            {commentCount > 0 && <span>{commentCount}</span>}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-1" />
          </Button>
        </div>
        
        <div className="flex items-center">
          <SavePostButton postId={postId} showText={false} />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isOwnPost && onDelete ? (
                <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
                  {t('common.delete')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={handleReport}>
                  {t('post.report')}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyLink}>
                {t('post.copyLink')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportModal
          open={showReportModal}
          onClose={() => setShowReportModal(false)}
          type="post"
          targetId={postId}
          targetName={postTitle}
        />
      )}

      {/* Share Modal */}
      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        postId={postId}
        postTitle={postTitle}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('post.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('post.confirmDeleteDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PostActions;
