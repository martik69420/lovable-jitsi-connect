
import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

interface PostViewCounterProps {
  postId: string;
  initialViews?: number;
}

const PostViewCounter: React.FC<PostViewCounterProps> = ({ postId, initialViews = 0 }) => {
  const [viewCount, setViewCount] = useState(initialViews);
  const [hasViewed, setHasViewed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const recordView = async () => {
      if (!user || hasViewed) return;

      try {
        // Check if user has already viewed this post recently (within last hour)
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        
        const { data: existingView, error: checkError } = await supabase
          .from('post_views')
          .select('id, created_at')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .gte('created_at', oneHourAgo)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking existing view:', checkError);
          return;
        }

        if (!existingView) {
          // Record the view
          const { error: insertError } = await supabase
            .from('post_views')
            .insert([{
              post_id: postId,
              user_id: user.id
            }]);

          if (!insertError) {
            setViewCount(prev => prev + 1);
            setHasViewed(true);
          } else {
            console.error('Error recording post view:', insertError);
          }
        } else {
          setHasViewed(true);
        }
      } catch (error) {
        console.error('Error recording post view:', error);
      }
    };

    // Record view after user has been viewing for 3 seconds to ensure they actually read it
    const timer = setTimeout(recordView, 3000);
    return () => clearTimeout(timer);
  }, [postId, user, hasViewed]);

  useEffect(() => {
    // Fetch current view count
    const fetchViewCount = async () => {
      try {
        const { count, error } = await supabase
          .from('post_views')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);

        if (!error && count !== null) {
          setViewCount(count);
        } else if (error) {
          console.error('Error fetching view count:', error);
        }
      } catch (error) {
        console.error('Error fetching view count:', error);
      }
    };

    fetchViewCount();
  }, [postId]);

  return (
    <div className="flex items-center gap-1 text-muted-foreground text-sm hover:text-primary transition-colors">
      <Eye className="h-4 w-4" />
      <span>{viewCount.toLocaleString()}</span>
    </div>
  );
};

export default PostViewCounter;
