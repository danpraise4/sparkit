-- Add why_here column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'why_here'
  ) THEN
    ALTER TABLE profiles 
    ADD COLUMN why_here TEXT DEFAULT 'Ready for a relationship';
    
    RAISE NOTICE 'Added why_here column to profiles table';
  ELSE
    RAISE NOTICE 'why_here column already exists in profiles table';
  END IF;
END $$;

