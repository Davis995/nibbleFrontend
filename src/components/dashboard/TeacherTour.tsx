"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { driver, DriveStep } from "driver.js"
import "driver.js/dist/driver.css"

export function TeacherTour() {
    const pathname = usePathname()
    const router = useRouter()
    const [driverObj, setDriverObj] = useState<any>(null)
    const currentStepIndex = useRef<number>(0)

    useEffect(() => {
        // Ensure this only runs on the client and hasn't been seen before
        const hasSeenTour = localStorage.getItem("hasSeenTour")
        if (!hasSeenTour) {
            // Small delay to ensure the DOM is fully rendered before starting the tour
            const timer = setTimeout(() => {
                const steps: DriveStep[] = [
                    // Dashboard (index 0)
                    { element: '#tour-sidebar-dashboard', popover: { title: 'Dashboard', description: 'This is your main dashboard where you can see an overview of your activity.', side: "right", align: 'start' }},
                    // Dashboard -> Tools link (index 1)
                    { element: '#tour-sidebar-tools', popover: { title: 'Teacher Tools', description: 'Click this link or hit Next to explore AI tools!', side: "right", align: 'start' }},
                    // Tools page elements (index 2)
                    { element: '#tour-tools-search', popover: { title: 'Search Tools', description: 'Use search to quickly find the tool you need.', side: "bottom", align: 'start' }},
                    // Tools page elements (index 3)
                    { element: '#tour-tools-categories', popover: { title: 'Categories', description: 'Filter tools by category using these tabs.', side: "bottom", align: 'start' }},
                    // Tools -> History link (index 4)
                    { element: '#tour-sidebar-history', popover: { title: 'Output History', description: 'Click here or hit Next to view your previous content.', side: "right", align: 'start' }},
                    // History page element (index 5)
                    { element: '#tour-history-table', popover: { title: 'History', description: 'All your past generations are stored securely here.', side: "top", align: 'start' }},
                    // History -> Favorites link (index 6)
                    { element: '#tour-sidebar-favorites', popover: { title: 'Favorites', description: 'Click here or hit Next to jump to your starred tools.', side: "right", align: 'start' }},
                    // Favorites page element (index 7)
                    { element: '#tour-favorites-grid', popover: { title: 'Favorite Tools', description: 'Your most used tools in one convenient place.', side: "bottom", align: 'start' }},
                    // Header additions (index 8)
                    { element: '#tour-header-upgrade', popover: { title: 'Upgrade', description: 'Ready for more? Upgrade your plan here for additional features.', side: "bottom", align: 'start' }},
                    // Header additions (index 9)
                    { element: '#tour-header-notifications', popover: { title: 'Notifications', description: 'Check your alerts and updates right here.', side: "bottom", align: 'start' }},
                    // Sidebar bottom (index 10)
                    { element: '#tour-sidebar-theme', popover: { title: 'Theme Toggle', description: 'Switch between light and dark mode.', side: "right", align: 'start' }},
                    // Settings (index 11)
                    { element: '#tour-sidebar-settings', popover: { title: 'Settings', description: 'Manage your profile and account settings here.', side: "right", align: 'start' }},
                ]

                const drv = driver({
                    showProgress: true,
                    animate: true,
                    allowClose: false,
                    steps,
                    onDestroyStarted: () => {
                        localStorage.setItem("hasSeenTour", "true")
                        drv.destroy()
                    },
                    onHighlightStarted: (element, step, { config, state }) => {
                        currentStepIndex.current = state.activeIndex || 0;
                    },
                    onNextClick: (element, step, { config, state }) => {
                        const idx = state.activeIndex || 0
                        
                        const handleNavStep = (targetPath: string) => {
                            router.push(targetPath)
                            // We don't advance the tour immediately.
                            // The useEffect listening to `pathname` will handle advancing the tour 
                            // once the route changes.
                        }

                        if (idx === 1) {
                            handleNavStep('/teacher/tools');
                            return;
                        } else if (idx === 4) {
                            handleNavStep('/teacher/history');
                            return;
                        } else if (idx === 6) {
                            handleNavStep('/teacher/favorites');
                            return;
                        }

                        // Last step check
                        if (config.steps && idx === config.steps.length - 1) {
                            localStorage.setItem("hasSeenTour", "true")
                            drv.destroy()
                            return;
                        }

                        drv.moveNext()
                    }
                })
                
                setDriverObj(drv)
                drv.drive()
            }, 500)

            return () => clearTimeout(timer)
        }
    }, [router])

    useEffect(() => {
        if (!driverObj) return;

        // Auto-advance the tour if the user manually navigated to the exact matched path
        // that the tour was expecting them to navigate to. Wait slightly for DOM to settle.
        const step = currentStepIndex.current;
        if (pathname === '/teacher/tools' && step === 1) {
            setTimeout(() => driverObj.moveNext(), 400);
        } else if (pathname === '/teacher/history' && step === 4) {
            setTimeout(() => driverObj.moveNext(), 400);
        } else if (pathname === '/teacher/favorites' && step === 6) {
            setTimeout(() => driverObj.moveNext(), 400);
        }
    }, [pathname, driverObj])

    return null
}
