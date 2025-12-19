'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { ArrowLeft, ChevronRight, X } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'
import { motion, AnimatePresence } from 'framer-motion'

interface ControlExperienceSettings {
  whoCanMessage: 'everyone' | 'liked_only'
  showMeTo: 'everyone' | 'liked_only'
  readReceipts: boolean
  onlineStatus: boolean
}

const steps = [
  {
    id: 1,
    title: "Who can message you?",
    illustration: "📢",
    options: [
      { value: 'everyone', label: 'Everyone' },
      { value: 'liked_only', label: "People I've liked" }
    ],
    hint: "😉 If everyone can message you, you're more likely to get more matches.",
    field: 'whoCanMessage' as keyof ControlExperienceSettings
  },
  {
    id: 2,
    title: "Who can see you?",
    illustration: "👁️",
    options: [
      { value: 'everyone', label: 'Everyone' },
      { value: 'liked_only', label: "People I've liked" }
    ],
    hint: "💡 Showing your profile to everyone increases your chances of getting matches.",
    field: 'showMeTo' as keyof ControlExperienceSettings
  },
  {
    id: 3,
    title: "Read receipts",
    illustration: "✓✓",
    options: [
      { value: true, label: 'Enable read receipts' },
      { value: false, label: 'Disable read receipts' }
    ],
    hint: "📬 Let others know when you've read their messages.",
    field: 'readReceipts' as keyof ControlExperienceSettings
  },
  {
    id: 4,
    title: "Show online status",
    illustration: "🟢",
    options: [
      { value: true, label: "Show when I'm online" },
      { value: false, label: "Don't show online status" }
    ],
    hint: "💚 Let others see when you're active on Spark.",
    field: 'onlineStatus' as keyof ControlExperienceSettings
  }
]

export default function ControlExperience() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [settings, setSettings] = useState<ControlExperienceSettings>({
    whoCanMessage: (profile?.who_can_message as 'everyone' | 'liked_only') || 'everyone',
    showMeTo: (profile?.show_me_to as 'everyone' | 'liked_only') || 'everyone',
    readReceipts: profile?.read_receipts === true,
    onlineStatus: profile?.show_online_status === true,
  })
  const [saving, setSaving] = useState(false)

  const handleOptionSelect = (value: string | boolean) => {
    const step = steps[currentStep]
    if (step.field === 'readReceipts' || step.field === 'onlineStatus') {
      setSettings({ ...settings, [step.field]: value as boolean })
    } else {
      setSettings({ ...settings, [step.field]: value as 'everyone' | 'liked_only' })
    }
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSave()
    }
  }


  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await updateProfile({
        who_can_message: settings.whoCanMessage,
        show_me_to: settings.showMeTo,
        read_receipts: settings.readReceipts,
        show_online_status: settings.onlineStatus,
      })

      if (error) throw error
      toast.success('Settings saved successfully!')
      router.back()
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const currentStepData = steps[currentStep]
  const currentValue = settings[currentStepData.field]

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50 pb-20">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center sticky top-0 z-50">
          <button onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-lg font-semibold flex-1 text-gray-900">Control your experience</h1>
        </div>

        {/* Modal Overlay */}
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4 pointer-events-none">
          <AnimatePresence>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md pointer-events-auto"
            >
              {/* Close button */}
              <button
                onClick={() => router.back()}
                className="absolute top-4 left-4 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-900" />
              </button>

              <div className="p-6 pt-12">
                {/* Illustration */}
                <div className="flex justify-center mb-6">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-200 via-pink-200 to-yellow-200 rounded-2xl flex items-center justify-center">
                    <span className="text-6xl">{currentStepData.illustration}</span>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
                  {currentStepData.title}
                </h2>

                {/* Options */}
                <div className="space-y-3 mb-4">
                  {currentStepData.options.map((option, index) => {
                    const optionValue = typeof option.value === 'boolean' 
                      ? option.value 
                      : option.value
                    const isSelected = currentValue === optionValue

                    return (
                      <button
                        key={index}
                        onClick={() => handleOptionSelect(option.value)}
                        className={`w-full flex items-center justify-between px-4 py-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-gray-900 bg-gray-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className={`font-medium ${isSelected ? 'text-gray-900' : 'text-gray-600'}`}>
                          {option.label}
                        </span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Hint */}
                <p className="text-sm text-gray-600 text-center mb-6">
                  {currentStepData.hint}
                </p>

                {/* Navigation */}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {currentStep + 1}/{steps.length}
                  </div>
                  <button
                    onClick={handleNext}
                    disabled={saving}
                    className="w-12 h-12 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

