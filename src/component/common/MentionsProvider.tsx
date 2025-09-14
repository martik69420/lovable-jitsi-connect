
import React, { createContext, useContext, useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface MentionUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  verified?: boolean;
  isAdmin?: boolean;
}

interface MentionContextType {
  mentionUsers: MentionUser[];
  loadingMentions: boolean;
  searchMentions: (query: string) => Promise<void>;
  resetMentions: () => void;
}

const MentionContext = createContext<MentionContextType | undefined>(undefined);

export const MentionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [loadingMentions, setLoadingMentions] = useState(false);
  
  const searchMentions = async (query: string) => {
    if (query.length === 0) {
      setMentionUsers([]);
      return;
    }
    
    setLoadingMentions(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, is_admin')
        .ilike('username', `%${query}%`)
        .order('username')
        .limit(8);
        
      if (error) throw error;
      
      const formattedData = data.map(user => ({
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        isAdmin: user.is_admin || false
      }));
      
      setMentionUsers(formattedData);
    } catch (error) {
      console.error('Error searching mentions:', error);
      setMentionUsers([]);
    } finally {
      setLoadingMentions(false);
    }
  };
  
  const resetMentions = () => {
    setMentionUsers([]);
  };
  
  return (
    <MentionContext.Provider value={{
      mentionUsers,
      loadingMentions,
      searchMentions,
      resetMentions
    }}>
      {children}
    </MentionContext.Provider>
  );
};

export const useMentions = () => {
  const context = useContext(MentionContext);
  if (context === undefined) {
    throw new Error('useMentions must be used within a MentionsProvider');
  }
  return context;
};
