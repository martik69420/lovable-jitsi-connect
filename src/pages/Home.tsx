import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Index from './index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FriendsForYou from '@/components/users/FriendsForYou';
import PublicLanding from '@/component/public/PublicLanding';
import { useAuth } from '@/context/auth';
import { motion } from 'framer-motion';
import AdBanner from '@/components/ads/AdBanner';

const Home: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
      </AppLayout>
    );
  }

  // Show public landing for non-authenticated users
  if (!isAuthenticated) {
    return (
      <AppLayout>
        <PublicLanding />
        {/* Ad placement for non-authenticated users */}
        <AdBanner adSlot="2813542194" className="mt-8" />
      </AppLayout>
    );
  }

  // Authenticated user view - ads enabled
  return (
    <AppLayout>
      <motion.div 
        className="flex flex-col md:flex-row gap-6" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.5 }}
      >
        <motion.div 
          className="w-full md:w-80 lg:w-96 space-y-6 flex-shrink-0" 
          initial={{ opacity: 0, x: -50 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div 
            whileHover={{ scale: 1.02 }} 
            transition={{ duration: 0.2 }}
          >
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
              <CardHeader className="pb-3">
              </CardHeader>
              <CardContent>
                <FriendsForYou />
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Ad placement for authenticated users */}
          <AdBanner adSlot="2813542194" className="hidden md:block" />
        </motion.div>
        
        <motion.div 
          className="flex-1" 
          initial={{ opacity: 0, x: 50 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Index />
          
          {/* Mobile ad placement */}
          <AdBanner adSlot="2813542194" className="md:hidden mt-6" />
        </motion.div>
      </motion.div>
    </AppLayout>
  );
};

export default Home;
