'use client'

import { useState } from 'react'
import ProfileGridCard from './ProfileGridCard'
import type { PreEnteredProfile } from '@/src/types'
import { Search, Filter } from 'lucide-react'

interface ProfileGridProps {
  profiles: PreEnteredProfile[]
  onProfileClick: (profile: PreEnteredProfile) => void
  loading?: boolean
}

export default function ProfileGrid({ profiles, onProfileClick, loading }: ProfileGridProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlineOnly, setShowOnlineOnly] = useState(false)

  // Filter profiles
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = !searchQuery || 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (profile.bio && profile.bio.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesOnline = !showOnlineOnly || profile.is_online
    
    return matchesSearch && matchesOnline
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (profiles.length === 0) {
    return (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No profiles available</p>
        </div>
    )
  }

  return (
    <div className="w-full">
      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search profiles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-400"
          />
        </div>
        <button
          onClick={() => setShowOnlineOnly(!showOnlineOnly)}
          className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 ${
            showOnlineOnly
              ? 'bg-gray-900 text-white border-2 border-gray-900'
              : 'bg-white text-gray-700 border-2 border-gray-300 hover:border-gray-400'
          }`}
        >
          <Filter className="w-4 h-4" />
          Online Only
        </button>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Showing {filteredProfiles.length} of {profiles.length} profiles
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {filteredProfiles.map((profile) => (
          <ProfileGridCard
            key={profile.id}
            profile={profile}
            onClick={() => onProfileClick(profile)}
          />
        ))}
      </div>

      {filteredProfiles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No profiles match your search</p>
        </div>
      )}
    </div>
  )
}

