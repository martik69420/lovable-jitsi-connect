
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Paintbrush } from 'lucide-react';

export const AppearanceSettings = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [theme, setTheme] = useState(profile?.settings?.theme || 'system');
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = (value: string) => {
    setTheme(value);
  };

  const saveAppearanceSettings = async () => {
    if (!profile || !updateProfile) return;
    
    setIsSaving(true);
    
    try {
      // Create settings object with the current theme
      const settings = {
        ...(profile.settings || {}),
        theme
      };
      
      const success = await updateProfile({
        settings
      });
      
      if (success) {
        toast({
          title: "Appearance updated",
          description: "Your appearance settings have been saved."
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update appearance settings.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <CardTitle className="text-xl flex items-center">
          <Paintbrush className="h-5 w-5 mr-2 text-primary" />
          Appearance
        </CardTitle>
        <CardDescription>
          Customize the look and feel of the application
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div>
          <h3 className="text-base font-medium mb-4">Theme</h3>
          
          <RadioGroup value={theme} onValueChange={handleThemeChange} className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light" className="cursor-pointer">Light</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="dark" id="dark" />
              <Label htmlFor="dark" className="cursor-pointer">Dark</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="system" id="system" />
              <Label htmlFor="system" className="cursor-pointer">System Default</Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="flex justify-end pt-4">
          <Button 
            onClick={saveAppearanceSettings} 
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Appearance"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
