'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { X } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import { motion, AnimatePresence } from 'framer-motion'

export default function Height() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const [height, setHeight] = useState<number>(
    (profile?.height as number) || 0
  )
  const [unit, setUnit] = useState<'cm' | 'ft'>('cm')
  const [showRatherNotSay, setShowRatherNotSay] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(true)

  useEffect(() => {
    if (profile?.height) {
      setHeight(profile.height as number)
    }
  }, [profile])

  const handleSave = async () => {
    if (showRatherNotSay) {
      setSaving(true)
      try {
        const { error } = await updateProfile({ height: undefined })
        if (error) throw error
        toast.success('Updated successfully!')
        setShowModal(false)
        router.back()
      } catch (error) {
        console.error('Error updating height:', error)
        toast.error('Failed to update')
      } finally {
        setSaving(false)
      }
      return
    }

    if (!height || height <= 0) {
      toast.error('Please enter a valid height')
      return
    }

    setSaving(true)
    try {
      const heightInCm = unit === 'ft' ? Math.round(height * 30.48) : height
      const { error } = await updateProfile({ height: heightInCm })
      if (error) throw error
      toast.success('Updated successfully!')
      setShowModal(false)
      router.back()
    } catch (error) {
      console.error('Error updating height:', error)
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
                  <h2 className="text-lg font-bold text-gray-900">How tall are you?</h2>
                  <div className="w-9"></div>
                </div>

                <div className="p-6">
                  {/* Illustration Placeholder */}
                  <div className="flex justify-center mb-6">
                    <div className="w-32 h-32 bg-gradient-to-br from-purple-200 via-pink-200 to-yellow-200 rounded-2xl flex items-center justify-center">
                      <span className="text-6xl">🏠</span>
                    </div>
                  </div>

                  {/* Height Input */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="number"
                        value={height || ''}
                        onChange={(e) => setHeight(parseInt(e.target.value) || 0)}
                        placeholder="-"
                        disabled={showRatherNotSay}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 text-lg font-semibold"
                      />
                      <button
                        onClick={() => setUnit(unit === 'cm' ? 'ft' : 'cm')}
                        className="px-4 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        {unit}
                      </button>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-gray-900 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>

                  {/* Rather Not Say Option */}
                  <button
                    onClick={() => {
                      setShowRatherNotSay(!showRatherNotSay)
                      if (!showRatherNotSay) {
                        setHeight(0)
                      }
                    }}
                    className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 transition-all mb-6 ${
                      showRatherNotSay
                        ? 'border-gray-900 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-medium text-gray-900">I&apos;d rather not say</span>
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                        showRatherNotSay
                          ? 'border-gray-900 bg-gray-900'
                          : 'border-gray-300'
                      }`}
                    >
                      {showRatherNotSay && (
                        <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                      )}
                    </div>
                  </button>

                  {/* Save Button */}
                  <button
                    onClick={handleSave}
                    disabled={saving || (!showRatherNotSay && (!height || height <= 0))}
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

