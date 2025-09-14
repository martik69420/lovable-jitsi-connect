
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import TwitterMentionInput from '@/components/mentions/TwitterMentionInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Send, Image as ImageIcon } from 'lucide-react';
import { usePost } from '@/context/PostContext';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from './ImageUpload';

const CreatePostForm: React.FC = () => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<Array<{ url: string; displayType: 'link' | 'preview' }>>([]);
  const [isImageSectionOpen, setIsImageSectionOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createPost } = usePost();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0) {
      toast({
        title: "Empty post",
        description: "Please add some content or images to your post.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const imageUrls = images.map(img => img.url);
      await createPost(content, imageUrls);
      
      // Reset form
      setContent('');
      setImages([]);
      setIsImageSectionOpen(false);
      
      toast({
        title: "Post created",
        description: "Your post has been published successfully.",
      });
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageAdd = (imageUrl: string, displayType: 'link' | 'preview') => {
    setImages(prev => [...prev, { url: imageUrl, displayType }]);
  };

  const handleImageRemove = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card className="mb-6 shadow-lg border-0 bg-background/95 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">Create a new post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TwitterMentionInput
            placeholder="What's on your mind?"
            value={content}
            onChange={setContent}
            className="min-h-[100px] resize-none border-0 bg-muted/30 focus-visible:ring-1 focus-visible:ring-primary"
            disabled={isSubmitting}
          />

          <Collapsible open={isImageSectionOpen} onOpenChange={setIsImageSectionOpen}>
            <CollapsibleTrigger asChild>
              <Button 
                type="button" 
                variant="ghost" 
                className="w-full justify-between text-muted-foreground hover:text-foreground"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Add Images {images.length > 0 && `(${images.length})`}
                </div>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4">
              <ImageUpload
                onImageAdd={handleImageAdd}
                onImageRemove={handleImageRemove}
                images={images}
                defaultDisplayType="link"
              />
            </CollapsibleContent>
          </Collapsible>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={isSubmitting || (!content.trim() && images.length === 0)}
              className="bg-primary hover:bg-primary/90"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Publishing...' : 'Publish'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreatePostForm;
