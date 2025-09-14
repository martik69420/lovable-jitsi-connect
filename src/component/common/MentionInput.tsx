
import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, AtSign, Search, Shield, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMentions, MentionUser } from '@/component/common/MentionsProvider';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth';

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
  disabled?: boolean;
}

const MentionInput: React.FC<MentionInputProps> = ({
  value,
  onChange,
  placeholder = "Write something...",
  className,
  rows = 3,
  disabled = false
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const { mentionUsers, loadingMentions, searchMentions, resetMentions } = useMentions();
  const { user } = useAuth();

  // Get the current cursor position and text before cursor
  const getCurrentMentionQuery = () => {
    const input = inputRef.current;
    if (!input) return null;

    const cursorPosition = input.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    
    // Find the last @ symbol
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol >= 0) {
      // Check if there's any whitespace between @ and cursor
      const textAfterAt = textBeforeCursor.slice(lastAtSymbol);
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        const query = textAfterAt.slice(1); // Remove the @ symbol
        return {
          query,
          position: lastAtSymbol
        };
      }
    }
    
    return null;
  };

  // Handle input changes and detect mention patterns
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    
    const mentionData = getCurrentMentionQuery();
    
    if (mentionData) {
      setQuery(mentionData.query);
      setMentionStart(mentionData.position);
      setShowSuggestions(true);
      setSelectedIndex(0);
      searchMentions(mentionData.query);
      positionSuggestions();
    } else {
      setShowSuggestions(false);
      resetMentions();
    }
  };

  // Position the suggestion popover near the current @ mention
  const positionSuggestions = () => {
    const input = inputRef.current;
    if (!input) return;
    
    const mentionData = getCurrentMentionQuery();
    if (!mentionData) return;
    
    // Get the text until the mention start position
    const textUntilMention = value.substring(0, mentionData.position);
    
    // Create a hidden div to measure position
    const measurer = document.createElement('div');
    measurer.style.position = 'absolute';
    measurer.style.visibility = 'hidden';
    measurer.style.width = `${input.clientWidth}px`;
    measurer.style.fontSize = window.getComputedStyle(input).fontSize;
    measurer.style.lineHeight = window.getComputedStyle(input).lineHeight;
    measurer.style.whiteSpace = 'pre-wrap';
    measurer.style.wordBreak = 'break-word';
    measurer.style.overflowWrap = 'break-word';
    measurer.style.paddingLeft = window.getComputedStyle(input).paddingLeft;
    measurer.style.paddingRight = window.getComputedStyle(input).paddingRight;
    measurer.innerHTML = textUntilMention.replace(/\n/g, '<br>');
    
    document.body.appendChild(measurer);
    
    // Get the position of the last line
    const measurerRect = measurer.getBoundingClientRect();
    const inputRect = input.getBoundingClientRect();
    
    const lastChar = measurer.innerHTML.lastIndexOf('<br>') !== -1
      ? measurer.innerHTML.lastIndexOf('<br>') + 4 // +4 for <br>
      : 0;
      
    const lastLine = document.createElement('span');
    lastLine.innerHTML = measurer.innerHTML.substring(lastChar);
    measurer.appendChild(lastLine);
    const lastLineRect = lastLine.getBoundingClientRect();
    
    document.body.removeChild(measurer);
    
    // Calculate position
    const top = lastLineRect.top - inputRect.top + lastLineRect.height + 5;
    let left = lastLineRect.left - inputRect.left;
    
    setPosition({
      top,
      left: Math.max(0, left)
    });
  };

  // Insert the selected mention into the text
  const insertMention = (user: MentionUser) => {
    const beforeMention = value.substring(0, mentionStart);
    const afterMention = value.substring(inputRef.current?.selectionStart || 0);
    
    const newValue = `${beforeMention}@${user.username} ${afterMention}`;
    
    onChange(newValue);
    setShowSuggestions(false);
    resetMentions();
    
    // Set focus back to input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const cursorPosition = mentionStart + user.username.length + 2; // +2 for @ and space
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 0);
  };

  // Handle keyboard navigation through suggestions
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showSuggestions) return;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < mentionUsers.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
      case 'Tab':
        if (mentionUsers.length > 0) {
          e.preventDefault();
          insertMention(mentionUsers[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        resetMentions();
        break;
    }
  };

  // Handle click outside to close the suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        resetMentions();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [resetMentions]);

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
            ref={popoverRef}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 overflow-auto bg-popover text-popover-foreground shadow-lg rounded-lg border border-border max-h-60 w-[280px]"
            style={{ 
              top: `${position.top}px`, 
              left: `${position.left}px`,
            }}
          >
            <div className="p-2">
              {/* Header for the suggestion panel */}
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground flex items-center mb-1 border-b">
                <AtSign className="h-3 w-3 mr-1" />
                {query ? (
                  <span>Matching "{query}"</span>
                ) : (
                  <span>Type a username</span>
                )}
              </div>
              
              {loadingMentions ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-5 w-5 mx-auto mb-2 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Searching...</p>
                </div>
              ) : mentionUsers.length > 0 ? (
                mentionUsers.map((user, index) => (
                  <motion.div
                    key={user.id}
                    initial={{ backgroundColor: "transparent" }}
                    animate={{ 
                      backgroundColor: index === selectedIndex ? "hsl(var(--muted))" : "transparent"
                    }}
                    whileHover={{ backgroundColor: "hsl(var(--muted))" }}
                    className={`flex items-center space-x-3 p-3 rounded cursor-pointer transition-colors ${
                      index === selectedIndex ? 'bg-muted' : ''
                    }`}
                    onClick={() => insertMention(user)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={user.avatar_url || ''} alt={user.display_name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-medium truncate">
                          {user.display_name || user.username}
                        </p>
                        {user.isAdmin && (
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/30 text-[10px] px-1 py-0">
                            <Shield className="h-2.5 w-2.5 mr-0.5" />
                            ADMIN
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                    {index === selectedIndex && (
                      <Check className="h-4 w-4 text-primary self-center" />
                    )}
                  </motion.div>
                ))
              ) : query ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                  <p>No users found matching "{query}"</p>
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <AtSign className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                  <p>Type to search for users</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentionInput;
