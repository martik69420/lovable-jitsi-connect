
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export const LanguageSettings = () => {
  const { language, setLanguage, availableLanguages, t, isLoading } = useLanguage();

  const handleLanguageChange = (value: string) => {
    const selectedLanguage = availableLanguages.find(lang => lang.code === value);
    if (selectedLanguage) {
      setLanguage(selectedLanguage.code as 'en' | 'nl' | 'fr');
    }
  };

  if (isLoading) {
    return (
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-4">
        <CardTitle className="text-xl flex items-center">
          <Globe className="h-5 w-5 mr-2 text-primary" />
          {t('settings.languageSettings')}
        </CardTitle>
        <CardDescription>
          {t('settings.languageSettingsDesc')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="space-y-2">
          <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            {t('settings.language')}
          </label>
          <Select value={language} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a language" />
            </SelectTrigger>
            <SelectContent>
              {availableLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Available Languages:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• English</li>
            <li>• Dutch (Nederlands)</li>
            <li>• French (Français)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
