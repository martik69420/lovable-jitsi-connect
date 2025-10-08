-- Create chat_preferences table for per-chat settings
CREATE TABLE public.chat_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  chat_id text NOT NULL,
  chat_type text NOT NULL DEFAULT 'direct',
  theme text DEFAULT 'default',
  background text DEFAULT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, chat_id, chat_type)
);

-- Enable RLS
ALTER TABLE public.chat_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage their own chat preferences"
ON public.chat_preferences
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);