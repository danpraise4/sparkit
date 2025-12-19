'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import { format, formatDistanceToNow } from 'date-fns'
import { Camera, Smile, Mic, ArrowLeft, ChevronRight, MoreVertical, CheckCircle2, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import type { Profile, PreEnteredProfile } from '@/src/types'

interface Message {
  id: string
  match_id?: string | null
  chat_id?: string | null
  sender_id: string
  content: string | null
  photo_url: string | null
  created_at: string
  [key: string]: unknown
}

interface MatchData {
  id: string
  user1_id: string
  user2_id: string
  user1?: Profile
  user2?: Profile
  otherUser?: Profile
  [key: string]: unknown
}

interface ChatData {
  id: string
  user_id: string
  profile_id: string
  profile?: PreEnteredProfile
  [key: string]: unknown
}

export default function Chat() {
  const params = useParams()
  const matchId = params?.matchId as string
  const { user } = useAuth()
  const router = useRouter()
  const [match, setMatch] = useState<MatchData | null>(null)
  const [chat, setChat] = useState<ChatData | null>(null)
  const [isChatType, setIsChatType] = useState<boolean>(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [freeMessagesRemaining, setFreeMessagesRemaining] = useState(5)
  const [pointsBalance, setPointsBalance] = useState(0)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }, [])

  const fetchChatData = useCallback(async () => {
    if (!user) return
    
    try {
      // First try to fetch as a match
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(*),
          user2:profiles!matches_user2_id_fkey(*)
        `)
        .eq('id', matchId)
        .maybeSingle()

      if (matchError) throw matchError

      if (matchData) {
        const otherUser = matchData.user1_id === user.id ? matchData.user2 : matchData.user1
        setMatch({ ...matchData, otherUser } as MatchData)
        setIsChatType(false)
        setLoading(false)
        return
      }

      // If not a match, try to fetch as a chat
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select(`
          *,
          profile:pre_entered_profiles(*)
        `)
        .eq('id', matchId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (chatError) throw chatError

      if (!chatData) {
        toast.error('Chat not found')
        router.push('/discover')
        return
      }

      setChat(chatData as ChatData)
      setIsChatType(true)
    } catch (error) {
      console.error('Error fetching chat data:', error)
      toast.error('Failed to load chat')
      router.push('/discover')
    } finally {
      setLoading(false)
    }
  }, [matchId, user, router])

  const fetchMessages = useCallback(async () => {
    try {
      let query = supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })

      // Query by match_id or chat_id based on type
      if (isChatType) {
        query = query.eq('chat_id', matchId)
      } else {
        query = query.eq('match_id', matchId)
      }

      const { data, error } = await query

      if (error) throw error
      setMessages((data || []) as Message[])
      scrollToBottom()
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }, [matchId, isChatType, scrollToBottom])

  const fetchMessageLimits = useCallback(async () => {
    if (!user || !isChatType) return

    try {
      // Get free messages used today
      const today = new Date().toISOString().split('T')[0]
      const { data: conversationCount } = await supabase
        .from('conversation_message_count')
        .select('free_messages_sent')
        .eq('chat_id', matchId)
        .eq('date', today)
        .maybeSingle()

      const freeMessagesUsed = conversationCount?.free_messages_sent || 0
      setFreeMessagesRemaining(Math.max(0, 5 - freeMessagesUsed))

      // Get points balance
      if (user) {
        const { data: userPoints } = await supabase
          .from('user_points')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle()

        setPointsBalance(userPoints?.balance || 0)
      }
    } catch (error) {
      console.error('Error fetching message limits:', error)
    }
  }, [user, matchId, isChatType])

  useEffect(() => {
    if (!matchId || !user) return

    fetchChatData()
  }, [matchId, user, fetchChatData])

  useEffect(() => {
    if (loading || (!match && !chat)) return

    fetchMessages()
    if (isChatType) {
      fetchMessageLimits()
    }

    // Mark messages as read when viewing chat
    const markAsRead = async () => {
      if (!user) return
      
      try {
        let query = supabase
          .from('messages')
          .update({ 
            read: true,
            read_at: new Date().toISOString()
          })
          .neq('sender_id', user.id)
          .eq('read', false)

        if (isChatType) {
          query = query.eq('chat_id', matchId)
        } else {
          query = query.eq('match_id', matchId)
        }

        await query
      } catch (error) {
        console.error('Error marking messages as read:', error)
      }
    }

    markAsRead()

    if (!user) return

    // Create a unique channel name
    const channelName = isChatType ? `chat:${matchId}:${user.id}` : `match:${matchId}:${user.id}`
    
    // Build filter for real-time subscription
    const filterField = isChatType ? 'chat_id' : 'match_id'
    
    // Subscribe to new messages in real-time
    const channel = supabase
      .channel(channelName, {
        config: {
          broadcast: { self: true },
          presence: { key: user.id }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `${filterField}=eq.${matchId}`
        },
        (payload) => {
          console.log('New message received via real-time:', payload.new)
          
          // Only add if it's not from the current user (to avoid duplicate with optimistic update)
          // or if it's from another user
          setMessages((prev) => {
            // Check if message already exists to avoid duplicates
            const exists = prev.some(msg => msg.id === payload.new.id)
            if (exists) {
              console.log('Message already exists, skipping:', payload.new.id)
              return prev
            }
            
            // If it's a temp message from optimistic update, replace it
            const tempIndex = prev.findIndex(msg => msg.id === `temp-${(payload.new as Message).sender_id}-${(payload.new as Message).created_at}`)
            if (tempIndex !== -1) {
              const updated = [...prev]
              updated[tempIndex] = payload.new as Message
              return updated
            }
            
            // Add new message
            return [...prev, payload.new as Message]
          })
          
          scrollToBottom()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `${filterField}=eq.${matchId}`
        },
        (payload) => {
          console.log('Message updated via real-time:', payload.new)
          setMessages((prev) =>
            prev.map((msg) => (msg.id === (payload.new as Message).id ? payload.new as Message : msg))
          )
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `${filterField}=eq.${matchId}`
        },
        (payload) => {
          console.log('Message deleted via real-time:', payload.old)
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== payload.old.id)
          )
        }
      )
      .subscribe((status, err) => {
        if (err) {
          console.error('Subscription error:', err)
          toast.error('Failed to connect to real-time updates')
        } else {
          console.log('Real-time subscription status:', status)
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to real-time messages')
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel error - real-time may not be enabled')
            toast.error('Real-time updates unavailable')
          }
        }
      })

    return () => {
      console.log('Unsubscribing from real-time channel:', channelName)
      supabase.removeChannel(channel)
    }
  }, [matchId, user?.id, isChatType, match, chat, loading, fetchMessages, fetchMessageLimits, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const sendMessage = async (content: string, photoUrl: string | null = null) => {
    if (!user) return
    if (!content.trim() && !photoUrl) return

    // For chats with pre-entered profiles, check free messages and points
    let isFreeMessage = true
    if (isChatType) {
      try {
        // Check free messages used today for this conversation
        const today = new Date().toISOString().split('T')[0]
        const { data: conversationCount } = await supabase
          .from('conversation_message_count')
          .select('free_messages_sent')
          .eq('chat_id', matchId)
          .eq('date', today)
          .maybeSingle()

        const freeMessagesUsed = conversationCount?.free_messages_sent || 0
        isFreeMessage = freeMessagesUsed < 5

        if (!isFreeMessage) {
          // Check user's point balance
          const { data: userPoints } = await supabase
            .from('user_points')
            .select('balance')
            .eq('user_id', user.id)
            .maybeSingle()

          const pointsBalance = userPoints?.balance || 0
          const pointsPerMessage = 10 // Cost per message after free limit

          if (pointsBalance < pointsPerMessage) {
            toast.error(`You need ${pointsPerMessage} points to send this message. You have ${pointsBalance} points.`)
            return
          }

          // Deduct points
          const { error: pointsError } = await supabase
            .from('point_transactions')
            .insert({
              user_id: user.id,
              amount: -pointsPerMessage,
              type: 'spend',
              description: 'Message sent',
              related_chat_id: matchId
            })

          if (pointsError) {
            console.error('Error deducting points:', pointsError)
            toast.error('Failed to deduct points')
            return
          }
        }
      } catch (error) {
        console.error('Error checking message limits:', error)
        toast.error('Failed to check message limits')
        return
      }
    }

    const messageContent = content || ''
    const tempId = `temp-${user.id}-${Date.now()}`
    
    // Optimistic update - add message immediately to UI
    const tempMessage: Message = {
      id: tempId,
      [isChatType ? 'chat_id' : 'match_id']: matchId,
      sender_id: user.id,
      content: messageContent,
      photo_url: photoUrl,
      created_at: new Date().toISOString()
    }
    
    setMessages((prev) => [...prev, tempMessage])
    setNewMessage('')
    scrollToBottom()

    try {
      const messageData: any = {
        sender_id: user.id,
        content: messageContent,
        photo_url: photoUrl,
        read: false
      }

      if (isChatType) {
        messageData.chat_id = matchId
        messageData.is_free_message = isFreeMessage
        messageData.points_used = isFreeMessage ? 0 : 10
      } else {
        messageData.match_id = matchId
      }

      const { data, error } = await supabase
        .from('messages')
        .insert(messageData)
        .select()
        .single()

      if (error) {
        console.error('Message error details:', error)
        // Remove optimistic message on error
        setMessages((prev) => prev.filter(msg => msg.id !== tempId))
        throw error
      }

      // Update conversation_message_count for chats
      if (isChatType) {
        const today = new Date().toISOString().split('T')[0]
        const { data: conversationCount } = await supabase
          .from('conversation_message_count')
          .select('free_messages_sent, paid_messages_sent')
          .eq('chat_id', matchId)
          .eq('date', today)
          .maybeSingle()

        const freeMessagesUsed = conversationCount?.free_messages_sent || 0
        const paidMessagesUsed = conversationCount?.paid_messages_sent || 0
        const isFreeMessage = freeMessagesUsed < 5

        if (isFreeMessage) {
          // Increment free messages
          await supabase
            .from('conversation_message_count')
            .upsert({
              chat_id: matchId,
              date: today,
              free_messages_sent: freeMessagesUsed + 1,
              paid_messages_sent: paidMessagesUsed
            })
        } else {
          // Increment paid messages
          await supabase
            .from('conversation_message_count')
            .upsert({
              chat_id: matchId,
              date: today,
              free_messages_sent: freeMessagesUsed,
              paid_messages_sent: paidMessagesUsed + 1
            })
        }

        // Update chat's last_message_at
        await supabase
          .from('chats')
          .update({ last_message_at: new Date().toISOString() })
          .eq('id', matchId)

        // Refresh message limits
        fetchMessageLimits()
      }
      
      console.log('Message sent successfully:', data)
      
      // The real-time subscription will handle adding the message
      // But we can also update it here to ensure it's in the list
      setMessages((prev) => {
        // Remove temp message and add real one
        const filtered = prev.filter(msg => msg.id !== tempId)
        // Check if real message already exists (from real-time)
        const exists = filtered.some(msg => msg.id === (data as Message).id)
        if (exists) {
          return filtered.map(msg => msg.id === data.id ? data : msg)
        }
        return [...filtered, data as Message]
      })
      
      scrollToBottom()
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      toast.error(`Failed to send message: ${errorMessage}`)
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(msg => msg.id !== tempId))
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be less than 5MB')
      return
    }

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${matchId}-${Date.now()}.${fileExt}`
      const filePath = `${matchId}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      await sendMessage('', publicUrl)
      toast.success('Photo sent!')
    } catch (error) {
      toast.error('Failed to upload photo')
      console.error(error)
    }
  }


  const formatMessageDate = (date: string | Date): string => {
    return format(new Date(date), 'MMMM d, yyyy')
  }

  const groupMessagesByDate = (): Record<string, Message[]> => {
    const grouped: Record<string, Message[]> = {}
    messages.forEach((message) => {
      const date = formatMessageDate(message.created_at)
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(message)
    })
    return grouped
  }

  // Get display data based on chat type
  const photos = isChatType 
    ? (chat?.profile?.photos || [])
    : (match?.otherUser?.photos || [])
  const otherUserName = isChatType
    ? (chat?.profile?.name || 'User')
    : (match?.otherUser?.full_name || match?.otherUser?.email?.split('@')[0] || 'User')
  const otherUserAge = isChatType
    ? (chat?.profile?.age?.toString() || '')
    : (match?.otherUser?.age?.toString() || '')
  const otherUserLocation = isChatType
    ? ''
    : (match?.otherUser?.location || '')
  const isOnline = isChatType
    ? (chat?.profile?.is_online || false)
    : true // For matches, assume online for now

  if (loading || (!match && !chat)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F3EDF7' }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const groupedMessages = groupMessagesByDate()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50 max-w-4xl mx-auto w-full shadow-sm">
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={(e) => {
              e.preventDefault()
              router.replace('/matches')
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>

          {/* Profile Pictures Grid */}
          {photos.length > 0 && (
            <div className="flex gap-1">
              {photos.slice(0, 4).map((photo, index) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={index}
                  src={photo}
                  alt={otherUserName}
                  className="w-8 h-8 rounded object-cover"
                />
              ))}
            </div>
          )}

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-gray-900 truncate">
                {otherUserName}{otherUserAge && `, ${otherUserAge}`}
              </h2>
              {!isChatType && match?.otherUser?.verification_badge && (
                <CheckCircle2 className="w-4 h-4 text-green-500 fill-green-500 flex-shrink-0" />
              )}
              {/* Online indicator */}
              {isOnline && (
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
              )}
            </div>
            {photos.length > 0 && (
              <p className="text-xs text-gray-600">{photos.length} {photos.length === 1 ? 'photo' : 'photos'}</p>
            )}
            {otherUserLocation && (
              <p className="text-xs text-gray-600 truncate">{otherUserLocation}</p>
            )}
          </div>

          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide max-w-4xl mx-auto w-full pb-20 bg-transparent">
        {Object.entries(groupedMessages).map(([date, dateMessages]) => (
          <div key={date}>
            {/* Date Header */}
            <div className="text-center mb-4">
              <span className="text-xs text-gray-500 bg-white px-3 py-1 rounded-full">
                {date}
              </span>
            </div>

            {/* Messages for this date */}
            {dateMessages.map((message: Message) => {
              const isOwn = message.sender_id === user?.id
              return (
                <div
                  key={message.id}
                  className={`flex mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl shadow-sm ${
                      isOwn
                        ? 'bg-white text-gray-900 border border-gray-200 shadow-md'
                        : 'bg-gray-100 text-gray-900 border border-gray-200'
                    }`}
                  >
                    {message.photo_url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={message.photo_url}
                        alt="Shared photo"
                        className="rounded-lg mb-2 max-w-full"
                      />
                    )}
                    {message.content && (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    )}
                    <div className="flex items-center justify-end gap-1 mt-1">
                      <p className="text-xs text-gray-500">
                        {format(new Date(message.created_at), 'HH:mm')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ))}
        <div ref={messagesEndRef} />
        {/* Report Link */}
        <div className="text-center mt-4 mb-2">
          <button className="text-xs text-gray-500 hover:text-gray-700 underline">
            Report
          </button>
        </div>
      </div>

      {/* Message Input Bar */}
      <div className="bg-white border-t border-gray-200 fixed bottom-16 left-0 right-0 z-40 shadow-lg">
        {/* Free Messages & Points Display (only for chats) */}
        {isChatType && (
          <div className="max-w-4xl mx-auto w-full px-4 pt-3 pb-2">
            <div className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-2 border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-700">
                    Free: <span className="font-bold text-gray-900">{freeMessagesRemaining}/5</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-gray-600" />
                  <span className="text-xs text-gray-700">
                    Points: <span className="font-bold text-gray-900">{pointsBalance}</span>
                  </span>
                </div>
              </div>
              {freeMessagesRemaining === 0 && pointsBalance < 10 && (
                <button
                  onClick={() => router.push('/premium')}
                  className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                >
                  Buy Points
                </button>
              )}
            </div>
          </div>
        )}
        <div className="max-w-4xl mx-auto w-full px-4 py-3">
          <div className="flex items-center gap-2">
            {/* Camera Icon */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
            >
              <Camera className="w-5 h-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />

            {/* Text Input */}
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage(newMessage)
                }
              }}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm transition-all"
            />

            {/* Action Icons */}
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
              <Smile className="w-5 h-5" />
            </button>
            <button className="px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
              <span className="text-xs font-bold">GIF</span>
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0">
              <Mic className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
