"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    CreditCard,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    FileText,
    Zap,
    Users,
    Download,
    X,
    CheckCircle,
    Loader2
} from "lucide-react"
import { useTheme } from "@/components/providers/ThemeContext"
import { useAuth } from "@/components/providers/AuthContext"
import { cn } from "@/lib/utils"
import Link from "next/link"

export default function BillingOverview() {
    const { theme } = useTheme()
    const { user, tokens } = useAuth()
    const isLight = theme === 'light'

    const [billingData, setBillingData] = useState<any>(null)
    const [invoices, setInvoices] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchBilling = async () => {
        const orgId = localStorage.getItem('organisation_id') || user?.organisation_id
        if (!orgId) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/schools/${orgId}/billing/`, {
                headers: {
                    'Authorization': `Bearer ${tokens?.access || ''}`,
                    'Content-Type': 'application/json'
                }
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    setBillingData(data.billing)
                    setInvoices(data.invoices || [])
                }
            }
        } catch (err) {
            console.error("Billing fetch error", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchBilling()
        } else {
            const t = setTimeout(() => setIsLoading(false), 2000)
            return () => clearTimeout(t)
        }
    }, [user, tokens])

    const creditsUsedPercentage = billingData?.percentage_used || 0

    // TODO: Implement date check logic for backend
    // Only allow upgrade if within X days of billing cycle end or if billing cycle has ended
    const isBillingCycleEnd = billingData?.billing_end_date 
        ? (new Date(billingData.billing_end_date).getTime() - Date.now()) / (1000 * 3600 * 24) <= 7 
        : false;
    const showUpgrade = isBillingCycleEnd || billingData?.status !== 'active';

    const [isTopUpOpen, setIsTopUpOpen] = useState(false)
    const [isToppingUp, setIsToppingUp] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    const handleTopUp = async (percent: number) => {
        setIsToppingUp(true)
        const orgId = localStorage.getItem('organisation_id') || user?.organisation_id
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/schools/${orgId}/billing/topup/`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${tokens?.access || ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ percentage: percent })
            })
            if (res.ok) {
                showToast(`Successfully added +${percent}% credits!`)
                setIsTopUpOpen(false)
                fetchBilling()
            } else {
                showToast(`Failed to top up. Please try again.`, "error")
            }
        } catch (err) {
            showToast(`An error occurred.`, "error")
        } finally {
            setIsToppingUp(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6 relative pb-10">
            {/* ── TOAST ── */}
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

            {/* ── TOP UP MODAL ── */}
            <AnimatePresence>
                {isTopUpOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={cn("w-full max-w-lg rounded-2xl p-6 shadow-2xl border", isLight ? "bg-white border-slate-100" : "bg-slate-900 border-slate-800")}
                        >
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className={cn("text-xl font-bold mb-1", isLight ? "text-slate-900" : "text-white")}>Top Up Credits</h2>
                                    <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>
                                        Select a percentage to increase your current limit.
                                    </p>
                                </div>
                                <button onClick={() => setIsTopUpOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors self-start">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6">
                                {[
                                    { pct: 10, price: "$49" },
                                    { pct: 25, price: "$99" },
                                    { pct: 50, price: "$179" },
                                    { pct: 100, price: "$299" },
                                ].map((opt) => (
                                    <button
                                        key={opt.pct}
                                        onClick={() => handleTopUp(opt.pct)}
                                        className={cn(
                                            "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:scale-[1.02]",
                                            isLight
                                                ? "bg-slate-50 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50"
                                                : "bg-slate-950/50 border-slate-800 hover:border-indigo-500 hover:bg-slate-900"
                                        )}
                                    >
                                        <div className="text-xl font-black text-indigo-500 mb-2">+{opt.pct}% Credits</div>
                                        <div className="px-3 py-1 rounded bg-indigo-500 text-white text-xs font-bold shadow-sm">
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

            <div>
                <h1 className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>Billing & Subscription</h1>
                <p className={cn("text-sm", isLight ? "text-slate-500" : "text-slate-400")}>Manage your school's plan, billing details, and invoices.</p>
            </div>

            {/* Current Plan Card */}
            <div className={cn(
                "p-6 rounded-2xl border relative overflow-hidden",
                isLight
                    ? "bg-white border-slate-200 shadow-sm"
                    : "bg-slate-900 border-slate-700"
            )}>
                <div className="absolute top-0 right-0 p-4">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">Active</span>
                </div>

                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
                    <div>
                        <p className="text-sm text-slate-500 font-medium uppercase tracking-wide mb-1">Current Plan</p>
                        <h2 className={cn("text-3xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>{billingData?.plan}</h2>
                        <p className={cn("text-sm max-w-md", isLight ? "text-slate-500" : "text-slate-400")}>
                            {billingData?.status === 'active' ? "Active subscription powering your school's AI platform." : "No active subscription. Please upgrade."}
                        </p>
                    </div>

                    <div className="flex-1 w-full md:w-auto flex flex-col gap-4">
                        {/* Usage Bars */}
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1.5">
                                    <span className={isLight ? "text-slate-700" : "text-slate-300"}>Student Accounts</span>
                                    <span className={isLight ? "text-slate-500" : "text-slate-400"}>{billingData?.active_students.toLocaleString()} Active</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(((billingData?.active_students || 0) / 1000) * 100, 100)}%` }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1.5">
                                    <span className={isLight ? "text-slate-700" : "text-slate-300"}>Teacher Accounts</span>
                                    <span className={isLight ? "text-slate-500" : "text-slate-400"}>{billingData?.active_teachers} / {billingData?.max_users || 'Unlimited'}</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: billingData?.max_users ? `${((billingData?.active_teachers || 0) / billingData.max_users) * 100}%` : '10%' }} />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs font-medium mb-1.5">
                                    <span className={isLight ? "text-slate-700" : "text-slate-300"}>Credits Usage</span>
                                    <span className={cn("font-bold", creditsUsedPercentage >= 80 ? "text-red-500" : "text-amber-600")}>{creditsUsedPercentage}% Used</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full", creditsUsedPercentage >= 80 ? "bg-red-500" : "bg-amber-500")}
                                        style={{ width: `${creditsUsedPercentage}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 justify-between items-center">
                    <div className="text-sm">
                        <span className={isLight ? "text-slate-500" : "text-slate-400"}>Next billing date: </span>
                        <span className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>{billingData?.billing_end_date ? new Date(billingData.billing_end_date).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex gap-3">
                        {/* Top Up Button */}
                        <button
                            onClick={() => setIsTopUpOpen(true)}
                            className="px-4 py-2 rounded-lg text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20 flex items-center gap-2"
                        >
                            <Zap className="w-4 h-4" />
                            Top Up Credits
                        </button>

                        <Link href="/school/billing/invoices">
                            <button className={cn(
                                "px-4 py-2 rounded-lg text-sm font-medium border transition-colors",
                                isLight
                                    ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                                    : "border-slate-700 text-slate-300 hover:bg-slate-800"
                            )}>
                                View Invoices
                            </button>
                        </Link>

                        {/* Upgrade Plan - Only appears at end of billing cycle */}
                        {showUpgrade && (
                            <Link href="/school/billing/plans">
                                <button className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">
                                    Upgrade Plan
                                </button>
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            {/* Invoices Preview */}
            <div className={cn(
                "border rounded-xl overflow-hidden",
                isLight ? "bg-white border-slate-200 shadow-sm" : "bg-slate-900 border-slate-800"
            )}>
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <h3 className={cn("font-bold", isLight ? "text-slate-900" : "text-white")}>Recent Invoices</h3>
                    <Link href="/school/billing/invoices" className="text-xs text-blue-600 font-medium hover:underline">See All</Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {invoices.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-500">No recent invoices found.</div>
                    ) : (
                        invoices.map((inv) => (
                            <div key={inv.id} className="p-4 flex justify-between items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className={cn("p-2 rounded-lg", isLight ? "bg-slate-100 text-slate-500" : "bg-slate-800 text-slate-400")}>
                                        <FileText className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className={cn("text-sm font-medium", isLight ? "text-slate-900" : "text-white")}>{inv.id}</p>
                                        <p className="text-xs text-slate-500">{inv.date}</p>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <span className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>{inv.amount}</span>
                                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700">Paid</span>
                                    <button className="text-slate-400 hover:text-blue-600">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
