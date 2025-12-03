import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/component/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Badge } from '@/component/ui/badge';
import { Skeleton } from '@/component/ui/skeleton';
import { Heart, MessageCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface PostPreviewProps {
  postId: string;
  compact?: boolean;
}

interface PostData {
  id: string;
  content: string;
  created_at: string;
  images?: string[];
  profiles: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  likes: { id: string }[];
  comments: { id: string }[];
}

const PostPreview: React.FC<PostPreviewProps> = ({ postId, compact = false }) => {
  const navigate = useNavigate();
  const [post, setPost] = useState<PostData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('posts')
          .select(`
            id,
            content,
            created_at,
            images,
            profiles!posts_user_id_fkey (
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('id', postId)
          .single();

        if (error) throw error;

        // Fetch likes and comments counts separately
        const { count: likesCount } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        const { count: commentsCount } = await supabase
          .from('comments')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        const postWithCounts = {
          ...data,
          likes: Array(likesCount || 0).fill(0).map((_, i) => ({ id: `${i}` })),
          comments: Array(commentsCount || 0).fill(0).map((_, i) => ({ id: `${i}` }))
        };

        setPost(postWithCounts);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const handleClick = () => {
    navigate(`/post/${postId}`);
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="p-3">
          <div className="flex items-center space-x-2 mb-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-10 w-full mb-2" />
          <Skeleton className="h-4 w-16" />
        </CardContent>
      </Card>
    );
  }

  if (error || !post) {
    return (
      <Card className="w-full max-w-sm border-destructive/20">
        <CardContent className="p-3 text-center">
          <p className="text-destructive text-xs">
            {error || 'Post not found'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="w-full max-w-sm cursor-pointer hover:bg-accent/50 transition-all duration-200 border-primary/20 group"
      onClick={handleClick}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.profiles.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
                {post.profiles.display_name?.charAt(0) || post.profiles.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-xs truncate max-w-[100px]">
              {post.profiles.display_name || post.profiles.username}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Post</Badge>
            <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        
        <p className="text-xs text-foreground line-clamp-2 mb-2">
          {post.content}
        </p>
        
        {post.images && post.images.length > 0 && (
          <div className="w-full h-20 bg-muted rounded mb-2 overflow-hidden">
            <img 
              src={post.images[0]} 
              alt="Post image" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {post.likes.length}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {post.comments.length}
            </span>
          </div>
          <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostPreview;
