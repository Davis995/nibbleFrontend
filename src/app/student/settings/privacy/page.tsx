"use client"

import React, { useState } from "react"
import { SettingsSection } from "@/components/settings/SettingsSection"
import { SettingsCard, SettingsCardContent, SettingsCardFooter } from "@/components/settings/SettingsCard"
import { Shield, Eye, Lock, Globe, Bell, Fingerprint } from "lucide-react"
import { useTheme } from "@/components/providers/ThemeContext"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"

export default function StudentPrivacyPage() {
    const { theme } = useTheme()
    const isLight = theme === 'light'
    const variant = isLight ? 'slate' : 'glass'

    const [settings, setSettings] = useState({
        profileVisible: true,
        shareHistory: false,
        dataPersonalization: true,
        marketingEmails: false,
        anonymousAnalytics: true
    })

    const [isSaving, setIsSaving] = useState(false)

    const toggleSetting = (key: keyof typeof settings) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const handleSave = async () => {
        setIsSaving(true)
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800))
        setIsSaving(false)
        toast.success("Privacy settings updated")
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className={cn("text-3xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>Privacy & Safety</h1>
                <p className={isLight ? "text-slate-500" : "text-white/60"}>Manage how your data is handled and who can see your activity.</p>
            </div>

            <SettingsSection 
                title="Profile Visibility" 
                description="Control how your profile appears to teachers and classmates."
                variant={variant}
            >
                <SettingsCard variant={variant}>
                    <SettingsCardContent className="space-y-6">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                    isLight ? "bg-blue-100/50 text-blue-600" : "bg-white/10 text-white"
                                )}>
                                    <Eye className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={cn("font-bold mb-1", isLight ? "text-slate-900" : "text-white")}>Public Profile</h3>
                                    <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-600" : "text-white/70")}>Allow teachers and authorized staff to view your full learning profile.</p>
                                </div>
                            </div>
                            <Switch checked={settings.profileVisible} onCheckedChange={() => toggleSetting('profileVisible')} />
                        </div>
                    </SettingsCardContent>
                </SettingsCard>
            </SettingsSection>

            <SettingsSection 
                title="Data & History" 
                description="Manage your learning history and diagnostic data."
                variant={variant}
            >
                <SettingsCard variant={variant}>
                    <SettingsCardContent className="space-y-6">
                        <div className="flex items-center justify-between gap-4 py-2">
                            <div className="flex gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                    isLight ? "bg-amber-100/50 text-amber-600" : "bg-white/10 text-white"
                                )}>
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={cn("font-bold mb-1", isLight ? "text-slate-900" : "text-white")}>Share Learning History</h3>
                                    <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-600" : "text-white/70")}>Allow AI tools to reference your past work for better personalization.</p>
                                </div>
                            </div>
                            <Switch checked={settings.shareHistory} onCheckedChange={() => toggleSetting('shareHistory')} />
                        </div>

                        <div className="h-px w-full bg-slate-200 dark:bg-white/10" />

                        <div className="flex items-center justify-between gap-4 py-2">
                            <div className="flex gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                                    isLight ? "bg-emerald-100/50 text-emerald-600" : "bg-white/10 text-white"
                                )}>
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className={cn("font-bold mb-1", isLight ? "text-slate-900" : "text-white")}>Anonymous Analytics</h3>
                                    <p className={cn("text-sm leading-relaxed", isLight ? "text-slate-600" : "text-white/70")}>Help us improve NibbleLearn by sharing anonymous usage data.</p>
                                </div>
                            </div>
                            <Switch checked={settings.anonymousAnalytics} onCheckedChange={() => toggleSetting('anonymousAnalytics')} />
                        </div>
                    </SettingsCardContent>
                    <SettingsCardFooter variant={variant} className="flex justify-end border-t border-slate-200 dark:border-white/10 pt-4 mt-2">
                        <Button 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-500 text-white"
                        >
                            {isSaving ? "Saving..." : "Save Privacy Settings"}
                        </Button>
                    </SettingsCardFooter>
                </SettingsCard>
            </SettingsSection>
        </div>
    )
}
