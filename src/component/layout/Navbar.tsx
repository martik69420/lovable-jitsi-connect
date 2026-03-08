
import React, { useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/component/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/component/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/component/ui/dropdown-menu';
import { 
  Bell, 
  Home, 
  MessageSquare,
  User, 
  Settings, 
  LogOut,
  Gamepad
} from 'lucide-react';
import { Sheet, SheetTrigger } from '@/component/ui/sheet';
import { useAuth } from '@/context/auth';
import { useNotification } from '@/context/NotificationContext';
import { cn } from '@/lib/utils';
import NotificationMenu from '../notifications/NotificationMenu';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileNavBar from './MobileNavBar';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount, fetchNotifications, isLoading } = useNotification();
  const [notificationMenuOpen, setNotificationMenuOpen] = React.useState(false);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    fetchNotifications();
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  useEffect(() => {
    if (notificationMenuOpen) {
      fetchNotifications();
    }
  }, [notificationMenuOpen, fetchNotifications]);
  
  const navItems = [
    { icon: <Home className="h-5 w-5" />, label: 'Home', path: '/' },
    { icon: <MessageSquare className="h-5 w-5" />, label: 'Messages', path: '/messages' },
    { icon: <Gamepad className="h-5 w-5" />, label: 'Games', path: '/games' },
  ];
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-3 sm:px-6">
          {/* Mobile: notification bell on the left */}
          {isMobile && isAuthenticated && user && (
            <Sheet open={notificationMenuOpen} onOpenChange={setNotificationMenuOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative mr-2"
                >
                  <Bell className="h-5 w-5" />
                  {isLoading ? (
                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full border-2 border-t-transparent border-primary animate-spin" />
                  ) : unreadCount > 0 ? (
                    <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full text-[10px] font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </Button>
              </SheetTrigger>
              <NotificationMenu onClose={() => setNotificationMenuOpen(false)} />
            </Sheet>
          )}

          {/* Desktop: logo */}
          {!isMobile && (
            <Link to="/" className="mr-6 flex items-center space-x-2">
              <span className="font-bold text-xl">Campus Connect</span>
            </Link>
          )}
          
          {/* Desktop Nav */}
          {!isMobile && (
            <nav className="hidden md:flex items-center space-x-2 lg:space-x-4 flex-1">
              {user && navItems.map((item, index) => (
                <Button
                  key={index}
                  variant={location.pathname === item.path ? "default" : "ghost"}
                  size="sm"
                  className={cn(
                    "justify-start",
                    location.pathname === item.path && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => navigate(item.path)}
                >
                  {item.icon}
                  <span className="ml-2">{item.label}</span>
                </Button>
              ))}
            </nav>
          )}

          {/* Mobile: spacer to push avatar right */}
          {isMobile && <div className="flex-1" />}
          
          <div className="flex items-center ml-auto space-x-2">
            {isAuthenticated && user ? (
              <>
                {/* Desktop: notification bell */}
                {!isMobile && (
                  <Sheet open={notificationMenuOpen} onOpenChange={setNotificationMenuOpen}>
                    <SheetTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="relative"
                      >
                        <Bell className="h-5 w-5" />
                        {isLoading ? (
                          <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full border-2 border-t-transparent border-primary animate-spin" />
                        ) : unreadCount > 0 ? (
                          <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 flex items-center justify-center bg-destructive text-destructive-foreground rounded-full text-xs font-medium">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        ) : null}
                      </Button>
                    </SheetTrigger>
                    <NotificationMenu onClose={() => setNotificationMenuOpen(false)} />
                  </Sheet>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.displayName} />
                        <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-0.5 leading-none">
                        <p className="font-medium text-sm">{user.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(`/profile/${user.username}`)}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
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
      
      {isMobile && <MobileNavBar />}
    </>
  );
};

export default Navbar;
