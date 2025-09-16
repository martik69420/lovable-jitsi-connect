-- Create groups table for group chats
CREATE TABLE public.groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members table to track group membership
CREATE TABLE public.group_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'admin', 'member'
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);

-- Add group_id column to messages table for group messages
ALTER TABLE public.messages 
ADD COLUMN group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE;

-- Enable Row Level Security
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Create policies for groups
CREATE POLICY "Users can view groups they are members of" 
ON public.groups 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members 
    WHERE group_members.group_id = groups.id 
    AND group_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create groups" 
ON public.groups 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creators can update their groups" 
ON public.groups 
FOR UPDATE 
USING (auth.uid() = created_by);

CREATE POLICY "Group creators can delete their groups" 
ON public.groups 
FOR DELETE 
USING (auth.uid() = created_by);

-- Create policies for group_members
CREATE POLICY "Users can view group members for groups they belong to" 
ON public.group_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Group admins can add members" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.role = 'admin'
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.groups g 
    WHERE g.id = group_members.group_id 
    AND g.created_by = auth.uid()
  )
);

CREATE POLICY "Group admins can update member roles" 
ON public.group_members 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.role = 'admin'
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.groups g 
    WHERE g.id = group_members.group_id 
    AND g.created_by = auth.uid()
  )
);

CREATE POLICY "Users can leave groups or admins can remove members" 
ON public.group_members 
FOR DELETE 
USING (
  auth.uid() = user_id 
  OR 
  EXISTS (
    SELECT 1 FROM public.group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid() 
    AND gm.role = 'admin'
  )
  OR 
  EXISTS (
    SELECT 1 FROM public.groups g 
    WHERE g.id = group_members.group_id 
    AND g.created_by = auth.uid()
  )
);

-- Update messages policies for group messages
CREATE POLICY "Users can send group messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  (group_id IS NOT NULL AND 
   EXISTS (
     SELECT 1 FROM public.group_members gm 
     WHERE gm.group_id = messages.group_id 
     AND gm.user_id = auth.uid()
   ))
  OR 
  (group_id IS NULL AND auth.uid() = sender_id)
);

CREATE POLICY "Users can view group messages" 
ON public.messages 
FOR SELECT 
USING (
  (group_id IS NOT NULL AND 
   EXISTS (
     SELECT 1 FROM public.group_members gm 
     WHERE gm.group_id = messages.group_id 
     AND gm.user_id = auth.uid()
   ))
  OR 
  (group_id IS NULL AND (auth.uid() = sender_id OR auth.uid() = receiver_id))
);

-- Create function to update group updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_group_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.groups 
  SET updated_at = now() 
  WHERE id = NEW.group_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic group timestamp updates
CREATE TRIGGER update_group_timestamp_on_message
AFTER INSERT ON public.messages
FOR EACH ROW
WHEN (NEW.group_id IS NOT NULL)
EXECUTE FUNCTION public.update_group_updated_at();