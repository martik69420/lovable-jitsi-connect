
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { useViewport } from '@/hooks/use-viewport';

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
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
          .select('id, username, display_name, avatar_url')
          .ilike('username', `${query}%`)
          .order('username')
          .limit(5);
          
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
      className={`mention-suggestions absolute z-50 ${
        isMobile ? "mention-suggestions-mobile" : "mention-suggestions-desktop"
      }`}
    >
      <Command className="rounded-lg border shadow-md bg-popover">
        <CommandGroup heading="Suggestions">
          {loading ? (
            <div className="p-2 text-center">
              <span className="text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : users.length > 0 ? (
            users.map((user) => (
              <CommandItem
                key={user.id}
                value={user.username}
                onSelect={() => onSelect(user.username)}
                className="flex items-center gap-2 p-2 cursor-pointer"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback>
                    {user.display_name?.charAt(0) || user.username.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.display_name}</span>
                  <span className="text-xs text-muted-foreground">@{user.username}</span>
                </div>
              </CommandItem>
            ))
          ) : (
            <div className="p-2 text-center">
              <span className="text-sm text-muted-foreground">No users found</span>
            </div>
          )}
        </CommandGroup>
      </Command>
    </div>
  );
}
