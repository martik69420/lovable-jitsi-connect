import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/auth';
import { Friend, FriendRequest, FriendProfile } from './types';
import { 
  fetchFriendsData, 
  fetchReceivedRequests, 
  fetchSentRequests, 
  sendFriendRequest, 
  acceptFriendRequest, 
  rejectFriendRequest, 
  removeFriend 
} from './friendsApi';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type { Friend, FriendRequest, FriendProfile } from './types';

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch friends and friend requests
  const fetchFriends = useCallback(async () => {
    if (!user?.id) {
      console.log('No user ID available, cannot fetch friends');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    console.log('Starting to fetch friends data for user:', user.id);
    
    try {
      // Fetch all data in parallel
      const [friendsData, receivedData, sentData] = await Promise.all([
        fetchFriendsData(user.id),
        fetchReceivedRequests(user.id),
        fetchSentRequests(user.id)
      ]);
      
      console.log(`Successfully fetched ${friendsData.length} friends`);
      console.log(`Successfully fetched ${receivedData.length} received requests`);
      console.log(`Successfully fetched ${sentData.length} sent requests`);
      
      setFriends(friendsData);
      setReceivedRequests(receivedData);
      setSentRequests(sentData);
    } catch (error) {
      console.error('Error in fetchFriends:', error);
      toast({
        title: "Failed to load friends",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, toast]);

  // Set up real-time subscription for friend status updates
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up Supabase subscription for friends table');

    const channel = supabase
      .channel('friends-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'friends',
        filter: `or(user_id.eq.${user.id},friend_id.eq.${user.id})`
      }, () => {
        console.log('Friends table change detected, refreshing...');
        fetchFriends();
      })
      .subscribe();

    return () => {
      console.log('Cleaning up Supabase subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchFriends]);

  // Handle sending friend request
  const handleSendFriendRequest = useCallback(async (friendId: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      console.log(`Sending friend request from ${user.id} to ${friendId}`);
      const success = await sendFriendRequest(user.id, friendId);
      if (success) {
        // Refetch to update the UI
        fetchFriends();
        toast({
          title: "Friend request sent",
          description: "They'll be notified of your request"
        });
      }
      return success;
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Failed to send request",
        description: "Please try again later",
        variant: "destructive"
      });
      return false;
    }
  }, [user?.id, fetchFriends, toast]);

  // Handle accepting friend request
  const handleAcceptFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const request = receivedRequests.find(req => req.id === requestId);
      const success = await acceptFriendRequest(requestId, user.id, request?.user_id);
      
      if (success) {
        // Refetch to update the UI
        fetchFriends();
        toast({
          title: "Friend request accepted",
          description: "You're now friends"
        });
      }
      return success;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Failed to accept request",
        description: "Please try again later",
        variant: "destructive"
      });
      return false;
    }
  }, [user?.id, receivedRequests, fetchFriends, toast]);

  // Handle rejecting/canceling friend request
  const handleRejectFriendRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const success = await rejectFriendRequest(requestId);
      
      if (success) {
        // Refetch to update the UI
        fetchFriends();
        toast({
          title: "Request rejected",
          description: "The request has been removed"
        });
      }
      return success;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: "Failed to reject request",
        description: "Please try again later",
        variant: "destructive"
      });
      return false;
    }
  }, [fetchFriends, toast]);

  // Handle removing friend
  const handleRemoveFriend = useCallback(async (friendId: string): Promise<boolean> => {
    if (!user?.id) return false;
    
    try {
      const success = await removeFriend(friendId, user.id);
      
      if (success) {
        // Refetch to update the UI
        fetchFriends();
        toast({
          title: "Friend removed",
          description: "They've been removed from your friends list"
        });
      }
      return success;
    } catch (error) {
      console.error('Error removing friend:', error);
      toast({
        title: "Failed to remove friend",
        description: "Please try again later",
        variant: "destructive"
      });
      return false;
    }
  }, [user?.id, fetchFriends, toast]);

  // Load friends when component mounts
  useEffect(() => {
    if (user?.id) {
      console.log('Initial friends data load');
      fetchFriends();
    }
  }, [user?.id, fetchFriends]);

  return {
    friends,
    receivedRequests,
    sentRequests,
    isLoading,
    sendFriendRequest: handleSendFriendRequest,
    acceptFriendRequest: handleAcceptFriendRequest,
    rejectFriendRequest: handleRejectFriendRequest,
    removeFriend: handleRemoveFriend,
    fetchFriends
  };
};

export default useFriends;
