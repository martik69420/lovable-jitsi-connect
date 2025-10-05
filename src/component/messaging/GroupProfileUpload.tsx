import React, { useState } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { Button } from '@/component/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/component/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GroupProfileUploadProps {
  groupId: string;
  currentAvatarUrl: string | null;
  groupName: string;
  onAvatarUpdated?: (newAvatarUrl: string) => void;
}

const GroupProfileUpload: React.FC<GroupProfileUploadProps> = ({
  groupId,
  currentAvatarUrl,
  groupName,
  onAvatarUpdated
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${groupId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('groups')
        .update({ avatar_url: publicUrl })
        .eq('id', groupId);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Group picture updated successfully!'
      });

      onAvatarUpdated?.(publicUrl);
      setOpen(false);
    } catch (error) {
      console.error('Error uploading group picture:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload group picture.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="relative group">
          <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
            <AvatarImage src={currentAvatarUrl || '/placeholder.svg'} alt={groupName} />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-2xl">
              {groupName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="h-6 w-6 text-white" />
          </div>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Group Picture</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-center">
            <Avatar className="h-32 w-32">
              <AvatarImage src={currentAvatarUrl || '/placeholder.svg'} alt={groupName} />
              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-4xl">
                {groupName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="group-avatar-upload"
              disabled={uploading}
            />
            <label htmlFor="group-avatar-upload">
              <Button
                variant="outline"
                className="w-full"
                disabled={uploading}
                asChild
              >
                <span>
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose Image
                    </>
                  )}
                </span>
              </Button>
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupProfileUpload;
