
import { supabase } from '@/integrations/supabase/client';
import { Friend, FriendRequest } from './types';

// Fetch all friends for a user
export const fetchFriendsData = async (userId: string): Promise<Friend[]> => {
  try {
    console.log('Fetching friends data for user ID:', userId);
    
    // Query for both directions of friendship
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        profiles!friends_friend_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          class
        ),
        users_profiles:profiles!friends_user_id_fkey (
          id,
          username,
          display_name,
          avatar_url,
          class
        )
      `)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq('status', 'accepted');
    
    if (error) {
      console.error('Error in fetchFriendsData SQL query:', error);
      throw error;
    }
    
    console.log('Raw friends data from database:', data);
    
    // Transform the data to get consistent friend objects
    const friends: Friend[] = data.map(friendRelation => {
      // Determine which user is the friend (not the current user)
      const isUserIdField = friendRelation.user_id === userId;
      const friendProfile = isUserIdField ? friendRelation.profiles : friendRelation.users_profiles;
      
      if (!friendProfile) {
        console.log('Missing friend profile for relation:', friendRelation);
        return null;
      }
      
      // Create a friend object with consistent properties
      return {
        id: friendProfile.id,
        username: friendProfile.username,
        displayName: friendProfile.display_name,
        avatar: friendProfile.avatar_url,
        class: friendProfile.class,
        isOnline: false, // Default to false, will be updated by useOnlineStatus
      };
    }).filter(Boolean) as Friend[];
    
    console.log('Transformed friends data:', friends);
    return friends;
  } catch (error) {
    console.error('Error fetching friends:', error);
    return [];
  }
};

// Fetch received friend requests
export const fetchReceivedRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        created_at,
        status,
        user:profiles!friends_user_id_fkey (
          id, username, display_name, avatar_url, class
        )
      `)
      .eq('friend_id', userId)
      .eq('status', 'pending');
    
    if (error) {
      console.error('Error fetching received requests:', error);
      throw error;
    }
    
    console.log('Received requests data:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching received requests:', error);
    return [];
  }
};

// Fetch sent friend requests
export const fetchSentRequests = async (userId: string): Promise<FriendRequest[]> => {
  try {
    const { data, error } = await supabase
      .from('friends')
      .select(`
        id,
        user_id,
        friend_id,
        created_at,
        status,
        friend:profiles!friends_friend_id_fkey (
          id, username, display_name, avatar_url, class
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'pending');
    
    if (error) {
      console.error('Error fetching sent requests:', error);
      throw error;
    }
    
    console.log('Sent requests data:', data);
    return data || [];
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    return [];
  }
};

// Send a friend request
export const sendFriendRequest = async (userId: string, friendId: string): Promise<boolean> => {
  try {
    // Check if a request already exists
    const { data: existingRequest, error: checkError } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(friend_id.eq.${userId},user_id.eq.${friendId})`)
      .limit(1);
      
    if (checkError) {
      console.error('Error checking existing request:', checkError);
      throw checkError;
    }
    
    if (existingRequest && existingRequest.length > 0) {
      console.log('Friend request already exists:', existingRequest);
      return false;
    }
    
    // Insert new friend request
    const { error } = await supabase
      .from('friends')
      .insert([
        { user_id: userId, friend_id: friendId, status: 'pending' },
      ]);
      
    if (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending friend request:', error);
    return false;
  }
};

// Accept a friend request
export const acceptFriendRequest = async (
  requestId: string, 
  userId: string,
  friendId: string | undefined
): Promise<boolean> => {
  try {
    if (!friendId) {
      console.error('Missing friendId in acceptFriendRequest');
      return false;
    }
    
    console.log(`Accepting friend request ${requestId} from user ${friendId}`);
    
    // Update the status of the request
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);
      
    if (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
    
    // Create a notification for the other user
    try {
      await supabase.from('notifications').insert([{
        user_id: friendId,
        type: 'friend_request_accepted',
        content: 'accepted your friend request',
        related_id: userId,
        url: `/profile/${userId}`
      }]);
    } catch (notificationError) {
      // Log but don't fail the request
      console.error('Error creating notification:', notificationError);
    }
    
    return true;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }
};

// Reject/cancel a friend request
export const rejectFriendRequest = async (requestId: string): Promise<boolean> => {
  try {
    // Delete the request
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', requestId);
      
    if (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error rejecting friend request:', error);
    return false;
  }
};

// Remove a friend
export const removeFriend = async (friendId: string, userId: string): Promise<boolean> => {
  try {
    console.log(`Removing friendship between ${userId} and ${friendId}`);
    
    // Delete from both directions
    const { error } = await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${userId},friend_id.eq.${friendId}),and(friend_id.eq.${userId},user_id.eq.${friendId})`);
      
    if (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error removing friend:', error);
    return false;
  }
};
