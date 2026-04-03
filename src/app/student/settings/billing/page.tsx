"use client"

import React, { useState, useEffect } from "react"
import { SettingsSection } from "@/components/settings/SettingsSection"
import { SettingsCard, SettingsCardContent } from "@/components/settings/SettingsCard"
import { Button } from "@/components/ui/button"
import { CreditCard, Star, Download, Sparkles, Check, X, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { useStudentTheme } from "@/components/student/StudentThemeContext"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/components/providers/AuthContext"
import { useUsage } from "@/hooks/useUsage"

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
    features: PlanFeature[];
}

export default function StudentBillingPage() {
    const { theme } = useStudentTheme()
    const { tokens } = useAuth()
    const isLight = theme === 'light'
    const variant = isLight ? 'default' : 'glass'

    const [billingPeriod, setBillingPeriod] = useState<"annual" | "monthly">("annual")
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [isTopUpOpen, setIsTopUpOpen] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

    const { data: usageData, refetch: refetchUsage } = useUsage()
    const activePlan = plans.find(p => p.badge === "Active") || plans[0]

    const creditsUsedPercentage = usageData?.usage_percentage ?? 0
    const monthlyLimit = usageData?.monthly_limit ?? activePlan?.total_credits ?? 0
    const resetDays = usageData?.reset_days ?? 0

    useEffect(() => {
        const fetchPlans = async () => {
            setLoading(true)
            setError(null)
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"
                // If baseUrl already includes /api/v1, don't add it again
                const fetchUrl = baseUrl.includes('/api/v1') 
                    ? `${baseUrl}/auth/plans/by-type/?use_type=individual`
                    : `${baseUrl}/api/v1/auth/plans/by-type/?use_type=individual`
                
                const res = await fetch(fetchUrl, {
                    headers: {
                        ...(tokens?.access && { Authorization: `Bearer ${tokens.access}` }),
                        "Content-Type": "application/json",
                    },
                })
                
                if (!res.ok) throw new Error("Failed to fetch plans")
                
                const data = await res.json()
                if (data.plans) {
                    const sortedPlans = (data.plans as Plan[]).sort((a: Plan, b: Plan) => (a.display_order || 0) - (b.display_order || 0))
                    setPlans(sortedPlans)
                } else {
                    throw new Error("Invalid data format")
                }
            } catch (err) {
                console.error("Student Billing fetch error:", err)
                setError("Unable to load student plans. Please try again later.")
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
                <p className="text-slate-500 animate-pulse font-medium">Loading student plans...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 p-8 text-center bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl border border-blue-100/50 dark:border-blue-900/20">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-blue-600" />
                </div>
                <div className="max-w-md">
                    <h2 className="text-xl font-bold text-blue-900 dark:text-blue-400 mb-2">Something went wrong</h2>
                    <p className="text-blue-700/80 dark:text-blue-300/80 mb-6 font-medium">{error}</p>
                    <Button onClick={() => window.location.reload()} variant="outline" className="border-blue-200 hover:bg-blue-50 text-blue-700">
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    const lightCardStyles = "bg-white border-2 border-slate-300 shadow-md"

    return (
        <div className="space-y-12 pb-12 w-full relative">
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
                            className={cn(
                                "w-full max-w-lg rounded-2xl p-6 shadow-2xl border",
                                isLight ? "bg-white border-slate-200" : "bg-slate-900 border-white/10"
                            )}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className={cn("text-xl font-bold mb-1", isLight ? "text-slate-900" : "text-white")}>Top Up Credits</h2>
                                    <p className={cn("text-sm", isLight ? "text-slate-500" : "text-white/60")}>
                                        Select a percentage to increase your current limit.
                                    </p>
                                </div>
                                <button onClick={() => setIsTopUpOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors self-start">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                {[
                                    { pct: 10, price: "$2.99" },
                                    { pct: 25, price: "$5.99" },
                                    { pct: 50, price: "$9.99" },
                                    { pct: 100, price: "$14.99" },
                                ].map((opt) => (
                                    <button
                                        key={opt.pct}
                                        onClick={() => handleTopUp(opt.pct)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:scale-[1.02]",
                                            isLight
                                                ? "bg-slate-50 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50"
                                                : "bg-slate-950/50 border-white/10 hover:border-blue-500 hover:bg-white/5"
                                        )}
                                    >
                                        <div className="text-xl font-black text-blue-500 mb-2">+{opt.pct}% Credits</div>
                                        <div className="px-3 py-1 rounded bg-blue-500 text-white text-xs font-bold shadow-sm">
                                            {opt.price}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button onClick={() => setIsTopUpOpen(false)} className={cn("px-4 py-2 text-sm font-medium rounded-lg transition-colors", isLight ? "hover:bg-slate-100 text-slate-600" : "hover:bg-slate-800 text-slate-300")}>Cancel</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="w-full">
                <h1 className={cn("text-3xl font-extrabold mb-2", isLight ? "text-slate-900" : "text-white")}>Billing & Plan (Wide Mode Active)</h1>
                <p className={cn("font-medium", isLight ? "text-slate-600" : "text-blue-200/80")}>Manage your student plan, usage limits, and payment methods.</p>
            </div>

            {/* Current Usage Progress Card */}
            {activePlan && (
                <SettingsCard variant={variant} className={cn(isLight && lightCardStyles)}>
                    <SettingsCardContent className="p-6 md:p-8 space-y-8">
                        <div>
                            <h2 className={cn("text-2xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>
                                {activePlan.name} Plan
                            </h2>
                            <p className={cn("max-w-2xl font-medium", isLight ? "text-slate-500" : "text-white/60")}>
                                {activePlan.description}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <span className={cn("text-sm font-semibold tracking-wide", isLight ? "text-slate-700" : "text-white/80")}>Credits Usage</span>
                                <span className={cn("text-sm font-bold", creditsUsedPercentage >= 80 ? "text-red-500" : "text-blue-500")}>
                                    {creditsUsedPercentage}% Used
                                </span>
                            </div>
                            <div className={cn("w-full h-3 rounded-full overflow-hidden border", isLight ? "bg-slate-100 border-slate-200" : "bg-black/40 border-white/10")}>
                                <div
                                    className={cn("h-full rounded-full transition-all duration-1000", creditsUsedPercentage >= 80 ? "bg-red-500" : "bg-gradient-to-r from-blue-500 to-indigo-500")}
                                    style={{ width: `${creditsUsedPercentage}%` }}
                                ></div>
                            </div>
                            <p className={cn("text-xs font-medium", isLight ? "text-slate-500" : "text-white/50")}>
                                Your limit is <span className={cn("font-bold", isLight ? "text-slate-900" : "text-white")}>{monthlyLimit.toLocaleString()}</span> monthly credits.
                            </p>
                        </div>

                        <div className={cn("flex flex-col md:flex-row justify-between items-center pt-8 border-t gap-4", isLight ? "border-slate-200" : "border-white/10")}>
                            <div className={cn("text-sm w-full md:w-auto text-left", isLight ? "text-slate-500" : "text-white/60")}>
                                <span className="hidden md:inline">Monthly limit resets in </span>
                                <span className="inline md:hidden">Resets in </span>
                                <span className={cn("font-semibold", isLight ? "text-slate-900" : "text-white")}>{resetDays} days</span>
                            </div>
                            <div className="flex gap-3 w-full md:w-auto">
                                <Button
                                    onClick={() => setIsTopUpOpen(true)}
                                    variant="outline"
                                    className={cn(
                                        "flex-1 md:flex-none font-semibold",
                                        isLight ? "text-blue-700 border-blue-200 hover:bg-blue-50" : "text-blue-400 border-blue-500/30 hover:bg-blue-500/20"
                                    )}
                                >
                                    <Sparkles className="w-4 h-4 mr-2" /> Top Up Credits
                                </Button>
                                <Button 
                                    onClick={() => refetchUsage()}
                                    className={cn(
                                        "flex-1 md:flex-none shadow-md shadow-blue-500/20 font-bold",
                                        isLight ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-400 text-white"
                                    )}
                                >
                                    Refresh Usage
                                </Button>
                            </div>
                        </div>
                    </SettingsCardContent>
                </SettingsCard>
            )}

            {/* Pricing / Plans Section */}
            <div>
                <div className="flex justify-center mb-10">
                    <div className={cn("relative rounded-full p-1 shadow-sm border", isLight ? "bg-white border-slate-200" : "bg-black/20 border-white/10 backdrop-blur-md")}>
                        <div className="flex relative z-10">
                            <button
                                onClick={() => setBillingPeriod("annual")}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300",
                                    billingPeriod === "annual"
                                        ? "text-white"
                                        : (isLight ? "text-slate-600 hover:text-slate-900" : "text-white/60 hover:text-white")
                                )}
                            >
                                Annual
                            </button>
                            <button
                                onClick={() => setBillingPeriod("monthly")}
                                className={cn(
                                    "px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-300",
                                    billingPeriod === "monthly"
                                        ? "text-white"
                                        : (isLight ? "text-slate-600 hover:text-slate-900" : "text-white/60 hover:text-white")
                                )}
                            >
                                Monthly
                            </button>
                        </div>
                        <motion.div
                            className={cn("absolute top-1 bottom-1 rounded-full z-0 shadow-md", isLight ? "bg-blue-600" : "bg-blue-500")}
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
                            className="ml-4 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold flex items-center gap-1 shadow-sm border border-amber-200/50"
                        >
                            <Star className="w-3 h-3 fill-current" />
                            Save 30%
                        </motion.div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-12 w-full max-w-5xl mx-auto">
                    {plans.map((plan) => {
                        const isCurrentPlan = plan.badge === "Active";

                        return (
                            <div
                                key={plan.id}
                                className={cn(
                                    "relative rounded-[2rem] p-8 md:p-10 flex flex-col transition-all duration-300 h-fit",
                                    plan.theme === "dark"
                                        ? "bg-slate-900 text-white border-2 border-blue-500 shadow-2xl shadow-blue-500/10"
                                        : (isLight ? "bg-white text-slate-900 border-2 border-slate-200 shadow-md" : "bg-white/5 text-white border-2 border-white/10 backdrop-blur-md shadow-lg")
                                )}
                            >
                                {plan.badge && (
                                    <div className={cn(
                                        "absolute -top-3 right-6 px-4 py-1 rounded-full text-xs font-bold shadow-md",
                                        plan.is_popular
                                            ? "bg-blue-500 text-white shadow-blue-500/30"
                                            : (isLight ? "bg-slate-100 text-slate-700 border-slate-200 border" : "bg-black/50 text-white/80 border-white/20 border")
                                    )}>
                                        {plan.badge}
                                    </div>
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    <div className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center shadow-inner",
                                        plan.theme === "dark" ? "bg-white/10" : (isLight ? "bg-blue-50" : "bg-blue-500/20")
                                    )}>
                                        <Sparkles className={cn("w-5 h-5", plan.theme === "dark" ? "text-blue-400" : "text-blue-500")} />
                                    </div>
                                    <h3 className="text-2xl font-bold">{plan.name} (Wide Mode)</h3>
                                </div>

                                <div className="mb-6">
                                    <div className="flex flex-col space-y-2">
                                        {billingPeriod === "annual" && Number(plan.monthly_price) > 0 && (
                                            <div className={cn(
                                                "text-xl line-through opacity-60 font-medium",
                                                plan.theme === "dark" ? "text-slate-500" : (isLight ? "text-slate-400" : "text-white/40")
                                            )}>
                                                ${plan.monthly_price}/month
                                            </div>
                                        )}
                                        <div className="flex flex-wrap items-baseline gap-2">
                                            <span className="text-5xl font-black tracking-tighter leading-none">
                                                ${billingPeriod === "annual" ? Number(plan.annual_price) : Number(plan.monthly_price)}
                                            </span>
                                            <span className={cn(
                                                "text-lg font-bold opacity-80",
                                                plan.theme === "dark" ? "text-slate-400" : (isLight ? "text-slate-500" : "text-white/50")
                                            )}>
                                                /mo
                                            </span>
                                        </div>
                                    </div>
                                    {billingPeriod === "annual" && Number(plan.annual_billed) > 0 && (
                                        <p className={cn(
                                            "text-sm mt-3 font-bold",
                                            plan.theme === "dark" ? "text-blue-400" : (isLight ? "text-blue-600" : "text-blue-300")
                                        )}>
                                            ${plan.annual_billed} billed yearly
                                        </p>
                                    )}
                                </div>

                                <p className={cn(
                                    "text-sm leading-relaxed mb-6 font-medium",
                                    plan.theme === "dark" ? "text-slate-300" : (isLight ? "text-slate-600" : "text-white/70")
                                )}>
                                    {plan.description}
                                </p>

                                <ul className="space-y-4 mb-10">
                                    {plan.features.sort((a, b) => a.order - b.order).map((feature) => (
                                        <li key={feature.id} className="flex items-start gap-3">
                                            <div className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm",
                                                feature.included
                                                    ? "bg-blue-500 text-white shadow-blue-500/20"
                                                    : (plan.theme === "dark" ? "bg-slate-700/50" : (isLight ? "bg-slate-100" : "bg-white/10"))
                                            )}>
                                                {feature.included
                                                    ? <Check className="w-3 h-3 stroke-[3]" />
                                                    : <X className={cn("w-3 h-3", plan.theme === "dark" ? "text-slate-500" : (isLight ? "text-slate-400" : "text-white/40"))} />
                                                }
                                            </div>
                                            <span className={cn(
                                                "text-sm font-medium",
                                                !feature.included && "text-slate-500",
                                                feature.highlight && "font-bold text-blue-600 dark:text-blue-400"
                                            )}>
                                                {feature.text}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    className={cn(
                                        "w-full h-12 rounded-xl text-base font-bold transition-all",
                                        plan.theme === "dark"
                                            ? "bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20"
                                            : isCurrentPlan
                                                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default hover:bg-green-100 dark:hover:bg-green-900/30"
                                                : (isLight ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-white/10 text-white hover:bg-white/20")
                                    )}
                                >
                                    {plan.cta}
                                </Button>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Payment & History Section (Only if have a paid plan active usually, but showing as static for now based on user's theme) */}
            <div className="space-y-8 mt-16 pt-8 border-t border-slate-200 dark:border-white/10">
                <h2 className={cn("text-2xl font-bold px-1", isLight ? "text-slate-900" : "text-white")}>Payment Details</h2>

                <SettingsSection title="Payment Method" variant={variant}>
                    <SettingsCard variant={variant} className={cn(isLight && lightCardStyles)}>
                        <SettingsCardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-xl flex items-center justify-center border-2",
                                    isLight ? "bg-slate-50 border-slate-200" : "bg-black/20 border-white/10 shadow-inner"
                                )}>
                                    <CreditCard className={cn("w-6 h-6", isLight ? "text-slate-700" : "text-white/80")} />
                                </div>
                                <div>
                                    <h3 className={cn("font-bold text-lg", isLight ? "text-slate-900" : "text-white")}>Visa ending in 4242</h3>
                                    <p className={cn("text-sm font-medium", isLight ? "text-slate-800" : "text-white/50")}>Expires 12/28</p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className={cn("font-bold", isLight ? "border-slate-300 text-slate-700 hover:bg-slate-50" : "bg-transparent border-white/20 text-white hover:bg-white/10")}>Edit</Button>
                            </div>
                        </SettingsCardContent>
                        <div className={cn("px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4 border-t", isLight ? "bg-slate-50 border-slate-200" : "bg-black/20 border-white/5")}>
                            <div className="text-sm">
                                <span className={isLight ? "text-slate-500" : "text-white/60"}>Next billing date: </span>
                                <span className={cn("font-bold", isLight ? "text-slate-900" : "text-white")}>May 21, 2026</span>
                            </div>
                            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 font-bold">Cancel Subscription</Button>
                        </div>
                    </SettingsCard>
                </SettingsSection>

                <SettingsSection title="Billing History" variant={variant}>
                    <SettingsCard variant={variant} className={cn(isLight && lightCardStyles)}>
                        <SettingsCardContent>
                            <table className={cn("w-full text-left text-sm", isLight ? "text-slate-800" : "text-white/70")}>
                                <thead>
                                    <tr className={isLight ? "border-b-2 border-slate-200" : "border-b border-white/10"}>
                                        <th className={cn("pb-3 font-bold text-base", isLight ? "text-slate-900" : "text-white")}>Date</th>
                                        <th className={cn("pb-3 font-bold text-base", isLight ? "text-slate-900" : "text-white")}>Description</th>
                                        <th className={cn("pb-3 font-bold text-base", isLight ? "text-slate-900" : "text-white")}>Amount</th>
                                        <th className={cn("pb-3 font-bold text-base", isLight ? "text-slate-900" : "text-white")}>Invoice</th>
                                    </tr>
                                </thead>
                                <tbody className={isLight ? "divide-y divide-slate-200" : "divide-y divide-white/5"}>
                                    {[
                                        { date: "Apr 21, 2026", desc: "Plus Student - Monthly", amount: "$9.00" },
                                        { date: "Mar 21, 2026", desc: "Plus Student - Monthly", amount: "$9.00" },
                                        { date: "Feb 21, 2026", desc: "Plus Student - Monthly", amount: "$9.00" },
                                    ].map((row, i) => (
                                        <tr key={i} className={cn("transition-colors", isLight ? "hover:bg-slate-50" : "hover:bg-white/5")}>
                                            <td className="py-4 font-semibold">{row.date}</td>
                                            <td className={cn("py-4 font-bold text-base", isLight ? "text-slate-900" : "text-white")}>{row.desc}</td>
                                            <td className="py-4 font-bold">{row.amount}</td>
                                            <td className="py-4">
                                                <div className={cn("flex items-center gap-2 font-bold cursor-pointer hover:underline", isLight ? "text-blue-600" : "text-blue-400 hover:text-blue-300")}>
                                                    <Download className="w-4 h-4" /> Download
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </SettingsCardContent>
                    </SettingsCard>
                </SettingsSection>
            </div>
        </div>
    )
}
