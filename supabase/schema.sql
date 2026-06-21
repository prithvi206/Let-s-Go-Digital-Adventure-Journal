-- SUPABASE DATABASE SCHEMA FOR QUESTVAULT

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 1. QUESTS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.quests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium', -- Low, Medium, High, Legendary
    location TEXT,
    quest_date DATE,
    lore_acquired TEXT,
    media_link TEXT, -- General media link or social link
    photo_url TEXT,  -- Primary cover image URL
    photo_urls TEXT[] DEFAULT '{}'::TEXT[], -- Support for multiple completion photos
    status TEXT NOT NULL DEFAULT 'Pending', -- Pending, In Progress, Completed
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Index for user quests
CREATE INDEX IF NOT EXISTS quests_user_id_idx ON public.quests(user_id);
CREATE INDEX IF NOT EXISTS quests_status_idx ON public.quests(status);

-- Enable RLS for quests
ALTER TABLE public.quests ENABLE ROW LEVEL SECURITY;

-- Policies for quests
DROP POLICY IF EXISTS "Users can view their own quests" ON public.quests;
DROP POLICY IF EXISTS "Anyone can view quests" ON public.quests;
CREATE POLICY "Anyone can view quests" 
    ON public.quests FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can create their own quests" ON public.quests;
DROP POLICY IF EXISTS "Anyone can create quests" ON public.quests;
CREATE POLICY "Anyone can create quests" 
    ON public.quests FOR INSERT 
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own quests" ON public.quests;
DROP POLICY IF EXISTS "Anyone can update quests" ON public.quests;
CREATE POLICY "Anyone can update quests" 
    ON public.quests FOR UPDATE 
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete their own quests" ON public.quests;
DROP POLICY IF EXISTS "Anyone can delete quests" ON public.quests;
CREATE POLICY "Anyone can delete quests" 
    ON public.quests FOR DELETE 
    USING (true);


-- =========================================================================
-- 2. STREAKS TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.streaks (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    longest_streak INTEGER DEFAULT 0 NOT NULL,
    last_completed_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS for streaks
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

-- Policies for streaks
DROP POLICY IF EXISTS "Users can view their own streak" ON public.streaks;
DROP POLICY IF EXISTS "Anyone can view streaks" ON public.streaks;
CREATE POLICY "Anyone can view streaks" 
    ON public.streaks FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can manage their own streak" ON public.streaks;
DROP POLICY IF EXISTS "Anyone can manage streaks" ON public.streaks;
CREATE POLICY "Anyone can manage streaks" 
    ON public.streaks FOR ALL 
    USING (true)
    WITH CHECK (true);


-- =========================================================================
-- 3. BADGES TABLE & USER BADGES TABLE
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    badge_id TEXT NOT NULL, -- 'first_quest', 'explorer', 'adventurer', 'food_hunter', 'legendary', 'world_wanderer'
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE (user_id, badge_id)
);

-- Index for user badges
CREATE INDEX IF NOT EXISTS user_badges_user_id_idx ON public.user_badges(user_id);

-- Enable RLS for badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for badges
DROP POLICY IF EXISTS "Users can view their own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Anyone can view badges" ON public.user_badges;
CREATE POLICY "Anyone can view badges" 
    ON public.user_badges FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can earn their own badges" ON public.user_badges;
DROP POLICY IF EXISTS "Anyone can earn badges" ON public.user_badges;
CREATE POLICY "Anyone can earn badges" 
    ON public.user_badges FOR INSERT 
    WITH CHECK (true);


-- =========================================================================
-- 4. TRIGGER FOR AUTO-UPDATED TIMESTAMPS
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_quests_updated_at ON public.quests;
CREATE TRIGGER update_quests_updated_at
    BEFORE UPDATE ON public.quests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();


-- =========================================================================
-- 5. STORAGE BUCKET SETUP (To be run by Postgres admin or via Supabase Console)
-- =========================================================================
-- Note: Supabase Storage uses the storage schema. We insert the bucket if it doesn't exist.
-- If running this script inside the SQL editor throws a permission error on 'storage.buckets',
-- you can create the bucket manually named 'questvault' and set it to PUBLIC.

-- Insert the questvault bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('questvault', 'questvault', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for the 'questvault' bucket
-- Allow public access to read files
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'questvault');

-- Allow authenticated users to upload files to their own folder
DROP POLICY IF EXISTS "Allow Auth Uploads" ON storage.objects;
CREATE POLICY "Allow Auth Uploads" 
    ON storage.objects FOR INSERT 
    WITH CHECK (
        bucket_id = 'questvault' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow authenticated users to update/delete their own files
DROP POLICY IF EXISTS "Allow Auth Updates" ON storage.objects;
CREATE POLICY "Allow Auth Updates" 
    ON storage.objects FOR UPDATE 
    USING (
        bucket_id = 'questvault' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

DROP POLICY IF EXISTS "Allow Auth Deletes" ON storage.objects;
CREATE POLICY "Allow Auth Deletes" 
    ON storage.objects FOR DELETE 
    USING (
        bucket_id = 'questvault' 
        AND auth.role() = 'authenticated'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );
