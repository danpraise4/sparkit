import type { User } from '@supabase/supabase-js'

export interface Profile {
  id: string
  email?: string
  full_name?: string
  age?: number
  gender?: string
  location?: string
  latitude?: number
  longitude?: number
  bio?: string
  interests?: string[]
  photos?: string[]
  onboarding_complete?: boolean
  verification_badge?: boolean
  credits?: number
  created_at?: string
  // Control Experience
  who_can_message?: 'everyone' | 'liked_only'
  show_me_to?: 'everyone' | 'liked_only'
  read_receipts?: boolean
  show_online_status?: boolean
  // Privacy
  enable_passkey?: boolean
  show_location?: boolean
  show_only_to_liked?: boolean
  // Invisible mode
  invisible_mode?: boolean
  // More About You
  relationship_status?: string
  sexuality?: string
  kids?: string
  smoking?: string
  drinking?: string
  languages?: string[]
  height?: number
  star_sign?: string
  pets?: string
  religion?: string
  personality?: string
  work?: string
  education?: string
  why_here?: string
  profile_questions?: Record<string, string>
  // Online status
  last_seen?: string
  is_online?: boolean
  // Subscription
  subscription_tier?: 'basic' | 'premium_swipes' | 'premium_messages' | 'premium' | 'vip'
  subscription_start_date?: string
  subscription_end_date?: string
  subscription_status?: 'active' | 'cancelled' | 'expired'
  // New fields for Spark redesign
  interest_preference?: 'men' | 'women' | 'both'
  points_balance?: number
  [key: string]: unknown
}

// Pre-entered profile (companionship profiles)
export interface PreEnteredProfile {
  id: string
  name: string
  age: number
  gender: 'male' | 'female'
  bio?: string
  photos: string[]
  is_active: boolean
  is_online: boolean
  last_seen?: string
  created_at: string
  updated_at: string
}

// Interest preference
export interface InterestPreference {
  user_id: string
  preference: 'men' | 'women' | 'both'
  created_at: string
  updated_at: string
}

// User points
export interface UserPoints {
  user_id: string
  balance: number
  total_earned: number
  total_spent: number
  created_at: string
  updated_at: string
}

// Point transaction
export interface PointTransaction {
  id: string
  user_id: string
  amount: number
  type: 'purchase' | 'spend' | 'refund' | 'bonus'
  description?: string
  related_chat_id?: string
  payment_reference?: string
  created_at: string
}

// Chat (conversation with pre-entered profile)
export interface Chat {
  id: string
  user_id: string
  profile_id: string
  free_messages_used: number
  last_message_at?: string
  created_at: string
  updated_at: string
}

// Conversation message count
export interface ConversationMessageCount {
  chat_id: string
  date: string
  free_messages_sent: number
  paid_messages_sent: number
}

// Admin user
export interface AdminUser {
  user_id: string
  role: 'admin' | 'staff' | 'moderator'
  can_assume_profiles: boolean
  created_at: string
}

export interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string | null, metadata?: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>
  signIn: (email: string) => Promise<{ data: unknown; error: unknown }>
  signInWithPassword: (email: string, password: string) => Promise<{ data: unknown; error: unknown }>
  signInWithGoogle: () => Promise<{ data: unknown; error: unknown }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ data: Profile | null; error: unknown }>
  refreshProfile: () => Promise<void>
  isProfileComplete: () => Promise<boolean>
  verifyOTP: (email: string, token: string) => Promise<{ data: unknown; error: unknown }>
  resendOTP: (email: string) => Promise<{ data: unknown; error: unknown }>
}

