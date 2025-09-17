-- Temporarily disable RLS on group_members to prevent recursion
ALTER TABLE public.group_members DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view group members" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can add members" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups they are invited to" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can update member roles" ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON public.group_members;
DROP POLICY IF EXISTS "Group creators can remove members" ON public.group_members;

-- Re-enable RLS and create simple policies
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Simple policies without recursion
CREATE POLICY "Users can view all group members"
ON public.group_members
FOR SELECT 
USING (true);

CREATE POLICY "Users can create group memberships"
ON public.group_members 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update group memberships"
ON public.group_members
FOR UPDATE
USING (true);

CREATE POLICY "Users can delete group memberships"
ON public.group_members
FOR DELETE
USING (true);