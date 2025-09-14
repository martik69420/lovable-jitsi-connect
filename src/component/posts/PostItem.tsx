
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageSquare, Bookmark, MoreHorizontal, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface PostItemProps {
  post: any;
  showControls?: boolean;
}

const PostItem: React.FC<PostItemProps> = ({ post, showControls = true }) => {
  if (!post) return null;
  
  return (
    <Card className="mb-4 overflow-hidden">
      <CardHeader className="p-4 pb-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={post.profiles?.avatar_url || "/placeholder.svg"} alt={post.profiles?.display_name || "User"} />
              <AvatarFallback>{post.profiles?.display_name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{post.profiles?.display_name}</p>
              <p className="text-xs text-muted-foreground">
                @{post.profiles?.username} • {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.image_url && (
          <div className="mt-3 rounded-md overflow-hidden">
            <img 
              src={post.image_url} 
              alt="Post image" 
              className="w-full h-auto max-h-96 object-cover"
              loading="lazy"
            />
          </div>
        )}
      </CardContent>
      {showControls && (
        <CardFooter className="p-2 px-4 border-t flex justify-between">
          <Button variant="ghost" size="sm">
            <Heart className="h-4 w-4 mr-1" />
            <span>{post.likes?.length || 0}</span>
          </Button>
          <Button variant="ghost" size="sm">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>{post.comments?.length || 0}</span>
          </Button>
          <Button variant="ghost" size="sm">
            <Bookmark className="h-4 w-4 mr-1" />
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default PostItem;
