'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import toast from 'react-hot-toast'
import { Check, ArrowLeft, Sparkles, Zap, Gift, Star } from 'lucide-react'
import { motion } from 'framer-motion'

const POINT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    price: 10,
    points: 15,
    bonus: 0,
    value: 'Good value',
    color: 'purple',
    icon: Sparkles,
    popular: false
  },
  {
    id: 'popular',
    name: 'Popular',
    price: 50,
    points: 70,
    bonus: 5,
    value: 'Best value',
    color: 'pink',
    icon: Gift,
    popular: true
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 100,
    points: 150,
    bonus: 15,
    value: 'Best deal',
    color: 'indigo',
    icon: Star,
    popular: false
  }
]

export default function Premium() {
  const { user, profile } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [pointsBalance, setPointsBalance] = useState(0)

  useEffect(() => {
    fetchPointsBalance()
  }, [user])

  const fetchPointsBalance = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from('user_points')
        .select('balance')
        .eq('user_id', user.id)
        .maybeSingle()

      setPointsBalance(data?.balance || 0)
    } catch (error) {
      console.error('Error fetching points:', error)
    }
  }

  const handlePurchase = async (packageId: string) => {
    if (!user) {
      toast.error('Please log in to purchase points')
      return
    }

    const selectedPackage = POINT_PACKAGES.find(p => p.id === packageId)
    if (!selectedPackage) return

    setLoading(packageId)
    try {
      // TODO: Integrate with Flutterwave payment API here
      // For now, we'll simulate the purchase and add points directly
      
      // In production, you would:
      // 1. Create a payment transaction with Flutterwave
      // 2. Get payment reference
      // 3. After successful payment, add points via point_transactions table
      // 4. The trigger will automatically update user_points balance

      const totalPoints = selectedPackage.points + selectedPackage.bonus

      // Create point transaction
      const { error: transactionError } = await supabase
        .from('point_transactions')
        .insert({
          user_id: user.id,
          amount: totalPoints,
          type: 'purchase',
          description: `Purchased ${selectedPackage.points} points${selectedPackage.bonus > 0 ? ` + ${selectedPackage.bonus} bonus` : ''}`,
          payment_reference: `demo_${Date.now()}` // In production, use Flutterwave reference
        })

      if (transactionError) throw transactionError

      toast.success(`Successfully purchased ${totalPoints} points!`)
      fetchPointsBalance()

      // In production, redirect to Flutterwave payment page
      // window.location.href = flutterwavePaymentUrl
    } catch (error) {
      console.error('Error purchasing points:', error)
      toast.error('Failed to purchase points')
    } finally {
      setLoading(null)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-purple-100/50 px-4 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <button 
            onClick={() => router.back()} 
            className="p-2 hover:bg-purple-50 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1 text-center">
            Buy Points
          </h1>
          <div className="w-9"></div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Current Points Balance */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gray-900 text-white rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium opacity-90 mb-1">Your Points Balance</p>
                <p className="text-4xl font-bold">{pointsBalance}</p>
                <p className="text-xs opacity-75 mt-2">Use points to send messages after your 5 free daily messages</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <Zap className="w-8 h-8" />
              </div>
            </div>
          </motion.div>

          {/* Package Cards */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Choose Your Package
            </h2>
            <p className="text-base text-gray-600">
              Get more points and unlock unlimited conversations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-8">
            {POINT_PACKAGES.map((pkg, index) => {
              const Icon = pkg.icon
              const totalPoints = pkg.points + pkg.bonus
              const pointsPerDollar = (totalPoints / pkg.price).toFixed(1)

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-white rounded-3xl shadow-xl overflow-hidden transition-all hover:shadow-2xl ${
                    pkg.popular ? 'ring-4 ring-pink-500 scale-105 md:scale-110' : 'hover:scale-105'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 left-0 right-0 bg-gray-900 text-white text-center py-2 text-xs font-bold tracking-wide">
                      MOST POPULAR
                    </div>
                  )}

                  <div className={`p-6 ${pkg.popular ? 'pt-12' : 'pt-6'}`}>
                    {/* Icon */}
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gray-100">
                      <Icon className="w-8 h-8 text-gray-700" />
                    </div>

                    {/* Package Name */}
                    <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{pkg.name}</h3>
                    <p className="text-xs text-gray-500 text-center mb-4">{pkg.value}</p>

                    {/* Price */}
                    <div className="text-center mb-4">
                      <span className="text-4xl font-bold text-gray-900">${pkg.price}</span>
                    </div>

                    {/* Points */}
                    <div className="bg-gray-50 rounded-2xl p-4 mb-4 border border-gray-200">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">You Get</p>
                        <p className="text-3xl font-bold text-gray-900">
                          {totalPoints} Points
                        </p>
                        {pkg.bonus > 0 && (
                          <p className="text-xs text-green-600 font-semibold mt-1">
                            +{pkg.bonus} Bonus Points!
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {pointsPerDollar} points per $1
                        </p>
                      </div>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2 mb-6">
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{pkg.points} Base Points</span>
                      </li>
                      {pkg.bonus > 0 && (
                        <li className="flex items-center gap-2 text-sm text-gray-700">
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="font-semibold text-green-600">{pkg.bonus} Bonus Points</span>
                        </li>
                      )}
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>Instant Delivery</span>
                      </li>
                      <li className="flex items-center gap-2 text-sm text-gray-700">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>No Expiration</span>
                      </li>
                    </ul>

                    {/* Buy Button */}
                    <button
                      onClick={() => handlePurchase(pkg.id)}
                      disabled={loading === pkg.id}
                      className={`w-full py-4 rounded-xl font-bold text-white transition-all hover:opacity-90 shadow-lg ${
                        pkg.popular
                          ? 'bg-gray-900 hover:bg-gray-800'
                          : 'bg-gray-800 hover:bg-gray-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {loading === pkg.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </span>
                      ) : (
                        `Buy ${totalPoints} Points`
                      )}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-3xl shadow-lg p-6 mb-6"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-700" />
              How Points Work
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-gray-700 font-bold text-xs">1</span>
                </div>
                <p>You get <strong>5 free messages</strong> per conversation per day</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-gray-700 font-bold text-xs">2</span>
                </div>
                <p>After 5 free messages, each message costs <strong>10 points</strong></p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-gray-700 font-bold text-xs">3</span>
                </div>
                <p>Points never expire and can be used across all your conversations</p>
              </div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl shadow-lg p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  How do I use my points?
                </h3>
                <p className="text-sm text-gray-600">
                  Points are automatically deducted when you send messages after using your 5 free daily messages. Each message costs 10 points.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Do points expire?
                </h3>
                <p className="text-sm text-gray-600">
                  No, your points never expire. You can use them whenever you want, across all your conversations.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-sm text-gray-600">
                  We accept all major credit cards, debit cards, and mobile money. All payments are processed securely through Flutterwave.
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}
