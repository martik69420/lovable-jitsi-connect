
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home, 
  MessageSquare, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  Gamepad2, 
  Search,
  Users,
  UserPlus
} from 'lucide-react';
import { Drawer, DrawerContent, DrawerTrigger } from '@/component/ui/drawer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/auth';
import { useUnreadMessages } from '@/hooks/use-unread-messages';

const MobileNavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { unreadCount: unreadMessages } = useUnreadMessages();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const menuItems = [
    { icon: <Search className="h-5 w-5" />, label: 'Search', path: '/search' },
    { icon: <Users className="h-5 w-5" />, label: 'Friends', path: '/friends' },
    { icon: <UserPlus className="h-5 w-5" />, label: 'Add Friends', path: '/add-friends' },
    { icon: <User className="h-5 w-5" />, label: 'Profile', path: user ? `/profile/${user.username}` : '/profile' },
    { icon: <Settings className="h-5 w-5" />, label: 'Settings', path: '/settings' },
  ];
  
  const closeMenu = () => setMenuOpen(false);
  
  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate('/login');
  };

  const bottomTabs = [
    { icon: Home, label: 'Home', path: '/', badge: 0 },
    { icon: MessageSquare, label: 'Chat', path: '/messages', badge: unreadMessages },
    { icon: Gamepad2, label: 'Games', path: '/games', badge: 0 },
    { icon: Search, label: 'Search', path: '/search', badge: 0 },
  ];
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t border-border z-40 sm:hidden pb-safe">
      <div className="flex items-center h-14">
        {bottomTabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <Link 
              key={tab.path}
              to={tab.path} 
              className="flex-1 flex flex-col items-center justify-center gap-0.5 relative py-1"
            >
              <div className={`relative p-1 rounded-full transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon className="h-5 w-5" />
                {tab.badge > 0 && (
                  <span className="absolute -top-1 -right-1.5 h-4 min-w-[16px] px-1 flex items-center justify-center text-[10px] bg-destructive text-destructive-foreground rounded-full font-bold">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] leading-tight ${active ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}
        
        <Drawer open={menuOpen} onOpenChange={setMenuOpen}>
          <DrawerTrigger asChild>
            <button className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1">
              <div className="p-1 text-muted-foreground">
                <Menu className="h-5 w-5" />
              </div>
              <span className="text-[10px] leading-tight text-muted-foreground">More</span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="px-4 pb-safe">
            <div className="flex justify-center pt-2 pb-3">
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
            </div>
            
            {user && (
              <div 
                className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-4 active:bg-muted"
                onClick={() => { closeMenu(); navigate(`/profile/${user.username}`); }}
              >
                <Avatar className="h-11 w-11 border-2 border-primary/20">
                  <AvatarImage src={user.avatar} alt={user.displayName} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {user.displayName?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.path}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                    isActive(item.path) 
                      ? 'bg-primary/10 text-primary' 
                      : 'text-foreground active:bg-muted'
                  }`}
                  onClick={() => { closeMenu(); navigate(item.path); }}
                >
                  <div className={isActive(item.path) ? 'text-primary' : 'text-muted-foreground'}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              ))}
            </div>
            
            <Separator className="my-3" />
            
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive active:bg-destructive/10 mb-2"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
              <span className="text-sm font-medium">Log out</span>
            </button>
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
};

export default MobileNavBar;
