'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { ArrowLeft, Heart, Lock, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import type { Profile } from '@/src/types'

// Helper function to shuffle array randomly
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export default function ViewLikes() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [likes, setLikes] = useState<Array<{ swiper_id: string; swiper?: Profile; created_at: string }>>([])
  const [loading, setLoading] = useState(true)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const hasPremium = profile?.subscription_tier === 'premium_messages' || 
                     profile?.subscription_tier === 'premium' || 
                     profile?.subscription_tier === 'vip'

  const fetchLikes = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Get users who liked the current user (from swipes table)
      const { data: swipes, error } = await supabase
        .from('swipes')
        .select(`
          swiper_id,
          created_at,
          swiper:profiles!swipes_swiper_id_fkey(*)
        `)
        .eq('swiped_id', user.id)
        .eq('action', 'like')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get existing matches to filter them out
      const { data: matches } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)

      const matchedIds = new Set(
        (matches || []).map(m => m.user1_id === user.id ? m.user2_id : m.user1_id)
      )

      // Filter out already matched users and randomize
      const unmatchedLikes = (swipes || [])
        .filter((swipe: any) => !matchedIds.has(swipe.swiper_id))
        .map((swipe: any) => ({
          swiper_id: swipe.swiper_id,
          swiper: Array.isArray(swipe.swiper) ? swipe.swiper[0] as Profile : swipe.swiper as Profile,
          created_at: swipe.created_at
        }))

      // Randomize the order
      const shuffledLikes = shuffleArray(unmatchedLikes)
      setLikes(shuffledLikes)
    } catch (error) {
      console.error('Error fetching likes:', error)
      toast.error('Failed to load likes')
    } finally {
      setLoading(false)
    }
  }, [user])

  const handleProfileClick = (swiperId: string) => {
    if (!hasPremium) {
      setShowUpgradeModal(true)
      return
    }
    // Navigate to profile if premium
    router.push(`/profile/${swiperId}`)
  }

  const handleConnect = async (swiperId: string) => {
    if (!user || !hasPremium) {
      setShowUpgradeModal(true)
      return
    }

    try {
      // Check if they already liked this person back
      const { data: existingSwipe } = await supabase
        .from('swipes')
        .select('*')
        .eq('swiper_id', user.id)
        .eq('swiped_id', swiperId)
        .eq('action', 'like')
        .maybeSingle()

      if (existingSwipe) {
        // Create a match
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .or(`and(user1_id.eq.${user.id},user2_id.eq.${swiperId}),and(user1_id.eq.${swiperId},user2_id.eq.${user.id})`)
          .maybeSingle()

        if (!existingMatch) {
          const { error: matchError } = await supabase
            .from('matches')
            .insert({
              user1_id: user.id < swiperId ? user.id : swiperId,
              user2_id: user.id < swiperId ? swiperId : user.id
            })

          if (matchError) throw matchError
          toast.success('It\'s a match! 🎉')
          router.push('/matches')
        } else {
          toast.success('Already matched!')
          router.push('/matches')
        }
      } else {
        // Like them back first
        const { error: swipeError } = await supabase
          .from('swipes')
          .insert({
            swiper_id: user.id,
            swiped_id: swiperId,
            action: 'like'
          })

        if (swipeError) throw swipeError

        // Then create match
        const { error: matchError } = await supabase
          .from('matches')
          .insert({
            user1_id: user.id < swiperId ? user.id : swiperId,
            user2_id: user.id < swiperId ? swiperId : user.id
          })

        if (matchError) throw matchError
        toast.success('It\'s a match! 🎉')
        router.push('/matches')
      }
    } catch (error) {
      console.error('Error connecting:', error)
      toast.error('Failed to connect')
    }
  }

  useEffect(() => {
    if (user) {
      fetchLikes()
    }
  }, [user, fetchLikes])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1 text-center">
            People who liked you
            {likes.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-600">({likes.length})</span>
            )}
          </h1>
          <div className="w-9"></div>
        </div>

        <div className="max-w-md mx-auto px-4 py-6">
          {likes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center mt-8">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900 mb-2">No likes yet</p>
              <p className="text-sm text-gray-600">
                Keep swiping to get more likes!
              </p>
            </div>
          ) : (
            <>
              {!hasPremium && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Lock className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">Upgrade to see who liked you</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {likes.length} {likes.length === 1 ? 'person' : 'people'} {likes.length === 1 ? 'has' : 'have'} liked you
                      </p>
                    </div>
                    <button
                      onClick={() => setShowUpgradeModal(true)}
                      className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Upgrade
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {likes.map((like) => {
                  const swiper = like.swiper
                  const swiperName = swiper?.full_name || swiper?.email?.split('@')[0] || 'Someone'
                  const hasPhoto = swiper?.photos && swiper.photos.length > 0

                  return (
                    <div
                      key={like.swiper_id}
                      className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleProfileClick(like.swiper_id)}
                    >
                      {/* Profile Picture with Blur */}
                      <div className="relative aspect-[3/4] bg-gray-200">
                        {hasPhoto ? (
                          <>
                            <img
                              src={swiper.photos![0]}
                              alt={swiperName}
                              className={`w-full h-full object-cover ${!hasPremium ? 'blur-md scale-110' : ''}`}
                            />
                            {!hasPremium && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <div className="text-center">
                                  <Lock className="w-8 h-8 text-white mx-auto mb-2" />
                                  <p className="text-white text-xs font-medium">Upgrade to see</p>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-6xl font-bold text-gray-400">{swiperName.charAt(0)}</span>
                          </div>
                        )}
                        {/* Heart badge */}
                        <div className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                          <Heart className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>

                      {/* Profile Info */}
                      <div className="p-3">
                        <h3 className="font-semibold text-gray-900 truncate text-sm">
                          {hasPremium ? swiperName : 'Someone'}
                        </h3>
                        {hasPremium && swiper?.age && (
                          <p className="text-xs text-gray-600">{swiper.age}</p>
                        )}
                        {!hasPremium && (
                          <p className="text-xs text-gray-500">Tap to upgrade</p>
                        )}
                      </div>

                      {/* Connect Button (only for premium) */}
                      {hasPremium && (
                        <div className="px-3 pb-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleConnect(like.swiper_id)
                            }}
                            className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                          >
                            Connect
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Upgrade Modal */}
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-gray-900" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Premium</h2>
                <p className="text-gray-600 text-sm">
                  See who liked you and connect with {likes.length} {likes.length === 1 ? 'person' : 'people'}!
                </p>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Lock className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-900">See unblurred photos</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Heart className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-900">Connect with people who liked you</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-gray-600" />
                  <span className="text-sm text-gray-900">Unlimited likes and more</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-900 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Maybe Later
                </button>
                <button
                  onClick={() => {
                    setShowUpgradeModal(false)
                    router.push('/premium')
                  }}
                  className="flex-1 px-4 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
