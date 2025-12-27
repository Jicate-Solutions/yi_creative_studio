'use client'

import { cn } from '@/lib/utils'
import {
    Palette,
    Rows3,
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
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

            {/* 1. Global Canvas Settings (Glass Card) */}
            <div className="group relative overflow-hidden rounded-2xl border border-white/20 bg-white/40 p-5 shadow-sm backdrop-blur-xl transition-all hover:bg-white/50 dark:border-white/10 dark:bg-black/20 dark:hover:bg-black/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 shadow-inner dark:from-slate-800 dark:to-slate-900 dark:text-slate-400">
                            <Palette className="h-5 w-5" />
                        </div>
                        <div>
                            <Label className="text-base font-semibold text-slate-800 dark:text-slate-200">Canvas Color</Label>
                            <p className="text-xs font-medium text-muted-foreground">Set the background for your logo export</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-full border border-slate-200/50 bg-white/50 px-2 py-1.5 backdrop-blur-sm dark:border-slate-700/50 dark:bg-slate-900/50">
                        <Input
                            type="color"
                            value={logoBackgroundColor}
                            onChange={(e) => setLogoBackgroundColor(e.target.value)}
                            className="h-8 w-8 cursor-pointer border-0 p-0 rounded-full ring-2 ring-white/20 transition-transform hover:scale-105"
                        />
                        <span className="min-w-[4rem] text-center font-mono text-xs font-medium text-slate-600 dark:text-slate-400">
                            {logoBackgroundColor}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. Logo Strip Feature (Expandable Card) */}
            <div className={cn(
                "group relative overflow-hidden rounded-2xl border transition-all duration-300",
                logoStripMode.enabled
                    ? "border-indigo-500/20 bg-gradient-to-b from-indigo-50/50 to-white/40 shadow-lg dark:from-indigo-900/10 dark:to-black/20"
                    : "border-white/20 bg-white/40 hover:bg-white/50 dark:border-white/10 dark:bg-black/20"
            )}>
                {/* Header / Toggle */}
                <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl shadow-inner transition-colors duration-300",
                            logoStripMode.enabled
                                ? "bg-indigo-500 text-white shadow-indigo-200 dark:shadow-none"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                        )}>
                            <Rows3 className="h-5 w-5" />
                        </div>
                        <div>
                            <Label className={cn("text-base font-semibold transition-colors", logoStripMode.enabled ? "text-indigo-950 dark:text-indigo-100" : "text-slate-800 dark:text-slate-200")}>
                                Logo Strip
                            </Label>
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
                        className="data-[state=checked]:bg-indigo-500"
                    />
                </div>

                {/* Expanded Controls */}
                {logoStripMode.enabled && (
                    <div className="border-t border-indigo-100/50 bg-white/30 p-5 backdrop-blur-sm animate-in slide-in-from-top-2 fade-in dark:border-indigo-500/10 dark:bg-black/10">
                        <div className="space-y-6">

                            {/* Zone Selector - Segmented Control */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-indigo-900/60 dark:text-indigo-200/60">
                                    Placement Zones
                                </Label>
                                <div className="flex w-full rounded-xl border border-indigo-100/50 bg-indigo-50/50 p-1 dark:border-indigo-500/20 dark:bg-slate-900/50">
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
                                                    // Prevent deselecting all items (must have at least one if enabled)
                                                    // Actually, user might want to temporarily explicitly select none? 
                                                    // Standard behavior usually allows toggling off. But "enabled" with 0 rows is weird.
                                                    // Let's allow it, but prompt is better.
                                                    // For now, allow toggle off.
                                                    updateLogoStripMode({
                                                        ...logoStripMode,
                                                        rows: newRows,
                                                    })
                                                }}
                                                className={cn(
                                                    'flex-1 rounded-lg py-2 text-xs font-semibold transition-all duration-200',
                                                    isActive
                                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 dark:bg-indigo-600 dark:text-white dark:ring-0'
                                                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-200'
                                                )}
                                            >
                                                {row.charAt(0).toUpperCase() + row.slice(1)}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <Separator className="bg-indigo-100/50 dark:bg-indigo-500/20" />

                            {/* Shape Selector */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-wider text-indigo-900/60 dark:text-indigo-200/60">
                                    Visual Style
                                </Label>
                                <LogoStripShapeSelector />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
