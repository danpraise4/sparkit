'use client'

import { useState } from 'react'
import { X, CreditCard, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'
import type { Profile } from '../types'

interface CreditPackage {
  credits: number
  price: number
  originalPrice: number
  label?: string
}

interface TopUpModalProps {
  onClose: () => void
  onSuccess?: () => void
  requiredCredits: number
  profile: Profile
}

const TopUpModal = ({ onClose, onSuccess, requiredCredits, profile }: TopUpModalProps) => {
  const { user } = useAuth()
  const [selectedPayment, setSelectedPayment] = useState<'credit_card' | 'paypal'>('credit_card')
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [processing, setProcessing] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const photos = profile?.photos || []
  const profileName = profile?.full_name || profile?.email?.split('@')[0] || 'her'

  const creditPackages = [
    { credits: 100, price: 500, originalPrice: 2250, label: 'POPULAR' },
    { credits: 450, price: 2000, originalPrice: 2250 },
    { credits: 3050, price: 6900, originalPrice: 15250, label: 'BEST VALUE' },
    { credits: 1350, price: 4000, originalPrice: 6750 },
  ]

  const handlePurchase = async () => {
    if (!user || !selectedPackage) {
      if (!selectedPackage) {
        toast.error('Please select a credit package')
      }
      return
    }

    setProcessing(true)
    try {
      // In a real app, you'd integrate with a payment provider here
      // For now, we'll just add credits directly (mock payment)
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()

      const currentCredits = (currentProfile as { credits?: number })?.credits || 0
      const newCredits = currentCredits + selectedPackage.credits

      const { error } = await supabase
        .from('profiles')
        .update({ credits: newCredits })
        .eq('id', user.id)

      if (error) throw error

      toast.success(`Successfully purchased ${selectedPackage.credits} credits!`)
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error('Error purchasing credits:', error)
      toast.error('Failed to purchase credits')
    } finally {
      setProcessing(false)
    }
  }

  const nextPhoto = () => {
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1)
    }
  }

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: '#F3EDF7' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-900" />
          </button>
          <h2 className="text-lg font-bold text-gray-900">Top-up your credits</h2>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>

        <div className="p-6">
          {/* Profile Picture Carousel */}
          <div className="relative flex items-center justify-center mb-4">
            {photos.length > 1 && (
              <button
                onClick={prevPhoto}
                disabled={currentPhotoIndex === 0}
                className="absolute left-0 p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
            )}
            
            {photos.length > 0 ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={photos[currentPhotoIndex]}
                alt={profileName}
                className="w-24 h-24 rounded-full object-cover mx-auto"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-200 to-pink-200 flex items-center justify-center mx-auto">
                <span className="text-3xl">👤</span>
              </div>
            )}

            {photos.length > 1 && (
              <button
                onClick={nextPhoto}
                disabled={currentPhotoIndex === photos.length - 1}
                className="absolute right-0 p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
            )}
          </div>

          {/* Message */}
          <p className="text-sm text-gray-700 text-center mb-4">
            You need {requiredCredits} credits to let {profileName === 'her' ? 'her' : profileName} know {profileName === 'her' ? "she's" : "they're"} your crush.
          </p>

          {/* Photo dots indicator */}
          {photos.length > 1 && (
            <div className="flex justify-center gap-1 mb-6">
              {photos.map((_: string, index: number) => (
                <div
                  key={index}
                  className={`rounded-full transition-all ${
                    index === currentPhotoIndex
                      ? 'bg-gray-900 w-2 h-2'
                      : 'bg-gray-300 w-1.5 h-1.5'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Payment Method Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setSelectedPayment('credit_card')}
              className={`flex-1 py-3 text-center font-medium transition-colors border-b-2 ${
                selectedPayment === 'credit_card'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Credit card</span>
              </div>
            </button>
            <button
              onClick={() => setSelectedPayment('paypal')}
              className={`flex-1 py-3 text-center font-medium transition-colors border-b-2 ${
                selectedPayment === 'paypal'
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-bold">PayPal</span>
              </div>
            </button>
          </div>

          {/* Credit Packages */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {creditPackages.map((pkg, index) => (
              <button
                key={index}
                onClick={() => setSelectedPackage(pkg)}
                className={`relative p-4 border-2 rounded-xl text-left transition-all ${
                  selectedPackage?.credits === pkg.credits
                    ? 'border-purple-600 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {pkg.label && (
                  <span className="absolute -top-2 left-2 bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                    {pkg.label}
                  </span>
                )}
                <div className="mt-2">
                  <p className="text-2xl font-bold text-gray-900">{pkg.credits}</p>
                  <p className="text-xs text-gray-500 mb-1">credits</p>
                  <p className="text-lg font-bold text-gray-900">{pkg.price}N</p>
                  <p className="text-xs text-gray-400 line-through">{pkg.originalPrice}N</p>
                </div>
              </button>
            ))}
          </div>

          {/* Continue Button */}
          <button
            onClick={handlePurchase}
            disabled={!selectedPackage || processing}
            className="w-full bg-gray-900 text-white py-4 rounded-xl font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : 'Continue'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default TopUpModal

