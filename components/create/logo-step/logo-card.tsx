'use client'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import {
    MousePointerClick,
    RotateCcw,
    Check
} from 'lucide-react'
import { LogoPosition } from '@/lib/config/constants'
import { LogoSizePreset } from '@/lib/constants/logoConstants'

interface LogoCardProps {
    logo: any
    isPlaced: boolean
    isSelected: boolean
    position: LogoPosition | null
    size: string
    onSelect: () => void
    onSizeChange: (size: LogoSizePreset) => void
    onRemove: () => void
    isDisabled: boolean
}

export function LogoCard({
    logo,
    isPlaced,
    isSelected,
    position,
    size,
    onSelect,
    onSizeChange,
    onRemove,
    isDisabled,
}: LogoCardProps) {
    return (
        <div
            onClick={() => !isDisabled && onSelect()}
            className={cn(
                'group relative aspect-square rounded-lg border bg-card text-card-foreground shadow-sm transition-all overflow-hidden',
                isSelected && 'ring-2 ring-primary border-primary z-10',
                isPlaced && !isSelected && 'opacity-60 grayscale-[0.8]',
                isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:shadow-md hover:border-primary/50'
            )}
        >
            <div className="p-2 h-full flex items-center justify-center bg-white/50 dark:bg-slate-900/50">
                <img
                    src={logo.thumbnail_url || logo.file_url}
                    alt={logo.name}
                    className="max-w-full max-h-full object-contain"
                />
            </div>

            {isPlaced && (
                <div className="absolute inset-0 bg-black/5 flex items-center justify-center">
                    <Badge variant="secondary" className="h-5 text-[10px] pointer-events-none bg-white/90 shadow-sm border">
                        {position?.split('-')[1] || 'Placed'}
                    </Badge>
                </div>
            )}

            {/* Hover Actions */}
            {/* Only show "Place" if not placed, or "Move" if placed */}
            <div className={cn(
                "absolute inset-0 bg-primary/90 flex items-center justify-center opacity-0 transition-opacity",
                isSelected ? "opacity-0" : "group-hover:opacity-100"
            )}>
                <span className="text-primary-foreground font-medium text-xs flex items-center gap-1">
                    {isPlaced ? <RotateCcw className="h-3 w-3" /> : <MousePointerClick className="h-3 w-3" />}
                    {isPlaced ? "Move" : "Place"}
                </span>
            </div>

            {/* Selected Indicator */}
            {isSelected && (
                <div className="absolute top-1 right-1">
                    <div className="h-4 w-4 bg-primary rounded-full flex items-center justify-center shadow-sm">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                </div>
            )}
        </div>
    )
}
