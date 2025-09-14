import React from 'react';
import { ExternalLink } from 'lucide-react';

interface LinkRendererProps {
  content: string;
  className?: string;
}

const LinkRenderer: React.FC<LinkRendererProps> = ({ content, className = '' }) => {
  // Enhanced URL regex that matches various URL patterns
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
  
  const renderTextWithLinks = (text: string) => {
    const parts = text.split(urlRegex);
    
    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        // Ensure URL has protocol
        let url = part;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = `https://${part}`;
        }
        
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline inline-flex items-center gap-1 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
            <ExternalLink className="h-3 w-3" />
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={className}>
      {renderTextWithLinks(content)}
    </div>
  );
};

export default LinkRenderer;