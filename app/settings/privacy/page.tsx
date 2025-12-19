'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'

interface PrivacySettings {
  enablePasskey: boolean
  showLocation: boolean
  showOnlineStatus: boolean
  showOnlyToLiked: boolean
}

export default function Privacy() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<PrivacySettings>({
    enablePasskey: profile?.enable_passkey === true,
    showLocation: profile?.show_location === true,
    showOnlineStatus: profile?.show_online_status === true,
    showOnlyToLiked: profile?.show_only_to_liked === true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile) {
      setSettings({
        enablePasskey: profile.enable_passkey === true,
        showLocation: profile.show_location === true,
        showOnlineStatus: profile.show_online_status === true,
        showOnlyToLiked: profile.show_only_to_liked === true,
      })
    }
  }, [profile])

  const toggleSetting = async (key: keyof PrivacySettings) => {
    const newValue = !settings[key]
    const newSettings = { ...settings, [key]: newValue }
    setSettings(newSettings)
    setSaving(true)

    try {
      const updateData: Record<string, boolean> = {}
      if (key === 'enablePasskey') updateData.enable_passkey = newValue
      if (key === 'showLocation') updateData.show_location = newValue
      if (key === 'showOnlineStatus') updateData.show_online_status = newValue
      if (key === 'showOnlyToLiked') updateData.show_only_to_liked = newValue

      const { error } = await updateProfile(updateData)
      if (error) throw error
      toast.success('Privacy settings updated')
    } catch (error) {
      console.error('Error updating privacy settings:', error)
      toast.error('Failed to update privacy settings')
      setSettings(settings) // Revert on error
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
          <h1 className="text-lg font-semibold flex-1 text-gray-900">Privacy</h1>
        </div>

        <div className="max-w-md mx-auto bg-white">
        {/* Privacy Options */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-medium">Enable passkey</span>
              <button
                onClick={() => toggleSetting('enablePasskey')}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.enablePasskey ? 'bg-primary-600' : 'bg-gray-300'
                } disabled:opacity-50`}
              >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.enablePasskey ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-medium">Show location</span>
              <button
                onClick={() => toggleSetting('showLocation')}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.showLocation ? 'bg-primary-600' : 'bg-gray-300'
                } disabled:opacity-50`}
              >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.showLocation ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-medium">Show online status</span>
              <button
                onClick={() => toggleSetting('showOnlineStatus')}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.showOnlineStatus ? 'bg-primary-600' : 'bg-gray-300'
                } disabled:opacity-50`}
              >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.showOnlineStatus ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-900 font-medium">Show me only to people I like and visit</span>
              <button
                onClick={() => toggleSetting('showOnlyToLiked')}
                disabled={saving}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.showOnlyToLiked ? 'bg-primary-600' : 'bg-gray-300'
                } disabled:opacity-50`}
              >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.showOnlyToLiked ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Policy Information */}
        <div className="px-4 py-6 text-center text-sm text-gray-600">
          <p className="mb-2 font-semibold text-gray-900">Using Spark</p>
          <p className="mb-2">
            We will never share your private contact info. For more details, read our{' '}
            <a href="#" className="text-primary-600 underline">Privacy Policy</a>.
          </p>
          <p>
            Our <a href="#" className="text-primary-600 underline">Terms and Conditions</a> apply every time you use Spark. 
            You can find the main points in our{' '}
            <a href="#" className="text-primary-600 underline">Terms and Conditions summary</a>.
          </p>
        </div>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
