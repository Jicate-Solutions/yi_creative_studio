'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles, Loader2 } from 'lucide-react'
import { GenerateSummaryCard } from '@/components/create/generate-summary-card'
import { useCreativeStore } from '@/stores/creative-store'

interface ReviewSummaryPanelProps {
  onBackToEdit: () => void
  onGenerate?: () => void
  isGenerating?: boolean
  isFormValid?: boolean
}

export function ReviewSummaryPanel({
  onBackToEdit,
  onGenerate,
  isGenerating = false,
  isFormValid = true,
}: ReviewSummaryPanelProps) {
  const { selectedFormat, selectedVertical, formData, updateFormData } = useCreativeStore()

  const handleEditField = (fieldId: string, value: unknown) => {
    updateFormData({ [fieldId]: value })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Back button header */}
      <div className="flex-none px-3 py-2 border-b bg-card/50 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToEdit}
          className="h-8 gap-2 text-xs"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Edit
        </Button>
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground/60 pr-1">
          Review & Confirm
        </span>
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

      {/* Generate button — only shown when onGenerate prop is provided (mobile) */}
      {onGenerate && (
        <div className="flex-none px-4 py-4 border-t bg-card/95 backdrop-blur-sm">
          <Button
            onClick={onGenerate}
            disabled={isGenerating || !isFormValid}
            className="w-full h-12 gap-2.5 text-sm font-bold bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 hover:from-violet-700 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all duration-150 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Creative
              </>
            )}
          </Button>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            Takes 30–60 seconds · uses 1 credit
          </p>
        </div>
      )}
    </div>
  )
}
