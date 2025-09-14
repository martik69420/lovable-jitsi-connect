
import React, { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Heart, SendHorizontal } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePost, Post } from "@/context/PostContext";
import { useAuth } from "@/context/auth";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from '@/integrations/supabase/client';

interface CommentSectionProps {
  post: Post;
  newComment: string;
  setNewComment: (comment: string) => void;
  handleComment: (e: React.FormEvent) => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ 
  post, 
  newComment, 
  setNewComment, 
  handleComment
}) => {
  const { getUserById, likeComment } = usePost();
  const { user } = useAuth();
  const [commentUsers, setCommentUsers] = useState<Record<string, any>>({});
  
  useEffect(() => {
    // Fetch user profiles for each comment
    const fetchCommentUsers = async () => {
      if (!post.comments || post.comments.length === 0) return;
      
      const userIds = [...new Set(post.comments.map(comment => comment.userId))];
      
      if (userIds.length === 0) return;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', userIds);
        
      if (!error && data) {
        const usersMap = data.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {} as Record<string, any>);
        
        setCommentUsers(usersMap);
      }
    };
    
    fetchCommentUsers();
  }, [post.comments]);
  
  const handleLikeComment = (commentId: string) => {
    likeComment(post.id, commentId);
  };

  const commentVariants = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -10 }
  };

  return (
    <div className="space-y-6 px-1">
      <form onSubmit={handleComment} className="flex gap-4">
        <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-primary/20 shadow-md">
          <AvatarImage src={user?.avatar} alt={user?.displayName} />
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {user?.displayName ? user.displayName.substring(0, 2) : 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 relative">
          <Textarea
            placeholder="Write a comment..."
            className="min-h-[80px] resize-none pr-14 rounded-xl border-secondary focus-visible:ring-primary/50 text-sm bg-background/50 shadow-sm"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <Button 
            type="submit" 
            size="icon" 
            className="absolute right-3 bottom-3 h-8 w-8 rounded-full shadow-md bg-primary hover:bg-primary/90 transition-all"
            disabled={!newComment.trim()}
          >
            <SendHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </form>
      
      <AnimatePresence>
        {post.comments && post.comments.length > 0 ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto chat-scrollbar pr-2">
            {post.comments.map((comment) => {
              const commentUser = commentUsers[comment.userId] || getUserById(comment.userId);
              const isLiked = user ? comment.likes.includes(user.id) : false;
              
              return (
                <motion.div 
                  key={comment.id} 
                  className="flex gap-3"
                  variants={commentVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  layout
                >
                  <Link to={`/profile/${commentUser?.username || comment.userId}`} className="flex-shrink-0">
                    <Avatar className="h-8 w-8 ring-1 ring-primary/10 shadow-sm transition-transform hover:scale-105">
                      <AvatarImage src={commentUser?.avatar_url} alt={commentUser?.display_name} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground font-medium text-xs">
                        {commentUser?.display_name ? commentUser.display_name.substring(0, 2) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 space-y-1">
                    <div className="bg-secondary/50 backdrop-blur-sm rounded-xl p-3 shadow-sm">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <Link to={`/profile/${commentUser?.username || comment.userId}`} className="font-medium text-xs hover:underline text-primary">
                          {commentUser?.display_name || "User"}
                        </Link>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs break-words text-foreground/90 leading-relaxed">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className={cn(
                          "h-6 w-6 rounded-full", 
                          isLiked ? "text-fenix-dark bg-fenix-dark/10" : "text-muted-foreground"
                        )}
                        onClick={() => handleLikeComment(comment.id)}
                      >
                        <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
                      </Button>
                      <span className={cn(
                        "text-xs",
                        isLiked ? "text-fenix-dark" : "text-muted-foreground"
                      )}>
                        {comment.likes.length > 0 && comment.likes.length}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 px-4 bg-secondary/20 rounded-xl">
            <p className="text-muted-foreground text-xs">No comments yet. Be the first to comment!</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CommentSection;
