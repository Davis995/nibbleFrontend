"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Star, Filter, Sparkles, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getToolConfig } from "@/components/tool/tool-registry"
import { useTheme } from "@/components/providers/ThemeContext"
import { useFavorites } from "@/components/providers/FavoritesContext"
import { useAuth } from "@/components/providers/AuthContext"

const defaultCategories = [
    { id: "all", label: "All Tools" },
]

type TeacherTool = {
    id: string
    name: string
    category: string
    desc: string
    color: string
    icon: React.ComponentType<{ className?: string }>
    new?: boolean
    plus?: boolean
    is_favorited?: boolean
}

const normalizeCategoryId = (name: string) => {
    const raw = name.trim().toLowerCase()
    if (raw.includes("communication")) return "communication"
    if (raw.includes("support")) return "support"
    if (raw.includes("planning")) return "planning"
    if (raw.includes("assessment")) return "assessment"
    if (raw.includes("productivity")) return "productivity"
    return raw.replace(/\s+/g, "-")
}

const mapApiCategories = (apiCategories: Array<{ id?: number | string; name?: string }>) => {
    const mapped = apiCategories.map((cat) => {
        const id = cat.id != null ? String(cat.id) : normalizeCategoryId(String(cat.name ?? ""))
        const label = (cat.name || "").trim() || (id === "all" ? "All Tools" : "Unknown")
        return { id, label }
    })

    const allCategory = { id: "all", label: "All Tools" }
    return [allCategory, ...mapped.filter((cat) => cat.id !== "all")]
}

