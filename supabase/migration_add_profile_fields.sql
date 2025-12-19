-- Migration: Add additional profile fields for comprehensive profile editing
-- Run this to add all the profile fields shown in the profile edit screen

DO $$ 
BEGIN
  -- Add work field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'work') THEN
    ALTER TABLE profiles ADD COLUMN work TEXT;
    RAISE NOTICE 'Added work column to profiles table';
  END IF;
  
  -- Add education field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'education') THEN
    ALTER TABLE profiles ADD COLUMN education TEXT;
    RAISE NOTICE 'Added education column to profiles table';
  END IF;
  
  -- Add relationship_status field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'relationship_status') THEN
    ALTER TABLE profiles ADD COLUMN relationship_status TEXT;
    RAISE NOTICE 'Added relationship_status column to profiles table';
  END IF;
  
  -- Add sexuality field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'sexuality') THEN
    ALTER TABLE profiles ADD COLUMN sexuality TEXT;
    RAISE NOTICE 'Added sexuality column to profiles table';
  END IF;
  
  -- Add kids field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'kids') THEN
    ALTER TABLE profiles ADD COLUMN kids TEXT;
    RAISE NOTICE 'Added kids column to profiles table';
  END IF;
  
  -- Add smoking field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'smoking') THEN
    ALTER TABLE profiles ADD COLUMN smoking TEXT;
    RAISE NOTICE 'Added smoking column to profiles table';
  END IF;
  
  -- Add drinking field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'drinking') THEN
    ALTER TABLE profiles ADD COLUMN drinking TEXT;
    RAISE NOTICE 'Added drinking column to profiles table';
  END IF;
  
  -- Add languages field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'languages') THEN
    ALTER TABLE profiles ADD COLUMN languages TEXT[];
    RAISE NOTICE 'Added languages column to profiles table';
  END IF;
  
  -- Add height field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'height') THEN
    ALTER TABLE profiles ADD COLUMN height INTEGER;
    RAISE NOTICE 'Added height column to profiles table';
  END IF;
  
  -- Add star_sign field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'star_sign') THEN
    ALTER TABLE profiles ADD COLUMN star_sign TEXT;
    RAISE NOTICE 'Added star_sign column to profiles table';
  END IF;
  
  -- Add personality field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'personality') THEN
    ALTER TABLE profiles ADD COLUMN personality TEXT;
    RAISE NOTICE 'Added personality column to profiles table';
  END IF;
  
  -- Add profile_questions field (JSONB to store questions and answers)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'profile_questions') THEN
    ALTER TABLE profiles ADD COLUMN profile_questions JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added profile_questions column to profiles table';
  END IF;
  
  -- Add why_here field
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'why_here') THEN
    ALTER TABLE profiles ADD COLUMN why_here TEXT;
    RAISE NOTICE 'Added why_here column to profiles table';
  END IF;
  
END $$;

