'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import {
    ArrowRight, Image as ImageIcon, Sparkles, Edit3, RefreshCw,
    Download, Eye, Trash2, MoreHorizontal, Copy, Share2, ExternalLink,
    Filter, LayoutGrid, List
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
import { getFormatLabel } from '@/lib/config/creative-formats'
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
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    if (creatives.length === 0) return null

    return (
        <div className="space-y-6">
            {/* Professional Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-primary/50 rounded-full" />
                    <div>
                        <h2 className="text-base font-bold tracking-tight text-foreground flex items-center gap-2">
                            Recent Projects
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-muted-foreground border border-slate-200 dark:border-slate-700">
                                {creatives.length}
                            </span>
                        </h2>
                        <p className="text-xs text-muted-foreground font-medium">Manage your generated assets</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* View Toggles */}
                    <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-white/5">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7 rounded-md", viewMode === 'grid' ? "bg-white dark:bg-slate-700 shadow-sm" : "text-muted-foreground hover:text-foreground")}
                            onClick={() => setViewMode('grid')}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn("h-7 w-7 rounded-md", viewMode === 'list' ? "bg-white dark:bg-slate-700 shadow-sm" : "text-muted-foreground hover:text-foreground")}
                            onClick={() => setViewMode('list')}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden sm:block mx-1" />

                    <Button variant="outline" size="sm" className="h-9 gap-2 text-xs font-semibold rounded-lg border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5">
                        <Filter className="w-3.5 h-3.5" />
                        Filter
                    </Button>

                    <Button asChild variant="ghost" size="sm" className="h-9 gap-2 text-xs font-semibold text-primary hover:text-primary hover:bg-primary/5">
                        <Link href={ROUTES.gallery}>
                            View Gallery <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Asset Grid Layout */}
            <div className={cn(
                "grid gap-6 transition-all duration-500",
                viewMode === 'grid'
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
                    : "grid-cols-1"
            )}>
                {creatives.map((creative, i) => (
                    <AssetCard
                        key={creative.id}
                        creative={creative}
                        index={i}
                        viewMode={viewMode}
                        onEdit={onEdit}
                        onRegenerate={onRegenerate}
                        onDownload={onDownload}
                        onDelete={onDelete}
                        onDuplicate={onDuplicate}
                    />
                ))}
            </div>
        </div>
    )
}

// Professional Asset Card (File-Browser Style)
interface AssetCardProps {
    creative: Creative
    index: number
    viewMode: 'grid' | 'list'
    onEdit?: (creative: Creative) => void
    onRegenerate?: (creative: Creative) => void
    onDownload?: (creative: Creative) => void
    onDelete?: (creative: Creative) => void
    onDuplicate?: (creative: Creative) => void
}

