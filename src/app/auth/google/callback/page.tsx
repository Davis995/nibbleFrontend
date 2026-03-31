"use client"

import { useEffect, useState } from "react"
import { getSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import toast from "react-hot-toast"
import { useAuth } from "@/components/providers/AuthContext"

export default function GoogleCallbackPage() {
  const [isLoading, setIsLoading] = useState(true)
  const { setSession, redirectToDashboardByRole } = useAuth()

  useEffect(() => {
    let isMounted = true

    const sendToken = async () => {
      const session = await getSession()
      const token = (session as any)?.id_token
      if (!token) {
        toast.error("Unable to retrieve login token from Google session.")
        if (isMounted) setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/google-login/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        })

        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || "Google login failed")
        }

        const data = await res.json()
        console.log("Google login response:", data)
        if (!data || !data.tokens || !data.user) {
          throw new Error("Google login response did not include required auth payload")
        }

        // Persist session in AuthContext/localStorage
        setSession({ user: data.user, tokens: data.tokens })

        toast.success(data.message || "Signed in with Google")

        // Check onboarding status
        const adminRoles = ['school_admin', 'school-admin', 'admin'];
        if (data.user?.is_superuser) {
          window.location.href = '/admin/tools';
        } else if (data.user.onboarding === false && !adminRoles.includes(data.user.role?.toLowerCase())) {
          window.location.href = "/onboarding"
        } else {
          redirectToDashboardByRole(data.user.role)
        }
      } catch (error: any) {
        console.error(error)
        toast.error(error?.message || "Google login failed")
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    sendToken()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-white/60" />
        <p className="text-white/70">Signing in with Google...</p>
      </div>
    </div>
  )
}
