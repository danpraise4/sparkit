'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { Profile } from '../types'

interface Match {
  id: string
  user1_id: string
  user2_id: string
  user1_profile?: Profile
  user2_profile?: Profile
  [key: string]: unknown
}

interface MatchModalProps {
  match: Match | null
  onClose: () => void
  onSendMessage?: () => void
}

const MatchModal = ({ match, onClose, onSendMessage }: MatchModalProps) => {
  const router = useRouter()

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleSendMessage = () => {
    if (!match) return
    
    if (onSendMessage) {
      onSendMessage()
    } else {
      // Navigate to chat
      router.push(`/chat/${match.id}`)
    }
    onClose()
  }

  if (!match) return null

  const matchedProfile = match.user1_profile || match.user2_profile
  const matchedName = matchedProfile?.full_name || matchedProfile?.email?.split('@')[0] || 'Someone'

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#F3EDF7' }}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 z-10 p-2 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
        </button>

        {/* Match Photo */}
        <div className="relative w-full h-full flex items-center justify-center">
          {matchedProfile?.photos && matchedProfile.photos.length > 0 ? (
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              src={matchedProfile.photos[0]}
              alt={matchedName}
              className="w-full h-full object-cover"
              style={{ objectPosition: 'center center' }}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
              <span className="text-6xl">👤</span>
            </div>
          )}

          {/* Text Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-8 pb-24">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-center"
            >
              <h2 className="text-4xl font-bold text-white mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
                It&apos;s a match!
              </h2>
              <p className="text-lg text-white mb-8 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {matchedName} likes you back — send them one of our quick intros to get the conversation started
              </p>

              {/* Send Message Button */}
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
                onClick={handleSendMessage}
                className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-semibold text-lg shadow-xl hover:bg-gray-50 transition-all transform hover:scale-105 active:scale-95"
              >
                Send A Quick &apos;Hello&apos;
              </motion.button>
            </motion.div>
          </div>
        </div>
      </div>
    </AnimatePresence>
  )
}

export default MatchModal
