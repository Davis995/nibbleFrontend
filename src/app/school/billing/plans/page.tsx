"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import {
    Check,
    X,
    Cpu,
    Users,
    Shield,
    Loader2,
    AlertCircle
} from "lucide-react"
import { useTheme } from "@/components/providers/ThemeContext"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useAuth } from "@/components/providers/AuthContext"

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

export default function PlanSelection() {
    const { theme } = useTheme()
    const { tokens, user } = useAuth()
    const isLight = theme === 'light'
    
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [billingPeriod, setBillingPeriod] = useState<"annual" | "monthly">("monthly")

    useEffect(() => {
        const fetchPlans = async () => {
            setLoading(true)
            setError(null)
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                const res = await fetch(`${baseUrl}/api/v1/auth/plans/by-type/?use_type=enterprise`, {
                    headers: {
                        ...(tokens?.access && { Authorization: `Bearer ${tokens.access}` }),
                        "Content-Type": "application/json",
                    },
                })
                
                if (!res.ok) throw new Error("Failed to fetch plans")
                
                const data = await res.json()
                if (data.plans) {
                    const sortedPlans = (data.plans as Plan[])
                        .filter(p => p.plan_id !== 'free' && p.name.toLowerCase() !== 'free')
                        .sort((a: Plan, b: Plan) => (a.display_order || 0) - (b.display_order || 0))
                    setPlans(sortedPlans)
                } else {
                    throw new Error("Invalid data format")
                }
            } catch (err) {
                console.error("School Billing fetch error:", err)
                setError("Unable to load school plans. Please try again later.")
            } finally {
                setLoading(false)
            }
        }

        fetchPlans()
    }, [tokens])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-500 animate-pulse">Loading school plans...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20 max-w-2xl mx-auto">
                <AlertCircle className="w-12 h-12 text-red-600" />
                <h2 className="text-xl font-bold text-red-900 dark:text-red-400">Something went wrong</h2>
                <p className="text-red-700/80 dark:text-red-300/80">{error}</p>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-white border border-red-200 rounded-lg hover:bg-red-50 transition-colors font-medium">Try Again</button>
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto py-8">
            <div className="text-center space-y-4">
                <h1 className={cn("text-3xl font-bold", isLight ? "text-slate-900" : "text-white")}>Choose the Right Plan for Your School</h1>
                <p className={cn("text-lg max-w-2xl mx-auto", isLight ? "text-slate-600" : "text-slate-400")}>
                    Scalable solutions for schools of all sizes. Upgrade or downgrade at any time.
                </p>

                {/* Toggle Monthly/Yearly */}
                <div className="flex items-center justify-center gap-4 mt-6">
                    <span 
                        className={cn("text-sm font-medium cursor-pointer", billingPeriod === "monthly" ? (isLight ? "text-slate-900" : "text-white") : "text-slate-400")}
                        onClick={() => setBillingPeriod("monthly")}
                    >
                        Monthly
                    </span>
                    <div 
                        className="w-12 h-6 rounded-full bg-slate-200 dark:bg-slate-700 relative cursor-pointer"
                        onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
                    >
                        <motion.div 
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                            animate={{ left: billingPeriod === "monthly" ? "4px" : "24px" }}
                        />
                    </div>
                    <span 
                        className={cn("text-sm font-medium cursor-pointer", billingPeriod === "annual" ? (isLight ? "text-slate-900" : "text-white") : "text-slate-400")}
                        onClick={() => setBillingPeriod("annual")}
                    >
                        Yearly <span className="text-indigo-500 font-bold">(-27%)</span>
                    </span>
                </div>
            </div>

            {user?.subscription?.plan_name?.toLowerCase() === 'free' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8">
                    {plans.map((plan, i) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                                "relative border rounded-2xl p-8 flex flex-col h-full transition-all hover:-translate-y-2",
                                isLight
                                    ? "bg-white border-slate-200 shadow-sm hover:shadow-xl"
                                    : "bg-slate-900 border-slate-800 hover:border-slate-700",
                                plan.is_popular && (isLight ? "border-indigo-500 ring-1 ring-indigo-500 shadow-indigo-100" : "border-indigo-500 ring-1 ring-indigo-900")
                            )}
                        >
                            {plan.is_popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-lg">
                                    Most Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className={cn("text-lg font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className={cn("text-4xl font-bold", isLight ? "text-slate-900" : "text-white")}>
                                        {plan.currency || 'UGX'} {billingPeriod === "annual" ? plan.annual_price : plan.monthly_price}
                                    </span>
                                    <span className="text-slate-500">/mo</span>
                                </div>
                                {billingPeriod === "annual" && (
                                    <p className="text-xs text-indigo-500 font-bold mt-1">Billed annually ({plan.currency || 'UGX'} {plan.annual_billed})</p>
                                )}
                                <p className="text-sm text-slate-500 mt-2">{plan.description}</p>
                            </div>

                            <div className="flex-1 space-y-4 mb-8">
                                {plan.features.sort((a, b) => a.order - b.order).map((feature) => (
                                    <div key={feature.id} className="flex items-start gap-3">
                                        <div className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm",
                                            feature.included
                                                ? (isLight ? "bg-green-100 text-green-600" : "bg-green-900/30 text-green-400")
                                                : (isLight ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500")
                                        )}>
                                            {feature.included ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                        </div>
                                        <span className={cn("text-sm", !feature.included && "opacity-50", isLight ? "text-slate-700" : "text-slate-300")}>{feature.text}</span>
                                    </div>
                                ))}
                            </div>

                            <Link href={`/school/billing/confirmation?planId=${plan.id}&period=${billingPeriod}`}>
                                <button className={cn(
                                    "w-full py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl active:scale-95",
                                    plan.is_popular
                                        ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20"
                                        : isLight
                                            ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
                                            : "bg-slate-800 text-white hover:bg-slate-700"
                                )}>
                                    Select {plan.name}
                                </button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    )
}
