-- Add location column to profiles table if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;

-- Add privacy_show_friends to user_settings for friends visibility
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS privacy_show_friends boolean DEFAULT true;