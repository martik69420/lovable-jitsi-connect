-- Add message features: edit, reply, pin
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS edited_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES public.messages(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;

-- Add index for pinned messages
CREATE INDEX IF NOT EXISTS idx_messages_pinned ON public.messages(group_id, is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON public.messages(reply_to) WHERE reply_to IS NOT NULL;

-- Add group announcement field
ALTER TABLE public.groups 
ADD COLUMN IF NOT EXISTS announcement_message text,
ADD COLUMN IF NOT EXISTS announcement_updated_at timestamp with time zone;

-- Create muted groups table
CREATE TABLE IF NOT EXISTS public.muted_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  muted_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Enable RLS on muted_groups
ALTER TABLE public.muted_groups ENABLE ROW LEVEL SECURITY;

-- RLS policies for muted_groups
CREATE POLICY "Users can manage their own muted groups"
ON public.muted_groups
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);