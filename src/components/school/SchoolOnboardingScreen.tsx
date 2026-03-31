"use client"

import React, { useState } from "react"
import { motion, AnimatePresence, Variants } from "framer-motion"
import {
    Phone,
    ArrowRight,
    Check,
    Loader2,
    ChevronRight,
    School as SchoolIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/AuthContext"
import toast from "react-hot-toast"

export function SchoolOnboardingScreen() {
    const { user, tokens, updateOrgOrientation } = useAuth()
    const [phone, setPhone] = useState("")
    const [countryCode, setCountryCode] = useState("+256")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleComplete = async () => {
        if (!phone.trim()) {
            toast.error("Please enter a contact phone number")
            return
        }

        setIsSubmitting(true)
        const orgId = localStorage.getItem('organisation_id') || user?.organisation_id

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/schools/${orgId}/onboard-orientation/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokens?.access}`,
                },
                body: JSON.stringify({
                    phone_number: `${countryCode}${phone}`,
                    plan_name: "Premium", // By default generate a rich demo
                }),
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || "Failed to complete onboarding")
            }

            const data = await res.json()
            updateOrgOrientation(true)
            toast.success("Welcome aboard! Demo data has been generated. 🎉", { duration: 5000 })
            
            // Refresh page to show new data
            window.location.reload()
        } catch (error) {
            console.error("Onboarding error:", error)
            toast.error((error as Error).message || "Something went wrong. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    // ─── Animations ─────────────────────────────────────────────────────────

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    }

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 bg-slate-950/90 backdrop-blur-md"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden shadow-indigo-500/10"
            >
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -ml-32 -mb-32" />

                <div className="relative p-8 md:p-12">
                    {/* Header */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <SchoolIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white tracking-tight">School Onboarding</h2>
                            <p className="text-slate-400 text-sm">Let&apos;s set up your institutional workspace</p>
                        </div>
                    </div>

                    <AnimatePresence mode="wait">
                        <motion.div
                            key="step-1"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <motion.div variants={itemVariants} className="space-y-4">
                                <h3 className="text-white text-lg font-semibold flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                    Contact Information
                                </h3>
                                <p className="text-slate-400 text-sm">Provide a phone number for administrative contact. We&apos;ll auto-generate a full 30-day Demo setup for you to explore!</p>
                                
                                <div className="flex gap-3">
                                    <div className="relative">
                                        <select
                                            value={countryCode}
                                            onChange={(e) => setCountryCode(e.target.value)}
                                            className="appearance-none h-14 pl-4 pr-10 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all cursor-pointer text-sm"
                                        >
                                            <option value="+256">UG +256</option>
                                            <option value="+254">KE +254</option>
                                            <option value="+255">TZ +255</option>
                                            <option value="+1">US +1</option>
                                            <option value="+44">UK +44</option>
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 rotate-90" />
                                    </div>
                                    <div className="relative flex-1">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="Admin Phone Number"
                                            className="w-full h-14 pl-12 pr-4 bg-slate-950 border border-slate-800 rounded-2xl text-white placeholder:text-slate-600 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all font-medium"
                                            onKeyDown={(e) => {
                                                if(e.key === "Enter") {
                                                    handleComplete()
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div variants={itemVariants} className="pt-4 text-center">
                                <button
                                    onClick={handleComplete}
                                    disabled={isSubmitting}
                                    className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/20 active:scale-95 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Generating Demo Content...
                                        </>
                                    ) : (
                                        <>
                                            Activate Demo Setup
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}
