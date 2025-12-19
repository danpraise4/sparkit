'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'

export default function Account() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [hideProfile, setHideProfile] = useState(false)

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    if (!window.confirm('This will permanently delete all your data. Are you absolutely sure?')) {
      return
    }

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)
      
      if (profileError) throw profileError
      
      await supabase.auth.signOut()
      toast.success('Account deleted successfully')
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account. Please contact support.')
    }
  }

  const maskEmail = (email: string | undefined): string => {
    if (!email) return ''
    const [local, domain] = email.split('@')
    return `${local[0]}${'*'.repeat(local.length - 1)}@${domain}`
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50 pb-20">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center sticky top-0 z-50">
          <button onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-lg font-semibold flex-1 text-gray-900">Account</h1>
        </div>

        <div className="max-w-md mx-auto bg-white">
        {/* Hide Profile */}
        <div className="px-4 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Hide Profile</h2>
            <button
              onClick={() => setHideProfile(!hideProfile)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                hideProfile ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  hideProfile ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Hide your account, like you deleted it, but you can come back when you like
          </p>
          <p className="text-sm text-gray-600">
            Make sure you can remember your login details, as you&apos;ll need them to sign back in.
          </p>
        </div>

        {/* Email Address */}
        <div className="px-4 py-4 border-b border-gray-200">
          <p className="text-sm font-medium text-gray-900 mb-1">Email Address</p>
          <p className="text-sm text-gray-600">{maskEmail(user?.email)}</p>
        </div>

        {/* Log out Button */}
        <div className="px-4 py-6">
          <button
            onClick={handleLogout}
            className="w-full border-2 border-gray-900 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Log out
          </button>
        </div>

        {/* Delete Account */}
        <div className="px-4 py-6 border-t border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Delete account</h2>
          <p className="text-sm text-gray-600 mb-4">
            You will no longer be seen by other users in the App. Any information about you, your messages and
            connections will be deleted.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="text-red-600 font-semibold hover:underline"
          >
            Delete Account
          </button>
        </div>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
