import React from 'react';
import { ExternalLink } from 'lucide-react';

interface CombinedContentRendererProps {
  content: string;
  className?: string;
}

const CombinedContentRenderer: React.FC<CombinedContentRendererProps> = ({ content, className = '' }) => {
  // Enhanced URL regex that matches various URL patterns
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s]*)?)/g;
  // Mention regex to match @username patterns
  const mentionRegex = /@(\w+)/g;
  
  const renderContentWithLinksAndMentions = (text: string) => {
    // Split text by URLs first
    const urlParts = text.split(urlRegex);
    
    return urlParts.map((part, index) => {
      if (urlRegex.test(part)) {
        // This is a URL
        let url = part;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = `https://${part}`;
        }
        
        return (
          <a
            key={`url-${index}`}
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
      } else {
        // This is regular text, check for mentions
        const mentionParts = part.split(mentionRegex);
        
        return mentionParts.map((mentionPart, mentionIndex) => {
          // Check if this part is a captured username (every odd index after split)
          if (mentionIndex % 2 === 1) {
            return (
              <span
                key={`mention-${index}-${mentionIndex}`}
                className="text-primary font-medium hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  // You can add navigation to user profile here
                  console.log('Navigate to user:', mentionPart);
                }}
              >
                @{mentionPart}
              </span>
            );
          } else {
            return <span key={`text-${index}-${mentionIndex}`}>{mentionPart}</span>;
          }
        });
      }
    });
  };

  return (
    <div className={className}>
      {renderContentWithLinksAndMentions(content)}
    </div>
  );
};

export default CombinedContentRenderer;