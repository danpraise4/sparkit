-- Migration: Add RLS policies for age_preferences table
-- This fixes the "new row violates row-level security policy" error

-- Enable RLS on age_preferences table if not already enabled
ALTER TABLE age_preferences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own age preferences" ON age_preferences;
DROP POLICY IF EXISTS "Users can insert their own age preferences" ON age_preferences;
DROP POLICY IF EXISTS "Users can update their own age preferences" ON age_preferences;
DROP POLICY IF EXISTS "Users can delete their own age preferences" ON age_preferences;

-- Policy: Users can view their own age preferences
CREATE POLICY "Users can view their own age preferences"
ON age_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own age preferences
CREATE POLICY "Users can insert their own age preferences"
ON age_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own age preferences
CREATE POLICY "Users can update their own age preferences"
ON age_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own age preferences
CREATE POLICY "Users can delete their own age preferences"
ON age_preferences
FOR DELETE
USING (auth.uid() = user_id);

