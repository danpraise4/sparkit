'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { useForm } from 'react-hook-form'
import { ArrowLeft, Lock, ChevronRight, X } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'

interface FormData {
  full_name: string
  location: string
}

export default function BasicInfo() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    defaultValues: {
      full_name: profile?.full_name || '',
      location: profile?.location || '',
    }
  })
  const [location, setLocation] = useState(profile?.location || '')

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await updateProfile({
        full_name: data.full_name,
        location: data.location
      })

      if (error) throw error

      toast.success('Profile updated successfully!')
      router.push('/settings')
    } catch (error) {
      toast.error('Failed to update profile')
      console.error(error)
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
          <h1 className="text-lg font-semibold flex-1 text-gray-900">Basic info</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md mx-auto bg-white">
        {/* Name */}
        <div className="px-4 py-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input
            type="text"
            {...register('full_name', { required: 'Name is required' })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter your name"
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name.message}</p>
          )}
        </div>

        {/* Birthday */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Birthday</label>
              <p className="text-sm text-gray-500">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { 
                  month: '2-digit', 
                  day: '2-digit', 
                  year: 'numeric' 
                }) : 'Not set'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="mt-2 flex items-start gap-2 text-xs text-gray-500">
            <span className="text-blue-500">ⓘ</span>
            <span>Want to update your date of birth? Contact us to verify your age.</span>
          </div>
        </div>

        {/* Gender */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <p className="text-sm text-gray-500 capitalize">{profile?.gender || 'Not set'}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        {/* Location */}
        <div className="px-4 py-4 border-b border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
          <div className="relative">
            <input
              type="text"
              {...register('location')}
              value={location}
              onChange={(e) => {
                setLocation(e.target.value)
                setValue('location', e.target.value)
              }}
              className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Current Location (City, Country)"
            />
            {location && (
              <button
                type="button"
                onClick={() => {
                  setLocation('')
                  setValue('location', '')
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="px-4 py-6">
          <button
            type="submit"
            className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
          >
            Save
          </button>
        </div>
        </form>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
