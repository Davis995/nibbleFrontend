"use client"

import React, { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/AuthContext"
import Link from "next/link"

function PaymentStatusContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { tokens, user, isLoading: authLoading, updateOnboarding, updateOrgOrientation } = useAuth()
    const [status, setStatus] = useState<"loading" | "success" | "failed">("loading")
    const orderTrackingId = searchParams.get("OrderTrackingId")

    const getDashboardPath = () => {
        if (!user) return "/student/dashboard"
        // Use user.role instead of user.user_type for accurate routing
        switch (user.role) {
            case "school_admin":
            case "operator":
                return "/school/dashboard"
            case "teacher":
                return "/teacher/dashboard"
            case "student":
                return "/student/dashboard"
            default:
                // Fallback based on user_type if role doesn't match
                return user.user_type === "enterprise" ? "/school/dashboard" : "/student/dashboard"
        }
    }

    useEffect(() => {
        if (!orderTrackingId) {
            setStatus("failed")
            return
        }

        const checkStatus = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                const response = await fetch(`${baseUrl}/api/v1/payments/status/?orderTrackingId=${orderTrackingId}`, {
                    headers: {
                        ...(tokens?.access && { Authorization: `Bearer ${tokens.access}` })
                    }
                })

                if (!response.ok) throw new Error("Failed to verify status")
                const data = await response.json()
                
                if (data.status === "complete") {
                    setStatus("success")
                    
                    // CRITICAL: Update local state to prevent redirect loops back to onboarding
                    updateOnboarding(true)
                    if (user?.role === "school_admin" || user?.role === "operator" || user?.user_type === "enterprise") {
                        updateOrgOrientation(true)
                    }

                    // Wait for auth to be ready before getting path and redirecting
                    if (!authLoading) {
                        setTimeout(() => {
                            router.push(getDashboardPath())
                        }, 2000)
                    }
                } else {
                    setStatus("failed")
                }
            } catch (err) {
                console.error("Verification error:", err)
                setStatus("failed")
            }
        }

        if (tokens?.access) {
            checkStatus()
        }
    }, [orderTrackingId, tokens, authLoading, user?.role, user?.user_type, updateOnboarding, updateOrgOrientation])

    const dashboardPath = getDashboardPath()

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100">
                <div className="flex justify-center mb-8">
                    {status === "success" ? (
                        <CheckCircle2 className="w-20 h-20 text-green-500 animate-in zoom-in duration-500" />
                    ) : status === "failed" ? (
                        <XCircle className="w-20 h-20 text-red-500 animate-pulse" />
                    ) : (
                        <Loader2 className="w-20 h-20 text-indigo-600 animate-spin" />
                    )}
                </div>
                
                <h1 className="text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">
                    {status === "success" ? "Payment Successful!" : status === "failed" ? "Payment Failed" : "Verifying Payment..."}
                </h1>
                
                <p className="text-slate-600 mb-10 leading-relaxed">
                    {status === "success" 
                        ? "Thank you for your business. We're getting your workspace ready and redirecting you now." 
                        : status === "failed" 
                        ? "We couldn't confirm your transaction at this moment. Please double check your bank statement or try again."
                        : "Please wait a moment while we synchronize with the payment provider."}
                </p>

                <div className="space-y-4">
                    {status !== "loading" && (
                        <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-14 rounded-2xl font-bold text-lg transition-transform active:scale-95 shadow-lg shadow-indigo-200">
                            <Link href={dashboardPath || "/student/dashboard"}>
                                Go to Dashboard
                            </Link>
                        </Button>
                    )}
                    
                    {status === "failed" && (
                        <Button variant="ghost" onClick={() => window.location.reload()} className="w-full h-12 rounded-xl text-slate-500">
                            Retry Verification
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function PaymentStatusPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin text-indigo-600 w-12 h-12" /></div>}>
            <PaymentStatusContent />
        </Suspense>
    )
}
