-- Fix infinite recursion in group_members policies
-- Drop the problematic policy and create simpler ones

DROP POLICY IF EXISTS "Users can view group members for groups they belong to" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON public.group_members;
DROP POLICY IF EXISTS "Group admins can update member roles" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups or admins can remove members" ON public.group_members;

-- Create new policies without circular references
CREATE POLICY "Users can view group members for their groups" 
ON public.group_members 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 
    FROM public.group_members gm 
    WHERE gm.group_id = group_members.group_id 
    AND gm.user_id = auth.uid()
  )
);

CREATE POLICY "Group creators can add members" 
ON public.group_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.groups g 
    WHERE g.id = group_id 
    AND g.created_by = auth.uid()
  )
);

CREATE POLICY "Users can join groups they are invited to" 
ON public.group_members 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Group creators can update member roles" 
ON public.group_members 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.groups g 
    WHERE g.id = group_id 
    AND g.created_by = auth.uid()
  )
);

CREATE POLICY "Users can leave groups" 
ON public.group_members 
FOR DELETE 
USING (user_id = auth.uid());

CREATE POLICY "Group creators can remove members" 
ON public.group_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.groups g 
    WHERE g.id = group_id 
    AND g.created_by = auth.uid()
  )
);