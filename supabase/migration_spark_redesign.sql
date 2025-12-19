-- Spark App Redesign - Complete Migration
-- This migration creates ALL necessary tables for a fresh database
-- Run this on a new database to set up everything

-- ============================================================================
-- PREREQUISITES
-- ============================================================================
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- BASE TABLES (from original schema)
-- ============================================================================

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  age INTEGER,
  gender TEXT CHECK (gender IN ('male', 'female', 'non-binary', 'prefer-not-to-say')),
  location TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  bio TEXT CHECK (char_length(bio) <= 500),
  interests TEXT[] DEFAULT '{}',
  photos TEXT[] DEFAULT '{}',
  verification_badge BOOLEAN DEFAULT false,
  onboarding_complete BOOLEAN DEFAULT false,
  subscription_tier TEXT DEFAULT 'basic' CHECK (subscription_tier IN ('basic', 'premium', 'vip')),
  interest_preference TEXT CHECK (interest_preference IN ('men', 'women', 'both')),
  points_balance INTEGER DEFAULT 0,
  why_here TEXT DEFAULT 'Ready for a relationship',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Age preferences table
CREATE TABLE IF NOT EXISTS age_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  min_age INTEGER DEFAULT 18,
  max_age INTEGER DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Swipes table (likes/passes) - keeping for backward compatibility
CREATE TABLE IF NOT EXISTS swipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  swiper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  swiped_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('like', 'pass')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(swiper_id, swiped_id)
);

-- Matches table - keeping for backward compatibility
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id)
);

-- Messages table (updated to support both match_id and chat_id)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  chat_id UUID, -- Will reference chats table (added below)
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  photo_url TEXT,
  read BOOLEAN DEFAULT false,
  points_used INTEGER DEFAULT 0,
  is_free_message BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'fake-profile', 'inappropriate-content')),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(reporter_id, reported_id)
);

-- Blocks table
CREATE TABLE IF NOT EXISTS blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(blocker_id, blocked_id)
);

-- ============================================================================
-- NEW TABLES FOR SPARK REDESIGN
-- ============================================================================

-- Pre-entered profiles table
CREATE TABLE IF NOT EXISTS pre_entered_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  bio TEXT,
  photos TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Interest preferences table
CREATE TABLE IF NOT EXISTS interest_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preference TEXT NOT NULL CHECK (preference IN ('men', 'women', 'both')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- User points table
CREATE TABLE IF NOT EXISTS user_points (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Point transactions table
CREATE TABLE IF NOT EXISTS point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for purchase, negative for spending
  type TEXT NOT NULL CHECK (type IN ('purchase', 'spend', 'refund', 'bonus')),
  description TEXT,
  related_chat_id UUID, -- Will reference chats table (added below)
  payment_reference TEXT, -- For Flutterwave transaction reference
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Chats table (for new companionship model)
CREATE TABLE IF NOT EXISTS chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES pre_entered_profiles(id) ON DELETE CASCADE,
  free_messages_used INTEGER DEFAULT 0 CHECK (free_messages_used <= 5),
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, profile_id)
);

-- Conversation message count table (tracks free messages per conversation per day)
CREATE TABLE IF NOT EXISTS conversation_message_count (
  chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  free_messages_sent INTEGER DEFAULT 0 CHECK (free_messages_sent <= 5),
  paid_messages_sent INTEGER DEFAULT 0,
  PRIMARY KEY (chat_id, date)
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'moderator')),
  can_assume_profiles BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Add foreign key for messages.chat_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'messages_chat_id_fkey'
  ) THEN
    ALTER TABLE messages 
    ADD CONSTRAINT messages_chat_id_fkey 
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key for point_transactions.related_chat_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'point_transactions_related_chat_id_fkey'
  ) THEN
    ALTER TABLE point_transactions 
    ADD CONSTRAINT point_transactions_related_chat_id_fkey 
    FOREIGN KEY (related_chat_id) REFERENCES chats(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude);

-- Indexes for swipes
CREATE INDEX IF NOT EXISTS idx_swipes_swiper ON swipes(swiper_id);
CREATE INDEX IF NOT EXISTS idx_swipes_swiped ON swipes(swiped_id);

