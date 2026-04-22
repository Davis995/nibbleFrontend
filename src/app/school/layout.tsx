"use client"

import React, { useState, useRef, useEffect } from "react"
import { Menu, X, Bell, Settings, CreditCard, User, Users, LogOut, Clock, Zap, CheckCircle, ShieldAlert } from "lucide-react"
import { SchoolSidebar } from "@/components/school/SchoolSidebar"
import { AnimatePresence, motion } from "framer-motion"
import { useTheme } from "@/components/providers/ThemeContext"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { SchoolOnboardingScreen } from "@/components/school/SchoolOnboardingScreen"
import { useAuth } from "@/components/providers/AuthContext"

export default function SchoolLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
    const notificationRef = useRef<HTMLDivElement>(null)
    const { theme } = useTheme()
    const { user } = useAuth()
    // Enforce Light Mode for School Dashboard as per requirements (Clean White/Cream & Blue)
    // We can still respect the toggle if needed, but the default "school" look is requested to be specific.
    // For now I will stick to the dynamic theme but tweak colors to match "Landing Page" vibe.
    const isLight = theme === 'light'

    const notifications: any[] = []

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <AuthGuard>
            {/* Onboarding Modal - Forces admin to complete setup if they haven't */}
            {/* {user && user.org_orientation === false && (
                <SchoolOnboardingScreen />
            )} */}
            <div className={cn(
                "min-h-screen font-sans selection:bg-blue-500/30 transition-colors duration-300",
                isLight ? "bg-[#F8FAFC] text-slate-900" : "dark bg-slate-950 text-slate-100"
            )}>
            {/* Desktop Sidebar */}
            <div className="hidden md:block fixed inset-y-0 left-0 z-50">
                <SchoolSidebar />
            </div>

            {/* Top Header */}
            <div className={cn(
                "fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4 md:pl-72 md:pr-8 backdrop-blur-md border-b transition-colors",
                isLight
                    ? "bg-white/80 border-slate-200"
                    : "bg-slate-950/80 border-slate-800"
            )}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className={cn(
                            "md:hidden p-2 rounded-lg transition-colors",
                            isLight ? "text-slate-600 hover:bg-slate-100" : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <h1 className={cn("text-lg font-semibold hidden sm:block", isLight ? "text-slate-800" : "text-white")}>
                        Administrative Dashboard
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className={cn("h-6 w-px mx-1", isLight ? "bg-slate-200" : "bg-slate-800")} />

                    <div className="relative" ref={notificationRef}>
                        <button 
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className={cn(
                                "relative p-2 transition-all rounded-lg",
                                isNotificationsOpen 
                                    ? isLight ? "bg-blue-50 text-blue-600" : "bg-blue-500/10 text-blue-400"
                                    : isLight ? "text-slate-500 hover:text-blue-600 hover:bg-slate-50" : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                        </button>

                        <AnimatePresence>
                            {isNotificationsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className={cn(
                                        "absolute right-0 mt-2 w-80 md:w-96 rounded-2xl shadow-xl border overflow-hidden z-50",
                                        isLight ? "bg-white border-slate-100" : "bg-slate-900 border-slate-800 shadow-black/50"
                                    )}
                                >
                                    <div className={cn("p-4 border-b flex items-center justify-between", isLight ? "bg-slate-50/50" : "bg-white/5")}>
                                        <h3 className={cn("font-bold text-sm", isLight ? "text-slate-900" : "text-white")}>System Alerts</h3>
                                        <Link href="/school/notifications" onClick={() => setIsNotificationsOpen(false)} className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">
                                            View all
                                        </Link>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {notifications.map((n) => (
                                            <div 
                                                key={n.id} 
                                                className={cn(
                                                    "p-4 border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer dark:border-white/5 dark:hover:bg-white/5",
                                                    !n.isRead && (isLight ? "bg-blue-50/30" : "bg-blue-500/5")
                                                )}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={cn("w-9 h-9 shrink-0 rounded-lg flex items-center justify-center", n.color)}>
                                                        <n.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                                            <p className={cn("text-xs font-bold truncate", isLight ? "text-slate-900" : "text-white")}>
                                                                {n.title}
                                                            </p>
                                                            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
                                                        </div>
                                                        <p className={cn("text-[11px] line-clamp-1 mb-1", isLight ? "text-slate-500" : "text-slate-400")}>
                                                            {n.description}
                                                        </p>
                                                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {n.time}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className={cn("p-3 border-t text-center", isLight ? "bg-slate-50/50" : "bg-white/5")}>
                                        <Link 
                                            href="/school/notifications" 
                                            onClick={() => setIsNotificationsOpen(false)}
                                            className={cn("text-xs font-bold", isLight ? "text-slate-600 hover:text-blue-600" : "text-slate-400 hover:text-white")}
                                        >
                                            View administrative center
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                            className="flex items-center gap-2 focus:outline-none"
                        >
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shadow-md ring-2 ring-white cursor-pointer hover:ring-blue-100 transition-all">
                                AD
                            </div>
                        </button>

                        <AnimatePresence>
                            {isProfileOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className={cn(
                                            "absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl border overflow-hidden z-50",
                                            isLight ? "bg-white border-slate-100" : "bg-slate-900 border-slate-800"
                                        )}
                                    >
                                        <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                            <p className={cn("text-sm font-semibold", isLight ? "text-slate-900" : "text-white")}>Admin User</p>
                                            <p className="text-xs text-slate-500">admin@school.edu</p>
                                        </div>
                                        <div className="p-1">
                                            <Link href="/school/settings" onClick={() => setIsProfileOpen(false)} className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors", isLight ? "hover:bg-slate-50 text-slate-700" : "hover:bg-slate-800 text-slate-300")}>
                                                <User className="w-4 h-4" /> Profile
                                            </Link>
                                            <Link href="/school/billing" onClick={() => setIsProfileOpen(false)} className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors", isLight ? "hover:bg-slate-50 text-slate-700" : "hover:bg-slate-800 text-slate-300")}>
                                                <CreditCard className="w-4 h-4" /> Billing & Plans
                                            </Link>
                                            <Link href="/school/settings" onClick={() => setIsProfileOpen(false)} className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors", isLight ? "hover:bg-slate-50 text-slate-700" : "hover:bg-slate-800 text-slate-300")}>
                                                <Settings className="w-4 h-4" /> Settings
                                            </Link>
                                        </div>
                                        <div className="p-1 border-t border-slate-100 dark:border-slate-800">
                                            <Link href="/login" className={cn("flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20")}>
                                                <LogOut className="w-4 h-4" /> Sign Out
                                            </Link>
                                        </div>
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-50 w-72 md:hidden"
                        >
                            <div className="relative h-full">
                                <button
                                    onClick={() => setIsMobileOpen(false)}
                                    className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <SchoolSidebar onMobileClose={() => setIsMobileOpen(false)} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="md:pl-64 pt-16 min-h-screen">
                <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                    {children}
                </div>
            </main>
        </div>
        </AuthGuard>
    )
}

