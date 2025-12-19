'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/src/context/AuthContext'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import BottomNav from '@/src/components/BottomNav'
import ProtectedRoute from '@/src/components/ProtectedRoute'

interface MoreAboutField {
  key: string
  label: string
  icon: string
  options?: string[]
  type: 'select' | 'text' | 'number'
}

const moreAboutFields: MoreAboutField[] = [
  { key: 'relationship_status', label: 'Relationship', icon: '❤️', type: 'select', options: ['Single', 'In a relationship', 'Married', 'Divorced', 'Widowed'] },
  { key: 'sexuality', label: 'Sexuality', icon: '⚥', type: 'select', options: ['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual', 'Asexual', 'Queer', 'Prefer not to say'] },
  { key: 'kids', label: 'Kids', icon: '👶', type: 'select', options: ['No kids', 'Has kids', 'Wants kids', "Doesn't want kids"] },
  { key: 'smoking', label: 'Smoking', icon: '🚬', type: 'select', options: ['Non-smoker', 'Social smoker', 'Smoker', 'Trying to quit'] },
  { key: 'drinking', label: 'Drinking', icon: '🍷', type: 'select', options: ['Non-drinker', 'Social drinker', 'Regular drinker'] },
  { key: 'languages', label: 'You speak', icon: '💬', type: 'text' },
  { key: 'height', label: 'Height', icon: '📏', type: 'number' },
  { key: 'star_sign', label: 'Star sign', icon: '⭐', type: 'select', options: ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] },
  { key: 'pets', label: 'Pets', icon: '🐾', type: 'select', options: ['No pets', 'Has pets', 'Likes pets', "Doesn't like pets"] },
  { key: 'religion', label: 'Religion', icon: '✝️', type: 'select', options: ['Christian', 'Muslim', 'Jewish', 'Hindu', 'Buddhist', 'Atheist', 'Agnostic', 'Other', 'Prefer not to say'] },
  { key: 'personality', label: 'Personality', icon: '🧠', type: 'select', options: ['Introvert', 'Extrovert', 'Ambivert'] },
  { key: 'education', label: 'Education level', icon: '🎓', type: 'select', options: ['High school', 'Some college', "Bachelor's degree", "Master's degree", 'PhD', 'Other'] },
]

export default function MoreAbout() {
  const { profile, updateProfile } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [fieldValue, setFieldValue] = useState<string>('')

  const handleFieldClick = (field: MoreAboutField) => {
    const currentValue = profile?.[field.key as keyof typeof profile]
    setFieldValue(typeof currentValue === 'string' ? currentValue : (typeof currentValue === 'number' ? currentValue.toString() : ''))
    setEditingField(field.key)
  }

  const handleSaveField = async (field: MoreAboutField) => {
    setSaving(true)
    try {
      const updateValue = field.type === 'number' ? parseInt(fieldValue) || 0 : fieldValue
      const { error } = await updateProfile({ [field.key]: updateValue })
      if (error) throw error
      toast.success('Updated successfully!')
      setEditingField(null)
    } catch (error) {
      console.error('Error updating field:', error)
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  const getFieldValue = (field: MoreAboutField): string => {
    const value = profile?.[field.key as keyof typeof profile]
    if (field.key === 'height' && typeof value === 'number') {
      return `${value} cm`
    }
    return typeof value === 'string' ? value : 'Not set'
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-purple-50 pb-20">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center sticky top-0 z-50">
          <button onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h1 className="text-lg font-semibold flex-1 text-gray-900">More about you</h1>
        </div>

        <div className="max-w-md mx-auto bg-white">
          {moreAboutFields.map((field, index) => (
            <div key={field.key}>
              {editingField === field.key ? (
                <div className="px-4 py-4">
                  {field.options ? (
                    <div className="space-y-2">
                      {field.options.map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setFieldValue(option)
                            handleSaveField(field)
                          }}
                          className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-colors ${
                            fieldValue === option
                              ? 'border-primary-600 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <span className={`font-medium ${fieldValue === option ? 'text-primary-600' : 'text-gray-900'}`}>
                            {option}
                          </span>
                        </button>
                      ))}
                      <button
                        onClick={() => setEditingField(null)}
                        className="w-full mt-2 text-gray-600 hover:text-gray-900"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type={field.type}
                        value={fieldValue}
                        onChange={(e) => setFieldValue(e.target.value)}
                        placeholder={`Enter ${field.label.toLowerCase()}`}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveField(field)}
                          disabled={saving}
                          className="flex-1 bg-gray-900 text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    const routes: Record<string, string> = {
                      relationship_status: '/profile/edit/relationship-status',
                      sexuality: '/profile/edit/sexuality',
                      kids: '/profile/edit/kids',
                      smoking: '/profile/edit/smoking',
                      drinking: '/profile/edit/drinking',
                      languages: '/profile/edit/languages',
                      height: '/profile/edit/height',
                      star_sign: '/profile/edit/star-sign',
                      pets: '/profile/edit/pets',
                      religion: '/profile/edit/religion',
                      personality: '/profile/edit/personality',
                      education: '/profile/edit/education',
                      work: '/profile/edit/work',
                    }
                    const route = routes[field.key]
                    if (route) {
                      router.push(route)
                    } else {
                      handleFieldClick(field)
                    }
                  }}
                  className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <span className="text-xl">{field.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{field.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">{getFieldValue(field)}</span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </button>
              )}
              {index < moreAboutFields.length - 1 && editingField !== field.key && (
                <div className="border-b border-gray-200 mx-4"></div>
              )}
            </div>
          ))}
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  )
}

