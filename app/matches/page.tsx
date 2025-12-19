'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { MessageCircle, Edit, RefreshCw, Bell, Star, Heart, Settings } from 'lucide-react'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import toast from 'react-hot-toast'
import type { Profile } from '@/src/types'

interface Match {
  id: string
  user1_id: string
  user2_id: string
  created_at: string
  user1?: Profile
  user2?: Profile
  otherUser?: Profile
  lastMessage?: {
    id: string
    content: string
    created_at: string
  } | null
}

export default function Matches() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [newMatches, setNewMatches] = useState<Match[]>([])
  const [likes, setLikes] = useState<Array<{ swiper_id: string; swiped?: Profile }>>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState(false)

  const fetchLikes = useCallback(async (currentMatches: Match[] = []) => {
    if (!user) return
    
    try {
      // Get users who liked the current user but haven't been matched yet
      const { data: swipes, error } = await supabase
        .from('swipes')
        .select(`
          swiper_id,
          swiped:profiles!swipes_swiper_id_fkey(*)
        `)
        .eq('swiped_id', user.id)
        .eq('action', 'like')

      if (error) throw error

      // Filter out users we've already matched with
      const matchedUserIds = currentMatches.map(m => 
        m.user1_id === user.id ? m.user2_id : m.user1_id
      )

      const unmatchedLikes = (swipes || []).filter(
        (swipe: any) => !matchedUserIds.includes(swipe.swiper_id)
      ).map((swipe: any) => ({
        swiper_id: swipe.swiper_id,
        swiped: Array.isArray(swipe.swiped) ? swipe.swiped[0] as Profile : swipe.swiped as Profile
      }))

      setLikes(unmatchedLikes)
    } catch (error) {
      console.error('Error fetching likes:', error)
    }
  }, [user])

  const fetchMatches = useCallback(async () => {
    if (!user) return
    
    try {
      setLoading(true)
      
      // Fetch user-to-user matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(*),
          user2:profiles!matches_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (matchesError) throw matchesError

      // Fetch chats with pre-entered profiles
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select(`
          *,
          profile:pre_entered_profiles(*)
        `)
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (chatsError) throw chatsError

      // Get last message for each match
      const matchesWithMessages = await Promise.all(
        (matchesData || []).map(async (match: any) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('match_id', match.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          const otherUser = match.user1_id === user.id ? match.user2 : match.user1
          return {
            ...match,
            otherUser,
            lastMessage: lastMessage || null,
            isChat: false
          }
        })
      )

      // Get last message for each chat
      const chatsWithMessages = await Promise.all(
        (chatsData || []).map(async (chat: any) => {
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('*')
            .eq('chat_id', chat.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          return {
            id: chat.id,
            user1_id: user.id,
            user2_id: chat.profile_id,
            created_at: chat.created_at,
            last_message_at: chat.last_message_at,
            otherUser: chat.profile ? {
              id: chat.profile.id,
              full_name: chat.profile.name,
              age: chat.profile.age,
              photos: chat.profile.photos || [],
              is_online: chat.profile.is_online,
              email: undefined
            } : null,
            lastMessage: lastMessage || null,
            isChat: true
          }
        })
      )

      // Combine matches and chats, sort by last message time
      const allConversations = [...matchesWithMessages, ...chatsWithMessages].sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.last_message_at || a.created_at
        const bTime = b.lastMessage?.created_at || b.last_message_at || b.created_at
        return new Date(bTime).getTime() - new Date(aTime).getTime()
      })

      // Separate new conversations (created in last 7 days) from recent
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const newConversations = allConversations.filter(
        (conv: any) => new Date(conv.created_at) > sevenDaysAgo
      )
      const recentConversations = allConversations.filter(
        (conv: any) => new Date(conv.created_at) <= sevenDaysAgo
      )

      setNewMatches(newConversations)
      setMatches(recentConversations)
      
      // Fetch likes after matches are loaded (only for user matches, not chats)
      const userMatches = matchesWithMessages.filter((m: any) => !m.isChat)
      fetchLikes(userMatches)
    } catch (error) {
      console.error('Error fetching matches:', error)
      toast.error('Failed to load matches')
    } finally {
      setLoading(false)
    }
  }, [user, fetchLikes])

  useEffect(() => {
    if (!user) return

    fetchMatches()
    
    // Subscribe to new matches in real-time
    const matchesChannel = supabase
      .channel(`matches-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${user.id} OR user2_id=eq.${user.id}`
        },
        () => {
          fetchMatches()
        }
      )
      .subscribe()

    // Subscribe to new chats in real-time
    const chatsChannel = supabase
      .channel(`chats-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchMatches()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          fetchMatches()
        }
      )
      .subscribe()

    // Subscribe to new messages in real-time
    const messagesChannel = supabase
      .channel(`messages-list-${user.id}`, {
        config: {
          broadcast: { self: false }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('New message in matches list:', payload.new)
          fetchMatches() // Refresh to update last messages
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages'
        },
        () => {
          fetchMatches() // Refresh to update last messages
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Messages subscription error:', err)
        } else {
          console.log('Matches messages subscription status:', status)
        }
      })

    return () => {
      supabase.removeChannel(matchesChannel)
      supabase.removeChannel(chatsChannel)
      supabase.removeChannel(messagesChannel)
    }
  }, [user?.id, fetchMatches])

  const toggleMatchSelection = (matchId: string) => {
    setSelectedMatches((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(matchId)) {
        newSet.delete(matchId)
      } else {
        newSet.add(matchId)
      }
      return newSet
    })
  }

  const handleDeleteSelected = async () => {
    if (selectedMatches.size === 0) return

    if (!window.confirm(`Are you sure you want to delete ${selectedMatches.size} ${selectedMatches.size === 1 ? 'chat' : 'chats'}?`)) {
      return
    }

    setDeleting(true)
    try {
      // Delete matches from database
      const matchIds = Array.from(selectedMatches)
      const { error } = await supabase
        .from('matches')
        .delete()
        .in('id', matchIds)

      if (error) throw error

      // Remove from local state
      setMatches((prev) => prev.filter((m) => !selectedMatches.has(m.id)))
      setNewMatches((prev) => prev.filter((m) => !selectedMatches.has(m.id)))
      setSelectedMatches(new Set())
      setEditMode(false)
      toast.success(`Deleted ${matchIds.length} ${matchIds.length === 1 ? 'chat' : 'chats'}`)
    } catch (error) {
      console.error('Error deleting matches:', error)
      toast.error('Failed to delete chats')
    } finally {
      setDeleting(false)
    }
  }

  const toggleSelectAll = () => {
    const allMatchIds = [...newMatches, ...matches].map((m) => m.id)
    if (selectedMatches.size === allMatchIds.length) {
      setSelectedMatches(new Set())
    } else {
      setSelectedMatches(new Set(allMatchIds))
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3EDF7' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen pb-20 bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between sticky top-0 z-50 max-w-4xl mx-auto w-full shadow-sm">
          <h1 className="text-lg font-bold text-gray-900 flex-1 text-center">Chats</h1>
          <div className="flex items-center gap-2 absolute right-4">
            {editMode ? (
              <button
                onClick={() => {
                  setEditMode(false)
                  setSelectedMatches(new Set())
                }}
                className="text-sm font-medium text-gray-900 mr-2"
              >
                Done
              </button>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="text-sm font-medium text-gray-900 mr-2"
              >
                Edit
              </button>
            )}
            {!editMode && (
              <>
                <button 
                  onClick={fetchMatches}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <RefreshCw className="w-5 h-5 text-gray-700" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto w-full">
          {/* New Matches Section */}
          {newMatches.length > 0 && (
            <div className="px-3 sm:px-4 py-3 sm:py-4 bg-white border-b border-gray-200">
              <h2 className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                {newMatches.length} new matches
              </h2>
              <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-3 sm:-mx-4 px-3 sm:px-4">
                {/* View Likes Card - Premium Feature */}
                <Link
                  href="/matches/likes"
                  className="flex-shrink-0 text-center"
                >
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 mb-1 sm:mb-2">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                      <Heart className="w-7 h-7 sm:w-8 sm:h-8 text-purple-600 fill-purple-600" />
                    </div>
                    {(profile?.subscription_tier === 'premium_messages' || 
                      profile?.subscription_tier === 'premium' || 
                      profile?.subscription_tier === 'vip') && likes.length > 0 && (
                      <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                        {likes.length}
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-900">Likes</p>
                </Link>

                {/* Likes Card - Old */}
                {likes.length > 0 && (
                  <Link
                    href="/matches/likes"
                    className="flex-shrink-0 text-center"
                  >
                    <div className="relative w-16 h-16 mb-2">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                        <Heart className="w-8 h-8 text-purple-600 fill-purple-600" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                        {likes.length}
                      </div>
                    </div>
                    <p className="text-xs font-medium text-gray-900">Likes</p>
                  </Link>
                )}

                {/* New Match Profiles */}
                {newMatches.slice(0, 7).map((match) => (
                  <Link
                    key={match.id}
                    href={`/chat/${match.id}`}
                    className="flex-shrink-0 text-center"
                  >
                    <div className="w-16 h-16 mb-2">
                      {match.otherUser?.photos && match.otherUser.photos.length > 0 ? (
                        <img
                          src={match.otherUser.photos[0]}
                          alt={match.otherUser.full_name || 'Match'}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                          <span className="text-2xl">👤</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-900 truncate w-16">
                      {match.otherUser?.full_name || match.otherUser?.email?.split('@')[0] || 'Match'}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Most Recent Section */}
          <div className="bg-white">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center gap-2">
              <Settings className="w-4 h-4 text-gray-500" />
              <h2 className="text-sm font-semibold text-gray-900">Most recent</h2>
            </div>

            {/* Likes Prompt */}
            {likes.length > 0 && (
              <Link
                href="/matches/likes"
                className="px-4 py-4 border-b border-gray-200 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <div className="relative w-12 h-12 flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-gray-700 fill-gray-700" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                    {likes.length}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Want to see the {likes.length} {likes.length === 1 ? 'person' : 'people'} who already liked you?
                  </p>
                </div>
              </Link>
            )}

            {/* Chat List */}
            {matches.length === 0 && newMatches.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <p className="text-gray-600 mb-2">No matches yet</p>
                <p className="text-sm text-gray-500">Start swiping to find your match!</p>
              </div>
            ) : (
              <div>
                {editMode && [...newMatches, ...matches].length > 0 && (
                  <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm font-medium text-gray-900"
                    >
                      {selectedMatches.size === [...newMatches, ...matches].length
                        ? 'Deselect All'
                        : 'Select All'}
                    </button>
                    <span className="text-sm text-gray-600">
                      {selectedMatches.size} selected
                    </span>
                  </div>
                )}
                {[...newMatches, ...matches].map((match: any) => {
                  const lastMessage = match.lastMessage
                  const otherUserName = match.isChat 
                    ? (match.otherUser?.full_name || match.otherUser?.name || 'User')
                    : (match.otherUser?.full_name || match.otherUser?.email?.split('@')[0] || 'User')
                  const isSelected = selectedMatches.has(match.id)
                  const phoneNumber = match.otherUser?.phone && typeof match.otherUser.phone === 'string' ? match.otherUser.phone : null
                  
                  if (editMode) {
                    return (
                      <div
                        key={match.id}
                        onClick={() => toggleMatchSelection(match.id)}
                        className={`px-4 py-4 border-b border-gray-200 flex items-center gap-3 cursor-pointer transition-colors ${
                          isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="flex-shrink-0">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-gray-900 border-gray-900'
                                : 'border-gray-300'
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Profile Picture */}
                        <div className="relative w-12 h-12 flex-shrink-0">
                          {match.otherUser?.photos && match.otherUser.photos.length > 0 ? (
                            <img
                              src={match.otherUser.photos[0]}
                              alt={otherUserName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                              <span className="text-xl">👤</span>
                            </div>
                          )}
                          {match.otherUser?.is_online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                          )}
                        </div>

                        {/* Chat Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {otherUserName}
                            </h3>
                            {match.otherUser?.is_online && (
                              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            )}
                            {!lastMessage && (
                              <span className="text-xs font-semibold text-purple-600 flex-shrink-0">
                                YOUR MOVE
                              </span>
                            )}
                          </div>
                          {lastMessage ? (
                            <p className="text-sm text-gray-600 truncate">
                              {lastMessage.content || 'Photo'}
                            </p>
                          ) : (
                            <p className="text-sm text-primary-600 font-medium">
                              Send a message!
                            </p>
                          )}
                          {phoneNumber && (
                            <p className="text-xs text-gray-500 mt-1">
                              {phoneNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <Link
                      key={match.id}
                      href={`/chat/${match.id}`}
                      className="px-4 py-4 border-b border-gray-200 flex items-center gap-3 hover:bg-gray-50 transition-colors bg-white"
                    >
                      {/* Profile Picture */}
                      <div className="relative w-12 h-12 flex-shrink-0">
                        {match.otherUser?.photos && match.otherUser.photos.length > 0 ? (
                          <img
                            src={match.otherUser.photos[0]}
                            alt={otherUserName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                            <span className="text-xl">👤</span>
                          </div>
                        )}
                        {match.otherUser?.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      {/* Chat Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-gray-900 truncate">
                              {otherUserName}
                            </h3>
                            {match.otherUser?.is_online && (
                              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                            )}
                            {!lastMessage && (
                              <span className="text-xs font-semibold text-purple-600 flex-shrink-0">
                                YOUR MOVE
                              </span>
                            )}
                          </div>
                          {lastMessage && (
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                              {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        {lastMessage ? (
                          <p className="text-sm text-gray-600 truncate">
                            {lastMessage.content || 'Photo'}
                          </p>
                        ) : (
                          <p className="text-sm text-primary-600 font-medium">
                            Send a message!
                          </p>
                        )}
                        {phoneNumber && (
                          <p className="text-xs text-gray-500 mt-1">
                            {phoneNumber}
                          </p>
                        )}
                      </div>

                      {/* Star Icon */}
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          // Handle favorite/unfavorite
                        }}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                      >
                        <Star className="w-5 h-5 text-gray-400" />
                      </button>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Delete Selected Button */}
        {editMode && selectedMatches.size > 0 && (
          <div className="fixed bottom-20 left-0 right-0 z-40 px-4 pb-4">
            <button
              onClick={handleDeleteSelected}
              disabled={deleting}
              className="w-full bg-gray-900 text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {deleting ? 'Deleting...' : `Delete Selected (${selectedMatches.size})`}
            </button>
          </div>
        )}

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