const isHexColor = (color?: string) => Boolean(color && (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')))

export default function TeacherToolsPage() {
    const [activeCategory, setActiveCategory] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [categories, setCategories] = useState(defaultCategories)
    const [toolsData, setToolsData] = useState<TeacherTool[]>([])
    const { theme } = useTheme()
    const isLight = theme === 'light'
    const { isFavorite, toggleFavorite } = useFavorites()
    const { tokens } = useAuth()

    // Scroll Controls for Categories
    const scrollRef = React.useRef<HTMLDivElement>(null)
    const [showArrows, setShowArrows] = useState({ left: false, right: false })

    const handleScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
            setShowArrows({
                left: scrollLeft > 10,
                right: scrollLeft < scrollWidth - clientWidth - 10
            })
        }
    }

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 200
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            })
        }
    }

    useEffect(() => {
        const timer = setTimeout(handleScroll, 500)
        return () => clearTimeout(timer)
    }, [categories])

    useEffect(() => {
        handleScroll()
        window.addEventListener('resize', handleScroll)
        return () => window.removeEventListener('resize', handleScroll)
    }, [])

    useEffect(() => {
        const fetchCategories = async () => {
            if (!tokens?.access) return

            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                const res = await fetch(`${baseUrl}/api/v1/tools/categories/?type=teacher`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${tokens.access}`,
                    },
                })

                if (!res.ok) {
                    console.error("Teacher tools categories API error", res.status)
                    return
                }

                const data = await res.json()
                if (Array.isArray(data)) {
                    setCategories(mapApiCategories(data))
                } else if (Array.isArray(data.categories)) {
                    setCategories(mapApiCategories(data.categories))
                }
            } catch (error) {
                console.error("Failed to fetch teacher tools categories", error)
            }
        }

        fetchCategories()
    }, [tokens])

    useEffect(() => {
        const fetchTools = async () => {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            try {
                const headers: Record<string, string> = {
                    "Content-Type": "application/json",
                }
                if (tokens?.access) {
                    headers["Authorization"] = `Bearer ${tokens.access}`
                }

                const categoryParam = activeCategory && activeCategory !== "all" ? `&category=${encodeURIComponent(activeCategory)}` : ""
                const searchParam = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : ""
                const res = await fetch(`${baseUrl}/api/v1/tools/?type=teacher${categoryParam}${searchParam}`, {
                    method: "GET",
                    headers,
                })

                if (!res.ok) {
                    const bodyText = await res.text().catch(() => "<unreadable>")
                    console.error("Teacher tools API error", res.status, bodyText)
                    return
                }

                const data = await res.json()
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data.results)
                        ? data.results
                        : []

                const mappedTools: TeacherTool[] = list.map((item: any) => {
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
                        is_favorited: Boolean(item.is_favorited),
                    }
                })

                if (mappedTools.length > 0) {
                    setToolsData(mappedTools)
                }
            } catch (error) {
                console.error("Failed to fetch teacher tools", error)
            }
        }

        fetchTools()
    }, [tokens, activeCategory])

    const filteredTools = toolsData.filter((tool: TeacherTool) => {
        const matchesCategory = activeCategory === "all" || tool.category === activeCategory
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    return (
        <div className="space-y-8 pb-20">
            <div className={cn("flex flex-col md:flex-row justify-between items-end gap-6 border-b pb-8", isLight ? "border-slate-200" : "border-slate-800")}>
                <div>
                    <h1 className={cn("text-3xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>Teacher Tools</h1>
                    <p className={cn("text-lg", isLight ? "text-slate-600 font-medium" : "text-slate-400")}>Discover 80+ AI-powered tools to save time and enhance instruction.</p>
                </div>
                {/* <div className="flex items-center gap-2">
                    <button className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border",
                        isLight
                            ? "bg-white text-slate-700 hover:bg-slate-50 border-slate-200 shadow-sm"
                            : "bg-white/5 text-slate-300 hover:bg-white/10 border-white/10"
                    )}>
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-medium">Filters</span>
                    </button>
                </div> */}
            </div>

            {/* Controls */}
            <div className={cn(
                "flex flex-col md:flex-row gap-4 items-center justify-between sticky top-16 z-30 py-4 backdrop-blur-xl -mx-6 px-6 md:mx-0 md:px-0 transition-all rounded-xl",
                isLight
                    ? "bg-slate-50/80 border border-slate-200/50"
                    : "bg-slate-950/80 border border-white/5"
            )}>
                <div className="relative flex-1 w-full md:w-auto group">
                    {/* Left Mask */}
                    <div className={cn(
                        "absolute left-0 top-0 bottom-2 w-12 z-[5] pointer-events-none transition-opacity duration-300",
                        showArrows.left ? "opacity-100" : "opacity-0",
                        isLight ? "bg-gradient-to-r from-slate-50 to-transparent" : "bg-gradient-to-r from-slate-950 to-transparent"
                    )} />

                    {/* Right Mask */}
                    <div className={cn(
                        "absolute right-0 top-0 bottom-2 w-12 z-[5] pointer-events-none transition-opacity duration-300",
                        showArrows.right ? "opacity-100" : "opacity-0",
                        isLight ? "bg-gradient-to-r from-transparent to-slate-50" : "bg-gradient-to-r from-transparent to-slate-950"
                    )} />

                    {/* Left Arrow */}
                    <AnimatePresence>
                        {showArrows.left && (
                            <motion.button
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                onClick={(e) => { e.preventDefault(); scroll('left'); }}
                                className={cn(
                                    "absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-xl backdrop-blur-md border transition-all active:scale-90",
                                    isLight ? "bg-white/95 border-slate-200 text-slate-700 active:bg-slate-100" : "bg-slate-800/95 border-slate-700 text-white active:bg-slate-700"
                                )}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    {/* Right Arrow */}
                    <AnimatePresence>
                        {showArrows.right && (
                            <motion.button
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                onClick={(e) => { e.preventDefault(); scroll('right'); }}
                                className={cn(
                                    "absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full shadow-xl backdrop-blur-md border transition-all active:scale-90",
                                    isLight ? "bg-white/95 border-slate-200 text-slate-700 active:bg-slate-100" : "bg-slate-800/95 border-slate-700 text-white active:bg-slate-700"
                                )}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <div 
                        id="tour-tools-categories" 
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex items-center gap-2 overflow-x-auto w-full pb-2 md:pb-0 no-scrollbar scroll-smooth px-4"
                    >
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border shrink-0",
                                    activeCategory === cat.id
                                        ? "bg-violet-600 text-white border-violet-600 shadow-lg shadow-violet-500/25"
                                        : isLight
                                            ? "bg-white text-slate-600 border-slate-200 hover:border-violet-300 hover:text-violet-600"
                                            : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white"
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div id="tour-tools-search" className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tools..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={cn(
                            "w-full pl-10 pr-4 py-2.5 rounded-full text-sm outline-none border transition-all",
                            isLight
                                ? "bg-white border-slate-200 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 text-slate-900 placeholder:text-slate-400 shadow-sm"
                                : "bg-white/5 border-white/10 focus:border-violet-500/50 focus:bg-white/10 text-white placeholder:text-slate-500"
                        )}
                    />
                </div>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                {filteredTools.map((tool: TeacherTool, index: number) => {
                    const favorited = tool.is_favorited ?? isFavorite(tool.id)
                    return (
                        <Link
                            key={tool.id}
                            href={`/teacher/tool/${tool.id}`}
                            className="block"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.03 }}
                                className={cn(
                                    "group relative rounded-2xl p-5 hover:-translate-y-1 transition-all duration-200 h-full flex flex-col justify-between",
                                    isLight
                                        ? "bg-white border-2 border-slate-200 shadow-sm hover:border-violet-300 hover:shadow-xl hover:shadow-violet-500/10"
                                        : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50"
                                )}
                            >
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div
                                            className={cn(
                                                "w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110 group-hover:rotate-3 shrink-0",
                                                !isHexColor(tool.color) && tool.color
                                            )}
                                            style={isHexColor(tool.color) ? { backgroundColor: tool.color } : undefined}
                                        >
                                            <tool.icon className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <button
                                            onClick={async (e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                
                                                // Optimistic update
                                                setToolsData(prev => prev.map(t => t.id === tool.id ? { ...t, is_favorited: !favorited } : t))
                                                toggleFavorite(tool.id)

                                                if (tokens?.access) {
                                                    try {
                                                        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                                                        const res = await fetch(`${baseUrl}/api/v1/tools/${tool.id}/favorite/`, {
                                                            method: favorited ? "DELETE" : "POST",
                                                            headers: {
                                                                "Content-Type": "application/json",
                                                                "Authorization": `Bearer ${tokens.access}`,
                                                            },
                                                        })
                                                        
                                                        if (!res.ok) {
                                                            console.error("Failed to toggle favorite on server")
                                                            // Revert optimistic update on failure
                                                            setToolsData(prev => prev.map(t => t.id === tool.id ? { ...t, is_favorited: favorited } : t))
                                                            toggleFavorite(tool.id)
                                                        }
                                                    } catch (error) {
                                                        console.error("Error toggling favorite", error)
                                                        // Revert optimistic update on error
                                                        setToolsData(prev => prev.map(t => t.id === tool.id ? { ...t, is_favorited: favorited } : t))
                                                        toggleFavorite(tool.id)
                                                    }
                                                }
                                            }}
                                            className={cn(
                                                "p-2 rounded-full transition-all active:scale-95",
                                                favorited
                                                    ? "text-amber-400 hover:text-amber-300 bg-amber-400/10"
                                                    : "text-slate-300 hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-white/10"
                                            )}
                                        >
                                            <Star className={cn("w-5 h-5 transition-transform hover:scale-110", favorited ? "fill-current" : "")} />
                                        </button>
                                    </div>

                                    <h3 className={cn("text-sm md:text-lg font-bold mb-1 md:mb-2 transition-colors line-clamp-1 md:line-clamp-none", isLight ? "text-slate-900 group-hover:text-violet-700" : "text-white group-hover:text-violet-300")}>
                                        {tool.name}
                                    </h3>
                                    <p className={cn("text-[10px] md:text-sm leading-relaxed mb-4 line-clamp-2 opacity-80 md:opacity-100", isLight ? "text-slate-600 font-medium" : "text-slate-400")}>
                                        {tool.desc}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-dashed border-slate-200 dark:border-white/10">
                                    {(tool.new || tool.plus) && (
                                        <div className="flex gap-2">
                                            {tool.new && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30">
                                                    NEW
                                                </span>
                                            )}
                                            {tool.plus && (
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30 flex items-center gap-1">
                                                    <Sparkles className="w-2.5 h-2.5" /> PLUS
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
