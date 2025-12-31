'use client'

import { motion } from 'framer-motion'
import { Zap, TrendingUp, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StudioVitalsProps {
    credits: {
        balance: number
        used: number
    }
    streak?: {
        days: number
        active: boolean
    }
}

export function StudioVitals({ credits, streak = { days: 7, active: true } }: StudioVitalsProps) {
    // Calculate percentage for contrast ring (max 10000 base for visual)
    const percentage = Math.min((credits.balance / 10000) * 100, 100)
    const circumference = 2 * Math.PI * 32 // radius 32
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="h-full bg-card border border-border rounded-[2rem] p-6 relative overflow-hidden group hover:bg-accent/50 transition-colors shadow-sm"
        >
            {/* Header */}
            <h3 className="text-foreground font-medium mb-6">Studio Vitals</h3>

            <div className="flex flex-col items-center gap-8">
                {/* 1. Credit Ring */}
                <div className="relative w-40 h-40 flex items-center justify-center">
                    {/* Glow behind */}
                    <div className="absolute inset-0 bg-primary/10 blur-2xl rounded-full" />

                    <svg className="w-full h-full transform -rotate-90">
                        {/* Track */}
                        <circle
                            cx="80"
                            cy="80"
                            r="32"
                            className="stroke-muted"
                            strokeWidth="8"
                            fill="transparent"
                        />
                        {/* Progress */}
                        <circle
                            cx="80"
                            cy="80"
                            r="32"
                            className="stroke-primary transition-all duration-1000 ease-spring"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Inner Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-2xl font-bold tracking-tight text-foreground mb-0.5">
                            {credits.balance.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Credits</span>
                    </div>
                </div>

                {/* 2. Streak Dots */}
                <div className="w-full space-y-3">
                    <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-foreground">{streak.days}-Day Streak</span>
                        {streak.active && (
                            <span className="text-primary flex items-center gap-1">
                                <Zap className="w-3 h-3 fill-current" /> Active
                            </span>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-2 w-full rounded-full transition-colors duration-500",
                                    i < 4 ? "bg-primary shadow-[0_0_8px_rgba(0,91,150,0.3)]" : "bg-muted"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
