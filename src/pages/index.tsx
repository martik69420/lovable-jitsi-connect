
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/auth';
import { usePost } from '@/context/PostContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import PostForm from '@/components/posts/PostForm';
import PostList from '@/components/posts/PostList';
import { Loader2, RefreshCw, AlertCircle, TrendingUp, Clock } from 'lucide-react';
import AdBanner from '@/components/ads/AdBanner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useViewport } from '@/hooks/use-viewport';
import AdminFeatures from '@/components/admin/AdminFeatures';
import { MentionsProvider } from '@/components/common/MentionsProvider';

// Add window.adsbygoogle type declaration if not already defined
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const Index = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { posts, isLoading: postsLoading, fetchPosts } = usePost();
  const [activeTab, setActiveTab] = useState('for-you');
  const [forYouPosts, setForYouPosts] = useState([]);
  const [latestPosts, setLatestPosts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toast } = useToast();
  const { isMobile } = useViewport();

  // Authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Fetch posts with error handling
  const loadPosts = useCallback(async () => {
    if (isAuthenticated && user) {
      setLoadError(null);
      try {
        await fetchPosts(activeTab === 'for-you' ? 'feed' : 'latest');
      } catch (error) {
        console.error("Error fetching posts:", error);
        setLoadError("Failed to load posts. Please try refreshing.");
        
        toast({
          title: "Failed to load posts",
          description: "We couldn't retrieve your posts. Please try refreshing.",
          variant: "destructive",
        });
      }
    }
  }, [isAuthenticated, user, activeTab, fetchPosts, toast]);
  
  // Initial posts loading
  useEffect(() => {
    let mounted = true;
    
    if (isAuthenticated && user && !postsLoading && !posts.length) {
      loadPosts();
    }
    
    return () => {
      mounted = false;
    };
  }, [isAuthenticated, user, loadPosts, postsLoading, posts]);

  // Process posts when they're loaded
  useEffect(() => {
    if (!postsLoading && posts.length > 0) {
      if (activeTab === 'for-you') {
        const sortedPosts = [...posts].sort((a, b) => 
          (b.likes.length + b.comments.length * 2) - (a.likes.length + a.comments.length * 2)
        );
        setForYouPosts(sortedPosts);
      } else {
        const sortedPosts = [...posts].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setLatestPosts(sortedPosts);
      }
    }
  }, [posts, postsLoading, activeTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLoadError(null);
    
    try {
      await fetchPosts(activeTab === 'for-you' ? 'feed' : 'latest');
    } catch (error) {
      console.error("Error refreshing posts:", error);
      setLoadError("Failed to refresh posts. Please try again.");
    } finally {
      // Always end refreshing state after a short delay for visual feedback
      setTimeout(() => {
        setIsRefreshing(false);
      }, 600);
    }
  };

  if (authLoading) {
    return (
      <motion.div 
        className="flex items-center justify-center h-screen"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 animate-spin" />
        </motion.div>
      </motion.div>
    );
  }

  const displayedPosts = activeTab === 'for-you' ? forYouPosts : latestPosts;
  const emptyMessage = activeTab === 'for-you' 
    ? "Your personalized feed is empty" 
    : "No recent posts found";

  return (
    <MentionsProvider>
      <motion.div 
        className="container mx-auto py-4 md:py-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Main content - no sidebar here since it's handled in Home.tsx */}
        <div className="w-full">
          {user && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.01 }}
            >
              <Card className="mb-4 md:mb-6 shadow-md border-primary/10 overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10 pb-3">
                  <CardTitle className="text-lg">Create Post</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <PostForm />
                </CardContent>
              </Card>
            </motion.div>
          )}

          <Tabs defaultValue="for-you" onValueChange={handleTabChange}>
            <motion.div 
              className="flex items-center justify-between mb-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <TabsList className="grid grid-cols-2 w-[200px] md:w-[300px]">
                <TabsTrigger value="for-you" className="text-sm flex items-center">
                  <motion.div
                    animate={{ scale: activeTab === 'for-you' ? [1, 1.2, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                  </motion.div>
                  For You
                </TabsTrigger>
                <TabsTrigger value="latest" className="text-sm flex items-center">
                  <motion.div
                    animate={{ 
                      rotate: activeTab === 'latest' ? [0, 360] : 0,
                      scale: activeTab === 'latest' ? [1, 1.2, 1] : 1 
                    }}
                    transition={{ duration: 0.5 }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                  </motion.div>
                  Latest
                </TabsTrigger>
              </TabsList>
              <motion.div 
                whileTap={{ rotate: 360 }} 
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.05 }}
              >
                <Button 
                  variant="outline" 
                  size={isMobile ? "sm" : "default"} 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={cn("gap-2", isRefreshing && "opacity-70")}
                >
                  <motion.div
                    animate={{ rotate: isRefreshing ? 360 : 0 }}
                    transition={{ 
                      duration: 1, 
                      repeat: isRefreshing ? Infinity : 0,
                      ease: "linear"
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </motion.div>
                  {!isMobile && "Refresh"}
                </Button>
              </motion.div>
            </motion.div>
            
            <AnimatePresence>
              {loadError && (
                <motion.div 
                  className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm flex items-center"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                  </motion.div>
                  <span className="flex-1">{loadError}</span>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleRefresh} 
                      className="ml-2"
                    >
                      Try Again
                    </Button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <Separator className="mb-4" />
            </motion.div>
            
            <TabsContent value="for-you" className="focus-visible:outline-none">
              <PostList 
                posts={displayedPosts} 
                isLoading={postsLoading || isRefreshing} 
                emptyMessage={emptyMessage}
              />
            </TabsContent>
            <TabsContent value="latest" className="focus-visible:outline-none">
              <PostList 
                posts={displayedPosts} 
                isLoading={postsLoading || isRefreshing} 
                emptyMessage={emptyMessage}
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* AdSense banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <AdBanner adSlot="2813542194" className="mt-8" />
        </motion.div>
      </motion.div>
    </MentionsProvider>
  );
};

export default Index;
