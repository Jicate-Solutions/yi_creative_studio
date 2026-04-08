'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCreativeStore } from '@/stores/creative-store'
import type {
  ExtractFieldsRequest,
  ExtractionResult,
  ExtractFieldsError,
  ExtractedField,
  ExtractedSpeaker,
} from '@/types/extraction.types'
import { EXTRACTION_CONFIG } from '@/types/extraction.types'
import { mapExtractionFieldId } from '@/lib/utils/field-extraction-mapping'

interface UseFieldExtractionProps {
  organizationId: string
}

interface UseFieldExtractionReturn {
  isExtracting: boolean
  extractionError: string | null
  extractionResult: ExtractionResult | null
  extractFields: (
    rawText: string,
    verticalSlug?: string,
    formatId?: string
  ) => Promise<void>
  applyExtractedFields: (selectedFieldIds?: string[]) => void
  applyExtractedSpeakers: () => void
  clearExtraction: () => void
  editExtractedField: (fieldId: string, newValue: string) => void
}

export function useFieldExtraction({
  organizationId,
}: UseFieldExtractionProps): UseFieldExtractionReturn {
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractionError, setExtractionError] = useState<string | null>(null)
  const [extractionResult, setExtractionResult] =
    useState<ExtractionResult | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  // Track component mount status
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false

      // Abort any ongoing request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  const { updateFormData, updateCustomization, formData } = useCreativeStore()

  /**
   * Extract fields from raw text using AI
   */
  const extractFields = useCallback(
    async (rawText: string, verticalSlug?: string, formatId?: string) => {
      if (!isMountedRef.current) return

      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Validate input
      if (
        !rawText ||
        rawText.trim().length < EXTRACTION_CONFIG.minTextLength
      ) {
        if (isMountedRef.current) {
          setExtractionError(
            `Please provide at least ${EXTRACTION_CONFIG.minTextLength} characters of text`
          )
        }
        return
      }

      setIsExtracting(true)
      setExtractionError(null)
      abortControllerRef.current = new AbortController()

      try {
        const response = await fetch('/api/extract-fields', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rawText: rawText.trim(),
            verticalSlug,
            formatId,
            organizationId,
          } as ExtractFieldsRequest),
          signal: abortControllerRef.current.signal,
        })

        if (!isMountedRef.current) return

        const data = await response.json()

        if (!data.success) {
          setExtractionError((data as ExtractFieldsError).error)
          setExtractionResult(null)
          return
        }

        setExtractionResult(data as ExtractionResult)
        setExtractionError(null)
      } catch (err) {
        if (!isMountedRef.current) return

        if (err instanceof Error && err.name === 'AbortError') {
          // Request was aborted, don't set error
          return
        }

        setExtractionError(
          err instanceof Error ? err.message : 'Failed to extract fields'
        )
        setExtractionResult(null)
      } finally {
        if (isMountedRef.current) {
          setIsExtracting(false)
        }
      }
    },
    [organizationId]
  )

  /**
   * Apply extracted fields to the form
   * @param selectedFieldIds - Optional array of field IDs to apply. If not provided, applies all fields.
   */
  const applyExtractedFields = useCallback(
    (selectedFieldIds?: string[]) => {
      if (!extractionResult) return

      const fieldsToApply = selectedFieldIds
        ? extractionResult.fields.filter((f) =>
            selectedFieldIds.includes(f.fieldId)
          )
        : extractionResult.fields

      const updates: Record<string, unknown> = {}
      const updateConfidence: Record<string, number> = {}

      fieldsToApply.forEach((field) => {
        const targetFieldId = mapExtractionFieldId(field.fieldId)
        // Dedup: keep the highest-confidence value when multiple extracted fields
        // map to the same form field (e.g. eventName + eventTitle → both → 'eventName')
        if (!updates[targetFieldId] || field.confidence > (updateConfidence[targetFieldId] ?? 0)) {
          updates[targetFieldId] = field.value
          updateConfidence[targetFieldId] = field.confidence
        }
      })

      updateFormData(updates)
    },
    [extractionResult, updateFormData]
  )

  /**
   * Apply extracted speakers to the form's speaker configuration.
   * Uses updateCustomization (not updateFormData) so data lands in
   * formData.designData.customization.speakerPhoto — the correct location
   * that the generation pipeline reads from (originalSpeakerPhotoConfig).
   */
  const applyExtractedSpeakers = useCallback(() => {
    if (!extractionResult?.speakers?.length) return

    const speakerItems = extractionResult.speakers.map((s) => ({
      id: crypto.randomUUID(),
      name: s.name,
      designation: s.designation || '',
      photoUrl: undefined as string | undefined,
    }))

    // Preserve existing speaker photo settings (shape, size, border, etc.)
    const currentSpeakerConfig = formData.designData?.customization?.speakerPhoto || {}

    updateCustomization({
      speakerPhoto: {
        ...currentSpeakerConfig,
        speakers: speakerItems,
        enabled: speakerItems.length > 0,
      },
    })
  }, [extractionResult, formData.designData?.customization?.speakerPhoto, updateCustomization])

  /**
   * Clear extraction result and error
   */
  const clearExtraction = useCallback(() => {
    setExtractionResult(null)
    setExtractionError(null)
  }, [])

  /**
   * Edit an extracted field value before applying
   */
  const editExtractedField = useCallback(
    (fieldId: string, newValue: string) => {
      if (!extractionResult) return

      setExtractionResult({
        ...extractionResult,
        fields: extractionResult.fields.map((f) =>
          f.fieldId === fieldId ? { ...f, value: newValue } : f
        ),
      })
    },
    [extractionResult]
  )

  return {
    isExtracting,
    extractionError,
    extractionResult,
    extractFields,
    applyExtractedFields,
    applyExtractedSpeakers,
    clearExtraction,
    editExtractedField,
  }
}
