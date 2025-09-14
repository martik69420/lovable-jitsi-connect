import React from 'react';
import { useUnreadMessages } from '@/hooks/use-unread-messages';

const UnreadMessagesTitle: React.FC = () => {
  // This hook updates the document.title with unread count in real-time
  useUnreadMessages();
  return null;
};

export default UnreadMessagesTitle;