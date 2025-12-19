# Spark - Dating App

A modern, full-featured dating web application built with React and Supabase.

## Features

- 🔐 User Authentication (Email, Phone, Google OAuth)
- 👤 Profile Management with Photo Uploads
- 💕 Swipe-Based Matching System
- 💬 Real-Time Messaging
- 🛡️ Safety Features (Report/Block)
- ⭐ Premium Subscription Tiers

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Setup

Run the SQL scripts in `supabase/schema.sql` in your Supabase SQL editor to set up the database tables.

### 4. Storage Buckets

In Supabase Dashboard, go to Storage and create these buckets:
- `profiles` (public)
- `chat-photos` (public)

### 5. Run the App

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/         # Page components
├── hooks/         # Custom React hooks
├── lib/           # Utilities and Supabase client
├── context/        # React context providers
└── styles/        # Global styles
```

## Tech Stack

- React 18
- Vite
- Supabase
- React Router
- Framer Motion
- Tailwind CSS
- React Hook Form

# spark
# spark
# spark-dating
# sparkle
# sparkle
# sparkle
# spark-dating-next
# sparkit
