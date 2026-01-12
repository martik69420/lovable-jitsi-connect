
import { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth';
import { useLanguage } from '@/context/LanguageContext';
import { useFriends } from '@/components/friends/useFriends';
import FriendsList from '@/components/friends/FriendsList';
import AdBanner from '@/components/ads/AdBanner';
import { User, UserPlus, UserCheck, Users, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';

// Optimized lazy loading for less used tabs
const FriendRequestsTab = lazy(() => import('@/components/friends/FriendRequestsTab'));
const SentRequestsTab = lazy(() => import('@/components/friends/SentRequestsTab'));

const Friends = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { 
    friends, 
    receivedRequests, 
    sentRequests, 
    isLoading, 
    acceptFriendRequest, 
    rejectFriendRequest, 
    removeFriend,
    sendFriendRequest,
    fetchFriends 
  } = useFriends();

  const [activeTab, setActiveTab] = useState('all-friends');

  // Log state for debugging
  useEffect(() => {
    console.log('Current friends state:', friends);
    console.log('Is loading state:', isLoading);
  }, [friends, isLoading]);

  // Force refresh when tab is selected
  useEffect(() => {
    if (activeTab === 'all-friends' && user?.id) {
      console.log('Refreshing friends data from tab selection');
      fetchFriends();
    }
  }, [activeTab, user?.id, fetchFriends]);

  // Show login prompt for unauthenticated users instead of redirecting

  const handleMessageFriend = (friendId: string) => {
    navigate(`/messages?userId=${friendId}`);
  };
  
  // Helper functions to convert the Promise<boolean> to Promise<void>
  const handleRemoveFriend = async (friendId: string): Promise<void> => {
    await removeFriend(friendId);
  };

  const handleAcceptRequest = async (requestId: string): Promise<void> => {
    await acceptFriendRequest(requestId);
  };

  const handleRejectRequest = async (requestId: string): Promise<void> => {
    await rejectFriendRequest(requestId);
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('auth.loadingAuth')}</span>
        </div>
      </AppLayout>
    );
  }

  // Show login prompt for guests
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('friends.title')}</h2>
            <p className="text-muted-foreground mb-4">Sign in to connect with friends and see your friend list.</p>
            <Button onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">{t('friends.title')}</h1>
            <p className="text-muted-foreground">{t('friends.connectCampus')}</p>
          </div>
          <Button onClick={() => navigate('/add-friends')}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('nav.addFriends')}
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all-friends">
              <Users className="mr-2 h-4 w-4" />
              {t('friends.allFriends')}
            </TabsTrigger>
            <TabsTrigger value="pending">
              <UserCheck className="mr-2 h-4 w-4" />
              {t('friends.requests')}
              {receivedRequests.length > 0 && (
                <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {receivedRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">
              <UserPlus className="mr-2 h-4 w-4" />
              {t('friends.sent')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all-friends">
            <FriendsList 
              friends={friends}
              loading={isLoading}
              onRemoveFriend={handleRemoveFriend}
              onMessageFriend={handleMessageFriend}
            />
          </TabsContent>
          
          <TabsContent value="pending">
            <Suspense fallback={
              <Card>
                <CardContent className="p-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            }>
              <FriendRequestsTab 
                requests={receivedRequests}
                loading={isLoading}
                onAccept={handleAcceptRequest}
                onDecline={handleRejectRequest}
              />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="sent">
            <Suspense fallback={
              <Card>
                <CardContent className="p-8 flex justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              </Card>
            }>
              <SentRequestsTab 
                requests={sentRequests}
                loading={isLoading} 
                onCancel={handleRejectRequest}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Friends;
