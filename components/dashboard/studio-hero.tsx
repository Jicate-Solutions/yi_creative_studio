'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    Sparkles, Calendar, Share2, Award, ArrowRight, Zap,
    Image, FileText, Presentation, Video, Clock,
    Command
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/lib/config/constants'
import { cn } from '@/lib/utils'
import { useCreativeStore } from '@/stores/creative-store'

// Sample preview images (would come from actual format previews in production)
const FORMAT_PREVIEWS: Record<string, string> = {
    'event_poster': '/previews/event-poster.jpg',
    'social_post': '/previews/social-post.jpg',
    'certificate': '/previews/certificate.jpg',
}

interface QuickAction {
    id: string
    title: string
    icon: typeof Calendar
    desc: string
    color: string
    iconColor: string
    href: string
    delay: number
    formatId?: string
    shortcut?: string
}

export function StudioHero() {
    const router = useRouter()
    const { recentFormats } = useCreativeStore()
    const [hoveredAction, setHoveredAction] = useState<string | null>(null)
    const [showShortcuts, setShowShortcuts] = useState(false)

    const quickActions: QuickAction[] = [
        {
            id: 'event_poster',
            title: 'Event Poster',
            icon: Calendar,
            desc: 'Promote your next event',
            color: 'from-blue-500/20 to-cyan-400/20',
            iconColor: 'text-blue-500',
            href: `${ROUTES.create}?format=event_poster`,
            delay: 0.1,
            formatId: 'event_poster',
            shortcut: '1'
        },
        {
            id: 'social_post',
            title: 'Social Post',
            icon: Share2,
            desc: 'Engage your audience',
            color: 'from-purple-500/20 to-pink-400/20',
            iconColor: 'text-purple-500',
            href: `${ROUTES.create}?format=social_post`,
            delay: 0.2,
            formatId: 'social_post',
            shortcut: '2'
        },
        {
            id: 'certificate',
            title: 'Certificate',
            icon: Award,
            desc: 'Recognize achievements',
            color: 'from-amber-500/20 to-orange-400/20',
            iconColor: 'text-amber-500',
            href: `${ROUTES.create}?format=certificate`,
            delay: 0.3,
            formatId: 'certificate',
            shortcut: '3'
        }
    ]

    // Map format IDs to icons for recent formats
    const FORMAT_ICONS: Record<string, typeof Calendar> = {
        event_poster: Calendar,
        social_post: Share2,
        certificate: Award,
        instagram: Image,
        flyer: FileText,
        presentation: Presentation,
        youtube_thumbnail: Video,
    }

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't trigger if user is typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return
            }

            // Show shortcuts hint when holding Command/Ctrl
            if (e.key === 'Meta' || e.key === 'Control') {
                setShowShortcuts(true)
            }

            // Quick action shortcuts (1, 2, 3)
            if (['1', '2', '3'].includes(e.key)) {
                const action = quickActions[parseInt(e.key) - 1]
                if (action) {
                    router.push(action.href)
                }
            }

            // C for Create
            if (e.key === 'c' && !e.metaKey && !e.ctrlKey) {
                router.push(ROUTES.create)
            }

            // G for Gallery
            if (e.key === 'g' && !e.metaKey && !e.ctrlKey) {
                router.push(ROUTES.gallery)
            }
        }

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Meta' || e.key === 'Control') {
                setShowShortcuts(false)
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        window.addEventListener('keyup', handleKeyUp)

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            window.removeEventListener('keyup', handleKeyUp)
        }
    }, [router, quickActions])

    return (
        <div className="relative w-full overflow-hidden rounded-[2.5rem] glass-panel shadow-2xl transition-all duration-500">
            {/* Dynamic Kinetic Background */}
            <div className="absolute inset-0 opacity-40 dark:opacity-60 overflow-hidden pointer-events-none">
                <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] bg-secondary/15 rounded-full blur-[100px] animate-pulse [animation-delay:1s]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,var(--primary-foreground)_0%,transparent_70%)] opacity-5" />
            </div>

            <div className="relative z-10 p-10 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-16">

                {/* Left: Call to Action */}
                <div className="flex-1 space-y-10 max-w-2xl text-center lg:text-left">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary backdrop-blur-md">
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>Creative Engine Online</span>
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-foreground leading-[1.1] tracking-tight">
                            Design your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yi-blue to-secondary animate-gradient-x">masterpiece.</span>
                        </h1>

                        <p className="text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 font-medium">
                            The all-in-one studio for high-impact brand assets, posters, and social campaigns powered by next-gen AI.
                        </p>
                    </motion.div>

                    {/* Primary Action */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="flex flex-wrap justify-center lg:justify-start gap-5"
                    >
                        <Button
                            asChild
                            size="lg"
                            className="h-16 px-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-all duration-300 active:scale-95 group"
                        >
                            <Link href={ROUTES.create}>
                                <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                                Start Creating
                            </Link>
                        </Button>

                        <Button
                            asChild
                            variant="outline"
                            size="lg"
                            className="h-16 px-10 rounded-full border-2 border-slate-300 dark:border-white/20 bg-background/50 backdrop-blur-xl text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-muted hover:border-slate-400 dark:hover:border-white/30 hover:text-slate-900 dark:hover:text-white font-bold text-lg transition-all duration-300"
                        >
                            <Link href={ROUTES.gallery}>
                                Open Studio Vault
                            </Link>
                        </Button>
                    </motion.div>
                </div>

                {/* Right: Quick Actions Grid */}
                <div className="flex-1 w-full max-w-md space-y-5">
                    {/* Quick Actions */}
                    <div className="grid gap-4">
                        {quickActions.map((action) => (
                            <motion.div
                                key={action.title}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 + action.delay }}
                                onMouseEnter={() => setHoveredAction(action.id)}
                                onMouseLeave={() => setHoveredAction(null)}
                                className="relative"
                            >
                                <Link
                                    href={action.href}
                                    className="group flex items-center gap-5 p-5 rounded-[2rem] glass-card hover:bg-white/50 dark:hover:bg-white/10 transition-all duration-300 hover:shadow-2xl dark:hover:shadow-primary/5"
                                >
                                    <div className={cn(
                                        "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-br group-hover:scale-110 transition-transform duration-500",
                                        action.color,
                                        action.iconColor
                                    )}>
                                        <action.icon className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-extrabold text-foreground group-hover:text-primary transition-colors">
                                                {action.title}
                                            </h3>
                                            {/* Keyboard shortcut badge */}
                                            <AnimatePresence>
                                                {(showShortcuts || hoveredAction === action.id) && action.shortcut && (
                                                    <motion.span
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="inline-flex items-center justify-center w-5 h-5 rounded bg-muted text-[10px] font-mono font-bold text-muted-foreground border border-border"
                                                    >
                                                        {action.shortcut}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <p className="text-sm text-muted-foreground font-medium truncate">
                                            {action.desc}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-300">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* Recent Formats Section */}
                    {recentFormats && recentFormats.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            className="pt-4 border-t border-border/30"
                        >
                            <div className="flex items-center gap-2 mb-3 text-xs font-medium text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Recent Formats</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {recentFormats.slice(0, 4).map((formatId) => {
                                    const FormatIcon = FORMAT_ICONS[formatId] || Image
                                    const formatName = formatId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                    return (
                                        <Link
                                            key={formatId}
                                            href={`${ROUTES.create}?format=${formatId}`}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50 hover:bg-muted text-sm font-medium text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border/50"
                                        >
                                            <FormatIcon className="w-3.5 h-3.5" />
                                            <span>{formatName}</span>
                                        </Link>
                                    )
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Keyboard Shortcuts Hint */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.8 }}
                        className="flex items-center justify-center gap-4 pt-2 text-[10px] text-muted-foreground/60"
                    >
                        <span className="inline-flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-muted/50 font-mono">C</kbd>
                            <span>Create</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-muted/50 font-mono">G</kbd>
                            <span>Gallery</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <kbd className="px-1.5 py-0.5 rounded bg-muted/50 font-mono">1-3</kbd>
                            <span>Quick Actions</span>
                        </span>
                    </motion.div>
                </div>
            </div>
        </div >
    )
}
