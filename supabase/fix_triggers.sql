-- Fix: Drop existing triggers before recreating them
-- Run this if you get "trigger already exists" errors

DROP TRIGGER IF EXISTS on_mutual_like ON swipes;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_age_preferences_updated_at ON age_preferences;

-- Recreate triggers
CREATE TRIGGER on_mutual_like
AFTER INSERT ON swipes
FOR EACH ROW
EXECUTE FUNCTION create_match_on_mutual_like();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_age_preferences_updated_at BEFORE UPDATE ON age_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

