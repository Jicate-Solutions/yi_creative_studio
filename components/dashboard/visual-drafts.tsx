'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
    ArrowRight, Image as ImageIcon, Sparkles, Edit3, RefreshCw,
    Download, Eye, Trash2, MoreHorizontal, Copy, Share2, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ROUTES } from '@/lib/config/constants'
import { cn } from '@/lib/utils'

interface Creative {
    id: string
    title: string | null
    vertical: string | null
    creative_type: string | null
    created_at: string
    image_url: string | null
    thumbnail_url: string | null
}

interface VisualDraftsProps {
    creatives: Creative[]
    onEdit?: (creative: Creative) => void
    onRegenerate?: (creative: Creative) => void
    onDownload?: (creative: Creative) => void
    onDelete?: (creative: Creative) => void
    onDuplicate?: (creative: Creative) => void
}

export function VisualDrafts({
    creatives,
    onEdit,
    onRegenerate,
    onDownload,
    onDelete,
    onDuplicate
}: VisualDraftsProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null)

    if (creatives.length === 0) return null

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold tracking-tight text-foreground">Recent Projects</h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-wider">
                        {creatives.length} Drafts
                    </span>
                </div>
                <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <Link href={ROUTES.gallery} className="flex items-center gap-2">
                        Open Studio Gallery <ArrowRight className="w-4 h-4" />
                    </Link>
                </Button>
            </div>

            <div className="columns-1 sm:columns-2 lg:columns-4 gap-8 space-y-8">
                {creatives.map((creative, i) => (
                    <div key={creative.id} className="break-inside-avoid mb-6">
                        <DraftCard
                            creative={creative}
                            index={i}
                            isHovered={hoveredId === creative.id}
                            onHover={() => setHoveredId(creative.id)}
                            onLeave={() => setHoveredId(null)}
                            onEdit={onEdit}
                            onRegenerate={onRegenerate}
                            onDownload={onDownload}
                            onDelete={onDelete}
                            onDuplicate={onDuplicate}
                        />
                    </div>
                ))}
            </div>
        </div>
    )
}

// Individual Draft Card with Quick Actions
interface DraftCardProps {
    creative: Creative
    index: number
    isHovered: boolean
    onHover: () => void
    onLeave: () => void
    onEdit?: (creative: Creative) => void
    onRegenerate?: (creative: Creative) => void
    onDownload?: (creative: Creative) => void
    onDelete?: (creative: Creative) => void
    onDuplicate?: (creative: Creative) => void
}

