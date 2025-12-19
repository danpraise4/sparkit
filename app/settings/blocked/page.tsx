'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import type { Profile } from '@/src/types'

interface BlockedUser {
  blocked_id: string
  blocked: Profile
}

export default function BlockedUsers() {
  const { user } = useAuth()
  const router = useRouter()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBlockedUsers = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('blocks')
        .select(`
          blocked_id,
          blocked:profiles!blocks_blocked_id_fkey(id, full_name, email, photos)
        `)
        .eq('blocker_id', user.id)

      if (error) throw error

      // Handle the case where blocked might be an array or single object
      const formattedData = (data || []).map((item: { blocked_id: string; blocked: Profile | Profile[] }) => ({
        blocked_id: item.blocked_id,
        blocked: Array.isArray(item.blocked) ? item.blocked[0] : item.blocked
      })) as BlockedUser[]

      setBlockedUsers(formattedData)
    } catch (error) {
      console.error('Error fetching blocked users:', error)
      toast.error('Failed to load blocked users')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchBlockedUsers()
  }, [fetchBlockedUsers])

  const handleUnblock = async (blockedId: string) => {
    if (!user) return
    try {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedId)

      if (error) throw error

      toast.success('User unblocked')
      fetchBlockedUsers()
    } catch (error) {
      console.error('Error unblocking user:', error)
      toast.error('Failed to unblock user')
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50 pb-20">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center">
            <button onClick={() => router.back()} className="mr-4">
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
            <h1 className="text-lg font-semibold text-gray-900">Blocked users</h1>
          </div>
          <button className="text-sm font-medium text-gray-900">Edit</button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="max-w-md mx-auto bg-white px-4 py-8 text-center">
            <p className="text-gray-600">No blocked users</p>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white px-4 py-6">
            <div className="flex flex-wrap gap-4 justify-center">
              {blockedUsers.map((block) => {
                const blockedProfile = block.blocked
                return (
                  <div key={block.blocked_id} className="text-center">
                    <div className="relative">
                      {blockedProfile?.photos && blockedProfile.photos.length > 0 ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={blockedProfile.photos[0]}
                          alt={blockedProfile.full_name || 'Blocked user'}
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      {blockedProfile?.full_name || blockedProfile?.email?.split('@')[0] || 'User'}
                    </p>
                    <button
                      onClick={() => handleUnblock(block.blocked_id)}
                      className="mt-2 text-xs text-red-600 hover:underline"
                    >
                      Unblock
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
