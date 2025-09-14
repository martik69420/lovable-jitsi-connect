import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
}

const commonEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
  '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
  '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
  '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
  '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
  '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
  '😰', '😥', '😓', '🤗', '🤔', '😑', '😐', '😶',
  '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴',
  '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧',
  '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹',
  '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾',
  '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽',
  '🙀', '😿', '😾', '❤️', '🧡', '💛', '💚', '💙',
  '💜', '🤎', '🖤', '🤍', '💔', '❣️', '💕', '💞',
  '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️',
  '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️',
  '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍',
  '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️',
  '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟',
  '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
  '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤝',
  '💯', '💥', '💫', '💦', '💨', '🔥', '⭐', '🌟',
  '✨', '⚡', '☄️', '💎', '🔮', '🏆', '🎉', '🎊'
];

const emojiCategories = {
  'Frequently Used': ['😀', '😂', '❤️', '👍', '👎', '😍', '🔥', '💯'],
  'Smileys': [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
    '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
    '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜'
  ],
  'Gestures': [
    '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟',
    '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️',
    '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤝'
  ],
  'Hearts': [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤',
    '🤍', '💔', '❣️', '💕', '💞', '💓', '💗', '💖'
  ],
  'Objects': [
    '💯', '💥', '💫', '💦', '💨', '🔥', '⭐', '🌟',
    '✨', '⚡', '☄️', '💎', '🔮', '🏆', '🎉', '🎊'
  ]
};

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect }) => {
  const [selectedCategory, setSelectedCategory] = useState('Frequently Used');
  
  return (
    <div className="w-80 h-80 flex flex-col">
      {/* Category tabs */}
      <div className="flex border-b">
        {Object.keys(emojiCategories).map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-2 text-xs font-medium transition-colors ${
              selectedCategory === category
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {category === 'Frequently Used' ? '⏰' : 
             category === 'Smileys' ? '😀' :
             category === 'Gestures' ? '👋' :
             category === 'Hearts' ? '❤️' : '🎯'}
          </button>
        ))}
      </div>
      
      {/* Emoji grid */}
      <div className="flex-1 overflow-y-auto p-2">
        <div className="grid grid-cols-8 gap-1">
          {emojiCategories[selectedCategory as keyof typeof emojiCategories].map((emoji, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-muted transition-colors hover:scale-110"
              onClick={() => onEmojiSelect(emoji)}
            >
              <span className="text-lg">{emoji}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;