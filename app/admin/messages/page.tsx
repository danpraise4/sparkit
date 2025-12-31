'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import AdminLayout from '@/src/components/AdminLayout'
import type { Chat, PreEnteredProfile } from '@/src/types'

interface Message {
  id: string
  chat_id?: string | null
  match_id?: string | null
  sender_id: string
  content: string | null
  photo_url?: string | null
  read: boolean
  created_at: string
  [key: string]: unknown
}

export default function AdminMessages() {
  const { user } = useAuth()
  const router = useRouter()
  const [chats, setChats] = useState<(Chat & { profile: PreEnteredProfile; lastMessage?: Message })[]>([])
  const [selectedChat, setSelectedChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  // Filters
  const [filters, setFilters] = useState({
    unread: false,
    online: false,
    menFavor: false,
    notPaid: false,
    paid: false,
    retention: false,
    firstSMS: false,
    myFavor: false,
  })

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    fetchChats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters])

  useEffect(() => {
    if (!selectedChat) {
      setMessages([])
      return
    }

    let isMounted = true
    let messageChannel: any = null

    const setupSubscription = async () => {
      // Fetch initial messages
      await fetchMessages(selectedChat)
      
      if (!isMounted) return

      // Scroll to bottom after loading messages
      setTimeout(() => {
        const container = document.getElementById('messages-container')
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }, 100)

      // Subscribe to real-time updates
      const channelName = `admin-chat:${selectedChat}-${Date.now()}`
      messageChannel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages',
            filter: `chat_id=eq.${selectedChat}`,
          },
          () => {
            if (isMounted) {
              fetchMessages(selectedChat)
              fetchChats() // Refresh chat list to update last message
              // Auto-scroll to bottom on new message
              setTimeout(() => {
                const container = document.getElementById('messages-container')
                if (container) {
                  container.scrollTop = container.scrollHeight
                }
              }, 100)
            }
          }
        )
        .subscribe((status, err) => {
          if (err) {
            console.error('Message subscription error:', err)
          }
        })
    }

    setupSubscription()

    return () => {
      isMounted = false
      if (messageChannel) {
        supabase.removeChannel(messageChannel)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat])

  const fetchChats = async () => {
    if (!user) return

    try {
      setLoading(true)
      let query = supabase
        .from('chats')
        .select(`
          *,
          profile:pre_entered_profiles(*)
        `)
        .eq('user_id', user.id)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      // Apply filters
      if (filters.online) {
        query = query.eq('profile.is_online', true)
      }

      const { data, error } = await query

      if (error) throw error

      // Fetch last message and unread count for each chat
      const chatsWithMessages = await Promise.all(
        (data || []).map(async (chat) => {
          const [lastMsgResult, unreadResult] = await Promise.all([
            supabase
              .from('messages')
              .select('*')
              .eq('chat_id', chat.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle(),
            supabase
              .from('messages')
              .select('*', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
              .eq('read', false)
              .neq('sender_id', user.id)
          ])

          const unreadCount = unreadResult.count || 0
          setUnreadCounts((prev) => ({ ...prev, [chat.id]: unreadCount }))

          return {
            ...chat,
            profile: Array.isArray(chat.profile) ? chat.profile[0] : chat.profile,
            lastMessage: lastMsgResult.data || undefined,
          }
        })
      )

      // Apply additional filters
      let filtered = chatsWithMessages

      if (filters.unread) {
        // Filter chats with unread messages
        filtered = filtered.filter(chat => {
          // Check if there are unread messages
          return chat.lastMessage && !chat.lastMessage.read && chat.lastMessage.sender_id !== user.id
        })
      }

      if (filters.paid) {
        // Filter chats where user has paid (used points)
        filtered = filtered.filter(chat => chat.free_messages_used >= 5)
      }

      if (filters.notPaid) {
        // Filter chats where user hasn't paid yet
        filtered = filtered.filter(chat => chat.free_messages_used < 5)
      }

      if (filters.firstSMS) {
        // Filter chats with only 1 message
        filtered = filtered.filter(chat => {
          // This would need a message count - simplified for now
          return chat.lastMessage && chat.lastMessage.sender_id === user.id
        })
      }

      setChats(filtered)
    } catch (error) {
      console.error('Error fetching chats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
      
      // Mark messages as read when viewing
      if (user && data) {
        const unreadMessages = data.filter(
          (msg) => !msg.read && msg.sender_id !== user.id
        )
        
        if (unreadMessages.length > 0) {
          const messageIds = unreadMessages.map((msg) => msg.id)
          await supabase
            .from('messages')
            .update({ read: true })
            .in('id', messageIds)
          
          // Update unread count
          setUnreadCounts((prev) => ({ ...prev, [chatId]: 0 }))
          // Refresh chat list to update unread status
          fetchChats()
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  // Calculate unread count for a chat
  const getUnreadCount = async (chatId: string): Promise<number> => {
    if (!user) return 0
    
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('chat_id', chatId)
        .eq('read', false)
        .neq('sender_id', user.id)

      if (error) throw error
      return count || 0
    } catch (error) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  }

  const sendMessage = async () => {
    if (!user || !selectedChat || !newMessage.trim()) return

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: selectedChat,
          sender_id: user.id,
          content: newMessage.trim(),
          read: false,
        })

      if (error) throw error

      // Update chat's last_message_at
      await supabase
        .from('chats')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedChat)

      setNewMessage('')
      // Messages will be updated via real-time subscription
      // Scroll to bottom after a brief delay
      setTimeout(() => {
        const container = document.getElementById('messages-container')
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      }, 100)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  const selectedChatData = chats.find(c => c.id === selectedChat)
  const selectedProfile = selectedChatData?.profile

  return (
    <AdminLayout>
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Left Panel - Filters and Chat List */}
        <div className="w-80 border-r border-gray-200 flex flex-col">
          {/* Filters */}
          <div className="p-4 border-b border-gray-200 space-y-2">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'unread', label: 'Unread' },
                { key: 'online', label: 'Online' },
                { key: 'menFavor', label: 'Men Favor' },
                { key: 'notPaid', label: 'Not Paid' },
                { key: 'paid', label: 'Paid' },
                { key: 'retention', label: 'Retention' },
                { key: 'firstSMS', label: '1st SMS' },
                { key: 'myFavor', label: 'My Favor' },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() =>
                    setFilters((prev) => ({
                      ...prev,
                      [filter.key]: !prev[filter.key as keyof typeof prev],
                    }))
                  }
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    filters[filter.key as keyof typeof filters]
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Loading...</div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No chats found</div>
            ) : (
              chats.map((chat) => {
                const profile = Array.isArray(chat.profile) ? chat.profile[0] : chat.profile
                const isUnread = chat.lastMessage && !chat.lastMessage.read && chat.lastMessage.sender_id !== user?.id
                const isPaid = chat.free_messages_used >= 5
                const isFirstSMS = chat.lastMessage && chat.lastMessage.sender_id === user?.id

                return (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      selectedChat === chat.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        {profile?.photos && profile.photos.length > 0 ? (
                          <img
                            src={profile.photos[0]}
                            alt={profile.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200" />
                        )}
                        {profile?.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-gray-900 truncate">
                            {profile?.name}, {profile?.age}
                          </span>
                          {chat.lastMessage && (
                            <span className="text-xs text-gray-500 ml-2">
                              {new Date(chat.lastMessage.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false,
                              })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {isPaid && (
                            <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded font-medium">
                              Paid
                            </span>
                          )}
                          {isFirstSMS && (
                            <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded font-medium">
                              1st SMS
                            </span>
                          )}
                          {isUnread && (
                            <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded font-medium">
                              Retention
                            </span>
                          )}
                        </div>
                        {chat.lastMessage && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {chat.lastMessage.content}
                          </p>
                        )}
                        {isUnread && unreadCounts[chat.id] > 0 && (
                          <div className="mt-1 flex items-center justify-end gap-2">
                            <span className="min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center px-1.5">
                              {unreadCounts[chat.id] > 99 ? '99+' : unreadCounts[chat.id]}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Right Panel - Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedChat && selectedProfile ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  {selectedProfile.photos && selectedProfile.photos.length > 0 ? (
                    <img
                      src={selectedProfile.photos[0]}
                      alt={selectedProfile.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">
                      {selectedProfile.name}, {selectedProfile.age}
                    </p>
                    {selectedProfile.is_online && (
                      <p className="text-xs text-green-600">Online</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div 
                id="messages-container"
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
              >
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  messages.map((message) => {
                  const isOwn = message.sender_id === user?.id
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          isOwn
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(message.created_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )
                }))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        sendMessage()
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                </div>
                <p className="text-gray-600">Choose person to chat</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

