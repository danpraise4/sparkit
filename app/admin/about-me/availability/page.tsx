'use client'

import { useState } from 'react'
import AdminLayout from '@/src/components/AdminLayout'
import { useAuth } from '@/src/context/AuthContext'
import toast from 'react-hot-toast'

export default function AdminAboutMeAvailability() {
  const { profile, updateProfile } = useAuth()
  const [availability, setAvailability] = useState('Often online, plenty of free time')
  const [lifeMotto, setLifeMotto] = useState('Live and let live')
  const [hobbies, setHobbies] = useState<string[]>(['Travel and adventure', 'Art and culture', 'Sports and fitness', 'Gaming and technology', 'Movies and series'])
  const [occupation, setOccupation] = useState('Freelancer/Self-employed')
  const [saving, setSaving] = useState(false)

  const availabilityOptions = [
    'Rarely available (very busy with work)',
    'Regularly available, balanced schedule',
    'Sometimes available, depends on the day',
    'Occasionally available, no set schedule',
    'Often online, plenty of free time',
  ]

  const mottoOptions = [
    'Enjoy every moment',
    'Live and let live',
    'Hard work conquers all',
    'Family first',
    'Knowledge is power',
    'Other',
  ]

  const hobbyOptions = [
    'Travel and adventure',
    'Art and culture',
    'Sports and fitness',
    'Gaming and technology',
    'Walks and nature',
    'Cooking',
    'Movies and series',
    'Reading',
    'Other',
  ]

  const occupationOptions = [
    'Office/Corporate',
    'Engineering/Technical',
    'Creative/Artistic',
    'Education/Science',
    'Healthcare/Caregiving',
    'Freelancer/Self-employed',
    'Business owner',
    'Service industry',
    'Skilled trade',
    'Government service',
    'Student',
  ]

  const handleHobbyToggle = (hobby: string) => {
    setHobbies((prev) =>
      prev.includes(hobby)
        ? prev.filter((h) => h !== hobby)
        : [...prev, hobby]
    )
  }

  const handleSave = async () => {
    if (!profile) return

    try {
      setSaving(true)
      await updateProfile({
        profile_questions: {
          ...(profile.profile_questions as Record<string, unknown> || {}),
          availability,
          lifeMotto,
          hobbies,
          occupation,
        },
      })

      toast.success('Answers saved successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save answers')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-2 mb-6">
          <h1 className="text-2xl font-bold text-gray-900">About me</h1>
          <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
            NEW
          </span>
        </div>

        <div className="space-y-6">
          {/* Availability */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              How would you describe your availability for communication?
            </h3>
            <div className="space-y-2">
              {availabilityOptions.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    availability === option
                      ? 'bg-purple-100 border-2 border-purple-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="availability"
                    value={option}
                    checked={availability === option}
                    onChange={(e) => setAvailability(e.target.value)}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Life Motto */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What is your life motto?
            </h3>
            <div className="space-y-2">
              {mottoOptions.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    lifeMotto === option
                      ? 'bg-purple-100 border-2 border-purple-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="lifeMotto"
                    value={option}
                    checked={lifeMotto === option}
                    onChange={(e) => setLifeMotto(e.target.value)}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Hobbies */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What are your main hobbies?
            </h3>
            <div className="space-y-2">
              {hobbyOptions.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    hobbies.includes(option)
                      ? 'bg-purple-100 border-2 border-purple-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={hobbies.includes(option)}
                    onChange={() => handleHobbyToggle(option)}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Occupation */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              What is your current occupation?
            </h3>
            <div className="space-y-2">
              {occupationOptions.map((option) => (
                <label
                  key={option}
                  className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    occupation === option
                      ? 'bg-purple-100 border-2 border-purple-500'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="occupation"
                    value={option}
                    checked={occupation === option}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

