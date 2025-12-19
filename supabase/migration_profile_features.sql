-- Migration: Add all profile features columns
-- Run this in your Supabase SQL Editor

-- Add Control Experience settings
DO $$ 
BEGIN
  -- Who can message you
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'who_can_message') THEN
    ALTER TABLE profiles ADD COLUMN who_can_message TEXT DEFAULT 'everyone' CHECK (who_can_message IN ('everyone', 'liked_only'));
  END IF;
  
  -- Who can see you
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'show_me_to') THEN
    ALTER TABLE profiles ADD COLUMN show_me_to TEXT DEFAULT 'everyone' CHECK (show_me_to IN ('everyone', 'liked_only'));
  END IF;
  
  -- Read receipts
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'read_receipts') THEN
    ALTER TABLE profiles ADD COLUMN read_receipts BOOLEAN DEFAULT false;
  END IF;
  
  -- Show online status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'show_online_status') THEN
    ALTER TABLE profiles ADD COLUMN show_online_status BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add Privacy settings
DO $$ 
BEGIN
  -- Enable passkey
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'enable_passkey') THEN
    ALTER TABLE profiles ADD COLUMN enable_passkey BOOLEAN DEFAULT false;
  END IF;
  
  -- Show location
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'show_location') THEN
    ALTER TABLE profiles ADD COLUMN show_location BOOLEAN DEFAULT true;
  END IF;
  
  -- Show only to liked
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'show_only_to_liked') THEN
    ALTER TABLE profiles ADD COLUMN show_only_to_liked BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add Invisible mode
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'invisible_mode') THEN
    ALTER TABLE profiles ADD COLUMN invisible_mode BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add More About You fields
DO $$ 
BEGIN
  -- Relationship status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'relationship_status') THEN
    ALTER TABLE profiles ADD COLUMN relationship_status TEXT;
  END IF;
  
  -- Sexuality
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'sexuality') THEN
    ALTER TABLE profiles ADD COLUMN sexuality TEXT;
  END IF;
  
  -- Kids
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'kids') THEN
    ALTER TABLE profiles ADD COLUMN kids TEXT;
  END IF;
  
  -- Smoking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'smoking') THEN
    ALTER TABLE profiles ADD COLUMN smoking TEXT;
  END IF;
  
  -- Drinking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'drinking') THEN
    ALTER TABLE profiles ADD COLUMN drinking TEXT;
  END IF;
  
  -- Languages
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'languages') THEN
    ALTER TABLE profiles ADD COLUMN languages TEXT[];
  END IF;
  
  -- Height (in cm)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'height') THEN
    ALTER TABLE profiles ADD COLUMN height INTEGER;
  END IF;
  
  -- Star sign
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'star_sign') THEN
    ALTER TABLE profiles ADD COLUMN star_sign TEXT;
  END IF;
  
  -- Pets
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'pets') THEN
    ALTER TABLE profiles ADD COLUMN pets TEXT;
  END IF;
  
  -- Religion
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'religion') THEN
    ALTER TABLE profiles ADD COLUMN religion TEXT;
  END IF;
  
  -- Personality
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'personality') THEN
    ALTER TABLE profiles ADD COLUMN personality TEXT;
  END IF;
  
  -- Work
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'work') THEN
    ALTER TABLE profiles ADD COLUMN work TEXT;
  END IF;
  
  -- Education
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'education') THEN
    ALTER TABLE profiles ADD COLUMN education TEXT;
  END IF;
  
  -- Why here
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'why_here') THEN
    ALTER TABLE profiles ADD COLUMN why_here TEXT DEFAULT 'Ready for a relationship';
  END IF;
  
  -- Profile questions (JSONB for flexibility)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'profile_questions') THEN
    ALTER TABLE profiles ADD COLUMN profile_questions JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add read status to messages
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'read') THEN
    ALTER TABLE messages ADD COLUMN read BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'messages' AND column_name = 'read_at') THEN
    ALTER TABLE messages ADD COLUMN read_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add online status tracking
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'last_seen') THEN
    ALTER TABLE profiles ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'is_online') THEN
    ALTER TABLE profiles ADD COLUMN is_online BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_online ON profiles(is_online) WHERE is_online = true;
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(match_id, read) WHERE read = false;

-- Add function to update last_seen
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET last_seen = TIMEZONE('utc'::text, NOW()),
      is_online = true
  WHERE id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update online status (you'll need to call this periodically from your app)
-- For now, we'll update it manually when users are active

