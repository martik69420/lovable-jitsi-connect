
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { useLanguage } from '@/context/LanguageContext';
import AppLayout from '@/components/layout/AppLayout';
import { ProfilePictureSettings } from '@/components/settings/ProfilePictureSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { LanguageSettings } from '@/components/settings/LanguageSettings';
import { NotificationSettings } from '@/components/settings/NotificationSettings';
import { PrivacySettings } from '@/components/settings/PrivacySettings';
import { Button } from '@/components/ui/button';

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AppLayout>
      <div className="container max-w-4xl mx-auto space-y-12 py-10">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">{t('settings.title')}</h1>
          <p className="text-muted-foreground">
            {t('settings.description')}
          </p>
        </div>

        <div className="space-y-12">
          <ProfilePictureSettings />
          <ProfileSettings />
          <AccountSettings />
          <AppearanceSettings />
          <LanguageSettings />
          <NotificationSettings />
          <PrivacySettings />
        </div>

        <Button variant="destructive" onClick={handleLogout} className="mt-8">
          {t('auth.logout')}
        </Button>
      </div>
    </AppLayout>
  );
};

export default Settings;
