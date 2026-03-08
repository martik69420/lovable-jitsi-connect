import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Index from './index';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import FriendsForYou from '@/components/users/FriendsForYou';
import PublicLanding from '@/component/public/PublicLanding';
import { useAuth } from '@/context/auth';
import { motion } from 'framer-motion';
import AdBanner from '@/components/ads/AdBanner';

const Home: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <AppLayout>
        <PublicLanding />
        <AdBanner adSlot="2813542194" className="mt-8" />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div 
        className="flex flex-col lg:flex-row gap-4 md:gap-6" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.5 }}
      >
        {/* Feed — show first on mobile for better UX */}
        <motion.div 
          className="flex-1 min-w-0 order-2 lg:order-2" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Index />
          <AdBanner adSlot="2813542194" className="lg:hidden mt-4" />
        </motion.div>

        {/* Sidebar — below feed on mobile, right side on desktop */}
        <motion.div 
          className="w-full lg:w-80 xl:w-96 flex-shrink-0 space-y-4 order-1 lg:order-1" 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="shadow-sm">
            <CardHeader className="pb-3 hidden lg:block" />
            <CardContent className="p-3 sm:p-4">
              <FriendsForYou />
            </CardContent>
          </Card>
          <AdBanner adSlot="2813542194" className="hidden lg:block" />
        </motion.div>
      </motion.div>
    </AppLayout>
  );
};

export default Home;
