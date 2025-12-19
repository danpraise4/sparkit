'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import type { User } from '@supabase/supabase-js'
import type { AuthContextType, Profile } from '../types'
import { localStorage as storage } from '../lib/localStorage'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null
    
    // Get initial session with timeout
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting session:', error)
          if (timeoutId) clearTimeout(timeoutId)
          setLoading(false)
          return
        }
        
        setUser(session?.user ?? null)
        if (session?.user) {
          // Fetch profile first (critical)
          await fetchProfile(session.user.id)
          // Update online status in background (non-blocking)
          updateOnlineStatus(session.user.id, true).catch(err => {
            console.error('Failed to update online status:', err)
            // Don't block on this error
          })
          // Clear timeout since we successfully loaded
          if (timeoutId) {
            clearTimeout(timeoutId)
            timeoutId = null
          }
        } else {
          if (timeoutId) clearTimeout(timeoutId)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          if (timeoutId) clearTimeout(timeoutId)
          setLoading(false)
        }
      }
    }

    // Safety timeout - ensure loading is set to false after 10 seconds (increased from 5)
    timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout - setting loading to false')
        setLoading(false)
        timeoutId = null
      }
    }, 10000)

    initAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      
      setUser(session?.user ?? null)
      if (session?.user) {
        // Clear any existing timeout
        if (timeoutId) {
          clearTimeout(timeoutId)
          timeoutId = null
        }
        await fetchProfile(session.user.id)
        // Update online status in background (non-blocking)
        updateOnlineStatus(session.user.id, true).catch(err => {
          console.error('Failed to update online status:', err)
        })
      } else {
        setProfile(null)
        if (timeoutId) clearTimeout(timeoutId)
        setLoading(false)
      }
    })

    // Update online status periodically
    const onlineStatusInterval = setInterval(() => {
      if (user?.id) {
        updateOnlineStatus(user.id, true).catch(err => {
          console.error('Failed to update online status:', err)
        })
      }
    }, 30000) // Update every 30 seconds

    // Set offline when component unmounts
    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      clearInterval(onlineStatusInterval)
      subscription.unsubscribe()
      if (user?.id) {
        updateOnlineStatus(user.id, false).catch(err => {
          console.error('Failed to update offline status:', err)
        })
      }
    }
  }, [user?.id])

  const updateOnlineStatus = async (userId: string, isOnline: boolean) => {
    try {
      await supabase
        .from('profiles')
        .update({
          is_online: isOnline,
          last_seen: new Date().toISOString()
        })
        .eq('id', userId)
    } catch (error) {
      console.error('Error updating online status:', error)
    }
  }

  const fetchProfile = async (userId: string, retryCount = 0): Promise<void> => {
    const MAX_RETRIES = 2
    const RETRY_DELAY = 1000 // 1 second

    try {
      // Fetch profile - no timeout, let the main auth timeout handle it
      // Using maybeSingle() to handle cases where profile doesn't exist yet
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        // PGRST116 means no rows found, which is OK for new users
        if ('code' in error && error.code === 'PGRST116') {
          console.log('No profile found for user (new user)')
          setProfile(null)
          setLoading(false)
          return
        }
        
        // Retry on network errors or temporary failures
        if (retryCount < MAX_RETRIES && (
          error.message?.includes('network') ||
          error.message?.includes('timeout') ||
          error.message?.includes('fetch') ||
          !('code' in error)
        )) {
          console.warn(`Profile fetch error, retrying (${retryCount + 1}/${MAX_RETRIES}):`, error)
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
          return fetchProfile(userId, retryCount + 1)
        }
        
        console.error('Error fetching profile:', error)
        setProfile(null)
        setLoading(false)
        return
      }

      console.log('Fetched profile:', data)
      setProfile(data as Profile | null)
      setLoading(false)
    } catch (error: any) {
      // Retry on network errors
      if (retryCount < MAX_RETRIES && (
        error?.message?.includes('network') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('fetch') ||
        error?.name === 'NetworkError'
      )) {
        console.warn(`Profile fetch exception, retrying (${retryCount + 1}/${MAX_RETRIES}):`, error)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)))
        return fetchProfile(userId, retryCount + 1)
      }
      
      console.error('Error fetching profile:', error)
      setProfile(null)
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string | null, metadata: Record<string, unknown> = {}) => {
    try {
      // Send OTP for signup - explicitly set type to 'signup'
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          data: metadata,
          shouldCreateUser: true, // Create user on first OTP verification
          emailRedirectTo: undefined, // Not using magic links
        },
        // Explicitly set type to signup
      })

      if (error) {
        // If error is about signups not allowed, provide helpful message
        if (error.message?.includes('signups') || error.message?.includes('Signups not allowed')) {
          throw new Error('Signups are disabled. Please enable email signups in Supabase dashboard: Authentication > Settings > Enable email signups')
        }
        throw error
      }
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signIn = async (email: string) => {
    try {
      // Send OTP for login (not magic link)
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create user on login
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signInWithGoogle = async () => {
    try {
      // Use environment variable for site URL, fallback to window.location.origin
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 
                     (typeof window !== 'undefined' ? window.location.origin : '')
      const redirectTo = siteUrl ? `${siteUrl}/auth/callback` : undefined

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setProfile(null)
      // Clear all cached data on sign out
      storage.clearUserCache()
      toast.success('Signed out successfully')
    } catch (error) {
      toast.error('Error signing out')
      throw error
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) {
      return { data: null, error: new Error('No user logged in') }
    }
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      const updatedProfile = data as Profile
      setProfile(updatedProfile)
      
      // Re-check onboarding status after profile update and update cache
      const isComplete = await isProfileComplete(updatedProfile)
      if (isComplete && user.id) {
        storage.setOnboardingComplete(user.id, true)
      } else if (user.id) {
        // Only clear cache if we're sure it's incomplete
        // Don't clear if we're not sure - might be a partial update
        const cachedStatus = storage.getOnboardingComplete(user.id)
        if (cachedStatus === true) {
          // If cache says complete but check says incomplete, clear it
          storage.clearOnboardingCache()
        }
      }
      
      return { data: updatedProfile, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  // Check if profile has all required fields for onboarding
  const isProfileComplete = async (profileData: Profile | null): Promise<boolean> => {
    if (!profileData) {
      console.log('isProfileComplete: No profile data')
      return false
    }
    
    // Check local storage cache first
    const cachedStatus = storage.getOnboardingComplete(profileData.id)
    if (cachedStatus !== null) {
      console.log('isProfileComplete: Using cached status:', cachedStatus)
      return cachedStatus
    }
    
    // Check if onboarding is explicitly marked as complete
    if (profileData.onboarding_complete === true) {
      console.log('isProfileComplete: onboarding_complete is true')
      storage.setOnboardingComplete(profileData.id, true)
      return true
    }
    
    // Check required fields: age, gender, min age, max age, and interests
    const hasAge = !!(profileData.age && profileData.age > 0)
    const hasGender = !!(profileData.gender && typeof profileData.gender === 'string' && profileData.gender.trim() !== '')
    const hasInterests = !!(profileData.interests && Array.isArray(profileData.interests) && profileData.interests.length > 0)
    
    // Check if age preferences exist (min_age and max_age)
    let hasMinAge = false
    let hasMaxAge = false
    if (profileData.id) {
      try {
        const { data: agePrefs } = await supabase
          .from('age_preferences')
          .select('min_age, max_age')
          .eq('user_id', profileData.id)
          .maybeSingle()
        
        hasMinAge = !!(agePrefs && agePrefs.min_age)
        hasMaxAge = !!(agePrefs && agePrefs.max_age)
      } catch (error) {
        console.error('Error checking age preferences:', error)
      }
    }
    
    console.log('isProfileComplete check:', {
      hasAge,
      hasGender,
      hasInterests,
      hasMinAge,
      hasMaxAge,
      onboarding_complete: profileData.onboarding_complete
    })
    
    // Required fields: age, gender, min age, max age, and interests
    const isComplete: boolean = hasAge && hasGender && hasInterests && hasMinAge && hasMaxAge
    
    // Cache the result
    if (profileData.id) {
      storage.setOnboardingComplete(profileData.id, isComplete)
    }
    
    if (isComplete) {
      console.log('isProfileComplete: Profile has all required fields')
    } else {
      console.log('isProfileComplete: Missing required fields')
    }
    
    return isComplete
  }

  const verifyOTP = async (email: string, token: string) => {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      })

      if (error) throw error
      
      // If user is created, create profile if it doesn't exist
      if (data.user) {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', data.user.id)
          .maybeSingle()

        // If profile doesn't exist and user has metadata (from signup), create profile
        if (!existingProfile && data.user.user_metadata) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata.full_name || null,
            })

          if (profileError && profileError.code !== '23505') { // Ignore duplicate key errors
            console.error('Error creating profile:', profileError)
          }
        }

        await fetchProfile(data.user.id)
      }
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const resendOTP = async (email: string) => {
    try {
      // Resend OTP by calling signInWithOtp again
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // Allow creating user if doesn't exist
        }
      })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signInWithPassword,
        signInWithGoogle,
        signOut,
        updateProfile,
        refreshProfile: () => fetchProfile(user?.id || ''),
        isProfileComplete: () => isProfileComplete(profile),
        verifyOTP,
        resendOTP,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

