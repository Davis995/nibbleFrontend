"use client"

import React, { useState, useEffect } from "react"
import { SettingsSection } from "@/components/settings/SettingsSection"
import { SettingsCard, SettingsCardContent } from "@/components/settings/SettingsCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Upload, Loader2, Save, CheckCircle, AlertTriangle } from "lucide-react"
import { useTheme } from "@/components/providers/ThemeContext"
import { useAuth } from "@/components/providers/AuthContext"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export default function SchoolOrganizationPage() {
    const { theme } = useTheme()
    const { user, tokens } = useAuth()
    const isLight = theme === 'light'

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
    
    // Form fields
    const [name, setName] = useState("")
    const [schoolId, setSchoolId] = useState("")
    const [email, setEmail] = useState("")

    const showToast = (msg: string, type: "success" | "error" = "success") => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 3000)
    }

    useEffect(() => {
        const fetchDetails = async () => {
            const orgId = localStorage.getItem('organisation_id') || user?.organisation_id
            if (!orgId) return

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/schools/${orgId}/`, {
                    headers: {
                        'Authorization': `Bearer ${tokens?.access || ''}`,
                        'Content-Type': 'application/json'
                    }
                })
                if (res.ok) {
                    const data = await res.json()
                    setName(data.name || "")
                    setSchoolId(data.id || "")
                    setEmail(data.school_email || "")
                }
            } catch (err) {
                console.error("Fetch org details error", err)
            } finally {
                setIsLoading(false)
            }
        }

        if (user) {
            fetchDetails()
        } else {
            const t = setTimeout(() => setIsLoading(false), 2000)
            return () => clearTimeout(t)
        }
    }, [user, tokens])

    const handleSave = async () => {
        setIsSaving(true)
        const orgId = localStorage.getItem('organisation_id') || user?.organisation_id
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/schools/${orgId}/`, {
                method: "PUT",
                headers: {
                    'Authorization': `Bearer ${tokens?.access || ''}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: name, school_email: email })
            })
            if (res.ok) {
                showToast("Organization details updated successfully!")
            } else {
                showToast("Failed to update organization details.", "error")
            }
        } catch (err) {
            showToast("An error occurred.", "error")
        } finally {
            setIsSaving(false)
        }
    }

    const handleResetData = async () => {
        if (!window.confirm("WARNING: This will delete all demo students, staff, activity logs, and AI history. Are you absolutely sure you want to proceed?")) {
            return;
        }

        setIsResetting(true)
        const orgId = localStorage.getItem('organisation_id') || user?.organisation_id
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/schools/${orgId}/reset-data/`, {
                method: "POST",
                headers: {
                    'Authorization': `Bearer ${tokens?.access || ''}`,
                    'Content-Type': 'application/json'
                }
            })
            if (res.ok) {
                showToast("School demo data has been purged.")
                // Optionally reload or state update
                setTimeout(() => window.location.reload(), 2000)
            } else {
                const err = await res.json()
                showToast(err.error || "Failed to reset data.", "error")
            }
        } catch (err) {
            showToast("An error occurred during reset.", "error")
        } finally {
            setIsResetting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20 relative">
            {/* ── TOAST ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={cn(
                            "fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm font-medium",
                            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
                        )}
                    >
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex justify-between items-end border-b border-slate-200 dark:border-slate-800 pb-6">
                <div>
                    <h1 className={cn("text-3xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>Organization Settings</h1>
                    <p className={isLight ? "text-slate-600" : "text-slate-400"}>Manage your district profile and branding.</p>
                </div>
                <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 shadow-sm flex items-center gap-2"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                </Button>
            </div>

            <SettingsSection title="District Information" variant={isLight ? "default" : "slate"}>
                <SettingsCard variant={isLight ? "default" : "slate"}>
                    <SettingsCardContent className="space-y-6">
                        <div className="flex items-center gap-6">
                            <div className={cn(
                                "w-24 h-24 rounded-lg flex items-center justify-center border-dashed border",
                                isLight
                                    ? "bg-indigo-50 border-indigo-200"
                                    : "bg-indigo-900/20 border-indigo-500/30"
                            )}>
                                <Building2 className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div className="space-y-2">
                                <h3 className={cn("font-medium", isLight ? "text-slate-900" : "text-white")}>District Logo</h3>
                                <p className={isLight ? "text-slate-500" : "text-slate-400"}>Upload a PNG or SVG for your branded portal.</p>
                                <Button variant="outline" size="sm" className={cn(
                                    isLight
                                        ? "border-slate-200 text-slate-700 hover:bg-slate-50"
                                        : "bg-transparent border-slate-700 text-white hover:bg-slate-800 hover:text-white"
                                )}>
                                    <Upload className="w-4 h-4 mr-2" /> Upload Logo
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className={isLight ? "text-slate-700" : "text-slate-300"}>Organization Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={cn(
                                        isLight
                                            ? "bg-white border-slate-200 text-slate-900"
                                            : "bg-slate-950 border-slate-800 text-white"
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className={isLight ? "text-slate-700" : "text-slate-300"}>District ID</Label>
                                <Input
                                    value={schoolId.toUpperCase()}
                                    readOnly
                                    className={cn(
                                        isLight
                                            ? "bg-slate-50 border-slate-200 text-slate-600"
                                            : "bg-slate-900/50 border-slate-800 text-slate-500"
                                    )}
                                />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label className={isLight ? "text-slate-700" : "text-slate-300"}>Contact Email / Address</Label>
                                <Input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={cn(
                                        isLight
                                            ? "bg-white border-slate-200 text-slate-900"
                                            : "bg-slate-950 border-slate-800 text-white"
                                    )}
                                />
                            </div>
                        </div>
                    </SettingsCardContent>
                </SettingsCard>
            </SettingsSection>

            {/* ── DANGER ZONE ── */}
            <div className="mt-12">
                <SettingsSection title="Danger Zone" variant={isLight ? "default" : "slate"}>
                    <SettingsCard variant={isLight ? "default" : "slate"} className="border-red-200 dark:border-red-900/30">
                        <SettingsCardContent className="space-y-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className={cn("font-bold text-lg mb-1 flex items-center gap-2", isLight ? "text-red-600" : "text-red-500")}>
                                        <AlertTriangle className="w-5 h-5" />
                                        Reset Demo Data
                                    </h3>
                                    <p className={isLight ? "text-slate-600" : "text-slate-400"}>
                                        This will permanently delete all generated demo students, staff, usage logs, and history from your account. 
                                        Once completed, this action cannot be undone. You will be redirected to onboarding to pick a new plan.
                                    </p>
                                </div>
                                <Button 
                                    onClick={handleResetData}
                                    disabled={isResetting}
                                    variant="destructive"
                                    className="shrink-0 bg-red-600 hover:bg-red-700 text-white font-bold"
                                >
                                    {isResetting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Purge Demo Data
                                </Button>
                            </div>
                        </SettingsCardContent>
                    </SettingsCard>
                </SettingsSection>
            </div>
        </div>
    )
}
