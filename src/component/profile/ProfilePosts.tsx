
import React, { useEffect, useState } from 'react';
import { usePost } from '@/context/PostContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface ProfilePostsProps {
  username?: string;
}

const ProfilePosts: React.FC<ProfilePostsProps> = ({ username }) => {
  const { posts, fetchPosts, isLoading } = usePost();
  const [userPosts, setUserPosts] = useState<Array<any>>([]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (posts && posts.length > 0 && username) {
      const filteredPosts = posts.filter(post => 
        post.user?.username === username
      );
      setUserPosts(filteredPosts);
    }
  }, [posts, username]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <Card key={item} className="mb-4">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4 mb-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-3 w-[150px]" />
                </div>
              </div>
              <Skeleton className="h-24 w-full mb-4" />
              <div className="flex gap-4">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (userPosts.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-muted-foreground">
          {username ? `@${username} hasn't posted anything yet.` : 'No posts to display.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {userPosts.map((post) => (
        <Card key={post.id} className="border border-border/50 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={post.user?.avatar || '/placeholder.svg'} 
                  alt={post.user?.displayName || post.user?.username} 
                />
                <AvatarFallback>
                  {(post.user?.displayName || post.user?.username)?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-foreground">
                    {post.user?.displayName || post.user?.username}
                  </h4>
                  <span className="text-sm text-muted-foreground">
                    @{post.user?.username}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                {post.content}
              </p>
              {post.images && post.images.length > 0 && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {post.images.map((image: string, index: number) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Post image ${index + 1}`}
                      className="rounded-lg max-h-96 w-full object-cover"
                    />
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-border/50">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  <span className="text-sm">{post.likes?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">{post.comments?.length || 0}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Share2 className="h-4 w-4" />
                  <span className="text-sm">{post.shares || 0}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProfilePosts;
