"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Bell, Info, Shield, Zap, CheckCircle, Trash2, Clock } from "lucide-react"
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

export default function NotificationsPage() {
    const { theme } = useTheme()
    const { tokens } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const isLight = theme === 'light'

    useEffect(() => {
        if (!tokens?.access) return;
        fetchNotifications();
    }, [tokens]);

    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            const res = await fetch(`${baseUrl}/api/v1/leads/notifications/`, {
                headers: { 'Authorization': `Bearer ${tokens?.access}` }
            });
            if (res.ok) {
                const json = await res.json();
                
                // Map backend representation to frontend type
                const mapped = (json.data?.notifications || []).map((n: any) => {
                    // Decide icon/color based on priority or type
                    let icon = Info;
                    let color = "text-blue-500 bg-blue-500/10";
                    if (n.priority === 'high' || n.notification_type === 'alert') {
                        icon = Zap;
                        color = "text-amber-500 bg-amber-500/10";
                    } else if (n.notification_type === 'success') {
                        icon = CheckCircle;
                        color = "text-emerald-500 bg-emerald-500/10";
                    } else if (n.priority === 'low') {
                        icon = Clock;
                        color = "text-slate-500 bg-slate-500/10";
                    }

                    // simple relative time calculation
                    const dateObj = new Date(n.created_at);
                    const now = new Date();
                    const diffMins = Math.floor((now.getTime() - dateObj.getTime()) / 60000);
                    let timeStr = `${diffMins} mins ago`;
                    if (diffMins > 1440) timeStr = `${Math.floor(diffMins/1440)} days ago`;
                    else if (diffMins > 60) timeStr = `${Math.floor(diffMins/60)} hours ago`;
                    else if (diffMins < 1) timeStr = 'Just now';

                    return {
                        id: n.id.toString(),
                        title: n.title,
                        description: n.body,
                        time: timeStr,
                        icon: icon,
                        color: color,
                        isRead: n.is_read
                    }
                });
                
                setNotifications(mapped);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAllAsRead = async () => {
        if (!tokens?.access) return;
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            await fetch(`${baseUrl}/api/v1/leads/notifications/read-all/`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${tokens.access}` }
            });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            
            // Dispatch event so sidebar updates instantly
            window.dispatchEvent(new Event('profileUpdated'));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    }

    const deleteNotification = (id: string) => {
        // Feature to actual delete from backend might not exist yet, removing from local state
        setNotifications(prev => prev.filter(n => n.id !== id))
    }

    const toggleRead = async (id: string) => {
        if (!tokens?.access) return;
        const currentNotif = notifications.find(n => n.id === id);
        if (!currentNotif) return;
        
        // Optimistic UI update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
        
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            // Backend currently only has "mark read", not "toggle read"
            // We will invoke it only if it was unread 
            // (If they mark read as unread, we visually spoof it for now as there's no endpoint)
            if (!currentNotif.isRead) {
                await fetch(`${baseUrl}/api/v1/leads/notifications/${id}/read/`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${tokens.access}` }
                });
            }
            window.dispatchEvent(new Event('profileUpdated'));
        } catch (error) {
            console.error("Failed to toggle read state", error);
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-20">
            <div className={cn("flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-8", isLight ? "border-slate-200" : "border-slate-800")}>
                <div>
                    <h1 className={cn("text-3xl font-bold mb-2", isLight ? "text-slate-900" : "text-white")}>Notifications</h1>
                    <p className={cn("text-lg", isLight ? "text-slate-600 font-medium" : "text-slate-400")}>
                        Stay updated with the latest alerts and feature announcements.
                    </p>
                </div>
                <Button 
                    variant="outline" 
                    onClick={markAllAsRead}
                    className={cn("rounded-xl border shadow-sm transition-all", isLight ? "bg-white hover:bg-slate-50 border-slate-200" : "bg-white/5 hover:bg-white/10 border-white/10")}
                >
                    Mark all as read
                </Button>
            </div>

            <div className="space-y-4">
                {isLoading ? (
                    <div className={cn("text-center py-20 rounded-2xl border border-dashed", isLight ? "border-slate-300 text-slate-500" : "border-slate-700 text-slate-400")}>
                        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-sm">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className={cn("text-center py-20 rounded-2xl border border-dashed", isLight ? "border-slate-300 text-slate-500" : "border-slate-700 text-slate-400")}>
                        <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-xl font-medium">All caught up!</p>
                        <p className="text-sm">No new notifications at the moment.</p>
                    </div>
                ) : (
                    notifications.map((n, i) => (
                        <motion.div
                            key={n.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={cn(
                                "group relative p-6 rounded-2xl border transition-all duration-200 flex gap-5",
                                isLight 
                                    ? "bg-white border-slate-200 hover:border-violet-300" 
                                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20",
                                !n.isRead && (isLight ? "ring-2 ring-violet-500/10 bg-violet-50/30" : "ring-2 ring-violet-500/20 bg-violet-500/5")
                            )}
                        >
                            <div className={cn("w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center", n.color)}>
                                <n.icon className="w-6 h-6" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className={cn("font-bold truncate", isLight ? "text-slate-900" : "text-white")}>
                                        {n.title}
                                    </h3>
                                    {!n.isRead && (
                                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                                    )}
                                </div>
                                <p className={cn("text-sm leading-relaxed mb-3", isLight ? "text-slate-600 font-medium" : "text-slate-400")}>
                                    {n.description}
                                </p>
                                <div className="flex items-center gap-4">
                                    <span className={cn("text-xs flex items-center gap-1.5", isLight ? "text-slate-400 font-medium" : "text-slate-500 uppercase tracking-wider")}>
                                        <Clock className="w-3.5 h-3.5" />
                                        {n.time}
                                    </span>
                                    <button 
                                        onClick={() => toggleRead(n.id)}
                                        className={cn("text-xs font-bold hover:underline", isLight ? "text-violet-600" : "text-violet-400")}
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
