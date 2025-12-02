'use client'

import { useState, useMemo } from 'react'
import { useTemplateImages } from '@/hooks/use-template-images'
import type { TemplateImage } from '@/types/database.types'
import type { CreativeFormat } from '@/lib/config/creative-formats'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import {
  Image as ImageIcon,
  Check,
  Sparkles,
  Loader2,
  Star,
  Clock,
  Grid2X2,
  Filter,
  Maximize2,
  RectangleHorizontal,
} from 'lucide-react'

interface TemplateSelectorProps {
  verticalId: string
  verticalName: string
  onSelect: (template: TemplateImage | null) => void
  selectedTemplate: TemplateImage | null
  selectedFormat?: CreativeFormat | null
}

export function TemplateSelector({
  verticalId,
  verticalName,
  onSelect,
  selectedTemplate,
  selectedFormat,
}: TemplateSelectorProps) {
  const { templateImages, isLoading, getTemplatesByVertical } = useTemplateImages()
  const [filter, setFilter] = useState<string>('all')

  // Helper to check if template matches format aspect ratio (within tolerance)
  const matchesFormatAspectRatio = (template: TemplateImage): boolean => {
    if (!selectedFormat) return true // No format selected, all match
    if (!template.width || !template.height) return true // No dimensions, assume match
    const templateRatio = template.width / template.height
    const formatRatio = selectedFormat.width / selectedFormat.height
    const tolerance = 0.1 // 10% tolerance
    return Math.abs(templateRatio - formatRatio) / formatRatio < tolerance
  }

  // Get templates for this vertical (prioritized)
  const verticalTemplates = useMemo(() => {
    return getTemplatesByVertical(verticalId)
  }, [verticalId, getTemplatesByVertical])

  // Get all other templates (from other verticals or general)
  const otherTemplates = useMemo(() => {
    return templateImages.filter(t => t.vertical_id !== verticalId)
  }, [templateImages, verticalId])

  // Combine: vertical-specific first, then all others
  const allAvailableTemplates = useMemo(() => {
    return [...verticalTemplates, ...otherTemplates]
  }, [verticalTemplates, otherTemplates])

  // General templates (no vertical assigned)
  const generalTemplates = useMemo(() => {
    return templateImages.filter(t => !t.vertical_id)
  }, [templateImages])

  // Format-compatible templates
  const formatCompatibleTemplates = useMemo(() => {
    return allAvailableTemplates.filter(matchesFormatAspectRatio)
  }, [allAvailableTemplates, selectedFormat])

  // Filtered templates based on selected filter
  const filteredTemplates = useMemo(() => {
    let templates: TemplateImage[]
    if (filter === 'all') templates = allAvailableTemplates
    else if (filter === 'recommended') templates = verticalTemplates
    else if (filter === 'general') templates = generalTemplates
    else if (filter === 'format') templates = formatCompatibleTemplates
    else templates = allAvailableTemplates

    return templates
  }, [filter, allAvailableTemplates, verticalTemplates, generalTemplates, formatCompatibleTemplates])

  // Check if a template matches current vertical
  const isVerticalMatch = (template: TemplateImage) => {
    return template.vertical_id === verticalId
  }

  // Check if a template matches format
  const isFormatMatch = matchesFormatAspectRatio

  const handleSelectTemplate = (template: TemplateImage) => {
    if (selectedTemplate?.id === template.id) {
      onSelect(null) // Deselect if already selected
    } else {
      onSelect(template)
    }
  }

  if (isLoading) {
    return <TemplateSelectorSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* Header with filter toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filter templates</span>
        </div>

        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(value) => value && setFilter(value)}
          className="justify-start flex-wrap gap-1"
        >
          <ToggleGroupItem value="all" aria-label="Show all templates" className="text-xs px-3">
            <Grid2X2 className="h-3.5 w-3.5 mr-1.5" />
            All ({allAvailableTemplates.length})
          </ToggleGroupItem>
          <ToggleGroupItem value="recommended" aria-label="Show recommended templates" className="text-xs px-3">
            <Star className="h-3.5 w-3.5 mr-1.5" />
            Best Match ({verticalTemplates.length})
          </ToggleGroupItem>
          {selectedFormat && (
            <ToggleGroupItem value="format" aria-label="Show format-compatible templates" className="text-xs px-3">
              <RectangleHorizontal className="h-3.5 w-3.5 mr-1.5" />
              {selectedFormat.aspectRatio} ({formatCompatibleTemplates.length})
            </ToggleGroupItem>
          )}
          <ToggleGroupItem value="general" aria-label="Show general templates" className="text-xs px-3">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            General ({generalTemplates.length})
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Templates grid */}
      {allAvailableTemplates.length > 0 ? (
        <ScrollArea className="h-[450px] pr-4">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-muted-foreground">No templates match this filter</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setFilter('all')}
                className="mt-2"
              >
                Show all templates
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <HoverCard key={template.id} openDelay={300} closeDelay={100}>
                  <HoverCardTrigger asChild>
                    <div
                      className={cn(
                        "relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200",
                        selectedTemplate?.id === template.id
                          ? "border-primary ring-2 ring-primary/20 shadow-md"
                          : "border-border hover:border-primary/50 hover:shadow-sm"
                      )}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      {/* Template image */}
                      <div className="aspect-[4/5] relative bg-gradient-to-br from-muted to-muted/50">
                        <img
                          src={template.image_url}
                          alt={template.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />

                        {/* Gradient overlay on hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

                        {/* Quick view hint */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="p-2.5 rounded-full bg-white/90 shadow-lg backdrop-blur-sm">
                                <Maximize2 className="h-4 w-4 text-foreground" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Hover for preview</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>

                        {/* Selected indicator */}
                        {selectedTemplate?.id === template.id && (
                          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md">
                            <Check className="h-4 w-4" />
                          </div>
                        )}

                        {/* Vertical & Format badges */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            {isVerticalMatch(template) ? (
                              <Badge
                                variant="default"
                                className="text-xs shadow-sm"
                              >
                                <Star className="h-3 w-3 mr-1" />
                                Best Match
                              </Badge>
                            ) : !template.vertical_id ? (
                              <Badge
                                variant="secondary"
                                className="text-xs shadow-sm"
                              >
                                General
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="text-xs bg-background/90 backdrop-blur-sm"
                              >
                                Other
                              </Badge>
                            )}
                            {selectedFormat && isFormatMatch(template) && (
                              <Badge
                                variant="secondary"
                                className="text-xs shadow-sm bg-green-500/20 text-green-700 dark:text-green-400"
                              >
                                <RectangleHorizontal className="h-3 w-3 mr-1" />
                                {selectedFormat.aspectRatio}
                              </Badge>
                            )}
                          </div>

                          {(template.use_count ?? 0) > 0 && (
                            <Badge variant="secondary" className="text-xs bg-background/90 backdrop-blur-sm">
                              <Clock className="h-3 w-3 mr-1" />
                              {template.use_count}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Template info */}
                      <div className="p-2.5 bg-card">
                        <p className="text-sm font-medium truncate" title={template.name}>
                          {template.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {template.width} × {template.height}
                        </p>
                      </div>
                    </div>
                  </HoverCardTrigger>

                  {/* HoverCard preview */}
                  <HoverCardContent
                    side="right"
                    align="start"
                    className="w-80 p-0 overflow-hidden"
                    sideOffset={10}
                  >
                    <div className="relative aspect-[4/5] bg-muted">
                      <img
                        src={template.image_url}
                        alt={template.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="p-4 space-y-2">
                      <h4 className="font-semibold">{template.name}</h4>
                      {template.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                        <span>{template.width} × {template.height}px</span>
                        {(template.use_count ?? 0) > 0 && (
                          <>
                            <span>•</span>
                            <span>Used {template.use_count} times</span>
                          </>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3"
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(template)
                        }}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Select Template
                      </Button>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          )}
        </ScrollArea>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="font-semibold text-lg">No templates available</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            No templates have been uploaded for {verticalName} yet. Visit the Templates page to upload some.
          </p>
        </div>
      )}
    </div>
  )
}

// Skeleton loader for templates
export function TemplateSelectorSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-28" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-[4/5] rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
