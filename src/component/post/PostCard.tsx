
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, ExternalLink, Crown, Flag, Trash2, Shield } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { usePost } from '@/context/PostContext';
import { useAuth } from '@/context/auth';
import { useAdmin } from '@/hooks/use-admin';
import CommentSection from './CommentSection';
import ShareModal from './ShareModal';
import ReportModal from '@/components/ReportModal';
import { useToast } from '@/hooks/use-toast';
import type { Post } from '@/context/PostContext';
import { motion } from 'framer-motion';
import CombinedContentRenderer from '@/components/mentions/CombinedContentRenderer';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import PollDisplay from './PollDisplay';

interface PostCardProps {
  post: Post;
}

interface Poll {
  id: string;
  question: string;
  options: string[];
  ends_at?: string;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [showComments, setShowComments] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [poll, setPoll] = useState<Poll | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const { likePost, unlikePost, deletePost, updatePost, commentOnPost, savePost, unsavePost } = usePost();
  const { user } = useAuth();
  const { isAdmin, adminDeletePost } = useAdmin();
  const { toast } = useToast();
  const navigate = useNavigate();

  const isLiked = user ? post.likes.includes(user.id) : false;
  const isOwnPost = user ? post.userId === user.id : false;
  const canDelete = isOwnPost || isAdmin;

  // Fetch poll for this post
  useEffect(() => {
    const fetchPoll = async () => {
      const { data, error } = await supabase
        .from('polls')
        .select('id, question, options, ends_at')
        .eq('post_id', post.id)
        .single();

      if (!error && data) {
        setPoll({
          ...data,
          options: data.options as string[]
        });
      }
    };
    fetchPoll();
  }, [post.id]);

  const handleUserClick = () => {
    if (post.user?.username) {
      navigate(`/profile/${post.user.username}`);
    }
  };

  const handleEditStart = () => {
    setEditedContent(post.content);
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    if (editedContent.trim() === '') {
      toast({
        title: "Cannot save empty post",
        description: "Please add some content to your post.",
        variant: "destructive"
      });
      return;
    }
    
    if (editedContent !== post.content) {
      await updatePost(post.id, editedContent);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditedContent(post.content);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like posts.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isLiked) {
        await unlikePost(post.id);
      } else {
        await likePost(post.id);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save posts.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (post.isSaved) {
        await unsavePost(post.id);
      } else {
        await savePost(post.id);
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        if (isAdmin && !isOwnPost) {
          // Admin deleting someone else's post
          await adminDeletePost(post.id);
        } else {
          await deletePost(post.id);
        }
        toast({
          title: "Post deleted",
          description: isOwnPost ? "Your post has been deleted successfully." : "Post has been deleted by admin.",
        });
      } catch (error) {
        console.error('Error deleting post:', error);
        toast({
          title: "Error",
          description: "Failed to delete post. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleReport = () => {
    setShowReportModal(true);
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to comment.",
        variant: "destructive"
      });
      return;
    }

    if (!newComment.trim()) return;

    try {
      await commentOnPost(post.id, newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getPostUrl = () => {
    return `${window.location.origin}/post/${post.id}`;
  };

  const renderImages = () => {
    if (!post.images || post.images.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {post.images.map((imageUrl, index) => {
          // For now, we'll default to preview mode since we don't have display type stored
          // In a real implementation, you'd store the display type with each image
          const isPreview = true; // This would come from your image data structure
          
          if (isPreview) {
            return (
              <div key={index} className="rounded-lg overflow-hidden border border-border">
                <img 
                  src={imageUrl} 
                  alt={`Post image ${index + 1}`}
                  className="w-full h-auto max-h-96 object-cover cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => window.open(imageUrl, '_blank')}
                />
              </div>
            );
          } else {
            return (
              <div key={index} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a 
                  href={imageUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-primary hover:underline truncate"
                >
                  {imageUrl}
                </a>
              </div>
            );
          }
        })}
      </div>
    );
  };

  return (
    <>
      <Card className="mb-4 shadow-sm border-border/50 hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div 
              className="flex items-center space-x-3 cursor-pointer group"
              onClick={handleUserClick}
            >
              <Avatar className="h-10 w-10 border border-border group-hover:ring-2 group-hover:ring-primary/20 transition-all">
                <AvatarImage 
                  src={post.user?.avatar || '/placeholder.svg'} 
                  alt={post.user?.displayName || 'User'} 
                />
                <AvatarFallback className="text-sm bg-primary/10">
                  {post.user?.displayName?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm hover:underline">
                    {post.user?.displayName || 'Unknown User'}
                  </p>
                  {post.user?.isAdmin && (
                    <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Admin
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span className="group-hover:text-primary transition-colors">@{post.user?.username || 'unknown'}</span>
                  <span>·</span>
                  <span>{formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
                </div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwnPost && (
                  <DropdownMenuItem onClick={handleEditStart}>
                    Edit Post
                  </DropdownMenuItem>
                )}
                {canDelete && (
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isAdmin && !isOwnPost ? 'Delete (Admin)' : 'Delete Post'}
                  </DropdownMenuItem>
                )}
                {!isOwnPost && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleReport}>
                      <Flag className="h-4 w-4 mr-2" />
                      Report Post
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-3">
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className="w-full min-h-[80px] p-3 text-sm leading-relaxed whitespace-pre-wrap break-words bg-muted/50 border border-primary/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleEditSave}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isOwnPost ? 'cursor-text hover:bg-muted/30 rounded-lg p-1 -m-1 transition-colors' : ''}`}
                onClick={isOwnPost ? handleEditStart : undefined}
              >
                <CombinedContentRenderer 
                  content={post.content}
                  className=""
                />
              </div>
            )}
            
            {renderImages()}
            
            {/* Poll Display */}
            {poll && <PollDisplay poll={poll} postId={post.id} />}
            
            <Separator className="my-4" />
            
            <div className="flex items-center justify-between text-muted-foreground">
              <div className="flex items-center space-x-6">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`flex items-center space-x-2 hover:text-red-500 transition-colors ${
                    isLiked ? 'text-red-500' : ''
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-xs">{post.likes.length}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center space-x-2 hover:text-blue-500 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs">{post.comments.length}</span>
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center space-x-2 hover:text-green-500 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="text-xs">{post.shares || 0}</span>
                </Button>
              </div>
              
              <motion.div
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className={`transition-colors ${
                    post.isSaved ? 'text-yellow-500' : 'hover:text-yellow-500'
                  }`}
                >
                  <motion.div
                    whileTap={{ 
                      scale: 1.3,
                      rotate: [0, -15, 15, 0]
                    }}
                    animate={post.isSaved ? {
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    } : {}}
                    transition={{ 
                      whileTap: { duration: 0.15 },
                      animate: { duration: 0.4, delay: 0.1 }
                    }}
                  >
                    <Bookmark 
                      className={`h-4 w-4 transition-all ${
                        post.isSaved ? 'fill-yellow-500' : ''
                      }`}
                    />
                  </motion.div>
                </Button>
              </motion.div>
            </div>
            
            {showComments && (
              <>
                <Separator className="my-4" />
                <CommentSection 
                  post={post}
                  newComment={newComment}
                  setNewComment={setNewComment}
                  handleComment={handleComment}
                />
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <ShareModal
        open={showShareModal}
        onOpenChange={setShowShareModal}
        postId={post.id}
        postTitle={post.content}
      />

      <ReportModal
        open={showReportModal}
        onClose={() => setShowReportModal(false)}
        type="post"
        targetId={post.id}
        targetName={post.user?.displayName}
      />
    </>
  );
};

export default PostCard;
