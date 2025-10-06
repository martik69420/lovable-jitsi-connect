import { Palette } from 'lucide-react';
import { Button } from '@/component/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/component/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';

interface ThemeSelectorProps {
  currentTheme?: string;
  currentBackground?: string;
  onThemeChange: (theme: string, background?: string) => void;
}

const themes = [
  { id: 'default', name: 'Default', bg: 'bg-background' },
  { id: 'ocean', name: 'Ocean', bg: 'bg-gradient-to-br from-blue-500 to-cyan-500' },
  { id: 'sunset', name: 'Sunset', bg: 'bg-gradient-to-br from-orange-500 to-pink-500' },
  { id: 'forest', name: 'Forest', bg: 'bg-gradient-to-br from-green-500 to-emerald-500' },
  { id: 'purple', name: 'Purple Dream', bg: 'bg-gradient-to-br from-purple-500 to-pink-500' },
  { id: 'night', name: 'Night Sky', bg: 'bg-gradient-to-br from-indigo-900 to-purple-900' },
];

const backgrounds = [
  { id: 'none', name: 'None', pattern: '' },
  { id: 'dots', name: 'Dots', pattern: 'bg-[radial-gradient(circle_at_1px_1px,_rgb(0_0_0_/_10%)_1px,_transparent_0)] bg-[size:20px_20px]' },
  { id: 'grid', name: 'Grid', pattern: 'bg-[linear-gradient(to_right,_rgb(0_0_0_/_5%)_1px,_transparent_1px),_linear-gradient(to_bottom,_rgb(0_0_0_/_5%)_1px,_transparent_1px)] bg-[size:20px_20px]' },
];

export function ThemeSelector({ currentTheme = 'default', currentBackground = 'none', onThemeChange }: ThemeSelectorProps) {
  const [saving, setSaving] = useState(false);

  const handleThemeChange = async (themeId: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_settings')
        .update({ chat_theme: themeId })
        .eq('user_id', user.id);

      if (error) throw error;

      onThemeChange(themeId, currentBackground);
      toast({
        title: "Theme updated",
        description: "Your chat theme has been changed"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update theme",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBackgroundChange = async (backgroundId: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_settings')
        .update({ chat_background: backgroundId })
        .eq('user_id', user.id);

      if (error) throw error;

      onThemeChange(currentTheme, backgroundId);
      toast({
        title: "Background updated",
        description: "Your chat background has been changed"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update background",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={saving}>
          <Palette className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-sm font-semibold">Themes</div>
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => handleThemeChange(theme.id)}
            className="flex items-center gap-2"
          >
            <div className={`w-4 h-4 rounded ${theme.bg} border`} />
            <span>{theme.name}</span>
            {currentTheme === theme.id && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5 text-sm font-semibold">Backgrounds</div>
        {backgrounds.map((bg) => (
          <DropdownMenuItem
            key={bg.id}
            onClick={() => handleBackgroundChange(bg.id)}
          >
            <span>{bg.name}</span>
            {currentBackground === bg.id && <span className="ml-auto">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
