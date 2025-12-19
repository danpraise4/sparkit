# Supabase Setup Guide for Spark

## Fixing "Signups not allowed for OTP" Error

If you're getting the error **"Signups not allowed for OTP"**, you need to enable email signups in your Supabase dashboard.

### Steps to Fix:

1. **Go to Supabase Dashboard**
   - Navigate to your project at [supabase.com](https://supabase.com)

2. **Open Authentication Settings**
   - Click on **Authentication** in the left sidebar
   - Click on **Settings** (or **Providers**)

3. **Enable Email Signups**
   - Find the **Email** provider section
   - Make sure **"Enable email signups"** is toggled **ON**
   - If it's off, toggle it on

4. **Configure OTP Settings** (if needed)
   - Under **Email Auth**, ensure:
     - **Enable email confirmations** - Can be ON or OFF (your choice)
     - **Enable email signups** - Must be **ON** ✅
     - **Enable secure email change** - Optional

5. **Save Changes**
   - Click **Save** if there's a save button

### Alternative: Using Supabase CLI

If you prefer using the Supabase CLI, you can enable signups via:

```bash
supabase auth settings update --enable-signup true
```

### Verify It's Working

After enabling signups:
1. Try signing up again from your app
2. You should receive an OTP email
3. Enter the OTP to complete signup

### Additional Notes

- **Email Templates**: You can customize the OTP email template in Authentication > Email Templates
- **Rate Limiting**: Supabase has rate limits on OTP emails (check your plan limits)
- **SMTP Settings**: For production, configure custom SMTP in Authentication > Settings > SMTP Settings

## Other Required Supabase Settings

### 1. Storage Buckets
Make sure these buckets exist:
- `profiles` (public)
- `chat-photos` (public)
- `avatars` (public) - if using for user profile photos

### 2. Database
- Run the migration: `supabase/migration_spark_redesign.sql`
- Run the seed: `supabase/seed_pre_entered_profiles.sql`

### 3. Environment Variables
Make sure your `.env.local` or `.env` file has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. RLS Policies
All RLS policies are included in the migration file. Make sure they're applied correctly.

## Troubleshooting

### Still Getting "Signups not allowed"?
1. Double-check the toggle is ON in dashboard
2. Wait a few seconds after toggling (may take a moment to propagate)
3. Clear browser cache and try again
4. Check Supabase project logs for any errors

### Not Receiving OTP Emails?
1. Check spam folder
2. Verify email address is correct
3. Check Supabase logs: Authentication > Logs
4. Verify SMTP settings if using custom SMTP
5. Check rate limits haven't been exceeded

### Other Issues?
- Check Supabase status page
- Review Supabase documentation
- Check project logs in dashboard

