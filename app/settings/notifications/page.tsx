'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'

interface NotificationCategory {
  id: string
  title: string
  description: string
}

export default function Notifications() {
  const router = useRouter()

  const notificationCategories: NotificationCategory[] = [
    { id: 'messages', title: 'Messages', description: 'Get updates about new messages' },
    { id: 'matches', title: 'Matches', description: 'Get updates about new matches' },
    { id: 'liked', title: 'Liked you', description: 'Get updates about people who like you' },
    { id: 'visitors', title: 'Profile visitors', description: 'Get updates about people who visit your profile' },
    { id: 'favorited', title: 'Favorited you', description: 'Get updates about people who favorite you' },
    { id: 'gifts', title: 'Gifts', description: 'Get updated when you receive gifts' },
    { id: 'tips', title: 'Profile tips, promos & freebies', description: 'Get profile tips and updates about promos and freebies' },
    { id: 'research', title: 'Research and surveys', description: 'Keep up to date with paid and non-paid research opportunities and share your opinions on how to improve' },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50 pb-20">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center sticky top-0 z-50">
          <button onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-lg font-semibold flex-1 text-gray-900">Notifications</h1>
        </div>

        <div className="max-w-md mx-auto bg-white">
        {notificationCategories.map((category, index) => (
          <div key={category.id}>
            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors text-left">
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-1">{category.title}</p>
                <p className="text-sm text-gray-600">{category.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
            </button>
            {index < notificationCategories.length - 1 && (
              <div className="border-b border-gray-200 mx-4"></div>
            )}
          </div>
        ))}
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
