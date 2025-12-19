-- Migration: Fix swipe limit functions to properly handle no records
-- Run this in your Supabase SQL Editor

-- Fix get_remaining_swipes to return 20 when no record exists
CREATE OR REPLACE FUNCTION get_remaining_swipes(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  user_tier TEXT;
  daily_count INTEGER := 0;
  max_swipes INTEGER := 20;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM profiles
  WHERE id = user_id_param;
  
  -- Premium swipes tier or higher gets unlimited
  IF user_tier IN ('premium_swipes', 'premium', 'vip') THEN
    RETURN 999999; -- Effectively unlimited
  END IF;
  
  -- Get today's swipe count (defaults to 0 if no record)
  SELECT COALESCE(swipe_count, 0) INTO daily_count
  FROM daily_swipes
  WHERE user_id = user_id_param
    AND swipe_date = CURRENT_DATE;
  
  -- If no record found, daily_count will be NULL, so use 0
  IF daily_count IS NULL THEN
    daily_count := 0;
  END IF;
  
  -- Return remaining swipes (20 - count, minimum 0)
  RETURN GREATEST(0, max_swipes - daily_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix increment_daily_swipe to ensure it works correctly
CREATE OR REPLACE FUNCTION increment_daily_swipe(user_id_param UUID)
RETURNS VOID AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Get current count or default to 0
  SELECT COALESCE(swipe_count, 0) INTO current_count
  FROM daily_swipes
  WHERE user_id = user_id_param
    AND swipe_date = CURRENT_DATE;
  
  -- If no record exists, current_count will be NULL
  IF current_count IS NULL THEN
    current_count := 0;
  END IF;
  
  -- Insert or update
  INSERT INTO daily_swipes (user_id, swipe_date, swipe_count)
  VALUES (user_id_param, CURRENT_DATE, current_count + 1)
  ON CONFLICT (user_id, swipe_date)
  DO UPDATE SET 
    swipe_count = daily_swipes.swipe_count + 1,
    updated_at = TIMEZONE('utc'::text, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

