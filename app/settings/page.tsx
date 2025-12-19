'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'

export default function Settings() {
  const router = useRouter()

  const settingsItems = [
    { path: '/settings/basic-info', label: 'Basic info' },
    { path: '/settings/notifications', label: 'Notifications' },
    { path: '/settings/privacy', label: 'Privacy' },
    { path: '/settings/invisible-mode', label: 'Invisible mode' },
    { path: '/settings/interface-language', label: 'Interface language' },
    { path: '/settings/verifications', label: 'Verifications' },
    { path: '/settings/account', label: 'Account' },
    { path: '/settings/control-experience', label: 'Control your experience' },
    { path: '/settings/payment', label: 'Payment settings' },
    { path: '/settings/about', label: 'About' },
    { path: '/settings/help', label: 'Help Center' },
    { path: '/settings/feedback', label: 'Feedback' },
    { path: '/settings/blocked', label: 'Blocked users' },
  ]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50 pb-20">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center sticky top-0 z-50">
          <button onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-lg font-semibold flex-1 text-gray-900">Settings</h1>
        </div>

        {/* Settings List */}
        <div className="max-w-md mx-auto bg-white">
          {settingsItems.map((item, index) => (
            <div key={item.path}>
              <Link
                href={item.path}
                className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <span className="text-gray-900 font-medium">{item.label}</span>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </Link>
              {index < settingsItems.length - 1 && (
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


