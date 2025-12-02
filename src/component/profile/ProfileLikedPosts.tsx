import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth';
import PostCard from '@/components/post/PostCard';
import { Heart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProfileLikedPostsProps {
  username: string;
}

const ProfileLikedPosts: React.FC<ProfileLikedPostsProps> = ({ username }) => {
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Check if viewing own profile or if the other user has public liked posts
  const [canViewLikedPosts, setCanViewLikedPosts] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    
    const checkPermissionAndLoadPosts = async () => {
      if (!username) return;
      
      setIsLoading(true);
      
      try {
        // Check if this is the current user's profile
        const isOwnProfile = user?.username === username;
        
        // Default to showing posts for own profile
        const hasPermission = isOwnProfile;
        if (isMounted) setCanViewLikedPosts(hasPermission);
        
        if (hasPermission) {
          // Get userId for the username
          const { data: userData } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single();
            
          if (userData && isMounted) {
            // Fetch liked posts
            const { data: likes } = await supabase
              .from('likes')
              .select('post_id')
              .eq('user_id', userData.id);
              
            if (likes && likes.length > 0) {
              const postIds = likes.map(like => like.post_id).filter(Boolean);
              
              // Fetch the actual posts with user data
              const { data: posts } = await supabase
                .from('posts')
                .select(`
                  *,
                  profiles:user_id (id, username, display_name, avatar_url),
                  likes:likes (user_id),
                  comments:comments (*)
                `)
                .in('id', postIds)
                .order('created_at', { ascending: false });
                
              if (isMounted) setLikedPosts(posts || []);
            } else {
              if (isMounted) setLikedPosts([]);
            }
          }
        } else {
          if (isMounted) setLikedPosts([]);
        }
      } catch (error) {
        console.error('Error loading liked posts:', error);
        if (isMounted) setLikedPosts([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    
    checkPermissionAndLoadPosts();
    
    return () => { isMounted = false; };
  }, [username, user?.username]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-24 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!canViewLikedPosts) {
    return (
      <div className="text-center py-10">
        <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Liked posts are private</h3>
        <p className="text-muted-foreground mt-1 max-w-md mx-auto">
          This user has set their liked posts to private.
        </p>
      </div>
    );
  }

  if (likedPosts.length === 0) {
    return (
      <div className="text-center py-10">
        <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No liked posts yet</h3>
        <p className="text-muted-foreground mt-1">
          Posts that are liked will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {likedPosts.map(post => {
        // Convert database post format to match PostCard component's expected format
        const formattedPost = {
          id: post.id,
          content: post.content,
          createdAt: post.created_at,
          userId: post.user_id,
          likes: post.likes || [],
          comments: post.comments || [],
          shares: 0,
          images: post.images || [],
          user: post.profiles ? {
            id: post.profiles.id,
            username: post.profiles.username,
            displayName: post.profiles.display_name,
            avatar: post.profiles.avatar_url,
            email: '', 
            class: '',
            coins: 0,
            isAdmin: false
          } : undefined
        };
        
        return (
          <PostCard 
            key={post.id} 
            post={formattedPost}
          />
        );
      })}
    </div>
  );
};

export default ProfileLikedPosts;
