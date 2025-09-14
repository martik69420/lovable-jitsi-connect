
import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/LanguageContext';
import FriendRequestsTab from '@/components/friends/FriendRequestsTab';
import SentRequestsTab from '@/components/friends/SentRequestsTab';
import { useFriends } from '@/components/friends/useFriends';

const FriendRequests: React.FC = () => {
  const { t } = useLanguage();
  const { 
    receivedRequests, 
    sentRequests, 
    isLoading, 
    acceptFriendRequest, 
    rejectFriendRequest
  } = useFriends();

  // Helper functions to convert the Promise<boolean> to Promise<void>
  const handleAcceptRequest = async (requestId: string): Promise<void> => {
    await acceptFriendRequest(requestId);
  };

  const handleRejectRequest = async (requestId: string): Promise<void> => {
    await rejectFriendRequest(requestId);
  };

  return (
    <AppLayout>
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('friends.friendRequests')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="received">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="received">{t('friends.received')}</TabsTrigger>
                <TabsTrigger value="sent">{t('friends.sent')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="received" className="space-y-4">
                <FriendRequestsTab 
                  requests={receivedRequests as any}
                  loading={isLoading}
                  onAccept={handleAcceptRequest}
                  onDecline={handleRejectRequest}
                />
              </TabsContent>
              
              <TabsContent value="sent" className="space-y-4">
                <SentRequestsTab 
                  requests={sentRequests as any}
                  loading={isLoading}
                  onCancel={handleRejectRequest}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default FriendRequests;
