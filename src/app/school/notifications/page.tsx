"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, Info, ShieldAlert, Zap, CheckCircle, Trash2, Clock, Users, CreditCard, School, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/providers/ThemeContext"
import { useAuth } from "@/components/providers/AuthContext"
import { Button } from "@/components/ui/button"

type Notification = {
    id: string
    title: string
    description: string
    time: string
    icon: any
    color: string
    isRead: boolean
}

const initialNotifications: Notification[] = [
    {
        id: "1",
        title: "Billing Cycle Successful",
        description: "The monthly subscription for NibbleLearn School has been processed successfully.",
        time: "3 hours ago",
        icon: CreditCard,
        color: "text-emerald-500 bg-emerald-500/10",
        isRead: false
    },
    {
        id: "2",
        title: "New Teacher Onboarded",
        description: "Robert Fox has joined the 'Science' department and is ready for setup.",
        time: "6 hours ago",
        icon: Users,
        color: "text-blue-500 bg-blue-500/10",
        isRead: false
    },
    {
        id: "3",
        title: "System Performance Alert",
        description: "Higher than usual traffic detected in 'Grade 10' block. Systems are scaling.",
        time: "12 hours ago",
        icon: ShieldAlert,
        color: "text-amber-500 bg-amber-500/10",
        isRead: true
    },
    {
        id: "4",
        title: "Annual Usage Statistics",
        description: "Your annual school-wide usage report for 2024 is now available for download.",
        time: "2 days ago",
        icon: School,
        color: "text-indigo-500 bg-indigo-500/10",
        isRead: true
    }
]

export default function SchoolNotificationsPage() {
    const { theme } = useTheme()
    const { user, tokens } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const isLight = theme === 'light'

    useEffect(() => {
        const fetchNotifications = async () => {
            const orgId = localStorage.getItem('organisation_id') || user?.organisation_id;
            
            if (!orgId) {
                setIsLoading(false);
                return;
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/schools/${orgId}/notifications/`, {
                    headers: {
                        'Authorization': `Bearer ${tokens?.access || ''}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        const mapped = data.data.map((n: any) => ({
                            id: n.id,
                            title: n.title,
                            description: n.description,
                            time: new Date(n.time).toLocaleString(),
                            icon: n.icon === 'ShieldAlert' ? ShieldAlert : n.icon === 'CreditCard' ? CreditCard : n.icon === 'Clock' ? Clock : Zap,
                            color: n.type === 'critical' ? 'text-red-500 bg-red-500/10' : 'text-amber-500 bg-amber-500/10',
                            isRead: n.isRead
                        }));
                        setNotifications(mapped);
                    }
                }
            } catch (err) {
                console.error("Notifications fetch error:", err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchNotifications();
        } else {
            const timer = setTimeout(() => {
                if(isLoading) setIsLoading(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [user, tokens]);

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    }

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const toggleRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n))
    }

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-20">
            <div className={cn("flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-8", isLight ? "border-slate-200" : "border-slate-800")}>
                <div>
                    <h1 className={cn("text-3xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>Administrative Alerts</h1>
                    <p className={cn("text-lg", isLight ? "text-slate-600 font-medium" : "text-slate-400")}>
                        Manage system-wide updates, billing alerts, and organization news.
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={markAllAsRead}
                    className={cn("rounded-xl border shadow-sm transition-all", isLight ? "bg-white hover:bg-indigo-50 border-slate-200" : "bg-white/5 hover:bg-white/10 border-white/10")}
                >
                    Mark all as read
                </Button>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <div className={cn("text-center py-20 rounded-2xl border border-dashed", isLight ? "border-slate-300 text-slate-500" : "border-slate-700 text-slate-400")}>
                        <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-xl font-medium">No active alerts</p>
                        <p className="text-sm">Your organization is running smoothly.</p>
                    </div>
                ) : (
                    notifications.map((n, i) => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                                "group relative p-6 rounded-2xl border transition-all duration-200 flex gap-6",
                                isLight 
                                    ? "bg-white border-slate-200 hover:border-indigo-300 shadow-sm" 
                                    : "bg-slate-900 border-slate-800 hover:border-indigo-500/30",
                                !n.isRead && (isLight ? "ring-2 ring-indigo-500/10 bg-indigo-50/20" : "ring-2 ring-indigo-500/20 bg-indigo-500/5")
                            )}
                        >
                            <div className={cn("w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-inner", n.color)}>
                                <n.icon className="w-7 h-7" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className={cn("font-bold truncate text-lg tracking-tight", isLight ? "text-slate-900" : "text-white")}>
                                        {n.title}
                                    </h3>
                                    {!n.isRead && (
                                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                                    )}
                                </div>
                                <p className={cn("text-sm leading-relaxed mb-4", isLight ? "text-slate-600 font-medium" : "text-slate-400")}>
                                    {n.description}
                                </p>
                                <div className="flex items-center gap-5">
                                    <span className={cn("text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5", isLight ? "text-slate-400" : "text-slate-500")}>
                                        <Clock className="w-3.5 h-3.5" />
                                        {n.time}
                                    </span>
                                    <button 
                                        onClick={() => toggleRead(n.id)}
                                        className={cn("text-xs font-bold hover:underline", isLight ? "text-indigo-600" : "text-indigo-400")}
                                    >
                                        Mark as {n.isRead ? 'unread' : 'read'}
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={() => deleteNotification(n.id)}
                                className={cn(
                                    "p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4",
                                    isLight ? "text-slate-400 hover:bg-red-50 hover:text-red-600" : "text-slate-500 hover:bg-red-500/10 hover:text-red-500"
                                )}
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}
