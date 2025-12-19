# Spark App Redesign - Detailed Specification

## Overview
Spark is a companionship/chat app where users pay for interactions. It's not a traditional dating app, but rather a platform where users can chat with pre-entered beautiful people for companionship.

---

## Core User Flow

### 1. **Interest Selection (First Step)**
- **Route**: `/interest` or `/onboarding/interest`
- **Purpose**: User selects their interest preference (MEN or WOMEN)
- **UI**: Clean, minimal selection screen with two large buttons/cards
- **Storage**: Save to user profile as `interest_preference: 'men' | 'women'`
- **Next Step**: After selection, redirect to `/discover` (grid view)

### 2. **Discover Grid View**
- **Route**: `/discover`
- **Purpose**: Display a grid of beautiful pre-entered profiles based on interest selection
- **UI**: 
  - Grid layout (responsive: 2 columns mobile, 3-4 columns tablet/desktop)
  - Each card shows: Photo, Name, Age (optional), Online status indicator
  - Click on card → Opens profile detail or chat
- **Data Source**: Pre-entered profiles in database (not user-generated)
- **Filtering**: Based on `interest_preference` from step 1
- **Features**:
  - Search/filter (optional)
  - Online status indicators
  - "New" badges for recently added profiles

### 3. **Profile Detail / Chat Initiation**
- **Route**: `/discover/[profileId]` or `/chat/[profileId]`
- **Purpose**: View profile details and initiate chat
- **UI**: 
  - Profile photos (swipeable gallery)
  - Name, age, bio
  - "Start Chat" button
- **Chat Initiation**: 
  - Check if user has free messages remaining (5 per day)
  - If yes → Start chat
  - If no → Show points purchase modal

### 4. **Chat System**
- **Route**: `/chat/[chatId]` or `/messages/[chatId]`
- **Purpose**: Real-time messaging with pre-entered profiles
- **Features**:
  - Message counter (X/5 free messages today)
  - Points balance display
  - "Buy Points" button when free messages exhausted
  - Message read receipts
  - Photo sharing (optional)
- **Message Limits**:
  - 5 free messages per day (resets at midnight)
  - After 5 messages, user must purchase points
  - Points cost per message (e.g., 10 points per message)

### 5. **Inside Route (Profile Assumption)**
- **Route**: `/inside`
- **Purpose**: Admin/staff can assume the profile of any pre-entered person and chat with users
- **Features**:
  - List of all pre-entered profiles
  - Select profile to assume
  - Chat interface as that profile
  - Switch between profiles easily
- **Access Control**: Only accessible to admin/staff users
- **UI**: 
  - Profile selector dropdown/list
  - Chat interface (same as user chat)
  - Current profile indicator

### 6. **Points System**
- **Route**: `/points` or `/premium` (repurpose existing)
- **Purpose**: Purchase points to send/see messages
- **Features**:
  - Point packages (e.g., 100 points = $9.99, 500 points = $39.99)
  - Current balance display
  - Purchase history
  - Auto-purchase option (optional)
- **Point Costs**:
  - Send message: 10 points
  - See new message: 5 points (optional)
  - View profile: 2 points (optional)

---

## Database Schema Changes

### New Tables

#### 1. `interest_preferences`
```sql
CREATE TABLE interest_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  preference TEXT NOT NULL CHECK (preference IN ('men', 'women')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. `pre_entered_profiles`
```sql
CREATE TABLE pre_entered_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  age INTEGER,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  bio TEXT,
  photos TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. `user_points`
