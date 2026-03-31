"use client"

import React, { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Mail, ArrowRight, Loader2, ArrowLeft, KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { toast } from "react-hot-toast"

function ForgotPasswordContent() {
    const searchParams = useSearchParams()
    const [step, setStep] = useState<1 | 2 | 3 | 4>(1) // 1: Email, 2: Sent, 3: Password, 4: Success
    const [isLoading, setIsLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [token, setToken] = useState("")
    const [showPassword, setShowPassword] = useState(false)

    // Token Detection
    useEffect(() => {
        const urlToken = searchParams.get("token")
        if (urlToken) {
            setToken(urlToken)
            setStep(3)
        }
    }, [searchParams])

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/password/reset/request/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || data.message || "Email does not exist or reset failed")
                return
            }

            toast.success("Reset link sent to your email!")
            setStep(2)
        } catch (error) {
            toast.error("An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match!")
            return
        }

        setIsLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/auth/password/reset/confirm/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: token,
                    new_password: newPassword,
                    new_password_confirm: confirmPassword,
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                // Backend returns error in 'error' or specific field errors
                const errorMessage = data.error || (data.new_password ? data.new_password[0] : null) || "Reset failed or token is invalid"
                toast.error(errorMessage)
                return
            }

            toast.success("Password reset successfully!")
            setStep(4)
        } catch (error) {
            toast.error("An error occurred. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }



    // --- RENDER STEPS ---

    // STEP 1: EMAIL FORM
    if (step === 1) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                    <p className="text-white/60 text-sm">
                        Enter your email address and we'll send you a code to reset your password.
                    </p>
                </div>

                <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-white/80 uppercase tracking-wider ml-1">
                            Email Address
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <Input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@school.edu"
                                className="pl-12 h-12 bg-black/20 border-white/10 text-white placeholder:text-white/30"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Code"}
                    </Button>
                </form>

                <Link href="/login" className="flex items-center justify-center gap-2 text-sm text-white/50 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
            </div>
        )
    }

    // STEP 2: EMAIL SENT SCREEN
    if (step === 2) {
        return (
            <div className="space-y-6">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-violet-500/10 rounded-full flex items-center justify-center mx-auto">
                        <Mail className="w-8 h-8 text-violet-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">Check your email</h1>
                    <p className="text-white/60 text-sm">
                        We've sent a password reset link to <span className="text-white font-medium">{email}</span>.
                    </p>
                    <p className="text-white/40 text-xs italic">
                        Please tap the link in the email to proceed with resetting your password.
                    </p>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <p className="text-xs text-white/50 text-center uppercase tracking-widest font-bold">What's next?</p>
                    <ul className="space-y-2 text-sm text-white/70">
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-bold">1</span>
                            Open the email from NibbleLearn
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-bold">2</span>
                            Click the "Reset Password" button or link
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center text-[10px] font-bold">3</span>
                            Enter your new password on the following page
                        </li>
                    </ul>
                </div>

                <button
                    onClick={() => setStep(1)}
                    className="flex w-full items-center justify-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Use different email
                </button>
            </div>
        )
    }

    // STEP 3: NEW PASSWORD (RESET)
    if (step === 3) {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Set New Password</h1>
                    <p className="text-white/60 text-sm">
                        Create a strong password for your account.
                    </p>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-white/80 uppercase tracking-wider ml-1">
                            New Password
                        </Label>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="••••••••"
                                className="pl-12 pr-12 h-12 bg-black/20 border-white/10 text-white placeholder:text-white/30"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-white/80 uppercase tracking-wider ml-1">
                            Confirm Password
                        </Label>
                        <div className="relative">
                            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                            <Input
                                type={showPassword ? "text" : "password"}
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="pl-12 pr-12 h-12 bg-black/20 border-white/10 text-white placeholder:text-white/30"
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={isLoading || !newPassword || !confirmPassword}
                        className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold transition-all"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </Button>
                </form>

                <div className="text-center text-xs text-white/30 px-4">
                    If this link is expired, please request a new one by going back.
                </div>
            </div>
        )
    }

    // STEP 4: SUCCESS
    return (
        <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-green-500/5">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Password Reset!</h1>
                <p className="text-white/60 text-sm max-w-xs mx-auto">
                    Your password has been successfully updated. You can now login with your new credentials.
                </p>
            </div>
            <Link href="/login">
                <Button className="w-full h-11 bg-white text-slate-900 hover:bg-white/90 font-semibold gap-2">
                    Back to Login <ArrowRight className="w-4 h-4" />
                </Button>
            </Link>
        </div>
    )
}

export default function ForgotPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white/20" />
            </div>
        }>
            <ForgotPasswordContent />
        </Suspense>
    )
}
