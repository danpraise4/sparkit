# Spark Dating App - Setup Guide

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for your project to be fully provisioned
3. Go to Project Settings > API
4. Copy your:
   - Project URL
   - `anon` public key

## Step 3: Configure Environment Variables

1. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

2. Replace the placeholders with your actual Supabase credentials

## Step 4: Set Up Database

1. In your Supabase dashboard, go to the SQL Editor
2. Copy the entire contents of `supabase/schema.sql`
3. Paste and run it in the SQL Editor
4. This will create all necessary tables, functions, triggers, and security policies

## Step 5: Set Up Storage Buckets

1. In Supabase dashboard, go to Storage
2. Create a new bucket named `profiles`:
   - Set it to **Public**
   - Click "Create bucket"
3. Create another bucket named `chat-photos`:
   - Set it to **Public**
   - Click "Create bucket"

## Step 6: Configure Google OAuth (Optional)

If you want to enable Google sign-in:

1. Go to Authentication > Providers in Supabase
2. Enable Google provider
3. Add your OAuth credentials:
   - Client ID (from Google Cloud Console)
   - Client Secret (from Google Cloud Console)
4. Add authorized redirect URL: `https://your-project-ref.supabase.co/auth/v1/callback`

## Step 7: Run the Application

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Step 8: Test the Application

1. Sign up for a new account
2. Complete the onboarding process
3. Upload photos and fill in your profile
4. Start swiping!

## Troubleshooting

### Photos not uploading?
- Make sure the storage buckets are created and set to public
- Check that RLS policies allow uploads (they should be set up by the schema)

### Authentication not working?
- Verify your environment variables are correct
- Check that the Supabase project is active
- Ensure email confirmation is disabled in Supabase Auth settings (for development)

### Database errors?
- Make sure you've run the schema.sql file completely
- Check that all tables were created successfully
- Verify RLS policies are enabled

### Real-time features not working?
- Check that Replication is enabled for the tables (matches, messages)
- In Supabase dashboard: Database > Replication > Enable for matches and messages tables

## Production Deployment

Before deploying to production:

1. Update environment variables in your hosting platform
2. Set up proper email templates in Supabase
3. Configure CORS settings
4. Set up proper error monitoring
5. Enable email verification
6. Configure proper backup strategies
7. Set up payment processing for premium features (Stripe, etc.)

## Features Implemented

✅ User authentication (Email, Google OAuth)
✅ Profile creation and management
✅ Photo uploads (up to 6 photos)
✅ Swipe-based matching system
✅ Real-time messaging
✅ Match notifications
✅ Report and block functionality
✅ Age preferences
✅ Premium subscription tiers (UI only)
✅ Settings page
✅ Responsive design
✅ Smooth animations

## Notes

- This is a prototype/demo application
- Payment processing for premium features is not implemented (mock only)
- Location-based matching uses simple text matching (in production, use geocoding API)
- Photo uploads are limited to 5MB per file
- The matching algorithm is simplified (can be enhanced with ML)

