"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import * as Icons from "lucide-react"
import {
    Sparkles,
    ArrowRight,
    Clock,
    MoreHorizontal,
    FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudentProfile } from "@/components/student/StudentProfileContext"
import { useAuth } from "@/components/providers/AuthContext"

type RecommendedTool = {
    id: string
    name: string
    icon: string
    color: string
    desc: string
}

type HistoryItem = {
    id: number
    toolId: string
    userId: string
    title: string
    type: string
    date: string
    toolName: string
    formData: any
    output: string
}

const isHexColor = (color?: string) => Boolean(color && (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')))

export default function StudentDashboard() {
    const { profile } = useStudentProfile()
    const { user, tokens } = useAuth()
    
    const [recommendedTools, setRecommendedTools] = useState<RecommendedTool[]>([])
    const [historyItems, setHistoryItems] = useState<HistoryItem[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!tokens?.access) return
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                const res = await fetch(`${baseUrl}/api/v1/tools/student-dashboard/`, {
                    headers: { "Authorization": `Bearer ${tokens.access}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    if (data.success) {
                        setRecommendedTools(data.recommendedTools || [])
                        setHistoryItems(data.studentHistoryItems || [])
                    }
                }
            } catch (err) {
                console.error("Failed to load dashboard data", err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchDashboardData()
    }, [tokens])

    const time = new Date().getHours()
    const greeting = time < 12 ? "Good morning" : time < 18 ? "Good afternoon" : "Good evening"

    const profileFirst = profile ? profile.firstName : "Student"
    const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username || profileFirst : profileFirst

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
            >
                <div>
                    <h1 className="text-4xl font-bold mb-2 text-black dark:text-white">
                        {greeting}, {displayName}! <span className="inline-block animate-bounce">👋</span>
                    </h1>
                    <p className="text-lg text-slate-700 font-medium dark:text-slate-400">
                        Ready to learn something new today?
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recommended Tools */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 space-y-6"
                >
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-black dark:text-white">Recommended Tools</h2>
                        <Link href="/student/tools" className="text-sm transition-colors text-blue-600 hover:text-blue-800 font-medium dark:text-blue-400 dark:hover:text-blue-300">
                            View all
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[1, 2, 3].map((skeleton) => (
                                <div key={skeleton} className="p-5 border rounded-2xl bg-slate-50 border-slate-200 animate-pulse dark:bg-slate-800/50 dark:border-slate-800 h-[140px]"></div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {recommendedTools.map((tool, i) => {
                                const ToolIcon = (Icons as any)[tool.icon] || FileText
                                return (
                                    <Link
                                        key={tool.id || i}
                                        href={`/student/tools/${tool.id}`}
                                        className="group p-5 border rounded-2xl transition-all duration-300 hover:-translate-y-1 block bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 dark:bg-slate-900/50 dark:border-slate-800 dark:hover:bg-slate-800/80 dark:hover:border-blue-500/50 dark:shadow-none"
                                    >
                                        <div 
                                            className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110", !isHexColor(tool.color) && tool.color)}
                                            style={isHexColor(tool.color) ? { backgroundColor: tool.color } : {}}
                                        >
                                            <ToolIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold mb-1 text-slate-900 dark:text-white">{tool.name}</h3>
                                        <p className="text-sm leading-snug text-slate-600 dark:text-slate-400">{tool.desc}</p>
                                    </Link>
                                )
                            })}
                            {recommendedTools.length === 0 && (
                                <div className="sm:col-span-3 text-center py-6 text-slate-500 dark:text-slate-400">
                                    No recommended tools available yet.
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Recent Work */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                >
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-black dark:text-white">Your Recent Work</h2>
                        <Link href="/student/history" className="p-2 rounded-lg transition-colors text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-blue-300 dark:hover:bg-slate-800/50">
                            <MoreHorizontal className="w-5 h-5" />
                        </Link>
                    </div>

                    <div className="border rounded-2xl overflow-hidden backdrop-blur-md bg-white border-slate-200 shadow-sm dark:bg-slate-900/50 dark:border-slate-800">
                        {isLoading ? (
                            <div className="p-8 text-center text-slate-500">Loading history...</div>
                        ) : historyItems.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">No recent history found.</div>
                        ) : (
                            historyItems.slice(0, 3).map((work, i) => (
                                <Link
                                    href={`/student/tools/${work.toolId}?historyId=${work.id}`}
                                    key={work.id || i}
                                    className="block p-4 border-b last:border-0 transition-colors group cursor-pointer border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                                >
                                    <div className="flex items-start justify-between mb-1">
                                        <h4 className="font-bold transition-colors text-slate-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-300">{work.title}</h4>
                                        <ArrowRight className="w-4 h-4 transition-all group-hover:translate-x-1 text-slate-400 group-hover:text-blue-600 dark:text-white/30 dark:group-hover:text-white" />
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="flex items-center gap-1 font-medium">
                                            <Sparkles className="w-3 h-3" /> {work.toolName}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {work.date}
                                        </span>
                                    </div>
                                </Link>
                            ))
                        )}
                        {!isLoading && historyItems.length > 0 && (
                            <Link
                                href="/student/history"
                                className="block p-4 text-center text-sm font-medium transition-colors text-blue-600 hover:text-blue-800 hover:bg-slate-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-slate-800/50"
                            >
                                View all history
                            </Link>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
