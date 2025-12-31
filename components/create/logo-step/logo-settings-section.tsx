'use client'

import { cn } from '@/lib/utils'
import {
    Palette,
    Rows3,
    Sparkles,
    Info,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    LogoStripShapeSelector
} from '../logo-strip-shape-selector'
import type { DesignData } from '@/lib/config/design-constants'
import type { LogoStripMode } from '@/stores/creative-store'

interface LogoSettingsSectionProps {
    designData: DesignData
    stripMode: LogoStripMode
    updateLogoStripMode: (mode: LogoStripMode) => void
    logoBackgroundColor: string
    setLogoBackgroundColor: (color: string) => void
    defaultOpen?: boolean // Kept for compatibility but unused
}

export function LogoSettingsSection({
    designData,
    stripMode,
    updateLogoStripMode,
    logoBackgroundColor,
    setLogoBackgroundColor,
}: LogoSettingsSectionProps) {
    const logoStripMode = stripMode || { enabled: false, rows: [], opacity: 100, logoBound: true }

    return (
        <div className="space-y-6 pt-2">

            {/* 1. Logo Strip Feature (Expandable Card) - NOW FIRST */}
            <div className={cn(
                "group relative overflow-hidden rounded-2xl border transition-all duration-300",
                logoStripMode.enabled
                    ? "border-primary/30 bg-gradient-to-b from-primary/5 to-white/50 shadow-lg ring-2 ring-primary/20"
                    : "border-primary/20 bg-white/50 hover:bg-white/60 hover:border-primary/30 dark:border-primary/20 dark:bg-black/30"
            )}>
                {/* "Recommended" Badge (when disabled) */}
                {!logoStripMode.enabled && (
                    <div className="absolute right-3 top-3 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary dark:bg-primary/20 dark:text-primary">
                        Recommended
                    </div>
                )}

                {/* Header / Toggle */}
                <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl shadow-md transition-all duration-300",
                            logoStripMode.enabled
                                ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-primary/30 dark:shadow-primary/20"
                                : "bg-gradient-to-br from-primary/10 to-primary/20 text-primary shadow-primary/10 dark:from-primary/20 dark:to-primary/30 dark:text-primary"
                        )}>
                            <Rows3 className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <Label className={cn(
                                    "text-base font-bold transition-colors",
                                    logoStripMode.enabled
                                        ? "text-primary dark:text-primary"
                                        : "text-slate-800 dark:text-slate-200"
                                )}>
                                    Logo Strip
                                </Label>
                                {logoStripMode.enabled && (
                                    <Badge variant="secondary" className="text-[10px] font-semibold">
                                        <Sparkles className="mr-1 h-3 w-3" />
                                        Active
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs font-medium text-muted-foreground">Add a backdrop band behind logos to improve readability</p>
                        </div>
                    </div>
                    <Switch
                        checked={logoStripMode.enabled}
                        onCheckedChange={(checked) => {
                            updateLogoStripMode({
                                ...logoStripMode,
                                enabled: checked,
                                rows: checked ? (logoStripMode.rows?.length ? logoStripMode.rows : ['header']) : [],
                                logoBound: logoStripMode.logoBound ?? true,
                            })
                        }}
                        aria-label={`Logo strip ${logoStripMode.enabled ? 'enabled' : 'disabled'}`}
                        className="data-[state=checked]:bg-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    />
                </div>

                {/* Expanded Controls */}
                {logoStripMode.enabled && (
                    <div className="border-t border-primary/10 bg-gradient-to-b from-white/40 to-white/20 p-5 backdrop-blur-sm animate-in slide-in-from-top-4 fade-in-0 duration-300 dark:border-primary/10 dark:from-black/20 dark:to-black/10">
                        <div className="space-y-6">

                            {/* Pro Tip Box */}
                            <div className="animate-in fade-in-0 slide-in-from-top-2 duration-200">
                                <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 dark:bg-primary/10">
                                    <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                                    <p className="text-xs leading-relaxed text-primary dark:text-primary">
                                        <strong>Pro Tip:</strong> Enable logo strips for creatives with busy backgrounds or gradient designs to ensure logo visibility.
                                    </p>
                                </div>
                            </div>

                            {/* Zone Selector - Segmented Control */}
                            <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200 delay-75">
                                <Label className="text-xs font-bold uppercase tracking-wider text-foreground/60 dark:text-foreground/60">
                                    Placement Zones
                                </Label>
                                <div className="flex w-full rounded-xl border border-primary/10 bg-primary/5 p-1 dark:border-primary/20 dark:bg-slate-900/50">
                                    {(['header', 'middle', 'footer'] as const).map((row) => {
                                        const isActive = logoStripMode.rows?.includes(row)
                                        return (
                                            <button
                                                key={row}
                                                type="button"
                                                onClick={() => {
                                                    const currentRows = logoStripMode.rows || []
                                                    const newRows = isActive
                                                        ? currentRows.filter((r: string) => r !== row)
                                                        : [...currentRows, row]
                                                    updateLogoStripMode({
                                                        ...logoStripMode,
                                                        rows: newRows,
                                                    })
                                                }}
                                                role="checkbox"
                                                aria-checked={isActive}
                                                aria-label={`${row} zone${isActive ? ', enabled' : ''}`}
                                                className={cn(
                                                    'flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-200',
                                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                                                    isActive
                                                        ? 'bg-white text-primary shadow-sm ring-1 ring-black/5 dark:bg-primary dark:text-white dark:ring-0'
                                                        : 'text-foreground/60 hover:text-foreground/80 hover:bg-white/50 dark:hover:text-foreground/70'
                                                )}
                                            >
                                                {row.charAt(0).toUpperCase() + row.slice(1)}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <Separator className="bg-primary/10 dark:bg-primary/20" />

                            {/* Shape Selector */}
                            <div className="space-y-3 animate-in fade-in-0 slide-in-from-top-2 duration-200 delay-75">
                                <Label className="text-xs font-bold uppercase tracking-wider text-foreground/60 dark:text-foreground/60">
                                    Visual Style
                                </Label>
                                <LogoStripShapeSelector />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 2. Global Canvas Settings (Glass Card) - NOW SECOND */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200/40 bg-white/40 p-5 shadow-sm backdrop-blur-xl transition-all hover:bg-white/50 dark:border-slate-700/30 dark:bg-black/20 dark:hover:bg-black/25">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500 shadow-inner dark:from-slate-800 dark:to-slate-900 dark:text-slate-400">
                                <Palette className="h-5 w-5" />
                            </div>
                            <div>
                                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Canvas Color</Label>
                                <p className="text-xs font-medium text-muted-foreground">Set the background for your logo export</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-full border border-slate-200/50 bg-white/50 px-2 py-1.5 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50">
                            <Input
                                type="color"
                                value={logoBackgroundColor}
                                onChange={(e) => setLogoBackgroundColor(e.target.value)}
                                aria-label="Canvas background color"
                                className="h-8 w-8 cursor-pointer border-0 p-0 rounded-full ring-2 ring-white/20 transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                            />
                            <span className="min-w-[4rem] text-center font-mono text-xs font-medium text-foreground/70" aria-live="polite">
                                {logoBackgroundColor}
                            </span>
                        </div>
                    </div>
                    <p className="text-[11px] text-foreground/60 italic">
                        This color appears in exported logo files only, not in the final creative.
                    </p>
                </div>
            </div>
        </div>
    )
}
