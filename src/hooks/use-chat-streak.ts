import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StreakData {
  streakCount: number;
  isActive: boolean;
  lastMessageDate: string | null;
}

export const useChatStreak = (userId: string | undefined, chatPartnerId: string | null) => {
  const [streak, setStreak] = useState<StreakData>({
    streakCount: 0,
    isActive: true,
    lastMessageDate: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !chatPartnerId) {
      setLoading(false);
      return;
    }

    calculateStreak();
  }, [userId, chatPartnerId]);

  const calculateStreak = async () => {
    if (!userId || !chatPartnerId) return;

    try {
      // Get all messages between the two users, ordered by date
      const { data: messages, error } = await supabase
        .from('messages')
        .select('created_at, sender_id')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${chatPartnerId}),and(sender_id.eq.${chatPartnerId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages for streak:', error);
        setLoading(false);
        return;
      }

      if (!messages || messages.length === 0) {
        setStreak({ streakCount: 0, isActive: true, lastMessageDate: null });
        setLoading(false);
        return;
      }

      // Group messages by date and check if both users messaged each day
      const messagesByDate = new Map<string, Set<string>>();
      
      messages.forEach(msg => {
        const date = new Date(msg.created_at!).toISOString().split('T')[0];
        if (!messagesByDate.has(date)) {
          messagesByDate.set(date, new Set());
        }
        messagesByDate.get(date)!.add(msg.sender_id);
      });

      // Calculate streak - both users must message each other on consecutive days
      const sortedDates = Array.from(messagesByDate.keys()).sort().reverse();
      let streakCount = 0;
      let isActive = true;
      
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      // Check if streak is still active (messaged today or yesterday)
      const lastMessageDate = sortedDates[0];
      if (lastMessageDate !== today && lastMessageDate !== yesterday) {
        isActive = false;
      }

      // Count consecutive days where both users messaged
      let currentDate = new Date(sortedDates[0]);
      
      for (let i = 0; i < sortedDates.length; i++) {
        const dateStr = sortedDates[i];
        const senders = messagesByDate.get(dateStr)!;
        
        // Both users must have sent a message
        if (senders.has(userId) && senders.has(chatPartnerId)) {
          const expectedDate = new Date(currentDate);
          expectedDate.setDate(expectedDate.getDate() - i);
          const expectedDateStr = expectedDate.toISOString().split('T')[0];
          
          if (dateStr === expectedDateStr || i === 0) {
            streakCount++;
          } else {
            break;
          }
        } else if (i === 0) {
          // First day doesn't have both users, but still count partial
          const expectedDate = new Date(currentDate);
          expectedDate.setDate(expectedDate.getDate() - 1);
          const prevDateStr = expectedDate.toISOString().split('T')[0];
          
          if (messagesByDate.has(prevDateStr)) {
            const prevSenders = messagesByDate.get(prevDateStr)!;
            if (prevSenders.has(userId) && prevSenders.has(chatPartnerId)) {
              currentDate = expectedDate;
              streakCount++;
            }
          }
        } else {
          break;
        }
      }

      setStreak({
        streakCount,
        isActive,
        lastMessageDate
      });
    } catch (err) {
      console.error('Error calculating streak:', err);
    } finally {
      setLoading(false);
    }
  };

  return { ...streak, loading, refreshStreak: calculateStreak };
};
