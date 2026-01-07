'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import NextImage from 'next/image'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/config/constants'

import { useAuthStore } from '@/stores/auth-store'

const SLIDES = [
    {
        id: 1,
        image: '/assets/dashboard/hero-bg.png',
        title: 'Yi Creative Studio',
        cta: 'Ignite Creativity',
        link: ROUTES.create,
        color: 'from-orange-400 to-pink-500'
    },
    {
        id: 2,
        image: '/assets/dashboard/hero-bg-2.png',
        title: 'Digital Universe',
        cta: 'Generate Art',
        link: ROUTES.create,
        color: 'from-violet-500 to-purple-600'
    },
    {
        id: 3,
        image: '/assets/dashboard/hero-bg-3.png',
        title: 'The Impossible',
        cta: 'Start Dreaming',
        link: ROUTES.create,
        color: 'from-cyan-400 to-blue-600'
    }
]

export function StudioHero() {
    const [current, setCurrent] = useState(0)
    const { profile } = useAuthStore()
    const [greeting, setGreeting] = useState('Welcome Back')

    useEffect(() => {
        // Set dynamic greeting
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Good Morning')
        else if (hour < 18) setGreeting('Good Afternoon')
        else setGreeting('Good Evening')

        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % SLIDES.length)
        }, 8000) // Increased duration slightly since we have the zoom effect
        return () => clearInterval(timer)
    }, [])

    const firstName = profile?.full_name?.split(' ')[0] || 'Creator'

    // Dynamic welcome message
    const welcomeMessage = `${greeting}, ${firstName}`

    return (
        <div className="relative w-full h-[320px] rounded-[2.5rem] overflow-hidden group">
            <AnimatePresence mode="popLayout">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0"
                >
                    {/* Background Image */}
                    {/* Background Image with Ken Burns Effect */}
                    <div className="absolute inset-0 z-0 overflow-hidden">
                        <motion.div
                            initial={{ scale: 1 }}
                            animate={{ scale: 1.15 }}
                            transition={{ duration: 7, ease: "linear", repeat: 0 }}
                            className="w-full h-full relative"
                        >
                            <NextImage
                                src={SLIDES[current].image}
                                alt="Hero Background"
                                fill
                                className="object-cover"
                                priority
                            />
                        </motion.div>
                        {/* Overlays */}
                        <motion.div
                            animate={{ opacity: [0.4, 0.6, 0.4] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    </div>

                    {/* Content Layer */}
                    <div className="relative z-10 w-full h-full flex flex-col items-start justify-center text-left px-16">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="space-y-6"
                        >
                            {/* Text */}
                            <div className="space-y-2">
                                <p className="text-white/70 text-lg font-medium tracking-wide uppercase">{welcomeMessage}</p>
                                <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-2xl">
                                    {SLIDES[current].title}
                                </h1>
                            </div>

                            {/* Button */}
                            <div className="pt-4">
                                <Button
                                    asChild
                                    className={`relative h-14 pl-8 pr-8 rounded-full bg-gradient-to-r ${SLIDES[current].color} hover:brightness-110 text-white font-bold text-lg shadow-2xl transition-all duration-300 scale-100 hover:scale-105 border-none`}
                                >
                                    <Link href={SLIDES[current].link}>
                                        <Sparkles className="w-5 h-5 mr-2 fill-white/20" />
                                        {SLIDES[current].cta}
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Slide Indicators */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                {SLIDES.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${current === idx ? 'bg-white w-6' : 'bg-white/30 hover:bg-white/50'}`}
                    />
                ))}
            </div>
        </div>
    )
}
