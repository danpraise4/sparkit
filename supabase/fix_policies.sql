-- Fix: Drop all existing policies before recreating them
-- Run this if you get "policy already exists" errors

-- Profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view other profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Age preferences policies
DROP POLICY IF EXISTS "Users can manage their own age preferences" ON age_preferences;

-- Swipes policies
DROP POLICY IF EXISTS "Users can view their own swipes" ON swipes;
DROP POLICY IF EXISTS "Users can create their own swipes" ON swipes;

-- Matches policies
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their matches" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Reports policies
DROP POLICY IF EXISTS "Users can create reports" ON reports;

-- Blocks policies
DROP POLICY IF EXISTS "Users can view their own blocks" ON blocks;
DROP POLICY IF EXISTS "Users can create blocks" ON blocks;
DROP POLICY IF EXISTS "Users can delete their own blocks" ON blocks;

