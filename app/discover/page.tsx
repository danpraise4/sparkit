'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import toast from 'react-hot-toast'
import ProfileGrid from '@/src/components/ProfileGrid'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import type { PreEnteredProfile } from '@/src/types'
import { Settings, Users } from 'lucide-react'

export default function Discover() {
  const { user, profile, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<PreEnteredProfile[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProfiles = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setProfiles([])

      // Get user's interest preference
      const { data: interestPref } = await supabase
        .from('interest_preferences')
        .select('preference')
        .eq('user_id', user.id)
        .maybeSingle()
      
      // If no preference, redirect to interest selection
      if (!interestPref) {
        setLoading(false)
        router.push('/onboarding/interest')
        return
      }

      // Build gender filter based on preference
      let genderFilter: string[] = []
      if (interestPref.preference === 'men') {
        genderFilter = ['male']
      } else if (interestPref.preference === 'women') {
        genderFilter = ['female']
      } else if (interestPref.preference === 'both') {
        genderFilter = ['male', 'female']
      }

      // Fetch pre-entered profiles
      let query = supabase
        .from('pre_entered_profiles')
        .select('*')
        .eq('is_active', true)

      // Apply gender filter if specified
      if (genderFilter.length > 0) {
        query = query.in('gender', genderFilter)
      }

      const { data, error } = await query
        .order('is_online', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching profiles:', error)
        
        // Provide more specific error messages
        if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
          toast.error('No profiles found. Please seed the database with profiles.')
        } else if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          toast.error('Permission denied. Please check RLS policies.')
        } else {
          toast.error(`Failed to load profiles: ${error.message || 'Unknown error'}`)
        }
        throw error
      }

      if (!data || data.length === 0) {
        console.warn('No profiles found in database')
        toast.error('No profiles available. Please seed the database.')
        setProfiles([])
        return
      }

      setProfiles((data || []) as PreEnteredProfile[])
    } catch (error) {
      console.error('Error fetching profiles:', error)
      // Don't show duplicate error toast if we already showed one above
      if (!(error as any)?.handled) {
        toast.error('Failed to load profiles. Please check console for details.')
      }
      setProfiles([])
    } finally {
      setLoading(false)
    }
  }, [user, router])

  useEffect(() => {
    if (authLoading) return // Wait for auth to finish loading
    
    if (!user) {
      setLoading(false)
      return
    }
    fetchProfiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading])

  const handleProfileClick = (profile: PreEnteredProfile) => {
    router.push(`/discover/${profile.id}`)
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20 bg-gray-50">
        {/* Top Header */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 max-w-7xl mx-auto">
            <div className="w-12"></div>
            <h1 className="text-xl font-bold text-gray-900 flex-1 text-center">
              Discover
            </h1>
            <div className="flex items-center gap-2 w-12 justify-end">
              <button 
                onClick={() => router.push('/settings')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 pt-20 pb-24">
          <ProfileGrid
            profiles={profiles}
            onProfileClick={handleProfileClick}
            loading={loading}
          />
        </div>

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
