import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/component/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Badge } from '@/component/ui/badge';
import { Skeleton } from '@/component/ui/skeleton';
import { Heart, MessageCircle, Share2, Calendar } from 'lucide-react';
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

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="h-16 w-full mb-3" />
          <div className="flex justify-between">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !post) {
    return (
      <Card className="w-full max-w-md border-destructive/20">
        <CardContent className="p-4 text-center">
          <p className="text-destructive text-sm">
            {error || 'Post not found'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="w-full max-w-sm shadow-lg hover:shadow-xl transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={post.profiles.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="text-xs">
                {post.profiles.display_name?.charAt(0) || post.profiles.username.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm truncate">
              {post.profiles.display_name || post.profiles.username}
            </span>
            <Badge variant="secondary" className="text-xs">Post</Badge>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {post.content}
          </p>
          {post.images && post.images.length > 0 && (
            <div className="w-full h-16 bg-muted rounded mb-2 overflow-hidden">
              <img 
                src={post.images[0]} 
                alt="Post image" 
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
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
  }

  return (
    <Card className="w-full max-w-lg shadow-lg hover:shadow-xl transition-shadow border border-border/50">
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={post.profiles.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>
              {post.profiles.display_name?.charAt(0) || post.profiles.username.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold truncate">
                {post.profiles.display_name || post.profiles.username}
              </h3>
              <Badge variant="secondary">Post</Badge>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <p className="text-foreground leading-relaxed">{post.content}</p>
          
          {post.images && post.images.length > 0 && (
            <div className="space-y-2">
              {post.images.slice(0, 3).map((image, index) => (
                <div key={index} className="rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={image} 
                    alt={`Post image ${index + 1}`}
                    className="w-full h-48 object-cover hover:scale-105 transition-transform"
                  />
                </div>
              ))}
              {post.images.length > 3 && (
                <p className="text-sm text-muted-foreground text-center">
                  +{post.images.length - 3} more image{post.images.length - 3 > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
          
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center space-x-4 text-muted-foreground">
              <span className="flex items-center gap-2 text-sm">
                <Heart className="h-4 w-4" />
                <span className="font-medium">{post.likes.length}</span>
              </span>
              <span className="flex items-center gap-2 text-sm">
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">{post.comments.length}</span>
              </span>
              <span className="flex items-center gap-2 text-sm">
                <Share2 className="h-4 w-4" />
                <span className="font-medium">Share</span>
              </span>
            </div>
            <Badge variant="outline" className="text-xs">
              Post Preview
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostPreview;