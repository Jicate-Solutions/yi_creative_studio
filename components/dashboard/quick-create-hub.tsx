'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Calendar, Share2, Box, Video, Plus, Image as ImageIcon, ArrowRight, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/config/constants'
import { cn } from '@/lib/utils'
import { useState } from 'react'

const CREATIVE_TOOLS = [
    {
        id: 'event_poster',
        label: 'Event Poster',
        icon: Calendar,
        color: 'bg-blue-500',
        href: `${ROUTES.create}?format=event_poster`,
        image: '/assets/tools/poster-preview.jpg' // Placeholder
    },
    {
        id: 'social_post',
        label: 'Social Post',
        icon: Share2,
        color: 'bg-purple-500',
        href: `${ROUTES.create}?format=social_post`,
        image: '/assets/tools/social-preview.jpg'
    },
    {
        id: 'banner',
        label: 'Web Banner',
        icon: ImageIcon,
        color: 'bg-orange-500',
        href: `${ROUTES.create}?format=banner`,
        image: '/assets/tools/banner-preview.jpg'
    },
    {
        id: 'announcement',
        label: 'Story/Status',
        icon: Megaphone,
        color: 'bg-pink-500',
        href: `${ROUTES.create}?format=announcement`,
        image: '/assets/tools/story-preview.jpg'
    },
    {
        id: 'more',
        label: 'View All',
        icon: Plus,
        color: 'bg-white/10',
        href: ROUTES.templates,
        image: null
    }
]

export function QuickCreateHub() {
    const [hoveredId, setHoveredId] = useState<string | null>(null)

    return (
        <div className="h-full glass-card rounded-2xl p-4 relative overflow-hidden group flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-foreground font-semibold text-sm tracking-tight">Creation Hub</h3>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground" asChild>
                    <Link href={ROUTES.templates}>
                        Customize
                    </Link>
                </Button>
            </div>

            <div className="flex-1 grid grid-cols-2 gap-3 min-h-0">
                {CREATIVE_TOOLS.filter(t => t.id !== 'more').map((tool, index) => (
                    <Link
                        key={tool.id}
                        href={tool.href}
                        className="group/card relative h-full"
                        onMouseEnter={() => setHoveredId(tool.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 * index }}
                            className={cn(
                                "h-full rounded-2xl overflow-hidden relative flex flex-col justify-between p-4 transition-all duration-300",
                                "bg-white/60 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.06]",
                                "hover:bg-white dark:hover:bg-white/10 hover:scale-[1.02]",
                                "shadow-sm hover:shadow-xl hover:shadow-black/[0.08]",
                                hoveredId === tool.id ? "z-10 border-primary/20 dark:border-primary/30" : ""
                            )}
                        >
                            {/* Icon & Label Top */}
                            <div className="flex items-start justify-between">
                                <div className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300",
                                    "bg-gradient-to-br from-muted/80 to-muted/40 border border-black/[0.04] dark:border-white/[0.08]",
                                    "group-hover/card:from-primary/15 group-hover/card:to-primary/5 group-hover/card:border-primary/20",
                                )}>
                                    <tool.icon className={cn(
                                        "w-4 h-4 transition-colors duration-300",
                                        hoveredId === tool.id ? "text-primary" : "text-muted-foreground"
                                    )} />
                                </div>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover/card:opacity-100 transition-all duration-300 -translate-y-2 group-hover/card:translate-y-0",
                                    "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                                )}>
                                    <Plus className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Label Bottom */}
                            <div className="mt-4">
                                <h4 className={cn(
                                    "font-semibold text-sm tracking-tight transition-colors duration-300",
                                    hoveredId === tool.id ? "text-primary" : "text-foreground"
                                )}>
                                    {tool.label}
                                </h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                    Create new {tool.label.toLowerCase()}
                                </p>
                            </div>

                            {/* Background Gradient Effect */}
                            <div className={cn(
                                "absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none rounded-2xl",
                                hoveredId === tool.id ? "opacity-100" : ""
                            )}
                                style={{
                                    background: `radial-gradient(circle at top right, transparent 20%, ${tool.color.replace('bg-', 'var(--color-').replace('500', '500)12')} 100%)`
                                }}
                            />
                        </motion.div>
                    </Link>
                ))}
                {/* View All Card */}
                <Link href={ROUTES.templates} className="group/all relative h-full col-span-2 md:col-span-2">
                    <div className="h-full min-h-[56px] rounded-2xl border border-dashed border-black/[0.08] dark:border-white/[0.08] bg-muted/30 hover:bg-muted/50 hover:border-primary/30 transition-all duration-300 flex items-center justify-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground group-hover/all:text-foreground transition-colors">View All Templates</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover/all:translate-x-1 group-hover/all:text-primary transition-all duration-300" />
                    </div>
                </Link>
            </div>
        </div>
    )
}
