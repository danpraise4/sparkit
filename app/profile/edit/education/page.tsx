'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import { motion, AnimatePresence } from 'framer-motion'

const options = [
  'High school',
  'Graduate degree or higher',
  'In grad school',
  'In college',
  'Undergraduate degree',
  "I'd rather not say"
]

export default function Education() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const [selected, setSelected] = useState<string>(
    (profile?.education as string) || ''
  )
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(true)

  useEffect(() => {
    if (profile?.education) {
      setSelected(profile.education as string)
    }
  }, [profile])

  const handleSave = async () => {
    if (!selected) {
      toast.error('Please select an option')
      return
    }
    setSaving(true)
    try {
      const { error } = await updateProfile({ education: selected })
      if (error) throw error
      toast.success('Updated successfully!')
      setShowModal(false)
      router.back()
    } catch (error) {
      console.error('Error updating education:', error)
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
                  <h2 className="text-lg font-bold text-gray-900">What level of education do you have?</h2>
                  <div className="w-9"></div>
                </div>

                <div className="p-6">
                  {/* Illustration Placeholder */}
                  <div className="flex justify-center mb-6">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-200 via-pink-200 to-yellow-200 rounded-2xl flex items-center justify-center">
                      <span className="text-6xl">🎓</span>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-3 mb-6">
                    {options.map((option) => {
                      const isSelected = selected === option
                      return (
                        <button
                          key={option}
                          onClick={() => setSelected(option)}
                          className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-gray-900 bg-purple-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-900'}`}>
                            {option}
                          </span>
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
                        </button>
                      )
                    })}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSave}
                    disabled={saving || !selected}
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

