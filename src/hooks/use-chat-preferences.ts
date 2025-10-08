import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChatPreferences {
  theme: string;
  background: string | null;
}

export const useChatPreferences = (userId: string | undefined, chatId: string | null, chatType: 'direct' | 'group') => {
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<ChatPreferences>({
    theme: 'default',
    background: null
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId && chatId) {
      loadPreferences();
    }
  }, [userId, chatId, chatType]);

  const loadPreferences = async () => {
    if (!userId || !chatId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('chat_preferences')
        .select('theme, background')
        .eq('user_id', userId)
        .eq('chat_id', chatId)
        .eq('chat_type', chatType)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPreferences({
          theme: data.theme || 'default',
          background: data.background
        });
      } else {
        // Set defaults if no preferences exist
        setPreferences({
          theme: 'default',
          background: null
        });
      }
    } catch (error) {
      console.error('Error loading chat preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: Partial<ChatPreferences>) => {
    if (!userId || !chatId) return;

    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      
      const { error } = await supabase
        .from('chat_preferences')
        .upsert({
          user_id: userId,
          chat_id: chatId,
          chat_type: chatType,
          theme: updatedPreferences.theme,
          background: updatedPreferences.background,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,chat_id,chat_type'
        });

      if (error) throw error;

      setPreferences(updatedPreferences);
      
      toast({
        title: "Preferences saved",
        description: "Your chat preferences have been updated"
      });
    } catch (error) {
      console.error('Error saving chat preferences:', error);
      toast({
        title: "Error saving preferences",
        description: "Failed to save your chat preferences",
        variant: "destructive"
      });
    }
  };

  return {
    preferences,
    loading,
    savePreferences
  };
};