function DraftCard({
    creative,
    index,
    isHovered,
    onHover,
    onLeave,
    onEdit,
    onRegenerate,
    onDownload,
    onDelete,
    onDuplicate
}: DraftCardProps) {
    const [showActions, setShowActions] = useState(false)

    const handleQuickAction = (e: React.MouseEvent, action: ((c: Creative) => void) | undefined) => {
        e.preventDefault()
        e.stopPropagation()
        if (action) action(creative)
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            className="group relative"
            onMouseEnter={() => {
                onHover()
                setShowActions(true)
            }}
            onMouseLeave={() => {
                onLeave()
                setShowActions(false)
            }}
        >
            <Link
                href={`${ROUTES.gallery}?id=${creative.id}`}
                className={cn(
                    "block relative w-full rounded-3xl overflow-hidden transition-all duration-500",
                    "glass-card hover:bg-white/40 dark:hover:bg-white/10 hover:shadow-xl hover:-translate-y-1",
                    "group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] dark:group-hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)]"
                )}
            >
                {/* Holographic Sheen Layer */}
                <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%)] bg-[length:250%_100%] animate-[shimmer_3s_infinite_linear]" />

                {/* Image / Thumbnail */}
                {creative.image_url || creative.thumbnail_url ? (
                    <div className="relative">
                        <img
                            src={creative.thumbnail_url || creative.image_url || ''}
                            alt={creative.title || 'Creative Draft'}
                            className="w-full h-auto object-cover group-hover:scale-110 transition-transform duration-700 grayscale-[20%] group-hover:grayscale-0"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-transpose to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
                    </div>
                ) : (
                    <div className="w-full aspect-[4/5] flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-primary/5 to-transparent">
                        <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500">
                            <ImageIcon className="w-8 h-8 text-primary/40" />
                        </div>
                    </div>
                )}

                {/* Status & Category Badge */}
                <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                    <div className="px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border/50 text-[10px] font-black uppercase tracking-widest text-foreground shadow-sm">
                        {creative.vertical || 'Custom'}
                    </div>
                    {creative.creative_type && (
                        <div className="px-2.5 py-1 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                            {creative.creative_type.replace('_', ' ')}
                        </div>
                    )}
                </div>

                {/* Quick Actions Bar - Shows on hover */}
                <AnimatePresence>
                    {showActions && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-4 right-4 z-30 flex items-center gap-1.5"
                            onClick={(e) => e.preventDefault()}
                        >
                            {/* Primary Quick Actions */}
                            <div className="flex items-center gap-1 p-1 rounded-xl bg-background/90 backdrop-blur-md border border-border/50 shadow-lg">
                                {/* View */}
                                <button
                                    className="p-2 rounded-lg hover:bg-muted transition-colors group/btn"
                                    title="View"
                                >
                                    <Eye className="w-4 h-4 text-muted-foreground group-hover/btn:text-foreground transition-colors" />
                                </button>

                                {/* Edit */}
                                {onEdit && (
                                    <button
                                        onClick={(e) => handleQuickAction(e, onEdit)}
                                        className="p-2 rounded-lg hover:bg-primary/10 transition-colors group/btn"
                                        title="Edit"
                                    >
                                        <Edit3 className="w-4 h-4 text-muted-foreground group-hover/btn:text-primary transition-colors" />
                                    </button>
                                )}

                                {/* Regenerate */}
                                {onRegenerate && (
                                    <button
                                        onClick={(e) => handleQuickAction(e, onRegenerate)}
                                        className="p-2 rounded-lg hover:bg-green-500/10 transition-colors group/btn"
                                        title="Regenerate"
                                    >
                                        <RefreshCw className="w-4 h-4 text-muted-foreground group-hover/btn:text-green-500 transition-colors" />
                                    </button>
                                )}

                                {/* Download */}
                                {onDownload && (
                                    <button
                                        onClick={(e) => handleQuickAction(e, onDownload)}
                                        className="p-2 rounded-lg hover:bg-blue-500/10 transition-colors group/btn"
                                        title="Download"
                                    >
                                        <Download className="w-4 h-4 text-muted-foreground group-hover/btn:text-blue-500 transition-colors" />
                                    </button>
                                )}
                            </div>

                            {/* More Actions Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        onClick={(e) => e.preventDefault()}
                                        className="p-2 rounded-xl bg-background/90 backdrop-blur-md border border-border/50 shadow-lg hover:bg-muted transition-colors"
                                    >
                                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem asChild>
                                        <Link href={`${ROUTES.gallery}?id=${creative.id}`} className="flex items-center gap-2">
                                            <ExternalLink className="w-4 h-4" />
                                            Open in Gallery
                                        </Link>
                                    </DropdownMenuItem>

                                    {onDuplicate && (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDuplicate(creative)
                                            }}
                                            className="flex items-center gap-2"
                                        >
                                            <Copy className="w-4 h-4" />
                                            Duplicate
                                        </DropdownMenuItem>
                                    )}

                                    <DropdownMenuItem className="flex items-center gap-2">
                                        <Share2 className="w-4 h-4" />
                                        Share
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    {onDelete && (
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                onDelete(creative)
                                            }}
                                            className="flex items-center gap-2 text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            Delete
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Project Details Footer */}
                <div className="absolute bottom-0 left-0 w-full p-6 z-20">
                    <div className="space-y-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
                        <h3 className="text-base font-bold text-foreground leading-tight">
                            {creative.title || 'Untitled Creative'}
                        </h3>
                        <div className="flex items-center gap-3">
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium" suppressHydrationWarning>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                                {formatDistanceToNow(new Date(creative.created_at))} ago
                            </p>
                        </div>
                    </div>
                </div>

                {/* Sparkle Action Indicator - Hidden when actions are visible */}
                <AnimatePresence>
                    {!showActions && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.75 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.75 }}
                            className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 transform scale-75 group-hover:scale-100"
                        >
                            <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                                <Sparkles className="w-5 h-5 fill-current" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Link>

            {/* Keyboard shortcut hint on hover */}
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute -bottom-6 left-0 right-0 flex justify-center"
                    >
                        <span className="text-[10px] text-muted-foreground/60 font-medium">
                            Press <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono mx-0.5">E</kbd> to edit
                            · <kbd className="px-1 py-0.5 rounded bg-muted text-[9px] font-mono mx-0.5">D</kbd> to download
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
