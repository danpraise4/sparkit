-- Migration: Add latitude and longitude columns to profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'latitude') THEN
    ALTER TABLE profiles ADD COLUMN latitude DECIMAL(10, 8);
    RAISE NOTICE 'Added latitude column to profiles table';
  ELSE
    RAISE NOTICE 'latitude column already exists';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'longitude') THEN
    ALTER TABLE profiles ADD COLUMN longitude DECIMAL(11, 8);
    RAISE NOTICE 'Added longitude column to profiles table';
  ELSE
    RAISE NOTICE 'longitude column already exists';
  END IF;
END $$;

