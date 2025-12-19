'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'

const availableInterests = [
  'Travel', 'Music', 'Sports', 'Reading', 'Cooking', 'Photography',
  'Art', 'Movies', 'Gaming', 'Fitness', 'Dancing', 'Hiking',
  'Technology', 'Fashion', 'Food', 'Yoga', 'Writing', 'Animals',
  'Nature', 'Comedy', 'Pets', 'Beach', 'Mountains', 'Camping',
  'Cycling', 'Running', 'Swimming', 'Tennis', 'Basketball', 'Soccer',
  'Rock Climbing', 'Surfing', 'Skiing', 'Snowboarding', 'Skateboarding',
  'Painting', 'Drawing', 'Sculpting', 'Pottery', 'Knitting',
  'Gardening', 'Meditation', 'Therapy', 'Self-care', 'Wellness',
  'Coffee', 'Wine', 'Cocktails', 'Beer', 'Tea',
  'Vegan', 'Vegetarian', 'Keto', 'Paleo', 'Gluten-free',
  'Netflix', 'Podcasts', 'Audiobooks', 'Comics', 'Manga',
  'Anime', 'K-pop', 'J-pop', 'Hip-hop', 'Jazz',
  'Classical', 'Electronic', 'Rock', 'Pop', 'Country',
  'Concerts', 'Festivals', 'Theater', 'Opera', 'Ballet',
  'Museums', 'Galleries', 'Exhibitions', 'Workshops', 'Classes',
]

export default function Interests() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile?.interests || []
  )
  const [saving, setSaving] = useState(false)

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest))
    } else {
      if (selectedInterests.length < 10) {
        setSelectedInterests([...selectedInterests, interest])
      } else {
        toast.error('Maximum 10 interests allowed')
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await updateProfile({ interests: selectedInterests })
      if (error) throw error
      toast.success('Interests updated successfully!')
      router.back()
    } catch (error) {
      console.error('Error updating interests:', error)
      toast.error('Failed to update interests')
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
          <h1 className="text-lg font-semibold flex-1 text-gray-900">Interests</h1>
        </div>

        <div className="max-w-md mx-auto px-4 py-6">
          <p className="text-sm text-gray-600 mb-4 text-center">
            Select up to 10 interests ({selectedInterests.length}/10)
          </p>

          <div className="flex flex-wrap gap-2 mb-6">
            {availableInterests.map((interest) => {
              const isSelected = selectedInterests.includes(interest)
              return (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-primary-300'
                  }`}
                >
                  {interest}
                </button>
              )
            })}
          </div>

          <button
            onClick={handleSave}
            disabled={saving || selectedInterests.length === 0}
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Interests'}
          </button>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

