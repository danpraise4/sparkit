'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/src/lib/supabase'
import LoadingSpinner from '@/src/components/LoadingSpinner'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          // Check if interest preference exists
          const { data: interestPref } = await supabase
            .from('interest_preferences')
            .select('preference')
            .eq('user_id', session.user.id)
            .maybeSingle()

          // If no interest preference, redirect to interest selection
          if (!interestPref) {
            router.push('/onboarding/interest')
            return
          }

          // If interest preference exists, go to discover
          router.push('/discover')
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error handling auth callback:', error)
        router.push('/login')
      }
    }

    handleAuthCallback()
  }, [router])

  return <LoadingSpinner />
}

