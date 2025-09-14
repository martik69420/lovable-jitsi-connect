
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: async () => {},
  toggleTheme: async () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load theme from localStorage first
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    if (storedTheme) {
      setThemeState(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
    }
  }, []);

  // Setup Supabase auth listener to get user ID directly
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user?.id || null);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Fetch user theme preference when authenticated
  useEffect(() => {
    const fetchThemePreference = async () => {
      if (userId) {
        try {
          // Check if there are any user settings records for this user
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          if (error && error.code !== 'PGRST116') {
            // PGRST116 is code for "no rows returned", so we'll create a new settings row below
            console.error('Error fetching theme settings:', error);
            return;
          }
          
          if (data) {
            // If settings exist, use localStorage theme and store it in user_settings
            const userTheme = localStorage.getItem('theme') as Theme || 'light';
            
            // Store current theme preference in the database (without expecting a theme column)
            await supabase
              .from('user_settings')
              .upsert({ 
                user_id: userId,
                // Note: We don't include theme here as it doesn't exist in the table
              });
              
            setThemeState(userTheme);
            localStorage.setItem('theme', userTheme);
            document.documentElement.classList.toggle('dark', userTheme === 'dark');
          } else {
            // If no settings found, create a new record with default settings
            const userTheme = localStorage.getItem('theme') as Theme || 'light';
            
            await supabase
              .from('user_settings')
              .upsert({ 
                user_id: userId
                // Note: We don't include theme here as it doesn't exist in the table
              });
              
            setThemeState(userTheme);
            localStorage.setItem('theme', userTheme);
            document.documentElement.classList.toggle('dark', userTheme === 'dark');
          }
        } catch (error) {
          console.error('Failed to fetch or store theme settings:', error);
        }
      }
    };
    
    fetchThemePreference();
  }, [userId]);

  // Function to set theme and save preference to database
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    
    // Save theme to localStorage only since the database doesn't have a theme column
    // If user is authenticated, we still update the other settings
    if (userId) {
      try {
        const { error } = await supabase
          .from('user_settings')
          .upsert({ 
            user_id: userId
            // No theme field as it doesn't exist in the table
          });
          
        if (error) {
          throw error;
        }
      } catch (error) {
        console.error('Failed to save theme preference:', error);
        toast({
          title: "Error saving preference",
          description: "Your theme preference has been saved locally only",
          variant: "destructive"
        });
      }
    }
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    await setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
