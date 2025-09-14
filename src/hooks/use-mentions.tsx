
import { useState, useCallback, KeyboardEvent } from 'react';

interface Position {
  top: number;
  left: number;
}

interface UseMentionsResult {
  mentionQuery: string | null;
  mentionPosition: Position | null;
  handleInput: (e: React.FormEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  handleKeyDown: (e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => void;
  insertMention: (username: string) => void;
  resetMention: () => void;
}

export function useMentions(
  inputRef: React.RefObject<HTMLTextAreaElement | HTMLInputElement>
): UseMentionsResult {
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionPosition, setMentionPosition] = useState<Position | null>(null);
  const [mentionStartPos, setMentionStartPos] = useState<number | null>(null);

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const target = e.currentTarget;
    const text = target.value;
    const caretPos = target.selectionStart || 0;
    
    // Look backwards from caret for an '@' that's not part of a mention yet
    let i = caretPos - 1;
    while (i >= 0) {
      // Stop if we find whitespace
      if (/\s/.test(text[i])) {
        break;
      }
      
      // If we find an '@', we've found the start of a potential mention
      if (text[i] === '@') {
        const query = text.slice(i + 1, caretPos);
        
        // Only trigger mention if we're at the beginning of a word or line
        const isAtWordStart = i === 0 || /\s/.test(text[i - 1]);
        
        if (isAtWordStart) {
          setMentionQuery(query);
          setMentionStartPos(i);
          
          // Position the suggestion popup near the @ character
          if (inputRef.current) {
            const inputRect = inputRef.current.getBoundingClientRect();
            
            // For a textarea, we need to calculate caret position
            if (inputRef.current instanceof HTMLTextAreaElement) {
              const textBeforeCaret = text.substring(0, i);
              const lines = textBeforeCaret.split('\n');
              const lineIndex = lines.length - 1;
              const charsInLastLine = lines[lineIndex].length;
              
              // Approximate position (this can be improved with better caret positioning logic)
              const lineHeight = 20; // approximate line height in pixels
              const charWidth = 8;  // approximate character width in pixels
              
              const top = inputRect.top + (lineIndex + 1) * lineHeight;
              const left = inputRect.left + charsInLastLine * charWidth;
              
              setMentionPosition({ top, left });
            } else {
              // For a standard input, positioning is simpler
              // Approximate position of the caret
              const textWidth = getTextWidth(text.substring(0, i), getComputedStyles(inputRef.current));
              setMentionPosition({
                top: inputRect.bottom + window.scrollY,
                left: inputRect.left + textWidth + window.scrollX
              });
            }
          }
          return;
        }
      }
      i--;
    }
    
    // If we got here, no active mention
    setMentionQuery(null);
    setMentionPosition(null);
    setMentionStartPos(null);
  }, [inputRef]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    // Close mention suggestions on escape
    if (e.key === 'Escape' && mentionQuery !== null) {
      setMentionQuery(null);
      setMentionPosition(null);
      setMentionStartPos(null);
      e.preventDefault();
    }
    
    // Close suggestions on arrow up/down (let the suggestion box handle these)
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && mentionQuery !== null) {
      e.preventDefault();
    }
  }, [mentionQuery]);

  const insertMention = useCallback((username: string) => {
    if (inputRef.current && mentionStartPos !== null) {
      const input = inputRef.current;
      const text = input.value;
      const before = text.substring(0, mentionStartPos);
      const after = text.substring(input.selectionStart || 0);
      
      // Insert the username with a space
      input.value = `${before}@${username} ${after}`;
      
      // Position caret after the inserted mention
      const newPos = mentionStartPos + username.length + 2; // +2 for @ and space
      input.selectionStart = input.selectionEnd = newPos;
      
      // Focus back on input
      input.focus();
      
      // Reset mention state
      setMentionQuery(null);
      setMentionPosition(null);
      setMentionStartPos(null);
      
      // Trigger input event for React controlled components
      const event = new Event('input', { bubbles: true });
      input.dispatchEvent(event);
    }
  }, [inputRef, mentionStartPos]);

  const resetMention = useCallback(() => {
    setMentionQuery(null);
    setMentionPosition(null);
    setMentionStartPos(null);
  }, []);

  return {
    mentionQuery,
    mentionPosition,
    handleInput,
    handleKeyDown,
    insertMention,
    resetMention
  };
}

// Helper function to get computed styles
function getComputedStyles(element: HTMLElement) {
  return window.getComputedStyle(element);
}

// Helper function to calculate text width
function getTextWidth(text: string, styles: CSSStyleDeclaration) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return 0;
  
  context.font = `${styles.fontStyle} ${styles.fontWeight} ${styles.fontSize} ${styles.fontFamily}`;
  return context.measureText(text).width;
}
