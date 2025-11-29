'use client'

import { useState, useMemo } from 'react'
import { useTemplateImages } from '@/hooks/use-template-images'
import type { TemplateImage } from '@/types/database.types'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Image as ImageIcon,
  Check,
  Eye,
  Loader2,
} from 'lucide-react'

interface TemplateSelectorProps {
  verticalId: string
  verticalName: string
  onSelect: (template: TemplateImage | null) => void
  onBack: () => void
  onContinue: () => void
  selectedTemplate: TemplateImage | null
}

export function TemplateSelector({
  verticalId,
  verticalName,
  onSelect,
  onBack,
  onContinue,
  selectedTemplate,
}: TemplateSelectorProps) {
  const { templateImages, isLoading, getTemplatesByVertical } = useTemplateImages()
  const [previewTemplate, setPreviewTemplate] = useState<TemplateImage | null>(null)

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

  // Check if a template matches current vertical
  const isVerticalMatch = (template: TemplateImage) => {
    return template.vertical_id === verticalId
  }

  const handleSelectTemplate = (template: TemplateImage) => {
    if (selectedTemplate?.id === template.id) {
      onSelect(null) // Deselect if already selected
    } else {
      onSelect(template)
    }
  }

  const handleSkipTemplate = () => {
    onSelect(null)
    onContinue()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Step 2: Choose a Template
          </CardTitle>
          <CardDescription>
            Select an image template for your {verticalName} creative, or generate from scratch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Generate from scratch option */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover:border-primary/50",
              !selectedTemplate ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            )}
            onClick={() => onSelect(null)}
          >
            <div className="flex flex-col items-center gap-3">
              <div className={cn(
                "p-3 rounded-full",
                !selectedTemplate ? "bg-primary/10" : "bg-muted"
              )}>
                <Sparkles className={cn(
                  "h-6 w-6",
                  !selectedTemplate ? "text-primary" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="font-medium">Generate from Scratch</p>
                <p className="text-sm text-muted-foreground">
                  Let AI create a unique design based on your event details
                </p>
              </div>
              {!selectedTemplate && (
                <Badge variant="default" className="gap-1">
                  <Check className="h-3 w-3" />
                  Selected
                </Badge>
              )}
            </div>
          </div>

          {/* Templates grid */}
          {allAvailableTemplates.length > 0 ? (
            <>
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Or use a template
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <ScrollArea className="h-[400px] pr-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allAvailableTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={cn(
                        "relative group rounded-lg overflow-hidden border-2 cursor-pointer transition-all",
                        selectedTemplate?.id === template.id
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleSelectTemplate(template)}
                    >
                      {/* Template image */}
                      <div className="aspect-[4/5] relative bg-muted">
                        <img
                          src={template.image_url}
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation()
                              setPreviewTemplate(template)
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Preview
                          </Button>
                        </div>

                        {/* Selected indicator */}
                        {selectedTemplate?.id === template.id && (
                          <div className="absolute top-2 right-2 p-1.5 rounded-full bg-primary text-primary-foreground">
                            <Check className="h-4 w-4" />
                          </div>
                        )}

                        {/* Vertical badge */}
                        {isVerticalMatch(template) ? (
                          <Badge
                            variant="default"
                            className="absolute bottom-2 left-2 text-xs bg-primary"
                          >
                            Recommended
                          </Badge>
                        ) : !template.vertical_id ? (
                          <Badge
                            variant="secondary"
                            className="absolute bottom-2 left-2 text-xs"
                          >
                            General
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="absolute bottom-2 left-2 text-xs bg-background/80"
                          >
                            Other vertical
                          </Badge>
                        )}
                      </div>

                      {/* Template info */}
                      <div className="p-2">
                        <p className="text-sm font-medium truncate" title={template.name}>
                          {template.name}
                        </p>
                        {(template.use_count ?? 0) > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Used {template.use_count} times
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No templates available for this vertical yet.</p>
              <p className="text-sm">You can upload templates from the Templates page.</p>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              {allAvailableTemplates.length > 0 && !selectedTemplate && (
                <Button variant="ghost" onClick={handleSkipTemplate}>
                  Skip Templates
                </Button>
              )}
              <Button onClick={onContinue}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              {previewTemplate?.description || 'Template preview'}
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="relative aspect-[4/5] max-h-[70vh] rounded-lg overflow-hidden bg-muted">
              <img
                src={previewTemplate.image_url}
                alt={previewTemplate.name}
                className="w-full h-full object-contain"
              />
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {previewTemplate?.width} x {previewTemplate?.height}px
              {previewTemplate && (previewTemplate.use_count ?? 0) > 0 && (
                <span className="ml-2">• Used {previewTemplate.use_count} times</span>
              )}
            </div>
            <Button
              onClick={() => {
                if (previewTemplate) {
                  onSelect(previewTemplate)
                  setPreviewTemplate(null)
                }
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              Use This Template
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
