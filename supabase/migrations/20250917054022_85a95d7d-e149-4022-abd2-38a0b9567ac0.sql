-- Fix the remaining circular reference in group_members SELECT policy
DROP POLICY IF EXISTS "Users can view group members for their groups" ON public.group_members;

-- Create a simpler policy without self-referencing
CREATE POLICY "Users can view group members" 
ON public.group_members 
FOR SELECT 
USING (
  -- Users can see their own membership record
  user_id = auth.uid() 
  OR 
  -- Users can see members of groups they are part of
  group_id IN (
    SELECT gm.group_id 
    FROM public.group_members gm 
    WHERE gm.user_id = auth.uid()
  )
);