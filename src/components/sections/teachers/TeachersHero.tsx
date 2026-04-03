"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"

export function TeachersHero() {
    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 -mr-40 -mt-20 w-[600px] h-[600px] bg-violet-100/50 rounded-full blur-3xl opacity-60" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-fuchsia-100/50 rounded-full blur-3xl opacity-60" />

            <div className="container mx-auto px-4 relative z-10 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-4xl mx-auto"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 font-semibold text-sm mb-8 tracking-wide uppercase">
                        <Wand2 className="w-4 h-4" />
                        AI for Teachers
                    </span>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
                        The AI platform for{" "}
                        <span className="text-violet-600">Teachers</span>
                    </h1>

                    <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Safe, district-aligned AI for schools that provides support, sparks creativity, and improves student learning outcomes.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            size="lg"
                            className="h-14 px-8 text-lg rounded-xl bg-violet-600 hover:bg-violet-700 shadow-xl shadow-violet-200 text-white border-0 active:scale-95 transition-all"
                            asChild
                        >
                            <Link href="/signup" className="flex items-center gap-2">
                                Try it free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="lg"
                            className="h-14 px-8 text-lg rounded-xl border-2 border-slate-200 hover:bg-violet-50 hover:border-violet-200 active:scale-95 transition-all"
                            asChild
                        >
                            <Link href="/contact">Book a demo</Link>
                        </Button>
                    </div>
                </motion.div>

                {/* Platform Screenshot */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="relative max-w-6xl mx-auto mt-20"
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
                        <div className="overflow-hidden">
                            <Image
                                src="/teacherlanding_page.png"
                                alt="Teacher Platform Interface"
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
