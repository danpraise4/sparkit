'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import AdminLayout from '@/src/components/AdminLayout'
import toast from 'react-hot-toast'
import { Upload, Camera } from 'lucide-react'

export default function AdminProfile() {
  const { user, profile, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    birthDay: '06',
    birthMonth: 'June',
    birthYear: '1997',
    datingGoal: 'Relations',
    ageFrom: '30',
    ageTo: '55',
    aboutMe: '',
  })
  const [photos, setPhotos] = useState<string[]>([])

  useEffect(() => {
    if (profile) {
      setFormData({
        email: profile.email || '',
        name: profile.full_name || '',
        birthDay: '06',
        birthMonth: 'June',
        birthYear: '1997',
        datingGoal: profile.why_here || 'Relations',
        ageFrom: '30',
        ageTo: '55',
        aboutMe: profile.bio || '',
      })
      setPhotos(profile.photos || [])
    }
  }, [profile])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setLoading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `profiles/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('profiles').getPublicUrl(filePath)

      setPhotos((prev) => [...prev, data.publicUrl])
      await updateProfile({ photos: [...photos, data.publicUrl] })

      toast.success('Photo uploaded successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setLoading(true)
      const updates: any = {
        full_name: formData.name,
        email: formData.email,
        bio: formData.aboutMe,
        why_here: formData.datingGoal,
        photos,
      }

      await updateProfile(updates)
      toast.success('Profile updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const days = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
  const years = Array.from({ length: 100 }, (_, i) => String(2024 - i))
  const ageOptions = Array.from({ length: 50 }, (_, i) => String(18 + i))

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Complete your profile</h1>

        <div className="space-y-6">
          {/* Photo Upload */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload photo
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
                disabled={loading}
              />
              <label
                htmlFor="photo-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <Camera className="w-8 h-8 text-gray-400" />
                <span className="text-gray-600">Upload photo</span>
              </label>
            </div>
            <p className="text-xs text-red-600 mt-2">
              Uploaded photos must be yours; we review each image manually
            </p>
            {photos.length > 0 && (
              <div className="mt-4 flex gap-2 overflow-x-auto">
                {photos.map((photo, index) => (
                  <img
                    key={index}
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                ))}
                {photos.length > 4 && (
                  <div className="flex items-center text-gray-500">
                    <span>→</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Email */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              E-mail
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Name */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date of Birth */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of birth
            </label>
            <div className="flex gap-2">
              <select
                value={formData.birthDay}
                onChange={(e) => setFormData({ ...formData, birthDay: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <select
                value={formData.birthMonth}
                onChange={(e) => setFormData({ ...formData, birthMonth: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {months.map((month) => (
                  <option key={month} value={month}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={formData.birthYear}
                onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dating Goal */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              My dating goal is
            </label>
            <select
              value={formData.datingGoal}
              onChange={(e) => setFormData({ ...formData, datingGoal: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Relations">Relations</option>
              <option value="Here to date">Here to date</option>
              <option value="Open to chat">Open to chat</option>
            </select>
          </div>

          {/* Ideal Person's Age */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              My ideal person&apos;s age
            </label>
            <div className="flex gap-2">
              <select
                value={formData.ageFrom}
                onChange={(e) => setFormData({ ...formData, ageFrom: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">From</option>
                {ageOptions.map((age) => (
                  <option key={age} value={age}>
                    From {age}
                  </option>
                ))}
              </select>
              <select
                value={formData.ageTo}
                onChange={(e) => setFormData({ ...formData, ageTo: e.target.value })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">To</option>
                {ageOptions.map((age) => (
                  <option key={age} value={age}>
                    To {age}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* About Me */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About me
            </label>
            <textarea
              value={formData.aboutMe}
              onChange={(e) => setFormData({ ...formData, aboutMe: e.target.value })}
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Hi sweetie 👋 I am a music lover. Here Seeking genuine connection with someone who loves adventure, good food, and laughter. Let's explore life together!"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

