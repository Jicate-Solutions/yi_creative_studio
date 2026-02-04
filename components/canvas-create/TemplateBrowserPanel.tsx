'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { useTemplateImages } from '@/hooks/use-template-images'
import { useVerticals } from '@/hooks'
import { useCreativeStore } from '@/stores/creative-store'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { Check, Filter, Image as ImageIcon } from 'lucide-react'

export function TemplateBrowserPanel() {
  const { templateImages, isLoading } = useTemplateImages()
  const { verticals } = useVerticals()
  const { selectedVertical, selectedTemplate, selectTemplate } = useCreativeStore()
  const [filterVertical, setFilterVertical] = useState<string>(selectedVertical?.id || 'all')

  const filteredTemplates = useMemo(() => {
    if (filterVertical === 'all') return templateImages
    return templateImages.filter(t => t.vertical_id === filterVertical)
  }, [templateImages, filterVertical])

  if (isLoading) {
    return <TemplateBrowserSkeleton />
  }

  return (
    <div className="h-full flex flex-col bg-muted/20 rounded-lg border">
      {/* Header with filter */}
      <div className="p-4 border-b flex items-center gap-3 bg-card rounded-t-lg">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Filter:</span>
        <Select value={filterVertical} onValueChange={setFilterVertical}>
          <SelectTrigger className="w-[150px] h-8">
            <SelectValue placeholder="All verticals" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All verticals</SelectItem>
            {verticals.map((v) => (
              <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Template grid */}
      <ScrollArea className="flex-1 p-4">
        {filteredTemplates.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => selectTemplate(template)}
                className={cn(
                  "relative rounded-lg overflow-hidden cursor-pointer transition-all group",
                  "hover:shadow-lg hover:-translate-y-0.5 border-2",
                  selectedTemplate?.id === template.id
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/20"
                )}
              >
                <div className="aspect-[3/4] relative bg-muted">
                  <Image
                    src={template.image_url}
                    alt={template.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                  {/* Selection overlay */}
                  {selectedTemplate?.id === template.id && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-2 shadow-lg">
                        <Check className="h-5 w-5" />
                      </div>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className={cn(
                    "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center",
                    selectedTemplate?.id === template.id && "opacity-0"
                  )}>
                    <span className="text-white text-sm font-medium">Select</span>
                  </div>
                </div>
                <div className="p-2 bg-card">
                  <p className="text-sm font-medium truncate">{template.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {template.width}×{template.height}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Selection info footer */}
      {selectedTemplate && (
        <div className="p-3 border-t bg-primary/5 rounded-b-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Selected: {selectedTemplate.name}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <ImageIcon className="h-12 w-12 text-muted-foreground/30 mb-4" />
      <p className="font-medium text-muted-foreground">No templates found</p>
      <p className="text-sm text-muted-foreground mt-1">
        Try a different vertical filter or upload templates
      </p>
    </div>
  )
}

function TemplateBrowserSkeleton() {
  return (
    <div className="h-full flex flex-col bg-muted/20 rounded-lg border">
      <div className="p-4 border-b flex items-center gap-3">
        <Skeleton className="h-8 w-[150px]" />
      </div>
      <div className="p-4 flex-1">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