function AssetCard({
    creative,
    index,
    viewMode,
    onEdit,
    onRegenerate,
    onDownload,
    onDelete,
    onDuplicate
}: AssetCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.03 * index }}
            className={cn(
                "group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 transition-all duration-300",
                viewMode === 'grid'
                    ? "rounded-2xl hover:border-primary/50 hover:shadow-lg dark:hover:shadow-primary/5 hover:-translate-y-1"
                    : "rounded-xl flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
            )}
        >
            {/* 1. VISUAL THUMBNAIL AREA */}
            <div className={cn(
                "relative overflow-hidden bg-slate-100 dark:bg-black/40",
                viewMode === 'grid'
                    // Grid Mode: Aspect Ratio Box
                    ? "w-full aspect-[4/5] rounded-t-2xl sm:rounded-xl border-b sm:border border-slate-100 dark:border-white/5 sm:m-2 sm:mb-0"
                    // List Mode: Small Square
                    : "w-16 h-16 shrink-0 rounded-lg border border-slate-200 dark:border-white/10"
            )}>
                {/* Transparency Grid (Checkerboard) */}
                <div className="absolute inset-0 opacity-[0.4] bg-[linear-gradient(45deg,#80808012_25%,transparent_25%,transparent_75%,#80808012_75%,#80808012),linear-gradient(45deg,#80808012_25%,transparent_25%,transparent_75%,#80808012_75%,#80808012)] bg-[length:16px_16px] bg-[position:0_0,8px_8px]" />

                {creative.image_url || creative.thumbnail_url ? (
                    <img
                        src={creative.thumbnail_url || creative.image_url || ''}
                        alt={creative.title || 'Asset'}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                    </div>
                )}

                {/* Overlays (Only in Grid Mode) */}
                {viewMode === 'grid' && (
                    <>
                        <Link href={`${ROUTES.gallery}?id=${creative.id}`} className="absolute inset-0 z-10" />

                        {/* Status Badges */}
                        <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
                            <span className="px-2 py-0.5 max-w-[100px] truncate rounded bg-black/60 backdrop-blur-md text-[9px] font-bold text-white uppercase border border-white/10">
                                {creative.vertical || 'Custom'}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* 2. METADATA & ACTIONS */}
            <div className={cn(
                "flex-1",
                viewMode === 'grid' ? "p-3 space-y-2" : "flex items-center justify-between min-w-0"
            )}>
                {/* Title & Date */}
                <div className="min-w-0">
                    <Link href={`${ROUTES.gallery}?id=${creative.id}`} className="block group/link">
                        <h3 className={cn(
                            "font-semibold text-slate-800 dark:text-slate-100 truncate group-hover/link:text-primary transition-colors",
                            viewMode === 'grid' ? "text-sm" : "text-sm"
                        )}>
                            {creative.title || 'Untitled Asset'}
                        </h3>
                    </Link>
                    <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[10px] sm:text-xs text-muted-foreground font-medium truncate">
                            {getFormatLabel(creative.creative_type)}
                        </p>
                        <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                            {formatDistanceToNow(new Date(creative.created_at))} ago
                        </p>
                    </div>
                </div>

                {/* Grid Mode: Footer Actions */}
                {viewMode === 'grid' && (
                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            {/* Mini Format Icon */}
                            <div className="w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                <ImageIcon className="w-3 h-3" />
                            </div>
                        </div>

                        {/* Quick Action Button Group */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            {onDownload && (
                                <button onClick={() => onDownload(creative)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-blue-500 transition-colors" title="Download">
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {onEdit && (
                                <button onClick={() => onEdit(creative)} className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary transition-colors" title="Edit">
                                    <Edit3 className="w-3.5 h-3.5" />
                                </button>
                            )}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-foreground transition-colors"
                                        suppressHydrationWarning
                                    >
                                        <MoreHorizontal className="w-3.5 h-3.5" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 text-xs">
                                    {onRegenerate && <DropdownMenuItem onClick={() => onRegenerate(creative)}>Regenerate</DropdownMenuItem>}
                                    {onDuplicate && <DropdownMenuItem onClick={() => onDuplicate(creative)}>Duplicate</DropdownMenuItem>}
                                    <DropdownMenuSeparator />
                                    {onDelete && <DropdownMenuItem onClick={() => onDelete(creative)} className="text-destructive">Delete</DropdownMenuItem>}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                )}
            </div>

            {/* List Mode: Actions (Inline) */}
            {viewMode === 'list' && (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200 px-4">
                    {onDownload && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-blue-500" onClick={() => onDownload(creative)}>
                            <Download className="w-4 h-4" />
                        </Button>
                    )}
                    {onEdit && (
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" onClick={() => onEdit(creative)}>
                            <Edit3 className="w-4 h-4" />
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-muted-foreground"
                                suppressHydrationWarning
                            >
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                                <Link href={`${ROUTES.gallery}?id=${creative.id}`}>Open Details</Link>
                            </DropdownMenuItem>
                            {onDuplicate && <DropdownMenuItem onClick={() => onDuplicate(creative)}>Duplicate</DropdownMenuItem>}
                            <DropdownMenuSeparator />
                            {onDelete && <DropdownMenuItem onClick={() => onDelete(creative)} className="text-destructive">Delete</DropdownMenuItem>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </motion.div>
    )
}
