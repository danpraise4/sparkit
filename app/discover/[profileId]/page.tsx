'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import toast from 'react-hot-toast'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import BottomNav from '@/src/components/BottomNav'
import type { PreEnteredProfile } from '@/src/types'
import { ArrowLeft, MessageCircle, Circle, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ProfileDetail() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const profileId = params?.profileId as string

  const [profile, setProfile] = useState<PreEnteredProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [chatLoading, setChatLoading] = useState(false)

  const fetchProfile = async () => {
    if (!profileId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('pre_entered_profiles')
        .select('*')
        .eq('id', profileId)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error

      if (!data) {
        toast.error('Profile not found')
        router.push('/discover')
        return
      }

      setProfile(data as PreEnteredProfile)
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
      router.push('/discover')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (profileId) {
      if (user) {
        fetchProfile()
      } else {
        // Wait for user to load
        setLoading(true)
      }
    } else {
      setLoading(false)
    }
  }, [profileId, user])

  const handleStartChat = async () => {
    if (!user || !profile) return

    setChatLoading(true)
    try {
      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('user_id', user.id)
        .eq('profile_id', profile.id)
        .maybeSingle()

      if (existingChat) {
        // Navigate to existing chat
        router.push(`/chat/${existingChat.id}`)
      } else {
        // Create new chat
        const { data: newChat, error } = await supabase
          .from('chats')
          .insert({
            user_id: user.id,
            profile_id: profile.id,
            free_messages_used: 0
          })
          .select()
          .single()

        if (error) throw error

        // Navigate to new chat
        router.push(`/chat/${newChat.id}`)
      }
    } catch (error) {
      console.error('Error starting chat:', error)
      toast.error('Failed to start chat')
    } finally {
      setChatLoading(false)
    }
  }

  const nextPhoto = () => {
    if (profile && profile.photos) {
      setCurrentPhotoIndex((prev) => (prev + 1) % profile.photos.length)
    }
  }

  const prevPhoto = () => {
    if (profile && profile.photos) {
      setCurrentPhotoIndex((prev) => (prev - 1 + profile.photos.length) % profile.photos.length)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!profile) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">Profile not found</p>
            <button
              onClick={() => router.push('/discover')}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Back to Discover
            </button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  const currentPhoto = profile.photos && profile.photos.length > 0 
    ? profile.photos[currentPhotoIndex] 
    : null

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 max-w-4xl mx-auto">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
            <div className="w-9"></div>
          </div>
        </div>

        <div className="pt-16 pb-24">
          <div className="max-w-4xl mx-auto px-4">
            {/* Photo Gallery - Reduced height */}
            <div className="relative w-full aspect-[4/3] bg-gray-200 rounded-2xl overflow-hidden mb-6 shadow-md">
              {currentPhoto ? (
                <>
                  <img
                    src={currentPhoto}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                  {profile.photos && profile.photos.length > 1 && (
                    <>
                      <button
                        onClick={prevPhoto}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-900" />
                      </button>
                      <button
                        onClick={nextPhoto}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-lg"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-900" />
                      </button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full">
                        {profile.photos.map((_, index) => (
                          <div
                            key={index}
                            className={`h-1.5 rounded-full transition-all ${
                              index === currentPhotoIndex
                                ? 'w-6 bg-white'
                                : 'w-1.5 bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-6xl font-bold text-gray-400">{profile.name.charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              {/* Name and Online Status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {profile.name}
                    {profile.age && <span className="font-normal text-gray-600">, {profile.age}</span>}
                  </h2>
                  {profile.is_online && (
                    <div className="flex items-center gap-2 text-green-600 mt-1">
                      <Circle className="w-2.5 h-2.5 fill-green-500 text-green-500" />
                      <span className="text-sm font-medium">Online</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-gray-700 text-base leading-relaxed mb-6">
                  {profile.bio}
                </p>
              )}

              {/* Start Chat Button - Fixed at bottom */}
              <button
                onClick={handleStartChat}
                disabled={chatLoading}
                className="w-full bg-gray-900 text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {chatLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5" />
                    Start Chat
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

