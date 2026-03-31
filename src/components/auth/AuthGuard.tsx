"use client"

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthContext'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, tokens, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (isLoading) return

    const isAuthenticated = !!(user && tokens?.access)

    if (requireAuth && !isAuthenticated) {
      // Store the current path for redirect after login
      sessionStorage.setItem('redirectAfterLogin', pathname)
      router.push('/login')
      return
    }

    if (!requireAuth && isAuthenticated) {
      // If on auth page but already authenticated, redirect to dashboard
      const redirectTo = sessionStorage.getItem('redirectAfterLogin') || getDefaultRedirect(user?.role)
      sessionStorage.removeItem('redirectAfterLogin')
      router.push(redirectTo)
      return
    }

    setIsChecking(false)
  }, [user, tokens, isLoading, requireAuth, router, pathname])

  // Set auth cookie for middleware
  useEffect(() => {
    if (tokens?.access) {
      document.cookie = `auth-token=${tokens.access}; path=/; max-age=86400; samesite=strict`
    } else {
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    }
  }, [tokens])

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return <>{children}</>
}

function getDefaultRedirect(role?: string): string {
  switch (role) {
    case 'student':
      return '/student/dashboard'
    case 'teacher':
      return '/teacher/dashboard'
    case 'school_admin':
      return '/school/dashboard'
    default:
      return '/student/dashboard'
  }
}