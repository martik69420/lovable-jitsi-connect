
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { UserPlus, UserX, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FriendRequest } from './types';
import { motion } from 'framer-motion';

interface FriendRequestsTabProps {
  requests: FriendRequest[];
  loading: boolean;
  onAccept: (requestId: string) => Promise<void>;
  onDecline: (requestId: string) => Promise<void>;
}

const FriendRequestsTab: React.FC<FriendRequestsTabProps> = ({
  requests,
  loading,
  onAccept,
  onDecline
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
                <div className="flex space-x-2">
                  <Skeleton className="h-9 w-24" />
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
        <UserPlus className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
        <h3 className="text-xl font-semibold mb-2">No Friend Requests</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          You don't have any pending friend requests at the moment.
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
        // Get the user who sent the request (the other user)
        const sender = request.user;
        
        if (!sender) {
          return null;
        }
        
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
                    to={`/profile/${sender.username}`} 
                    className="flex items-center space-x-3"
                  >
                    <Avatar>
                      <AvatarImage
                        src={sender.avatar_url || '/placeholder.svg'}
                        alt={sender.display_name}
                      />
                      <AvatarFallback>{sender.display_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{sender.display_name}</p>
                      <p className="text-sm text-muted-foreground">@{sender.username}</p>
                      {sender.class && <p className="text-xs text-muted-foreground">{sender.class}</p>}
                    </div>
                  </Link>
                  
                  <div className="flex space-x-2 ml-auto">
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-primary hover:bg-primary/90"
                      onClick={() => onAccept(request.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDecline(request.id)}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FriendRequestsTab;
