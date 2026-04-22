"use client"

import React, { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import {
    Sparkles,
    Copy,
    RefreshCw,
    ThumbsUp,
    ThumbsDown,
    Share2,
    ArrowLeft,
    Wand2
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
// Note: We need to import the registry from its location.
// Assuming the registry is safe to use in client components (as seen in the app tool page).
import { getToolConfig } from "@/components/tool/tool-registry"
import { ToolConfig, ToolInput } from "@/components/tool/types"
import { toast } from "react-hot-toast"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

type ApiToolInput = {
    id?: number | string
    type?: string
    label?: string
    name?: string
    placeholder?: string
    options?: string[]
    default_value?: string | null
    required?: boolean
}

type ApiTool = {
    id?: number | string
    slug?: string
    name?: string
    student_friendly_name?: string
    description?: string
    color?: string
    system_prompt?: string
    inputs?: ApiToolInput[]
}

type ToolInputWithRequired = ToolConfig['inputs'][number] & { required?: boolean }

export default function PublicToolPage() {
    const params = useParams()
    const toolId = params.toolId as string
    const [config, setConfig] = useState<ToolConfig | null>(null)
    const [toolSlug, setToolSlug] = useState<string>("")
    const queryClient = useQueryClient()
    const [isGenerating, setIsGenerating] = useState(false)
    const [output, setOutput] = useState("")
    const [formData, setFormData] = useState<Record<string, string>>({})
    const [mobileView, setMobileView] = useState<'input' | 'output'>('input')
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
    const [usageInfo, setUsageInfo] = useState<{ tokens_used?: number; credits_used?: number; cost?: number; provider?: string; model?: string } | null>(null)

    // Auto-switch to output view on mobile when generating starts
    useEffect(() => {
        if (isGenerating && window.innerWidth < 768) {
            setMobileView('output')
        }
    }, [isGenerating])

    useEffect(() => {
        const fetchToolConfig = async () => {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            try {
                const headers: Record<string,string> = {
                    "Content-Type": "application/json",
                }

                let data: ApiTool | null = null

                const response = await fetch(`${baseUrl}/api/v1/tools/${toolId}/`, {
                    method: "GET",
                    headers,
                })

                if (response.ok) {
                    data = await response.json()
                } else if (response.status === 404) {
                    const listResponse = await fetch(`${baseUrl}/api/v1/tools/?type=teacher`, {
                        method: "GET",
                        headers,
                    })

                    if (listResponse.ok) {
                        const listData = await listResponse.json()
                        const listItems = Array.isArray(listData.results) ? listData.results : Array.isArray(listData) ? listData : []
                        const requested = String(toolId).toLowerCase()
                        const matched = listItems.find((item: any) => {
                            const candidateId = String(item.id ?? "")
                            const candidateSlug = String(item.slug ?? "").toLowerCase()
                            return candidateId === requested || candidateSlug === requested
                        })
                        if (matched) {
                            data = matched
                        }
                    }

                    if (!data) {
                        throw new Error("We couldn't find the tool you're looking for.")
                    }
                } else {
                    throw new Error("Unable to load tool settings. Please try again.")
                }

                if (!data) {
                    throw new Error("Tool data is empty")
                }

                const registryConfig = getToolConfig(toolId)
                const mappedInputs = Array.isArray(data.inputs) ? data.inputs.map((input: ApiToolInput) => ({
                    id: String(input.id ?? input.label ?? input.name ?? "") || "",
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
                    color: data.color || (registryConfig?.color ?? "bg-slate-500"),
                    inputs: mappedInputs as unknown as ToolConfig['inputs'],
                }

                setConfig(mappedConfig)
                setToolSlug(String(data.slug || data.name || registryConfig?.name || ""))
            } catch (error) {
                console.error("Failed to fetch tool config", error)
                const fallbackConfig = getToolConfig(toolId)
                if (fallbackConfig) {
                    setConfig(fallbackConfig)
                    toast.error("Failed to load tool config from API; using local fallback.")
                } else {
                    toast.error("Unable to load tool configuration.")
                }
            }
        }

        fetchToolConfig()
    }, [toolId])

    const handleInputChange = (id: string, value: string) => {
        setFormData(prev => ({ ...prev, [id]: value }))
    }

    const handleGenerate = async () => {
        if (!config) return

        let hasErrors = false
        const newErrors: Record<string, string> = {}

        config.inputs.forEach((input: ToolInputWithRequired) => {
            const value = (formData[input.id] || "").trim()
            const isRequired = input.required ?? false
            if (isRequired && value.length === 0) {
                newErrors[input.id] = "This field is required"
                hasErrors = true
            }
        })

        if (hasErrors) {
            setValidationErrors(newErrors)
            return
        }

        setValidationErrors({})
        setIsGenerating(true)
        setOutput("")
        setUsageInfo(null)

        const payload = {
            tool_slug: toolSlug || config.name,
            inputs: config.inputs.reduce<Record<string, string>>((acc, input) => {
                acc[input.label] = formData[input.id] || ""
                return acc
            }, {}),
        }

        const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"

        try {
            const response = await fetch(`${baseUrl}/api/v1/tools/request/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            const result = await response.json()

            if (!response.ok || result.success === false) {
                const message = result?.message || "Something went wrong while processing your request. Please try again."
                toast.error(message)
                setOutput("")
            } else {
                const outputText = String(result?.data || "")
                setOutput(outputText)
                toast.success(result.message || "Request completed successfully")
                setUsageInfo({
                    tokens_used: result.tokens_used,
                    credits_used: result.credits_used,
                    cost: result.cost,
                    provider: result.provider,
                    model: result.model,
                })
                // Force an immediate refetch of credits usage (bypasses staleTime)
                queryClient.refetchQueries({ queryKey: ['usage', 'credits'] })
            }
        } catch (error) {
            console.error("AI request failed", error)
            toast.error("Network error: could not reach the AI request endpoint.")
            setOutput("")
        } finally {
            setIsGenerating(false)
            setMobileView('output')
        }
    }

    if (!config) return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />
            <div className="flex-1 flex items-center justify-center p-10 text-slate-500">
                Loading tool...
            </div>
            <Footer />
        </div>
    )

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <Header />

            <main className="flex-1 container mx-auto px-4 pt-24 pb-12">
                {usageInfo && (
                    <div className="mb-4 rounded-xl p-4 flex items-center justify-between border bg-sky-50 border-sky-200 text-sky-700">
                        <div>
                            <p className="font-medium">Usage Info</p>
                            <p className="text-xs mt-1 text-current opacity-80">
                                Tokens: {usageInfo.tokens_used ?? '-'} · Credits: {usageInfo.credits_used ?? '-'} · Cost: {usageInfo.cost ?? '-'} · Model: {usageInfo.model ?? '-'}
                            </p>
                        </div>
                        <Button size="sm" variant="ghost" onClick={() => setUsageInfo(null)}>Dismiss</Button>
                    </div>
                )}
                <div className="h-[calc(100vh-9rem)] min-h-[600px] flex flex-col md:flex-row gap-6 overflow-hidden pb-4">

                    {/* LEFT PANE: Input Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                            "w-full md:w-1/2 lg:w-5/12 flex flex-col h-full border rounded-2xl overflow-hidden transition-all bg-white border-slate-200 shadow-sm",
                            mobileView === 'output' ? "hidden md:flex" : "flex"
                        )}
                    >
                        {/* Header */}
                        <div className="p-6 border-b transition-colors bg-slate-50 border-slate-200">
                            <Link href="/tools" className="inline-flex items-center gap-2 text-sm mb-4 transition-colors text-slate-500 hover:text-slate-900">
                                <ArrowLeft className="w-4 h-4" /> Back to Tools
                            </Link>
                            <div className="flex items-center gap-3">
                                <div
                                    className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white shadow-lg", typeof config.color === 'string' && config.color.startsWith('#') ? 'bg-slate-400' : config.color)}
                                    style={typeof config.color === 'string' && config.color.startsWith('#') ? { backgroundColor: config.color } : undefined}
                                >
                                    <config.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900">{config.name}</h1>
                                    <p className="text-sm text-slate-500">{config.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Scrollable Form Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white">
                            {config.inputs.map((input) => (
                                <div key={input.id} className="space-y-2">
                                    <label className="text-sm font-bold uppercase tracking-wide text-slate-500">
                                        {input.label}
                                    </label>

                                    {input.type === "select" ? (
                                        <div className="relative">
                                            <select
                                                className={cn(
                                                    "w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all appearance-none outline-none font-medium bg-slate-50 border-slate-200 text-slate-900 focus:bg-white",
                                                    validationErrors[input.id] ? "!border-rose-500 !ring-rose-500/20" : ""
                                                )}
                                                onChange={(e) => handleInputChange(input.id, e.target.value)}
                                                value={formData[input.id] || ""}
                                            >
                                                <option value="" disabled selected>Select an option...</option>
                                                {input.options?.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    ) : input.type === "textarea" ? (
                                        <textarea
                                            className={cn(
                                                "w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all min-h-[120px] resize-y outline-none font-medium bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400",
                                                validationErrors[input.id] ? "!border-rose-500 !ring-rose-500/20" : ""
                                            )}
                                            placeholder={input.placeholder}
                                            onChange={(e) => handleInputChange(input.id, e.target.value)}
                                            value={formData[input.id] || ""}
                                        />
                                    ) : (
                                        <input
                                            type="text"
                                            className={cn(
                                                "w-full border rounded-xl px-4 py-3 focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all outline-none font-medium bg-slate-50 border-slate-200 text-slate-900 focus:bg-white placeholder:text-slate-400",
                                                validationErrors[input.id] ? "!border-rose-500 !ring-rose-500/20" : ""
                                            )}
                                            placeholder={input.placeholder}
                                            onChange={(e) => handleInputChange(input.id, e.target.value)}
                                            value={formData[input.id] || ""}
                                        />
                                    )}
                                    {validationErrors[input.id] && (
                                        <p className="text-rose-500 text-xs font-medium mt-1 ml-1">{validationErrors[input.id]}</p>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Footer Action */}
                        <div className="p-6 border-t transition-colors bg-slate-50 border-slate-200">
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="w-full h-12 text-lg font-bold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/25"
                            >
                                {isGenerating ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Generating...
                                    </>
                                ) : (
                                    <>
                                        <Wand2 className="w-5 h-5 mr-2" /> Generate Magic
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>

                    {/* RIGHT PANE: Output Display */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={cn(
                            "flex-1 flex flex-col h-full rounded-2xl overflow-hidden shadow-2xl relative transition-all border bg-white border-slate-200",
                            mobileView === 'input' ? "hidden md:flex" : "flex"
                        )}
                    >
                        {/* Mobile: Back to Input Button */}
                        <div className="md:hidden p-2 border-b flex justify-start bg-slate-50 border-slate-200">
                            <Button variant="ghost" size="sm" onClick={() => setMobileView('input')} className="text-slate-500">
                                <ArrowLeft className="w-4 h-4 mr-2" /> Edit Inputs
                            </Button>
                        </div>
                        {/* Output Header */}
                        <div className="h-14 border-b flex items-center justify-between px-6 transition-colors bg-white border-slate-100">
                            <h2 className="font-semibold flex items-center gap-2 text-slate-700">
                                <Sparkles className="w-4 h-4 text-violet-500" />
                                AI Output
                            </h2>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Copy">
                                    <Copy className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Share">
                                    <Share2 className="w-4 h-4" />
                                </Button>
                                <div className="w-px h-4 mx-2 bg-slate-200" />
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 text-slate-400 hover:text-green-600" title="Good">
                                    <ThumbsUp className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-100 text-slate-400 hover:text-red-500" title="Bad">
                                    <ThumbsDown className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white">
                            {output ? (
                                <>
                                    <div className="prose max-w-none prose-lg prose-slate">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {output}
                                        </ReactMarkdown>
                                    </div>
                                    {isGenerating && (
                                        <span className="inline-block w-2 h-4 bg-violet-500 animate-pulse ml-1 opacity-70">|</span>
                                    )}
                                </>

                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center px-4">
                                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors bg-slate-50 border border-slate-100">
                                        <Wand2 className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <p className="text-lg font-bold mb-1 text-slate-900">Ready to create!</p>
                                    <p className="text-sm text-slate-500">Fill in the form on the left to generate content.</p>
                                </div>
                            )}
                        </div>
                    </motion.div >
                </div >
            </main>
            <Footer />
        </div>
    )
}
