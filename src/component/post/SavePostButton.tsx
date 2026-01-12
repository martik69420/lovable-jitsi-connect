
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface SavePostButtonProps {
  postId: string;
  className?: string;
  showText?: boolean;
  variant?: 'default' | 'ghost' | 'outline' | 'secondary' | 'destructive' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const SavePostButton: React.FC<SavePostButtonProps> = ({
  postId,
  className = '',
  showText = false,
  variant = 'ghost',
  size = 'sm',
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [isSaved, setIsSaved] = useState(false);
  const [isCheckingSaved, setIsCheckingSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user) {
        setIsCheckingSaved(false);
        return;
      }
      
      try {
        setIsCheckingSaved(true);
        const { data, error } = await supabase
          .from('saved_posts')
          .select('id')
          .eq('user_id', user.id)
          .eq('post_id', postId)
          .maybeSingle();
          
        if (error && error.code !== 'PGRST116') {
          console.error('Error checking saved status:', error);
        }
        
        setIsSaved(!!data);
      } catch (error) {
        console.error('Error checking saved status:', error);
      } finally {
        setIsCheckingSaved(false);
      }
    };
    
    checkIfSaved();
  }, [postId, user]);

  const handleSaveToggle = async () => {
    if (!user) {
      toast({
        title: t('auth.requiresLogin'),
        description: t('auth.loginToSave'),
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsSaving(true);
      
      if (isSaved) {
        // Unsave the post
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', postId);
          
        if (error) {
          console.error('Error unsaving post:', error);
          throw error;
        }
        
        setIsSaved(false);
        toast({
          title: t('post.removed'),
          description: t('post.removedFromSaved'),
        });
      } else {
        // Save the post
        const { error } = await supabase
          .from('saved_posts')
          .insert({
            user_id: user.id,
            post_id: postId,
          });
          
        if (error) {
          console.error('Error saving post:', error);
          // Handle duplicate key error gracefully
          if (error.code === '23505') {
            setIsSaved(true);
            return;
          }
          throw error;
        }
        
        setIsSaved(true);
        toast({
          title: t('post.saved'),
          description: t('post.addedToSaved'),
        });
      }
    } catch (error: any) {
      console.error('Error toggling saved status:', error);
      toast({
        title: t('common.error'),
        description: error.message || 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        variant={variant}
        size={size}
        aria-label={isSaved ? "Unsave post" : "Save post"}
        className={cn(
          `text-muted-foreground hover:text-yellow-500 transition-all duration-300`,
          isSaved && 'text-yellow-500 hover:text-yellow-600',
          isSaving && 'opacity-70 cursor-not-allowed',
          className
        )}
        onClick={handleSaveToggle}
        disabled={isSaving || isCheckingSaved}
      >
        <motion.div
          animate={{ 
            scale: isSaved ? [1, 1.4, 1.1, 1] : 1,
            rotate: isSaving ? 360 : 0,
            y: isSaved ? [0, -3, 0] : 0
          }}
          transition={{ 
            duration: isSaving ? 1 : 0.6,
            repeat: isSaving ? Infinity : 0,
            ease: isSaving ? "linear" : "easeOut"
          }}
        >
          <Bookmark 
            className={cn(
              "h-4 w-4", 
              showText && "mr-1.5", 
              "transition-all duration-300",
              isSaved && "fill-yellow-500 text-yellow-500 drop-shadow-sm"
            )} 
          />
        </motion.div>
        {showText && (
          <motion.span 
            className={cn(
              "transition-colors duration-300",
              isSaved && "text-yellow-500 font-medium"
            )}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            {isSaving ? 'Saving...' : (isSaved ? t('post.saved') : t('post.save'))}
          </motion.span>
        )}
      </Button>
    </motion.div>
  );
};

export default SavePostButton;
