'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'

const profileQuestions = [
  {
    key: 'looking_for',
    question: "What are you looking for?",
    options: ['A serious relationship', 'Something casual', 'Friends', 'Not sure yet']
  },
  {
    key: 'deal_breaker',
    question: "What's a deal breaker for you?",
    options: ['Smoking', 'Not having kids', 'Different values', 'Long distance', 'No deal breakers']
  },
  {
    key: 'ideal_date',
    question: "What's your ideal first date?",
    options: ['Coffee or drinks', 'Dinner', 'Outdoor activity', 'Something creative', 'Netflix and chill']
  },
]

export default function ProfileQuestions() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [answers, setAnswers] = useState<Record<string, string>>(
    (profile?.profile_questions as Record<string, string>) || {}
  )

  const handleAnswer = async (key: string, value: string) => {
    const newAnswers = { ...answers, [key]: value }
    setAnswers(newAnswers)
    
    setSaving(true)
    try {
      const { error } = await updateProfile({ profile_questions: newAnswers })
      if (error) throw error
      toast.success('Answer saved!')
    } catch (error) {
      console.error('Error saving answer:', error)
      toast.error('Failed to save answer')
    } finally {
      setSaving(false)
    }
  }

  const answeredCount = Object.keys(answers).filter(key => answers[key]).length

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50 pb-20">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center sticky top-0 z-50">
          <button onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-lg font-semibold flex-1 text-gray-900">Profile questions</h1>
        </div>

        <div className="max-w-md mx-auto px-4 py-6">
          <p className="text-sm text-gray-600 mb-6 text-center">
            {answeredCount} of {profileQuestions.length} questions answered
          </p>

          <div className="space-y-6">
            {profileQuestions.map((question) => (
              <div key={question.key} className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {question.question}
                </h3>
                <div className="space-y-2">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(question.key, option)}
                      disabled={saving}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                        answers[question.key] === option
                          ? 'border-primary-600 bg-primary-50 text-primary-600'
                          : 'border-gray-200 hover:border-gray-300 text-gray-900'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <button
              onClick={() => router.back()}
              className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
            >
              Done ({answeredCount}/{profileQuestions.length})
            </button>
          </div>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

