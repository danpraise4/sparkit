'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import { motion, AnimatePresence } from 'framer-motion'

const languages = [
  'English', 'German', 'French', 'Spanish', 'Italian', 'Portuguese', 'Russian', 
  'Chinese', 'Afrikaans', 'Indonesian', 'Bosnian', 'Japanese', 'Korean', 
  'Arabic', 'Hindi', 'Turkish', 'Polish', 'Dutch', 'Swedish', 'Norwegian'
]

export default function Languages() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(profile?.languages) ? profile.languages : []
  )
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(true)

  useEffect(() => {
    if (profile?.languages && Array.isArray(profile.languages)) {
      setSelected(profile.languages)
    }
  }, [profile])

  const toggleLanguage = (language: string) => {
    setSelected(prev => 
      prev.includes(language)
        ? prev.filter(l => l !== language)
        : [...prev, language]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await updateProfile({ languages: selected })
      if (error) throw error
      toast.success('Updated successfully!')
      setShowModal(false)
      router.back()
    } catch (error) {
      console.error('Error updating languages:', error)
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
      <div className="min-h-screen bg-purple-50 pb-20">
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: '#F3EDF7' }}>
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
                  <h2 className="text-lg font-bold text-gray-900">Which languages do you speak?</h2>
                  <div className="w-9"></div>
                </div>

                <div className="p-6">
                  {/* Illustration Placeholder */}
                  <div className="flex justify-center mb-6">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-200 via-pink-200 to-yellow-200 rounded-2xl flex items-center justify-center">
                      <span className="text-6xl">🌍</span>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {languages.map((language) => {
                      const isSelected = selected.includes(language)
                      return (
                        <button
                          key={language}
                          onClick={() => toggleLanguage(language)}
                          className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-gray-900 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}>
                            {language}
                          </span>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'border-gray-900 bg-gray-900'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
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

