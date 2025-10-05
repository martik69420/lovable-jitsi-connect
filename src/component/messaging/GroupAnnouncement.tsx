import React, { useState } from 'react';
import { Megaphone, Edit2, X } from 'lucide-react';
import { Button } from '@/component/ui/button';
import { Textarea } from '@/component/ui/textarea';
import { Card } from '@/component/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/component/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface GroupAnnouncementProps {
  groupId: string;
  announcement: string | null;
  isAdmin: boolean;
  onAnnouncementUpdated?: () => void;
}

const GroupAnnouncement: React.FC<GroupAnnouncementProps> = ({
  groupId,
  announcement,
  isAdmin,
  onAnnouncementUpdated
}) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState(announcement || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateAnnouncement = async () => {
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('groups')
        .update({ 
          announcement_message: newAnnouncement || null,
          announcement_updated_at: new Date().toISOString()
        })
        .eq('id', groupId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: newAnnouncement ? 'Announcement updated!' : 'Announcement removed.'
      });

      onAnnouncementUpdated?.();
      setOpen(false);
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast({
        title: 'Error',
        description: 'Failed to update announcement.',
        variant: 'destructive'
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!announcement && !isAdmin) return null;

  return (
    <>
      {announcement && (
        <Card className="mx-4 mt-4 border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <div className="p-3">
            <div className="flex items-start gap-2">
              <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">
                  Group Announcement
                </p>
                <p className="text-sm text-amber-900 dark:text-amber-100 whitespace-pre-wrap">
                  {announcement}
                </p>
              </div>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setOpen(true)}
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {isAdmin && (
        <Dialog open={open} onOpenChange={setOpen}>
          {!announcement && (
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="mx-4 mt-2">
                <Megaphone className="h-4 w-4 mr-2" />
                Create Announcement
              </Button>
            </DialogTrigger>
          )}
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Group Announcement</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                placeholder="Enter announcement message..."
                value={newAnnouncement}
                onChange={(e) => setNewAnnouncement(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <div className="text-xs text-muted-foreground text-right">
                {newAnnouncement.length}/500
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdateAnnouncement}
                  disabled={isUpdating}
                >
                  {isUpdating ? 'Updating...' : 'Save'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default GroupAnnouncement;
