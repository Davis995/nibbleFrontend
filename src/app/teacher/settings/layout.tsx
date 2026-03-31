"use client"

import React from "react"
import { SettingsLayout } from "@/components/settings/SettingsLayout"
import { SettingsSidebar } from "@/components/settings/SettingsSidebar"
import { User, CreditCard, Bell, HelpCircle, Shield } from "lucide-react"

const teacherItems = [
    { label: "Account & Profile", href: "/teacher/settings/account", icon: User },
    { label: "Security", href: "/teacher/settings/security", icon: Shield },
    { label: "Billing & Plans", href: "/teacher/settings/billing", icon: CreditCard },
    { label: "Notifications", href: "/teacher/settings/notifications", icon: Bell },
    { label: "Help Center", href: "/teacher/settings/help", icon: HelpCircle },
]

export default function TeacherSettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <SettingsLayout
            sidebar={<SettingsSidebar items={teacherItems} variant="slate" />}
            variant="slate"
        >
            {children}
        </SettingsLayout>
    )
}
