'use client'

import { useAuth } from '../context/AuthContext'

const DebugInfo = () => {
  const { user, profile, loading } = useAuth()
  
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-0 right-0 bg-black/80 text-white text-xs p-2 z-50 max-w-xs">
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>User: {user ? 'yes' : 'no'}</div>
        <div>Profile: {profile ? 'yes' : 'no'}</div>
      </div>
    )
  }
  return null
}

export default DebugInfo

