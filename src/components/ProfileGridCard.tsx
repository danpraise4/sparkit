'use client'

import { motion } from 'framer-motion'
import type { PreEnteredProfile } from '@/src/types'
import { Circle } from 'lucide-react'

interface ProfileGridCardProps {
  profile: PreEnteredProfile
  onClick: () => void
}

export default function ProfileGridCard({ profile, onClick }: ProfileGridCardProps) {
  const mainPhoto = profile.photos && profile.photos.length > 0 ? profile.photos[0] : null

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer group"
    >
      {/* Profile Image */}
      <div className="absolute inset-0">
        {mainPhoto ? (
          <img
            src={mainPhoto}
            alt={profile.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-600">{profile.name.charAt(0)}</span>
          </div>
        )}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-4">
        <div className="relative z-10">
          {/* Online Status Indicator */}
          {profile.is_online && (
            <div className="absolute -top-2 -right-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
              <Circle className="w-2 h-2 fill-green-400 text-green-400" />
              <span className="text-xs text-white font-medium">Online</span>
            </div>
          )}

          {/* Name and Age */}
          <div className="mb-1">
            <h3 className="text-xl font-bold text-white drop-shadow-lg">
              {profile.name}
              {profile.age && <span className="font-normal">, {profile.age}</span>}
            </h3>
          </div>

          {/* Bio Preview (on hover) */}
          {profile.bio && (
            <p className="text-sm text-white/90 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-gray-400 rounded-2xl transition-colors" />
    </motion.div>
  )
}

