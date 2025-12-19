'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { ArrowLeft, ChevronRight, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'

export default function ProfileEdit() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const [photos, setPhotos] = useState<string[]>(profile?.photos || [])
  const [uploading, setUploading] = useState(false)

  const profileCompletion = Math.min(100, 
    (photos.length > 0 ? 15 : 0) +
    (profile?.bio ? 10 : 0) +
    ((profile?.interests?.length ?? 0) > 0 ? 10 : 0) +
    (profile?.age ? 8 : 0) +
    (profile?.gender ? 8 : 0) +
    (profile?.location ? 8 : 0) +
    (profile?.verification_badge ? 5 : 0) +
    // More About You fields (3 points each, max 30 points)
    (profile?.relationship_status ? 3 : 0) +
    (profile?.sexuality ? 3 : 0) +
    (profile?.kids ? 3 : 0) +
    (profile?.smoking ? 3 : 0) +
    (profile?.drinking ? 3 : 0) +
    (profile?.star_sign ? 3 : 0) +
    (profile?.pets ? 3 : 0) +
    (profile?.religion ? 3 : 0) +
    (profile?.personality ? 3 : 0) +
    (profile?.education ? 3 : 0) +
    (profile?.work ? 3 : 0) +
    (profile?.height ? 3 : 0) +
    ((profile?.languages && Array.isArray(profile.languages) && profile.languages.length > 0) ? 3 : 0) +
    (profile?.why_here ? 3 : 0) +
    10 // Base completion
  )

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (photos.length + files.length > 6) {
      toast.error('Maximum 6 photos allowed')
      return
    }

    if (!profile?.id) return

    setUploading(true)
    try {
      const uploadPromises = files.map(async (file) => {
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is larger than 5MB`)
        }

        const fileExt = file.name.split('.').pop()
        const fileName = `${profile.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${profile.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        return publicUrl
      })

      const newPhotos = await Promise.all(uploadPromises)
      const updatedPhotos = [...photos, ...newPhotos]
      setPhotos(updatedPhotos)
      
      // Save photos to profile
      const { error: updateError } = await updateProfile({ photos: updatedPhotos })
      if (updateError) {
        console.error('Error saving photos:', updateError)
        toast.error('Photos uploaded but failed to save')
      } else {
        toast.success('Photos uploaded and saved!')
      }
    } catch (error) {
      toast.error('Failed to upload photos')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100 pb-20">
        {/* Header */}
        <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-50 border-b border-gray-200">
          <button onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <span className="text-sm font-medium text-gray-900">{profileCompletion}% complete</span>
          <button onClick={() => router.push('/profile')} className="text-sm font-medium text-gray-900">
            Preview
          </button>
        </div>

        <div className="max-w-md mx-auto">
          {/* Photo Grid Section */}
          <div className="px-3 sm:px-4 py-3 sm:py-4 bg-white border-b border-gray-200">
            {/* Photo Grid */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
              {/* Main Photo (larger, top-left) */}
              {photos.length > 0 ? (
                <div className="relative col-span-2 row-span-2 aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photos[0]}
                    alt="Main photo"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <button
                    onClick={async () => {
                      const newPhotos = photos.slice(1)
                      setPhotos(newPhotos)
                      const { error } = await updateProfile({ photos: newPhotos })
                      if (error) {
                        toast.error('Failed to delete photo')
                        setPhotos(photos)
                      }
                    }}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => document.getElementById('photo-upload')?.click()}
                  disabled={uploading}
                  className="col-span-2 row-span-2 aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-50"
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                    <span className="text-2xl text-gray-400">+</span>
                  </div>
                </button>
              )}

              {/* Remaining Photo Slots */}
              {Array.from({ length: 5 }).map((_, index) => {
                const photoIndex = index + 1
                const hasPhoto = photos.length > photoIndex
                
                return (
                  <div key={index} className="relative aspect-square">
                    {hasPhoto ? (
                      <div className="relative w-full h-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photos[photoIndex]}
                          alt={`Photo ${photoIndex + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <button
                          onClick={async () => {
                            const newPhotos = photos.filter((_, i) => i !== photoIndex)
                            setPhotos(newPhotos)
                            const { error } = await updateProfile({ photos: newPhotos })
                            if (error) {
                              toast.error('Failed to delete photo')
                              setPhotos(photos)
                            }
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors z-10"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => document.getElementById('photo-upload')?.click()}
                        disabled={uploading || photos.length >= 6}
                        className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-50"
                      >
                        <span className="text-2xl text-gray-400">+</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Upload Button */}
            <button
              onClick={() => document.getElementById('photo-upload')?.click()}
              disabled={uploading || photos.length >= 6}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Add Photos Or Videos
            </button>
            
            <input
              id="photo-upload"
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={uploading}
            />
            
            {photos.length > 0 && (
              <p className="text-xs text-gray-500 mt-2 text-center">ⓘ Hold & drag to reorder</p>
            )}
          </div>

          {/* Profile Sections */}
          <div className="space-y-2 mt-2">
            {/* Name, Age, Gender, Location */}
            <div className="bg-white px-4 py-4 border-b border-gray-200">
              <button
                onClick={() => router.push('/settings/basic-info')}
                className="w-full flex items-center justify-between"
              >
                <div className="text-left">
                  <p className="font-semibold text-gray-900">
                    {profile?.full_name || profile?.email?.split('@')[0] || 'User'}, {profile?.age}
                  </p>
                  <p className="text-sm text-gray-600 capitalize">
                    {profile?.gender || 'Not set'}, {profile?.location || 'Not set'}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Work and education */}
            <div className="bg-white px-4 py-4 border-b border-gray-200">
              <p className="font-semibold text-gray-900 mb-3">Work and education</p>
              <button
                onClick={() => router.push('/profile/edit/work')}
                className="w-full flex items-center justify-between mb-3"
              >
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">Work</p>
                  <p className="text-sm text-gray-600">{typeof profile?.work === 'string' ? profile.work : 'Not set'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={() => router.push('/profile/edit/education')}
                className="w-full flex items-center justify-between"
              >
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-gray-700 mb-1">Education</p>
                  <p className="text-sm text-gray-600">{typeof profile?.education === 'string' ? profile.education : 'Not set'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Why you're here */}
            <div className="bg-white px-4 py-4 border-b border-gray-200">
              <button
                onClick={() => router.push('/profile/edit/why-here')}
                className="w-full flex items-center justify-between"
              >
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-900 mb-1">Why you&apos;re here</p>
                  <p className="text-sm text-gray-600">{typeof profile?.why_here === 'string' ? profile.why_here : 'Ready for a relationship'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* About me */}
            <div className="bg-white px-4 py-4 border-b border-gray-200">
              <button
                onClick={() => router.push('/profile/edit/about-me')}
                className="w-full flex items-center justify-between"
              >
                <div className="text-left flex-1">
                  <p className="font-semibold text-gray-900 mb-1">About me</p>
                  {profile?.bio ? (
                    <p className="text-sm text-gray-600 line-clamp-2">{profile.bio}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      Whether you&apos;re shy or bold, old-school or edgy, owning it is what&apos;s really attractive
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* More about you */}
            <div className="bg-white px-4 py-4 border-b border-gray-200">
              <p className="font-semibold text-gray-900 mb-3">More about you</p>
              <div className="space-y-3">
                {[
                  { icon: '❤️', label: 'Relationship', key: 'relationship_status', value: profile?.relationship_status, route: '/profile/edit/relationship-status' },
                  { icon: '⚥', label: 'Sexuality', key: 'sexuality', value: profile?.sexuality, route: '/profile/edit/sexuality' },
                  { icon: '👶', label: 'Kids', key: 'kids', value: profile?.kids, route: '/profile/edit/kids' },
                  { icon: '🚬', label: 'Smoking', key: 'smoking', value: profile?.smoking, route: '/profile/edit/smoking' },
                  { icon: '🍷', label: 'Drinking', key: 'drinking', value: profile?.drinking, route: '/profile/edit/drinking' },
                  { icon: '💬', label: 'You speak', key: 'languages', value: Array.isArray(profile?.languages) ? profile.languages.join(', ') : (typeof profile?.languages === 'string' ? profile.languages : null), route: '/profile/edit/languages' },
                  { icon: '📏', label: 'Height', key: 'height', value: profile?.height ? `${profile.height} cm` : null, route: '/profile/edit/height' },
                  { icon: '⭐', label: 'Star sign', key: 'star_sign', value: profile?.star_sign, route: '/profile/edit/star-sign' },
                  { icon: '🐾', label: 'Pets', key: 'pets', value: profile?.pets, route: '/profile/edit/pets' },
                  { icon: '✝️', label: 'Religion', key: 'religion', value: profile?.religion, route: '/profile/edit/religion' },
                  { icon: '🧠', label: 'Personality', key: 'personality', value: profile?.personality, route: '/profile/edit/personality' },
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => router.push(item.route)}
                    className="w-full flex items-center justify-between py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm font-medium text-gray-900">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value ? (
                        <span className="text-sm text-gray-500">{item.value}</span>
                      ) : (
                        <span className="text-sm text-gray-400">Not set</span>
                      )}
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Profile questions */}
            <div className="bg-white px-4 py-4 border-b border-gray-200">
              <button
                onClick={() => router.push('/profile/edit/questions')}
                className="w-full text-left"
              >
                <p className="font-semibold text-gray-900 mb-3">Profile questions</p>
                <div className="w-full flex items-center justify-between py-2">
                  <div className="text-left flex-1">
                    <p className="text-sm text-gray-900">What are you looking for?</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {(profile?.profile_questions as { looking_for?: string })?.looking_for || 'Not answered'}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
              <button
                onClick={() => router.push('/profile/edit/questions')}
                className="w-full mt-4 bg-gray-900 text-white py-3 rounded-lg font-semibold"
              >
                {Object.keys(profile?.profile_questions || {}).length} down, {3 - Object.keys(profile?.profile_questions || {}).length} to go
              </button>
            </div>

            {/* Interests */}
            <div className="bg-white px-4 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-semibold text-gray-900">Interests</p>
                <button
                  onClick={() => router.push('/profile/edit/interests')}
                  className="text-sm font-medium text-primary-600"
                >
                  Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile?.interests && profile.interests.length > 0 ? (
                  <>
                    {profile.interests.slice(0, 6).map((interest, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-full"
                      >
                        <span className="text-sm font-medium text-gray-700">{interest}</span>
                      </div>
                    ))}
                    {profile.interests.length > 6 && (
                      <button className="text-sm font-medium text-gray-600 hover:text-gray-900">
                        Show all
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-400">No interests added yet</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}


