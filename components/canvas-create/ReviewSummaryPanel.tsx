'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { GenerateSummaryCard } from '@/components/create/generate-summary-card'
import { useCreativeStore } from '@/stores/creative-store'

interface ReviewSummaryPanelProps {
  onBackToEdit: () => void
}

export function ReviewSummaryPanel({ onBackToEdit }: ReviewSummaryPanelProps) {
  const { selectedFormat, selectedVertical, formData, updateFormData } = useCreativeStore()

  const handleEditField = (fieldId: string, value: unknown) => {
    updateFormData({ [fieldId]: value })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back button header */}
      <div className="flex-none p-2 border-b bg-card/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToEdit}
          className="h-8 gap-2 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Edit
        </Button>
      </div>

      {/* Summary content */}
      <div className="flex-1 overflow-y-auto p-3">
        <GenerateSummaryCard
          formData={{
            formatId: selectedFormat?.id || null,
            formData: formData.formData,
            aiFilledFields: formData.aiFilledFields,
            logosPlacements: formData.logosPlacements,
            designData: formData.designData,
            creationMode: formData.creationMode,
            enhanced4RowStrip: formData.enhanced4RowStrip,
          }}
          selectedFormat={selectedFormat}
          selectedVertical={selectedVertical}
          logos={[]}
          onEditField={handleEditField}
        />
      </div>
    </div>
  )
}
