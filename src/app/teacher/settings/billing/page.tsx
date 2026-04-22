"use client"

import React, { useState, useEffect } from "react"
import { SettingsCard, SettingsCardContent } from "@/components/settings/SettingsCard"
import { Button } from "@/components/ui/button"
import { Check, X, Sparkles, Star, CheckCircle, Loader2, AlertCircle, CreditCard, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/components/providers/AuthContext"
import { useUsage } from "@/hooks/useUsage"
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

export default function TeacherBillingPage() {
    const { tokens, user } = useAuth()
    const [billingPeriod, setBillingPeriod] = useState<"annual" | "monthly">("annual")
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [isTopUpOpen, setIsTopUpOpen] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

    const { data: usageData, refetch: refetchUsage } = useUsage()
    const { initiatePlanPayment, isLoading: isPaymentLoading } = usePlanPayment()
    
    // Fallback if plans are loading or empty
    const activePlan = plans.find(p => p.badge === "Active") || plans[0]

    const creditsUsedPercentage = usageData?.usage_percentage ?? 0
    const monthlyLimit = usageData?.monthly_limit ?? activePlan?.total_credits ?? 0
    const resetDays = usageData?.reset_days ?? 0

    useEffect(() => {
        const fetchPlans = async () => {
            setLoading(true)
            setError(null)
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                const res = await fetch(`${baseUrl}/api/v1/auth/plans/by-type/?use_type=individual`, {
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
                console.error("Billing fetch error:", err)
                setError("Unable to load billing plans. Please try again later.")
            } finally {
                setLoading(false)
            }
        }

        fetchPlans()
    }, [tokens])

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleTopUp = (percent: number) => {
        showToast(`Successfully added +${percent}% credits!`)
        setIsTopUpOpen(false)
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                <p className="text-slate-500 animate-pulse">Loading plans...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <div className="max-w-md">
                    <h2 className="text-xl font-bold text-red-900 dark:text-red-400 mb-2">Something went wrong</h2>
                    <p className="text-red-700/80 dark:text-red-300/80 mb-6">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline" className="border-red-200 hover:bg-red-50">
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    const hasPaidPlan = plans.some(p => p.badge === "Active") || (user?.subscription?.plan_name?.toLowerCase() !== 'free' && user?.subscription?.plan_name !== undefined)

    return (
        <div className="space-y-12 pb-12 relative">
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                            "fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium",
                            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
                        )}
                    >
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isTopUpOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-lg rounded-2xl p-6 shadow-2xl border bg-white border-slate-100 dark:bg-slate-900 dark:border-slate-800"
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-xl font-bold mb-1 text-slate-900 dark:text-white">Top Up Credits</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Select a percentage to increase your current limit.
                                    </p>
                                </div>
                                <button onClick={() => setIsTopUpOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors self-start">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                {[
                                    { pct: 10, price: "4.99" },
                                    { pct: 25, price: "9.99" },
                                    { pct: 50, price: "17.99" },
                                    { pct: 100, price: "29.99" },
                                ].map((opt) => (
                                    <button
                                        key={opt.pct}
                                        onClick={() => handleTopUp(opt.pct)}
                                        className="flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:scale-[1.02] bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 dark:bg-slate-950/50 dark:border-slate-800 dark:hover:border-indigo-500 dark:hover:bg-slate-900"
                                    >
                                        <div className="text-xl font-black text-indigo-500 mb-2">+{opt.pct}% Credits</div>
                                        <div className="px-3 py-1 rounded bg-indigo-500 text-white text-xs font-bold shadow-sm">
                                            {activePlan?.currency || 'UGX'} {opt.price}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button onClick={() => setIsTopUpOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-800 dark:text-slate-300">Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="w-full">
                <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Billing & Plans</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your subscription and usage limits.</p>
            </div>

            {/* Usage Progress Card */}
            {activePlan && (
                <SettingsCard variant="slate">
                    <SettingsCardContent className="p-6 md:p-8 space-y-8">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{activePlan.name} Plan</h2>
                            <p className="text-slate-500 dark:text-slate-400 max-w-2xl">
                                {activePlan.description}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-wide">Credits Usage</span>
                                <span className={cn("text-sm font-bold", creditsUsedPercentage >= 80 ? "text-red-500" : "text-violet-600 dark:text-violet-400")}>{creditsUsedPercentage}% Used</span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                                <div className={cn("h-full rounded-full", creditsUsedPercentage >= 80 ? "bg-red-500" : "bg-gradient-to-r from-violet-500 to-indigo-500")} style={{ width: `${creditsUsedPercentage}%` }}></div>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Your limit is <span className="font-bold text-slate-900 dark:text-white">{monthlyLimit.toLocaleString()}</span> monthly credits.
                            </p>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-200 dark:border-slate-800 gap-4">
                            <div className="text-sm text-slate-500 dark:text-slate-400 w-full md:w-auto text-left">
                                <span className="hidden md:inline">Monthly limit resets in </span>
                                <span className="inline md:hidden">Resets in </span>
                                <span className="font-semibold text-slate-900 dark:text-white">{resetDays} days</span>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <Button
                                    onClick={() => setIsTopUpOpen(true)}
                                    variant="outline"
                                    className="flex-1 md:flex-none text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-900/30"
                                >
                                    <Sparkles className="w-4 h-4 mr-2" /> Top Up Credits
                                </Button>
                                <Button 
                                    onClick={() => refetchUsage()}
                                    className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                                >
                                    Refresh Usage
                                </Button>
                            </div>
                        </div>
                    </SettingsCardContent>
                </SettingsCard>
            )}

            {/* Pricing Section - Only shown if user is on a FREE plan */}
            {user?.subscription?.plan_name?.toLowerCase() === 'free' && (
                <div>
                    <div className="flex justify-center mb-10">
                        <div className="relative bg-white dark:bg-slate-900 rounded-full p-1 shadow-sm border border-slate-200 dark:border-slate-800">
                            <div className="flex">
                                <button
                                    onClick={() => setBillingPeriod("annual")}
                                    className={cn(
                                        "relative z-10 px-6 py-2 rounded-full text-sm font-semibold transition-colors",
                                        billingPeriod === "annual"
                                            ? "text-white"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    )}
                                >
                                    Annual
                                </button>
                                <button
                                    onClick={() => setBillingPeriod("monthly")}
                                    className={cn(
                                        "relative z-10 px-6 py-2 rounded-full text-sm font-semibold transition-colors",
                                        billingPeriod === "monthly"
                                            ? "text-white"
                                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                                    )}
                                >
                                    Monthly
                                </button>
                            </div>
                            <motion.div
                                className="absolute top-1 bottom-1 bg-slate-900 dark:bg-slate-700 rounded-full"
                                initial={false}
                                animate={{
                                    x: billingPeriod === "annual" ? 0 : "100%",
                                    width: "50%"
                                }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                style={{ left: 4 }}
                            />
                        </div>
                        {billingPeriod === "annual" && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="ml-4 px-3 py-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 rounded-full text-sm font-bold flex items-center gap-1"
                            >
                                <Star className="w-3 h-3 fill-current" />
                                Save 27%
                            </motion.div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {plans.map((plan) => {
                            const isCurrentPlan = plan.badge === "Active"

                            return (
                                <div
                                    key={plan.id}
                                    className={cn(
                                        "relative rounded-3xl p-8 flex flex-col transition-all duration-500",
                                        plan.theme === "dark"
                                            ? "bg-slate-900 text-white border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20"
                                            : "bg-white text-slate-900 border-2 border-slate-100 shadow-xl hover:shadow-2xl"
                                    )}
                                >
                                    {plan.is_popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                            Most Popular
                                        </div>
                                    )}

                                    <div className="mb-8">
                                        <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                                        <p className={cn(
                                            "text-sm font-medium",
                                            plan.theme === "dark" ? "text-slate-400" : "text-slate-500"
                                        )}>
                                            {plan.description}
                                        </p>
                                    </div>

                                    <div className="flex flex-col space-y-2 mb-4">
                                        {billingPeriod === "annual" && Number(plan.monthly_price) > 0 && (
                                            <div className={cn(
                                                "text-xl line-through opacity-60 font-medium",
                                                plan.theme === "dark" ? "text-slate-400" : "text-slate-500"
                                            )}>
                                                {plan.currency || 'UGX'} {plan.monthly_price}/month
                                            </div>
                                        )}
                                        <div className="flex flex-wrap items-baseline gap-2">
                                            <span className="text-5xl font-black tracking-tighter leading-none">
                                                {plan.currency || 'UGX'} {billingPeriod === "annual" ? Number(plan.annual_price) : Number(plan.monthly_price)}
                                            </span>
                                            <span className={cn(
                                                "text-lg font-bold opacity-80",
                                                plan.theme === "dark" ? "text-slate-400" : "text-slate-500"
                                            )}>
                                                /mo
                                            </span>
                                        </div>
                                    </div>

                                    {billingPeriod === "annual" && Number(plan.annual_billed) > 0 && (
                                        <p className={cn(
                                            "text-sm mt-1 mb-4 font-bold",
                                            plan.theme === "dark" ? "text-amber-400" : "text-indigo-600"
                                        )}>
                                            {plan.currency || 'UGX'} {plan.annual_billed} billed yearly
                                        </p>
                                    )}

                                    <ul className="space-y-4 mb-10">
                                        {plan.features.sort((a, b) => a.order - b.order).map((feature) => (
                                            <li key={feature.id} className="flex items-start gap-3">
                                                <div className={cn(
                                                    "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm",
                                                    feature.included
                                                        ? "bg-green-500 text-white"
                                                        : plan.theme === "dark" ? "bg-slate-700/50" : "bg-slate-100 dark:bg-slate-800"
                                                )}>
                                                    {feature.included
                                                        ? <Check className="w-3 h-3" />
                                                        : <X className={cn("w-3 h-3", plan.theme === "dark" ? "text-slate-500" : "text-slate-400")} />
                                                    }
                                                </div>
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    !feature.included && "text-slate-500",
                                                    feature.highlight && "font-semibold"
                                                )}>
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>

                                    <Button
                                        disabled={isPaymentLoading || isCurrentPlan}
                                        onClick={() => {
                                            if (!isCurrentPlan) {
                                                initiatePlanPayment({ plan, billingPeriod })
                                            }
                                        }}
                                        className={cn(
                                            "w-full h-12 rounded-xl text-base font-semibold transition-all shadow-md",
                                            plan.theme === "dark"
                                                ? "bg-white text-slate-900 hover:bg-slate-100"
                                                : isCurrentPlan
                                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default hover:bg-green-100 dark:hover:bg-green-900/30 shadow-none"
                                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-600/20"
                                        )}
                                    >
                                        {isPaymentLoading && !isCurrentPlan ? (
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        ) : null}
                                        {plan.cta}
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
            {/* Payment & History Section (Only if have a paid plan active) */}
            {user?.subscription?.plan_name?.toLowerCase() !== 'free' && (
                <div className="space-y-8 mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
                    <h2 className="text-2xl font-bold px-1 text-slate-900 dark:text-white">Payment Details</h2>

                    <SettingsCard variant="slate">
                        <SettingsCardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center border-2 bg-slate-50 border-slate-200 dark:bg-slate-950/50 dark:border-slate-800 shadow-inner">
                                    <CreditCard className="w-6 h-6 text-slate-700 dark:text-white/80" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Visa ending in 4242</h3>
                                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Expires 12/28</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="font-bold border-slate-300 text-slate-700 hover:bg-slate-50 dark:bg-transparent dark:border-slate-800 dark:text-white dark:hover:bg-slate-800">Edit</Button>
                            </div>
                        </SettingsCardContent>
                        <div className="px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-t bg-slate-50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-800/50">
                            <div className="text-sm">
                                <span className="text-slate-500">Next billing date: </span>
                                <span className="font-bold text-slate-900 dark:text-white">May 21, 2026</span>
                            </div>
                            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold">Cancel Subscription</Button>
                        </div>
                    </SettingsCard>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold px-1 text-slate-900 dark:text-white mt-8">Billing History</h3>
                        <SettingsCard variant="slate">
                            <SettingsCardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                                        <thead>
                                            <tr className="border-b-2 border-slate-200 dark:border-slate-800">
                                                <th className="pb-3 font-bold text-base text-slate-900 dark:text-white">Date</th>
                                                <th className="pb-3 font-bold text-base text-slate-900 dark:text-white">Description</th>
                                                <th className="pb-3 font-bold text-base text-slate-900 dark:text-white">Amount</th>
                                                <th className="pb-3 font-bold text-base text-slate-900 dark:text-white text-right">Invoice</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {[
                                                { date: "Apr 21, 2026", desc: "Teacher Plus - Monthly", amount: `${activePlan?.currency || 'UGX'} 45,000` },
                                                { date: "Mar 21, 2026", desc: "Teacher Plus - Monthly", amount: `${activePlan?.currency || 'UGX'} 45,000` },
                                                { date: "Feb 21, 2026", desc: "Teacher Plus - Monthly", amount: `${activePlan?.currency || 'UGX'} 45,000` },
                                            ].map((row, i) => (
                                                <tr key={i} className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                    <td className="py-4 font-semibold">{row.date}</td>
                                                    <td className="py-4 font-bold text-base text-slate-900 dark:text-white">{row.desc}</td>
                                                    <td className="py-4 font-bold">{row.amount}</td>
                                                    <td className="py-4 text-right">
                                                        <div className="inline-flex items-center gap-2 font-bold cursor-pointer hover:underline text-indigo-600 dark:text-indigo-400">
                                                            <Download className="w-4 h-4" /> Download
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </SettingsCardContent>
                        </SettingsCard>
                    </div>
                </div>
            )}
        </div>
    )
}
