"use client"

import React, { useState } from "react"
import { Eye, EyeOff, Loader2, CheckCircle2, Lock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { SettingsSection } from "@/components/settings/SettingsSection"
import { SettingsCard, SettingsCardContent, SettingsCardFooter } from "@/components/settings/SettingsCard"
import { useAuth } from "@/components/providers/AuthContext"

export default function SecurityPage() {
    const { tokens } = useAuth()

    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const [isLoading, setIsLoading] = useState(false)
    const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrors({})
        setNotification(null)

        // Client-side validation
        if (!currentPassword) {
            setErrors({ currentPassword: "Current password is required" })
            return
        }
        if (newPassword.length < 8) {
            setErrors({ newPassword: "Password must be at least 8 characters" })
            return
        }
        if (newPassword !== confirmPassword) {
            setErrors({ confirmPassword: "Passwords do not match" })
            return
        }

        setIsLoading(true)

        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"
            const response = await fetch(`${baseUrl}/api/v1/auth/settings/change-password/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokens?.access || ""}`,
                },
                body: JSON.stringify({
                    currentPassword,
                    newPassword,
                    confirmPassword,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setNotification({ type: "success", message: "Password changed successfully!" })
                setCurrentPassword("")
                setNewPassword("")
                setConfirmPassword("")

                setTimeout(() => {
                    setNotification(null)
                }, 5000)
            } else {
                // Handle specific backend error messages
                if (data.currentPassword || data.current_password) {
                    setErrors({ currentPassword: data.currentPassword || data.current_password })
                } else if (data.newPassword || data.new_password) {
                    setErrors({ newPassword: data.newPassword || data.new_password })
                } else if (data.detail) {
                    setNotification({ type: "error", message: data.detail })
                } else if (data.error) {
                    setNotification({ type: "error", message: data.error })
                } else {
                    setNotification({ type: "error", message: "Failed to change password. Please try again." })
                }
            }
        } catch {
            setNotification({ type: "error", message: "Network error. Please check your connection and try again." })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2 text-slate-900 dark:text-white">Security</h1>
                <p className="text-slate-500 dark:text-slate-400">Manage your password and account security settings.</p>
            </div>

            <SettingsSection title="Change Password" variant="slate">
                <SettingsCard variant="slate">
                    <form onSubmit={handleChangePassword}>
                        <SettingsCardContent className="space-y-6">
                            {/* Success Notification */}
                            {notification?.type === "success" && (
                                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <p className="text-green-500 font-medium">{notification.message}</p>
                                </div>
                            )}

                            {/* Error Notification */}
                            {notification?.type === "error" && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-red-500 font-medium">{notification.message}</p>
                                </div>
                            )}

                            {/* Current Password */}
                            <div>
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <div className="relative mt-2">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <Input
                                        id="currentPassword"
                                        name="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        required
                                        value={currentPassword}
                                        onChange={(e) => {
                                            setCurrentPassword(e.target.value)
                                            setErrors({})
                                            setNotification(null)
                                        }}
                                        placeholder="Enter your current password"
                                        className={cn(
                                            "pl-10 bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white pr-10 placeholder:text-slate-400 focus-visible:ring-violet-500",
                                            errors.currentPassword && "border-red-500 focus-visible:ring-red-500"
                                        )}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                    >
                                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.currentPassword && (
                                    <p className="mt-1.5 text-sm text-red-500">{errors.currentPassword}</p>
                                )}
                            </div>

                            {/* New Password */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative mt-2">
                                        <Input
                                            id="newPassword"
                                            name="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            required
                                            value={newPassword}
                                            onChange={(e) => {
                                                setNewPassword(e.target.value)
                                                setErrors({})
                                                setNotification(null)
                                            }}
                                            placeholder="Create a new password"
                                            className={cn(
                                                "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white pr-10 placeholder:text-slate-400 focus-visible:ring-violet-500",
                                                errors.newPassword && "border-red-500 focus-visible:ring-red-500"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.newPassword && (
                                        <p className="mt-1.5 text-sm text-red-500">{errors.newPassword}</p>
                                    )}
                                    <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                        Must be at least 8 characters.
                                    </p>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <div className="relative mt-2">
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? "text" : "password"}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => {
                                                setConfirmPassword(e.target.value)
                                                setErrors({})
                                                setNotification(null)
                                            }}
                                            placeholder="Confirm your new password"
                                            className={cn(
                                                "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white pr-10 placeholder:text-slate-400 focus-visible:ring-violet-500",
                                                errors.confirmPassword && "border-red-500 focus-visible:ring-red-500"
                                            )}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.confirmPassword && (
                                        <p className="mt-1.5 text-sm text-red-500">{errors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>
                        </SettingsCardContent>
                        <SettingsCardFooter variant="slate" className="flex justify-end border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 shadow-md shadow-violet-500/20 transition-all hover:scale-[1.02]"
                            >
                                {isLoading ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Updating...</>
                                ) : (
                                    "Change Password"
                                )}
                            </Button>
                        </SettingsCardFooter>
                    </form>
                </SettingsCard>
            </SettingsSection>
        </div>
    )
}
