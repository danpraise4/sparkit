'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/src/context/AuthContext'
import { supabase } from '@/src/lib/supabase'
import AdminLayout from '@/src/components/AdminLayout'
import toast from 'react-hot-toast'

interface WithdrawalMethod {
  id: string
  type: 'gcash' | 'paymaya' | 'coinsph' | 'usdt' | 'capitalist'
  phone_number?: string
  wallet_address?: string
  account?: string
}

export default function AdminSettings() {
  const { user, profile } = useAuth()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [translateMessages, setTranslateMessages] = useState(false)
  const [messageLanguage, setMessageLanguage] = useState<'ENG' | 'RUS'>('ENG')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [withdrawals, setWithdrawals] = useState<WithdrawalMethod[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchWithdrawals()
  }, [user])

  const fetchSettings = async () => {
    if (!user) return

    // TODO: Fetch actual settings from database
    // For now using default values
  }

  const fetchWithdrawals = async () => {
    if (!user) return

    // TODO: Fetch actual withdrawal methods from database
    // For now using placeholder data
    setWithdrawals([
      { id: '1', type: 'gcash', phone_number: '0XXXXXXXXXX' },
      { id: '2', type: 'paymaya', phone_number: '0XXXXXXXXXX' },
      { id: '3', type: 'coinsph', phone_number: '09XXXXXXXXX' },
      { id: '4', type: 'usdt', wallet_address: 'TBCZPdkHLnA3nCJ' },
      { id: '5', type: 'capitalist', account: 'YXXXXXXXXXXXXXXXXXXX' },
    ])
  }

  const handleSaveEmailNotifications = async () => {
    setSaving(true)
    try {
      // TODO: Save email notification preference
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('Settings saved')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !repeatPassword) {
      toast.error('Please fill all fields')
      return
    }

    if (newPassword !== repeatPassword) {
      toast.error('Passwords do not match')
      return
    }

    setSaving(true)
    try {
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw error

      toast.success('Password updated successfully')
      setCurrentPassword('')
      setNewPassword('')
      setRepeatPassword('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveLanguage = async () => {
    setSaving(true)
    try {
      // TODO: Save language preference
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('Settings saved')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveTranslate = async () => {
    setSaving(true)
    try {
      // TODO: Save translate preference
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('Settings saved')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePushNotifications = async () => {
    setSaving(true)
    try {
      // TODO: Save push notification preference
      await new Promise(resolve => setTimeout(resolve, 500))
      toast.success('Settings saved')
    } catch (error) {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteWithdrawal = async (id: string) => {
    try {
      setWithdrawals(prev => prev.filter(w => w.id !== id))
      // TODO: Delete from database
      toast.success('Withdrawal method deleted')
    } catch (error) {
      toast.error('Failed to delete')
    }
  }

  const getWithdrawalLabel = (type: string) => {
    const labels: Record<string, string> = {
      gcash: 'Gcash',
      paymaya: 'Smart PayMaya',
      coinsph: 'Coins.ph Wallet',
      usdt: 'USDT TRC20 Wallet',
      capitalist: 'Capitalist USDT TRC20 Account',
    }
    return labels[type] || type
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="space-y-8">
          {/* Change Password */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Change password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repeat new password
                </label>
                <input
                  type="password"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handleSavePassword}
                disabled={saving}
                className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
              >
                Save
              </button>
            </div>
          </div>

          {/* Input Message Text Language */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Input message text language</h2>
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setMessageLanguage('ENG')}
                className={`px-6 py-2 rounded-lg border-2 font-semibold transition-colors ${
                  messageLanguage === 'ENG'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                ENG
              </button>
              <button
                onClick={() => setMessageLanguage('RUS')}
                className={`px-6 py-2 rounded-lg border-2 font-semibold transition-colors ${
                  messageLanguage === 'RUS'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                RUS
              </button>
            </div>
            <button
              onClick={handleSaveLanguage}
              disabled={saving}
              className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          </div>

          {/* Incoming Messages */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Incoming messages</h2>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700">Translate incoming messages</span>
              <button
                onClick={() => {
                  setTranslateMessages(!translateMessages)
                  handleSaveTranslate()
                }}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  translateMessages ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    translateMessages ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={handleSaveTranslate}
              disabled={saving}
              className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          </div>

          {/* Push Notifications */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Push-notifications</h2>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Receive notifications</span>
              <button
                onClick={() => {
                  setPushNotifications(!pushNotifications)
                  handleSavePushNotifications()
                }}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  pushNotifications ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    pushNotifications ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* E-mail Notifications */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">E-mail notifications</h2>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-700">Recieve notifications</span>
              <button
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  emailNotifications ? 'bg-green-500' : 'bg-red-500'
                }`}
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    emailNotifications ? 'translate-x-7' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
            <button
              onClick={handleSaveEmailNotifications}
              disabled={saving}
              className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
            >
              Save
            </button>
          </div>

          {/* Withdrawals */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Withdrawals</h2>
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">
                      {getWithdrawalLabel(withdrawal.type)}
                    </h3>
                    {withdrawal.type === 'usdt' && (
                      <button
                        onClick={() => handleDeleteWithdrawal(withdrawal.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        delete
                      </button>
                    )}
                  </div>
                  {withdrawal.phone_number && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone number:
                      </label>
                      <input
                        type="text"
                        value={withdrawal.phone_number}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  )}
                  {withdrawal.wallet_address && (
                    <div>
                      <input
                        type="text"
                        value={withdrawal.wallet_address}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  )}
                  {withdrawal.account && (
                    <div>
                      <input
                        type="text"
                        value={withdrawal.account}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Password to Confirm */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Password to confirm</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password to confirm:
              </label>
              <input
                type="password"
                placeholder="Password"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors">
              Save
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

