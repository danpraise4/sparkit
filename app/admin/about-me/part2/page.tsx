'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/src/components/AdminLayout'
import { useAuth } from '@/src/context/AuthContext'
import toast from 'react-hot-toast'

interface Question {
  id: number
  question: string
  type: 'radio' | 'checkbox'
  options: string[]
  selected?: string | string[]
}

export default function AdminAboutMePart2() {
  const { profile, updateProfile } = useAuth()
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 13,
      question: 'What is the hardest thing for you to accept in a man?',
      type: 'radio',
      options: [
        'Jealousy and control',
        'Lies and manipulation',
        'Selfishness and lack of involvement',
        'Different values and goals',
      ],
      selected: 'Jealousy and control',
    },
    {
      id: 14,
      question: 'What qualities do you value most in a man?',
      type: 'checkbox',
      options: [
        'Kindness',
        'Intelligence',
        'Sense of humor',
        'Passion',
      ],
      selected: ['Kindness'],
    },
    {
      id: 15,
      question: 'What type of relationship are you looking for?',
      type: 'radio',
      options: [
        'Light and casual',
        'Serious and long-term',
        'Friendship and communication',
        'No strings attached',
      ],
      selected: 'Light and casual',
    },
    {
      id: 16,
      question: 'How important are passion and physical intimacy in a relationship?',
      type: 'radio',
      options: [
        'Very important, I need that spark',
        'Important, but not everything',
        'Depends on the chemistry',
        'Not a priority for me',
      ],
      selected: 'Very important, I need that spark',
    },
    {
      id: 17,
      question: 'What kind of physical affection do you prefer?',
      type: 'radio',
      options: [
        'Cuddling, kissing, lots of touch',
        'Affectionate, but need personal space too',
        'Only in private settings',
        'Not a very touchy person',
        'Other',
      ],
      selected: 'Cuddling, kissing, lots of touch',
    },
    {
      id: 18,
      question: 'How confident are you in your ability to satisfy a man?',
      type: 'radio',
      options: [
        'Generally confident, I pay attention',
        'Very confident',
        'Somewhat confident, still learning',
        'Not very confident, need some guidance',
      ],
      selected: 'Generally confident, I pay attention',
    },
  ])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load existing data from profile
  useEffect(() => {
    if (profile?.profile_questions) {
      const questionsData = profile.profile_questions as Record<string, unknown>
      
      setQuestions((prev) =>
        prev.map((q) => {
          const key = `question_${q.id}`
          const savedValue = questionsData[key]
          
          if (savedValue !== undefined) {
            if (q.type === 'checkbox') {
              // Handle checkbox (array)
              if (Array.isArray(savedValue)) {
                return { ...q, selected: savedValue.filter((v): v is string => typeof v === 'string') }
              } else if (typeof savedValue === 'string') {
                try {
                  const parsed = JSON.parse(savedValue)
                  if (Array.isArray(parsed)) {
                    return { ...q, selected: parsed.filter((v): v is string => typeof v === 'string') }
                  }
                } catch {
                  return { ...q, selected: [savedValue] }
                }
              }
            } else {
              // Handle radio (string)
              if (typeof savedValue === 'string') {
                return { ...q, selected: savedValue }
              } else if (Array.isArray(savedValue) && savedValue.length > 0) {
                return { ...q, selected: String(savedValue[0]) }
              }
            }
          }
          return q
        })
      )
    }
    setLoading(false)
  }, [profile])

  const handleAnswerChange = (questionId: number, value: string | string[]) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, selected: value } : q
      )
    )
  }

  const handleSave = async () => {
    if (!profile) return

    try {
      setSaving(true)
      const answers: Record<string, string | string[]> = {}
      questions.forEach((q) => {
        if (q.selected) {
          answers[`question_${q.id}`] = q.selected
        }
      })

      const existingQuestions = (profile.profile_questions as Record<string, string | string[]>) || {}
      const updatedQuestions: Record<string, string | string[]> = {
        ...existingQuestions,
        ...answers,
      }
      
      await updateProfile({
        profile_questions: updatedQuestions as Record<string, string>,
      })

      toast.success('Answers saved successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to save answers')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 max-w-4xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">About me - Part 2</h1>

        <div className="space-y-6">
          {questions.map((question) => (
            <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Question {question.id}: {question.question}
              </h3>
              <div className="space-y-2">
                {question.type === 'radio' ? (
                  question.options.map((option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        question.selected === option
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={option}
                        checked={question.selected === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-5 h-5 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))
                ) : (
                  question.options.map((option) => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                        (question.selected as string[])?.includes(option)
                          ? 'bg-purple-100 border-2 border-purple-500'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        value={option}
                        checked={(question.selected as string[])?.includes(option) || false}
                        onChange={(e) => {
                          const current = (question.selected as string[]) || []
                          const updated = e.target.checked
                            ? [...current, option]
                            : current.filter((v) => v !== option)
                          handleAnswerChange(question.id, updated)
                        }}
                        className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                      />
                      <span className="text-gray-700">{option}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

