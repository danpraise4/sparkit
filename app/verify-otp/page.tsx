'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Sparkles, ArrowLeft } from 'lucide-react'
import LoadingSpinner from '@/src/components/LoadingSpinner'

interface VerifyOTPFormData {
  otp: string
}

function VerifyOTPForm() {
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const { verifyOTP, resendOTP, user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams?.get('email') || ''
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<VerifyOTPFormData>()

  // useEffect(() => {
  //   if (user) {
  //     router.push('/onboarding')
  //   }
  // }, [user, router])

  const otpValue = watch('otp') || ''

  // Auto-advance to next input when typing
  const handleOTPChange = (value: string, index: number) => {
    const digits = value.replace(/\D/g, '').slice(0, 1)
    const currentOtp = otpValue.split('')
    currentOtp[index] = digits
    const newOtp = currentOtp.join('').slice(0, 6)
    setValue('otp', newOtp, { shouldValidate: true })
    
    // Auto-focus next input
    if (digits && index < 5) {
      setTimeout(() => {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        nextInput?.focus()
      }, 0)
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    setValue('otp', pastedData, { shouldValidate: true })
    
    // Focus the last filled input or the first empty one
    const focusIndex = Math.min(pastedData.length, 5)
    setTimeout(() => {
      const nextInput = document.getElementById(`otp-${focusIndex}`)
      nextInput?.focus()
    }, 0)
  }

  const onSubmit = async (data: VerifyOTPFormData) => {
    if (!email) {
      toast.error('Email is required')
      router.push('/signup')
      return
    }

    if (data.otp.length !== 6) {
      toast.error('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)
    try {
      const { error } = await verifyOTP(email, data.otp)
      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid verification code'
        toast.error(errorMessage)
      } else {
        toast.success('Email verified successfully!')
        // User will be redirected by useEffect when user state updates
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) {
      toast.error('Email is required')
      return
    }

    setResending(true)
    try {
      const { error } = await resendOTP(email)
      if (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to resend code'
        toast.error(errorMessage)
      } else {
        toast.success('Verification code resent! Check your email.')
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setResending(false)
    }
  }

  if (loading && user) {
    return <LoadingSpinner />
  }

  const otpDigits = (otpValue || '').split('').concat(Array(6).fill('')).slice(0, 6)

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Spark
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600">
            We sent a 6-digit code to <span className="font-semibold">{email || 'your email'}</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                Enter verification code
              </label>
              <div className="flex justify-center gap-3">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otpDigits[index] || ''}
                    onChange={(e) => handleOTPChange(e.target.value, index)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
                        const prevInput = document.getElementById(`otp-${index - 1}`)
                        prevInput?.focus()
                      }
                    }}
                    className="w-12 h-14 text-center text-2xl font-bold bg-white border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-gray-900"
                    autoFocus={index === 0}
                  />
                ))}
              </div>
              <input
                type="hidden"
                {...register('otp', {
                  required: 'Verification code is required',
                  minLength: {
                    value: 6,
                    message: 'Please enter the complete 6-digit code'
                  }
                })}
              />
              {errors.otp && (
                <p className="mt-2 text-sm text-red-600 text-center">{errors.otp.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otpValue.length !== 6}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn&apos;t receive the code?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-primary-600 font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resending ? 'Sending...' : 'Resend Code'}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to sign up</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyOTP() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <LoadingSpinner />
      </div>
    }>
      <VerifyOTPForm />
    </Suspense>
  )
}

