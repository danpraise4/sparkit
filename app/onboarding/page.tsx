'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { supabase } from '@/src/lib/supabase'
import { Upload, X } from 'lucide-react'

const INTERESTS = [
  'Travel', 'Music', 'Sports', 'Reading', 'Cooking', 'Photography',
  'Art', 'Movies', 'Gaming', 'Fitness', 'Dancing', 'Hiking',
  'Technology', 'Fashion', 'Food', 'Yoga', 'Writing', 'Animals'
]

interface OnboardingFormData {
  age: string
  gender: string
  location?: string
  minAge?: string
  maxAge?: string
  bio?: string
  interests?: string[]
}

export default function Onboarding() {
  const { user, updateProfile, loading, refreshProfile, profile, isProfileComplete } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [photos, setPhotos] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<OnboardingFormData>()
  const selectedInterests = (watch('interests') || []) as string[]

  // No automatic redirect - users can access onboarding anytime from their profile

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (photos.length >= 6) {
      toast.error('Maximum 6 photos allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setPhotos([...photos, publicUrl])
      toast.success('Photo uploaded!')
    } catch (error) {
      toast.error('Failed to upload photo')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
  }

  const toggleInterest = (interest: string) => {
    const current = selectedInterests
    if (current.includes(interest)) {
      setValue('interests', current.filter(i => i !== interest))
    } else {
      if (current.length < 10) {
        setValue('interests', [...current, interest])
      } else {
        toast.error('Maximum 10 interests allowed')
      }
    }
  }

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      // Get location if provided
      const latitude: number | undefined = undefined
      const longitude: number | undefined = undefined
      if (data.location) {
        // In production, use a geocoding service
        // For now, we'll just store the location text
      }

      const profileData = {
        id: user.id,
        email: user.email,
        age: parseInt(data.age),
        gender: data.gender,
        location: data.location || undefined,
        latitude,
        longitude,
        bio: data.bio || undefined,
        interests: selectedInterests,
        photos: photos,
        onboarding_complete: true
      }

      // Check if profile exists, then insert or update
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      // If checkError is PGRST116, profile doesn't exist (that's okay)
      const profileExists = existingProfile && !checkError

      let error
      if (profileExists) {
        // Update existing profile
        console.log('Updating existing profile')
        const result = await updateProfile(profileData)
        error = result.error
        if (error) {
          console.error('Update profile error:', error)
        }
      } else {
        // Insert new profile
        console.log('Inserting new profile')
        const { error: insertError, data: insertedData } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single()
        
        if (insertError) {
          console.error('Insert profile error:', insertError)
          error = insertError
        } else {
          console.log('Profile inserted successfully:', insertedData)
        }
      }

      if (error) {
        console.error('Profile operation error:', error)
        throw error
      }

      // Refresh profile in context
      await refreshProfile()

      // Create age preferences
      const { error: prefError } = await supabase
        .from('age_preferences')
        .upsert({
          user_id: user.id,
          min_age: parseInt(data.minAge || '18') || 18,
          max_age: parseInt(data.maxAge || '100') || 100
        }, {
          onConflict: 'user_id'
        })

      if (prefError) {
        console.error('Error creating age preferences:', prefError)
        // Don't throw - this is not critical
      }

      toast.success('Profile created successfully!')
      
      // Refresh profile in context
      if (refreshProfile) {
        await refreshProfile()
      }
      
      // Small delay to ensure state updates
      setTimeout(() => {
        router.push('/discover')
      }, 100)
    } catch (error) {
      console.error('Failed to create profile:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to create profile: ${errorMessage}`)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 py-6 sm:py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Create Your Profile</h1>
              <span className="text-xs sm:text-sm text-gray-500">Step {step} of 3</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age *
                  </label>
                  <input
                    type="number"
                    {...register('age', {
                      required: 'Age is required',
                      min: { value: 18, message: 'Must be 18 or older' },
                      max: { value: 100, message: 'Invalid age' }
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="25"
                  />
                  {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender *
                  </label>
                  <select
                    {...register('gender', { required: 'Gender is required' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    {...register('location')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="City, State"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Min Age Preference
                    </label>
                    <input
                      type="number"
                      {...register('minAge', { min: 18, max: 100 })}
                      defaultValue={18}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                      Max Age Preference
                    </label>
                    <input
                      type="number"
                      {...register('maxAge', { min: 18, max: 100 })}
                      defaultValue={100}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio (max 500 characters)
                  </label>
                  <textarea
                    {...register('bio', {
                      maxLength: {
                        value: 500,
                        message: 'Bio must be 500 characters or less'
                      }
                    })}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Tell us about yourself..."
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600">{errors.bio.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interests (select up to 10)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {INTERESTS.map((interest) => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          selectedInterests.includes(interest)
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {selectedInterests.length} / 10 selected
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Photos (up to 6)
                  </label>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                        <img
                          src={photo}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 6 && (
                      <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary-500 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                          disabled={uploading}
                        />
                        {uploading ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                        ) : (
                          <Upload className="w-8 h-8 text-gray-400" />
                        )}
                      </label>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Add at least one photo to get started
                  </p>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={photos.length === 0}
                    className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete Profile
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
