-- Migration: Update free swipe limit from 10 to 20 per day
-- Run this in your Supabase SQL Editor

-- Update the check_swipe_limit function
CREATE OR REPLACE FUNCTION check_swipe_limit(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  daily_count INTEGER;
  max_swipes INTEGER := 20; -- Updated limit for free users
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM profiles
  WHERE id = user_id_param;
  
  -- Premium swipes tier or higher gets unlimited
  IF user_tier IN ('premium_swipes', 'premium', 'vip') THEN
    RETURN TRUE;
  END IF;
  
  -- Check today's swipe count
  SELECT COALESCE(swipe_count, 0) INTO daily_count
  FROM daily_swipes
  WHERE user_id = user_id_param
    AND swipe_date = CURRENT_DATE;
  
  RETURN daily_count < max_swipes;
END;
$$ LANGUAGE plpgsql;

-- Update the get_remaining_swipes function
CREATE OR REPLACE FUNCTION get_remaining_swipes(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  user_tier TEXT;
  daily_count INTEGER;
  max_swipes INTEGER := 20; -- Updated limit for free users
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM profiles
  WHERE id = user_id_param;
  
  -- Premium swipes tier or higher gets unlimited
  IF user_tier IN ('premium_swipes', 'premium', 'vip') THEN
    RETURN 999999; -- Effectively unlimited
  END IF;
  
  -- Get today's swipe count
  SELECT COALESCE(swipe_count, 0) INTO daily_count
  FROM daily_swipes
  WHERE user_id = user_id_param
    AND swipe_date = CURRENT_DATE;
  
  RETURN GREATEST(0, max_swipes - daily_count);
END;
$$ LANGUAGE plpgsql;

