"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import {
    Phone,
    ArrowRight,
    Check,
    Sparkles,
    Building2,
    Star,
    Crown,
    Loader2,
    ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/AuthContext"
import toast from "react-hot-toast"

// ─── Plan Data ────────────────────────────────────────────────────────────────

interface PlanOption {
    id: string
    name: string
    description: string
    monthlyPrice: number | null
    annualPrice: number | null
    features: string[]
    popular?: boolean
    icon: React.ReactNode
    gradient: string
    glowColor: string
    currency: string
    badge?: string
    displayOrder: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingScreen() {
    const { user, tokens, updateOnboarding, redirectToDashboardByRole } = useAuth()
    const [step, setStep] = useState(1)
    const [phone, setPhone] = useState("")
    const [countryCode, setCountryCode] = useState("+256")
    const [selectedRole, setSelectedRole] = useState<string | null>(null)
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
    const [billingPeriod, setBillingPeriod] = useState<"annual" | "monthly">("annual")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoadingPlans, setIsLoadingPlans] = useState(true)
    const [plans, setPlans] = useState<PlanOption[]>([])
    const [allPlans, setAllPlans] = useState<{ individual: PlanOption[], enterprise: PlanOption[] }>({ individual: [], enterprise: [] })

    // Helper to get iconography and styling based on plan theme or ID
    const getPlanStyle = (theme: string, id: string) => {
        if (id.includes('free')) {
            return {
                icon: <Sparkles className="w-6 h-6" />,
                gradient: "from-slate-500 to-slate-600",
                glowColor: "shadow-slate-500/20",
            }
        }
        if (id.includes('pro') || id.includes('plus')) {
            return {
                icon: <Crown className="w-6 h-6" />,
                gradient: "from-violet-600 to-indigo-600",
                glowColor: "shadow-violet-500/30",
            }
        }
        return {
            icon: <Building2 className="w-6 h-6" />,
            gradient: "from-amber-500 to-orange-500",
            glowColor: "shadow-amber-500/20",
        }
    }

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/plans/onboarding/`)
                if (!res.ok) throw new Error("Failed to fetch plans")
                const data = await res.json()
                
                const mapPlan = (p: any): PlanOption => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    monthlyPrice: p.monthlyPrice,
                    annualPrice: p.annualPrice,
                    popular: p.popular,
                    currency: p.currency,
                    badge: p.badge,
                    features: p.features.filter((f: any) => f.included).map((f: any) => f.text),
                    displayOrder: p.displayOrder || 0,
                    ...getPlanStyle(p.theme, p.id)
                })

                const individual = data.individual
                    .map(mapPlan)
                    .sort((a: PlanOption, b: PlanOption) => a.displayOrder - b.displayOrder)
                const enterprise = data.enterprise
                    .map(mapPlan)
                    .sort((a: PlanOption, b: PlanOption) => a.displayOrder - b.displayOrder)

                setAllPlans({ individual, enterprise })
            } catch (error) {
                console.error("Error fetching plans:", error)
                toast.error("Could not load plans. Please try refreshing.")
            } finally {
                setIsLoadingPlans(false)
            }
        }
        fetchPlans()
    }, [])

    // Update displayed plans when role changes
    useEffect(() => {
        if (selectedRole === 'teacher' || selectedRole === 'student') {
            setPlans(allPlans.individual)
        } else {
            // Default or if you want to show both, you could merge or wait for role
            setPlans(allPlans.individual)
        }
    }, [selectedRole, allPlans])

    const handlePhoneNext = () => {
        if (!phone.trim()) {
            toast.error("Please enter your phone number")
            return
        }
        if (selectedRole !== "teacher" && selectedRole !== "student") {
            toast.error("Please select whether you are a Teacher or Student")
            return
        }
        setStep(2)
    }

    const handleComplete = async () => {
        if (!selectedPlan) {
            toast.error("Please select a plan")
            return
        }

        setIsSubmitting(true)
        try {
            // Call API to update onboarding status
            const currentRole = selectedRole || user?.role;
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/profile/onboarding/`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokens?.access}`,
                },
                body: JSON.stringify({
                    onboarding: true,
                    role: currentRole,
                    phone_number: `${countryCode}${phone}`,
                    plan: selectedPlan,
                    billing_period: billingPeriod,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to complete onboarding")
            }

            if (data.redirect_url) {
                toast.success("Redirecting to secure payment... 💳")
                window.location.href = data.redirect_url
                return
            }

            updateOnboarding(true)
            toast.success("Welcome to NibbleLearn! 🎉")
            redirectToDashboardByRole(currentRole || null)
        } catch (error) {
            console.error("Onboarding error:", error)
            toast.error("Something went wrong. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // ─── Animations ─────────────────────────────────────────────────────────

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08, delayChildren: 0.1 },
        },
        exit: {
            opacity: 0,
            x: -60,
            transition: { duration: 0.3 },
        },
    }

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    }

    const slideInRight: Variants = {
        hidden: { opacity: 0, x: 60 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
        exit: {
            opacity: 0,
            x: -60,
            transition: { duration: 0.3 },
        },
    }

    return (
        <div className="space-y-6 w-full max-w-lg mx-auto">
            {/* Progress Bar */}
            <div className="flex items-center gap-3 mb-2">
                {[1, 2].map((s) => (
                    <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden bg-white/10">
                        <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                            initial={{ width: "0%" }}
                            animate={{ width: step >= s ? "100%" : "0%" }}
                            transition={{ duration: 0.6, ease: "easeOut", delay: step >= s ? 0.2 : 0 }}
                        />
                    </div>
                ))}
                <span className="text-xs text-white/40 font-medium tabular-nums">
                    {step}/2
                </span>
            </div>

            <AnimatePresence mode="wait">
                {step === 1 ? (
                    // ─── Step 1: Welcome + Phone ────────────────────────────
                    <motion.div
                        key="step1"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-6"
                    >
                        {/* Welcome Header */}
                        <motion.div variants={itemVariants} className="text-center space-y-3">
                            <motion.div
                                className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-500/25"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 15,
                                    delay: 0.2,
                                }}
                            >
                                <Sparkles className="w-8 h-8 text-white" />
                            </motion.div>

                            <h1 className="text-3xl font-bold tracking-tight">
                                <span className="bg-gradient-to-r from-white via-violet-200 to-indigo-200 bg-clip-text text-transparent">
                                    Thanks for choosing
                                </span>
                                <br />
                                <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                                    NibbleLearn
                                </span>
                            </h1>
                            <p className="text-white/50 text-sm leading-relaxed max-w-xs mx-auto">
                                Let&apos;s get you set up in just a moment. Enter your phone number below.
                            </p>
                        </motion.div>

                        {/* Phone Input */}
                        <motion.div variants={itemVariants} className="space-y-2">
                            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider ml-1">
                                Phone Number
                            </label>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <select
                                        value={countryCode}
                                        onChange={(e) => setCountryCode(e.target.value)}
                                        className="appearance-none h-12 pl-4 pr-8 bg-black/20 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-medium text-sm cursor-pointer"
                                    >
                                        <option value="+256">🇺🇬 +256</option>
                                        <option value="+1">🇺🇸 +1</option>
                                        <option value="+44">🇬🇧 +44</option>
                                        <option value="+61">🇦🇺 +61</option>
                                        <option value="+91">🇮🇳 +91</option>
                                        <option value="+234">🇳🇬 +234</option>
                                        <option value="+254">🇰🇪 +254</option>
                                        <option value="+27">🇿🇦 +27</option>
                                        <option value="+49">🇩🇪 +49</option>
                                        <option value="+33">🇫🇷 +33</option>
                                        <option value="+81">🇯🇵 +81</option>
                                        <option value="+86">🇨🇳 +86</option>
                                        <option value="+55">🇧🇷 +55</option>
                                    </select>
                                    <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 rotate-90 pointer-events-none" />
                                </div>
                                <div className="relative flex-1">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
                                        placeholder="Enter phone number"
                                        className="w-full h-12 pl-12 pr-4 bg-black/20 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Role Selector */}
                        <motion.div variants={itemVariants} className="space-y-2 mt-4">
                            <label className="text-xs font-semibold text-white/70 uppercase tracking-wider ml-1">
                                I am a
                            </label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setSelectedRole("teacher")}
                                    className={cn(
                                        "flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-300 font-bold",
                                        selectedRole === "teacher"
                                            ? "border-violet-500 bg-violet-500/20 text-white shadow-lg shadow-violet-500/20"
                                            : "border-white/10 bg-black/20 text-white/50 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    Teacher
                                </button>
                                <button
                                    onClick={() => setSelectedRole("student")}
                                    className={cn(
                                        "flex-1 py-3 px-4 rounded-xl border-2 transition-all duration-300 font-bold",
                                        selectedRole === "student" 
                                            ? "border-indigo-500 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/20" 
                                            : "border-white/10 bg-black/20 text-white/50 hover:border-white/20 hover:text-white"
                                    )}
                                >
                                    Student
                                </button>
                            </div>
                        </motion.div>

                        {/* Continue Button */}
                        <motion.div variants={itemVariants}>
                            <Button
                                onClick={handlePhoneNext}
                                className="w-full h-12 rounded-xl text-base font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25 border-0 group"
                            >
                                Continue
                                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </motion.div>
                    </motion.div>
                ) : (
                    // ─── Step 2: Plan Selection ─────────────────────────────
                    <motion.div
                        key="step2"
                        variants={slideInRight}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="space-y-5"
                    >
                        {/* Header */}
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold text-white tracking-tight">
                                Choose your plan
                            </h2>
                            <p className="text-white/50 text-sm">
                                You can change this anytime
                            </p>
                        </div>

                        {/* Billing Toggle */}
                        <div className="flex justify-center">
                            <div className="relative bg-black/20 rounded-full p-1 border border-white/10">
                                <div className="flex relative z-10">
                                    <button
                                        onClick={() => setBillingPeriod("annual")}
                                        className={cn(
                                            "px-5 py-2 rounded-full text-xs font-semibold transition-colors",
                                            billingPeriod === "annual"
                                                ? "text-white"
                                                : "text-white/50 hover:text-white/70"
                                        )}
                                    >
                                        Annual
                                    </button>
                                    <button
                                        onClick={() => setBillingPeriod("monthly")}
                                        className={cn(
                                            "px-5 py-2 rounded-full text-xs font-semibold transition-colors",
                                            billingPeriod === "monthly"
                                                ? "text-white"
                                                : "text-white/50 hover:text-white/70"
                                        )}
                                    >
                                        Monthly
                                    </button>
                                </div>
                                <motion.div
                                    className="absolute top-1 bottom-1 bg-white/15 backdrop-blur-sm rounded-full"
                                    initial={false}
                                    animate={{
                                        x: billingPeriod === "annual" ? 0 : "100%",
                                        width: "50%",
                                    }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    style={{ left: 4 }}
                                />
                            </div>
                            {billingPeriod === "annual" && (
                                <motion.span
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="ml-3 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold flex items-center gap-1 border border-emerald-500/20"
                                >
                                    <Star className="w-3 h-3 fill-current" />
                                    Save 27%
                                </motion.span>
                            )}
                        </div>

                        {/* Plan Cards */}
                        <motion.div
                            className="space-y-3"
                            variants={{
                                visible: { transition: { staggerChildren: 0.1 } },
                            }}
                            initial="hidden"
                            animate="visible"
                        >
                            {isLoadingPlans ? (
                                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                    <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                                    <p className="text-white/40 text-sm">Fetching elite plans for you...</p>
                                </div>
                            ) : plans.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-white/40 text-sm">No plans available for your selection.</p>
                                </div>
                            ) : (
                                plans.map((plan, i) => (
                                    <motion.button
                                        key={plan.id}
                                        variants={{
                                            hidden: { opacity: 0, y: 20 },
                                            visible: {
                                                opacity: 1,
                                                y: 0,
                                                transition: { delay: i * 0.1 },
                                            },
                                        }}
                                        onClick={() => setSelectedPlan(plan.id)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group",
                                            selectedPlan === plan.id
                                                ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                                                : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8"
                                        )}
                                    >
                                        {/* Popular Badge */}
                                        {plan.badge || plan.popular && (
                                            <div className="absolute -top-px -right-px px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-bl-xl rounded-tr-2xl text-[10px] font-bold uppercase tracking-wider text-white">
                                                {plan.badge || "Popular"}
                                            </div>
                                        )}

                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div
                                                className={cn(
                                                    "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gradient-to-br",
                                                    plan.gradient,
                                                    selectedPlan === plan.id ? "shadow-lg" : ""
                                                )}
                                            >
                                                <span className="text-white">{plan.icon}</span>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-white font-bold text-base truncate pr-2">
                                                        {plan.name}
                                                    </h3>
                                                    <div className="text-right whitespace-nowrap">
                                                        {plan.monthlyPrice !== null ? (
                                                            <span className="text-white font-bold text-lg">
                                                                {plan.currency === 'UGX' ? 'UGX ' : '$'}
                                                                {(billingPeriod === "annual" ? plan.annualPrice : plan.monthlyPrice)?.toLocaleString()}
                                                                <span className="text-white/40 text-[10px] font-normal">/mo</span>
                                                            </span>
                                                        ) : (
                                                            <span className="text-white/70 font-semibold text-sm">
                                                                Custom
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-white/40 text-[11px] mt-0.5 leading-tight">
                                                    {plan.description}
                                                </p>

                                                {/* Features */}
                                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                                                    {plan.features.slice(0, 3).map((f, fi) => (
                                                        <span
                                                            key={fi}
                                                            className="text-white/50 text-[10px] flex items-center gap-1"
                                                        >
                                                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                                                            {f}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Selection Indicator */}
                                            <div
                                                className={cn(
                                                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-all",
                                                    selectedPlan === plan.id
                                                        ? "border-violet-500 bg-violet-500"
                                                        : "border-white/20"
                                                )}
                                            >
                                                {selectedPlan === plan.id && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                                    >
                                                        <Check className="w-3 h-3 text-white" />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Glow effect on selection */}
                                        {selectedPlan === plan.id && (
                                            <motion.div
                                                className="absolute inset-0 bg-gradient-to-r from-violet-500/5 to-indigo-500/5 rounded-2xl pointer-events-none"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        )}
                                    </motion.button>
                                ))
                            )}
                        </motion.div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-1">
                            <Button
                                variant="ghost"
                                onClick={() => setStep(1)}
                                className="h-12 px-6 rounded-xl text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleComplete}
                                disabled={!selectedPlan || isSubmitting || isLoadingPlans}
                                className={cn(
                                    "flex-1 h-12 rounded-xl text-base font-bold text-white shadow-lg border-0 transition-all",
                                    selectedPlan
                                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-500/25"
                                        : "bg-white/10 cursor-not-allowed shadow-none"
                                )}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Setting up...
                                    </>
                                ) : (
                                    <>
                                        Get Started
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
