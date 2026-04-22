"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthContext'
import { OnboardingScreen } from '@/components/auth/OnboardingScreen'
import { Loader2, Sparkles } from 'lucide-react'

interface OnboardingGuardProps {
  children: React.ReactNode
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, isLoading } = useAuth()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!isLoading) {
      setIsChecking(false)
    }
  }, [isLoading])

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
        <p className="text-white/60 font-medium animate-pulse">Syncing magic...</p>
      </div>
    )
  }

  // If user is not onboarded, show the onboarding screen
  if (user && user.onboarding === false) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] bg-violet-600/20 mix-blend-screen animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] bg-indigo-600/20 mix-blend-screen animate-pulse" />
        
        <div className="relative z-10 w-full max-w-4xl">
          <OnboardingScreen />
        </div>

        {/* Footer info */}
        <div className="absolute bottom-8 left-0 right-0 text-center opacity-30">
          <p className="text-xs text-white uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-3 h-3" />
            Empowering Education with AI
          </p>
        </div>
      </div>
    )
  }

  // Otherwise, render children (the dashboard)
  return <>{children}</>
}
