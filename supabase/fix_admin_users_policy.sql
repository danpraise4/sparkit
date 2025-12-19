-- Fix for infinite recursion in admin_users RLS policy
-- Run this if you're getting the "infinite recursion detected" error

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can view admin users" ON admin_users;
DROP POLICY IF EXISTS "Admins can manage pre-entered profiles" ON pre_entered_profiles;

-- Create new policies using the is_admin() function
-- This function uses SECURITY DEFINER and can bypass RLS, avoiding recursion
CREATE POLICY "Admins can view admin users"
  ON admin_users FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage pre-entered profiles"
  ON pre_entered_profiles FOR ALL
  USING (is_admin(auth.uid()));

