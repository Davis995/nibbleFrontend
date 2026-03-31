"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Flame, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/StudentThemeContext"
import { useStudentFavorites } from "@/components/student/StudentFavoritesContext"
import { useAuth } from "@/components/providers/AuthContext"
import { getToolConfig } from "@/components/tool/tool-registry"

type StudentTool = {
    id: string
    name: string
    category: string
    desc: string
    color: string
    icon: React.ComponentType<{ className?: string }>
    isHot?: boolean
    is_favorited?: boolean
}

export default function StudentFavoritesPage() {
    const { theme } = useStudentTheme()
    const isLight = theme === 'light'
    const { isFavorite, toggleFavorite } = useStudentFavorites()
    const [isMounted, setIsMounted] = useState(false)
    const { tokens } = useAuth()
    const [toolsData, setToolsData] = useState<StudentTool[]>([])

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        const fetchTools = async () => {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            try {
                const headers: Record<string, string> = { "Content-Type": "application/json" }
                if (tokens?.access) headers["Authorization"] = `Bearer ${tokens.access}`
                
                const res = await fetch(`${baseUrl}/api/v1/tools/?type=student`, { headers })
                if (res.ok) {
                    const data = await res.json()
                    const list = Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : [])
                    
                    const mapped: StudentTool[] = list.map((item: any) => {
                        const id = String(item.slug ?? item.id ?? "")
                        const registryConfig = getToolConfig(id)
                        
                        return {
                            id,
                            name: String(item.student_friendly_name || item.name || registryConfig?.name || "Untitled"),
                            category: String(item.category?.id || item.category || registryConfig?.category || ""),
                            desc: String(item.description || registryConfig?.description || ""),
                            color: String(item.color || registryConfig?.color || "bg-blue-500"),
                            icon: registryConfig?.icon || Sparkles,
                            isHot: Boolean(item.new || item.plus || item.is_hot),
                            is_favorited: Boolean(item.is_favorited)
                        }
                    })
                    if (mapped.length > 0) setToolsData(mapped)
                }
            } catch (err) { console.error("Tools fetch error", err) }
        }
        fetchTools()
    }, [tokens])

    const favoriteTools = toolsData.filter(tool => isFavorite(tool.id) || tool.is_favorited)

    const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        e.preventDefault()

        const tool = toolsData.find(t => t.id === id)
        const favorited = tool?.is_favorited ?? isFavorite(id)

        setToolsData(prev => prev.map(t => t.id === id ? { ...t, is_favorited: !favorited } : t))
        toggleFavorite(id)

        if (tokens?.access) {
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                const res = await fetch(`${baseUrl}/api/v1/tools/${id}/favorite/`, {
                    method: favorited ? "DELETE" : "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${tokens.access}`
                    }
                })
                if (!res.ok) {
                    setToolsData(prev => prev.map(t => t.id === id ? { ...t, is_favorited: favorited } : t))
                    toggleFavorite(id)
                }
            } catch {
                setToolsData(prev => prev.map(t => t.id === id ? { ...t, is_favorited: favorited } : t))
                toggleFavorite(id)
            }
        }
    }

    if (!isMounted) return null

    return (
        <div className="space-y-8 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={cn("border-b pb-8 pt-6", isLight ? "border-slate-200" : "border-slate-800")}>
                <h1 className={cn("text-3xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>Favorites</h1>
                <p className={cn("text-lg", isLight ? "text-slate-600 font-medium" : "text-slate-400")}>
                    Your pinned tools for quick access.
                </p>
            </div>

            {favoriteTools.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    <AnimatePresence>
                        {favoriteTools.map((tool, index) => (
                            <motion.div
                                key={tool.id}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                    "group relative rounded-[20px] p-5 border transition-all duration-200 cursor-pointer overflow-hidden",
                                    isLight
                                        ? "bg-white border-slate-200 shadow-sm hover:bg-blue-50/40 hover:border-blue-200 hover:-translate-y-[2px] hover:shadow-lg"
                                        : "bg-slate-900/50 border-slate-800 shadow-lg hover:bg-slate-800/80 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)]"
                                )}
                            >
                                <Link href={`/student/tools/${tool.id}`} className="absolute inset-0 z-10" />
                                {/* Hot Badge */}
                                {tool.isHot && (
                                    <div className="absolute top-4 right-12 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 z-20">
                                        <Flame className="w-3 h-3 fill-current" /> Hot
                                    </div>
                                )}

                                {/* Favorite Button */}
                                <button
                                    onClick={(e) => handleToggleFavorite(e, tool.id)}
                                    className={cn(
                                        "absolute top-4 right-4 p-1.5 rounded-lg transition-all active:scale-95 z-20",
                                        "text-amber-400 hover:text-amber-500 bg-amber-400/10"
                                    )}
                                >
                                    <Star className="w-5 h-5 fill-current transition-transform hover:scale-110" />
                                </button>

                                <div className="flex flex-col gap-4">
                                    <div className={cn(
                                        "w-12 h-12 rounded-[14px] flex items-center justify-center",
                                        isLight
                                            ? "bg-blue-50"
                                            : "bg-white/[0.1] shadow-inner"
                                    )}>
                                        <tool.icon className={cn("w-6 h-6", isLight ? "text-[#2563EB]" : "text-blue-300")} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className={cn("font-bold text-lg leading-tight", isLight ? "text-[#0F172A]" : "text-white")}>
                                            {tool.name}
                                        </h3>
                                        <p className={cn("text-xs leading-relaxed line-clamp-2 font-medium", isLight ? "text-[#334155]" : "text-slate-300")}>
                                            {tool.desc}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div className={cn("text-center py-20 rounded-2xl border-2 border-dashed", isLight ? "border-slate-200" : "border-slate-800")}>
                    <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4", isLight ? "bg-slate-100" : "bg-slate-800")}>
                        <Star className={cn("w-8 h-8", isLight ? "text-slate-300" : "text-slate-600")} />
                    </div>
                    <h3 className={cn("text-xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>No favorites yet</h3>
                    <p className={cn("max-w-md mx-auto mb-6", isLight ? "text-slate-500" : "text-slate-400")}>
                        Star tools you use frequently to access them quickly from here.
                    </p>
                    <Link href="/student/tools">
                        <button className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/25 font-semibold">
                            Browse Tools
                        </button>
                    </Link>
                </div>
            )}
        </div>
    )
}
