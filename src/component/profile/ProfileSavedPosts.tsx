
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth';
import PostCard from '@/components/post/PostCard';
import { Bookmark } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfileSavedPostsProps {
  username: string;
}

const ProfileSavedPosts: React.FC<ProfileSavedPostsProps> = ({ username }) => {
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Check if viewing own profile or if the other user has public saved posts
  const [canViewSavedPosts, setCanViewSavedPosts] = useState(false);
  
  useEffect(() => {
    const checkPermissionAndLoadPosts = async () => {
      setIsLoading(true);
      
      try {
        // Check if this is the current user's profile
        const isOwnProfile = user?.username === username;
        
        // If it's not the user's own profile, we'll default to showing the posts
        // since settings column doesn't exist yet
        const hasPermission = isOwnProfile || true; // Default to true for now
        setCanViewSavedPosts(hasPermission);
        
        if (hasPermission) {
          // Get userId for the username
          const { data: userData } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', username)
            .single();
            
          if (userData) {
            // Fetch saved posts with proper joins
            const { data: savedItems, error } = await supabase
              .from('saved_posts')
              .select(`
                post_id,
                created_at,
                posts:post_id (
                  id,
                  content,
                  created_at,
                  user_id,
                  images,
                  likes:likes(user_id),
                  comments:comments(*),
                  profiles:user_id (
                    id,
                    username,
                    display_name,
                    avatar_url
                  )
                )
              `)
              .eq('user_id', userData.id)
              .order('created_at', { ascending: false });
              
            if (error) {
              console.error('Error fetching saved posts:', error);
              setSavedPosts([]);
            } else if (savedItems && savedItems.length > 0) {
              // Filter out any null posts and format them
              const validPosts = savedItems
                .filter(item => item.posts)
                .map(item => item.posts);
              
              setSavedPosts(validPosts || []);
            } else {
              setSavedPosts([]);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved posts:', error);
        setSavedPosts([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (username) {
      checkPermissionAndLoadPosts();
    }
  }, [username, user]);

  if (isLoading) {
    return (
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {[1, 2, 3].map(i => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
          >
            <Card>
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
          </motion.div>
        ))}
      </motion.div>
    );
  }

  if (!canViewSavedPosts) {
    return (
      <motion.div 
        className="text-center py-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ 
            rotate: [0, 5, -5, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        </motion.div>
        <h3 className="text-lg font-medium">Saved posts are private</h3>
        <p className="text-muted-foreground mt-1 max-w-md mx-auto">
          This user has set their saved posts to private.
        </p>
      </motion.div>
    );
  }

  if (savedPosts.length === 0) {
    return (
      <motion.div 
        className="text-center py-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ 
            y: [0, -10, 0],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        >
          <Bookmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        </motion.div>
        <h3 className="text-lg font-medium">No saved posts yet</h3>
        <p className="text-muted-foreground mt-1">
          Saved posts will appear here.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence>
        {savedPosts.map((post, index) => {
          // Convert database post format to match PostCard component's expected format
          const formattedPost = {
            id: post.id,
            content: post.content,
            createdAt: post.created_at,
            userId: post.user_id,
            likes: post.likes?.map(like => like.user_id) || [],
            comments: post.comments || [],
            shares: 0,
            images: post.images || [],
            user: post.profiles ? {
              id: post.profiles.id || post.user_id,
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
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
            >
              <PostCard post={formattedPost} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProfileSavedPosts;
