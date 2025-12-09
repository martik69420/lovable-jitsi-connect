import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { usePost } from '@/context/PostContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Image as ImageIcon, AtSign, X } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TwitterMentionInput from '@/components/mentions/TwitterMentionInput';
import { useMentions } from '@/components/common/MentionsProvider';
import { supabase } from '@/integrations/supabase/client';
import PollCreator, { PollData } from '@/component/post/PollCreator';

const PostForm: React.FC = () => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [poll, setPoll] = useState<PollData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createPost } = usePost();
  const { toast } = useToast();
  const { user } = useAuth();

  const uploadPostImages = async (imageFiles: File[]): Promise<string[]> => {
    const imageUrls: string[] = [];
    
    for (const file of imageFiles) {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from('post-images')
          .upload(`public/${fileName}`, file);

        if (error) {
          console.error('Error uploading image:', error);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(`public/${fileName}`);

        imageUrls.push(publicUrl);
      } catch (error) {
        console.error('Exception during image upload:', error);
      }
    }
    
    return imageUrls;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + selectedImages.length > 4) {
      toast({
        title: "Too many images",
        description: "You can only add up to 4 images per post.",
        variant: "destructive"
      });
      return;
    }
    
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB. Please choose a smaller image.`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });

    setSelectedImages(prev => [...prev, ...validFiles]);
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const processMentions = async (text: string): Promise<string[]> => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    if (!matches) return [];
    const usernames = matches.map(match => match.substring(1));
    const uniqueUsernames = [...new Set(usernames)];

    // Check if these users exist
    const { data } = await supabase.from('profiles').select('id, username').in('username', uniqueUsernames);
    return data?.map(profile => profile.id) || [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && selectedImages.length === 0 && !poll) {
      toast({
        title: "Can't create empty post",
        description: "Please write something, add an image, or create a poll.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate poll if exists
    if (poll) {
      if (!poll.question.trim()) {
        toast({
          title: "Poll needs a question",
          description: "Please add a question to your poll.",
          variant: "destructive"
        });
        return;
      }
      const validOptions = poll.options.filter(o => o.trim());
      if (validOptions.length < 2) {
        toast({
          title: "Poll needs options",
          description: "Please add at least 2 options to your poll.",
          variant: "destructive"
        });
        return;
      }
    }
    
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // Upload images first if any
      const imageUrls = selectedImages.length > 0 ? await uploadPostImages(selectedImages) : [];
      
      // Find all mentioned users
      const mentionedUserIds = await processMentions(content);

      // Create post with images
      const postData = await createPost(content, imageUrls);

      // Create poll if exists
      if (postData && poll) {
        const validOptions = poll.options.filter(o => o.trim());
        await supabase.from('polls').insert({
          post_id: postData.id,
          question: poll.question,
          options: validOptions
        });
      }

      // Send notifications to mentioned users only if post was created successfully
      if (postData && mentionedUserIds.length > 0 && user) {
        for (const userId of mentionedUserIds) {
          if (userId !== user.id) {
            // Don't notify yourself
            await supabase.from('notifications').insert({
              user_id: userId,
              type: 'mention',
              content: `${user.displayName || user.username} mentioned you in a post`,
              related_id: postData.id,
              url: `/post/${postData.id}`,
              is_read: false
            });
          }
        }
      }
      
      setContent('');
      setSelectedImages([]);
      setImagePreviews([]);
      setPoll(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast({
        title: "Post created!",
        description: "Your post has been published."
      });
    } catch (error: any) {
      toast({
        title: "Error creating post",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddMention = () => {
    setContent(prev => {
      // Insert @ at cursor position or at the end
      const textArea = document.querySelector('textarea');
      if (textArea) {
        const cursorPos = textArea.selectionStart;
        return prev.substring(0, cursorPos) + '@' + prev.substring(textArea.selectionEnd);
      }
      return prev + '@';
    });

    // Focus the textarea and move cursor after the @
    setTimeout(() => {
      const textArea = document.querySelector('textarea');
      if (textArea) {
        textArea.focus();
        const cursorPos = textArea.value.lastIndexOf('@') + 1;
        textArea.setSelectionRange(cursorPos, cursorPos);
      }
    }, 0);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={user?.avatar} alt={user?.displayName || "User"} />
          <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-4">
          <TwitterMentionInput
            value={content}
            onChange={setContent}
            placeholder="What's on your mind? Use @ to mention friends"
            className="min-h-[80px] resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          
          {/* Image Previews */}
          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Poll Creator - only show when poll is active */}
          <PollCreator poll={poll} onPollChange={setPoll} />
          
          <div className="flex justify-between items-center rounded-none">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={handleAddMention}
              >
                <AtSign className="h-4 w-4 mr-2" />
                Mention
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => fileInputRef.current?.click()}
                disabled={selectedImages.length >= 4}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Add Image ({selectedImages.length}/4)
              </Button>
            </div>
            
            <Button
              type="submit"
              disabled={isSubmitting || (content.trim() === '' && selectedImages.length === 0 && !poll)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                'Post'
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        ref={fileInputRef}
        onChange={handleImageSelect}
      />
    </form>
  );
};

export default PostForm;