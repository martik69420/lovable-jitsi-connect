-- Enable real-time updates for the messages table
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add the messages table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;