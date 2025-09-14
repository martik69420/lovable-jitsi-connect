import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { usePost } from '@/context/PostContext';
import PostCard from '@/components/post/PostCard';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/components/layout/AppLayout';

const Post: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { posts, loading } = usePost();
  const [post, setPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (postId && posts.length > 0) {
      const foundPost = posts.find(p => p.id === postId);
      setPost(foundPost);
      setIsLoading(false);
    } else if (postId && !loading) {
      // Post not found
      setIsLoading(false);
    }
  }, [postId, posts, loading]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <div className="mb-6 flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Skeleton className="h-8 w-32" />
          </div>
          
          <div className="max-w-2xl mx-auto">
            <div className="space-y-4">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!post) {
    return (
      <AppLayout>
        <div className="container mx-auto py-6">
          <div className="mb-6 flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Post Not Found</h1>
          </div>
          
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              The post you're looking for doesn't exist or has been removed.
            </p>
            <Button 
              onClick={() => navigate('/')}
              className="mt-4"
            >
              Go Home
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto py-6">
        <div className="mb-6 flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Post</h1>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <PostCard post={post} />
        </div>
      </div>
    </AppLayout>
  );
};

export default Post;