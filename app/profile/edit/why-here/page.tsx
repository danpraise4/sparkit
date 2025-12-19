'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { X, Coffee, MessageCircle, Heart } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import { motion, AnimatePresence } from 'framer-motion'

interface WhyHereOption {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  value: string
}

const whyHereOptions: WhyHereOption[] = [
  {
    id: 'date',
    title: 'Here to date',
    description: "I want to go on dates and have a good time. No labels.",
    icon: <Coffee className="w-6 h-6 text-gray-900" />,
    value: 'Here to date'
  },
  {
    id: 'chat',
    title: 'Open to chat',
    description: "I'm here to chat and see where it goes. No pressure.",
    icon: <MessageCircle className="w-6 h-6 text-gray-900" />,
    value: 'Open to chat'
  },
  {
    id: 'relationship',
    title: 'Ready for a relationship',
    description: "I'm looking for something that lasts. No games.",
    icon: <Heart className="w-6 h-6 text-gray-900" />,
    value: 'Ready for a relationship'
  }
]

export default function WhyHere() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const [selected, setSelected] = useState<string>(
    (profile?.why_here as string) || 'Ready for a relationship'
  )
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(true)

  useEffect(() => {
    if (profile?.why_here) {
      setSelected(profile.why_here as string)
    }
  }, [profile])

  const handleSave = async () => {
    setSaving(true)
    try {
      console.log('Saving why_here:', selected)
      const { data, error } = await updateProfile({ why_here: selected })
      if (error) throw error
      console.log('Profile updated successfully:', data)
      toast.success('Updated successfully!')
      setShowModal(false)
      // Small delay to ensure state updates
      setTimeout(() => {
        router.back()
      }, 100)
    } catch (error) {
      console.error('Error updating why here:', error)
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    setShowModal(false)
    router.back()
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header - Hidden when modal is open */}
        {!showModal && (
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center sticky top-0 z-50 shadow-sm">
            <button onClick={() => router.back()} className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-900" />
            </button>
            <h1 className="text-lg font-semibold flex-1 text-gray-900">Why you&apos;re here</h1>
          </div>
        )}

        {/* Modal Overlay */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-50">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-900" />
                  </button>
                  <h2 className="text-lg font-bold text-gray-900">Tell people why you&apos;re here</h2>
                  <div className="w-9"></div> {/* Spacer for centering */}
                </div>

                <div className="p-6">
                  {/* Instructions */}
                  <p className="text-sm text-gray-600 mb-6">
                    We&apos;ll share this on your profile. You can change it whenever you want.
                  </p>

                  {/* Options */}
                  <div className="space-y-3 mb-6">
                    {whyHereOptions.map((option) => {
                      const isSelected = selected === option.value
                      return (
                        <button
                          key={option.id}
                          onClick={() => setSelected(option.value)}
                          className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-gray-900 bg-gray-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          {/* Icon */}
                          <div className="flex-shrink-0 text-gray-900">
                            {option.icon}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold mb-1 ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}>
                              {option.title}
                            </h3>
                            <p className={`text-sm ${isSelected ? 'text-gray-700' : 'text-gray-600'}`}>
                              {option.description}
                            </p>
                          </div>

                          {/* Radio Button */}
                          <div className="flex-shrink-0">
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                isSelected
                                  ? 'border-gray-900 bg-gray-900'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && (
                                <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Add To Profile'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
