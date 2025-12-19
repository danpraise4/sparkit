'use client'

import { useState } from 'react'
import { Verified, Leaf } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Profile } from '../types'

interface ProfileCardProps {
  profile: Profile
}

const ProfileCard = ({ profile }: ProfileCardProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [showAllInterests, setShowAllInterests] = useState(false)
  const photos = profile.photos || []

  if (photos.length === 0) {
    return (
      <div className="bg-white rounded-[24px] shadow-xl overflow-hidden h-full flex items-center justify-center">
        <p className="text-gray-500 font-medium">No photos available</p>
      </div>
    )
  }

  const nextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1)
    }
  }

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1)
    }
  }

  const displayedInterests = showAllInterests 
    ? profile.interests || []
    : (profile.interests || []).slice(0, 6)

  // Calculate days since account creation
  const daysSinceJoined = profile.created_at 
    ? Math.floor((new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const isNewUser = daysSinceJoined <= 7

  // Get additional photos (excluding the first one)
  const additionalPhotos = photos.slice(1)

  return (
    <div className="bg-white rounded-[24px] shadow-xl overflow-hidden h-full flex flex-col" style={{ maxHeight: '85vh' }}>
      {/* Photo Section - Full height, fills the card */}
      <div className="relative flex-1" style={{ minHeight: '500px' }}>
        <AnimatePresence mode="wait">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <motion.img
            key={currentPhotoIndex}
            src={photos[currentPhotoIndex]}
            alt={`${profile.full_name || 'User'}, ${profile.age}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="w-full h-full object-cover rounded-t-[24px]"
            style={{ objectPosition: 'center center' }}
          />
        </AnimatePresence>

        {/* TOP-LEFT USER BADGE OVERLAY - On top of photo */}
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-white font-bold text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">
              {profile.full_name || profile.email?.split('@')[0] || 'User'}, {profile.age}
            </h2>
            {profile.verification_badge && (
              <Verified className="w-5 h-5 text-blue-500 fill-blue-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
            )}
            {/* Green online dot */}
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"></div>
          </div>
          
          {/* Just Joined Badge - Rounded pill */}
          {isNewUser && (
            <div className="bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 w-fit">
              <Leaf className="w-3 h-3 text-white" />
              <span className="text-white text-xs font-semibold">Just joined</span>
            </div>
          )}
        </div>

        {/* Photo Navigation Dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {photos.map((_, index) => (
              <div
                key={index}
                className={`rounded-full transition-all ${
                  index === currentPhotoIndex 
                    ? 'bg-white w-8 h-1.5 shadow-lg' 
                    : 'bg-white/60 w-1.5 h-1.5'
                }`}
              />
            ))}
          </div>
        )}

        {/* Photo Counter */}
        {photos.length > 1 && currentPhotoIndex < photos.length - 1 && (
          <div className="absolute bottom-6 right-6 bg-black/60 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg z-10">
            {photos.length - currentPhotoIndex - 1} more photos
          </div>
        )}

        {/* Swipe Navigation */}
        {photos.length > 1 && (
          <>
            {currentPhotoIndex > 0 && (
              <button
                onClick={prevPhoto}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full p-2.5 hover:bg-white transition-all shadow-lg hover:scale-110 z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {currentPhotoIndex < photos.length - 1 && (
              <button
                onClick={nextPhoto}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full p-2.5 hover:bg-white transition-all shadow-lg hover:scale-110 z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Info Section - Scrollable White Section Inside Card */}
      <div className="flex-1 overflow-y-auto scrollbar-hide bg-white px-4 py-4">
        {/* Additional Photos Grid - 2 side-by-side */}
        {additionalPhotos.length > 0 && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-3">
              {additionalPhotos.slice(0, 2).map((photo, index) => (
                <div key={index} className="relative rounded-2xl overflow-hidden aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo}
                    alt={`Photo ${index + 2}`}
                    className="w-full h-full object-cover"
                  />
                  {index === 1 && additionalPhotos.length > 2 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {additionalPhotos.length - 1} more photos
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests Section */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {displayedInterests.map((interest, index) => (
                <div
                  key={index}
                  className="px-3 py-2 bg-gray-100 rounded-full flex items-center gap-2"
                >
                  <span className="text-sm font-medium text-gray-700">{interest}</span>
                </div>
              ))}
              {!showAllInterests && profile.interests.length > 6 && (
                <button
                  onClick={() => setShowAllInterests(true)}
                  className="px-3 py-2 bg-gray-100 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  Show all
                </button>
              )}
            </div>
          </div>
        )}

        {/* Location Section */}
        {profile.location && (
          <div className="mb-4">
            <h3 className="text-xs font-bold text-gray-600 mb-1 uppercase tracking-wider">Current location</h3>
            <p className="text-sm text-gray-700 font-medium">{profile.location}</p>
          </div>
        )}

        {/* Verification Section */}
        {profile.verification_badge && (
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <Verified className="w-4 h-4 text-blue-600 fill-blue-600" />
              <span className="text-sm text-gray-700 font-medium">
                {(profile.full_name || profile.email?.split('@')[0] || 'User')} is photo verified
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProfileCard
