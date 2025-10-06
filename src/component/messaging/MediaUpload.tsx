import { useRef } from 'react';
import { Image, Video, Music, FileText, Paperclip } from 'lucide-react';
import { Button } from '@/component/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/component/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';

interface MediaUploadProps {
  onFileSelect: (file: File, type: 'image' | 'video' | 'audio' | 'document') => void;
}

export function MediaUpload({ onFileSelect }: MediaUploadProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'image' | 'video' | 'audio' | 'document'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 50MB",
          variant: "destructive"
        });
        return;
      }
      onFileSelect(file, type);
    }
    e.target.value = '';
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Paperclip className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => imageInputRef.current?.click()}>
            <Image className="w-4 h-4 mr-2" />
            Image
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => videoInputRef.current?.click()}>
            <Video className="w-4 h-4 mr-2" />
            Video
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => audioInputRef.current?.click()}>
            <Music className="w-4 h-4 mr-2" />
            Audio
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => documentInputRef.current?.click()}>
            <FileText className="w-4 h-4 mr-2" />
            Document
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'video')}
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'audio')}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'document')}
      />
    </>
  );
}
