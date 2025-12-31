'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '@/src/components/AdminLayout'

export default function AdminDashboard() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to messages by default
    router.push('/admin/messages')
  }, [router])

  return (
    <AdminLayout>
      <div className="p-6">
        <p>Redirecting to messages...</p>
      </div>
    </AdminLayout>
  )
}

