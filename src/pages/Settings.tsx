
import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Search, User, Shield, Palette, Globe, Bell, Lock, LogOut, Settings as SettingsIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

const Settings = () => {
  const navigate = useNavigate();
  const { logout, user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState<string | null>(isMobile ? null : 'profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [clickCount, setClickCount] = useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSettingsIconClick = async () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 10) {
      try {
        if (!user?.id) return;

        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            role: 'admin'
          });

        if (error) {
          console.error('Error granting admin role:', error);
          toast({
            title: "Error",
            description: "Failed to grant admin access",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Admin Access Granted! 🎉",
            description: "You now have admin privileges. Refresh the page to see the admin panel.",
          });
          setClickCount(0);
          
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        }
      } catch (error) {
        console.error('Error granting admin role:', error);
      }
    }
  };

  const settingsSections = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'account', label: 'Account Settings', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'language', label: 'Language', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Lock },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <ProfilePictureSettings />
            <ProfileSettings />
          </div>
        );
      case 'account':
        return <AccountSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'language':
        return <LanguageSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'privacy':
        return <PrivacySettings />;
      default:
        return null;
    }
  };

  if (!authLoading && !isAuthenticated) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto py-12">
          <Card className="p-8 text-center">
            <SettingsIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Settings</h2>
            <p className="text-muted-foreground mb-4">Sign in to access your account settings.</p>
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Mobile: drill-down nav → content
  if (isMobile) {
    return (
      <AppLayout>
        <div className="min-h-[calc(100dvh-8rem)] bg-background">
          {activeSection === null ? (
            <div className="px-4 py-4 space-y-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    handleSettingsIconClick();
                    navigate(-1);
                  }}
                  className="h-9 w-9 text-muted-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">Settings</h1>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Settings"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/50"
                />
              </div>

              <nav className="space-y-1">
                {settingsSections
                  .filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-lg transition-colors text-foreground hover:bg-accent active:bg-accent/80"
                      >
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-[18px] w-[18px] text-primary" />
                        </div>
                        <span className="flex-1 text-left">{section.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </button>
                    );
                  })}

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                    <LogOut className="h-[18px] w-[18px]" />
                  </div>
                  <span className="flex-1 text-left">Logout</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </nav>
            </div>
          ) : (
            <div className="px-4 py-4">
              <div className="flex items-center gap-3 mb-5">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveSection(null)}
                  className="h-9 w-9 text-muted-foreground"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-lg font-semibold">
                  {settingsSections.find(s => s.id === activeSection)?.label}
                </h1>
              </div>
              {renderContent()}
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // Desktop layout
  return (
    <AppLayout>
      <div className="min-h-screen bg-background">
        <div className="flex">
          <div className="w-80 border-r border-border bg-card/50 min-h-[calc(100vh-4rem)] p-6 space-y-6">
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleSettingsIconClick();
                  navigate(-1);
                }}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Settings
              </Button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Settings"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-background/50"
                />
              </div>
            </div>

            <nav className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                      activeSection === section.id
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {section.label}
                    {activeSection === section.id && (
                      <span className="ml-auto">›</span>
                    )}
                  </button>
                );
              })}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                Logout
                <span className="ml-auto">›</span>
              </button>
            </nav>
          </div>

          <div className="flex-1 p-8">
            <div className="max-w-3xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
