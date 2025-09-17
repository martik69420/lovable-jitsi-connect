-- Ensure groups.created_by is automatically set to the current user
CREATE OR REPLACE FUNCTION public.set_group_creator()
RETURNS trigger AS $$
BEGIN
  NEW.created_by := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS set_group_creator_before_insert ON public.groups;
CREATE TRIGGER set_group_creator_before_insert
BEFORE INSERT ON public.groups
FOR EACH ROW
EXECUTE FUNCTION public.set_group_creator();