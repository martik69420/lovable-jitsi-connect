
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Bell, User, Menu, Home, MessageSquare, Users, Gamepad2, Award, BarChart3, LogOut, Sun, Moon } from "lucide-react";
import { useAuth } from "@/context/auth";
import { useNotification } from "@/context/NotificationContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/component/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/component/ui/avatar";
import { Badge } from "@/component/ui/badge";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/component/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/component/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import NotificationMenu from "@/component/notifications/NotificationMenu";

const TopBar: React.FC = () => {
  const { user, logout, updateUser, isAuthenticated } = useAuth();
  const { unreadCount, fetchNotifications, isLoading } = useNotification();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false);

  // Fetch user's coin balance from the database
  useEffect(() => {
    const fetchUserCoins = async () => {
      if (user?.id) {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('coins')
            .eq('id', user.id)
            .single();
            
          if (error) {
            console.error('Error fetching user coins:', error);
            return;
          }
          
          if (data && data.coins !== undefined && data.coins !== user.coins) {
            // Only update if there's a difference to avoid infinite loops
            updateUser({ coins: data.coins });
          }
        } catch (error) {
          console.error('Failed to fetch user coins:', error);
        }
      }
    };
    
    fetchUserCoins();
    
    // Set up a polling interval to keep coins in sync
    const interval = setInterval(fetchUserCoins, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [user?.id, user?.coins, updateUser]);

  // Fetch notifications periodically
  useEffect(() => {
    fetchNotifications();
    
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  // Refresh notifications when menu opens
  useEffect(() => {
    if (notificationMenuOpen) {
      fetchNotifications();
    }
  }, [notificationMenuOpen, fetchNotifications]);

  const mobileNavItems = [
    { path: "/", icon: Home, label: t('nav.home') },
    { path: `/profile/${user?.username}`, icon: User, label: t('nav.profile') },
    { path: "/notifications", icon: Bell, label: t('settings.notifications') },
    { path: "/messages", icon: MessageSquare, label: t('nav.messages') },
    { path: "/friends", icon: Users, label: t('settings.friends') },
    { path: "/games", icon: Gamepad2, label: t('games.title') },
    { path: "/leaderboard", icon: Award, label: t('leaderboard.title') },
    { path: "/earn", icon: BarChart3, label: t('coins.earn') },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur-md dark:border-gray-800">
      <div className="container mx-auto flex justify-between items-center h-16 px-4 md:px-6">
        {/* Mobile menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader className="pb-4">
                <SheetTitle className="text-left">Campus Fenix</SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col space-y-1 mt-4">
                {mobileNavItems.map((item) => (
                  <SheetClose asChild key={item.path}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => cn(
                        "flex items-center gap-2 px-4 py-3 rounded-md transition-colors",
                        isActive 
                          ? "bg-primary/10 text-primary font-medium" 
                          : "text-foreground hover:bg-secondary"
                      )}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SheetClose>
                ))}
                
                <div className="pt-4 mt-4 border-t border-border">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={logout}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    {t('auth.logout')}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        
        {/* Logo - only show on mobile */}
        <div className="md:hidden flex items-center">
          <span className="text-lg font-bold">Campus Fenix</span>
        </div>
        
        {/* Spacer for layout balance */}
        <div className="hidden md:flex flex-1 max-w-md mx-4" />

        {/* User actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="text-muted-foreground"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isAuthenticated && user ? (
            <>
              {/* Notifications */}
              <Sheet open={notificationMenuOpen} onOpenChange={setNotificationMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "relative transition-all", 
                      unreadCount > 0 ? "animate-pulse" : ""
                    )}
                  >
                    <Bell className={cn(
                      "h-5 w-5 transition-colors",
                      unreadCount > 0 ? "text-primary" : ""
                    )} />
                    {isLoading ? (
                      <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-t-transparent border-primary animate-spin" />
                    ) : unreadCount > 0 ? (
                      <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    ) : null}
                  </Button>
                </SheetTrigger>
                <NotificationMenu onClose={() => setNotificationMenuOpen(false)} />
              </Sheet>


              {/* User dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.displayName} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {user?.displayName?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-medium">{user?.displayName}</span>
                      <span className="text-xs text-muted-foreground">@{user?.username}</span>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate(`/profile/${user?.username}`)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>{t('nav.profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Bell className="mr-2 h-4 w-4" />
                    <span>{t('nav.settings')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('auth.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button onClick={() => navigate('/login')} size="sm">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
