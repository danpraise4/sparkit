'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import { Settings as SettingsIcon, Edit, ChevronRight, Heart, Clock, Plus } from 'lucide-react'

export default function Profile() {
  const { profile, user, refreshProfile } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('plans')

  // Refresh profile when component mounts or when returning from edit page
  useEffect(() => {
    if (user?.id && refreshProfile) {
      refreshProfile()
    }
  }, [user?.id, refreshProfile])

  // Debug: Log profile data
  useEffect(() => {
    if (profile) {
      console.log('Profile data:', profile)
      console.log('why_here value:', profile.why_here, typeof profile.why_here)
    }
  }, [profile])

  if (!profile) {
    return (
      <div className="min-h-screen bg-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const profileCompletion = Math.min(100, 
    ((profile.photos?.length ?? 0) > 0 ? 15 : 0) +
    (profile.bio ? 10 : 0) +
    ((profile.interests?.length ?? 0) > 0 ? 10 : 0) +
    (profile.age ? 8 : 0) +
    (profile.gender ? 8 : 0) +
    (profile.location ? 8 : 0) +
    (profile.verification_badge ? 5 : 0) +
    // More About You fields (3 points each, max 30 points)
    (profile.relationship_status ? 3 : 0) +
    (profile.sexuality ? 3 : 0) +
    (profile.kids ? 3 : 0) +
    (profile.smoking ? 3 : 0) +
    (profile.drinking ? 3 : 0) +
    (profile.star_sign ? 3 : 0) +
    (profile.pets ? 3 : 0) +
    (profile.religion ? 3 : 0) +
    (profile.personality ? 3 : 0) +
    (profile.education ? 3 : 0) +
    (profile.work ? 3 : 0) +
    (profile.height ? 3 : 0) +
    ((profile.languages && Array.isArray(profile.languages) && profile.languages.length > 0) ? 3 : 0) +
    (profile.why_here ? 3 : 0) +
    10 // Base completion
  )

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50 pb-20">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <h1 className="text-lg font-semibold flex-1 text-center text-gray-900">Profile</h1>
          <div className="flex items-center gap-3 absolute right-4">
            <Link href="/settings" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <SettingsIcon className="w-5 h-5 text-gray-900" />
            </Link>
            <Link href="/profile/edit" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Edit className="w-5 h-5 text-gray-900" />
            </Link>
          </div>
        </div>

        <div className="max-w-md mx-auto">
          {/* Profile Header */}
          <div className="bg-white px-3 sm:px-4 py-4 sm:py-6">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="relative flex-shrink-0">
                {profile.photos && profile.photos.length > 0 ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={profile.photos[0]}
                    alt={profile.full_name || 'Profile'}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary-200 to-secondary-200 flex items-center justify-center">
                    <span className="text-2xl sm:text-3xl">👤</span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center border-2 border-white">
                  {profileCompletion}%
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {profile.full_name || profile.email?.split('@')[0] || 'User'}, {profile.age}
                </h2>
                <button
                  onClick={() => router.push('/profile/edit/why-here')}
                  className="mt-2 flex items-center gap-1.5 sm:gap-2 bg-gray-100 px-2 sm:px-3 py-1 rounded-full hover:bg-gray-200 transition-colors touch-manipulation"
                >
                  <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-700 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                    {(() => {
                      const whyHere = profile.why_here
                      if (whyHere && typeof whyHere === 'string' && whyHere.trim() !== '') {
                        return whyHere
                      }
                      return 'Ready for a relationship'
                    })()}
                  </span>
                </button>
                <div className="mt-3 bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                      <span className="text-purple-600 text-xs">🏠</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700">What&apos;s your star sign?</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white border-b border-gray-200 flex">
            <button
              onClick={() => setActiveTab('plans')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'plans'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500'
              }`}
            >
              Plans
            </button>
            <button
              onClick={() => setActiveTab('safety')}
              className={`flex-1 py-3 text-center font-medium transition-colors ${
                activeTab === 'safety'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500'
              }`}
            >
              Safety
            </button>
          </div>

          {/* Content */}
          {activeTab === 'plans' && (
            <div className="bg-white">
              {/* Activity and Credits */}
              <div className="px-4 py-6 grid grid-cols-2 gap-4 border-b border-gray-200">
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-6 h-6 text-red-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Activity</p>
                  <p className="text-sm font-semibold text-red-600">Low</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <Plus className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Credits</p>
                  <p className="text-sm font-semibold text-gray-900">Add</p>
                </div>
              </div>

              {/* Premium Section */}
              <div className="px-3 sm:px-4 py-4 sm:py-6 bg-purple-50 mx-3 sm:mx-4 my-3 sm:my-4 rounded-2xl">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Spark Premium</h3>
                <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                  Control your dating on Premium and get up to 13x more matches* than non-subscribers.
                </p>
                <Link
                  href="/premium"
                  className="block w-full bg-gray-900 text-white text-center py-2.5 sm:py-3 rounded-lg text-sm sm:text-base font-semibold hover:bg-gray-800 transition-colors mb-2 touch-manipulation"
                >
                  Upgrade From ${profile.subscription_tier === 'premium' ? '9.99' : profile.subscription_tier === 'vip' ? '19.99' : '1.99'}
                </Link>
                <p className="text-xs text-gray-500">*Based on top 10% of 2.7m users sample</p>
              </div>

              {/* What's Included */}
              <div className="px-4 py-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">What&apos;s included</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 text-sm font-medium text-gray-700"></th>
                        <th className="text-center py-2 text-sm font-medium text-gray-700">Premium</th>
                        <th className="text-center py-2 text-sm font-medium text-gray-700">Plus</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {[
                        { icon: '💜', feature: 'See who liked you' },
                        { icon: '💬', feature: 'Unlock 2 Chats before matching each week' },
                        { icon: '⚡', feature: '1 Extra Show each week' },
                        { icon: '💖', feature: '1 Crush per day' },
                        { icon: '✓✓', feature: 'Read receipts on all your chats' },
                        { icon: '⬆️', feature: 'Prioritize your sent messages' },
                        { icon: '👍', feature: 'Never run out of likes' },
                        { icon: '↩️', feature: 'Undo accidental left swipes' },
                        { icon: '🎚️', feature: 'Get unlimited filters' },
                        { icon: '🚗', feature: 'Browse profiles privately' },
                        { icon: '🚫', feature: 'Remove ads' },
                      ].map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-3 flex items-center gap-2">
                            <span>{item.icon}</span>
                            <span className="text-gray-700">{item.feature}</span>
                          </td>
                          <td className="text-center">
                            <span className="text-green-600 font-bold">✓</span>
                          </td>
                          <td className="text-center">
                            <span className="text-green-600 font-bold">✓</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'safety' && (
            <div className="bg-white">
              {/* Get help from Spark */}
              <Link
                href="/settings/help"
                className="flex items-center justify-between px-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">🛡️</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Get help from Spark</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              {/* Turn on invisible mode */}
              <Link
                href="/settings/invisible-mode"
                className="flex items-center justify-between px-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">🚗</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Turn on invisible mode</p>
                    <p className="text-sm text-gray-500">Go invisible to browse privately</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>

              {/* Manage your privacy */}
              <Link
                href="/settings/privacy"
                className="flex items-center justify-between px-4 py-4 border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xl">🔒</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Manage your privacy</p>
                    <p className="text-sm text-gray-500">Choose what information you share</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
