"use client"

import React, { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import {
    Users,
    GraduationCap,
    BookOpen,
    Zap,
    TrendingUp,
    ArrowUpRight,
    MoreHorizontal,
    Activity,
    Loader2
} from "lucide-react"
import { useTheme } from "@/components/providers/ThemeContext"
import { useAuth } from "@/components/providers/AuthContext"
import { cn } from "@/lib/utils"
import dynamic from 'next/dynamic'
// const SchoolTour = dynamic(() => import("../../../components/school/SchoolTour"), { ssr: false })



export default function SchoolDashboard() {
    const { theme } = useTheme()
    const { user, plan, tokens, updateOrgOrientation } = useAuth()
    const isLight = theme === 'light'
    
    const [dashboardData, setDashboardData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDashboardData = async () => {
            const orgId = localStorage.getItem('organisation_id') || user?.organisation_id;
            
            if (!orgId) {
                setError("Organization ID not found");
                setIsLoading(false);
                return;
            }

            try {
                // Fetch dynamic data based on organisation id
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/v1/schools/${orgId}/dashboard/`, {
                    headers: {
                        'Authorization': `Bearer ${tokens?.access || ''}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard data');
                }

                const data = await response.json();
                
                // Sync orientation status if provided
                if (data.orientation_required === true && user?.org_orientation !== false) {
                    updateOrgOrientation(false);
                }

                setDashboardData(data);
            } catch (err) {
                console.error("Dashboard fetch error:", err);
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchDashboardData();
        } else {
            // Wait for auth to initialize
            const timer = setTimeout(() => {
                if(isLoading) setIsLoading(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [user, tokens]);

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    // Adapt API Response to UI, with fallbacks for undefined properties
    const summary = dashboardData?.summary || {};
    const school = dashboardData?.school || {};

    const totalStudents = summary.total_students ?? 0;
    const totalTeachers = summary.total_staff ?? 0;
    const activeUsers = summary.total_active_users ?? 0;
    
    // Usage data mapping
    const totalStartCredits = summary.total_start_credits ?? 60000;
    const totalRemainingCredits = summary.total_remaining_credits ?? 45000;
    const creditRemainingPercentage = summary.credit_remaining_percentage ?? 75;
    const totalUsedCredits = totalStartCredits - totalRemainingCredits;
    const overallUsage = totalStartCredits > 0 ? ((totalUsedCredits / totalStartCredits) * 100).toFixed(1) : "0";

    const recentActivity = dashboardData?.recent_activities || [];
    const chartData = dashboardData?.graphs?.credit_over_months?.length > 0 ? dashboardData.graphs.credit_over_months : [];
    
    const planLimitNum = totalStartCredits;
    const validChartData = chartData.filter((m: any) => m.total_credits !== undefined || m.v !== undefined);
    const peak = validChartData.length > 0 ? validChartData.reduce((prev: any, current: any) => {
        const prevVal = prev.total_credits !== undefined ? prev.total_credits : (prev.v || 0);
        const currVal = current.total_credits !== undefined ? current.total_credits : (current.v || 0);
        return (prevVal > currVal) ? prev : current;
    }) : null;

    const peakMonth = peak ? (peak.m !== undefined ? peak.m : new Date(peak.month).toLocaleDateString('en-US', { month: 'short' })) : "N/A";
    const peakValue = peak ? `${(((peak.total_credits !== undefined ? peak.total_credits : peak.v) || 0) / 1000).toFixed(0)}k` : "0k";

    const metrics = [
        { label: "Total Students", value: typeof totalStudents === 'number' ? totalStudents.toLocaleString() : totalStudents, trend: "Static", trendUp: true, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-100" },
        { label: "Total Staff", value: typeof totalTeachers === 'number' ? totalTeachers.toLocaleString() : totalTeachers, trend: "Static", trendUp: true, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-100" },
        {
            label: "AI Usage Limit",
            value: `${creditRemainingPercentage}%`,
            subLabel: `${totalRemainingCredits.toLocaleString()} / ${totalStartCredits.toLocaleString()} Tokens`,
            trend: creditRemainingPercentage < 10 ? "Warning" : "Good",
            trendUp: creditRemainingPercentage >= 10,
            icon: Zap,
            color: creditRemainingPercentage < 10 ? "text-red-600" : "text-amber-600",
            bg: creditRemainingPercentage < 10 ? "bg-red-100" : "bg-amber-100"
        },
        { label: "Active Users", value: typeof activeUsers === 'number' ? activeUsers.toLocaleString() : activeUsers, trend: "Static", trendUp: true, icon: Activity, color: "text-emerald-600", bg: "bg-emerald-100" },
    ]

    return (
        <>
            {/* Guided Tour - Triggers for new users or manually */}
            {/* <SchoolTour /> */}

            <div className="space-y-8">
                {/* Header */}
                <div id="dashboard-header">
                    <h1 className={cn("text-2xl font-bold mb-1", isLight ? "text-slate-900" : "text-white")}>
                        {school.name ? `${school.name} Overview` : "School Overview"}
                </h1>
                <p className={cn("text-sm", isLight ? "text-slate-600 font-medium" : "text-slate-400")}>
                    Welcome back, {user ? `${user.first_name || ''} ${user.last_name || ''}` : 'Administrator'}.
                    {plan && (
                        <span> Current Plan: <span className="text-blue-600 font-bold">{plan.plan_name}</span>
                        ({plan.remaining_credits} credits, {plan.remaining_days} days left)</span>
                    )}
                </p>
                {error && (
                    <div className="mt-4 p-3 rounded-lg bg-red-100 border border-red-200 text-red-700 text-sm flex items-center justify-between">
                        <span><strong>Notice:</strong> Unable to fetch live data ({error}). Displaying default mock data.</span>
                    </div>
                )}
            </div>

            {/* Metrics Grid */}
            <div id="metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                            "border p-6 rounded-xl transition-all shadow-sm",
                            isLight
                                ? "bg-white border-slate-100 shadow-slate-200/50 hover:shadow-md hover:border-blue-100"
                                : "bg-slate-900 border-slate-800 hover:border-slate-700"
                        )}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-3 rounded-xl", metric.bg, metric.color)}>
                                <metric.icon className="w-6 h-6" />
                            </div>
                            <span className={cn(
                                "text-xs font-bold px-2.5 py-1 rounded-full",
                                isLight ? "bg-slate-50 border border-slate-100" : "bg-slate-800",
                                metric.trend === "Warning" ? "text-amber-600 bg-amber-50" : "text-green-600 bg-green-50"
                            )}>
                                {metric.trend}
                            </span>
                        </div>
                        <h3 className={cn("text-3xl font-bold mb-1 tracking-tight", isLight ? "text-slate-900" : "text-white")}>{metric.value}</h3>
                        <p className={cn("text-sm font-medium", isLight ? "text-slate-500" : "text-slate-500")}>
                            {metric.label}
                            {metric.subLabel && <span className="block text-xs font-normal opacity-80 mt-1">{metric.subLabel}</span>}
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Chart Area */}
                <motion.div
                    id="usage-chart"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={cn(
                        "md:col-span-2 border rounded-xl p-6 relative overflow-hidden",
                        isLight ? "bg-white border-slate-100 shadow-sm" : "bg-slate-900 border-slate-800"
                    )}
                >
                    {/* Chart Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className={cn("font-bold text-lg", isLight ? "text-slate-900" : "text-white")}>Credits Used Per Month</h3>
                            <p className={cn("text-xs font-medium mt-0.5", isLight ? "text-slate-500" : "text-slate-400")}>Annual AI token usage across your school</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-medium">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-sm bg-blue-500" />
                                <span className={isLight ? "text-slate-600" : "text-slate-400"}>Credits Used</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-1 border-t-2 border-dashed border-red-400" />
                                <span className={isLight ? "text-slate-600" : "text-slate-400"}>Plan Limit</span>
                            </div>
                        </div>
                    </div>

                    {/* Chart Body */}
                    <div className="flex gap-3">
                        {/* Y-Axis Labels */}
                        <div className="flex flex-col justify-between text-[10px] font-semibold text-right pb-6 shrink-0" style={{ height: "180px" }}>
                            {["60k", "50k", "40k", "30k", "20k", "10k", "0"].map((label) => (
                                <span key={label} className={isLight ? "text-slate-400" : "text-slate-500"}>{label}</span>
                            ))}
                        </div>

                        {/* Bars + Grid */}
                        <div className="flex-1 relative">
                            {/* Plan Limit Line at ~83% height (50k / 60k) */}
                            <div
                                className="absolute left-0 right-0 border-t-2 border-dashed border-red-400/60 z-10 pointer-events-none"
                                style={{ bottom: `calc(${(50 / 60) * 100}% + 24px)` }}
                            />

                            {/* Horizontal Grid Lines */}
                            <div className="absolute inset-0 bottom-6 flex flex-col justify-between pointer-events-none">
                                {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                                    <div key={i} className={cn("w-full border-t", isLight ? "border-slate-100" : "border-slate-800")} />
                                ))}
                            </div>

                            {/* Bars */}
                            <div className="flex items-end gap-1.5 pb-6 relative z-10" style={{ height: "180px" }}>
                                {chartData.map((month: any, index: number) => {
                                    const maxVal = Math.max(totalStartCredits || 60000, 100);
                                    const val = month.v !== undefined ? month.v : month.total_credits || 0;
                                    const heightPct = Math.min((val / maxVal) * 100, 100)
                                    const isOverLimit = val > (totalStartCredits * 0.8)

                                    const labelStr = month.m !== undefined ? month.m : new Date(month.month).toLocaleDateString('en-US', { month: 'short' });

                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center justify-end gap-1 h-full group relative">
                                            {/* Tooltip */}
                                            <div className={cn(
                                                "absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] py-1.5 px-2.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg",
                                                isLight ? "bg-slate-800 text-white" : "bg-slate-700 text-white"
                                            )}>
                                                <span className="font-bold">{(val / 1000).toFixed(0)}k</span> credits
                                            </div>

                                            {/* Bar */}
                                            <div
                                                className={cn(
                                                    "w-full rounded-t-md transition-all duration-200 group-hover:brightness-110 cursor-pointer",
                                                    isOverLimit
                                                        ? "bg-gradient-to-t from-red-500 to-orange-400"
                                                        : "bg-gradient-to-t from-blue-600 to-blue-400"
                                                )}
                                                style={{ height: `${heightPct}%` }}
                                            />

                                            {/* Month Label */}
                                            <span className={cn("text-[9px] font-semibold absolute -bottom-0", isLight ? "text-slate-400" : "text-slate-500")}>
                                                {labelStr}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Summary Row */}
                    <div className={cn("mt-4 pt-4 border-t flex justify-between items-center gap-4", isLight ? "border-slate-100" : "border-slate-800")}>
                        <div className="text-center">
                            <p className={cn("text-[11px] font-medium uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>Total Used (YTD)</p>
                            <p className={cn("text-lg font-bold mt-0.5", isLight ? "text-slate-900" : "text-white")}>{typeof totalUsedCredits === 'number' ? (totalUsedCredits/1000).toFixed(0) : totalUsedCredits}k <span className="text-xs font-normal text-slate-400">credits</span></p>
                        </div>
                        <div className={cn("w-px h-8", isLight ? "bg-slate-100" : "bg-slate-800")} />
                        <div className="text-center">
                            <p className={cn("text-[11px] font-medium uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>Plan Limit</p>
                            <p className={cn("text-lg font-bold mt-0.5", isLight ? "text-slate-900" : "text-white")}>{typeof planLimitNum === 'number' ? (planLimitNum/1000).toFixed(0) : planLimitNum}k <span className="text-xs font-normal text-slate-400">/ year</span></p>
                        </div>
                        <div className={cn("w-px h-8", isLight ? "bg-slate-100" : "bg-slate-800")} />
                        <div className="text-center">
                            <p className={cn("text-[11px] font-medium uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>Overall Usage</p>
                            <p className="text-lg font-bold mt-0.5 text-blue-500">{overallUsage}%</p>
                        </div>
                        <div className={cn("w-px h-8", isLight ? "bg-slate-100" : "bg-slate-800")} />
                        <div className="text-center">
                            <p className={cn("text-[11px] font-medium uppercase tracking-wider", isLight ? "text-slate-400" : "text-slate-500")}>Peak Month</p>
                            <p className={cn("text-lg font-bold mt-0.5", "text-orange-500")}>{peakMonth} <span className="text-xs font-normal text-slate-400">{peakValue}</span></p>
                        </div>
                    </div>
                </motion.div>

                {/* Live Activity Feed */}
                <motion.div
                    id="activity-feed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className={cn(
                        "border rounded-xl p-6 relative overflow-hidden",
                        isLight ? "bg-white border-slate-100 shadow-sm" : "bg-slate-900 border-slate-800"
                    )}
                >
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <h3 className={cn("font-bold text-lg", isLight ? "text-slate-900" : "text-white")}>Recent Activity</h3>
                        <button className={cn("transition-colors p-1 rounded-md", isLight ? "text-slate-400 hover:bg-slate-50 hover:text-black" : "text-slate-500 hover:text-white")}>
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6 relative z-10">
                        {recentActivity.length === 0 ? (
                            <p className="text-sm text-slate-500 text-center py-6">No recent activity detected.</p>
                        ) : (
                            recentActivity.map((item: any, i: number) => (
                                <div key={i} className="flex gap-4 relative pb-2 group">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 z-10 shadow-sm",
                                        isLight ? "bg-white border-slate-100" : "bg-slate-800 border-slate-700"
                                    )}>
                                        <div className={cn("w-2.5 h-2.5 rounded-full", i === 0 ? "bg-blue-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600")} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={cn("text-sm leading-snug", isLight ? "text-slate-600" : "text-slate-300")}>
                                            <span className={cn("font-semibold block", isLight ? "text-slate-900" : "text-white")}>{item.user || item.name} <span className="text-xs font-normal text-slate-400 ml-1">({item.role})</span></span>
                                            {item.action || `Used ${item.tool} - ${item.title}`}
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1 font-medium">{item.time_minutes_ago !== undefined ? `${item.time_minutes_ago} mins ago` : new Date(item.time).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <Link
                            href="/school/activity"
                            className={cn(
                                "w-full py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 group",
                                isLight
                                    ? "text-blue-600 hover:bg-blue-50"
                                    : "text-blue-400 hover:bg-blue-500/10"
                            )}
                        >
                            View All Activity
                            <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                    </div>
                </motion.div>
            </div>
            </div>
        </>
    )
}