```sql
CREATE TABLE user_points (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. `point_transactions`
```sql
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive for purchase, negative for spending
  type TEXT NOT NULL CHECK (type IN ('purchase', 'spend', 'refund')),
  description TEXT,
  related_chat_id UUID REFERENCES chats(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. `daily_message_count`
```sql
CREATE TABLE daily_message_count (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, date)
);
```

#### 6. `chats` (Refactored)
```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES pre_entered_profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, profile_id)
);
```

#### 7. `messages` (Updated)
```sql
-- Update existing messages table
ALTER TABLE messages 
  DROP COLUMN IF EXISTS match_id,
  ADD COLUMN IF NOT EXISTS chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS points_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_free_message BOOLEAN DEFAULT false;
```

#### 8. `admin_users`
```sql
CREATE TABLE admin_users (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'moderator')),
  can_assume_profiles BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Profile Table Updates
```sql
-- Add interest preference to profiles
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS interest_preference TEXT CHECK (interest_preference IN ('men', 'women'));

-- Add points balance (or use separate table)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS points_balance INTEGER DEFAULT 0;
```

---

## Component Structure

### New Components

1. **InterestSelector**
   - Location: `src/components/InterestSelector.tsx`
   - Purpose: MEN/WOMEN selection screen
   - Props: `onSelect: (preference: 'men' | 'women') => void`

2. **ProfileGrid**
   - Location: `src/components/ProfileGrid.tsx`
   - Purpose: Grid display of pre-entered profiles
   - Props: `profiles: PreEnteredProfile[]`, `onProfileClick: (id: string) => void`

3. **ProfileGridCard**
   - Location: `src/components/ProfileGridCard.tsx`
   - Purpose: Individual profile card in grid
   - Props: `profile: PreEnteredProfile`, `onClick: () => void`

4. **PointsDisplay**
   - Location: `src/components/PointsDisplay.tsx`
   - Purpose: Show current points balance and free messages
   - Props: `points: number`, `freeMessagesRemaining: number`

5. **PointsPurchaseModal**
   - Location: `src/components/PointsPurchaseModal.tsx`
   - Purpose: Purchase points packages
   - Props: `isOpen: boolean`, `onClose: () => void`, `onPurchase: (packageId: string) => void`

6. **MessageLimitBanner**
   - Location: `src/components/MessageLimitBanner.tsx`
   - Purpose: Show free message limit and prompt to buy points
   - Props: `freeMessagesRemaining: number`, `onBuyPoints: () => void`

7. **ProfileAssumptionSelector**
   - Location: `src/components/ProfileAssumptionSelector.tsx`
   - Purpose: Select profile to assume (for /inside route)
   - Props: `profiles: PreEnteredProfile[]`, `onSelect: (id: string) => void`, `currentProfileId: string | null`

### Updated Components

1. **BottomNav**
   - Update navigation items:
     - Discover (grid icon)
     - Messages (chat icon)
     - Points (coin/star icon)
     - Profile (user icon)

2. **Chat Interface**
   - Add points display
   - Add message limit indicator
   - Add "Buy Points" button when limit reached

---

## Route Structure

```
/                          → Landing page
/login                     → Login
/signup                    → Signup
/onboarding/interest       → Interest selection (MEN/WOMEN)
/discover                  → Grid of pre-entered profiles
/discover/[profileId]      → Profile detail view
/chat/[chatId]             → Chat interface
/messages                  → Messages list
/points                    → Points purchase page
/inside                    → Profile assumption (admin only)
/inside/chat/[chatId]      → Chat as assumed profile
/profile                   → User profile
/settings                  → Settings
```

---

## Business Logic

### Free Messages System
1. **Daily Reset**: Free messages reset at midnight (user's timezone or UTC)
2. **Tracking**: Use `daily_message_count` table with date as key
3. **Check Before Send**: 
   ```typescript
   const canSendFreeMessage = async (userId: string) => {
     const today = new Date().toISOString().split('T')[0];
     const { data } = await supabase
       .from('daily_message_count')
       .select('count')
       .eq('user_id', userId)
       .eq('date', today)
       .maybeSingle();
     
     return (data?.count || 0) < 5;
   };
   ```

### Points System
1. **Purchase Flow**:
   - User selects package
   - Process payment (Stripe/PayPal/etc.)
   - Add points to `user_points.balance`
   - Create transaction record

2. **Spend Points**:
   - On message send: Deduct points from balance
   - Create transaction record
   - Update chat last_message_at

3. **Point Costs**:
   - Send message: 10 points
   - See new message: 5 points (if implemented)
   - View profile: 2 points (if implemented)

### Profile Assumption (Inside Route)
1. **Access Control**: Check if user is in `admin_users` table
2. **Profile Selection**: List all active pre-entered profiles
3. **Chat as Profile**: When chatting, use selected profile's ID as sender
4. **Message Routing**: Messages sent from `/inside` route use profile_id, not user_id

---

## UI/UX Guidelines

### Design Principles
- **Minimalist**: Clean, uncluttered interfaces
- **Beautiful**: High-quality images, smooth animations
- **Simple**: Easy navigation, clear CTAs
- **Mobile-First**: Responsive design, touch-friendly

### Color Scheme
- Primary: Purple (#9333EA or similar)
- Secondary: Pink/Accent colors
- Background: Light purple/pink gradient (#F3EDF7)
- Text: Dark gray/black for readability

### Typography
- Headings: Bold, modern sans-serif
- Body: Clean, readable sans-serif
- Sizes: Responsive (larger on mobile for touch)

### Spacing
- Generous padding and margins
- Card-based layouts with rounded corners
- Consistent spacing system (4px, 8px, 16px, 24px, 32px)

### Animations
- Smooth transitions (200-300ms)
- Subtle hover effects
- Loading states with spinners
- Success/error toasts

---

## Implementation Phases

### Phase 1: Core Structure
1. ✅ Create detailed specification document (this file)
2. Create database migration scripts
3. Update TypeScript types
4. Create interest selection page
5. Update onboarding flow

### Phase 2: Discover Grid
1. Create pre-entered profiles table and seed data
2. Build ProfileGrid component
3. Build ProfileGridCard component
4. Update /discover route
5. Add profile detail view

### Phase 3: Chat System
1. Refactor messages/chats tables
2. Update chat interface with points display
3. Implement free message tracking
4. Add message limit banner
5. Test chat flow

### Phase 4: Points System
1. Create points tables
2. Build points purchase page
3. Integrate payment processing
4. Add points display components
5. Implement points deduction logic

### Phase 5: Inside Route
1. Create admin_users table
2. Build profile assumption selector
3. Create /inside route
4. Implement chat as profile
5. Add admin access control

### Phase 6: Polish & Testing
1. UI/UX refinements
2. Error handling
3. Loading states
4. Responsive design testing
5. Performance optimization

---

## Questions for Clarification

1. **Pre-entered Profiles**:
   - How many profiles initially?
   - Who creates/manages them? (Admin panel needed?)
   - Can profiles be added/removed dynamically?

2. **Free Messages**:
   - 5 messages total per day, or 5 per conversation?
   - Do received messages count toward the 5?
   - What happens if user doesn't use all 5?

3. **Points Pricing**:
   - What are the point package prices?
   - Any promotional packages?
   - Refund policy?

4. **Profile Assumption**:
   - How many staff/admin users?
   - Can multiple staff chat as same profile simultaneously?
   - Need notification when staff assumes profile?

5. **Chat Features**:
   - Photo sharing?
   - Voice messages?
   - Video calls? (future)

6. **Payment Processing**:
   - Which payment provider? (Stripe, PayPal, etc.)
   - Test mode setup?

---

## Next Steps

1. **Review this document** with stakeholders
2. **Answer clarification questions**
3. **Approve database schema changes**
4. **Begin Phase 1 implementation**
5. **Iterate based on feedback**

---

## Notes

- Keep existing authentication system
- Maintain existing profile structure where possible
- Preserve settings and preferences
- Ensure backward compatibility during migration
- Test thoroughly before deployment

