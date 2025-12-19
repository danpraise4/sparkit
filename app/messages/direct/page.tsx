'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { ArrowLeft, Send, Lock, Search, MessageCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import type { Profile } from '@/src/types'

interface DirectMessage {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  photo_url: string | null
  read: boolean
  created_at: string
  sender?: Profile
  recipient?: Profile
}

export default function DirectMessages() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [conversations, setConversations] = useState<Array<{ otherUser: Profile; lastMessage: DirectMessage; unreadCount: number }>>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [messageContent, setMessageContent] = useState('')

  const hasDirectMessage = profile?.subscription_tier === 'premium_messages' || 
                           profile?.subscription_tier === 'premium' || 
                           profile?.subscription_tier === 'vip'

  const fetchConversations = useCallback(async () => {
    if (!user || !hasDirectMessage) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Get all direct messages for this user
      const { data: allMessages, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!direct_messages_sender_id_fkey(*),
          recipient:profiles!direct_messages_recipient_id_fkey(*)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Group messages by conversation
      const conversationMap = new Map<string, { otherUser: Profile; lastMessage: DirectMessage; unreadCount: number }>()

      allMessages?.forEach((msg: any) => {
        const otherUser = msg.sender_id === user.id 
          ? (Array.isArray(msg.recipient) ? msg.recipient[0] : msg.recipient)
          : (Array.isArray(msg.sender) ? msg.sender[0] : msg.sender)
        
        if (!otherUser) return

        const conversationKey = otherUser.id
        const existing = conversationMap.get(conversationKey)

        if (!existing || new Date(msg.created_at) > new Date(existing.lastMessage.created_at)) {
          const unreadCount = msg.recipient_id === user.id && !msg.read ? 1 : 0
          conversationMap.set(conversationKey, {
            otherUser,
            lastMessage: msg,
            unreadCount: existing ? existing.unreadCount + unreadCount : unreadCount
          })
        } else if (msg.recipient_id === user.id && !msg.read) {
          existing.unreadCount++
        }
      })

      setConversations(Array.from(conversationMap.values()))
    } catch (error) {
      console.error('Error fetching conversations:', error)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [user, hasDirectMessage])

  const fetchMessages = useCallback(async (otherUserId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!direct_messages_sender_id_fkey(*),
          recipient:profiles!direct_messages_recipient_id_fkey(*)
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (error) throw error

      setMessages((data || []) as DirectMessage[])

      // Mark messages as read
      await supabase
        .from('direct_messages')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('sender_id', otherUserId)
        .eq('read', false)
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('Failed to load messages')
    }
  }, [user])

  const sendMessage = async () => {
    if (!user || !selectedUser || !messageContent.trim()) return

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: selectedUser.id,
          content: messageContent.trim()
        })

      if (error) throw error

      setMessageContent('')
      fetchMessages(selectedUser.id)
      fetchConversations()
      toast.success('Message sent!')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  useEffect(() => {
    if (user) {
      fetchConversations()
    }
  }, [user, fetchConversations])

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.id)
    }
  }, [selectedUser, fetchMessages])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3EDF7' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!hasDirectMessage) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-purple-50 pb-20">
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 flex-1 text-center">Direct Messages</h1>
            <div className="w-9"></div>
          </div>

          {/* Premium Required */}
          <div className="max-w-md mx-auto px-4 py-12">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-10 h-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Premium Feature</h2>
              <p className="text-gray-600 mb-6">
                Upgrade to Premium Messages to send direct messages without matching!
              </p>
              <button
                onClick={() => router.push('/premium')}
                className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
              >
                Upgrade Now
              </button>
            </div>
          </div>

          <BottomNav />
        </div>
      </ProtectedRoute>
    )
  }

  if (selectedUser) {
    // Show conversation view
    const otherUserName = selectedUser.full_name || selectedUser.email?.split('@')[0] || 'User'
    
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-purple-50 pb-20 flex flex-col">
          {/* Header */}
          <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
            <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-900" />
            </button>
            <div className="flex items-center gap-3 flex-1">
              {selectedUser.photos && selectedUser.photos.length > 0 ? (
                <img
                  src={selectedUser.photos[0]}
                  alt={otherUserName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                  <span className="text-sm">👤</span>
                </div>
              )}
              <h1 className="text-lg font-bold text-gray-900">{otherUserName}</h1>
            </div>
            <div className="w-9"></div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4 space-y-2 sm:space-y-3">
            {messages.map((msg) => {
              const isSent = msg.sender_id === user?.id
              const sender = isSent ? user : selectedUser
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[60%] rounded-2xl px-3 sm:px-4 py-2 ${
                    isSent ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'
                  }`}>
                    <p className="text-sm sm:text-base break-words">{msg.content}</p>
                    <p className={`text-xs mt-1 ${isSent ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 px-3 sm:px-4 py-2 sm:py-3 sticky bottom-0">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border-2 border-gray-300 rounded-full focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              />
              <button
                onClick={sendMessage}
                disabled={!messageContent.trim()}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-900 text-white rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          <BottomNav />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50 pb-20">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1 text-center">Direct Messages</h1>
          <div className="w-9"></div>
        </div>

        {/* Search */}
        <div className="bg-white px-4 py-3 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="max-w-md mx-auto">
          {conversations.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-xl text-gray-600 mb-2">No direct messages</p>
              <p className="text-sm text-gray-500">
                Start a conversation with someone!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations
                .filter(conv => {
                  if (!searchQuery) return true
                  const name = conv.otherUser.full_name || conv.otherUser.email?.split('@')[0] || ''
                  return name.toLowerCase().includes(searchQuery.toLowerCase())
                })
                .map((conv) => {
                  const otherUserName = conv.otherUser.full_name || conv.otherUser.email?.split('@')[0] || 'User'
                  
                  return (
                    <button
                      key={conv.otherUser.id}
                      onClick={() => setSelectedUser(conv.otherUser)}
                      className="w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                    >
                      {/* Profile Picture */}
                      <div className="relative w-12 h-12 flex-shrink-0">
                        {conv.otherUser.photos && conv.otherUser.photos.length > 0 ? (
                          <img
                            src={conv.otherUser.photos[0]}
                            alt={otherUserName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center">
                            <span className="text-xl">👤</span>
                          </div>
                        )}
                        {conv.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>

                      {/* Message Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {otherUserName}
                          </h3>
                          <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                            {new Date(conv.lastMessage.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">
                          {conv.lastMessage.content}
                        </p>
                      </div>
                    </button>
                  )
                })}
            </div>
          )}
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

