
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/component/ui/button';
import { Textarea } from '@/component/ui/textarea';
import { Send, Smile, Paperclip, Loader2, Image, X, FileImage, Zap, Mic, Video, File } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/component/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/component/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/component/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/component/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import EmojiPicker from '@/component/messaging/EmojiPicker';
import { EnhancedEmojiPicker } from '@/component/messaging/EnhancedEmojiPicker';
import GifPicker from '@/component/messaging/GifPicker';
import PrebuiltGifs from '@/component/messaging/PrebuiltGifs';
import GifCreator from '@/component/messaging/GifCreator';
import { TypingIndicator } from '@/component/messaging/TypingIndicator';
import { VoiceRecorder } from '@/component/messaging/VoiceRecorder';
import { MediaUpload } from '@/component/messaging/MediaUpload';

interface MessageInputProps {
  onSendMessage: (message: string, imageFile?: File, gifUrl?: string, replyTo?: string, mediaFile?: File, mediaType?: string, voiceBlob?: Blob, mentionedUsers?: string[], sharedPostId?: string) => Promise<void>;
  isSending: boolean;
  disabled?: boolean;
  receiverId?: string;
  replyingTo?: { id: string; content: string; sender: string } | null;
  onCancelReply?: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  isSending, 
  disabled, 
  receiverId,
  replyingTo,
  onCancelReply
}) => {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{ file: File; type: string } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifDialog, setShowGifDialog] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [showMediaDialog, setShowMediaDialog] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingIndicatorRef = useRef<any>(null);

  const handleSend = async () => {
    if ((message.trim() || selectedImage || selectedGif || selectedMedia) && !isSending) {
      try {
        // Extract @mentions from message
        const mentionRegex = /@(\w+)/g;
        const mentions = [...message.matchAll(mentionRegex)].map(match => match[1]);
        
        await onSendMessage(
          message, 
          selectedImage || undefined, 
          selectedGif || undefined, 
          replyingTo?.id,
          selectedMedia?.file,
          selectedMedia?.type,
          undefined,
          mentions.length > 0 ? mentions : undefined
        );
        setMessage('');
        setSelectedImage(null);
        setImagePreview(null);
        setSelectedGif(null);
        setSelectedMedia(null);
        onCancelReply?.();
        
        // Keep focus on textarea after sending
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }, 0);
      } catch (error) {
        console.error('Failed to send message:', error);
        toast({
          title: "Failed to send message",
          description: "Your message could not be sent. Please try again.",
          variant: "destructive"
        });
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive"
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGifSelect = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    setShowGifDialog(false);
    toast({
      title: "GIF Selected",
      description: "GIF added to your message"
    });
  };

  const removeGif = () => {
    setSelectedGif(null);
  };

  const handleVoiceSend = async (audioBlob: Blob) => {
    try {
      await onSendMessage('', undefined, undefined, replyingTo?.id, undefined, undefined, audioBlob, undefined);
      setShowVoiceRecorder(false);
      onCancelReply?.();
      toast({
        title: "Voice message sent",
        description: "Your voice message has been sent"
      });
    } catch (error) {
      console.error('Failed to send voice message:', error);
      toast({
        title: "Failed to send voice message",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleMediaSelect = (file: File, type: string) => {
    setSelectedMedia({ file, type });
    setShowMediaDialog(false);
    toast({
      title: "Media Selected",
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} added to your message`
    });
  };

  const removeMedia = () => {
    setSelectedMedia(null);
  };

  const insertEmoji = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    
    // Focus the textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const cursorPos = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [message]);

  // Focus the textarea when the component mounts and after messages
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Handle typing indicators
  const handleTypingChange = (typing: boolean) => {
    setIsTyping(typing);
  };

  // Trigger typing when user types
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Trigger typing indicator with current input value
    if (typingIndicatorRef.current && receiverId) {
      typingIndicatorRef.current.handleTyping(e.target.value);
    }
  };

  return (
    <div className="border-t p-3 dark:border-gray-800 bg-background/95 backdrop-blur-sm">
      {/* Reply Preview */}
      {replyingTo && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-lg">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-primary">
              Replying to {replyingTo.sender}
            </div>
            <div className="text-sm text-muted-foreground truncate">
              {replyingTo.content}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onCancelReply}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Media Previews */}
      <div className="flex gap-3 mb-3">
        {imagePreview && (
          <div className="relative inline-block animate-bounce-in">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-w-32 max-h-32 rounded-lg object-cover border shadow-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 animate-bounce-in"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {selectedGif && (
          <div className="relative inline-block animate-bounce-in">
            <img 
              src={selectedGif} 
              alt="Selected GIF" 
              className="max-w-32 max-h-32 rounded-lg object-cover border shadow-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 animate-bounce-in"
              onClick={removeGif}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className="flex gap-2 items-end">
        <div className="flex gap-1 items-center">
          <TooltipProvider>
            <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary"
                  disabled={isSending || disabled}
                >
                  <Smile className="h-5 w-5" />
                  <span className="sr-only">Add emoji</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" side="top" align="start">
                <EnhancedEmojiPicker onEmojiSelect={insertEmoji} />
              </PopoverContent>
            </Popover>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary"
                  disabled={isSending || disabled}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-5 w-5" />
                  <span className="sr-only">Attach image</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach image</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-primary"
                  disabled={isSending || disabled}
                  onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                >
                  <Mic className="h-5 w-5" />
                  <span className="sr-only">Record voice</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Record voice message</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <Textarea
          ref={textareaRef}
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[150px] flex-1 resize-none py-2 px-3 focus-visible:ring-1 focus-visible:ring-primary"
          value={message}
          onChange={handleMessageChange}
          onKeyDown={handleKeyDown}
          disabled={isSending || disabled}
          rows={1}
        />
        
        <Button
          variant="default"
          size="icon"
          disabled={(!message.trim() && !selectedImage && !selectedGif && !selectedMedia) || isSending || disabled}
          onClick={handleSend}
          className="flex-shrink-0"
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
          <span className="sr-only">Send</span>
        </Button>
      </div>

      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageSelect}
      />
      
      {/* Voice Recorder Dialog */}
      {showVoiceRecorder && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-4 bg-background border rounded-lg shadow-lg">
          <VoiceRecorder 
            onSend={handleVoiceSend}
            onCancel={() => setShowVoiceRecorder(false)}
          />
        </div>
      )}
      
      {/* Typing Indicator Component (hidden) */}
      {receiverId && (
        <TypingIndicator
          ref={typingIndicatorRef}
          receiverId={receiverId}
          onTypingChange={handleTypingChange}
        />
      )}
    </div>
  );
};

export default MessageInput;
