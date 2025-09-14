
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ClearAllButtonProps {
  userId: string;
  onSuccess?: () => void;
  mode?: 'mark-read' | 'delete';
}

export function ClearAllButton({ userId, onSuccess, mode = 'mark-read' }: ClearAllButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClearAll = async () => {
    if (!userId) return;
    
    setIsLoading(true);
    try {
      let response;
      
      if (mode === 'delete') {
        // Delete all notifications for this user
        response = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', userId);
      } else {
        // Mark all as read
        response = await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId);
      }
      
      if (response.error) throw response.error;
      
      toast({
        title: mode === 'delete' ? "Notifications deleted" : "Notifications marked as read",
        description: mode === 'delete' 
          ? "All your notifications have been deleted." 
          : "All your notifications have been marked as read.",
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error clearing notifications:", error);
      toast({
        title: "Error",
        description: "Failed to process notifications. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          disabled={isLoading}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {mode === 'delete' ? 'Delete All' : 'Mark All Read'}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === 'delete' ? 'Delete all notifications?' : 'Mark all as read?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {mode === 'delete' 
              ? "This will permanently remove all your notifications. This action cannot be undone."
              : "This will mark all your notifications as read."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleClearAll}
            className={mode === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {mode === 'delete' ? 'Delete' : 'Mark Read'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
