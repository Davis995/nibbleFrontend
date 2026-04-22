"use client"

import React, { Suspense, useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import {
    CheckCircle2,
    ShieldCheck,
    ArrowRight,
    ArrowLeft,
    Loader2,
    AlertCircle
} from "lucide-react"
import { useTheme } from "@/components/providers/ThemeContext"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useAuth } from "@/components/providers/AuthContext"
import { usePlanPayment } from "@/hooks/usePlanPayment"

interface PlanFeature {
    id: number;
    text: string;
    included: boolean;
    highlight: boolean;
    order: number;
}

interface Plan {
    id: number;
    plan_id: string;
    name: string;
    description: string;
    use_type: string;
    theme: string;
    total_credits: number;
    max_users: number;
    monthly_price: string;
    annual_price: string;
    annual_billed: string;
    badge: string;
    cta: string;
    is_popular: boolean;
    is_active: boolean;
    display_order: number;
    currency: string;
    features: PlanFeature[];
}

function ConfirmationContent() {
    const { theme } = useTheme()
    const { tokens, user: authUser } = useAuth()
    const { initiatePlanPayment, isLoading: isPaymentLoading } = usePlanPayment()
    const isLight = theme === 'light'
    const searchParams = useSearchParams()

    const planId = searchParams.get('planId')
    const billingPeriod = (searchParams.get('period') as "monthly" | "annual") || "monthly"

    const [plan, setPlan] = useState<Plan | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!planId) {
            setError("No plan selected.")
            setLoading(false)
            return
        }

        const fetchPlan = async () => {
            setLoading(true)
            setError(null)
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                const res = await fetch(`${baseUrl}/api/v1/auth/plans/${planId}/`, {
                    headers: {
                        ...(tokens?.access && { Authorization: `Bearer ${tokens.access}` }),
                        "Content-Type": "application/json",
                    },
                })
                
                if (!res.ok) throw new Error("Failed to fetch plan details")
                
                const data = await res.json()
                setPlan(data)
            } catch (err) {
                console.error("Plan fetch error:", err)
                setError("Unable to load plan details.")
            } finally {
                setLoading(false)
            }
        }

        fetchPlan()
    }, [planId, tokens])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-500 animate-pulse">Loading confirmation details...</p>
            </div>
        )
    }

    if (error || !plan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8 text-center max-w-lg mx-auto">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <h2 className="text-xl font-bold">Error</h2>
                <p className="text-slate-500">{error || "Plan not found."}</p>
                <Link href="/school/billing/plans">
                    <button className="px-6 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors font-medium">Back to Plans</button>
                </Link>
            </div>
        )
    }

    const price = billingPeriod === "annual" ? plan.annual_price : plan.monthly_price
    const totalDue = billingPeriod === "annual" ? plan.annual_billed : plan.monthly_price

    const handleProceed = () => {
        // For school admins, organisation_id is required
        const organisationId = authUser?.organisation_id
        initiatePlanPayment({ plan, billingPeriod, organisationId })
    }

    return (
        <div className="max-w-2xl mx-auto py-12">
            <div className={cn(
                "rounded-2xl border overflow-hidden p-8 space-y-8",
                isLight ? "bg-white border-slate-200 shadow-xl" : "bg-slate-900 border-slate-800"
            )}>
                <div className="text-center">
                    <h1 className={cn("text-2xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>Confirm Subscription</h1>
                    <p className="text-slate-500">Review your plan details before proceeding to payment.</p>
                </div>

                <div className={cn(
                    "p-6 rounded-xl border flex justify-between items-center",
                    isLight ? "bg-slate-50 border-slate-200" : "bg-slate-800/50 border-slate-700"
                )}>
                    <div>
                        <p className="text-sm text-slate-500 uppercase font-bold tracking-wider mb-1">Selected Plan</p>
                        <h3 className={cn("text-xl font-bold", isLight ? "text-slate-900" : "text-white")}>{plan.name} Plan</h3>
                        <p className="text-sm text-slate-500">Billed {billingPeriod === "annual" ? "Annually" : "Monthly"}</p>
                    </div>
                    <div className="text-right">
                        <span className={cn("text-3xl font-bold", isLight ? "text-slate-900" : "text-white")}>{plan.currency || 'UGX'} {price}</span>
                        <span className="text-slate-500">/mo</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                        <span className={isLight ? "text-slate-600" : "text-slate-400"}>Subtotal ({billingPeriod === "annual" ? "Yearly" : "Monthly"})</span>
                        <span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{plan.currency || 'UGX'} {totalDue}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                        <span className={isLight ? "text-slate-600" : "text-slate-400"}>Tax (Estimated)</span>
                        <span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{plan.currency || 'UGX'} 0.00</span>
                    </div>
                    <div className="flex justify-between py-3">
                        <span className={cn("text-lg font-bold", isLight ? "text-slate-900" : "text-white")}>Total Due</span>
                        <span className={cn("text-lg font-bold text-blue-600")}>{plan.currency || 'UGX'} {totalDue}</span>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex gap-3 items-start">
                    <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        You will be redirected to our secure payment partner, Pesapal, to complete your transaction. No card details are stored on our servers.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button 
                        disabled={isPaymentLoading}
                        onClick={handleProceed}
                        className="w-full py-4 rounded-xl font-bold text-lg bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isPaymentLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" /> Processing...
                            </>
                        ) : (
                            <>
                                Proceed to Payment <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                    <Link href="/school/billing/plans" className="w-full">
                        <button className={cn(
                            "w-full py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2",
                            isLight ? "text-slate-600 hover:bg-slate-50" : "text-slate-400 hover:bg-slate-800"
                        )}>
                            <ArrowLeft className="w-4 h-4" /> Go Back
                        </button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function PlanConfirmation() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ConfirmationContent />
        </Suspense>
    )
}
