-- Add image_url column to messages if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'image_url') THEN
        ALTER TABLE public.messages ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Add reactions column to messages for JSON reactions data
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'reactions') THEN
        ALTER TABLE public.messages ADD COLUMN reactions JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create message-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('message-images', 'message-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for message-images bucket
DO $$ 
BEGIN
    -- Policy for viewing message images
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Message images are publicly accessible'
    ) THEN
        CREATE POLICY "Message images are publicly accessible" 
        ON storage.objects 
        FOR SELECT 
        USING (bucket_id = 'message-images');
    END IF;

    -- Policy for uploading message images
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can upload message images'
    ) THEN
        CREATE POLICY "Users can upload message images" 
        ON storage.objects 
        FOR INSERT 
        WITH CHECK (bucket_id = 'message-images' AND auth.uid() IS NOT NULL);
    END IF;

    -- Policy for deleting message images
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects' 
        AND policyname = 'Users can delete their message images'
    ) THEN
        CREATE POLICY "Users can delete their message images" 
        ON storage.objects 
        FOR DELETE 
        USING (bucket_id = 'message-images' AND auth.uid() IS NOT NULL);
    END IF;
END $$;