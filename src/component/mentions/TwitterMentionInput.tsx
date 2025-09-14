import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Command, CommandGroup, CommandItem } from '@/components/ui/command';
import { AtSign, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';

interface MentionUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
}

interface TwitterMentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
}

const TwitterMentionInput: React.FC<TwitterMentionInputProps> = ({
  value,
  onChange,
  placeholder = "What's happening?",
  className,
  rows = 3,
  disabled = false
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [loading, setLoading] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuth();

  // Search for users when mention query changes
  useEffect(() => {
    const searchUsers = async () => {
      if (mentionQuery.length === 0) {
        setUsers([]);
        return;
      }
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url')
          .ilike('username', `${mentionQuery}%`)
          .order('username')
          .limit(8);
          
        if (error) throw error;
        
        // Filter out current user
        const filteredUsers = data?.filter(u => u.id !== currentUser?.id) || [];
        setUsers(filteredUsers);
      } catch (error) {
        console.error('Error searching users:', error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [mentionQuery, currentUser?.id]);

  // Handle input changes and detect mention patterns
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPos);
    
    // Look for @ mentions
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      const mentionStart = cursorPos - mentionMatch[0].length;
      
      setMentionQuery(query);
      setMentionStartPos(mentionStart);
      setShowSuggestions(true);
      setSelectedIndex(0);
      
      // Position the suggestions dropdown
      if (inputRef.current) {
        const textareaRect = inputRef.current.getBoundingClientRect();
        const textBeforeMention = textBeforeCursor.slice(0, mentionStart);
        const lines = textBeforeMention.split('\n');
        const currentLine = lines.length - 1;
        const charsInCurrentLine = lines[currentLine].length;
        
        // Rough calculation of position
        const lineHeight = 24;
        const charWidth = 8;
        
        setMentionPosition({
          top: textareaRect.top + (currentLine + 1) * lineHeight + window.scrollY,
          left: textareaRect.left + charsInCurrentLine * charWidth + window.scrollX
        });
      }
    } else {
      setShowSuggestions(false);
      setMentionQuery('');
    }
  };

  // Insert mention when user selects one
  const insertMention = (user: MentionUser) => {
    if (!inputRef.current) return;
    
    const beforeMention = value.substring(0, mentionStartPos);
    const afterMention = value.substring(inputRef.current.selectionStart);
    
    const newValue = `${beforeMention}@${user.username} ${afterMention}`;
    onChange(newValue);
    
    setShowSuggestions(false);
    setMentionQuery('');
    
    // Focus back and position cursor
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = mentionStartPos + user.username.length + 2; // +2 for @ and space
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions || users.length === 0) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, users.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
      case 'Tab':
        if (users[selectedIndex]) {
          e.preventDefault();
          insertMention(users[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setMentionQuery('');
        break;
    }
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={rows}
        disabled={disabled}
      />
      
      <AnimatePresence>
        {showSuggestions && (
          <motion.div 
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 bg-popover border border-border rounded-lg shadow-xl overflow-hidden w-72"
            style={{ 
              top: `${mentionPosition.top}px`, 
              left: `${mentionPosition.left}px`,
              position: 'fixed'
            }}
          >
            <Command className="rounded-lg">
              <div className="px-3 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/20 flex items-center">
                <AtSign className="h-3 w-3 mr-1" />
                {mentionQuery ? `Searching for "${mentionQuery}"` : 'Type to search users'}
              </div>
              
              <CommandGroup className="max-h-48 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-5 w-5 mx-auto mb-2 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Searching...</p>
                  </div>
                ) : users.length > 0 ? (
                  users.map((user, index) => (
                    <CommandItem
                      key={user.id}
                      value={user.username}
                      onSelect={() => insertMention(user)}
                      className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                        index === selectedIndex ? 'bg-accent' : ''
                      }`}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <Avatar className="h-8 w-8 border">
                        <AvatarImage src={user.avatar_url || '/placeholder.svg'} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {user.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate">
                          {user.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </CommandItem>
                  ))
                ) : mentionQuery ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No users found matching "{mentionQuery}"
                  </div>
                ) : null}
              </CommandGroup>
            </Command>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TwitterMentionInput;