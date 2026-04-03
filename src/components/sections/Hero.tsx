"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, PlayCircle } from "lucide-react"
import Image from "next/image"

const ROTATING_TEXTS = ["Schools", "Teachers", "Students"]

export function Hero() {
    const [index, setIndex] = useState(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % ROTATING_TEXTS.length)
        }, 3000)
        return () => clearInterval(interval)
    }, [])

    return (
        <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-violet-50 via-white to-white">
            {/* Decorative blobs */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-3xl" />

            <div className="container mx-auto px-4 text-center relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="inline-block py-1 px-3 rounded-full bg-violet-100 text-violet-700 text-xs font-bold tracking-wide uppercase mb-6">
                        The #1 AI Platform
                    </span>

                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                        The AI platform for <br className="md:hidden" />
                        <span className="relative inline-block min-w-[200px] text-violet-600">
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={ROTATING_TEXTS[index]}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    transition={{ duration: 0.4, ease: "easeInOut" }}
                                    className="absolute left-0 right-0"
                                >
                                    {ROTATING_TEXTS[index]}
                                </motion.span>
                            </AnimatePresence>
                            {/* Invisible placeholder to keep width */}
                            <span className="invisible">{ROTATING_TEXTS[0]}</span>
                        </span>
                    </h1>

                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-600 mb-10 leading-relaxed">
                        Safe, district-aligned AI for schools that provides support, sparks creativity, and improves student learning outcomes.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" className="h-14 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl hover:bg-violet-700 active:scale-95 transition-all" asChild>
                            <Link href="/signup" className="flex items-center gap-2">
                                Try it free
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="lg" className="h-14 px-8 text-lg rounded-xl border-2 hover:bg-violet-50 hover:border-violet-200 active:scale-95 transition-all" asChild>
                            <Link href="/quote-request" className="flex items-center gap-2">
                                <PlayCircle className="w-5 h-5" />
                                Book a demo
                            </Link>
                        </Button>
                    </div>
                </motion.div>

                {/* Hero Image / Video Placeholder */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="mt-16 md:mt-24 relative mx-auto max-w-5xl"
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
                                src="/teacherlanding_page.png"
                                alt="NibbleLearn Platform Interface"
                                width={1200}
                                height={750}
                                className="w-full h-auto object-cover"
                            />
                        </div>
                    </div>

                    {/* Background Glow */}
                    <div className="absolute -inset-4 bg-gradient-to-r from-violet-500 via-pink-500 to-blue-500 opacity-20 blur-2xl -z-10 rounded-3xl" />
                </motion.div>
            </div>
        </section>
    )
}
