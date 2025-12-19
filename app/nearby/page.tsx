'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { Zap, MessageCircle, Filter, MapPin, RefreshCw, X, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import type { PreEnteredProfile } from '@/src/types'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'

// Helper function to shuffle array randomly
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Swipeable Card Component
function SwipeableCard({ 
  profile, 
  onSwipe, 
  index,
  isTop 
}: { 
  profile: PreEnteredProfile
  onSwipe: (direction: 'left' | 'right') => void
  index: number
  isTop: boolean
}) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [exitX, setExitX] = useState(0)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0])

  const photos = profile.photos && profile.photos.length > 0 ? profile.photos : []
  const scale = isTop ? 1 : 1 - index * 0.05
  const y = index * 8

  // Reset exitX when card becomes top
  useEffect(() => {
    if (isTop) {
      setExitX(0)
    }
  }, [isTop])

  const handleDragEnd = (_event: any, info: any) => {
    if (!isTop) return
    if (Math.abs(info.offset.x) > 100) {
      setExitX(info.offset.x > 0 ? 200 : -200)
      onSwipe(info.offset.x > 0 ? 'right' : 'left')
    }
  }

  const nextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1)
    }
  }

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1)
    }
  }

  return (
    <motion.div
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.2}
      onDragEnd={handleDragEnd}
      animate={{ 
        x: exitX, 
        opacity: exitX !== 0 ? 0 : 1,
        scale,
        y
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ 
        x: isTop ? x : 0, 
        rotate: isTop ? rotate : 0, 
        opacity: isTop ? opacity : 1,
        zIndex: 10 - index
      }}
      className={`absolute w-full h-full ${isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none'}`}
    >
      <div className="w-full h-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col">
        {/* Photo */}
        <div className="relative w-full h-[60vh] flex-shrink-0 bg-gray-200">
          {photos.length > 0 ? (
            <>
              <img
                src={photos[currentPhotoIndex]}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      prevPhoto()
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg z-10"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-900" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      nextPhoto()
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg z-10"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-900" />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    {photos.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === currentPhotoIndex
                            ? 'w-6 bg-white'
                            : 'w-1.5 bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-8xl font-bold text-gray-400">{profile.name?.charAt(0) || '👤'}</span>
            </div>
          )}
          {/* Online status */}
          {profile.is_online && (
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-medium text-gray-900">Online</span>
            </div>
          )}
        </div>

        {/* Profile Info - Scrollable */}
        <div 
          className="flex-1 overflow-y-auto bg-white"
          onTouchStart={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-3xl font-bold text-gray-900">
                {profile.name}
                {profile.age && <span className="font-normal text-gray-600">, {profile.age}</span>}
              </h2>
            </div>
            {profile.bio && (
              <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                {profile.bio}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function Nearby() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [nearbyProfiles, setNearbyProfiles] = useState<PreEnteredProfile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [swiping, setSwiping] = useState(false)

  const fetchNearbyProfiles = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)

      // Get user's interest preference
      const { data: interestPref } = await supabase
        .from('interest_preferences')
        .select('preference')
        .eq('user_id', user.id)
        .maybeSingle()
      
      // If no preference, redirect to interest selection
      if (!interestPref) {
        router.push('/onboarding/interest')
        return
      }

      // Build gender filter based on preference
      let genderFilter: string[] = []
      if (interestPref.preference === 'men') {
        genderFilter = ['male']
      } else if (interestPref.preference === 'women') {
        genderFilter = ['female']
      } else if (interestPref.preference === 'both') {
        genderFilter = ['male', 'female']
      }

      // Fetch pre-entered profiles
      let query = supabase
        .from('pre_entered_profiles')
        .select('*')
        .eq('is_active', true)

      // Apply gender filter if specified
      if (genderFilter.length > 0) {
        query = query.in('gender', genderFilter)
      }

      const { data, error } = await query

      if (error) throw error

      // Randomize the profiles
      const shuffledProfiles = shuffleArray(data || [])
      
      // Limit to 30 profiles for nearby
      const limitedProfiles = shuffledProfiles.slice(0, 30)

      setNearbyProfiles(limitedProfiles as PreEnteredProfile[])
    } catch (error) {
      console.error('Error fetching nearby profiles:', error)
      toast.error('Failed to load nearby profiles')
      setNearbyProfiles([])
    } finally {
      setLoading(false)
    }
  }, [user, router])

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return

    try {
      const { data: matches } = await supabase
        .from('matches')
        .select('id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

      if (!matches || matches.length === 0) {
        setUnreadCount(0)
        return
      }

      const matchIds = matches.map(m => m.id)

      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('match_id', matchIds)
        .neq('sender_id', user.id)
        .is('read', false)

      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error fetching unread count:', error)
    }
  }, [user])

  const handleSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!user || swiping || currentIndex >= nearbyProfiles.length) return

    setSwiping(true)
    const currentProfile = nearbyProfiles[currentIndex]

    try {
      // For pre-entered profiles, we might want to create a chat instead of a swipe
      // But for now, we'll just move to the next profile
      // You can add logic here to record the swipe or create a chat
      
      if (direction === 'right') {
        // Like action - could create a chat with pre-entered profile
        // For now, just show a toast
        toast.success(`Liked ${currentProfile.name}!`)
      } else {
        // Pass action
        toast('Passed', { icon: '👋' })
      }

      // Move to next profile
      if (currentIndex < nearbyProfiles.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // No more profiles
        setNearbyProfiles([])
        toast('No more profiles nearby', { icon: '📍' })
      }
    } catch (error) {
      console.error('Error handling swipe:', error)
      toast.error('Something went wrong')
    } finally {
      setSwiping(false)
    }
  }, [user, currentIndex, nearbyProfiles, swiping])

  const handleLike = () => {
    handleSwipe('right')
  }

  const handlePass = () => {
    handleSwipe('left')
  }

  useEffect(() => {
    if (profile && user) {
      fetchNearbyProfiles()
      fetchUnreadCount()
    }
  }, [profile, user, fetchNearbyProfiles, fetchUnreadCount])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </ProtectedRoute>
    )
  }

  const currentProfiles = nearbyProfiles.slice(currentIndex, currentIndex + 3)

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-32 bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <h1 className="text-lg font-bold text-gray-900">Nearby</h1>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Zap className="w-5 h-5 text-gray-700" />
            </button>
            <Link href="/matches" className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <MessageCircle className="w-5 h-5 text-gray-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
            <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Filter className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Swipeable Cards */}
        <div className="max-w-md mx-auto px-4 py-6">
          {nearbyProfiles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center mt-8">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No profiles nearby</h2>
              <p className="text-sm text-gray-600 mb-6 max-w-sm mx-auto">
                We couldn't find any profiles matching your preferences. Try refreshing or check back later.
              </p>
              <button
                onClick={fetchNearbyProfiles}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          ) : (
            <div className="relative h-[85vh] max-h-[800px]">
              <AnimatePresence mode="wait">
                {currentProfiles.map((profile, index) => (
                  <SwipeableCard
                    key={`${profile.id}-${currentIndex + index}`}
                    profile={profile}
                    onSwipe={handleSwipe}
                    index={index}
                    isTop={index === 0}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {nearbyProfiles.length > 0 && currentIndex < nearbyProfiles.length && (
          <div className="fixed bottom-24 left-0 right-0 max-w-md mx-auto px-8 pb-4">
            <div className="flex items-center justify-center gap-8">
              {/* Pass Button */}
              <button
                onClick={handlePass}
                disabled={swiping}
                className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200"
              >
                <X className="w-8 h-8 text-red-500" />
              </button>

              {/* Like Button */}
              <button
                onClick={handleLike}
                disabled={swiping}
                className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed border-2 border-gray-200"
              >
                <Heart className="w-8 h-8 text-green-500 fill-green-500" />
              </button>
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

