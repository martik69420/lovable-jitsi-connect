import { FileText, Download } from 'lucide-react';
import { Button } from '@/component/ui/button';

interface MediaViewerProps {
  url: string;
  type: 'image' | 'video' | 'audio' | 'voice' | 'document';
  filename?: string;
}

export function MediaViewer({ url, type, filename }: MediaViewerProps) {
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'download';
    a.click();
  };

  if (type === 'image') {
    return (
      <img
        src={url}
        alt="Shared image"
        className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => window.open(url, '_blank')}
      />
    );
  }

  if (type === 'video') {
    return (
      <video
        src={url}
        controls
        className="max-w-xs rounded-lg"
      >
        Your browser does not support the video tag.
      </video>
    );
  }

  if (type === 'audio' || type === 'voice') {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg max-w-xs">
        <audio src={url} controls className="flex-1">
          Your browser does not support the audio tag.
        </audio>
      </div>
    );
  }

  if (type === 'document') {
    return (
      <div className="flex items-center gap-3 p-3 bg-muted rounded-lg max-w-xs">
        <FileText className="w-8 h-8 text-muted-foreground" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{filename || 'Document'}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={handleDownload}>
          <Download className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return null;
}
