'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { X, Heart, MessageCircle, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import ProfileCard from '@/src/components/ProfileCard'
import MatchModal from '@/src/components/MatchModal'
import CrushModal from '@/src/components/CrushModal'
import { motion, AnimatePresence } from 'framer-motion'
import type { Profile } from '@/src/types'

interface Match {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  user1_profile: Profile
  user2_profile: Profile
  [key: string]: unknown
}

export default function ProfileView() {
  const params = useParams()
  const userId = params?.userId as string
  const { user, profile: currentUserProfile } = useAuth()
  const router = useRouter()
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null)
  const [nearbyProfiles, setNearbyProfiles] = useState<Profile[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [matchModal, setMatchModal] = useState<Match | null>(null)
  const [crushModal, setCrushModal] = useState<Profile | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  const fetchProfile = useCallback(async () => {
    if (!userId || !user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        toast.error('Profile not found')
        router.back()
        return
      }

      setViewingProfile(data as Profile)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
      router.back()
    } finally {
      setLoading(false)
    }
  }, [userId, user, router])

  const fetchNearbyProfiles = useCallback(async () => {
    if (!user || !currentUserProfile) return

    try {
      // Get user's age preferences
      const { data: agePrefs } = await supabase
        .from('age_preferences')
        .select('min_age, max_age')
        .eq('user_id', user.id)
        .maybeSingle()

      const minAge = agePrefs?.min_age || 18
      const maxAge = agePrefs?.max_age || 100

      // Get already swiped users
      const { data: swipes } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', user.id)

      const swipedIds = swipes?.map(s => s.swiped_id) || []

      // Get blocked users
      const { data: blocks } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', user.id)

      const blockedIds = blocks?.map(b => b.blocked_id) || []

      // Get users who blocked this user
      const { data: blockedBy } = await supabase
        .from('blocks')
        .select('blocker_id')
        .eq('blocked_id', user.id)

      const blockedByIds = blockedBy?.map(b => b.blocker_id) || []

      // Build exclusion list
      const excludeIds = [
        user.id,
        ...swipedIds,
        ...blockedIds,
        ...blockedByIds
      ]

      // Fetch nearby profiles
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('onboarding_complete', true)
        .gte('age', minAge)
        .lte('age', maxAge)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .limit(50)

      // Gender preference
      if (currentUserProfile.gender === 'male') {
        query = query.in('gender', ['female', 'non-binary'])
      } else if (currentUserProfile.gender === 'female') {
        query = query.in('gender', ['male', 'non-binary'])
      } else {
        query = query.neq('gender', currentUserProfile.gender)
      }

      const { data, error } = await query

      if (error) throw error

      const profiles = (data || []) as Profile[]
      setNearbyProfiles(profiles)

      // Find current profile index
      const index = profiles.findIndex(p => p.id === userId)
      setCurrentIndex(index >= 0 ? index : 0)
    } catch (error) {
      console.error('Error fetching nearby profiles:', error)
    }
  }, [user, currentUserProfile, userId])

  useEffect(() => {
    if (user) {
      fetchProfile()
      fetchNearbyProfiles()
    }
  }, [user, fetchProfile, fetchNearbyProfiles])

  useEffect(() => {
    if (nearbyProfiles.length > 0 && currentIndex < nearbyProfiles.length) {
      setViewingProfile(nearbyProfiles[currentIndex])
    }
  }, [nearbyProfiles, currentIndex])

  const handleSwipe = useCallback(async (action: 'like' | 'pass') => {
    if (!user || !viewingProfile) return

    try {
      // Check if swipe already exists
      const { data: existingSwipe } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', user.id)
        .eq('swiped_id', viewingProfile.id)
        .maybeSingle()

      // Only insert if it doesn't exist
      if (!existingSwipe) {
        const { error } = await supabase
          .from('swipes')
          .insert({
            swiper_id: user.id,
            swiped_id: viewingProfile.id,
            action: action
          })

        if (error) throw error
      } else {
        // Update existing swipe if action changed
        const { error } = await supabase
          .from('swipes')
          .update({ action: action })
          .eq('swiper_id', user.id)
          .eq('swiped_id', viewingProfile.id)

        if (error) throw error
      }

      // Check for match
      if (action === 'like') {
        // Check if the other user liked back
        const { data: matchCheck } = await supabase
          .from('swipes')
          .select('*')
          .eq('swiper_id', viewingProfile.id)
          .eq('swiped_id', user.id)
          .eq('action', 'like')
          .maybeSingle()

        if (matchCheck) {
          // Create a match entry if it doesn't exist
          const { data: existingMatch } = await supabase
            .from('matches')
            .select('id')
            .or(`and(user1_id.eq.${user.id},user2_id.eq.${viewingProfile.id}),and(user1_id.eq.${viewingProfile.id},user2_id.eq.${user.id})`)
            .maybeSingle()

          if (!existingMatch) {
            const { data: newMatch, error: matchError } = await supabase
              .from('matches')
              .insert({
                user1_id: user.id,
                user2_id: viewingProfile.id
              })
              .select(`
                *,
                user1_profile:profiles!matches_user1_id_fkey(*),
                user2_profile:profiles!matches_user2_id_fkey(*)
              `)
              .single()

            if (matchError) throw matchError
            setMatchModal(newMatch as Match)
            return // Don't navigate to next profile on match
          }
        }
      }

      // Navigate to next profile
      if (currentIndex < nearbyProfiles.length - 1) {
        setCurrentIndex(currentIndex + 1)
      } else {
        // No more profiles, go back
        router.back()
      }
    } catch (error: any) {
      console.error('Error recording swipe:', error)
      toast.error(`Failed to record swipe: ${error.message || 'Unknown error'}`)
    }
  }, [user, viewingProfile, currentIndex, nearbyProfiles, router])

  const handleNext = () => {
    if (currentIndex < nearbyProfiles.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const handleBlock = async () => {
    if (!user || !viewingProfile) return

    if (!window.confirm(`Are you sure you want to block ${viewingProfile.full_name || 'this user'}?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('blocks')
        .insert({
          blocker_id: user.id,
          blocked_id: viewingProfile.id
        })

      if (error) throw error
      toast.success('User blocked')
      router.back()
    } catch (error) {
      console.error('Error blocking user:', error)
      toast.error('Failed to block user')
    }
  }

  if (loading || !viewingProfile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3EDF7' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  const hasNext = currentIndex < nearbyProfiles.length - 1
  const hasPrev = currentIndex > 0

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20 flex items-center" style={{ backgroundColor: '#F3EDF7' }}>
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-transparent px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors shadow-lg"
          >
            <X className="w-5 h-5 text-gray-900" />
          </button>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors shadow-lg"
          >
            <MoreVertical className="w-5 h-5 text-gray-900" />
          </button>
        </div>

        {/* Menu Dropdown */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-16 right-4 bg-white rounded-lg shadow-xl z-50 min-w-[200px]"
            >
              <button
                onClick={handleBlock}
                className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                Block
              </button>
              <button
                onClick={() => {
                  // Report functionality
                  toast('Report feature coming soon', { icon: 'ℹ️' })
                  setShowMenu(false)
                }}
                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Report
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile Card Container */}
        <div className="w-full max-w-md mx-auto px-4 pt-4 pb-24 flex items-center justify-center">
          <div className="relative w-full" style={{ width: '90%', maxWidth: '480px', height: '85vh', maxHeight: '700px' }}>
            {/* Navigation Arrows */}
            {hasPrev && (
              <button
                onClick={handlePrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-20 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors shadow-lg"
              >
                <ChevronLeft className="w-6 h-6 text-gray-900" />
              </button>
            )}

            {hasNext && (
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-20 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center hover:bg-white transition-colors shadow-lg"
              >
                <ChevronRight className="w-6 h-6 text-gray-900" />
              </button>
            )}

            {/* Profile Card */}
            <AnimatePresence mode="wait">
              {viewingProfile && (
                <motion.div
                  key={viewingProfile.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0"
                >
                  <ProfileCard profile={viewingProfile} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom Interaction Buttons */}
        <div className="fixed bottom-24 left-0 right-0 flex justify-center items-center gap-4 z-40">
          <button
            onClick={() => handleSwipe('pass')}
            className="w-14 h-14 rounded-full bg-white border-2 border-gray-900 shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all transform hover:scale-110 active:scale-95"
          >
            <X className="w-7 h-7 text-gray-900" strokeWidth={3} />
          </button>

          <button
            onClick={() => setCrushModal(viewingProfile)}
            className="w-14 h-14 rounded-full bg-purple-600 border-2 border-purple-600 shadow-lg flex items-center justify-center hover:bg-purple-700 transition-all transform hover:scale-110 active:scale-95"
          >
            <Heart className="w-7 h-7 text-white fill-white" strokeWidth={2.5} />
          </button>

          <button
            onClick={() => handleSwipe('like')}
            className="w-14 h-14 rounded-full bg-white border-2 border-gray-900 shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all transform hover:scale-110 active:scale-95"
          >
            <Heart className="w-7 h-7 text-gray-900" strokeWidth={2.5} />
          </button>

          <button
            onClick={() => {
              // Check if matched, then navigate to chat
              // For now, just show message option
              toast('Start a conversation after matching!', { icon: '💬' })
            }}
            className="w-14 h-14 rounded-full bg-white border-2 border-gray-900 shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all transform hover:scale-110 active:scale-95"
          >
            <MessageCircle className="w-7 h-7 text-gray-900" strokeWidth={2.5} />
          </button>
        </div>

        <BottomNav />

        {/* Match Modal */}
        {matchModal && (
          <MatchModal
            match={matchModal}
            onClose={() => setMatchModal(null)}
            onSendMessage={() => {
              router.push(`/chat/${matchModal.id}`)
            }}
          />
        )}

        {/* Crush Modal */}
        {crushModal && (
          <CrushModal
            profile={crushModal}
            onClose={() => setCrushModal(null)}
            onSuccess={() => {
              setCrushModal(null)
              // Refresh profile to get updated credits
              window.location.reload()
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

