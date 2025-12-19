'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'

export default function InvisibleMode() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const [invisibleMode, setInvisibleMode] = useState(profile?.invisible_mode === true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setInvisibleMode(profile.invisible_mode === true)
    }
  }, [profile])

  const handleToggle = async () => {
    const newValue = !invisibleMode
    setInvisibleMode(newValue)
    setSaving(true)

    try {
      const { error } = await updateProfile({ invisible_mode: newValue })
      if (error) throw error
      toast.success(newValue ? 'Invisible mode enabled' : 'Invisible mode disabled')
    } catch (error) {
      console.error('Error updating invisible mode:', error)
      toast.error('Failed to update invisible mode')
      setInvisibleMode(!newValue) // Revert on error
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50 pb-20">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center sticky top-0 z-50">
          <button onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-lg font-semibold flex-1 text-gray-900">Invisible mode</h1>
        </div>

        <div className="max-w-md mx-auto bg-white">
          {/* Main Toggle */}
          <div className="px-4 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🚗</span>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Turn on invisible mode</h2>
                  <p className="text-sm text-gray-600">Go invisible to browse privately</p>
                </div>
              </div>
              <button
                onClick={handleToggle}
                disabled={saving}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  invisibleMode ? 'bg-primary-600' : 'bg-gray-300'
                } disabled:opacity-50`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    invisibleMode ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Information Section */}
          <div className="px-4 py-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What is invisible mode?</h3>
              <p className="text-sm text-gray-600">
                When invisible mode is turned on, you can browse profiles without others knowing you&apos;ve visited them. 
                Your profile visits will be hidden from other users.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What you can do:</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>Browse profiles without being seen</li>
                <li>View matches without showing as online</li>
                <li>Check out profiles privately</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What others will see:</h3>
              <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                <li>You won&apos;t appear in their &quot;Who viewed me&quot; list</li>
                <li>Your online status may be hidden (depending on settings)</li>
                <li>You can still match and message normally</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Note:</span> Invisible mode is a premium feature. 
                Some features may require a Spark Premium subscription.
              </p>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

