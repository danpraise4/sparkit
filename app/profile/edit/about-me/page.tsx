'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'

export default function AboutMe() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const [bio, setBio] = useState(profile?.bio || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await updateProfile({ bio })
      if (error) throw error
      toast.success('Bio updated successfully!')
      router.back()
    } catch (error) {
      console.error('Error updating bio:', error)
      toast.error('Failed to update bio')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50 pb-20">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center sticky top-0 z-50">
          <button onClick={() => router.back()} className="p-2">
            <X className="w-5 h-5 text-gray-900" />
          </button>
        </div>

        <div className="max-w-md mx-auto px-4 py-8">
          {/* Illustration Placeholder */}
          <div className="flex justify-center mb-8">
            <div className="w-48 h-48 bg-gradient-to-br from-purple-200 to-pink-200 rounded-2xl flex items-center justify-center">
              <span className="text-6xl">📝</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Write a bio to introduce yourself
          </h1>

          {/* Label */}
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Enter a bio
          </label>

          {/* Text Area */}
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={8}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
            placeholder="Tell people about yourself..."
          />

          {/* Character Counter */}
          <div className="flex justify-end mt-2">
            <span className="text-sm text-gray-500">
              {bio.length}/500
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={() => router.back()}
              className="w-12 h-12 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-900" />
            </button>

            {/* Progress Indicator */}
            <div className="flex-1 max-w-xs">
              <div className="h-1 bg-gray-200 rounded-full">
                <div className="h-1 bg-gray-900 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving || bio.length === 0}
              className="w-12 h-12 rounded-full bg-gray-900 border-2 border-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

