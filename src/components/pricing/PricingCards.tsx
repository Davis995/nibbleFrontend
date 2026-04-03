"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Sparkles, Building2, Star, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/AuthContext"
import { useEffect } from "react"
import Link from "next/link"

interface PlanFeature {
    text: string
    included: boolean
    highlight?: boolean
}

interface PricingPlan {
    id: string
    name: string
    description: string
    monthlyPrice: number | null
    annualPrice: number | null
    annualBilled: number | null
    features: PlanFeature[]
    cta: string
    ctaLink: string
    popular?: boolean
    badge?: string
    currency: string
    theme: "light" | "dark" | "cream"
}

// Static data removed to move to dynamic fetch

export function PricingCards() {
    const [billingPeriod, setBillingPeriod] = useState<"annual" | "monthly">("annual")
    const [plans, setPlans] = useState<PricingPlan[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchPlans = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
                const res = await fetch(`${baseUrl}/api/v1/auth/plans/onboarding/`)
                if (!res.ok) throw new Error("Failed to fetch plans")
                const data = await res.json()
                
                        const mapBackendToPricingPlan = (p: any): PricingPlan => {
                            const isEnterprise = p.useType === 'enterprise'
                            return {
                                id: p.id,
                                name: p.name,
                                description: p.description,
                                monthlyPrice: p.monthlyPrice,
                                annualPrice: p.annualPrice,
                                annualBilled: p.annualBilled,
                                currency: p.currency || 'UGX',
                                cta: p.cta,
                                ctaLink: isEnterprise ? "/demo" : `/signup?plan=${p.id}`,
                                popular: p.popular,
                                badge: p.badge,
                                theme: p.theme || (p.popular ? "dark" : "light"),
                                features: p.features.map((f: any) => ({
                                    text: f.text,
                                    included: f.included,
                                    highlight: f.highlight
                                }))
                            }
                        }

                // Show individual and a slice of enterprise
                const allPlans = [
                    ...data.individual.map(mapBackendToPricingPlan),
                    ...data.enterprise.map(mapBackendToPricingPlan)
                ]
                
                setPlans(allPlans)
            } catch (err) {
                console.error("Pricing fetch error:", err)
                setError("Unable to load latest pricing. Please try again.")
            } finally {
                setIsLoading(false)
            }
        }
        fetchPlans()
    }, [])

    if (isLoading) {
        return (
            <div className="py-24 flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="text-slate-500 animate-pulse font-medium">Fetching best prices...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="py-24 flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center px-4">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Oops! Pricing unavailable</h2>
                <p className="text-slate-600 max-w-sm">{error}</p>
                <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                    Retry Loading
                </Button>
            </div>
        )
    }

    return (
        <section className="py-24 bg-slate-50">
            <div className="container mx-auto px-4">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <span className="text-sm font-bold text-violet-600 uppercase tracking-wider">
                        Pricing
                    </span>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mt-2 mb-6">
                        Find the perfect plan for your needs
                    </h1>
                    <p className="text-xl text-slate-600">
                        Every educator uses AI differently. Our plans meet you where you are and scale with your goals.
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex justify-center mb-16">
                    <div className="relative bg-white rounded-full p-1 shadow-sm border border-slate-200">
                        <div className="flex">
                            <button
                                onClick={() => setBillingPeriod("annual")}
                                className={cn(
                                    "relative z-10 px-6 py-3 rounded-full text-sm font-semibold transition-colors",
                                    billingPeriod === "annual"
                                        ? "text-white"
                                        : "text-slate-600 hover:text-slate-900"
                                )}
                            >
                                Annual
                            </button>
                            <button
                                onClick={() => setBillingPeriod("monthly")}
                                className={cn(
                                    "relative z-10 px-6 py-3 rounded-full text-sm font-semibold transition-colors",
                                    billingPeriod === "monthly"
                                        ? "text-white"
                                        : "text-slate-600 hover:text-slate-900"
                                )}
                            >
                                Monthly
                            </button>
                        </div>
                        {/* Sliding Background */}
                        <motion.div
                            className="absolute top-1 bottom-1 bg-slate-900 rounded-full"
                            initial={false}
                            animate={{
                                x: billingPeriod === "annual" ? 0 : "100%",
                                width: billingPeriod === "annual" ? "50%" : "50%"
                            }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            style={{ left: 4 }}
                        />
                    </div>
                    {billingPeriod === "annual" && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="ml-4 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold flex items-center gap-1"
                        >
                            <Star className="w-3 h-3 fill-current" />
                            Save 27%
                        </motion.div>
                    )}
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, index) => (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ y: -8 }}
                            className={cn(
                                "relative rounded-3xl p-8 transition-all duration-300",
                                plan.theme === "dark"
                                    ? "bg-slate-900 text-white border-2 border-amber-400 shadow-2xl shadow-amber-500/10"
                                    : "bg-amber-50/50 text-slate-900 border-2 border-slate-200 shadow-xl",
                                plan.popular && "lg:scale-105 z-10"
                            )}
                        >
                            {/* Badge */}
                            {plan.badge && (
                                <div className={cn(
                                    "absolute -top-3 right-6 px-4 py-1 rounded-full text-xs font-bold",
                                    plan.popular
                                        ? "bg-amber-400 text-slate-900"
                                        : "bg-slate-200 text-slate-700"
                                )}>
                                    {plan.badge}
                                </div>
                            )}

                            {/* Plan Name */}
                            <div className="flex items-center gap-3 mb-4 min-w-0">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                    plan.theme === "dark" ? "bg-white/10" : "bg-violet-100"
                                )}>
                                    {plan.id === "enterprise"
                                        ? <Building2 className={cn("w-5 h-5", plan.theme === "dark" ? "text-white" : "text-violet-600")} />
                                        : <Sparkles className={cn("w-5 h-5", plan.theme === "dark" ? "text-amber-400" : "text-violet-600")} />
                                    }
                                </div>
                                <h3 className="text-2xl font-bold truncate break-words">{plan.name}</h3>
                            </div>

                            {/* Pricing */}
                            <div className="mb-4 min-w-0 overflow-hidden">
                                {plan.monthlyPrice !== null ? (
                                    <>
                                        <div className="flex flex-wrap items-baseline gap-x-2">
                                            {billingPeriod === "annual" && (plan.monthlyPrice ?? 0) > 0 && (
                                                <span className={cn(
                                                    "text-xl line-through opacity-60",
                                                    plan.theme === "dark" ? "text-slate-500" : "text-slate-400"
                                                )}>
                                                    {plan.currency} {new Intl.NumberFormat().format(plan.monthlyPrice ?? 0)}
                                                </span>
                                            )}
                                            <span className="text-4xl md:text-5xl font-extrabold tracking-tighter">
                                                {plan.currency} {new Intl.NumberFormat().format((billingPeriod === "annual" ? plan.annualPrice : plan.monthlyPrice) ?? 0)}
                                            </span>
                                            <span className={cn(
                                                "text-sm font-bold opacity-80",
                                                plan.theme === "dark" ? "text-slate-400" : "text-slate-500"
                                            )}>
                                                /mo
                                            </span>
                                        </div>
                                        {billingPeriod === "annual" && (plan.annualBilled ?? 0) > 0 && (
                                            <p className={cn(
                                                "text-sm mt-1 font-bold",
                                                plan.theme === "dark" ? "text-amber-400" : "text-indigo-600"
                                            )}>
                                                {plan.currency} {new Intl.NumberFormat().format(plan.annualBilled ?? 0)} billed yearly
                                            </p>
                                        )}
                                    </>
                                ) : (
                                    <div className="min-w-0">
                                        <span className="text-4xl font-extrabold tracking-tight">Custom Plan</span>
                                        <p className={cn(
                                            "text-sm mt-1 font-bold",
                                            plan.theme === "dark" ? "text-slate-400" : "text-slate-500"
                                        )}>
                                            Price scales with school size
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <p className={cn(
                                "text-sm leading-relaxed mb-6 break-words whitespace-normal",
                                plan.theme === "dark" ? "text-slate-300" : "text-slate-600"
                            )}>
                                {plan.description}
                            </p>

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <div className={cn(
                                            "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                                            feature.included
                                                ? "bg-green-500 text-white"
                                                : plan.theme === "dark" ? "bg-slate-700" : "bg-slate-200"
                                        )}>
                                            {feature.included
                                                ? <Check className="w-3 h-3" />
                                                : <X className={cn("w-3 h-3", plan.theme === "dark" ? "text-slate-500" : "text-slate-400")} />
                                            }
                                        </div>
                                        <span className={cn(
                                            "text-sm break-words whitespace-normal leading-snug",
                                            !feature.included && (plan.theme === "dark" ? "text-slate-500" : "text-slate-400"),
                                            feature.highlight && "font-semibold"
                                        )}>
                                            {feature.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA Button */}
                            <Link href={plan.ctaLink} className="block">
                                <Button
                                    className={cn(
                                        "w-full h-12 rounded-xl text-base font-semibold transition-all",
                                        plan.theme === "dark"
                                            ? "bg-white text-slate-900 hover:bg-slate-100"
                                            : plan.id === "enterprise"
                                                ? "bg-violet-600 text-white hover:bg-violet-700"
                                                : "bg-transparent border-2 border-slate-300 text-slate-700 hover:bg-slate-100"
                                    )}
                                >
                                    {plan.cta}
                                </Button>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
