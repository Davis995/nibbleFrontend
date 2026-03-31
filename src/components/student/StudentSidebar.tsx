"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Home,
    Wand2,
    MessageCircle,
    Star,
    LogOut,
    Settings,
    Sun,
    Moon,
    Zap,
    RotateCcw,
    Bell
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/logo"
import { TokenUsage } from "@/components/common/TokenUsage"
import { useTheme } from "@/components/providers/ThemeContext"
import { useStudentProfile } from "@/components/student/StudentProfileContext"
import { useAuth } from "@/components/providers/AuthContext"

interface StudentSidebarProps {
    onCheckClicks?: () => void
    theme?: 'dark' | 'light' // Keeping for backward compatibility but optional
    onToggleTheme?: () => void // Keeping optional
}

const navItems = [
    { href: "/student/dashboard", icon: Home, label: "Home" },
    { href: "/student/tools", icon: Wand2, label: "My Tools", notifications: 2 },
    // { href: "/student/chat", icon: MessageCircle, label: "Jarvis Chat" },
    { href: "/student/history", icon: RotateCcw, label: "History", notifications: 4 },
    { href: "/student/notifications", icon: Bell, label: "Notifications", notifications: 2 },
    { href: "/student/favorites", icon: Star, label: "Favorites" },
]

export function StudentSidebar({ onCheckClicks }: StudentSidebarProps) {
    const pathname = usePathname()
    // Use the hook internally if not provided (allowing override if needed, but standardizing on global)
    const { theme, toggleTheme } = useTheme()
    const { profile } = useStudentProfile()
    const { user, plan, logout, tokens } = useAuth()

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

    // Check if we are in Student Light or Dark environment - now purely class based
    // But wait, the student theme context was identical to global.

    const isPlusUser = true // Simulated Plus status for demonstration

    return (
        <aside className="w-64 h-full flex flex-col backdrop-blur-xl transition-colors duration-300 bg-blue-50/90 border-r border-blue-200 text-slate-800 dark:bg-slate-900/50 dark:border-slate-800/80 dark:text-slate-100">
            {/* Brand */}
            <Link href="/" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
                <Logo className="w-8 h-8 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/30" />
                <div className="flex flex-col">
                    <span className="font-bold text-lg tracking-tight leading-none text-slate-900 dark:text-white">
                        NibbleStudent
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5 text-slate-500 dark:text-blue-400">
                        {plan?.plan_name || "Free"}
                    </span>
                </div>
            </Link>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    
                    let count = 0;
                    if (item.href === "/student/tools") count = badges.tools;
                    else if (item.href === "/student/history") count = badges.history;
                    else if (item.href === "/student/notifications") count = badges.notifications;
                    else if (item.notifications) count = item.notifications; // fallback

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onCheckClicks}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                                isActive
                                    ? "bg-white text-blue-600 shadow-sm border border-blue-100 font-medium dark:bg-blue-600/20 dark:text-blue-300 dark:border-blue-500/30"
                                    : "text-black hover:bg-white hover:text-blue-700 hover:shadow-sm dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                            )}
                        >
                            <item.icon className={cn(
                                "w-5 h-5 transition-transform group-hover:scale-110",
                                isActive
                                    ? "text-blue-700 dark:text-blue-300"
                                    : "text-slate-800 group-hover:text-blue-600 dark:text-slate-500 dark:group-hover:text-blue-400"
                            )} />
                            <span className="flex-1">{item.label}</span>
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
            <div className="p-4 space-y-4 border-t border-slate-300 dark:border-slate-800">

                {/* Upgrade Button */}
                {/* Token Usage or Upgrade Button */}
                {isPlusUser ? (
                    <TokenUsage theme={theme} userType="student" />
                ) : (
                    <Link
                        href="/student/upgrade"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all group"
                    >
                        <div className="p-1 rounded bg-white/20">
                            <Zap className="w-4 h-4 fill-current" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold">Upgrade to Plus</p>
                            <p className="text-[10px] opacity-80 font-medium">Unlock all AI tools</p>
                        </div>
                    </Link>
                )}

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors w-full font-medium text-black hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
                >
                    <span className="dark:hidden"><Moon className="w-4 h-4" /></span>
                    <span className="hidden dark:inline"><Sun className="w-4 h-4" /></span>
                    <span className="dark:hidden">Dark Mode</span>
                    <span className="hidden dark:inline">Light Mode</span>
                </button>

                {/* Sign Out */}
                <button
                    onClick={logout}
                    className="flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors w-full font-medium text-black hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-red-400"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </button>

                {/* User Card */}
                <div className="rounded-xl p-3 flex items-center gap-3 transition-colors bg-white border border-slate-300 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                    {profile.avatar ? (
                        <div className="w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                            <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-md uppercase">
                            {user ? user.first_name.charAt(0) + user.last_name.charAt(0) : profile.firstName.charAt(0) + (profile.lastName?.charAt(0) || '')}
                        </div>
                    )}
                    <div className="flex-1 overflow-hidden">
                        <h4 className="text-sm font-bold truncate text-black dark:text-white">
                            {user ? `${user.last_name}` : profile.displayName}
                        </h4>
                        
                    </div>
                    <Link href="/student/settings" className="transition-colors text-slate-800 hover:text-blue-700 dark:text-slate-400 dark:hover:text-white">
                        <Settings className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        </aside>
    )
}
