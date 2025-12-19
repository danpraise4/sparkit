'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Search, Plus } from 'lucide-react'
import BottomNav from '@/src/components/BottomNav'

export default function HelpCenter() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const helpCategories = [
    'Popular Questions',
    'About Spark',
    'Profile',
    'Profile Verification',
    'Photos',
    'Encounters',
    'People Nearby and Search',
    'Messages',
    'Spark Premium',
    'Credits',
    'Google Payment',
    'Settings',
    'Privacy',
    'Digital Services Act',
  ]

  return (
    <div className="min-h-screen bg-purple-50 pb-20">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center sticky top-0 z-50">
        <button onClick={() => router.back()} className="mr-4">
          <ArrowLeft className="w-5 h-5 text-gray-900" />
        </button>
        <h1 className="text-lg font-semibold flex-1 text-gray-900">Help Center</h1>
      </div>

      <div className="max-w-md mx-auto bg-white">
        {/* Search Bar */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Categories */}
        {helpCategories.map((category, index) => (
          <div key={category}>
            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors">
              <span className="font-medium text-gray-900">{category}</span>
              <Plus className="w-5 h-5 text-gray-400" />
            </button>
            {index < helpCategories.length - 1 && (
              <div className="border-b border-gray-200 mx-4"></div>
            )}
          </div>
        ))}
      </div>

      <BottomNav />
    </div>
  )
}
