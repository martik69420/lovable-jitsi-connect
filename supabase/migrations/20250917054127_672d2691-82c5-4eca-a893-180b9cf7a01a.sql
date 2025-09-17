-- Create security definer function to check group membership
CREATE OR REPLACE FUNCTION public.is_group_member(group_uuid uuid)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.group_members 
    WHERE group_id = group_uuid 
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- Fix the group_members SELECT policy using the function
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;

CREATE POLICY "Users can view group members" 
ON public.group_members 
FOR SELECT 
USING (
  user_id = auth.uid() OR public.is_group_member(group_id)
);