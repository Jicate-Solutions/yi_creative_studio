'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles, Loader2, Zap, Paintbrush, Palette, Eye } from 'lucide-react'
import { GenerateSummaryCard } from '@/components/create/generate-summary-card'
import { useCreativeStore } from '@/stores/creative-store'
import { BACKGROUND_STYLES } from '@/lib/config/background-styles'
import type { AIModel } from '@/types/database.types'

interface ReviewSummaryPanelProps {
  onBackToEdit: () => void
  onGenerate?: () => void
  isGenerating?: boolean
  isFormValid?: boolean
  selectedModel?: AIModel | null
  resolution?: string
}

export function ReviewSummaryPanel({
  onBackToEdit,
  onGenerate,
  isGenerating = false,
  isFormValid = true,
  selectedModel,
  resolution,
}: ReviewSummaryPanelProps) {
  const { selectedFormat, selectedVertical, formData, updateFormData } = useCreativeStore()

  const handleEditField = (fieldId: string, value: unknown) => {
    updateFormData({ [fieldId]: value })
  }

  // Settings to display
  const fields = formData.formData as Record<string, unknown>
  const colorConfig = formData.designData?.colorConfig as unknown as Record<string, unknown> | undefined
  const isBrandMode = colorConfig?.useBrandColors !== false && colorConfig?.selectedPalette !== 'custom'
  const customColors = colorConfig?.customColors as { primary?: string; secondary?: string; accent?: string } | undefined

  const styleStack = Array.isArray(fields.styleStack) ? (fields.styleStack as string[]) : []
  const styleMixLabel =
    styleStack.length === 0
      ? 'AI Auto'
      : styleStack.length === 1
        ? (BACKGROUND_STYLES.find((s) => s.id === styleStack[0])?.label ?? styleStack[0])
        : styleStack.map((id) => BACKGROUND_STYLES.find((s) => s.id === id)?.label ?? id).join(' + ')

  const visualIdea = String(fields.userVisualIdea ?? '').trim()
  const modeLabel = (formData.creationMode || 'scratch') === 'template' ? 'Template' : 'AI Create'

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-none px-3 py-2 border-b border-border/40 bg-card/50 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBackToEdit} className="h-8 gap-1.5 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" />
          Edit
        </Button>
        <span className="text-xs font-semibold text-foreground/70">Review & Generate</span>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── Settings summary ── */}
        <div className="px-3 pt-3 pb-2">
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden">

            {/* Format + Mode */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border/20">
              <Eye className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground/50 font-medium leading-none mb-0.5">Format</p>
                <p className="text-sm font-semibold text-foreground/90">
                  {selectedFormat?.label || 'Event Poster'}
                  <span className="ml-1.5 text-[11px] font-normal text-muted-foreground/60">· {modeLabel}</span>
                </p>
              </div>
            </div>

            {/* Model + Resolution */}
            {selectedModel && (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border/20">
                <Zap className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground/50 font-medium leading-none mb-0.5">AI Model</p>
                  <p className="text-sm font-semibold text-foreground/90">
                    {selectedModel.name}
                    {resolution && <span className="ml-1.5 text-[11px] font-normal text-muted-foreground/60">· {resolution}</span>}
                  </p>
                </div>
              </div>
            )}

            {/* Visual Style */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border/20">
              <Paintbrush className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground/50 font-medium leading-none mb-0.5">Visual Style</p>
                <p className="text-sm font-semibold text-foreground/90">{styleMixLabel}</p>
              </div>
            </div>

            {/* Colors */}
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-border/20">
              <Palette className="h-4 w-4 text-muted-foreground/50 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-muted-foreground/50 font-medium leading-none mb-0.5">Colors</p>
                {isBrandMode ? (
                  <p className="text-sm font-semibold text-foreground/90">Brand colors</p>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {customColors?.primary && (
                      <div className="h-5 w-5 rounded border border-border/50 shrink-0" style={{ backgroundColor: customColors.primary }} />
                    )}
                    {customColors?.secondary && (
                      <div className="h-5 w-5 rounded border border-border/50 shrink-0" style={{ backgroundColor: customColors.secondary }} />
                    )}
                    {customColors?.accent && (
                      <div className="h-5 w-5 rounded border border-border/50 shrink-0" style={{ backgroundColor: customColors.accent }} />
                    )}
                    <span className="text-sm font-semibold text-foreground/90">Custom</span>
                  </div>
                )}
              </div>
            </div>

            {/* Your Visual Idea — only when filled */}
            {visualIdea ? (
              <div className="flex items-start gap-2.5 px-3.5 py-2.5">
                <Sparkles className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground/50 font-medium leading-none mb-0.5">Your Visual Idea</p>
                  <p className="text-sm text-foreground/90 leading-snug">{visualIdea}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 px-3.5 py-2.5">
                <Sparkles className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-muted-foreground/50 font-medium leading-none mb-0.5">Your Visual Idea</p>
                  <p className="text-sm text-muted-foreground/40 italic">Not set — AI will choose freely</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Event Details ── */}
        <div className="px-3 pb-3">
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

      {/* Generate button — mobile only */}
      {onGenerate && (
        <div className="flex-none px-4 py-4 border-t border-border/40 bg-card/95 backdrop-blur-sm">
          <Button
            onClick={onGenerate}
            disabled={isGenerating || !isFormValid}
            className="w-full h-12 gap-2.5 text-sm font-bold bg-gradient-to-r from-violet-600 via-purple-500 to-indigo-500 hover:from-violet-700 hover:via-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-violet-500/25 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 rounded-xl"
          >
            {isGenerating
              ? <><Loader2 className="h-4 w-4 animate-spin" />Generating…</>
              : <><Sparkles className="h-4 w-4" />Generate Creative</>
            }
          </Button>
          <p className="text-center text-[10px] text-muted-foreground mt-2">
            Takes 30–60 seconds · uses 1 credit
          </p>
        </div>
      )}
    </div>
  )
}
