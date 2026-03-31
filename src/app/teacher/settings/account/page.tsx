"use client"

import React, { useState, useEffect } from "react"
import { SettingsSection } from "@/components/settings/SettingsSection"
import { SettingsCard, SettingsCardContent } from "@/components/settings/SettingsCard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    UserCircle, Pencil, Save, X, Loader2,
    Building2, Phone, BadgeCheck, Mail, User, Globe
} from "lucide-react"
import { useTheme } from "@/components/providers/ThemeContext"
import { useAuth } from "@/components/providers/AuthContext"
import { cn } from "@/lib/utils"
import { toast } from "react-hot-toast"

// ── Types ───────────────────────────────────────────────────────────────────
interface ProfileData {
    id: string
    name: string
    email: string
    role: string
    avatar: string | null
    organisation: string | null
    phone_number: string | null
    timezone: string
    emailNotifications: boolean
    twoFactorEnabled: boolean
}

// ── Summary chip ────────────────────────────────────────────────────────────
function SummaryField({
    icon: Icon,
    label,
    value,
    isLight,
}: {
    icon: React.ElementType
    label: string
    value: string | null | undefined
    isLight: boolean
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                isLight
                    ? "bg-slate-50 border border-slate-200"
                    : "bg-white/5 border border-white/10"
            )}
        >
            <div
                className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                    isLight ? "bg-violet-100 text-violet-600" : "bg-violet-500/20 text-violet-400"
                )}
            >
                <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
                <p className={cn("text-xs font-medium uppercase tracking-wide", isLight ? "text-slate-400" : "text-white/40")}>
                    {label}
                </p>
                <p className={cn("text-sm font-semibold truncate", isLight ? "text-slate-800" : "text-white")}>
                    {value || (
                        <span className={isLight ? "text-slate-400 font-normal italic" : "text-white/30 font-normal italic"}>
                            Not set
                        </span>
                    )}
                </p>
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
export default function TeacherAccountPage() {
    const { theme } = useTheme()
    const isLight = theme === "light"
    const variant = isLight ? "default" : "glass"

    const { tokens } = useAuth()

    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(true)

    // Phone-only edit state
    const [isEditingPhone, setIsEditingPhone] = useState(false)
    const [phoneValue, setPhoneValue] = useState("")
    const [savingPhone, setSavingPhone] = useState(false)

    // ── Fetch profile ────────────────────────────────────────────────────
    useEffect(() => {
        const fetchProfile = async () => {
            if (!tokens?.access) return
            try {
                const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
                const res = await fetch(`${baseUrl}/api/v1/auth/settings/profile/`, {
                    headers: {
                        Authorization: `Bearer ${tokens.access}`,
                        "Content-Type": "application/json",
                    },
                })
                const json = await res.json()
                if (json.success && json.data) {
                    setProfile(json.data)
                    setPhoneValue(json.data.phone_number || "")
                }
            } catch (err) {
                console.error("Failed to fetch profile:", err)
                toast.error("Failed to load profile")
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [tokens])

    const fetchProfileData = async () => {
        if (!tokens?.access) return
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            const res = await fetch(`${baseUrl}/auth/settings/profile/`, {
                headers: {
                    Authorization: `Bearer ${tokens.access}`,
                    "Content-Type": "application/json",
                },
            })
            const json = await res.json()
            if (json.success && json.data) {
                setProfile(json.data)
                setPhoneValue(json.data.phone_number || "")
            }
        } catch (err) {
            console.error("Failed to fetch profile:", err)
        }
    }

    // ── Save phone (PUT) ─────────────────────────────────────────────────
    const handleSavePhone = async () => {
        if (!tokens?.access) return
        setSavingPhone(true)
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            const res = await fetch(`${baseUrl}/api/v1/auth/settings/profile/`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${tokens.access}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: profile?.name || "",
                    organisation: profile?.organisation || "",
                    phone_number: phoneValue,
                    role: profile?.role || "",
                }),
            })
            const json = await res.json()
            if (json.success && json.data) {
                await fetchProfileData()
                toast.success("Phone number updated")
                setIsEditingPhone(false)
            } else {
                toast.error(json.message || "Failed to update phone number")
            }
        } catch (err) {
            console.error("Failed to update phone:", err)
            toast.error("Failed to update phone number")
        } finally {
            setSavingPhone(false)
        }
    }

    const handleCancelPhone = () => {
        setPhoneValue(profile?.phone_number || "")
        setIsEditingPhone(false)
    }

    // ── Loading state ────────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className={cn("w-8 h-8 animate-spin", isLight ? "text-violet-600" : "text-violet-400")} />
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex items-center justify-center py-24">
                <p className={isLight ? "text-slate-500" : "text-white/50"}>Unable to load profile.</p>
            </div>
        )
    }

    // ── Render ────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8">
            <div>
                <h1 className={cn("text-3xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>
                    Account & Profile
                </h1>
                <p className={isLight ? "text-slate-500" : "text-white/60"}>
                    Manage your personal information and how you appear as a teacher.
                </p>
            </div>

            {/* ── Account Summary ─────────────────────────────────────────── */}
            <SettingsSection
                title="Account Summary"
                description="A quick overview of your teaching account details."
                variant={isLight ? "slate" : "glass"}
            >
                <SettingsCard variant={isLight ? "slate" : "glass"}>
                    <SettingsCardContent className="pt-5 pb-5">
                        {/* Avatar + name header */}
                        <div className="flex items-center gap-4 mb-6">
                            <div className={cn(
                                "w-14 h-14 rounded-full flex items-center justify-center overflow-hidden border-2 flex-shrink-0",
                                isLight ? "border-slate-200 bg-slate-100" : "border-white/10 bg-white/10"
                            )}>
                                {profile.avatar ? (
                                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <UserCircle className={cn("w-8 h-8", isLight ? "text-slate-400" : "text-white/50")} />
                                )}
                            </div>
                            <div>
                                <p className={cn("text-lg font-bold leading-tight", isLight ? "text-slate-900" : "text-white")}>
                                    {profile.name}
                                </p>
                                <p className={cn("text-sm", isLight ? "text-slate-500" : "text-white/50")}>
                                    {profile.email}
                                </p>
                            </div>
                        </div>

                        {/* Info chips */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {profile.name && <SummaryField icon={User}       label="Name"          value={profile.name}          isLight={isLight} />}
                            {profile.organisation && <SummaryField icon={Building2}  label="Organisation"  value={profile.organisation}  isLight={isLight} />}

                            {/* Phone Number — editable inline */}
                            <div
                                className={cn(
                                    "rounded-xl px-4 py-3 transition-all duration-150",
                                    isEditingPhone ? "col-span-1 sm:col-span-2" : "",
                                    isLight
                                        ? "bg-slate-50 border border-slate-200"
                                        : "bg-white/5 border border-white/10"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                            isLight ? "bg-violet-100 text-violet-600" : "bg-violet-500/20 text-violet-400"
                                        )}
                                    >
                                        <Phone className="w-4 h-4" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <p className={cn("text-xs font-medium uppercase tracking-wide", isLight ? "text-slate-400" : "text-white/40")}>
                                            Phone Number
                                        </p>
                                        {!isEditingPhone && (
                                            <p className={cn("text-sm font-semibold truncate", isLight ? "text-slate-800" : "text-white")}>
                                                {profile.phone_number || (
                                                    <span className={isLight ? "text-slate-400 font-normal italic" : "text-white/30 font-normal italic"}>
                                                        Not set
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    {!isEditingPhone && (
                                        <button
                                            onClick={() => setIsEditingPhone(true)}
                                            title="Edit phone number"
                                            className={cn(
                                                "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                                                isLight
                                                    ? "text-slate-400 hover:text-violet-600 hover:bg-violet-50"
                                                    : "text-white/30 hover:text-violet-400 hover:bg-violet-500/10"
                                            )}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                {isEditingPhone && (
                                    <div className="flex items-center gap-2 mt-3">
                                        <Input
                                            value={phoneValue}
                                            onChange={e => setPhoneValue(e.target.value)}
                                            placeholder="e.g. +256 758 830 899"
                                            className={cn(
                                                "flex-1",
                                                isLight
                                                    ? "text-slate-900 placeholder:text-slate-400"
                                                    : "bg-black/40 border-white/20 text-white placeholder:text-white/30"
                                            )}
                                            autoFocus
                                        />
                                        <Button
                                            size="icon"
                                            onClick={handleSavePhone}
                                            disabled={savingPhone}
                                            className="flex-shrink-0 bg-violet-600 hover:bg-violet-500 text-white"
                                        >
                                            {savingPhone
                                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                                : <Save className="w-4 h-4" />
                                            }
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={handleCancelPhone}
                                            disabled={savingPhone}
                                            className={cn(
                                                "flex-shrink-0",
                                                isLight ? "text-slate-500 hover:bg-slate-100" : "text-white/50 hover:bg-white/10"
                                            )}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {profile.role && <SummaryField icon={BadgeCheck}  label="Role"          value={profile.role}          isLight={isLight} />}
                            {profile.email && <SummaryField icon={Mail}        label="Email"         value={profile.email}         isLight={isLight} />}
                            {profile.timezone && <SummaryField icon={Globe}       label="Timezone"      value={profile.timezone}      isLight={isLight} />}
                        </div>
                    </SettingsCardContent>
                </SettingsCard>
            </SettingsSection>
        </div>
    )
}
