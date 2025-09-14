
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { useAuth } from '@/context/auth';

interface MentionInputProps {
  onMention: (mention: string) => void;
  placeholder?: string;
}

interface User {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

const MentionInput: React.FC<MentionInputProps> = ({ 
  onMention,
  placeholder = "Type @ to mention someone" 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number } | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuth();

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsSuggestionsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const fetchUsers = async (query: string) => {
    if (query.length === 0) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .ilike('username', `%${query}%`)
        .order('username')
        .limit(8);
        
      if (error) throw error;
      
      // Filter out current user
      const filteredUsers = data?.filter(u => u.id !== currentUser?.id) || [];
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // Check for mention pattern - @ followed by text
    const mentionMatch = value.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const searchText = mentionMatch[1].toLowerCase();
      setMentionQuery(searchText);
      fetchUsers(searchText);
      
      // Calculate position
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setMentionPosition({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX });
      }
      setIsSuggestionsOpen(true);
    } else {
      setMentionQuery(null);
      setIsSuggestionsOpen(false);
    }
  };

  const handleMentionSelect = (username: string) => {
    // Replace the @query with @username
    const newValue = inputValue.replace(/@\w*$/, `@${username} `);
    setInputValue(newValue);
    setIsSuggestionsOpen(false);
    onMention(username);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        ref={inputRef}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full border rounded p-2 bg-background"
      />
      
      {isSuggestionsOpen && mentionPosition && (
        <div 
          ref={suggestionsRef}
          className="mention-suggestions absolute z-50"
          style={{ 
            top: `${mentionPosition.top}px`, 
            left: `${mentionPosition.left}px`,
            width: '280px'
          }}
        >
          <Command className="rounded-lg border shadow-md">
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
                    onSelect={() => handleMentionSelect(user.username)}
                    className="flex items-center gap-2 p-2 cursor-pointer"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>
                        {user.display_name?.charAt(0) || user.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.display_name || user.username}</span>
                      <span className="text-xs text-muted-foreground">@{user.username}</span>
                    </div>
                  </CommandItem>
                ))
              ) : mentionQuery ? (
                <div className="p-2 text-center">
                  <span className="text-sm text-muted-foreground">No users found matching "{mentionQuery}"</span>
                </div>
              ) : null}
            </CommandGroup>
          </Command>
        </div>
      )}
    </div>
  );
};

export default MentionInput;
