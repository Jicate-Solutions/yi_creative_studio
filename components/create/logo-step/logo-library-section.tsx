'use client'

import { useMemo } from 'react'
import {
    ImageIcon,
    MousePointerClick,
    Search
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { LogoCard } from './logo-card'
import { LOGO_CATEGORIES, LogoPosition, migrateLogoPosition } from '@/lib/config/constants'
import { LogoSizePreset } from '@/lib/constants/logoConstants'

interface LogoLibrarySectionProps {
    logos: any[]
    formData: any
    categoryFilter: string
    setCategoryFilter: (category: string) => void
    selectedLogoId: string | null
    handleLogoSelect: (logoId: string) => void
    updateLogoSize: (logoId: string, size: LogoSizePreset) => void
    removeLogoPlacement: (logoId: string) => void
    defaultOpen?: boolean
    isOpen: boolean
    setIsOpen: (isOpen: boolean) => void
}

export function LogoLibrarySection({
    logos,
    formData,
    categoryFilter,
    setCategoryFilter,
    selectedLogoId,
    handleLogoSelect,
    updateLogoSize,
    removeLogoPlacement,
    defaultOpen = true,
    isOpen,
    setIsOpen
}: LogoLibrarySectionProps) {

    const placedPositions = formData.logosPlacements.map((p: any) => migrateLogoPosition(p.position))
    const placedLogoIds = formData.logosPlacements.map((p: any) => p.logoId)

    // Filter logos by category
    const filteredLogos = useMemo(() => {
        if (categoryFilter === 'all') return logos
        return logos.filter(logo => logo.category === categoryFilter)
    }, [logos, categoryFilter])

    // Get counts for each category
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: logos.length }
        Object.keys(LOGO_CATEGORIES).forEach(cat => {
            counts[cat] = logos.filter(l => l.category === cat).length
        })
        return counts
    }, [logos])

    // Get available categories (only those with logos)
    const availableCategories = useMemo(() => {
        return Object.entries(LOGO_CATEGORIES).filter(([key]) => categoryCounts[key] > 0)
    }, [categoryCounts])

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="h-full flex flex-col">
            <div className="flex items-center justify-between px-1 mb-2">
                <CollapsibleTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer group">
                        <div className="p-1.5 bg-muted rounded-md group-hover:bg-muted/80 transition-colors">
                            <ImageIcon className="h-4 w-4 text-foreground/70" />
                        </div>
                        <span className="text-sm font-medium">Library</span>
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5 ml-2">
                            {formData.logosPlacements.length} / 18 used
                        </Badge>
                    </div>
                </CollapsibleTrigger>
            </div>

            <CollapsibleContent className="flex-1 min-h-0 data-[state=closed]:hidden">
                <div className="bg-muted/30 rounded-xl border p-3 h-full flex flex-col">
                    {/* Category Filter */}
                    {logos.length > 0 && availableCategories.length > 0 && (
                        <div className="mb-3">
                            <ScrollArea className="w-full whitespace-nowrap pb-2">
                                <ToggleGroup
                                    type="single"
                                    value={categoryFilter}
                                    onValueChange={(value) => value && setCategoryFilter(value)}
                                    className="justify-start gap-2"
                                >
                                    <ToggleGroupItem value="all" className="text-xs px-3 h-7 rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border bg-background hover:bg-muted">
                                        All
                                    </ToggleGroupItem>
                                    {availableCategories.map(([key, { label }]) => (
                                        <ToggleGroupItem key={key} value={key} className="text-xs px-3 h-7 rounded-full data-[state=on]:bg-primary data-[state=on]:text-primary-foreground border bg-background hover:bg-muted">
                                            {label.replace(' Logo', '')}
                                        </ToggleGroupItem>
                                    ))}
                                </ToggleGroup>
                            </ScrollArea>
                        </div>
                    )}

                    {/* Logo Cards Grid */}
                    {filteredLogos.length > 0 ? (
                        <ScrollArea className="flex-1 pr-3 -mr-3">
                            <div className="grid grid-cols-3 gap-2 pb-2">
                                {filteredLogos.map((logo) => {
                                    const placement = formData.logosPlacements.find((p: any) => p.logoId === logo.id)
                                    const isPlaced = !!placement
                                    const isSelected = selectedLogoId === logo.id
                                    const migratedPosition = placement ? migrateLogoPosition(placement.position) : null

                                    return (
                                        <LogoCard
                                            key={logo.id}
                                            logo={logo}
                                            isPlaced={isPlaced}
                                            isSelected={isSelected}
                                            position={migratedPosition}
                                            size={placement?.size || 'medium'}
                                            onSelect={() => handleLogoSelect(logo.id)}
                                            onSizeChange={(size) => updateLogoSize(logo.id, size)}
                                            onRemove={() => removeLogoPlacement(logo.id)}
                                            isDisabled={placedPositions.length >= 18 && !isPlaced}
                                        />
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    ) : logos.length > 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                            <p className="text-sm text-muted-foreground mb-2">No logos in this category</p>
                            <Button variant="link" size="sm" onClick={() => setCategoryFilter('all')}>
                                Show all logos
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center bg-muted/50 rounded-lg border border-dashed">
                            <p className="text-sm text-muted-foreground mb-1">No logos uploaded</p>
                            <p className="text-xs text-muted-foreground/70">Upload logos in Settings → Logo Management</p>
                        </div>
                    )}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}

// Minimal duplicate of LogoCard if not exporting from elsewhere to avoid circular deps
// Or we can extract LogoCard to a shared file. For now, assuming we will extract LogoCard from LogoPositionGrid

