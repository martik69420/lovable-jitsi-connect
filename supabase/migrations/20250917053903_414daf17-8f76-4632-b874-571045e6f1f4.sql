-- Make receiver_id nullable to support group messages
ALTER TABLE public.messages
ALTER COLUMN receiver_id DROP NOT NULL;

-- Optional: ensure content remains required (no change) and group_id is already nullable

-- Add trigger to update groups.updated_at when a new message is inserted for a group
DROP TRIGGER IF EXISTS update_group_timestamp_on_message ON public.messages;
CREATE TRIGGER update_group_timestamp_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
WHEN (NEW.group_id IS NOT NULL)
EXECUTE FUNCTION public.update_group_updated_at();