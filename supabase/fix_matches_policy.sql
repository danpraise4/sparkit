-- Fix RLS policies for matches table to allow trigger to create matches

-- Update the function to use SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION create_match_on_mutual_like()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the other user has also liked this user
  IF EXISTS (
    SELECT 1 FROM swipes
    WHERE swiper_id = NEW.swiped_id
    AND swiped_id = NEW.swiper_id
    AND action = 'like'
  ) AND NEW.action = 'like' THEN
    -- Create match (ensuring user1_id < user2_id)
    INSERT INTO matches (user1_id, user2_id)
    VALUES (
      LEAST(NEW.swiper_id, NEW.swiped_id),
      GREATEST(NEW.swiper_id, NEW.swiped_id)
    )
    ON CONFLICT (user1_id, user2_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_mutual_like ON swipes;
CREATE TRIGGER on_mutual_like
AFTER INSERT ON swipes
FOR EACH ROW
EXECUTE FUNCTION create_match_on_mutual_like();

-- Ensure matches table has proper policies
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
CREATE POLICY "Users can view their own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Add a policy to allow inserts (though SECURITY DEFINER should bypass this)
-- This is a safety net in case SECURITY DEFINER doesn't work as expected
DROP POLICY IF EXISTS "Allow match creation via trigger" ON matches;
CREATE POLICY "Allow match creation via trigger"
  ON matches FOR INSERT
  WITH CHECK (true);
