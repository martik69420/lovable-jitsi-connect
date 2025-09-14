import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MentionRendererProps {
  content: string;
  className?: string;
}

const MentionRenderer: React.FC<MentionRendererProps> = ({ content, className = '' }) => {
  const navigate = useNavigate();

  // Parse content to find mentions and convert them to clickable links
  const renderContentWithMentions = (text: string) => {
    const mentionRegex = /@(\w+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      // Add text before the mention
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // Add the mention as a clickable link
      const username = match[1];
      parts.push(
        <button
          key={`mention-${match.index}-${username}`}
          onClick={() => navigate(`/profile/${username}`)}
          className="text-purple-600 hover:text-purple-700 font-medium hover:underline transition-colors"
        >
          @{username}
        </button>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts;
  };

  return (
    <div className={className}>
      {renderContentWithMentions(content)}
    </div>
  );
};

export default MentionRenderer;