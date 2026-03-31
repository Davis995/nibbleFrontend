"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Star, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
// import { tools } from "@/lib/data/teacher-tools" // removed in favor of API
import { useTheme } from "@/components/providers/ThemeContext"
import { useFavorites } from "@/components/providers/FavoritesContext"
import { useAuth } from "@/components/providers/AuthContext"
import { getToolConfig } from "@/components/tool/tool-registry"

type TeacherTool = {
    id: string
    name: string
    category: string
    desc: string
    color: string
    icon: React.ComponentType<{ className?: string }>
    new?: boolean
    plus?: boolean
}

const isHexColor = (color?: string) => Boolean(color && (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')))

export default function FavoritesPage() {
    const { theme } = useTheme()
    const isLight = theme === 'light'
    const { isFavorite, toggleFavorite } = useFavorites()
    const { tokens } = useAuth()
    
    const [favoriteTools, setFavoriteTools] = useState<TeacherTool[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchFavorites = async () => {
            if (!tokens?.access) {
                setIsLoading(false)
                return
            }

            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                const res = await fetch(`${baseUrl}/api/v1/tools/my-favorites/`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${tokens.access}`,
                    },
                })

                if (!res.ok) {
                    console.error("Failed to fetch favorites:", res.status)
                    setIsLoading(false)
                    return
                }

                const data = await res.json()
                const list = Array.isArray(data.results) ? data.results : []
                
                const mappedTools: TeacherTool[] = list.map((favWrapper: any) => {
                    const item = favWrapper.tool
                    if (!item) return null

                    const id = String(item.slug ?? item.id ?? "")
                    const registryConfig = getToolConfig(id)

                    let categoryId = ""
                    if (item.category != null) {
                        if (typeof item.category === "object" && item.category.id != null) {
                            categoryId = String(item.category.id)
                        } else {
                            categoryId = String(item.category)
                        }
                    } else if (item.category_id != null) {
                        categoryId = String(item.category_id)
                    } else if (item.category?.id != null) {
                        categoryId = String(item.category.id)
                    } else if (registryConfig?.category) {
                        categoryId = String(registryConfig.category)
                    }

                    return {
                        id,
                        name: String(item.student_friendly_name || item.name || registryConfig?.name || "Untitled Tool"),
                        category: categoryId,
                        desc: String(item.description || registryConfig?.description || ""),
                        color: String(item.color || registryConfig?.color || "bg-violet-500"),
                        icon: registryConfig?.icon || Sparkles,
                        new: Boolean(item.new || false),
                        plus: Boolean(item.plus || false),
                    }
                }).filter(Boolean) as TeacherTool[]

                setFavoriteTools(mappedTools)
            } catch (error) {
                console.error("Error fetching favorites", error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchFavorites()
    }, [tokens])

    return (
        <div className="space-y-8 min-h-[60vh]">
            <div className={cn("border-b pb-8", isLight ? "border-slate-200" : "border-slate-800")}>
                <h1 className={cn("text-3xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>Favorites</h1>
                <p className={cn("text-lg", isLight ? "text-slate-600 font-medium" : "text-slate-400")}>
                    Your pinned tools for quick access.
                </p>
            </div>

            {isLoading ? (
                <div className={cn("text-center py-20 rounded-2xl border-2 border-dashed", isLight ? "border-slate-200" : "border-slate-800")}>
                    <p className={cn("max-w-md mx-auto mb-6", isLight ? "text-slate-500" : "text-slate-400")}>
                        Loading your favorite tools...
                    </p>
                </div>
            ) : favoriteTools.length > 0 ? (
                <div id="tour-favorites-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    <AnimatePresence>
                        {favoriteTools.map((tool, index) => (
                            <Link
                                key={tool.id}
                                href={`/teacher/tool/${tool.id}`}
                                className="block"
                            >
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ duration: 0.2 }}
                                    className={cn(
                                        "group relative rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200 h-full",
                                        isLight
                                            ? "bg-white border-2 border-slate-200 shadow-md hover:border-violet-300 hover:shadow-lg"
                                            : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
                                    )}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div
                                            className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110",
                                                !isHexColor(tool.color) && tool.color
                                            )}
                                            style={isHexColor(tool.color) ? { backgroundColor: tool.color } : undefined}
                                        >
                                            <tool.icon className="w-6 h-6" />
                                        </div>
                                        <button
                                            onClick={async (e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                
                                                // Update context
                                                toggleFavorite(tool.id)

                                                // Optimistically remove from list
                                                setFavoriteTools(prev => prev.filter(t => t.id !== tool.id))

                                                // API call
                                                if (tokens?.access) {
                                                    try {
                                                        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                                                        const res = await fetch(`${baseUrl}/api/v1/tools/${tool.id}/favorite/`, {
                                                            method: "DELETE",
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                                "Authorization": `Bearer ${tokens.access}`,
                                                            },
                                                        })
                                                        
                                                        if (!res.ok) {
                                                            console.error("Failed to unfavorite tool on server")
                                                        }
                                                    } catch (error) {
                                                        console.error("Error unfavoriting tool", error)
                                                    }
                                                }
                                            }}
                                            className={cn(
                                                "p-2 rounded-full transition-colors active:scale-95 text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                            )}
                                        >
                                            <Star className="w-5 h-5 fill-current" />
                                        </button>
                                    </div>

                                    <h3 className={cn("text-lg font-bold mb-2 transition-colors", isLight ? "text-slate-900 group-hover:text-violet-700" : "text-white group-hover:text-violet-300")}>
                                        {tool.name}
                                    </h3>
                                    <p className={cn("text-sm leading-relaxed mb-4", isLight ? "text-slate-600 font-medium" : "text-slate-400")}>
                                        {tool.desc}
                                    </p>

                                    <div className={cn("absolute inset-0 border-2 border-transparent rounded-2xl pointer-events-none transition-all", isLight ? "group-hover:border-violet-500/10" : "group-hover:border-violet-500/10")} />
                                </motion.div>
                            </Link>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <div id="tour-favorites-grid" className={cn("text-center py-20 rounded-2xl border-2 border-dashed", isLight ? "border-slate-200" : "border-slate-800")}>
                    <div className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4", isLight ? "bg-slate-100" : "bg-slate-800")}>
                        <Star className={cn("w-8 h-8", isLight ? "text-slate-300" : "text-slate-600")} />
                    </div>
                    <h3 className={cn("text-xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>No favorites yet</h3>
                    <p className={cn("max-w-md mx-auto mb-6", isLight ? "text-slate-500" : "text-slate-400")}>
                        Star tools you use frequently to access them quickly from here.
                    </p>
                    <Link href="/teacher/tools">
                        <button className="px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25 font-semibold">
                            Browse Tools
                        </button>
                    </Link>
                </div>
            )}
        </div>
    )
}
