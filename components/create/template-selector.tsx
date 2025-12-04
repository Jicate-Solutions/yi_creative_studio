'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useTemplateImages } from '@/hooks/use-template-images'
import type { TemplateImage } from '@/types/database.types'
import type { CreativeFormat } from '@/lib/config/creative-formats'
import type { VerticalPreset } from '@/hooks/use-verticals'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import {
  Image as ImageIcon,
  Check,
  Filter,
} from 'lucide-react'

interface TemplateSelectorProps {
  verticalId: string
  verticalName: string
  onSelect: (template: TemplateImage | null) => void
  selectedTemplate: TemplateImage | null
  selectedFormat?: CreativeFormat | null
  verticals: VerticalPreset[]  // All verticals for dropdown filter
}

export function TemplateSelector({
  verticalId,
  verticalName,
  onSelect,
  selectedTemplate,
  selectedFormat,
  verticals,
}: TemplateSelectorProps) {
  const { templateImages, isLoading } = useTemplateImages()

  // Default to current vertical (from step 2)
  const [selectedVerticalFilter, setSelectedVerticalFilter] = useState<string>(verticalId)

  // Filter templates by selected vertical
  const filteredTemplates = useMemo(() => {
    if (!selectedVerticalFilter) return templateImages
    return templateImages.filter(t => t.vertical_id === selectedVerticalFilter)
  }, [templateImages, selectedVerticalFilter])

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
      {/* Header with vertical dropdown filter */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filter by vertical:</span>
        </div>
        <Select value={selectedVerticalFilter} onValueChange={setSelectedVerticalFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select vertical" />
          </SelectTrigger>
          <SelectContent>
            {verticals.map((vertical) => (
              <SelectItem key={vertical.id} value={vertical.id}>
                {vertical.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Templates grid */}
      {templateImages.length > 0 ? (
        <ScrollArea className="h-[450px] pr-4">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="font-medium text-muted-foreground">No templates for this vertical</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try selecting a different vertical
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className={cn(
                    "relative rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200",
                    selectedTemplate?.id === template.id
                      ? "border-primary ring-2 ring-primary/20 shadow-md"
                      : "border-border hover:border-primary/50 hover:shadow-sm"
                  )}
                  onClick={() => handleSelectTemplate(template)}
                >
                  {/* Template image */}
                  <div className="aspect-[4/5] relative bg-gradient-to-br from-muted to-muted/50">
                    <Image
                      src={template.image_url}
                      alt={template.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover"
                      loading="lazy"
                    />

                    {/* Selected indicator - clear checkmark */}
                    {selectedTemplate?.id === template.id && (
                      <div className="absolute top-2 right-2 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </div>

                  {/* Template info - simple name and dimensions */}
                  <div className="p-2.5 bg-card">
                    <p className="text-sm font-medium truncate" title={template.name}>
                      {template.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {template.width} × {template.height}
                    </p>
                  </div>
                </div>
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
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-[200px]" />
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
