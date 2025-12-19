// Local storage utilities for caching app state

const STORAGE_KEYS = {
  ONBOARDING_COMPLETE: 'spark_onboarding_complete',
  ONBOARDING_CHECK_TIME: 'spark_onboarding_check_time',
  USER_ID: 'spark_user_id',
  PROFILE_CACHE: 'spark_profile_cache',
  SWIPE_LIMIT: 'spark_swipe_limit',
  SWIPE_LIMIT_TIME: 'spark_swipe_limit_time',
  SKIP_REDIRECT: 'spark_skip_redirect',
  LAST_CHECKED_PATH: 'spark_last_checked_path'
} as const

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

export const localStorage = {
  // Onboarding status
  getOnboardingComplete: (userId: string | undefined): boolean | null => {
    if (typeof window === 'undefined' || !userId) return null
    
    try {
      const cachedUserId = window.localStorage.getItem(STORAGE_KEYS.USER_ID)
      const cachedTime = window.localStorage.getItem(STORAGE_KEYS.ONBOARDING_CHECK_TIME)
      const cachedStatus = window.localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE)
      
      // If user changed or cache expired, return null
      if (cachedUserId !== userId || !cachedTime || !cachedStatus) {
        return null
      }
      
      const checkTime = parseInt(cachedTime, 10)
      const now = Date.now()
      
      if (now - checkTime > CACHE_DURATION) {
        // Cache expired
        return null
      }
      
      return cachedStatus === 'true'
    } catch (error) {
      console.error('Error reading onboarding status from localStorage:', error)
      return null
    }
  },

  setOnboardingComplete: (userId: string, isComplete: boolean): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.setItem(STORAGE_KEYS.USER_ID, userId)
      window.localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, String(isComplete))
      window.localStorage.setItem(STORAGE_KEYS.ONBOARDING_CHECK_TIME, String(Date.now()))
    } catch (error) {
      console.error('Error saving onboarding status to localStorage:', error)
    }
  },

  clearOnboardingCache: (): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE)
      window.localStorage.removeItem(STORAGE_KEYS.ONBOARDING_CHECK_TIME)
    } catch (error) {
      console.error('Error clearing onboarding cache:', error)
    }
  },

  // Swipe limit cache
  getSwipeLimit: (userId: string | undefined): number | null => {
    if (typeof window === 'undefined' || !userId) return null
    
    try {
      const cachedUserId = window.localStorage.getItem(STORAGE_KEYS.USER_ID)
      const cachedTime = window.localStorage.getItem(STORAGE_KEYS.SWIPE_LIMIT_TIME)
      const cachedLimit = window.localStorage.getItem(STORAGE_KEYS.SWIPE_LIMIT)
      
      if (cachedUserId !== userId || !cachedTime || !cachedLimit) {
        return null
      }
      
      const checkTime = parseInt(cachedTime, 10)
      const now = Date.now()
      
      // Cache for 1 minute for swipe limits
      if (now - checkTime > 60 * 1000) {
        return null
      }
      
      return parseInt(cachedLimit, 10)
    } catch (error) {
      console.error('Error reading swipe limit from localStorage:', error)
      return null
    }
  },

  setSwipeLimit: (userId: string, limit: number): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.setItem(STORAGE_KEYS.USER_ID, userId)
      window.localStorage.setItem(STORAGE_KEYS.SWIPE_LIMIT, String(limit))
      window.localStorage.setItem(STORAGE_KEYS.SWIPE_LIMIT_TIME, String(Date.now()))
    } catch (error) {
      console.error('Error saving swipe limit to localStorage:', error)
    }
  },

  // Skip redirect flag (prevents redirect loops)
  setSkipRedirect: (userId: string, pathname: string, skip: boolean): void => {
    if (typeof window === 'undefined') return
    
    try {
      const key = `${STORAGE_KEYS.SKIP_REDIRECT}_${userId}_${pathname}`
      if (skip) {
        window.localStorage.setItem(key, 'true')
        // Auto-expire after 5 seconds
        setTimeout(() => {
          window.localStorage.removeItem(key)
        }, 5000)
      } else {
        window.localStorage.removeItem(key)
      }
    } catch (error) {
      console.error('Error setting skip redirect:', error)
    }
  },

  getSkipRedirect: (userId: string, pathname: string): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      const key = `${STORAGE_KEYS.SKIP_REDIRECT}_${userId}_${pathname}`
      return window.localStorage.getItem(key) === 'true'
    } catch (error) {
      console.error('Error getting skip redirect:', error)
      return false
    }
  },

  setLastCheckedPath: (userId: string, pathname: string): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.setItem(`${STORAGE_KEYS.LAST_CHECKED_PATH}_${userId}`, pathname)
    } catch (error) {
      console.error('Error setting last checked path:', error)
    }
  },

  getLastCheckedPath: (userId: string): string | null => {
    if (typeof window === 'undefined') return null
    
    try {
      return window.localStorage.getItem(`${STORAGE_KEYS.LAST_CHECKED_PATH}_${userId}`)
    } catch (error) {
      console.error('Error getting last checked path:', error)
      return null
    }
  },

  // Clear all cache for a user
  clearUserCache: (): void => {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE)
      window.localStorage.removeItem(STORAGE_KEYS.ONBOARDING_CHECK_TIME)
      window.localStorage.removeItem(STORAGE_KEYS.SWIPE_LIMIT)
      window.localStorage.removeItem(STORAGE_KEYS.SWIPE_LIMIT_TIME)
      window.localStorage.removeItem(STORAGE_KEYS.USER_ID)
      window.localStorage.removeItem(STORAGE_KEYS.PROFILE_CACHE)
      // Clear skip redirect flags
      Object.keys(window.localStorage).forEach(key => {
        if (key.startsWith(STORAGE_KEYS.SKIP_REDIRECT)) {
          window.localStorage.removeItem(key)
        }
        if (key.startsWith(STORAGE_KEYS.LAST_CHECKED_PATH)) {
          window.localStorage.removeItem(key)
        }
      })
    } catch (error) {
      console.error('Error clearing user cache:', error)
    }
  }
}

