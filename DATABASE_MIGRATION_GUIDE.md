# Database Migration Guide

This document outlines all the database modifications needed for the new features implemented in the Spark app.

## Overview

The migration adds support for:
- Control Experience settings
- Privacy settings
- Invisible mode
- More About You profile fields
- Read receipts for messages
- Online status tracking

## Migration File

Run the SQL migration file located at:
```
supabase/migration_profile_features.sql
```

This file uses `DO $$` blocks to safely add columns only if they don't already exist, making it safe to run multiple times.

## New Columns Added

### Control Experience Settings
- `who_can_message` (TEXT): 'everyone' | 'liked_only' - Controls who can send messages
- `show_me_to` (TEXT): 'everyone' | 'liked_only' - Controls who can see your profile
- `read_receipts` (BOOLEAN): Enable/disable read receipts
- `show_online_status` (BOOLEAN): Show/hide online status

### Privacy Settings
- `enable_passkey` (BOOLEAN): Enable passkey authentication
- `show_location` (BOOLEAN): Show/hide location
- `show_only_to_liked` (BOOLEAN): Show profile only to people you've liked

### Invisible Mode
- `invisible_mode` (BOOLEAN): Enable invisible browsing mode

### More About You Fields
- `relationship_status` (TEXT): User's relationship status
- `sexuality` (TEXT): User's sexuality
- `kids` (TEXT): Information about children
- `smoking` (TEXT): Smoking preferences
- `drinking` (TEXT): Drinking preferences
- `languages` (TEXT[]): Array of languages spoken
- `height` (INTEGER): Height in centimeters
- `star_sign` (TEXT): Zodiac sign
- `pets` (TEXT): Pet preferences
- `religion` (TEXT): Religious beliefs
- `personality` (TEXT): Personality traits
- `work` (TEXT): Work/occupation
- `why_here` (TEXT): Reason for joining (default: 'Ready for a relationship')
- `profile_questions` (JSONB): Flexible storage for profile questions

### Online Status Tracking
- `last_seen` (TIMESTAMP WITH TIME ZONE): Last time user was active
- `is_online` (BOOLEAN): Current online status

### Messages Table Updates
- `read` (BOOLEAN): Already exists, but now properly used
- `read_at` (TIMESTAMP WITH TIME ZONE): Timestamp when message was read

## Indexes Created

For better query performance:
- `idx_profiles_location`: Index on latitude/longitude for location-based queries
- `idx_profiles_online`: Index on is_online for online user queries
- `idx_messages_read`: Index on match_id and read status for unread message queries

## Functions Created

- `update_last_seen()`: Trigger function to update last_seen timestamp (for future use)

## How to Apply

1. Open your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/migration_profile_features.sql`
4. Run the migration
5. Verify the columns were added by checking the `profiles` table structure

## Default Values

All new columns have appropriate defaults:
- Boolean fields default to `false` (except `show_online_status` which defaults to `true`)
- `who_can_message` and `show_me_to` default to `'everyone'`
- `why_here` defaults to `'Ready for a relationship'`
- `profile_questions` defaults to an empty JSON object

## Notes

- The migration is idempotent (safe to run multiple times)
- Existing data is preserved
- All new columns are nullable except where defaults are provided
- The migration uses PostgreSQL's `DO $$` blocks for conditional column creation

