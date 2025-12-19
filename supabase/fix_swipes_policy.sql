-- Fix RLS policies for swipes table to allow inserts and updates

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can create their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can update their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can view swipes on them" ON swipes;

-- Recreate policies with correct syntax
-- Allow users to view swipes where they are either the swiper or the swiped user
CREATE POLICY "Users can view their own swipes"
  ON swipes FOR SELECT
  USING (auth.uid() = swiper_id OR auth.uid() = swiped_id);

-- Allow users to create swipes where they are the swiper
CREATE POLICY "Users can create their own swipes"
  ON swipes FOR INSERT
  WITH CHECK (auth.uid() = swiper_id);

-- Allow users to update their own swipes (for upsert operations)
CREATE POLICY "Users can update their own swipes"
  ON swipes FOR UPDATE
  USING (auth.uid() = swiper_id)
  WITH CHECK (auth.uid() = swiper_id);
