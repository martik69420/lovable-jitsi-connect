
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { useViewport } from '@/hooks/use-viewport';
import { motion, AnimatePresence } from 'framer-motion';
import { Crown, Shield } from 'lucide-react';

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  verified?: boolean;
  is_admin?: boolean;
}

export interface MentionSuggestionsProps {
  query: string;
  position: { top: number; left: number };
  onSelect: (username: string) => void;
}

export function MentionSuggestions({ 
  query, 
  position,
  onSelect 
}: MentionSuggestionsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();
  const { isMobile } = useViewport();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      if (query.length === 0) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url, is_admin')
          .ilike('username', `${query}%`)
          .order('username')
          .limit(8);
          
        if (error) throw error;
        
        // Filter out the current user
        const filteredUsers = data?.filter(u => u.id !== currentUser?.id) || [];
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users for mention:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [query, currentUser?.id]);

  // Position the popup container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Check if the popup would go off-screen at the bottom
    if (position.top + container.offsetHeight > viewportHeight) {
      container.style.top = `${position.top - container.offsetHeight}px`;
    } else {
      container.style.top = `${position.top}px`;
    }
    
    // For mobile, center horizontally
    if (isMobile) {
      container.style.left = '50%';
      container.style.transform = 'translateX(-50%)';
      container.style.width = '90vw';
      container.style.maxWidth = '300px';
    } else {
      // Check if the popup would go off-screen at the right
      if (position.left + container.offsetWidth > viewportWidth) {
        container.style.left = `${viewportWidth - container.offsetWidth - 10}px`;
      } else {
        container.style.left = `${position.left}px`;
      }
    }
  }, [position, users, isMobile]);

  if (users.length === 0 && !loading) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className={`mention-suggestions fixed z-50 w-80 max-h-64 ${
        isMobile ? "mention-suggestions-mobile" : "mention-suggestions-desktop"
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="bg-popover border border-border rounded-lg shadow-lg overflow-hidden backdrop-blur-sm"
        >
          <Command className="bg-transparent">
            <CommandGroup
              heading={
                <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground">
                  <span>Mention someone</span>
                  {query && <Badge variant="secondary" className="text-xs">{query}</Badge>}
                </div>
              }
            >
              {loading ? (
                <div className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-muted-foreground">Searching...</span>
                  </div>
                </div>
              ) : users.length > 0 ? (
                users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.username}
                    onSelect={() => onSelect(user.username)}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/10 to-accent/10">
                          {user.display_name?.charAt(0) || user.username.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {user.is_admin && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                          <Crown className="w-3 h-3 text-white" />
                        </div>
                      )}
                      {user.verified && !user.is_admin && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <Shield className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground truncate">
                          {user.display_name || user.username}
                        </span>
                        {user.is_admin && (
                          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-yellow-200">
                            Admin
                          </Badge>
                        )}
                        {user.verified && !user.is_admin && (
                          <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-600 border-blue-200">
                            Verified
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">@{user.username}</span>
                    </div>
                  </CommandItem>
                ))
              ) : query ? (
                <div className="p-4 text-center">
                  <div className="text-muted-foreground">
                    <span className="text-sm">No users found matching "</span>
                    <span className="text-sm font-medium text-foreground">{query}</span>
                    <span className="text-sm">"</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Try a different search term
                  </p>
                </div>
              ) : (
                <div className="p-4 text-center">
                  <span className="text-sm text-muted-foreground">
                    Type to search for users to mention
                  </span>
                </div>
              )}
            </CommandGroup>
          </Command>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
