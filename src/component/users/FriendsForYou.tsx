
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, ArrowRight, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { useLanguage } from '@/context/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';

interface FriendSuggestion {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
}

const FriendsForYou: React.FC = () => {
  const [friendSuggestions, setFriendSuggestions] = useState<FriendSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  // Function to fetch suggestions
  const fetchFriendSuggestions = async (newOffset = offset) => {
    if (!user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Get friend suggestions with pagination
      const { data: users, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .range(newOffset, newOffset + 4)
        .limit(5);
        
      if (error) throw error;
      
      let filteredUsers = users || [];
      
      // Filter out users that are already friends
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
      
      // Filter out existing friends
      const enhancedUsers = filteredUsers
        .filter(u => !friendIds.has(u.id));
        
      setFriendSuggestions(enhancedUsers);
    } catch (error) {
      console.error('Error fetching friend suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch only
  useEffect(() => {
    if (user?.id) {
      fetchFriendSuggestions(0);
    }
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
        title: t('friends.requestSent'),
        description: t('friends.requestSentDesc')
      });
      
      // Remove user from suggestions
      const updatedSuggestions = friendSuggestions.filter(u => u.id !== userId);
      setFriendSuggestions(updatedSuggestions);
    } catch (error: any) {
      toast({
        title: t('friends.requestFailed'),
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const fetchNewSuggestions = () => {
    const newOffset = offset + 5;
    setOffset(newOffset);
    fetchFriendSuggestions(newOffset);
    toast({
      title: t('friends.findingNewFriends'),
      description: t('friends.loadingNewSuggestions')
    });
  };

  const handleViewProfile = (username: string) => {
    navigate(`/profile/${username}`);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">{t('friends.forYou')}</h2>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={fetchNewSuggestions}
          disabled={isLoading}
          className="p-1 h-8 w-8 rounded-full"
          aria-label="Refresh suggestions"
          title={t('friends.findNewSuggestions')}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="sr-only">{t('friends.findNewSuggestions')}</span>
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex justify-between items-center animate-pulse">
              <div className="flex items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16 mt-2" />
                </div>
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {friendSuggestions.length > 0 ? (
            <div className="space-y-4">
              {friendSuggestions.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex justify-between items-center"
                >
                  <div 
                    className="flex items-center gap-2 cursor-pointer" 
                    onClick={() => handleViewProfile(friend.username)}
                  >
                    <Avatar>
                      <AvatarImage src={friend.avatar_url || undefined} />
                      <AvatarFallback>{friend.display_name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{friend.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{friend.username}</p>
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={() => handleFollow(friend.id)}>
                    <UserPlus className="h-3.5 w-3.5 mr-1" />
                    {t('friends.connect')}
                  </Button>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-2 opacity-50" />
              <p className="text-muted-foreground font-medium">{t('friends.noSuggestions')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('friends.noSuggestionsDesc')}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={fetchNewSuggestions}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('friends.findNewSuggestions')}
              </Button>
            </div>
          )}
        </>
      )}
      
      <div className="mt-6 text-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full group"
          onClick={() => navigate('/add-friends')}
        >
          {t('friends.findMoreFriends')}
          <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </>
  );
};

export default FriendsForYou;
