
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserX, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FriendRequest } from './types';
import { motion } from 'framer-motion';
import { formatDistance } from 'date-fns';

interface SentRequestsTabProps {
  requests: FriendRequest[];
  loading: boolean;
  onCancel: (requestId: string) => Promise<void>;
}

const SentRequestsTab: React.FC<SentRequestsTabProps> = ({
  requests,
  loading,
  onCancel
}) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <div>
                  <Skeleton className="h-9 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-16">
        <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
        <h3 className="text-xl font-semibold mb-2">No Pending Requests</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          You haven't sent any friend requests that are still pending.
        </p>
        <Button asChild>
          <Link to="/add-friends">Find Friends</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request, index) => {
        // Get the recipient of the request
        const recipient = request.friend;
        
        if (!recipient) {
          return null;
        }
        
        // Calculate how long ago the request was sent
        const sentDate = new Date(request.created_at);
        const timeAgo = formatDistance(sentDate, new Date(), { addSuffix: true });
        
        return (
          <motion.div
            key={request.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="hover:bg-muted/30 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <Link 
                    to={`/profile/${recipient.username}`} 
                    className="flex items-center space-x-3"
                  >
                    <Avatar>
                      <AvatarImage
                        src={recipient.avatar_url || '/placeholder.svg'}
                        alt={recipient.display_name}
                      />
                      <AvatarFallback>{recipient.display_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{recipient.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{recipient.username}</p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        Sent {timeAgo}
                      </p>
                    </div>
                  </Link>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onCancel(request.id)}
                    className="ml-auto"
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Cancel Request
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SentRequestsTab;
