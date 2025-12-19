-- Migration: Fix RLS policies for likes_received table
-- Run this in your Supabase SQL Editor

-- Drop existing policies first
DROP POLICY IF EXISTS "System can insert likes received" ON likes_received;
DROP POLICY IF EXISTS "Users can view likes they received" ON likes_received;
DROP POLICY IF EXISTS "Users can update likes they received" ON likes_received;
DROP POLICY IF EXISTS "Allow like tracking via trigger" ON likes_received;

-- Recreate the trigger function with SECURITY DEFINER so it can bypass RLS
CREATE OR REPLACE FUNCTION track_like_received()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.action = 'like' THEN
    INSERT INTO likes_received (liker_id, liked_id)
    VALUES (NEW.swiper_id, NEW.swiped_id)
    ON CONFLICT (liker_id, liked_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a policy that allows the trigger function to insert
-- This policy allows any authenticated user to insert, but the trigger will handle the actual insert
CREATE POLICY "Allow like tracking via trigger"
  ON likes_received FOR INSERT
  WITH CHECK (true);

-- Also ensure users can see their own likes received
CREATE POLICY "Users can view likes they received"
  ON likes_received FOR SELECT
  USING (auth.uid() = liked_id);

-- Users can update their own likes received (to mark as viewed)
CREATE POLICY "Users can update likes they received"
  ON likes_received FOR UPDATE
  USING (auth.uid() = liked_id)
  WITH CHECK (auth.uid() = liked_id);

