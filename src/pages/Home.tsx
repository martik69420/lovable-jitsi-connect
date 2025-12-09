import React from 'react';
import AppLayout from '@/components/layout/AppLayout';
import Index from './index';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import FriendsForYou from '@/components/users/FriendsForYou';
import { useAuth } from '@/context/auth';
import { UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
const Home: React.FC = () => {
  const {
    user
  } = useAuth();
  return <AppLayout>
      <motion.div className="flex flex-col md:flex-row gap-6" initial={{
      opacity: 0
    }} animate={{
      opacity: 1
    }} transition={{
      duration: 0.5
    }}>
        {user && <motion.div className="w-full md:w-80 lg:w-96 space-y-6 flex-shrink-0" initial={{
        opacity: 0,
        x: -50
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.5,
        delay: 0.2
      }}>
            <motion.div whileHover={{
          scale: 1.02
        }} transition={{
          duration: 0.2
        }}>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="pb-3">
                  
                </CardHeader>
                <CardContent>
                  <FriendsForYou />
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>}
        
        <motion.div className="flex-1" initial={{
        opacity: 0,
        x: 50
      }} animate={{
        opacity: 1,
        x: 0
      }} transition={{
        duration: 0.5,
        delay: 0.3
      }}>
          <Index />
        </motion.div>
      </motion.div>
    </AppLayout>;
};
export default Home;