"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import {
    Search, Sparkles, BookOpen, PenTool, Calculator, MessageSquare, Music, Video, Star,
    FileText, AlignLeft, Quote, Target, ArrowRight, CheckCircle, PenLine, Check, Minimize2,
    RefreshCw, Zap, Mail, Scale, FileSearch, Link as LinkIcon, BookA, BookOpenCheck, Volume2, ArrowDown,
    Focus, UserSearch, Lightbulb, BrainCircuit, PieChart, Triangle, Sigma,
    Bot, Users, ClipboardCheck, Layers, FileInput, FileMinus, ClipboardList, Brain,
    Book, Feather, Image as ImageIcon, Presentation, UserPlus, Terminal, Hourglass,
    CloudLightning, Languages, ShieldCheck, StickyNote, LifeBuoy, Calendar, MessageSquarePlus,
    Filter, ChevronDown, Flame, TrendingUp, X, ChevronLeft, ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/StudentThemeContext"

import { useStudentFavorites } from "@/components/student/StudentFavoritesContext"
import { useAuth } from "@/components/providers/AuthContext"
import { getToolConfig } from "@/components/tool/tool-registry"

const defaultCategories = [{ id: "all", label: "All Tools" }]

const normalizeCategoryId = (name: string) => {
    const raw = name.trim().toLowerCase()
    if (raw.includes("writing")) return "writing"
    if (raw.includes("study")) return "study-prep"
    if (raw.includes("math")) return "math-science"
    if (raw.includes("career")) return "career-life"
    return raw.replace(/\s+/g, "-")
}

const mapApiCategories = (apiCategories: Array<{ id?: number | string; name?: string }>) => {
    const mapped = apiCategories.map((cat) => {
        const id = cat.id != null ? String(cat.id) : normalizeCategoryId(String(cat.name ?? ""))
        const label = (cat.name || "").trim() || (id === "all" ? "All Tools" : "Unknown")
        return { id, label }
    })
    return [{ id: "all", label: "All Tools" }, ...mapped.filter((cat) => cat.id !== "all")]
}

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

