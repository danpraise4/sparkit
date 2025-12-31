'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { 
  Pencil, 
  MessageSquare, 
  User, 
  Settings, 
  LogOut, 
  ExternalLink,
  Mail
} from 'lucide-react'
import type { AdminUser, UserPoints } from '@/src/types'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, profile, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [points, setPoints] = useState<UserPoints | null>(null)
  const [stats, setStats] = useState({
    conversionsPerMonth: 78,
    conversionsPerDay: 5,
    newPayersToday: 3,
    chatsStartedToday: 0,
    repliesThisMonth: 883,
    repliesPreviousMonth: 2626
  })
  const [weeklyProgress, setWeeklyProgress] = useState({ current: 32, goal: 80 })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    checkAdminAccess()
  }, [user, router])

  useEffect(() => {
    if (isAdmin && user) {
      fetchPoints()
      fetchStats()
    }
  }, [isAdmin, user])

  const checkAdminAccess = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setIsAdmin(true)
        setAdminUser(data)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Error checking admin access:', error)
      router.push('/')
    }
  }

  const fetchPoints = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setPoints(data)
      } else {
        // Create default points record if it doesn't exist
        const { data: newPoints } = await supabase
          .from('user_points')
          .insert({ user_id: user.id, balance: 0 })
          .select()
          .single()
        if (newPoints) setPoints(newPoints)
      }
    } catch (error) {
      console.error('Error fetching points:', error)
    }
  }

  const fetchStats = async () => {
    // TODO: Implement actual stats fetching from database
    // For now, using placeholder values
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  const navItems = [
    { path: '/admin/profile', label: 'My Profile', icon: Pencil },
    { path: '/admin/messages', label: 'My Messages', icon: MessageSquare },
    { path: '/admin/about-me', label: 'About me', icon: User },
    { path: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Checking admin access...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Top Header */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50 flex items-center justify-between px-4">
        <button
          onClick={() => router.push('/admin/messages')}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Mail className="w-4 h-4" />
          <span>Messages</span>
        </button>
        <div className="flex items-center gap-3">
          {profile?.photos && profile.photos.length > 0 && (
            <img
              src={profile.photos[0]}
              alt={profile.full_name || 'Profile'}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span>Sign out</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Left Sidebar */}
      <div className="fixed left-0 top-14 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
        {/* Profile Section */}
        <div className="p-4 border-b border-gray-200">
          {profile?.photos && profile.photos.length > 0 ? (
            <img
              src={profile.photos[0]}
              alt={profile.full_name || 'Profile'}
              className="w-20 h-20 rounded-full object-cover mx-auto mb-2"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-200 mx-auto mb-2 flex items-center justify-center">
              <User className="w-10 h-10 text-gray-400" />
            </div>
          )}
          <p className="text-center font-semibold text-gray-900">
            {profile?.full_name || 'User'}, {profile?.age || 'N/A'}
          </p>
        </div>

        {/* Navigation */}
        <div className="py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.path || 
              (item.path === '/admin/about-me' && pathname?.startsWith('/admin/about-me'))
            return (
              <button
                key={item.path}
                onClick={() => router.push(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  isActive
                    ? 'bg-pink-50 text-pink-600 border-l-4 border-pink-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </div>

        {/* Coins Section */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-2xl font-bold text-gray-900 mb-2">
            {points?.balance ? points.balance.toFixed(2) : '0.00'} coins
          </div>
          <button 
            onClick={() => router.push('/admin/settings')}
            className="w-full bg-red-500 text-white py-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Withdraw
          </button>
        </div>

        {/* Statistics */}
        <div className="p-4 border-t border-gray-200">
          <div className="space-y-1 text-sm text-gray-600">
            <div>{stats.conversionsPerMonth} conversion per month</div>
            <div>{stats.conversionsPerDay} conversions per day</div>
            <div>{stats.newPayersToday} new payers today</div>
            <div>{stats.chatsStartedToday} chats you started today</div>
            <div>{stats.repliesThisMonth} replies this month</div>
            <div>{stats.repliesPreviousMonth} replies previous month</div>
          </div>
        </div>

        {/* Weekly Project */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-sm font-semibold text-gray-900 mb-2">Weekly project</div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-red-600 font-semibold">{weeklyProgress.current}</span>
            <span className="text-gray-500">{weeklyProgress.goal}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-red-600 h-2 rounded-full transition-all"
              style={{ width: `${(weeklyProgress.current / weeklyProgress.goal) * 100}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">Goal +60 bonus</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64 mt-14">
        {children}
      </div>
    </div>
  )
}

