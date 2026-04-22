
import React from 'react';
import { cn } from "@/lib/utils";
import { Zap } from "lucide-react";
import { useUsage } from '@/hooks/useUsage';
import { useAuth } from '@/components/providers/AuthContext';

interface TokenUsageProps {
    theme?: 'light' | 'dark';
    userType: 'student' | 'teacher';
}

export const TokenUsage: React.FC<TokenUsageProps> = ({ theme = 'light', userType }) => {
    const { data: usage, isLoading, error } = useUsage();
    const { user } = useAuth();

    // Hide usage for enterprise users
    if (user?.user_type === 'enterprise') {
        return null;
    }

    if (isLoading) {
        return (
            <div className={cn(
                "rounded-xl p-4 mb-4 transition-all animate-pulse",
                theme === 'light'
                    ? "bg-white border border-slate-200 shadow-sm"
                    : "bg-white/5 border border-white/10"
            )}>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-2 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
        );
    }

    if (error || !usage) {
        return null; // Or show error state
    }

    const isLight = theme === 'light';
    const usagePercentage = usage.usage_percentage;

    // Determine color based on usage
    let progressColor = isLight ? "bg-blue-600" : "bg-blue-500";
    if (userType === 'teacher') {
        progressColor = isLight ? "bg-violet-600" : "bg-violet-500";
    }

    // Warning colors for high usage
    if (usagePercentage > 90) {
        progressColor = "bg-red-500";
    } else if (usagePercentage > 75) {
        progressColor = "bg-amber-500";
    }

    return (
        <div className={cn(
            "rounded-xl p-4 mb-4 transition-all",
            isLight
                ? "bg-white border border-slate-200 shadow-sm"
                : "bg-white/5 border border-white/10"
        )}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className={cn(
                        "p-1 rounded-md",
                        isLight ? (userType === 'teacher' ? "bg-violet-100 text-violet-600" : "bg-blue-100 text-blue-600") : "bg-white/10 text-white"
                    )}>
                        <Zap className="w-3.5 h-3.5 fill-current" />
                    </div>
                    <span className={cn("text-xs font-bold uppercase tracking-wider", isLight ? "text-slate-600" : "text-slate-300")}>
                        Credits Usage
                    </span>
                </div>
                <span className={cn("text-xs font-bold", isLight ? "text-slate-900" : "text-white")}>
                    {usagePercentage}%
                </span>
            </div>

            <div className={cn("h-2 w-full rounded-full overflow-hidden", isLight ? "bg-slate-100" : "bg-white/10")}>
                <div
                    className={cn("h-full rounded-full transition-all duration-500 ease-out", progressColor)}
                    style={{ width: `${Math.min(100, Math.max(0, usagePercentage))}%` }}
                />
            </div>

            <p className={cn("text-[10px] mt-2 font-medium", isLight ? "text-slate-500" : "text-slate-400")}>
                Monthly limit resets in {usage.reset_days} days
            </p>
        </div>
    );
};
