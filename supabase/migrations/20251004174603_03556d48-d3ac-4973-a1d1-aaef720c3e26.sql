-- Function to auto-add creator as admin member when a group is created
create or replace function public.add_creator_as_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id, role)
  values (new.id, new.created_by, 'admin');
  return new;
end;
$$;

-- AFTER INSERT trigger to add creator to group_members
create trigger add_creator_as_member_trigger
  after insert on public.groups
  for each row execute function public.add_creator_as_member();