
import { supabase } from '@/integrations/supabase/client';

// Helper function to handle cleaning up any lingering auth state
export const cleanupAuthState = () => {
  const localStorageKeys = Object.keys(localStorage);
  
  // Clear any supabase-related localStorage items that might cause issues
  localStorageKeys.forEach(key => {
    if (key.includes('supabase.auth.token') || key.includes('supabase.auth.error')) {
      localStorage.removeItem(key);
    }
  });
};

// Helper function to check if a profile exists for a user
export const checkIfProfileExists = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();
    
  if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned" error
    console.error("Error checking if profile exists:", error);
    return false;
  }
  
  return !!data;
};

// Helper function to create a profile for a user
export const createUserProfile = async (
  userId: string, 
  email: string | undefined,
  userMeta: any
): Promise<boolean> => {
  try {
    console.log("Creating profile for user:", userId);
    
    // Extract user details from metadata or use defaults
    const displayName = userMeta?.user_name || 
                       userMeta?.name || 
                       email?.split('@')[0] || 
                       'User';
                       
    const username = userMeta?.preferred_username || 
                    userMeta?.user_name || 
                    email?.split('@')[0] || 
                    `user_${Date.now()}`;
                    
    const avatarUrl = userMeta?.avatar_url || 
                     userMeta?.picture || 
                     '/placeholder.svg';
                     
    const userClass = userMeta?.class || 'Onbekende Klas';
    
    // Insert profile with minimal required data
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      email: email,
      username: username,
      display_name: displayName,
      avatar_url: avatarUrl,
      school: userClass, // Keep school for database compatibility 
      class: userClass,
      is_admin: false,
      coins: 0
    });
    
    if (error) {
      console.error("Error creating profile:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Failed to create user profile:", error);
    return false;
  }
};

// Export other authentication utilities if needed...
