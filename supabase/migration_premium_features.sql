-- Migration: Add premium features support
-- Run this in your Supabase SQL Editor

-- Update subscription_tier to include new tiers
DO $$ 
BEGIN
  -- Update the check constraint to include new tiers
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_subscription_tier_check;
  ALTER TABLE profiles ADD CONSTRAINT profiles_subscription_tier_check 
    CHECK (subscription_tier IN ('basic', 'premium_swipes', 'premium_messages', 'premium', 'vip'));
END $$;

-- Add subscription metadata
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_start_date') THEN
    ALTER TABLE profiles ADD COLUMN subscription_start_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_end_date') THEN
    ALTER TABLE profiles ADD COLUMN subscription_end_date TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'subscription_status') THEN
    ALTER TABLE profiles ADD COLUMN subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired'));
  END IF;
END $$;

-- Daily swipe tracking table
CREATE TABLE IF NOT EXISTS daily_swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  swipe_date DATE NOT NULL DEFAULT CURRENT_DATE,
  swipe_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, swipe_date)
);

-- Rewind history table (to track swipes that can be undone)
CREATE TABLE IF NOT EXISTS rewind_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  swipe_id UUID NOT NULL REFERENCES swipes(id) ON DELETE CASCADE,
  swiped_profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  rewound_at TIMESTAMP WITH TIME ZONE,
  is_rewound BOOLEAN DEFAULT false
);

-- Direct messages table (messages without matching)
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  photo_url TEXT,
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CHECK (sender_id != recipient_id)
);

-- Likes visibility table (who liked you)
CREATE TABLE IF NOT EXISTS likes_received (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  liker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(liker_id, liked_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_daily_swipes_user_date ON daily_swipes(user_id, swipe_date);
CREATE INDEX IF NOT EXISTS idx_rewind_history_user ON rewind_history(user_id) WHERE is_rewound = false;
CREATE INDEX IF NOT EXISTS idx_direct_messages_recipient ON direct_messages(recipient_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_likes_received_liked ON likes_received(liked_id, viewed) WHERE viewed = false;

-- Function to check daily swipe limit (20 for free users, unlimited for premium)
CREATE OR REPLACE FUNCTION check_swipe_limit(user_id_param UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  daily_count INTEGER;
  max_swipes INTEGER := 20; -- Default limit for free users
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment daily swipe count
CREATE OR REPLACE FUNCTION increment_daily_swipe(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO daily_swipes (user_id, swipe_date, swipe_count)
  VALUES (user_id_param, CURRENT_DATE, 1)
  ON CONFLICT (user_id, swipe_date)
  DO UPDATE SET 
    swipe_count = daily_swipes.swipe_count + 1,
    updated_at = TIMEZONE('utc'::text, NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining swipes for today
CREATE OR REPLACE FUNCTION get_remaining_swipes(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
  user_tier TEXT;
  daily_count INTEGER;
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
  
  -- Get today's swipe count
  SELECT COALESCE(swipe_count, 0) INTO daily_count
  FROM daily_swipes
  WHERE user_id = user_id_param
    AND swipe_date = CURRENT_DATE;
  
  RETURN GREATEST(0, max_swipes - daily_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for new tables
ALTER TABLE daily_swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewind_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes_received ENABLE ROW LEVEL SECURITY;

-- Daily swipes policies
CREATE POLICY "Users can view their own daily swipes"
  ON daily_swipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily swipes"
  ON daily_swipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily swipes"
  ON daily_swipes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Rewind history policies
CREATE POLICY "Users can view their own rewind history"
  ON rewind_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own rewind history"
  ON rewind_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rewind history"
  ON rewind_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Direct messages policies
CREATE POLICY "Users can view messages they sent or received"
  ON direct_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send direct messages"
  ON direct_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update messages they received"
  ON direct_messages FOR UPDATE
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- Likes received policies
CREATE POLICY "Users can view likes they received"
  ON likes_received FOR SELECT
  USING (auth.uid() = liked_id);

CREATE POLICY "System can insert likes received"
  ON likes_received FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update likes they received"
  ON likes_received FOR UPDATE
  USING (auth.uid() = liked_id)
  WITH CHECK (auth.uid() = liked_id);

-- Trigger to automatically track likes in likes_received table
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
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_like_on_swipe
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION track_like_received();

-- Trigger to add swipe to rewind history
CREATE OR REPLACE FUNCTION add_to_rewind_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO rewind_history (user_id, swipe_id, swiped_profile_id, action)
  VALUES (NEW.swiper_id, NEW.id, NEW.swiped_id, NEW.action)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER add_swipe_to_rewind_history
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION add_to_rewind_history();