-- Indexes for matches
CREATE INDEX IF NOT EXISTS idx_matches_user1 ON matches(user1_id);
CREATE INDEX IF NOT EXISTS idx_matches_user2 ON matches(user2_id);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- Indexes for blocks
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocks_blocked ON blocks(blocked_id);

-- Indexes for pre_entered_profiles
CREATE INDEX IF NOT EXISTS idx_pre_entered_profiles_gender ON pre_entered_profiles(gender);
CREATE INDEX IF NOT EXISTS idx_pre_entered_profiles_active ON pre_entered_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_pre_entered_profiles_online ON pre_entered_profiles(is_online);

-- Indexes for point_transactions
CREATE INDEX IF NOT EXISTS idx_point_transactions_user ON point_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_point_transactions_type ON point_transactions(type);
CREATE INDEX IF NOT EXISTS idx_point_transactions_created ON point_transactions(created_at);

-- Indexes for chats
CREATE INDEX IF NOT EXISTS idx_chats_user ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_profile ON chats(profile_id);
CREATE INDEX IF NOT EXISTS idx_chats_last_message ON chats(last_message_at);

-- Index for conversation_message_count
CREATE INDEX IF NOT EXISTS idx_conv_msg_count_chat_date ON conversation_message_count(chat_id, date);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create match when both users like each other
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

