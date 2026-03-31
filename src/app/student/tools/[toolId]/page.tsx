"use client"

import React, { useState, useEffect, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Sparkles, Copy, RotateCcw, ThumbsUp, ThumbsDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useStudentTheme } from "@/components/student/StudentThemeContext"
import { useAuth } from "@/components/providers/AuthContext"
import { getToolConfig } from "@/components/tool/tool-registry"
import { ToolConfig } from "@/components/tool/types"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { toast } from "react-hot-toast"

type ViewStatus = 'input' | 'loading' | 'result'
type ToolInputWithRequired = ToolConfig['inputs'][number] & { required?: boolean }

function ToolPageContent() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { theme } = useStudentTheme()
    const isLight = theme === 'light'
    const { tokens } = useAuth()
    const toolId = params.toolId as string

    // State
    const [tool, setTool] = useState<ToolConfig | null>(null)
    const [toolSlug, setToolSlug] = useState<string>("")
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [result, setResult] = useState<string | null>(null)
    const [viewStatus, setViewStatus] = useState<ViewStatus>('input')
    const [loadingMessage, setLoadingMessage] = useState("Preparing magic...")
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

    const loadingMessages = [
        "Thinking...",
        "Connecting ideas...",
        "Formulating response...",
        "Adding a pinch of creativity...",
        "Almost there..."
    ]

    useEffect(() => {
        const fetchToolConfig = async () => {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            try {
                const headers: Record<string, string> = { "Content-Type": "application/json" }
                if (tokens?.access) headers["Authorization"] = `Bearer ${tokens.access}`

                let data: any = null
                const res = await fetch(`${baseUrl}/api/v1/tools/${toolId}/`, { method: "GET", headers })
                if (res.ok) {
                    data = await res.json()
                } else if (res.status === 404) {
                    const listRes = await fetch(`${baseUrl}/api/v1/tools/?type=student`, { method: "GET", headers })
                    if (listRes.ok) {
                        const listData = await listRes.json()
                        const items = Array.isArray(listData.results) ? listData.results : Array.isArray(listData) ? listData : []
                        data = items.find((item: any) => String(item.id) === String(toolId) || String(item.slug).toLowerCase() === String(toolId).toLowerCase())
                    }
                }

                if (!data) throw new Error("Failed to load tool configuration data.")

                const registryConfig = getToolConfig(toolId)
                const mappedInputs = Array.isArray(data.inputs) ? data.inputs.map((input: any) => ({
                    id: String(input.id ?? input.label ?? input.name ?? ""),
                    label: input.label || input.name || "Input",
                    type: input.type === 'dropdown' ? 'select' : input.type === 'textarea' ? 'textarea' : 'text',
                    placeholder: input.placeholder || "",
                    options: Array.isArray(input.options) ? input.options : undefined,
                    defaultValue: input.default_value ?? undefined,
                    required: input.required ?? false,
                })) : (registryConfig?.inputs || [])

                const mappedConfig: ToolConfig = {
                    id: String(data.id || toolId),
                    slug: data.slug || data.name || undefined,
                    name: data.student_friendly_name || data.name || registryConfig?.name || "Tool",
                    description: data.description || registryConfig?.description || "",
                    icon: registryConfig?.icon || (() => null),
                    color: data.color || registryConfig?.color || "bg-blue-500",
                    inputs: mappedInputs as any
                }

                setTool(mappedConfig)
                setToolSlug(String(data.slug || data.name || registryConfig?.name || ""))
                
                // Initialize form
                const initialData: Record<string, any> = {}
                mappedConfig.inputs.forEach(input => {
                    if (input.defaultValue) initialData[input.id] = input.defaultValue
                })
                setFormData(initialData)

            } catch (error) {
                console.error("Fetch tool config failed:", error)
                // Fallback
                const fallback = getToolConfig(toolId)
                if (fallback) {
                    setTool(fallback)
                    toast.error("Failed to load from API; using fallback.")
                }
            }
        }
        fetchToolConfig()
    }, [toolId, tokens])

    // Fetch History
    useEffect(() => {
        const fetchHistory = async () => {
            const historyId = searchParams.get('historyId')
            if (!historyId || !tokens?.access) return
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                const res = await fetch(`${baseUrl}/api/v1/tools/logs/history/`, {
                    headers: { "Authorization": `Bearer ${tokens.access}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    const items = Array.isArray(data) ? data : (data.results || [])
                    const item = items.find((i: any) => String(i.id) === historyId)
                    if (item && item.toolId === toolId) {
                        setFormData(item.formData || {})
                        setResult(item.output || "")
                        setViewStatus('result')
                    }
                }
            } catch (error) {
                console.error("History fetch failed", error)
            }
        }
        fetchHistory()
    }, [searchParams, toolId, tokens])

    useEffect(() => {
        let interval: NodeJS.Timeout
        if (viewStatus === 'loading') {
            let i = 0
            interval = setInterval(() => {
                setLoadingMessage(loadingMessages[i % loadingMessages.length])
                i++
            }, 800)
        }
        return () => clearInterval(interval)
    }, [viewStatus])

    const handleInputChange = (id: string, value: any) => {
        setFormData(prev => ({ ...prev, [id]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!tool) return

        let hasErrors = false
        const newErrors: Record<string, string> = {}

        tool.inputs.forEach((input: ToolInputWithRequired) => {
            const val = (formData[input.id] || "").trim()
            const isRequired = input.required ?? false
            if (isRequired && val.length === 0) {
                newErrors[input.id] = "This field is required"
                hasErrors = true
            }
        })

        if (hasErrors) {
            setValidationErrors(newErrors)
            return
        }

        setValidationErrors({})
        setViewStatus('loading')
        setResult(null)

        const payload = {
            tool_slug: toolSlug || tool.name,
            inputs: tool.inputs.reduce<Record<string, string>>((acc, input) => {
                acc[input.label] = formData[input.id] || ""
                return acc
            }, {})
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
        try {
            const headers: Record<string, string> = { "Content-Type": "application/json" }
            if (tokens?.access) headers["Authorization"] = `Bearer ${tokens.access}`

            const response = await fetch(`${baseUrl}/api/v1/tools/request/`, {
                method: "POST",
                headers,
                body: JSON.stringify(payload)
            })
            const data = await response.json()

            if (!response.ok || data.success === false) {
                toast.error(data?.message || `Request failed with status ${response.status}`)
                setViewStatus('input')
            } else {
                setResult(String(data?.data || ""))
                toast.success(data.message || "Completed successfully")
                setViewStatus('result')
                window.scrollTo({ top: 0, behavior: 'smooth' })
            }
        } catch (error) {
            console.error(error)
            toast.error("Network error.")
            setViewStatus('input')
        }
    }

    if (!tool) return <div className="p-10 text-center opacity-50">Loading tool...</div>

    return (
        <div className="max-w-3xl mx-auto pb-20 min-h-[80vh]">
            {/* Header Navigation */}
            <div className="mb-6">
                <button
                    onClick={() => {
                        const historyId = searchParams.get('historyId')
                        if (historyId) {
                            router.push('/student/history')
                        } else if (viewStatus !== 'input') {
                            setViewStatus('input')
                        } else {
                            router.push('/student/tools')
                        }
                    }}
                    className={cn(
                        "flex items-center gap-2 text-sm font-medium transition-colors px-3 py-2 rounded-lg group",
                        isLight ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900" : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                    )}
                >
                    <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                    {searchParams.get('historyId') ? 'Back to History' : (viewStatus === 'input' ? 'Back to Tools' : 'Edit Inputs')}

                </button>
            </div>

            <AnimatePresence mode="wait">
                {viewStatus === 'input' && (
                    <motion.div
                        key="input"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className={cn(
                            "p-6 md:p-8 rounded-[24px] backdrop-blur-xl border transition-all",
                            isLight
                                ? "bg-white/70 border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                                : "bg-slate-900/50 border-slate-800 shadow-[0_8px_32px_rgba(0,0,0,0.35)]"
                        )}
                    >
                        {/* Tool Header */}
                        <div className="flex items-start gap-4 mb-8">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md shadow-inner",
                                isLight
                                    ? "bg-blue-500/10 text-blue-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                                    : "bg-slate-800 text-blue-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                            )}>
                                <tool.icon className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className={cn("text-2xl font-bold mb-1", isLight ? "text-[#0F172A]" : "text-white")}>
                                    {tool.name}
                                </h1>
                                <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-500" : "text-slate-400")}>
                                    {tool.description}
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {tool.inputs.map((input) => (
                                <div key={input.id} className="space-y-2">
                                    <label className={cn("text-sm font-semibold ml-1", isLight ? "text-slate-700" : "text-slate-300")}>
                                        {input.label}
                                    </label>

                                    {(!input.type || input.type === 'text') && (
                                        <input
                                            type="text"
                                            required={(input as any).required}
                                            placeholder={input.placeholder}
                                            value={formData[input.id] || ''}
                                            onChange={(e) => handleInputChange(input.id, e.target.value)}
                                            className={cn(
                                                "w-full px-4 py-3 rounded-xl outline-none transition-all",
                                                validationErrors[input.id] ? "!border-rose-500 !ring-rose-500/20" : "",
                                                isLight
                                                    ? "bg-white/50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 placeholder:text-slate-400"
                                                    : "bg-slate-950/50 border border-slate-800 focus:border-blue-500/50 focus:bg-slate-900 text-white placeholder:text-slate-500"
                                            )}
                                        />
                                    )}

                                    {input.type === 'textarea' && (
                                        <textarea
                                            required={(input as any).required}
                                            placeholder={input.placeholder}
                                            rows={5}
                                            value={formData[input.id] || ''}
                                            onChange={(e) => handleInputChange(input.id, e.target.value)}
                                            className={cn(
                                                "w-full px-4 py-3 rounded-xl outline-none transition-all resize-none",
                                                validationErrors[input.id] ? "!border-rose-500 !ring-rose-500/20" : "",
                                                isLight
                                                    ? "bg-white/50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800 placeholder:text-slate-400"
                                                    : "bg-slate-950/50 border border-slate-800 focus:border-blue-500/50 focus:bg-slate-900 text-white placeholder:text-slate-500"
                                            )}
                                        />
                                    )}

                                    {input.type === 'select' && input.options && (
                                        <div className="relative">
                                            <select
                                                value={formData[input.id] || input.defaultValue || ''}
                                                onChange={(e) => handleInputChange(input.id, e.target.value)}
                                                className={cn(
                                                    "w-full px-4 py-3 rounded-xl outline-none transition-all appearance-none cursor-pointer",
                                                    validationErrors[input.id] ? "!border-rose-500 !ring-rose-500/20" : "",
                                                    isLight
                                                        ? "bg-white/50 border border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-800"
                                                        : "bg-slate-950/50 border border-slate-800 focus:border-blue-500/50 focus:bg-slate-900 text-white"
                                                )}
                                            >
                                                <option value="" disabled>Select an option...</option>
                                                {input.options.map((opt: string) => (
                                                    <option key={opt} value={opt} className={isLight ? "text-slate-900" : "bg-slate-900 text-white"}>{opt}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    )}
                                    {validationErrors[input.id] && (
                                        <p className="text-rose-500 text-xs font-medium mt-1 ml-1">{validationErrors[input.id]}</p>
                                    )}
                                </div>
                            ))}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className={cn(
                                        "w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-[0.98]",
                                        "hover:shadow-blue-500/25 hover:-translate-y-0.5",
                                        isLight
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                                            : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white"
                                    )}
                                >
                                    <Sparkles className="w-5 h-5 fill-white/20" />
                                    Generate Magic
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}

                {viewStatus === 'loading' && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        transition={{ duration: 0.4 }}
                        className="flex flex-col items-center justify-center min-h-[400px] text-center"
                    >
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-blue-500/30 blur-3xl animate-pulse rounded-full" />
                            <div className="relative w-24 h-24">
                                <svg className="animate-spin w-full h-full text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-blue-500 animate-pulse" />
                                </div>
                            </div>
                        </div>

                        <h3 className={cn("text-2xl font-bold mb-3 animate-pulse", isLight ? "text-slate-800" : "text-white")}>
                            {loadingMessage}
                        </h3>
                        <p className={cn("opacity-70 max-w-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                            Jarvis is working her magic specifically for you!
                        </p>
                    </motion.div>
                )}

                {viewStatus === 'result' && result && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5, type: "spring", bounce: 0.3 }}
                        className={cn(
                            "p-6 md:p-8 rounded-[24px] backdrop-blur-xl border flex flex-col transition-all min-h-[500px]",
                            isLight
                                ? "bg-white/80 border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.06)] ring-1 ring-blue-100"
                                : "bg-slate-900/80 border-slate-800 shadow-2xl"
                        )}
                    >
                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-dashed border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                    <Sparkles className="w-5 h-5 fill-current" />
                                </div>
                                <div>
                                    <h3 className={cn("font-bold text-lg", isLight ? "text-slate-900" : "text-white")}>
                                        Here is your magic!
                                    </h3>
                                    <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-400")}>
                                        Generated just now
                                    </p>
                                </div>
                            </div>

                            <div className="flex bg-slate-100 dark:bg-slate-950 rounded-lg p-1">
                                <button
                                    className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all text-slate-500 hover:text-blue-500"
                                    title="Copy to clipboard"
                                    onClick={() => { navigator.clipboard.writeText(result) }}
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all text-slate-500 hover:text-green-500">
                                    <ThumbsUp className="w-4 h-4" />
                                </button>
                                <button className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-md transition-all text-slate-500 hover:text-red-500">
                                    <ThumbsDown className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className={cn(
                            "prose prose-sm md:prose-base max-w-none flex-1 overflow-y-auto custom-scrollbar p-2 rounded-xl mb-6",
                            isLight ? "prose-slate" : "prose-invert"
                        )}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {result}
                            </ReactMarkdown>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5 flex gap-3">
                            <button
                                onClick={() => setViewStatus('input')}
                                className={cn(
                                    "flex-1 py-3 rounded-xl font-medium border transition-colors",
                                    isLight
                                        ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                                        : "border-slate-700 text-slate-300 hover:bg-slate-800/50"
                                )}
                            >
                                Edit Inputs
                            </button>
                            <button
                                onClick={() => {
                                    setViewStatus('input')
                                    setFormData({})
                                }}
                                className={cn(
                                    "flex-1 py-3 rounded-xl font-bold transition-colors text-white",
                                    "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                                )}
                            >
                                <RotateCcw className="w-4 h-4 mr-2 inline" />
                                Start New
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default function ToolPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh] text-slate-400">Loading magic...</div>}>
            <ToolPageContent />
        </Suspense>
    )
}
