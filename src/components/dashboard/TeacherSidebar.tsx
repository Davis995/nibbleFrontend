"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home,
    Wand2,

    MessageSquare,
    Users,
    History,
    Star,
    Bell,
    Settings,
    LogOut,
    HelpCircle,
    Sun,
    Moon
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/providers/ThemeContext"
import { Logo } from "@/components/logo"
import { TokenUsage } from "@/components/common/TokenUsage"
import { useAuth } from "@/components/providers/AuthContext"

interface SidebarProps {
    onMobileClose?: () => void
}

const navItems = [
    { href: "/teacher/dashboard", icon: Home, label: "Dashboard", id: "tour-sidebar-dashboard" },
    { href: "/teacher/tools", icon: Wand2, label: "Teacher Tools", id: "tour-sidebar-tools", notifications: 3 },

    // { href: "/teacher/chat", icon: MessageSquare, label: "Jarvis Chat" },
    // { href: "/teacher/rooms", icon: Users, label: "Student Rooms" },
    { href: "/teacher/history", icon: History, label: "Output History", id: "tour-sidebar-history", notifications: 5 },
    { href: "/teacher/notifications", icon: Bell, label: "Notifications", id: "tour-sidebar-notifications", notifications: 2 },
    { href: "/teacher/favorites", icon: Star, label: "Favorites", id: "tour-sidebar-favorites" },
]

export function TeacherSidebar({ onMobileClose }: SidebarProps) {
    const pathname = usePathname()
    const { theme, toggleTheme } = useTheme()
    const { user, plan, logout, tokens } = useAuth()
    const isPlusUser = true // Simulated Plus status for demonstration
    const [userProfile, setUserProfile] = useState({ initials: "JS", name: "Jane Smith" })

    const [badges, setBadges] = useState({ tools: 0, history: 0, notifications: 0 })

    useEffect(() => {
        if (!tokens?.access) return;
        const fetchBadges = async () => {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                const res = await fetch(`${baseUrl}/api/v1/auth/sidebar-badges/`, {
                    headers: { 'Authorization': `Bearer ${tokens.access}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setBadges(data);
                }
            } catch (error) {
                console.error("Failed to fetch sidebar badges", error);
            }
        };
        fetchBadges();
    }, [tokens]);

    useEffect(() => {
        const handleProfileUpdate = () => {
            const saved = localStorage.getItem("userProfile")
            if (saved) {
                try {
                    const profile = JSON.parse(saved)
                    const name = profile.displayName || `${profile.firstName} ${profile.lastName}`.trim()
                    const initials = (profile.firstName?.[0] || "") + (profile.lastName?.[0] || "")
                    setUserProfile({ initials: initials.toUpperCase() || "JS", name: name || "Jane Smith" })
                } catch (e) { }
            }
        }
        handleProfileUpdate()

        window.addEventListener('storage', handleProfileUpdate)
        window.addEventListener('profileUpdated', handleProfileUpdate)

        return () => {
            window.removeEventListener('storage', handleProfileUpdate)
            window.removeEventListener('profileUpdated', handleProfileUpdate)
        }
    }, [])

    return (
        <aside className="w-64 h-full flex flex-col backdrop-blur-xl border-r transition-colors duration-300 bg-violet-50/90 border-violet-200 text-slate-800 dark:bg-slate-900/95 dark:border-white/10 dark:text-white">
            {/* Brand */}
            <Link href="/" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Logo className="w-8 h-8 bg-violet-600 rounded-lg shadow-lg shadow-violet-500/30" />
                <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">
                    NibbleLearn
                </span>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href) && item.href !== "/app/dashboard"

                    let count = 0;
                    if (item.id === "tour-sidebar-tools") count = badges.tools;
                    else if (item.id === "tour-sidebar-history") count = badges.history;
                    else if (item.id === "tour-sidebar-notifications") count = badges.notifications;
                    else if (item.notifications) count = item.notifications; // fallback

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            id={item.id}
                            onClick={onMobileClose}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                isActive
                                    ? "bg-white text-violet-700 shadow-sm border border-violet-100 font-medium dark:bg-violet-600/20 dark:text-white dark:shadow-inner dark:border-violet-500/20"
                                    : "text-slate-600 hover:bg-white hover:text-violet-700 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform group-hover:scale-110",
                                isActive
                                    ? "text-violet-700 dark:text-violet-400"
                                    : "text-slate-500 group-hover:text-violet-600 dark:text-slate-500 dark:group-hover:text-violet-300"
                            )} />
                            <span className="text-sm flex-1">{item.label}</span>
                            {count > 0 && (
                                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                                    {count > 99 ? '99+' : count}
                                </span>
                            )}
                        </Link>
                    )
                })}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t space-y-2 border-violet-200 dark:border-white/10">

                {/* Token Usage for Plus Users - Hidden for Enterprise Users */}
                {isPlusUser && user?.user_type !== 'enterprise' && (
                    <TokenUsage theme={theme} userType="teacher" />
                )}

                {/* Theme Toggle */}
                <button
                    id="tour-sidebar-theme"
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors w-full font-medium text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
                >
                    <span className="dark:hidden"><Moon className="w-4 h-4" /></span>
                    <span className="hidden dark:inline"><Sun className="w-4 h-4" /></span>
                    <span className="dark:hidden">Dark Mode</span>
                    <span className="hidden dark:inline">Light Mode</span>
                </button>

                {/* <Link
                    href="/teacher/settings/help"
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
                >
                    <HelpCircle className="w-4 h-4" />
                    Help & Support
                </Link> */}

                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors text-slate-600 hover:bg-white hover:text-red-600 dark:text-slate-400 dark:hover:text-white dark:hover:bg-white/5"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>

                {/* User Card */}
                <div className="rounded-xl p-3 flex items-center gap-3 mt-2 transition-colors bg-white border border-violet-100 shadow-sm dark:bg-white/5 dark:border-transparent dark:shadow-none">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {user ? user.first_name.charAt(0) + user.last_name.charAt(0) : userProfile.initials}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <h4 className="text-sm font-bold truncate transition-colors cursor-pointer text-black hover:text-violet-700 dark:text-white dark:hover:text-violet-300">
                            {user ? `${user.first_name} ${user.last_name}` : userProfile.name}
                        </h4>
                        <p className="text-xs truncate text-slate-600 dark:text-slate-400">{plan?.plan_name || "Free"}</p>
                    </div>
                    {user?.user_type !== 'enterprise' && (
                        <Link id="tour-sidebar-settings" href="/teacher/settings" className="transition-colors text-slate-400 hover:text-violet-700 dark:text-slate-500 dark:hover:text-white">
                            <Settings className="w-4 h-4" />
                        </Link>
                    )}
                </div>
            </div>
        </aside>
    )
}
