"use client"

import React from "react"
import { motion } from "framer-motion"
import { Star, Sparkles } from "lucide-react"
import Image from "next/image"

const features = [
    "Personalize learning with purpose",
    "Strengthen student outcomes",
    "Free up time for meaningful work"
]

export function AmplifySection() {
    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="flex items-center justify-center gap-2 mb-4"
                    >
                        <div className="bg-violet-100 p-2 rounded-full">
                            <Sparkles className="w-5 h-5 text-violet-600" />
                        </div>
                        <span className="font-bold text-violet-600 tracking-wide uppercase text-sm">
                            BUILT for learning
                        </span>
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-5xl font-bold text-slate-900 mb-8"
                    >
                        Amplify educator impact, <br className="hidden md:block" />
                        unlock student potential
                    </motion.h2>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-wrap justify-center gap-6 md:gap-12"
                    >
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                                <span className="font-medium text-slate-700 text-lg">{feature}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Platform Preview */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="relative max-w-6xl mx-auto"
                >
                    {/* Decorative Stars Float */}
                    <div className="absolute -top-12 -left-12 text-yellow-300 animate-pulse">
                        <Star className="w-12 h-12 fill-current" />
                    </div>
                    <div className="absolute -bottom-12 -right-12 text-violet-300 animate-pulse delay-700">
                        <Star className="w-16 h-16 fill-current" />
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-2 md:p-4 shadow-2xl ring-1 ring-slate-900/5">
                        <div className="bg-slate-800 rounded-xl overflow-hidden relative">
                            <Image
                                src="/teacherlanding_page.png"
                                alt="Platform Interface"
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
