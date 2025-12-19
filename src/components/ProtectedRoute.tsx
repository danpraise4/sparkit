'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '../context/AuthContext'
import LoadingSpinner from './LoadingSpinner'
import { useEffect, ReactNode } from 'react'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    // If no user, redirect to login (except for public pages)
    if (!user) {
      const publicPaths = ['/login', '/signup', '/verify-otp', '/auth/callback']
      if (!publicPaths.includes(pathname)) {
        router.push('/login')
      }
      return
    }

    // If user is logged in and on login/signup pages, redirect to discover
    if (user && (pathname === '/login' || pathname === '/signup')) {
      router.push('/discover')
      return
    }
  }, [user, loading, pathname, router])

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    // Allow public pages
    const publicPaths = ['/login', '/signup', '/verify-otp', '/auth/callback']
    if (publicPaths.includes(pathname)) {
      return children
    }
    return <LoadingSpinner />
  }

  // User is authenticated - allow access to all pages
  return children
}

export default ProtectedRoute