export default function StudentToolsPage() {
    const [activeCategory, setActiveCategory] = useState("all")
    const [searchQuery, setSearchQuery] = useState("")
    const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
    const { favorites, toggleFavorite, isFavorite } = useStudentFavorites()
    const [isMounted, setIsMounted] = useState(false)
    const { theme } = useStudentTheme()
    const isLight = theme === 'light'
    const { tokens } = useAuth()

    const [categories, setCategories] = useState(defaultCategories)
    const [toolsData, setToolsData] = useState<StudentTool[]>([])

    useEffect(() => {
        setIsMounted(true)
        const fetchCategories = async () => {
            if (!tokens?.access) return
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                const res = await fetch(`${baseUrl}/api/v1/tools/categories/?type=student`, {
                    headers: { "Authorization": `Bearer ${tokens.access}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    const arr = Array.isArray(data) ? data : (Array.isArray(data.categories) ? data.categories : [])
                    if (arr.length > 0) setCategories(mapApiCategories(arr))
                }
            } catch (err) { console.error("Categories fetch error", err) }
        }
        fetchCategories()
    }, [tokens])

    useEffect(() => {
        const fetchTools = async () => {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            try {
                const headers: Record<string, string> = { "Content-Type": "application/json" }
                if (tokens?.access) headers["Authorization"] = `Bearer ${tokens.access}`
                
                const categoryParam = activeCategory && activeCategory !== "all" ? `&category=${encodeURIComponent(activeCategory)}` : ""
                const searchParam = searchQuery.trim() ? `&search=${encodeURIComponent(searchQuery.trim())}` : ""
                
                const res = await fetch(`${baseUrl}/api/v1/tools/?type=student${categoryParam}${searchParam}`, { headers })
                if (res.ok) {
                    const data = await res.json()
                    const list = Array.isArray(data) ? data : (Array.isArray(data.results) ? data.results : [])
                    
                    const mapped: StudentTool[] = list.map((item: any) => {
                        const id = String(item.slug ?? item.id ?? "")
                        const registryConfig = getToolConfig(id)
                        let categoryId = ""
                        if (item.category != null) {
                            if (typeof item.category === "object" && item.category.id != null) categoryId = String(item.category.id)
                            else categoryId = String(item.category)
                        } else if (item.category_id != null) categoryId = String(item.category_id)
                        else if (registryConfig?.category) categoryId = String(registryConfig.category)
                        
                        return {
                            id,
                            name: String(item.student_friendly_name || item.name || registryConfig?.name || "Untitled"),
                            category: categoryId,
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
    }, [tokens, activeCategory])

    const [isCategoryOpen, setIsCategoryOpen] = useState(false)
    const [isSearchFocused, setIsSearchFocused] = useState(false)

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

    const trendingTools = toolsData.filter(t => t.isHot).slice(0, 5)

    const handleToggleFavorite = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        e.preventDefault()
        
        const tool = toolsData.find(t => t.id === id)
        const favorited = tool?.is_favorited ?? isFavorite(id)
        
        // Optimistic
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

    const filteredTools = toolsData.filter(tool => {
        const matchesCategory = activeCategory === "all" || tool.category === activeCategory
        const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tool.desc.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesFavorites = !showFavoritesOnly || (tool.is_favorited ?? isFavorite(tool.id))

        return matchesCategory && matchesSearch && matchesFavorites
    })

    const selectedCategoryLabel = categories.find(c => c.id === activeCategory)?.label || "All Tools"

    return (
        <div className="space-y-8 pb-20">
            {/* Header Area */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-center max-w-3xl mx-auto pt-6"
            >
                <h1 className={cn("text-3xl font-bold", isLight ? "text-slate-900" : "text-white")}>
                    Student Tools
                </h1>

                {/* Large Search Bar */}
                {/* Large Search Bar - Glass Input */}
                <div className="relative max-w-xl mx-auto group z-50">
                    <div className={cn(
                        "relative flex items-center w-full transition-all duration-300",
                        isSearchFocused && "scale-[1.02]"
                    )}>
                        <Search className={cn("absolute left-5 w-5 h-5 transition-colors z-10", isLight ? "text-[#2563EB]" : "text-blue-300")} />
                        <input
                            type="text"
                            placeholder="Search all tools..."
                            value={searchQuery}
                            onFocus={() => setIsSearchFocused(true)}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn(
                                "w-full pl-14 pr-6 py-4 rounded-full text-base transition-all outline-none border-2",
                                isLight
                                    ? "bg-white/80 backdrop-blur-xl border-slate-200 text-[#334155] placeholder:text-slate-400 shadow-[0_8px_30px_rgba(0,0,0,0.08)] focus:border-blue-500 focus:shadow-[0_12px_40px_rgba(37,99,235,0.15)]"
                                    : "bg-slate-900/80 backdrop-blur-xl border-slate-800 text-white placeholder:text-slate-500 focus:bg-slate-800 focus:border-blue-500/50"
                            )}
                        />
                        {isSearchFocused && (
                            <button
                                onClick={() => setIsSearchFocused(false)}
                                className="absolute right-4 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 z-10"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {/* Search Dropdown */}
                    <AnimatePresence>
                        {isSearchFocused && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                                className={cn(
                                    "absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border overflow-hidden backdrop-blur-2xl p-2",
                                    isLight
                                        ? "bg-white/95 border-slate-100 ring-1 ring-slate-200"
                                        : "bg-slate-900/95 border-slate-800 shadow-[0_16px_40px_rgba(0,0,0,0.5)]"
                                )}
                            >
                                <div className="p-2">
                                    <h3 className={cn("text-xs font-semibold mb-2 uppercase tracking-wider px-2", isLight ? "text-slate-500" : "text-slate-400")}>Trending</h3>
                                    <div className="space-y-1">
                                        {trendingTools.map(tool => (
                                            <button
                                                key={tool.id}
                                                className={cn(
                                                    "w-full flex items-center justify-between p-3 rounded-xl transition-colors group text-left",
                                                    isLight
                                                        ? "hover:bg-blue-50/80 text-slate-700 hover:text-blue-700"
                                                        : "hover:bg-slate-800 text-slate-400 hover:text-white"
                                                )}
                                                onClick={() => {
                                                    setSearchQuery(tool.name)
                                                    setIsSearchFocused(false)
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <TrendingUp className={cn("w-4 h-4", isLight ? "text-slate-400 group-hover:text-blue-500" : "text-slate-500 group-hover:text-blue-300")} />
                                                    <span className="font-medium">{tool.name}</span>
                                                </div>
                                                <div className="px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold flex items-center gap-1">
                                                    <Flame className="w-3 h-3 fill-current" /> Hot
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Backdrop to close search */}
                    {isSearchFocused && (
                        <div
                            className="fixed inset-0 z-[-1]"
                            onClick={() => setIsSearchFocused(false)}
                        />
                    )}
                </div>
            </motion.div>

            {/* Most Loved / Hot Tools Banner (Optional - kept straightforward to match request structure) */}
            {/* <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={cn(
                    "rounded-2xl p-6 relative overflow-hidden flex items-center justify-between backdrop-blur-xl",
                    isLight
                        ? "bg-white/60 border border-white/60 shadow-[0_10px_30px_rgba(15,23,42,0.08)]"
                        : "bg-slate-900/50 border border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
                )}
            >
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <h2 className={cn("font-bold text-lg", isLight ? "text-slate-900" : "text-white")}>Try one of our most loved tools</h2>
                    </div>
                </div>
                <button className={cn("text-sm font-medium hover:underline", isLight ? "text-slate-600" : "text-slate-400")}>Show</button>
            </motion.div> */}

            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row items-center gap-4">
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
                                        ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/25"
                                        : isLight
                                            ? "bg-white text-[#334155] border-slate-200 hover:border-blue-300 hover:text-blue-600"
                                            : "bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Favorites Filter */}
                <button
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    className={cn(
                        "flex shrink-0 items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-all backdrop-blur-md",
                        showFavoritesOnly
                            ? "border-yellow-400 bg-yellow-50/50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-600/50"
                            : (isLight
                                ? "bg-white/70 border-slate-200/90 text-[#334155] hover:border-blue-300 hover:text-blue-600 shadow-sm"
                                : "bg-slate-900/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200")
                    )}
                >
                    <Star className={cn("w-4 h-4", showFavoritesOnly ? "fill-current" : "")} />
                    Favorites
                </button>
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
                {filteredTools.map((tool, index) => (
                    <motion.div
                        key={tool.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(index * 0.03, 0.5) }} // Cap delay for many items
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
                            <div className="absolute top-4 right-12 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1">
                                <Flame className="w-3 h-3 fill-current" /> Hot
                            </div>
                        )}

                        {/* Favorite Button */}
                        <button
                            onClick={(e) => handleToggleFavorite(e, tool.id)}
                            className={cn(
                                "absolute top-4 right-4 p-1.5 rounded-lg transition-all active:scale-95 z-20",
                                isFavorite(tool.id)
                                    ? "text-amber-400 hover:text-amber-500 bg-amber-400/10"
                                    : (isLight ? "text-slate-300 hover:text-amber-400 hover:bg-slate-100" : "text-slate-500 hover:text-amber-400 hover:bg-white/10")
                            )}
                        >
                            <Star className={cn("w-5 h-5", isFavorite(tool.id) ? "fill-current scale-110" : "transition-transform hover:scale-110")} />
                        </button>

                        <div className="flex flex-col gap-4">
                            <div className={cn(
                                "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-[14px] flex items-center justify-center shrink-0",
                                isLight
                                    ? "bg-blue-50"
                                    : "bg-white/[0.1] shadow-inner"
                            )}>
                                <tool.icon className={cn("w-5 h-5 md:w-6 md:h-6", isLight ? "text-[#2563EB]" : "text-blue-300")} />
                            </div>
                            <div className="space-y-1">
                                <h3 className={cn("font-bold text-sm md:text-lg leading-tight line-clamp-1 md:line-clamp-none", isLight ? "text-[#0F172A]" : "text-white")}>
                                    {tool.name}
                                </h3>
                                <p className={cn("text-[10px] md:text-xs leading-relaxed line-clamp-2 font-medium opacity-80 md:opacity-100", isLight ? "text-[#334155]" : "text-slate-300")}>
                                    {tool.desc}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {filteredTools.length === 0 && (
                <div className="text-center py-20">
                    <p className={cn("text-lg", isLight ? "text-slate-500" : "text-slate-400")}>No tools found matching your criteria.</p>
                    <button
                        onClick={() => {
                            setSearchQuery("")
                            setActiveCategory("all")
                            setShowFavoritesOnly(false)
                        }}
                        className="mt-4 text-blue-500 hover:underline font-medium"
                    >
                        Clear filters
                    </button>
                </div>
            )}
        </div>
    )
}
