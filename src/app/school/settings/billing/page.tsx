"use client"

import React, { useState, useEffect } from "react"
import { SettingsSection } from "@/components/settings/SettingsSection"
import { SettingsCard, SettingsCardContent } from "@/components/settings/SettingsCard"
import { Button } from "@/components/ui/button"
import { Building2, Users, Loader2 } from "lucide-react"
import { useAuth } from "@/components/providers/AuthContext"
import { useTheme } from "@/components/providers/ThemeContext"
import { cn } from "@/lib/utils"

export default function SchoolBillingPage() {
    const { theme } = useTheme()
    const { user, tokens } = useAuth()
    const isLight = theme === 'light'

    const [billingData, setBillingData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchBilling = async () => {
            const orgId = localStorage.getItem('organisation_id') || user?.organisation_id
            if (!orgId) return

            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/schools/${orgId}/billing/`, {
                    headers: {
                        'Authorization': `Bearer ${tokens?.access || ''}`,
                        'Content-Type': 'application/json'
                    }
                })
                if (res.ok) {
                    const data = await res.json()
                    if (data.success) {
                        setBillingData(data.billing)
                    }
                }
            } catch (err) {
                console.error("Billing fetch error", err)
            } finally {
                setIsLoading(false)
            }
        }

        if (user) {
            fetchBilling()
        } else {
            const t = setTimeout(() => setIsLoading(false), 2000)
            return () => clearTimeout(t)
        }
    }, [user, tokens])

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    const planName = billingData?.plan || "No Active Plan"
    const maxUsers = billingData?.max_users || 0
    const activeUsers = billingData?.active_teachers || 0
    const utilization = maxUsers > 0 ? Math.round((activeUsers / maxUsers) * 100) : 0
    const endDate = billingData?.billing_end_date ? new Date(billingData.billing_end_date).toLocaleDateString() : "N/A"

    return (
        <div className="space-y-8">
            <div>
                <h1 className={cn("text-3xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>Billing & Licenses</h1>
                <p className={isLight ? "text-slate-600" : "text-slate-400"}>Manage district-wide subscription.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <SettingsCard variant={isLight ? "default" : "slate"} className={cn(
                    isLight
                        ? "bg-indigo-50 border-indigo-200"
                        : "bg-indigo-900/10 border-indigo-500/30"
                )}>
                    <SettingsCardContent className="space-y-2">
                        <h4 className={cn("text-sm font-medium uppercase tracking-wider", isLight ? "text-indigo-600" : "text-indigo-400")}>Plan Type</h4>
                        <div className={cn("text-2xl font-bold flex items-center gap-2", isLight ? "text-indigo-900" : "text-white")}>
                            <Building2 className="w-6 h-6" /> {planName}
                        </div>
                        <p className={cn("text-xs", isLight ? "text-indigo-700" : "text-slate-400")}>District-wide License</p>
                    </SettingsCardContent>
                </SettingsCard>

                <SettingsCard variant={isLight ? "default" : "slate"}>
                    <SettingsCardContent className="space-y-2">
                        <h4 className={cn("text-sm font-medium uppercase tracking-wider", isLight ? "text-slate-500" : "text-slate-400")}>Total Licenses</h4>
                        <div className={cn("text-2xl font-bold", isLight ? "text-slate-900" : "text-white")}>{maxUsers === 0 ? "Unlimited" : `${maxUsers} Seats`}</div>
                        <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-500")}>Contract ends {endDate}</p>
                    </SettingsCardContent>
                </SettingsCard>

                <SettingsCard variant={isLight ? "default" : "slate"}>
                    <SettingsCardContent className="space-y-2">
                        <h4 className={cn("text-sm font-medium uppercase tracking-wider", isLight ? "text-slate-500" : "text-slate-400")}>Utilization</h4>
                        <div className={cn("text-2xl font-bold flex items-center gap-2", isLight ? "text-slate-900" : "text-white")}>
                            <Users className={cn("w-6 h-6", isLight ? "text-green-600" : "text-green-400")} /> {utilization}%
                        </div>
                        <p className={cn("text-xs", isLight ? "text-slate-500" : "text-slate-500")}>{activeUsers} Active Users</p>
                    </SettingsCardContent>
                </SettingsCard>
            </div>

            <SettingsSection title="License Allocation" variant={isLight ? "default" : "slate"}>
                <SettingsCard variant={isLight ? "default" : "slate"}>
                    <SettingsCardContent>
                        <div className="p-8 text-center space-y-4">
                            <p className={isLight ? "text-slate-600" : "text-slate-400"}>Detailed license management is available in the User Management dashboard.</p>
                            <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">Manage Allocations</Button>
                        </div>
                    </SettingsCardContent>
                </SettingsCard>
            </SettingsSection>
        </div>
    )
}
