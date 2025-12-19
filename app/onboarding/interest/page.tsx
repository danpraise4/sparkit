'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { Users, User } from 'lucide-react'
import ProtectedRoute from '@/src/components/ProtectedRoute'

export default function InterestSelection() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSelection = async (preference: 'men' | 'women' | 'both') => {
    if (!user) {
      toast.error('Please log in first')
      router.push('/login')
      return
    }

    setLoading(true)

    try {
      // Save interest preference
      const { error: prefError } = await supabase
        .from('interest_preferences')
        .upsert({
          user_id: user.id,
          preference,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (prefError) throw prefError

      // Also update profile for quick access
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ interest_preference: preference })
        .eq('id', user.id)

      if (profileError) {
        console.error('Error updating profile:', profileError)
        // Don't throw - preference is saved in interest_preferences table
      }

      toast.success('Preference saved!')
      router.push('/discover')
    } catch (error) {
      console.error('Error saving preference:', error)
      toast.error('Failed to save preference. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 w-full">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Who are you interested in?
            </h1>
            <p className="text-gray-600 text-lg">
              Select your preference to see matching profiles
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {/* Men Option */}
            <motion.button
              onClick={() => handleSelection('men')}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group bg-white rounded-2xl p-8 md:p-12 text-gray-900 overflow-hidden border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="relative z-10">
                <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10 md:w-12 md:h-12 text-gray-700" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Men</h2>
                <p className="text-gray-600 text-sm md:text-base">
                  Connect with men
                </p>
              </div>
            </motion.button>

            {/* Women Option */}
            <motion.button
              onClick={() => handleSelection('women')}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group bg-white rounded-2xl p-8 md:p-12 text-gray-900 overflow-hidden border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="relative z-10">
                <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-10 h-10 md:w-12 md:h-12 text-gray-700" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Women</h2>
                <p className="text-gray-600 text-sm md:text-base">
                  Connect with women
                </p>
              </div>
            </motion.button>

            {/* Both Option */}
            <motion.button
              onClick={() => handleSelection('both')}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative group bg-white rounded-2xl p-8 md:p-12 text-gray-900 overflow-hidden border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed md:col-span-1"
            >
              <div className="relative z-10">
                <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-10 h-10 md:w-12 md:h-12 text-gray-700" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Both</h2>
                <p className="text-gray-600 text-sm md:text-base">
                  Open to everyone
                </p>
              </div>
            </motion.button>
          </div>

          {loading && (
            <div className="text-center mt-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

