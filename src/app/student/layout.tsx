"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Bell, Clock, Zap, Trophy, Shield, Trash2 } from "lucide-react"
import { StudentSidebar } from "@/components/student/StudentSidebar"
import { StudentFavoritesProvider } from "@/components/student/StudentFavoritesContext"
import { StudentProfileProvider } from "@/components/student/StudentProfileContext"
import { AnimatePresence, motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useTheme } from "@/components/providers/ThemeContext"

function StudentLayoutContent({ children }: { children: React.ReactNode }) {
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
    const notificationRef = useRef<HTMLDivElement>(null)
    const pathname = usePathname()
    const { theme } = useTheme()

    const notifications = [
        {
            id: "1",
            title: "New Quiz Available",
            description: "Algebra Foundations is ready.",
            time: "1h ago",
            icon: Zap,
            color: "text-blue-500 bg-blue-500/10",
            isRead: false
        },
        {
            id: "2",
            title: "Streak Master!",
            description: "5 day streak achieved.",
            time: "4h ago",
            icon: Trophy,
            color: "text-amber-500 bg-amber-500/10",
            isRead: false
        }
    ]

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
        <div className={cn(
            "min-h-screen font-sans antialiased transition-colors duration-500 selection:bg-blue-200",
            theme === 'dark'
                ? "dark bg-slate-950 text-slate-100 dark:selection:bg-blue-500/30"
                : "bg-background text-slate-900"
        )}>
            {/* Desktop Sidebar */}
            <div className="hidden md:block fixed inset-y-0 left-0 z-50">
                <StudentSidebar />
            </div>

            {/* Header (Desktop & Mobile) */}
            <div className={cn(
                "fixed top-0 right-0 h-16 z-40 flex items-center justify-between px-4 lg:px-8 backdrop-blur-md border-b transition-all duration-300",
                "left-0 md:left-64",
                theme === 'dark' 
                    ? "bg-slate-950/80 border-slate-800 text-white" 
                    : "bg-white/80 border-slate-200 text-slate-900"
            )}>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="md:hidden p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/10"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="font-bold text-lg md:text-xl hidden sm:block capitalize">
                        {pathname.split('/').pop()?.replace(/-/g, ' ')}
                    </h1>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative" ref={notificationRef}>
                        <button 
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className={cn(
                                "relative p-2 transition-all rounded-xl",
                                isNotificationsOpen 
                                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" 
                                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                            )}
                        >
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 animate-pulse"></span>
                        </button>

                        <AnimatePresence>
                            {isNotificationsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className={cn(
                                        "absolute right-0 mt-3 w-80 md:w-96 rounded-2xl shadow-xl border overflow-hidden z-50",
                                        theme === 'dark' ? "bg-slate-900 border-slate-800 shadow-black/50" : "bg-white border-slate-200"
                                    )}
                                >
                                    <div className={cn("p-4 border-b flex items-center justify-between", theme === 'dark' ? "bg-white/5" : "bg-slate-50/50")}>
                                        <h3 className="font-bold text-sm">Recent Updates</h3>
                                        <Link href="/student/notifications" onClick={() => setIsNotificationsOpen(false)} className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400">
                                            View all
                                        </Link>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {notifications.map((n) => (
                                            <div 
                                                key={n.id} 
                                                className={cn(
                                                    "p-4 border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer dark:border-white/5 dark:hover:bg-white/5",
                                                    !n.isRead && (theme === 'dark' ? "bg-blue-500/5" : "bg-blue-50/30")
                                                )}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={cn("w-9 h-9 shrink-0 rounded-xl flex items-center justify-center", n.color)}>
                                                        <n.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                                            <p className="text-xs font-bold truncate">{n.title}</p>
                                                            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />}
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-1">
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
                                    <div className={cn("p-3 border-t text-center", theme === 'dark' ? "bg-white/5" : "bg-slate-50/50")}>
                                        <Link 
                                            href="/student/notifications" 
                                            onClick={() => setIsNotificationsOpen(false)}
                                            className="text-xs font-bold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white"
                                        >
                                            View full notifications
                                        </Link>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                        ST
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
                            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 md:hidden"
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
                                <StudentSidebar
                                    onCheckClicks={() => setIsMobileOpen(false)}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="md:pl-64 pt-16 min-h-screen transition-all duration-300">
                {/* Decorative background shapes - Reduced opacity in light mode */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[120px] mix-blend-screen transition-opacity duration-500 bg-blue-300/30 opacity-50 dark:bg-blue-600/20 dark:opacity-100" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[100px] mix-blend-screen transition-opacity duration-500 bg-purple-300/30 opacity-50 dark:bg-indigo-600/20 dark:opacity-100" />
                </div>

                <div className="relative z-10 p-4 md:p-8 w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
    // StudentThemeProvider is removed as it's redundant with the root ThemeProvider
    return (
        <AuthGuard>
            <StudentProfileProvider>
                <StudentFavoritesProvider>
                    <StudentLayoutContent>{children}</StudentLayoutContent>
                </StudentFavoritesProvider>
            </StudentProfileProvider>
        </AuthGuard>
    )
}
