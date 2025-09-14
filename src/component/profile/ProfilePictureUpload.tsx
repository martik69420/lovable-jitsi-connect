
import * as React from 'react';
import { useAuth } from '@/context/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserRound, Camera, Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';

interface ProfilePictureUploadProps {
  currentAvatar?: string | null;
  onFileSelect?: (file: File) => void;
  previewUrl?: string | null;
  setPreviewUrl?: React.Dispatch<React.SetStateAction<string | null>>;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentAvatar,
  onFileSelect,
  previewUrl,
  setPreviewUrl
}) => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const uploadToStorage = async (file: File): Promise<string | null> => {
    if (!user?.id) return null;

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Storage upload error:', error);
      return null;
    }
  };

  const validateFile = (file: File): boolean => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive"
      });
      return false;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const processFile = async (file: File) => {
    if (!validateFile(file)) return;

    // If parent component has provided callbacks, use those
    if (onFileSelect) {
      onFileSelect(file);
      
      // Create preview URL
      if (setPreviewUrl) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setPreviewUrl(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
      return;
    }

    // Otherwise use the default behavior
    try {
      setIsUploading(true);
      
      // Upload to storage
      const avatarUrl = await uploadToStorage(file);
      
      if (!avatarUrl) {
        throw new Error('Failed to upload image');
      }

      // Update user profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user?.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh user data
      await refreshUser();

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been successfully updated.",
      });

    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast({
        title: "Upload failed",
        description: "Failed to update profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const clearPreview = () => {
    if (setPreviewUrl) {
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Determine which avatar URL to use
  const avatarUrl = previewUrl || (currentAvatar !== undefined ? currentAvatar : user?.avatar);
  const displayName = user?.displayName || "";

  return (
    <div className="space-y-4">
      {/* Main Upload Area */}
      <Card 
        className={`relative group transition-all duration-200 ${
          isDragOver ? 'border-primary bg-primary/5' : 'border-dashed border-2'
        } ${isUploading ? 'opacity-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 border-2 border-border shadow-lg">
                <AvatarImage src={avatarUrl || ""} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {displayName?.charAt(0) || user?.username?.charAt(0) || <UserRound />}
                </AvatarFallback>
              </Avatar>
              
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                  <Loader2 className="h-6 w-6 text-white animate-spin" />
                </div>
              )}
              
              {previewUrl && (
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={clearPreview}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Update Profile Picture</h3>
              <p className="text-sm text-muted-foreground">
                Drag and drop an image here, or click to select
              </p>
            </div>

            <Button
              variant="outline"
              onClick={handleButtonClick}
              disabled={isUploading}
              className="w-full sm:w-auto"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Image
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* File Guidelines */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Supported formats: JPEG, PNG, GIF, WebP</p>
        <p>• Maximum file size: 5MB</p>
        <p>• Square images work best (1:1 ratio)</p>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/jpeg,image/png,image/gif,image/webp"
      />
    </div>
  );
};

export default ProfilePictureUpload;
