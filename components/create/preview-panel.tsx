'use client'

import { useCreativeStore } from '@/stores/creative-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Eye, Image as ImageIcon, Sparkles, Calendar, MapPin, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PreviewPanelProps {
  className?: string
  isGenerating?: boolean
  generatedImage?: string | null
}

// Type for form field values
interface FormFieldValues {
  title?: string
  date?: string
  time?: string
  venue?: string
  speaker?: string
  description?: string
}

export function PreviewPanel({ className, isGenerating, generatedImage }: PreviewPanelProps) {
  const { formData, selectedTemplate, selectedVertical } = useCreativeStore()

  // Extract form field values with proper typing
  const fieldValues = formData.formData as FormFieldValues

  return (
    <Card className={cn('sticky top-24', className)}>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Eye className="h-4 w-4 text-muted-foreground" />
          Live Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pb-4">
        {/* Preview Image Area */}
        <div className="aspect-square rounded-xl bg-gradient-to-br from-muted/50 to-muted border-2 border-dashed border-muted-foreground/20 flex items-center justify-center overflow-hidden relative">
          {/* Check generatedImage first - if image exists, show it immediately */}
          {generatedImage ? (
            <img
              src={generatedImage}
              alt="Generated poster"
              className="w-full h-full object-contain"
            />
          ) : isGenerating ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
              <div className="relative">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">Generating your poster...</p>
              <div className="flex gap-1 mt-2">
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-2 h-2 bg-primary rounded-full animate-bounce" />
              </div>
            </div>
          ) : selectedTemplate ? (
            <img
              src={selectedTemplate.image_url}
              alt="Template preview"
              className="w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="text-center text-muted-foreground p-6">
              <div className="w-16 h-16 rounded-full bg-muted-foreground/10 flex items-center justify-center mx-auto mb-3">
                <ImageIcon className="h-8 w-8 opacity-50" />
              </div>
              <p className="text-sm font-medium">Preview will appear here</p>
              <p className="text-xs mt-1 opacity-70">
                Select a template or start designing
              </p>
            </div>
          )}

          {/* Template overlay indicator */}
          {selectedTemplate && !generatedImage && !isGenerating && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-background/90 backdrop-blur-sm rounded-lg p-2 text-xs">
                <p className="font-medium truncate">{selectedTemplate.name}</p>
                <p className="text-muted-foreground">
                  {selectedTemplate.width} × {selectedTemplate.height}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Quick Info Section */}
        <div className="space-y-2">
          {/* Selected Options */}
          <div className="flex flex-wrap gap-1">
            {selectedVertical && (
              <Badge variant="default" className="text-xs">
                {selectedVertical.name}
              </Badge>
            )}
            {formData.creationMode && (
              <Badge variant="secondary" className="text-xs">
                {formData.creationMode === 'template' ? 'Template' : 'From Scratch'}
              </Badge>
            )}
            {formData.logosPlacements.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {formData.logosPlacements.length} Logo{formData.logosPlacements.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Event Details Summary */}
          {(fieldValues.title || fieldValues.date || fieldValues.venue) && (
            <div className="bg-muted/50 rounded-lg p-2 space-y-1">
              {fieldValues.title && (
                <p className="font-medium text-xs line-clamp-1">{fieldValues.title}</p>
              )}
              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {fieldValues.date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {fieldValues.date}
                  </span>
                )}
                {fieldValues.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {fieldValues.venue}
                  </span>
                )}
                {fieldValues.speaker && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {fieldValues.speaker}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Generation Stats (when generated) */}
        {generatedImage && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>AI Generated</span>
              <Badge variant="outline" className="text-[10px] py-0 h-5">
                <Sparkles className="h-2.5 w-2.5 mr-1" />
                Ready to download
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Skeleton version for loading states
export function PreviewPanelSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn('sticky top-24', className)}>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-24" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="aspect-square rounded-xl" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-20 rounded-lg" />
      </CardContent>
    </Card>
  )
}
