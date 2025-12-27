'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Type, Sparkles, ChevronDown, Check, Lock, AlertCircle, X } from 'lucide-react'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    TypographyConfig,
    FONT_OPTIONS,
    getFontFamily
} from '@/lib/config/design-constants'
import { useCreativeStore } from '@/stores/creative-store'
import { useTypographySuggestions, buildTypographyContextFromStore } from '@/hooks/use-typography-suggestions'

interface TypographySectionProps {
    typography: TypographyConfig
    brandFont?: string
    onTypographyChange: (typography: Partial<TypographyConfig>) => void
    defaultOpen?: boolean
}

export function TypographySection({
    typography,
    brandFont,
    onTypographyChange,
    defaultOpen = false,
}: TypographySectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

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

    const handleApplySuggestions = () => {
        applyTypographySuggestions()
    }

    const handleDismissSuggestions = () => {
        clearTypographySuggestions()
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="w-full">
                <div
                    className={cn(
                        'flex items-center justify-between p-4 rounded-xl transition-all',
                        'bg-gradient-to-br from-slate-50/80 to-white/90 dark:from-slate-900/80 dark:to-slate-800/90',
                        'border border-slate-200/50 dark:border-slate-700/50',
                        'hover:shadow-md cursor-pointer',
                        isOpen && 'shadow-sm bg-slate-50/90 dark:bg-slate-800/90'
                    )}
                >
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/50 dark:to-fuchsia-900/50">
                            <Type className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div className="text-left">
                            <h3 className="text-sm font-semibold">Typography</h3>
                            <p className="text-xs text-muted-foreground">
                                {typography.useBrandFont ? 'Using Brand Font' : 'Custom Fonts'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {typography.useBrandFont && brandFont && (
                            <div className="px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-[10px] font-medium text-violet-700 dark:text-violet-300 border border-violet-200/50">
                                {brandFont}
                            </div>
                        )}
                        <ChevronDown
                            className={cn(
                                'h-5 w-5 text-muted-foreground transition-transform duration-200',
                                isOpen && 'rotate-180'
                            )}
                        />
                    </div>
                </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3">
                <div className="space-y-4 p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/30 dark:border-slate-700/30 backdrop-blur-sm">

                    {/* Brand Font Toggle */}
                    {brandFont ? (
                        <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border">
                                    <span className="text-sm font-serif font-bold text-slate-700 dark:text-slate-300">Ag</span>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium cursor-pointer">Use Brand Font</Label>
                                    <p className="text-xs text-muted-foreground">
                                        {typography.useBrandFont
                                            ? `Using ${brandFont} from organization settings`
                                            : 'Manually select fonts'
                                        }
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={typography.useBrandFont}
                                onCheckedChange={(checked) => onTypographyChange({ useBrandFont: checked })}
                            />
                        </div>
                    ) : (
                        <div className="p-4 rounded-lg bg-muted/50 text-center border border-dashed">
                            <p className="text-sm text-muted-foreground mb-1">No Brand Font Configured</p>
                            <p className="text-xs text-muted-foreground/70">
                                Configure your brand font in Organization Settings to use it here.
                            </p>
                        </div>
                    )}

                    {/* AI Typography Suggestions Toggle */}
                    <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-900/60">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/50 dark:to-fuchsia-900/50 border">
                                <Sparkles className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <Label className="text-sm font-medium cursor-pointer">AI Font Suggestions</Label>
                                <p className="text-xs text-muted-foreground">
                                    {aiTypography.enableAI
                                        ? 'AI will suggest appropriate fonts'
                                        : 'Get font recommendations from AI'
                                    }
                                </p>
                            </div>
                        </div>
                        <Switch
                            checked={aiTypography.enableAI}
                            onCheckedChange={handleToggleAI}
                            disabled={typography.useBrandFont}
                        />
                    </div>

                    {/* AI Loading State */}
                    {aiTypography.isGenerating && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 border border-blue-100/50 dark:border-blue-800/30">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                            <p className="text-xs text-blue-700 dark:text-blue-300">
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
                    {aiTypography.suggestions && aiTypography.enableAI && !aiTypography.isGenerating && (
                        <div className="space-y-3 rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/30 dark:to-indigo-950/20 dark:border-blue-800 p-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                    AI Recommendations
                                </h4>
                                <Badge variant="secondary" className="text-xs">
                                    {Math.round(aiTypography.suggestions.confidence * 100)}% confident
                                </Badge>
                            </div>

                            {/* Heading Font Suggestion */}
                            <div className="space-y-1 p-3 rounded-lg bg-white/60 dark:bg-slate-900/40 border border-blue-100 dark:border-blue-900">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                                        Heading Font:
                                    </span>
                                    <span className="text-sm font-semibold" style={{ fontFamily: getFontFamily(aiTypography.suggestions.headingFont.value) }}>
                                        {aiTypography.suggestions.headingFont.label}
                                    </span>
                                </div>
                                <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
                                    {aiTypography.suggestions.headingFont.reason}
                                </p>
                            </div>

                            {/* Body Font Suggestion */}
                            <div className="space-y-1 p-3 rounded-lg bg-white/60 dark:bg-slate-900/40 border border-blue-100 dark:border-blue-900">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                                        Body Font:
                                    </span>
                                    <span className="text-sm font-semibold" style={{ fontFamily: getFontFamily(aiTypography.suggestions.bodyFont.value) }}>
                                        {aiTypography.suggestions.bodyFont.label}
                                    </span>
                                </div>
                                <p className="text-xs text-blue-700/80 dark:text-blue-300/80">
                                    {aiTypography.suggestions.bodyFont.reason}
                                </p>
                            </div>

                            {/* Scale Info */}
                            <div className="flex items-center gap-2 p-2 rounded bg-white/40 dark:bg-slate-900/30">
                                <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                                    Font Scale:
                                </span>
                                <Badge variant="outline" className="text-xs">
                                    {aiTypography.suggestions.scale}×
                                </Badge>
                            </div>

                            {/* Pro Tips */}
                            {aiTypography.suggestions.tips && aiTypography.suggestions.tips.length > 0 && (
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-blue-800 dark:text-blue-200">
                                        Pro Tips:
                                    </span>
                                    {aiTypography.suggestions.tips.map((tip, i) => (
                                        <p key={i} className="text-xs text-blue-700/80 dark:text-blue-300/80 pl-3">
                                            • {tip}
                                        </p>
                                    ))}
                                </div>
                            )}

                            {/* Auto-Applied Indicator */}
                            <div className="space-y-2 pt-2">
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    <p className="text-xs text-green-700 dark:text-green-300">
                                        Fonts automatically applied! Toggle off to revert to previous settings.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Font Selection Controls */}
                    <div className={cn(
                        "space-y-4 transition-all duration-300",
                        typography.useBrandFont && "opacity-50 pointer-events-none grayscale"
                    )}>
                        {/* Heading Font */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Heading Font</Label>
                                {typography.useBrandFont && <Lock className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            <Select
                                value={typography.headingFont}
                                onValueChange={(value) => onTypographyChange({ headingFont: value })}
                                disabled={typography.useBrandFont}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select heading font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONT_OPTIONS.map((font) => (
                                        <SelectItem key={font.value} value={font.value}>
                                            <span style={{ fontFamily: font.family }}>{font.label}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Body Font */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Body Font</Label>
                                {typography.useBrandFont && <Lock className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            <Select
                                value={typography.bodyFont}
                                onValueChange={(value) => onTypographyChange({ bodyFont: value })}
                                disabled={typography.useBrandFont}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select body font" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FONT_OPTIONS.map((font) => (
                                        <SelectItem key={font.value} value={font.value}>
                                            <span style={{ fontFamily: font.family }}>{font.label}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* AI Font Hint (if brand font disabled) */}
                    {!typography.useBrandFont && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-violet-50/50 dark:bg-violet-900/20 border border-violet-100/50 dark:border-violet-800/30">
                            <Sparkles className="h-4 w-4 text-violet-500" />
                            <p className="text-xs text-violet-700 dark:text-violet-300">
                                <strong>Pro Tip:</strong> Mix a Serif heading with a Sans-serif body for a classic look.
                            </p>
                        </div>
                    )}

                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}
