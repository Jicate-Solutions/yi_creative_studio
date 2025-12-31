'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Type, Sparkles, Check, AlertCircle, Brain } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    TypographyConfig,
    getFontFamily
} from '@/lib/config/design-constants'
import { useCreativeStore } from '@/stores/creative-store'
import { useTypographySuggestions, buildTypographyContextFromStore } from '@/hooks/use-typography-suggestions'

// Note: Collapsible removed - content is always visible when this section's tab is active

interface TypographySectionProps {
    typography: TypographyConfig
    brandFont?: string
    onTypographyChange: (typography: Partial<TypographyConfig>) => void
}

export function TypographySection({
    typography,
    brandFont,
    onTypographyChange,
}: TypographySectionProps) {

    // AI Typography Suggestions
    const aiTypography = useCreativeStore((state) => state.aiTypography)
    const setEnableAITypography = useCreativeStore((state) => state.setEnableAITypography)
    const applyTypographySuggestions = useCreativeStore((state) => state.applyTypographySuggestions)
    const clearTypographySuggestions = useCreativeStore((state) => state.clearTypographySuggestions)
    const setTypographySuggestions = useCreativeStore((state) => state.setTypographySuggestions)
    const setTypographyGenerating = useCreativeStore((state) => state.setTypographyGenerating)
    const setTypographyError = useCreativeStore((state) => state.setTypographyError)

    const { isGenerating, error, suggestions, requestSuggestions } = useTypographySuggestions()

    // Auto-request suggestions when AI toggle is enabled
    useEffect(() => {
        if (aiTypography.enableAI && !aiTypography.hasFetchedSuggestions && !isGenerating) {
            const context = buildTypographyContextFromStore()
            if (context) {
                requestSuggestions(context)
            }
        }
    }, [aiTypography.enableAI, aiTypography.hasFetchedSuggestions, isGenerating, requestSuggestions])

    // Sync hook state with store state
    useEffect(() => {
        setTypographySuggestions(suggestions)
    }, [suggestions, setTypographySuggestions])

    useEffect(() => {
        setTypographyGenerating(isGenerating)
    }, [isGenerating, setTypographyGenerating])

    useEffect(() => {
        setTypographyError(error)
    }, [error, setTypographyError])

    // Auto-apply suggestions when they arrive (if AI is enabled)
    useEffect(() => {
        if (
            aiTypography.suggestions &&
            aiTypography.enableAI &&
            !aiTypography.isGenerating &&
            !aiTypography.error
        ) {
            // Auto-apply the suggestions
            applyTypographySuggestions()
        }
    }, [aiTypography.suggestions, aiTypography.enableAI, aiTypography.isGenerating, aiTypography.error, applyTypographySuggestions])

    const handleToggleAI = (enabled: boolean) => {
        if (enabled) {
            // Auto-disable brand font when enabling AI (mutually exclusive)
            if (typography.useBrandFont) {
                onTypographyChange({ useBrandFont: false })
            }

            // Validate context before enabling
            const context = buildTypographyContextFromStore()
            if (!context) {
                // Show error to user: form not ready
                setTypographyError('Please select a format and fill in basic event details before using AI typography suggestions.')
                return  // Don't enable the toggle
            }

            // Enable and request suggestions
            setEnableAITypography(true)
            requestSuggestions(context)
        } else {
            // Disable and clear
            setEnableAITypography(false)
            clearTypographySuggestions()
        }
    }

    const handleToggleBrandFont = (checked: boolean) => {
        if (checked) {
            // Auto-disable AI typography when enabling brand font (mutually exclusive)
            if (aiTypography.enableAI) {
                setEnableAITypography(false)
                clearTypographySuggestions()
            }
        }
        onTypographyChange({ useBrandFont: checked })
    }

    return (
        <div className="space-y-4">
            {/* Section Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10">
                        <Type className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold tracking-tight">Typography</h3>
                        <p className="text-xs text-foreground/60">
                            {typography.useBrandFont ? 'Using Brand Identity' : 'Dynamic AI Styling'}
                        </p>
                    </div>
                </div>
                {typography.useBrandFont && brandFont && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-[10px] font-bold text-primary shadow-sm"
                    >
                        ACTIVE
                    </motion.div>
                )}
            </div>

            {/* Brand Font Toggle */}
            {brandFont ? (
                <div className="flex items-center justify-between p-4 rounded-xl glass-panel border-none shadow-sm dark:bg-white/5">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border-none shadow-inner">
                            <span className="text-sm font-serif font-bold text-slate-700 dark:text-slate-300">Ag</span>
                        </div>
                        <div>
                            <Label className="text-sm font-semibold cursor-pointer">Use Brand Font</Label>
                            <p className="text-xs text-foreground/60">
                                {typography.useBrandFont
                                    ? `Optimized for your brand identity`
                                    : 'Enable to use organization fonts'
                                }
                            </p>
                        </div>
                    </div>
                    <Switch
                        checked={typography.useBrandFont}
                        onCheckedChange={handleToggleBrandFont}
                    />
                </div>
            ) : (
                <div className="p-4 rounded-xl glass-panel border-none border-dashed text-center opacity-70">
                    <p className="text-xs font-semibold text-foreground/50 mb-1 uppercase tracking-wider">No Brand Font</p>
                    <p className="text-xs text-foreground/40">
                        Configure your brand identity in settings.
                    </p>
                </div>
            )}

            {/* AI Typography Suggestions Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl glass-panel border-none shadow-sm dark:bg-white/5">
                <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-none shadow-inner">
                        <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <Label className="text-sm font-semibold cursor-pointer">AI Font Suggestions</Label>
                        <p className="text-xs text-foreground/60">
                            {aiTypography.enableAI
                                ? 'Smart font pairings active'
                                : 'Get recommendations from AI'
                            }
                        </p>
                    </div>
                </div>
                <Switch
                    checked={aiTypography.enableAI}
                    onCheckedChange={handleToggleAI}
                />
            </div>

            {/* AI Loading State */}
            {aiTypography.isGenerating && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 dark:bg-primary/10 shadow-sm">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-xs text-primary dark:text-primary">
                        AI is analyzing your event typography...
                    </p>
                </div>
            )}

            {/* AI Error State */}
            {aiTypography.error && aiTypography.enableAI && (
                <Alert variant="destructive" className="py-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        {aiTypography.error}
                    </AlertDescription>
                </Alert>
            )}

            {/* AI Suggestions Display */}
            <AnimatePresence>
                {aiTypography.suggestions && aiTypography.enableAI && !aiTypography.isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-4 rounded-2xl glass-panel border-none shadow-xl p-5 mb-4 overflow-hidden relative group">
                            <div className="absolute inset-x-0 top-0 h-1 gradient-yi" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-primary/10 dark:bg-primary/20">
                                        <Brain className="h-4 w-4 text-primary" />
                                    </div>
                                    <h4 className="text-sm font-bold tracking-tight">AI Selection</h4>
                                </div>
                                <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary shadow-sm px-2">
                                    {Math.round(aiTypography.suggestions.confidence * 100)}% Match
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Heading Font Suggestion */}
                                <div
                                    className="space-y-2 p-4 rounded-xl bg-white/40 dark:bg-black/20 border-none shadow-sm group-hover:bg-white/60 dark:group-hover:bg-black/30 transition-colors"
                                    role="article"
                                    aria-label={`Heading font: ${aiTypography.suggestions.headingFont.label}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Heading</span>
                                        <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                                    </div>
                                    <p
                                        className="text-base font-bold text-foreground"
                                        style={{ fontFamily: getFontFamily(aiTypography.suggestions.headingFont.value) }}
                                    >
                                        {aiTypography.suggestions.headingFont.label}
                                    </p>
                                    <p className="text-xs text-foreground/60 italic leading-relaxed">
                                        "{aiTypography.suggestions.headingFont.reason}"
                                    </p>
                                </div>

                                {/* Body Font Suggestion */}
                                <div
                                    className="space-y-2 p-4 rounded-xl bg-white/40 dark:bg-black/20 border-none shadow-sm group-hover:bg-white/60 dark:group-hover:bg-black/30 transition-colors"
                                    role="article"
                                    aria-label={`Body font: ${aiTypography.suggestions.bodyFont.label}`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/50">Body</span>
                                        <Check className="h-3 w-3 text-emerald-500" aria-hidden="true" />
                                    </div>
                                    <p
                                        className="text-base font-bold text-foreground"
                                        style={{ fontFamily: getFontFamily(aiTypography.suggestions.bodyFont.value) }}
                                    >
                                        {aiTypography.suggestions.bodyFont.label}
                                    </p>
                                    <p className="text-xs text-foreground/60 italic leading-relaxed">
                                        "{aiTypography.suggestions.bodyFont.reason}"
                                    </p>
                                </div>
                            </div>

                            {/* Scale & Tips */}
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border-none shadow-sm">
                                    <span className="text-[10px] font-bold text-muted-foreground">SCALE:</span>
                                    <span className="text-xs font-bold text-primary">{aiTypography.suggestions.scale}×</span>
                                </div>
                                {aiTypography.suggestions.tips?.[0] && (
                                    <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 dark:bg-primary/10 text-[11px] text-primary font-bold truncate">
                                        <Sparkles className="h-3 w-3 shrink-0" />
                                        <span className="truncate">{aiTypography.suggestions.tips[0]}</span>
                                    </div>
                                )}
                            </div>

                            {/* Auto-Applied Banner */}
                            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 border-none">
                                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                                    Fonts Automatically Synchronized
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI Font Hint (if brand font disabled) */}
            {!typography.useBrandFont && (
                <div className="flex items-center gap-4 p-4 rounded-xl glass border-none shadow-sm dark:bg-white/5 overflow-hidden relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                    <Sparkles className="h-5 w-5 text-primary shrink-0" />
                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed italic">
                        <strong className="text-primary font-bold uppercase tracking-widest mr-1 not-italic">Pro Tip:</strong>
                        Mix a high-contrast <span className="text-foreground font-bold font-serif px-1">Serif</span> for headlines with a clean <span className="text-foreground font-bold px-1">Sans-serif</span> for body text to achieve a modern, premium look.
                    </p>
                </div>
            )}
        </div>
    )
}
