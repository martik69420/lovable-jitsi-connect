
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { Image, Link, Upload, X, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImageAdd: (imageUrl: string, displayType: 'link' | 'preview') => void;
  onImageRemove: (index: number) => void;
  images: Array<{ url: string; displayType: 'link' | 'preview' }>;
  defaultDisplayType?: 'link' | 'preview';
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageAdd,
  onImageRemove,
  images,
  defaultDisplayType = 'link'
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [displayType, setDisplayType] = useState<'link' | 'preview'>(defaultDisplayType);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUrlAdd = () => {
    if (imageUrl.trim()) {
      onImageAdd(imageUrl.trim(), displayType);
      setImageUrl('');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      // Create a local URL for the image
      const localUrl = URL.createObjectURL(file);
      onImageAdd(localUrl, displayType);
      
      toast({
        title: "Image added",
        description: "Your image has been added to the post.",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <CardContent className="space-y-4 p-0">
          <div className="space-y-2">
            <Label>Display Type</Label>
            <RadioGroup value={displayType} onValueChange={(value: 'link' | 'preview') => setDisplayType(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="link" id="link" />
                <Label htmlFor="link" className="flex items-center gap-2">
                  <Link className="h-4 w-4" />
                  Show as clickable link
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="preview" id="preview" />
                <Label htmlFor="preview" className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Show image preview
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-url">Image URL</Label>
            <div className="flex gap-2">
              <Input
                id="image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
              />
              <Button type="button" onClick={handleUrlAdd} disabled={!imageUrl.trim()}>
                Add
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-border"></div>
            <span className="text-sm text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {images.length > 0 && (
        <div className="space-y-2">
          <Label>Added Images</Label>
          <div className="space-y-2">
            {images.map((image, index) => (
              <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                {image.displayType === 'preview' ? (
                  <img 
                    src={image.url} 
                    alt={`Preview ${index + 1}`}
                    className="w-12 h-12 object-cover rounded"
                  />
                ) : (
                  <Image className="h-5 w-5 text-muted-foreground" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{image.url}</p>
                  <p className="text-xs text-muted-foreground">
                    {image.displayType === 'preview' ? 'Preview' : 'Link'}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onImageRemove(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
