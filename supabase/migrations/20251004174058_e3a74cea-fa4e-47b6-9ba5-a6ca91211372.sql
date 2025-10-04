-- Create trigger to automatically set group creator
-- This ensures created_by is set for RLS policy validation
CREATE TRIGGER set_group_creator_trigger
  BEFORE INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.set_group_creator();

-- Ensure groups table has RLS enabled
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;