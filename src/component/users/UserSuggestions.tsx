
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';

interface SuggestedUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  school?: string;
}

const UserSuggestions: React.FC = () => {
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        
        // Get users that the current user is not friends with
        const { data: users, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id)
          .limit(5);
          
        if (error) throw error;
        
        // Filter out users that are already friends or have pending requests
        const { data: friends } = await supabase
          .from('friends')
          .select('friend_id, status')
          .eq('user_id', user.id);
          
        const { data: friendRequests } = await supabase
          .from('friends')
          .select('user_id, status')
          .eq('friend_id', user.id);
          
        const friendIds = new Set([
          ...(friends?.map(f => f.friend_id) || []),
          ...(friendRequests?.map(f => f.user_id) || [])
        ]);
        
        const filteredUsers = users?.filter(u => !friendIds.has(u.id)) || [];
        setSuggestedUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching suggested users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSuggestedUsers();
  }, [user?.id]);

  const handleFollow = async (userId: string) => {
    if (!user?.id) return;
    
    try {
      const { error } = await supabase
        .from('friends')
        .insert([
          { user_id: user.id, friend_id: userId, status: 'pending' }
        ]);
        
      if (error) throw error;
      
      toast({
        title: "Friend request sent",
        description: "They will be notified of your request."
      });
      
      // Remove user from suggestions
      setSuggestedUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error: any) {
      toast({
        title: "Failed to send request",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleViewProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };

  // Fallback data in case there are no suggestions from the database
  const fallbackUsers = [
    {
      id: '1',
      username: 'emilyjones',
      display_name: 'Emily Jones',
      avatar_url: 'https://i.pravatar.cc/150?img=1',
      school: 'Stanford University',
    },
    {
      id: '2',
      username: 'alexchen',
      display_name: 'Alex Chen',
      avatar_url: 'https://i.pravatar.cc/150?img=3',
      school: 'MIT',
    },
    {
      id: '3',
      username: 'sarahpatel',
      display_name: 'Sarah Patel',
      avatar_url: 'https://i.pravatar.cc/150?img=5',
      school: 'Harvard University',
    },
  ];

  // Use fallback data if no suggestions from database
  const displayUsers = suggestedUsers.length > 0 ? suggestedUsers : fallbackUsers;

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Suggested For You</h2>
        </div>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex justify-between items-center animate-pulse">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-muted"></div>
                <div>
                  <div className="h-4 w-24 bg-muted rounded"></div>
                  <div className="h-3 w-16 bg-muted rounded mt-2"></div>
                </div>
              </div>
              <div className="h-8 w-16 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {displayUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex justify-between items-center"
            >
              <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => handleViewProfile(user.username)}
              >
                <Avatar>
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback>{user.display_name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{user.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              
              <Button variant="outline" size="sm" onClick={() => handleFollow(user.id)}>
                <UserPlus className="h-3.5 w-3.5 mr-1" />
                Follow
              </Button>
            </motion.div>
          ))}
        </div>
      )}
      
      <div className="mt-6 text-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full"
          onClick={() => navigate('/add-friends')}
        >
          See More
        </Button>
      </div>
    </>
  );
};

export default UserSuggestions;
