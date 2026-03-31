"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
    Sparkles,
    Clock,
    ChevronRight,
    TrendingUp,
    FileText,
    Presentation,
    CheckCircle,
    MessageSquare,
    Users,
    Zap,
    Globe,
    Link as LinkIcon,
    Search,
    Edit3,
    Music,
    HelpCircle,
    BookOpen,
    Lightbulb,
    LayoutGrid,
    AlignJustify,
    Smile,
    Heart,
    ClipboardCheck
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers/AuthContext"

type ApiTool = {
    id: string
    name: string
    icon: string
    color: string
    time?: string
    desc?: string
}

type ApiCategory = {
    name: string
    count: number
    icon: string
    color: string
}

const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    FileText,
    Presentation,
    CheckCircle,
    MessageSquare,
    Users,
    Zap,
    Globe,
    Sparkles,
    Link: LinkIcon,
    Search,
    Edit3,
    Music,
    QuestionMarkCircle: HelpCircle,
    BookOpen,
    Lightbulb,
    LayoutGrid,
    AlignJustify,
    Smile,
    Heart,
    ClipboardCheck,
}

const defaultRecentTools: ApiTool[] = []
const defaultPopularTools: ApiTool[] = []
const defaultCategories: ApiCategory[] = []

const isHexColor = (color?: string) => Boolean(color && (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')))

export default function TeacherDashboard() {
    const { user, plan, tokens } = useAuth()
    const time = new Date().getHours()
    const greeting = time < 12 ? "Good morning" : time < 18 ? "Good afternoon" : "Good evening"
    const [firstName, setFirstName] = useState("Jane")
    const [recentToolsState, setRecentToolsState] = useState<ApiTool[]>(defaultRecentTools)
    const [popularToolsState, setPopularToolsState] = useState<ApiTool[]>(defaultPopularTools)
    const [categoriesState, setCategoriesState] = useState<ApiCategory[]>(defaultCategories)
    const displayName = user ? user.first_name : firstName

    useEffect(() => {
        const saved = localStorage.getItem("userProfile")
        if (saved) {
            try {
                const profile = JSON.parse(saved)
                if (profile.firstName) {
                    setFirstName(profile.firstName)
                }
            } catch (e) { }
        }
    }, [])

    useEffect(() => {
        const fetchDashboard = async () => {
            if (!tokens?.access) return

            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                const res = await fetch(`${baseUrl}/api/v1/tools/teacher-dashboard/`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${tokens.access}`,
                    },
                })

                if (!res.ok) {
                    console.error("Teacher Dashboard API error", res.status)
                    return
                }

                const data = await res.json()

                if (data.success) {
                    setRecentToolsState(Array.isArray(data.recent_tools) ? data.recent_tools : [])
                    setPopularToolsState(Array.isArray(data.popular_tools) ? data.popular_tools : [])
                    setCategoriesState(Array.isArray(data.categories) ? data.categories : [])
                }
            } catch (error) {
                console.error("Failed to fetch teacher dashboard data", error)
            }
        }

        fetchDashboard()
    }, [tokens])

    return (
        <div className="space-y-10 pb-20">
            {/* Header */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
            >
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 text-slate-900 dark:text-white">
                        {greeting}, {displayName}! <span className="inline-block animate-bounce">👋</span>
                    </h1>
                    <p className="text-lg text-slate-600 font-medium dark:text-slate-400">
                        What would you like to create for your students today?
                    </p>
                </div>

                <div className="flex gap-3">
                    {plan && (
                        <div className="rounded-2xl p-4 flex items-center gap-3 border transition-colors bg-white border-slate-200 shadow-sm dark:bg-white/5 dark:border-white/10 dark:shadow-none">
                            <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-500">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Plan</p>
                                <p className="text-lg font-bold text-slate-900 dark:text-white">{plan.plan_name}</p>
                                {/* <p className="text-xs text-slate-500 dark:text-slate-400">{plan.remaining_credits} credits left</p> */}
                            </div>
                        </div>
                    )}
                    <div className="rounded-2xl p-4 flex items-center gap-3 border transition-colors bg-white border-slate-200 shadow-sm dark:bg-white/5 dark:border-white/10 dark:shadow-none">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                            <Zap className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">Status</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white">
                                {plan ? plan.status : 'Active'}
                            </p>
                            {plan && <p className="text-xs text-slate-500 dark:text-slate-400">{plan.remaining_days} days left</p>}
                        </div>
                    </div>
                </div>
            </motion.section>

            {recentToolsState.length > 0 && (
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                            <Clock className="w-5 h-5 text-slate-500" />
                            Jump Back In
                        </h2>
                        <Link href="/teacher/history" className="text-sm transition-colors text-violet-600 hover:text-violet-800 font-medium dark:text-violet-400 dark:hover:text-white">
                            View History
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {recentToolsState.map((tool, index) => {
                            const ToolIcon = iconMap[tool.icon] || FileText
                            return (
                                <Link
                                    key={`${tool.id}-${index}`}
                                    href={`/teacher/tool/${tool.id}`}
                                    className="group p-4 rounded-xl border transition-all duration-200 block bg-white border-slate-200 hover:border-violet-300 hover:shadow-md dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-white/20 dark:shadow-none"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div 
                                            className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg", !isHexColor(tool.color) && tool.color)}
                                            style={isHexColor(tool.color) ? { backgroundColor: tool.color } : undefined}
                                        >
                                            <ToolIcon className="w-5 h-5" />
                                        </div>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{tool.time}</span>
                                    </div>
                                    <h3 className="font-semibold transition-colors truncate text-slate-900 group-hover:text-violet-700 dark:text-white dark:group-hover:text-white">{tool.name}</h3>
                                </Link>
                            )
                        })}
                    </div>
                </motion.section>
            )}

            {/* Popular Tools */}
            <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                        <TrendingUp className="w-5 h-5 text-amber-500" />
                        Popular This Week
                    </h2>
                    <Link href="/teacher/tools" className="flex items-center gap-1 text-sm transition-colors text-slate-600 hover:text-black font-medium dark:text-slate-400 dark:hover:text-white">
                        View all 80+ tools <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {popularToolsState.map((tool, index) => {
                        const ToolIcon = iconMap[tool.icon] || FileText
                        return (
                            <Link
                                key={`${tool.id}-${index}`}
                                href={`/teacher/tool/${tool.id}`}
                                className="group relative p-5 rounded-2xl border transition-all hover:-translate-y-1 block bg-white border-slate-200 shadow-sm hover:border-violet-300 hover:shadow-lg dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-white/20 dark:shadow-none"
                            >
                                <div className="flex items-start gap-4">
                                    <div 
                                        className={cn("w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110", !isHexColor(tool.color) && tool.color)}
                                        style={isHexColor(tool.color) ? { backgroundColor: tool.color } : undefined}
                                    >
                                        <ToolIcon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold transition-colors mb-1 text-slate-900 group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">
                                            {tool.name}
                                        </h3>
                                        <p className="text-sm line-clamp-2 leading-relaxed text-slate-600 font-medium dark:text-slate-400">
                                            {tool.desc}
                                        </p>
                                    </div>
                                </div>
                                <div className="absolute inset-0 rounded-2xl border-2 border-transparent pointer-events-none transition-all group-hover:border-violet-500/10" />
                            </Link>
                        )
                    })}
                </div>
            </motion.section>

            {/* Explore Categories */}
            {/* <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">Explore by Category</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categoriesState.map((cat, i) => {
                        const CatIcon = iconMap[cat.icon] || FileText
                        return (
                            <Link
                                key={i}
                                href="/teacher/tools"
                                className="group relative overflow-hidden rounded-2xl aspect-[4/3] flex flex-col items-center justify-center p-6 border transition-all bg-white border-slate-200 shadow-sm hover:border-violet-300 hover:shadow-md dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-white/20 dark:shadow-none"
                            >
                                <div 
                                    className={cn(
                                        "w-12 h-12 rounded-full mb-3 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform",
                                        !isHexColor(cat.color) ? `bg-gradient-to-br ${cat.color}` : ""
                                    )}
                                    style={isHexColor(cat.color) ? { backgroundColor: cat.color } : undefined}
                                >
                                    <CatIcon className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold transition-colors text-slate-900 group-hover:text-violet-700 dark:text-white dark:group-hover:text-violet-300">{cat.name}</h3>
                                <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">{cat.count} tools</p>
                            </Link>
                        )
                    })}
                </div>
            </motion.section> */}
        </div>
    )
}  
