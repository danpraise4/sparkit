# Troubleshooting Guide

## "Failed to load profiles" Error

If you're seeing "Failed to load profiles. Please try again." on the discover page, here are the steps to fix it:

### Step 1: Check if Migration Was Run

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run this query to check if the table exists:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'pre_entered_profiles'
);
```

**If it returns `false`**: The migration hasn't been run. Go to Step 2.

**If it returns `true`**: The table exists. Go to Step 3.

### Step 2: Run the Migration

1. In Supabase SQL Editor, open the file: `supabase/migration_spark_redesign.sql`
2. Copy the entire contents
3. Paste into SQL Editor
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. Wait for it to complete (should see "Success" message)

### Step 3: Check if Profiles Exist

Run this query:

```sql
SELECT COUNT(*) FROM pre_entered_profiles;
```

**If it returns `0`**: No profiles exist. Go to Step 4.

**If it returns a number > 0**: Profiles exist. Go to Step 5.

### Step 4: Seed the Profiles

1. In Supabase SQL Editor, open the file: `supabase/seed_pre_entered_profiles.sql`
2. Copy the entire contents
3. Paste into SQL Editor
4. Click **Run**
5. Wait for it to complete

Verify profiles were created:

```sql
SELECT COUNT(*) FROM pre_entered_profiles;
-- Should return 20
```

### Step 5: Check RLS Policies

Run this query to check RLS status:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'pre_entered_profiles';
```

**If `rowsecurity` is `true`**: RLS is enabled. Check policies:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'pre_entered_profiles';
```

You should see a policy like "Anyone can view active pre-entered profiles".

**If no policies exist**: The migration didn't create them. Re-run the migration.

### Step 6: Test Query Manually

Run this query to test if you can read profiles:

```sql
SELECT * FROM pre_entered_profiles 
WHERE is_active = true 
LIMIT 5;
```

**If you see results**: The database is working. The issue might be in the app.

**If you get a permission error**: RLS is blocking. Check your user's role and the policies.

**If you get "relation does not exist"**: The table wasn't created. Re-run migration.

### Step 7: Check Browser Console

1. Open your app in the browser
2. Open Developer Tools (F12 or Cmd+Option+I)
3. Go to **Console** tab
4. Look for error messages
5. Check the **Network** tab for failed requests

Common errors:
- `relation "pre_entered_profiles" does not exist` → Migration not run
- `permission denied` → RLS policy issue
- `Network error` → Connection issue

### Step 8: Verify Environment Variables

Make sure your `.env.local` or `.env` file has:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**To find these values:**
1. Go to Supabase Dashboard
2. Click **Settings** (gear icon)
3. Click **API**
4. Copy **Project URL** and **anon public** key

### Quick Fix Checklist

- [ ] Migration file run successfully?
- [ ] Seed file run successfully?
- [ ] `pre_entered_profiles` table exists?
- [ ] At least 1 profile in the table?
- [ ] RLS policies created?
- [ ] Environment variables set correctly?
- [ ] Browser console shows no errors?

### Still Not Working?

1. **Check Supabase Logs**:
   - Go to Dashboard → Logs → Postgres Logs
   - Look for errors related to `pre_entered_profiles`

2. **Verify User Authentication**:
   - Make sure you're logged in
   - Check if user exists in `auth.users` table

3. **Test RLS Policies**:
   ```sql
   -- Test as authenticated user
   SET ROLE authenticated;
   SELECT * FROM pre_entered_profiles LIMIT 1;
   ```

4. **Recreate Table** (last resort):
   ```sql
   -- Drop and recreate (WARNING: This deletes all data)
   DROP TABLE IF EXISTS pre_entered_profiles CASCADE;
   -- Then re-run migration
   ```

## Other Common Issues

### "Signups not allowed for OTP"
- **Fix**: Enable email signups in Supabase Dashboard → Authentication → Settings

### "Relation does not exist"
- **Fix**: Run the migration file

### "Permission denied"
- **Fix**: Check RLS policies are created correctly

### "No profiles available"
- **Fix**: Run the seed file

