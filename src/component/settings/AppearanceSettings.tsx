
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/context/ThemeContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Paintbrush } from 'lucide-react';

export const AppearanceSettings = () => {
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [localTheme, setLocalTheme] = useState<'light' | 'dark' | 'system'>(theme === 'light' || theme === 'dark' ? theme : 'light');

  useEffect(() => {
    setLocalTheme(theme === 'light' || theme === 'dark' ? theme : 'light');
  }, [theme]);

  const handleThemeChange = async (value: string) => {
    const themeValue = value as 'light' | 'dark';
    setLocalTheme(themeValue);
    
    try {
      await setTheme(themeValue);
      toast({
        title: "Theme updated",
        description: `Theme changed to ${value} mode.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update theme.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Appearance</h2>
        <p className="text-muted-foreground">Customize theme and display</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Paintbrush className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Appearance</CardTitle>
              <CardDescription>Customize the look and feel of the application</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-base font-medium mb-4">Theme</h3>
            
            <RadioGroup value={localTheme} onValueChange={handleThemeChange} className="grid gap-3">
              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="light" id="light" />
                <Label htmlFor="light" className="cursor-pointer flex-1">Light</Label>
              </div>
              
              <div className="flex items-center space-x-3 border rounded-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="dark" id="dark" />
                <Label htmlFor="dark" className="cursor-pointer flex-1">Dark</Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
