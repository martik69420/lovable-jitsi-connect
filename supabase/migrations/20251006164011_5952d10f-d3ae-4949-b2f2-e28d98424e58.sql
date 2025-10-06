-- Add media support to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS media_type text CHECK (media_type IN ('image', 'video', 'audio', 'voice', 'document')),
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS forwarded_from uuid REFERENCES public.messages(id),
ADD COLUMN IF NOT EXISTS mentioned_users uuid[];

-- Add theme preferences to user_settings
ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS chat_theme text DEFAULT 'default',
ADD COLUMN IF NOT EXISTS chat_background text;

-- Create index for better performance on mentions
CREATE INDEX IF NOT EXISTS idx_messages_mentioned_users ON public.messages USING GIN(mentioned_users);

-- Create index for media messages
CREATE INDEX IF NOT EXISTS idx_messages_media_type ON public.messages(media_type) WHERE media_type IS NOT NULL;