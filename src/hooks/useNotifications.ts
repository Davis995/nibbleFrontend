import { useState, useEffect, useCallback } from "react"
import { Info, Zap, CheckCircle, Clock, Shield } from "lucide-react"

export type NotifItem = {
    id: string
    title: string
    description: string
    time: string
    icon: any
    color: string
    isRead: boolean
}

function mapNotification(n: any): NotifItem {
    let icon = Info
    let color = "text-blue-500 bg-blue-500/10"

    if (n.priority === "high" || n.notification_type === "alert") {
        icon = Zap
        color = "text-amber-500 bg-amber-500/10"
    } else if (n.notification_type === "success") {
        icon = CheckCircle
        color = "text-emerald-500 bg-emerald-500/10"
    } else if (n.notification_type === "security") {
        icon = Shield
        color = "text-blue-500 bg-blue-500/10"
    } else if (n.priority === "low") {
        icon = Clock
        color = "text-slate-500 bg-slate-500/10"
    }

    const dateObj = new Date(n.created_at)
    const now = new Date()
    const diffMins = Math.floor((now.getTime() - dateObj.getTime()) / 60000)
    let time = "Just now"
    if (diffMins >= 1440) time = `${Math.floor(diffMins / 1440)}d ago`
    else if (diffMins >= 60) time = `${Math.floor(diffMins / 60)}h ago`
    else if (diffMins >= 1) time = `${diffMins}m ago`

    return {
        id: n.id.toString(),
        title: n.title,
        description: n.body,
        time,
        icon,
        color,
        isRead: n.is_read,
    }
}

export function useNotifications(token: string | undefined) {
    const [notifications, setNotifications] = useState<NotifItem[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const unreadCount = notifications.filter((n) => !n.isRead).length

    const fetchNotifications = useCallback(async () => {
        if (!token) return
        setIsLoading(true)
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            const res = await fetch(`${baseUrl}/api/v1/leads/notifications/`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (res.ok) {
                const json = await res.json()
                const mapped = (json.data?.notifications || []).map(mapNotification)
                setNotifications(mapped)
            }
        } catch (e) {
            console.error("Failed to fetch notifications", e)
        } finally {
            setIsLoading(false)
        }
    }, [token])

    useEffect(() => {
        fetchNotifications()
    }, [fetchNotifications])

    const markAllRead = async () => {
        if (!token) return
        try {
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            await fetch(`${baseUrl}/api/v1/leads/notifications/read-all/`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` },
            })
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        } catch (e) {
            console.error("Failed to mark all read", e)
        }
    }

    return { notifications, isLoading, unreadCount, markAllRead, refetch: fetchNotifications }
}
