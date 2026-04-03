"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Menu, X, Bell, Clock, Loader2 } from "lucide-react"
import { TeacherSidebar } from "@/components/dashboard/TeacherSidebar"
import { TeacherTour } from "@/components/dashboard/TeacherTour"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/providers/ThemeContext"
import { AuthGuard } from "@/components/auth/AuthGuard"
import { useAuth } from "@/components/providers/AuthContext"
import { useNotifications } from "@/hooks/useNotifications"

export default function TeacherAppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard>
            <TeacherLayoutContent>{children}</TeacherLayoutContent>
        </AuthGuard>
    )
}

function TeacherLayoutContent({
    children,
}: {
    children: React.ReactNode
}) {
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
    const notificationRef = useRef<HTMLDivElement>(null)
    const { theme } = useTheme()
    const { plan, tokens } = useAuth()
    const { notifications, isLoading, unreadCount, markAllRead } = useNotifications(tokens?.access)

    const showUpgrade = !plan || plan.plan_name?.toLowerCase() === 'free'

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
        <div className={cn("min-h-screen font-sans transition-colors duration-300", theme === 'dark' ? "dark bg-slate-950 text-slate-100" : "bg-white text-slate-900")}>
            <TeacherTour />
            
            {/* Desktop Sidebar */}
            <div className="hidden md:block fixed inset-y-0 left-0 z-50">
                <TeacherSidebar />
            </div>

            {/* Top Header (Mobile & Desktop) */}
            <div className="fixed top-0 left-0 right-0 h-16 z-40 flex items-center justify-between px-4 md:pl-72 md:pr-8 backdrop-blur-md border-b transition-colors bg-white/90 border-slate-200 text-slate-900 dark:bg-slate-900/80 dark:border-white/10 dark:text-white">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsMobileOpen(true)}
                        className="md:hidden p-2 rounded-lg transition-colors text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/10"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    <Link href="/" className="md:hidden font-bold text-lg ml-2 text-slate-900 dark:text-white">
                        NibbleLearn
                    </Link>

                    {/* Global Search */}
                  
                </div>

                <div className="flex items-center gap-4">
                    {showUpgrade && (
                        <Link href="/teacher/settings/billing">
                            <Button id="tour-header-upgrade" size="sm" className="hidden sm:flex shadow-lg border-0 rounded-full text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-violet-500/10 dark:shadow-violet-500/25">
                                <span className="mr-1">✨</span> Upgrade
                            </Button>
                        </Link>
                    )}

                    <div className="relative" ref={notificationRef}>
                        <button 
                            id="tour-header-notifications" 
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className={cn(
                                "relative p-2 transition-all rounded-xl",
                                isNotificationsOpen 
                                    ? "bg-violet-500/10 text-violet-600 dark:bg-violet-600/20 dark:text-violet-400" 
                                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
                            )}
                        >
                            <Bell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 bg-red-500 border-white dark:border-slate-900 animate-pulse" />
                            )}
                        </button>

                        <AnimatePresence>
                            {isNotificationsOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 25 }}
                                    className="absolute right-0 mt-3 w-80 md:w-96 rounded-2xl shadow-2xl border overflow-hidden bg-white border-slate-200 dark:bg-slate-900 dark:border-white/10 dark:shadow-black/50"
                                >
                                    <div className="p-4 border-b flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                                        <div>
                                            <h3 className="font-bold text-slate-900 dark:text-white">Notifications</h3>
                                            {unreadCount > 0 && <p className="text-xs text-violet-600 dark:text-violet-400">{unreadCount} unread</p>}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {unreadCount > 0 && (
                                                <button onClick={markAllRead} className="text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">Mark all read</button>
                                            )}
                                            <Link href="/teacher/notifications" onClick={() => setIsNotificationsOpen(false)} className="text-xs font-bold text-violet-600 hover:underline dark:text-violet-400">
                                                View all
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                        {isLoading ? (
                                            <div className="flex items-center justify-center py-8 text-slate-400">
                                                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                                <span className="text-sm">Loading...</span>
                                            </div>
                                        ) : notifications.length === 0 ? (
                                            <div className="py-10 text-center">
                                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                                <p className="text-sm text-slate-500 dark:text-slate-400">All caught up!</p>
                                            </div>
                                        ) : notifications.map((n) => (
                                            <div 
                                                key={n.id} 
                                                className={cn(
                                                    "p-4 border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer dark:border-white/5 dark:hover:bg-white/5",
                                                    !n.isRead && "bg-violet-50/30 dark:bg-violet-500/5"
                                                )}
                                            >
                                                <div className="flex gap-4">
                                                    <div className={cn("w-10 h-10 shrink-0 rounded-xl flex items-center justify-center", n.color)}>
                                                        <n.icon className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between gap-2 mb-0.5">
                                                            <p className={cn("text-sm font-bold truncate", n.isRead ? "text-slate-700 dark:text-slate-300" : "text-slate-900 dark:text-white")}>
                                                                {n.title}
                                                            </p>
                                                            {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-violet-600 animate-pulse shrink-0" />}
                                                        </div>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mb-1.5">
                                                            {n.description}
                                                        </p>
                                                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {n.time}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t bg-slate-50/50 text-center dark:bg-white/5">
                                        <Link 
                                            href="/teacher/notifications" 
                                            onClick={() => setIsNotificationsOpen(false)}
                                            className="text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                        >
                                            Manage notifications
                                        </Link>
                                    </div>
                                </motion.div>
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
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
                        />
                        <motion.div
                            initial={{ x: "-100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "-100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
                        >
                            <div className="relative h-full">
                                <button
                                    onClick={() => setIsMobileOpen(false)}
                                    className={cn(
                                        "absolute top-5 right-5 p-2 rounded-full z-20 transition-all active:scale-95 shadow-lg",
                                        theme === 'dark' ? "bg-slate-800/80 text-white border border-white/10" : "bg-white/80 text-slate-900 border border-slate-200"
                                    )}
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <TeacherSidebar onMobileClose={() => setIsMobileOpen(false)} />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="md:pl-64 pt-16 min-h-screen">
                <div className="p-6 md:p-8 w-full">
                    {children}
                </div>
            </main>
        </div>
    )
}
