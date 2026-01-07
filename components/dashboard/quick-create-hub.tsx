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
        <div className="h-full glass-card rounded-3xl p-6 relative overflow-hidden group flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-semibold">Creation Hub</h3>
                <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" asChild>
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
                        className="group relative h-full"
                        onMouseEnter={() => setHoveredId(tool.id)}
                        onMouseLeave={() => setHoveredId(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: 0.1 * index }}
                            className={cn(
                                "h-full rounded-2xl overflow-hidden relative flex flex-col justify-between p-4 transition-all duration-300",
                                "bg-background/50 border border-border hover:bg-background hover:scale-[1.02] hover:border-primary/30",
                                "shadow-sm hover:shadow-lg",
                                hoveredId === tool.id ? "z-10 ring-2 ring-primary/20" : ""
                            )}
                        >
                            {/* Icon & Label Top */}
                            <div className="flex items-start justify-between">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                    "bg-muted border border-border group-hover:bg-primary/10 group-hover:border-primary/20",
                                )}>
                                    <tool.icon className={cn(
                                        "w-5 h-5 transition-colors",
                                        hoveredId === tool.id ? "text-primary" : "text-muted-foreground"
                                    )} />
                                </div>
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0 duration-300",
                                    "bg-primary text-primary-foreground"
                                )}>
                                    <Plus className="w-4 h-4" />
                                </div>
                            </div>

                            {/* Label Bottom */}
                            <div className="mt-4">
                                <h4 className={cn(
                                    "font-medium text-sm transition-colors",
                                    hoveredId === tool.id ? "text-primary" : "text-foreground"
                                )}>
                                    {tool.label}
                                </h4>
                                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                                    Create new {tool.label.toLowerCase()}
                                </p>
                            </div>

                            {/* Background Gradient Effect */}
                            <div className={cn(
                                "absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none",
                                hoveredId === tool.id ? "opacity-100" : ""
                            )}
                                style={{
                                    background: `radial-gradient(circle at top right, transparent 20%, ${tool.color.replace('bg-', 'var(--color-').replace('500', '500)15')} 100%)`
                                }}
                            />
                        </motion.div>
                    </Link>
                ))}
                {/* View All Card */}
                <Link href={ROUTES.templates} className="group relative h-full col-span-2 md:col-span-2">
                    <div className="h-full rounded-2xl border border-dashed border-border bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-center gap-2">
                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">View All Templates</span>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </div>
                </Link>
            </div>
        </div>
    )
}
