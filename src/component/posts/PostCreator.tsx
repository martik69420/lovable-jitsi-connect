import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/context/auth";
import { usePost } from "@/context/PostContext";
import { ImagePlus, Smile, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MentionInput from "@/components/mention/MentionInput";

export function PostCreator() {
  const [content, setContent] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { user } = useAuth();
  const { createPost } = usePost();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && images.length === 0) {
      toast({
        title: "Cannot create empty post",
        description: "Please add some text or an image to your post.",
        variant: "destructive"
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createPost(content.trim(), images.length > 0 ? images : undefined);
      setContent("");
      setImages([]);
      toast({
        title: "Post created",
        description: "Your post has been published successfully.",
      });
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create your post. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Mock image upload - in a real app, you'd upload to storage
    // and get back URLs
    const newImages = Array.from(files).map((file) => {
      return URL.createObjectURL(file);
    });
    
    setImages([...images, ...newImages]);
  };

  const handleDeleteImage = (index: number) => {
    const newImages = [...images];
    URL.revokeObjectURL(newImages[index]);
    newImages.splice(index, 1);
    setImages(newImages);
  };

  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  if (!user) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4 text-center">
          <p>Please log in to create a post</p>
        </CardContent>
      </Card>
    );
  }

  const handleMention = (mention: string) => {
    setContent(prev => prev + `@${mention} `);
  };

  return (
    <Card className="mb-6 overflow-hidden">
      <form onSubmit={handleSubmit}>
        <CardHeader className="p-4 pb-2">
          <div className="flex gap-3">
            <Avatar>
              <AvatarImage 
                src={user?.avatar || "/placeholder.svg"} 
                alt={user?.displayName || user?.username} 
              />
              <AvatarFallback>{(user?.displayName || user?.username)?.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={`What's on your mind, ${user?.displayName || user?.username}?`}
                className="w-full border-none focus:ring-0 resize-none min-h-[80px]"
              />
              <div className="mt-2">
                <MentionInput onMention={handleMention} />
              </div>
            </div>
          </div>
        </CardHeader>
        
        {images.length > 0 && (
          <div className="px-4 pb-3">
            <div className="grid grid-cols-2 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={image}
                    alt={`Uploaded image ${index + 1}`}
                    className="rounded-md object-cover w-full aspect-video"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDeleteImage(index)}
                  >
                    ✕
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <CardFooter className="p-4 pt-2 flex justify-between">
          <div className="flex gap-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
              multiple
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenFileDialog}
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Add Image
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>
          
          <Button 
            type="submit" 
            size="sm"
            disabled={isSubmitting || (!content.trim() && images.length === 0)}
          >
            <Send className="h-4 w-4 mr-2" />
            Post
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
