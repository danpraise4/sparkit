'use client'

import { useState } from 'react'
import { X, Heart, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import TopUpModal from './TopUpModal'
import type { Profile } from '../types'

interface CrushModalProps {
  profile: Profile
  onClose: () => void
  onSuccess?: () => void
}

const CrushModal = ({ profile, onClose, onSuccess }: CrushModalProps) => {
  const { user, profile: userProfile } = useAuth()
  const [showTopUp, setShowTopUp] = useState(false)
  const [sending, setSending] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const CRUSH_COST = 50
  const userCredits = userProfile?.credits || 0
  const hasEnoughCredits = userCredits >= CRUSH_COST

  const photos = profile?.photos || []
  const profileName = profile?.full_name || profile?.email?.split('@')[0] || 'them'

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

  const handleSendCrush = async () => {
    if (!user) return

    if (!hasEnoughCredits) {
      setShowTopUp(true)
      return
    }

    setSending(true)
    try {
      // Record the crush (you might want to create a separate crushes table)
      // For now, we'll use a special action in swipes
      const { error: swipeError } = await supabase
        .from('swipes')
        .insert({
          swiper_id: user.id,
          swiped_id: profile.id,
          action: 'like' // You might want to add 'crush' as a separate action
        })

      if (swipeError) throw swipeError

      // Deduct credits
      const { error: creditError } = await supabase
        .from('profiles')
        .update({ credits: userCredits - CRUSH_COST })
        .eq('id', user.id)

      if (creditError) throw creditError

      toast.success(`💖 Crush sent to ${profileName}!`)
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error('Error sending crush:', error)
      toast.error('Failed to send crush')
    } finally {
      setSending(false)
    }
  }

  if (showTopUp) {
    return (
      <TopUpModal
        onClose={() => setShowTopUp(false)}
        onSuccess={() => {
          setShowTopUp(false)
          // Refresh user profile to get updated credits
          window.location.reload()
        }}
        requiredCredits={CRUSH_COST}
        profile={profile}
      />
    )
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: '#F3EDF7' }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-900" />
          </button>

          <div className="p-6">
            {/* Profile Picture with Carousel */}
            <div className="relative flex items-center justify-center mb-6">
              {photos.length > 1 && (
                <button
                  onClick={prevPhoto}
                  disabled={currentPhotoIndex === 0}
                  className="absolute left-0 p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
              )}
              
              <div className="relative">
                {photos.length > 0 ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photos[currentPhotoIndex]}
                    alt={profileName}
                    className="w-32 h-32 rounded-full object-cover mx-auto"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center mx-auto">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
                {/* Crush icon overlay */}
                <div className="absolute -bottom-2 -right-2 bg-purple-600 rounded-full p-2 border-4 border-white">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>
              </div>

              {photos.length > 1 && (
                <button
                  onClick={nextPhoto}
                  disabled={currentPhotoIndex === photos.length - 1}
                  className="absolute right-0 p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              )}
            </div>

            {/* Photo dots indicator */}
            {photos.length > 1 && (
              <div className="flex justify-center gap-2 mb-6">
                {photos.map((_: string, index: number) => (
                  <div
                    key={index}
                    className={`rounded-full transition-all ${
                      index === currentPhotoIndex
                        ? 'bg-gray-900 w-2 h-2'
                        : 'bg-gray-300 w-2 h-2'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Heading */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Send {profileName} a Crush
            </h2>

            {/* Description */}
            <p className="text-sm text-gray-600 text-center mb-6">
              Don&apos;t just swipe right, stand out by sending a Crush and you&apos;re up to 2.2x more likely to chat*
            </p>

            {/* Send Crush Button */}
            <button
              onClick={handleSendCrush}
              disabled={sending}
              className="w-full border-2 border-gray-900 text-gray-900 py-4 rounded-xl font-semibold mb-3 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : `Send A Crush For ${CRUSH_COST} Credits`}
            </button>

            {/* Premium Button */}
            <button
              onClick={() => {
                // Navigate to premium page
                if (typeof window !== 'undefined') {
                  window.location.href = '/premium'
                }
              }}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-semibold mb-3 hover:bg-gray-800 transition-colors"
            >
              Get Spark Premium Plus (includes 1 Crush each day)
            </button>

            {/* Later option */}
            <button
              onClick={onClose}
              className="w-full text-gray-600 py-2 text-sm hover:text-gray-900 transition-colors"
            >
              Later
            </button>

            {/* Credit balance */}
            <p className="text-xs text-gray-500 text-center mt-4">
              Your credits: {userCredits}
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default CrushModal

