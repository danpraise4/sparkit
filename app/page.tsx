'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Sparkles, Shield, MessageCircle } from 'lucide-react'
import { useAuth } from '@/src/context/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Landing() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push('/discover')
    }
  }, [user, router])

  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-primary-600" />
          <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
            Spark
          </span>
        </div>
        <div className="flex gap-2 sm:gap-4">
          <Link
            href="/login"
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-gray-700 hover:text-primary-600 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-4 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-base bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors shadow-lg"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-primary-600 via-secondary-600 to-primary-600 bg-clip-text text-transparent animate-float">
              Find Your Spark
            </h1>
            <p className="text-base sm:text-xl md:text-2xl text-gray-600 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
              Connect with amazing people and discover meaningful relationships. 
              Your perfect match is just a swipe away.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
              <Link
                href="/signup"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-primary-600 text-white rounded-full text-base sm:text-lg font-semibold hover:bg-primary-700 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 touch-manipulation"
              >
                Start Matching
              </Link>
              <Link
                href="/login"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white text-primary-600 rounded-full text-base sm:text-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition-all touch-manipulation"
              >
                Sign In
              </Link>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <div className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <Heart className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Matching</h3>
              <p className="text-gray-600">
                Our algorithm finds compatible matches based on interests, location, and preferences.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <MessageCircle className="w-12 h-12 text-secondary-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Real-Time Chat</h3>
              <p className="text-gray-600">
                Connect instantly with your matches through our secure messaging platform.
              </p>
            </div>
            <div className="p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Safe & Secure</h3>
              <p className="text-gray-600">
                Your safety is our priority. Report and block features keep you in control.
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}

