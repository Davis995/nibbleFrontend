"use client"

import React, { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuth } from '@/components/providers/AuthContext';
import { useTheme } from '@/components/providers/ThemeContext';

export default function SchoolTour() {
    const { user } = useAuth();
    const { theme } = useTheme();

    useEffect(() => {
        // Only run tour if orientation is true (completed) but they haven't seen tour yet
        if (!user || user.org_orientation === false) return;
        
        const hasSeenTour = localStorage.getItem(`school-tour-completed-${user.id}`);
        if (hasSeenTour) return;

        // Add a slight delay to allow UI to render fully
        const timer = setTimeout(() => {
            try {
                const driverObj = driver({
                    showProgress: true,
                    animate: true,
                    allowClose: false,
                    steps: [
                        {
                            popover: {
                                title: 'Welcome to your Workspace! 🎉',
                                description: 'This is the control center for your school. Let\'s take a quick tour of your new admin dashboard.',
                            }
                        },
                        {
                            element: '#dashboard-header',
                            popover: {
                                title: 'School Overview',
                                description: 'Here you can see the name of your organization, who is logged in, and your current billing plan.',
                                side: "bottom", align: 'start'
                            }
                        },
                        {
                            element: '#metrics-grid',
                            popover: {
                                title: 'Key Metrics at a Glance',
                                description: 'Keep track of your total students, active staff, and AI usage tokens in real-time.',
                                side: "bottom", align: 'start'
                            }
                        },
                        {
                            element: '#usage-chart',
                            popover: {
                                title: 'AI Usage & Billing',
                                description: 'Monitor how your school consumes AI resources over the year. Stay informed before you hit your plan limit.',
                                side: "top", align: 'start'
                            }
                        },
                        {
                            element: '#activity-feed',
                            popover: {
                                title: 'Live Activity Feed',
                                description: 'See exactly which AI tools your teachers and students are using right now. Great for spotting trends.',
                                side: "left", align: 'start'
                            }
                        }
                    ],
                    onDestroyStarted: () => {
                        if (!driverObj.hasNextStep() || confirm("Are you sure you want to skip the rest of the tour?")) {
                            driverObj.destroy();
                            localStorage.setItem(`school-tour-completed-${user.id}`, 'true');
                        }
                    },
                });

                driverObj.drive();
            } catch (err) {
                console.error("Failed to initialize tour:", err);
            }
        }, 1500);

        return () => clearTimeout(timer);
    }, [user, theme]);

    return null;
}
