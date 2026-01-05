-- Create user_bans table to track banned users
CREATE TABLE public.user_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  banned_by uuid NOT NULL REFERENCES auth.users(id),
  reason text,
  banned_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  is_permanent boolean DEFAULT false,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;

-- Only admins can view bans
CREATE POLICY "Admins can view all bans"
ON public.user_bans
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can create bans
CREATE POLICY "Admins can create bans"
ON public.user_bans
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete bans (unban)
CREATE POLICY "Admins can delete bans"
ON public.user_bans
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete any post
CREATE POLICY "Admins can delete any post"
ON public.posts
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update report status
CREATE POLICY "Admins can update reports"
ON public.post_reports
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));