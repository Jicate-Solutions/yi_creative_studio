'use client'

import { useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { SmartPasteInput, ExtractionPreview } from '@/components/create/smart-paste'
import { useFieldExtraction } from '@/hooks/use-field-extraction'
import { useCreativeStore } from '@/stores/creative-store'
import { toast } from 'sonner'
import { Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SmartPasteSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  verticalSlug?: string
  formatId?: string
}

export function SmartPasteSheet({
  open,
  onOpenChange,
  organizationId,
  verticalSlug,
  formatId,
}: SmartPasteSheetProps) {
  const { updateFormData, updateCustomization } = useCreativeStore()

  const {
    isExtracting,
    extractionError,
    extractionResult,
    extractFields,
    clearExtraction,
    editExtractedField,
  } = useFieldExtraction({ organizationId })

  // Handle extraction request
  const handleExtract = useCallback(
    async (text: string) => {
      await extractFields(text, verticalSlug, formatId)
    },
    [extractFields, verticalSlug, formatId]
  )

  // Map extraction field IDs to form field IDs
  const mapFieldId = (extractionFieldId: string): string => {
    const fieldMappings: Record<string, string[]> = {
      eventName: ['eventName', 'eventTitle', 'title'],
      eventTitle: ['eventTitle', 'eventName', 'title'],
      eventDate: ['eventDate', 'date'],
      eventTime: ['eventTime', 'time'],
      eventEndTime: ['eventEndTime', 'endTime'],
      venue: ['venue', 'eventVenue', 'location'],
      eventDescription: ['eventDescription', 'description'],
      eventTagline: ['eventTagline', 'tagline', 'subtitle'],
      registrationInfo: ['registrationInfo', 'registrationUrl'],
      contactNumber: ['contactNumber', 'contact', 'phone'],
      contactEmail: ['contactEmail', 'email'],
      websiteUrl: ['websiteUrl', 'website'],
      organizationName: ['organizationName', 'organization'],
      targetAudience: ['targetAudience', 'audience'],
      additionalDetails: ['additionalDetails', 'details'],
    }

    // Return the first form field that exists, or the original ID
    const alternatives = fieldMappings[extractionFieldId] || [extractionFieldId]
    return alternatives[0]
  }

  // Apply selected extracted fields (merge with existing formData)
  const handleApply = useCallback(
    (selectedFieldIds: string[]) => {
      if (!extractionResult) return

      const updates: Record<string, string> = {}

      for (const fieldId of selectedFieldIds) {
        const field = extractionResult.fields.find((f) => f.fieldId === fieldId)
        if (field?.value) {
          const formFieldId = mapFieldId(field.fieldId)
          updates[formFieldId] = field.value
        }
      }

      // Merge with existing form data (only overwrite extracted fields)
      updateFormData(updates)

      const count = Object.keys(updates).length
      toast.success(`Applied ${count} field${count !== 1 ? 's' : ''} to form`)

      // Clear extraction and close sheet
      clearExtraction()
      onOpenChange(false)
    },
    [extractionResult, updateFormData, clearExtraction, onOpenChange]
  )

  // Apply extracted speakers to speaker photo customization
  const handleApplySpeakers = useCallback(() => {
    if (!extractionResult?.speakers || extractionResult.speakers.length === 0) return

    const speakerPhotos = extractionResult.speakers.map((speaker) => ({
      id: crypto.randomUUID(),
      name: speaker.name,
      designation: speaker.designation || '',
    }))

    updateCustomization({
      speakerPhoto: {
        enabled: true,
        speakers: speakerPhotos,
        shape: 'circle',
        size: 200,
        border: { width: 3, color: '#005B96' },
        shadow: true,
        position: 'center',
        verticalPosition: 'middle',
        layoutMode: 'auto',
        spacing: 20,
      },
    })

    toast.success(`Added ${speakerPhotos.length} speaker${speakerPhotos.length !== 1 ? 's' : ''}`)
  }, [extractionResult, updateCustomization])

  // Cancel and clear extraction
  const handleCancel = useCallback(() => {
    clearExtraction()
  }, [clearExtraction])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto p-0 border-l-0"
      >
        {/* Custom Header with Gradient */}
        <SheetHeader className="sticky top-0 z-10 bg-background">
          <div className="relative overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700" />

            {/* Animated Pattern Overlay */}
            <div className="absolute inset-0 opacity-10">
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            </div>

            {/* Header Content */}
            <div className="relative px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <SheetTitle className="text-lg font-bold text-white">Smart Paste</SheetTitle>
                    <p className="text-sm text-white/80">
                      AI-powered field extraction
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Bottom Wave */}
            <svg
              className="absolute bottom-0 left-0 right-0 w-full"
              viewBox="0 0 400 20"
              preserveAspectRatio="none"
              style={{ height: '12px' }}
            >
              <path
                d="M0,20 Q100,0 200,10 T400,20 L400,20 L0,20 Z"
                className="fill-background"
              />
            </svg>
          </div>
        </SheetHeader>

        {/* Content */}
        <div className="p-6">
          {extractionResult ? (
            <ExtractionPreview
              result={extractionResult}
              onApply={handleApply}
              onApplySpeakers={handleApplySpeakers}
              onCancel={handleCancel}
              onEditField={editExtractedField}
            />
          ) : (
            <SmartPasteInput
              onExtract={handleExtract}
              isExtracting={isExtracting}
              error={extractionError}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
