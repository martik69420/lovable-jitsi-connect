
import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PostCard from '@/components/post/PostCard';
import { Post } from '@/context/PostContext';

interface PostListProps {
  posts: Post[];
  isLoading: boolean;
  emptyMessage?: string;
}

const PostList: React.FC<PostListProps> = ({ 
  posts, 
  isLoading, 
  emptyMessage = "No posts yet" 
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center p-10">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <Card className="bg-secondary/30 backdrop-blur-sm">
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <p className="text-lg font-medium mb-2">{emptyMessage}</p>
          <p className="text-muted-foreground">
            Be the first to post something or follow other users to see their posts here.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <AnimatePresence>
      <div className="space-y-4">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <PostCard post={post} priority={index === 0} />
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
};

export default PostList;
