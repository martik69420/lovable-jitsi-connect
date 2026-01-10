import React, { useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast'; // Use the hook since this is a component
import { useAuth } from '@/context/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/component/ui/dialog';
import { Button } from '@/component/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/component/ui/form';
import { Textarea } from '@/component/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/component/ui/select';

type ReportReason = 'spam' | 'inappropriate' | 'harassment' | 'hate_speech' | 'violence' | 'other';

interface ReportModalProps {
  open: boolean;
  onClose: () => void;
  type: 'user' | 'post';
  targetId: string;
  targetName?: string;
}

const reportFormSchema = z.object({
  reason: z.enum(['spam', 'inappropriate', 'harassment', 'hate_speech', 'violence', 'other'], {
    required_error: "Please select a reason",
  }),
  details: z.string().max(500, "Details cannot exceed 500 characters"),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

const reasonOptions: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'inappropriate', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'violence', label: 'Violence or harmful content' },
  { value: 'other', label: 'Other' },
];

const ReportModal: React.FC<ReportModalProps> = ({
  open,
  onClose,
  type,
  targetId,
  targetName
}) => {
  const { toast } = useToast(); // Use the hook since this is a component
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      reason: 'inappropriate',
      details: ''
    }
  });
  
  const handleSubmit = async (values: ReportFormValues) => {
    if (!user) {
      toast({
        title: "You must be logged in",
        description: "Please log in to report content",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      if (type === 'user') {
        const { error } = await supabase
          .from('user_reports')
          .insert({
            user_id: user.id,
            reported_user_id: targetId,
            reason: values.reason,
            details: values.details
          });
          
        if (error) throw error;
        
        toast({
          title: "Report submitted",
          description: `Thank you for reporting ${targetName || 'this user'}. We'll review this account.`,
        });
      } else {
        const { error } = await supabase
          .from('post_reports')
          .insert({
            user_id: user.id,
            post_id: targetId,
            reason: values.reason,
            details: values.details
          });
          
        if (error) throw error;
        
        toast({
          title: "Report submitted",
          description: "Thank you for reporting this post. We'll review it.",
        });
      }
      
      form.reset();
      onClose();
    } catch (error: any) {
      console.error("Error submitting report:", error);
      toast({
        title: "Failed to submit report",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Report {type === 'user' ? targetName || 'User' : 'Post'}
          </DialogTitle>
          <DialogDescription>
            Please let us know why you're reporting this {type}.
            Your report will be sent to our team for review.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for reporting</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a reason" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reasonOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="details"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional details (optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please provide any additional details about this report..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;
