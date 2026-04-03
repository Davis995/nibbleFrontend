"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, GraduationCap } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function StudentsHero() {
    return (
        <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
            {/* Background Decor - Amber/Yellow Theme */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-amber-200/30 rounded-full blur-[100px] opacity-60" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-yellow-200/20 rounded-full blur-[80px] opacity-60" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-100 text-amber-700 font-semibold text-sm mb-8 tracking-wide uppercase border border-amber-200">
                            <GraduationCap className="w-4 h-4" />
                            AI for Students
                        </span>

                        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tight">
                            The AI platform for <br />
                            <span className="text-amber-500">Students</span>
                        </h1>

                        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            Safe, district-aligned AI for schools that provides support, sparks creativity, and improves student learning outcomes.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                            <Button size="lg" className="h-14 px-8 text-lg rounded-xl bg-amber-500 hover:bg-amber-600 shadow-xl shadow-amber-200 text-white border-0 active:scale-95 transition-all" asChild>
                                <Link href="/signup" className="flex items-center gap-2">
                                    Try it free
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-xl border-2 border-slate-200 hover:bg-amber-50 hover:border-amber-200 active:scale-95 transition-all" asChild>
                                <Link href="/contact" className="flex items-center gap-2">
                                    Book a demo
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>

                {/* Hero Interactive Element - "Student Hub Preview" */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="relative max-w-5xl mx-auto"
                >
                    <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-900 bg-slate-900">
                        {/* Browser Title Bar */}
                        <div className="bg-slate-800 h-12 flex items-center px-4 gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400" />
                            <div className="w-3 h-3 rounded-full bg-yellow-400" />
                            <div className="w-3 h-3 rounded-full bg-green-400" />
                            <div className="ml-4 bg-slate-700 rounded-full h-6 w-1/2" />
                        </div>

                        {/* Actual Screenshot */}
                        <div className="bg-slate-800 overflow-hidden">
                            <Image
                                src="/students.png"
                                alt="Student Platform Interface"
                                width={1200}
                                height={750}
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}