-- Function to automatically update user_points when transaction is created
CREATE OR REPLACE FUNCTION update_user_points_on_transaction()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update user_points record
  INSERT INTO user_points (user_id, balance, total_earned, total_spent)
  VALUES (
    NEW.user_id,
    GREATEST(0, NEW.amount),
    CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
    CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    balance = GREATEST(0, user_points.balance + NEW.amount),
    total_earned = user_points.total_earned + CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
    total_spent = user_points.total_spent + CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can send free message in a conversation
CREATE OR REPLACE FUNCTION can_send_free_message(p_user_id UUID, p_chat_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_messages_used INTEGER;
  v_today DATE;
BEGIN
  v_today := CURRENT_DATE;
  
  -- Get free messages used today for this conversation
  SELECT COALESCE(free_messages_sent, 0)
  INTO v_free_messages_used
  FROM conversation_message_count
  WHERE chat_id = p_chat_id
  AND date = v_today;
  
  -- Return true if less than 5 free messages sent today
  RETURN v_free_messages_used < 5;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's point balance
CREATE OR REPLACE FUNCTION get_user_points(p_user_id UUID)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT COALESCE(balance, 0)
  INTO v_balance
  FROM user_points
  WHERE user_id = p_user_id;
  
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_age_preferences_updated_at ON age_preferences;
CREATE TRIGGER update_age_preferences_updated_at 
  BEFORE UPDATE ON age_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pre_entered_profiles_updated_at ON pre_entered_profiles;
CREATE TRIGGER update_pre_entered_profiles_updated_at 
  BEFORE UPDATE ON pre_entered_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_interest_preferences_updated_at ON interest_preferences;
CREATE TRIGGER update_interest_preferences_updated_at 
  BEFORE UPDATE ON interest_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_points_updated_at ON user_points;
CREATE TRIGGER update_user_points_updated_at 
  BEFORE UPDATE ON user_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chats_updated_at ON chats;
CREATE TRIGGER update_chats_updated_at 
  BEFORE UPDATE ON chats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create match on mutual like
DROP TRIGGER IF EXISTS on_mutual_like ON swipes;
CREATE TRIGGER on_mutual_like
  AFTER INSERT ON swipes
  FOR EACH ROW
  EXECUTE FUNCTION create_match_on_mutual_like();

-- Trigger for point transactions
DROP TRIGGER IF EXISTS on_point_transaction ON point_transactions;
CREATE TRIGGER on_point_transaction
  AFTER INSERT ON point_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_points_on_transaction();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE swipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_entered_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE interest_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_message_count ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can manage their own age preferences" ON age_preferences;
DROP POLICY IF EXISTS "Users can view their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can create their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can update their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
DROP POLICY IF EXISTS "Allow match creation via trigger" ON matches;
-- Drop both old and new policy names for messages (for compatibility)
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their chats" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can view their own blocks" ON blocks;
DROP POLICY IF EXISTS "Users can create blocks" ON blocks;
DROP POLICY IF EXISTS "Users can delete their own blocks" ON blocks;
DROP POLICY IF EXISTS "Anyone can view active pre-entered profiles" ON pre_entered_profiles;
DROP POLICY IF EXISTS "Admins can manage pre-entered profiles" ON pre_entered_profiles;
DROP POLICY IF EXISTS "Users can manage their own interest preferences" ON interest_preferences;
DROP POLICY IF EXISTS "Users can view their own points" ON user_points;
DROP POLICY IF EXISTS "Users can view their own point transactions" ON point_transactions;
DROP POLICY IF EXISTS "Users can create their own point transactions" ON point_transactions;
DROP POLICY IF EXISTS "Users can view their own chats" ON chats;
DROP POLICY IF EXISTS "Users can create their own chats" ON chats;
DROP POLICY IF EXISTS "Users can update their own chats" ON chats;
DROP POLICY IF EXISTS "Users can view their own conversation message counts" ON conversation_message_count;
DROP POLICY IF EXISTS "Users can manage their own conversation message counts" ON conversation_message_count;
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view other profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Age preferences policies
CREATE POLICY "Users can manage their own age preferences"
  ON age_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Swipes policies
CREATE POLICY "Users can view their own swipes"
  ON swipes FOR SELECT
  USING (auth.uid() = swiper_id OR auth.uid() = swiped_id);

CREATE POLICY "Users can create their own swipes"
  ON swipes FOR INSERT
  WITH CHECK (auth.uid() = swiper_id);

CREATE POLICY "Users can update their own swipes"
  ON swipes FOR UPDATE
  USING (auth.uid() = swiper_id)
  WITH CHECK (auth.uid() = swiper_id);

-- Matches policies
CREATE POLICY "Users can view their own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Allow match creation via trigger"
  ON matches FOR INSERT
  WITH CHECK (true);

-- Messages policies (support both match_id and chat_id)
CREATE POLICY "Users can view messages in their chats"
  ON messages FOR SELECT
  USING (
    -- Support old match_id structure
    (
      EXISTS (
        SELECT 1 FROM matches
        WHERE matches.id = messages.match_id
        AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
      )
    ) OR (
      -- Support new chat_id structure
      EXISTS (
        SELECT 1 FROM chats
        WHERE chats.id = messages.chat_id
        AND chats.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can send messages in their chats"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND (
      -- Support old match_id structure
      (
        EXISTS (
          SELECT 1 FROM matches
          WHERE matches.id = messages.match_id
          AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        )
      ) OR (
        -- Support new chat_id structure
        EXISTS (
          SELECT 1 FROM chats
          WHERE chats.id = messages.chat_id
          AND chats.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Reports policies
CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Blocks policies
CREATE POLICY "Users can view their own blocks"
  ON blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create blocks"
  ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks"
  ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- Pre-entered profiles policies
CREATE POLICY "Anyone can view active pre-entered profiles"
  ON pre_entered_profiles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage pre-entered profiles"
  ON pre_entered_profiles FOR ALL
  USING (is_admin(auth.uid()));

-- Interest preferences policies
CREATE POLICY "Users can manage their own interest preferences"
  ON interest_preferences FOR ALL
  USING (auth.uid() = user_id);

-- User points policies
CREATE POLICY "Users can view their own points"
  ON user_points FOR SELECT
  USING (auth.uid() = user_id);

-- Point transactions policies
CREATE POLICY "Users can view their own point transactions"
  ON point_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own point transactions"
  ON point_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Chats policies
CREATE POLICY "Users can view their own chats"
  ON chats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chats"
  ON chats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chats"
  ON chats FOR UPDATE
  USING (auth.uid() = user_id);

-- Conversation message count policies
CREATE POLICY "Users can view their own conversation message counts"
  ON conversation_message_count FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = conversation_message_count.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their own conversation message counts"
  ON conversation_message_count FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM chats 
      WHERE chats.id = conversation_message_count.chat_id 
      AND chats.user_id = auth.uid()
    )
  );

-- Admin users policies
-- Use the is_admin() function to avoid infinite recursion
-- The function uses SECURITY DEFINER and can bypass RLS
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (is_admin(auth.uid()));
