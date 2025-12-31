/**
 * Typography Suggestions Hook
 * Manages AI-powered font recommendation state and API calls
 */

import { useState, useCallback, useRef } from 'react'
import { useCreativeStore } from '@/stores/creative-store'
import type {
  TypographySuggestion,
  TypographySuggestionRequest,
  TypographySuggestionResponse,
  TypographyContext,
} from '@/types/typography-suggestions'

/**
 * Debounce delay for API requests (prevent spam)
 */
const DEBOUNCE_DELAY = 500 // 500ms

/**
 * Hook for managing typography suggestions
 */
export function useTypographySuggestions() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<TypographySuggestion | null>(null)

  // Debounce timer ref
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  // AbortController for canceling requests
  const abortController = useRef<AbortController | null>(null)

  /**
   * Request typography suggestions from API
   * Debounced to prevent spam
   */
  const requestSuggestions = useCallback(async (context: TypographyContext) => {
    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort()
    }

    // Debounce API call
    debounceTimer.current = setTimeout(async () => {
      try {
        setIsGenerating(true)
        setError(null)

        // Create new AbortController for this request
        abortController.current = new AbortController()

        const requestBody: TypographySuggestionRequest = {
          context,
        }

        const response = await fetch('/api/suggest-typography', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: abortController.current.signal,
        })

        if (!response.ok) {
          // Try to extract error message from API response
          let errorMessage = 'Failed to fetch typography suggestions'
          try {
            const errorData = await response.json()
            if (errorData.error) {
              errorMessage = errorData.error
            }
          } catch {
            // If JSON parse fails, use status-specific messages
          }

          if (response.status === 401) {
            throw new Error('Please log in to use AI typography suggestions')
          }
          if (response.status === 400) {
            throw new Error(`Invalid request: ${errorMessage}`)
          }
          if (response.status === 429) {
            throw new Error('Too many requests. Please wait a moment and try again.')
          }
          if (response.status === 500) {
            throw new Error(`AI service error: ${errorMessage}`)
          }
          if (response.status === 504) {
            throw new Error('Request timeout. Please try again.')
          }
          throw new Error(errorMessage)
        }

        const data: TypographySuggestionResponse = await response.json()

        if (!data.success || !data.data) {
          throw new Error(data.error || 'Invalid response from server')
        }

        setSuggestions(data.data)
        setError(null)
      } catch (err) {
        // Ignore abort errors (user-initiated cancellations)
        if (err instanceof Error && err.name === 'AbortError') {
          return
        }

        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
        setError(errorMessage)
        setSuggestions(null)
        console.error('Typography suggestions error:', err)
      } finally {
        setIsGenerating(false)
      }
    }, DEBOUNCE_DELAY)
  }, [])

  /**
   * Apply suggestions to the creative store
   * Updates typography configuration with AI-suggested fonts
   */
  const applySuggestions = useCallback(() => {
    if (!suggestions) {
      console.warn('No suggestions to apply')
      return
    }

    const store = useCreativeStore.getState()

    // Apply suggestions via store action
    store.applyTypographySuggestions()

    // Clear local suggestions after applying
    setSuggestions(null)
  }, [suggestions])

  /**
   * Dismiss current suggestions without applying
   */
  const dismissSuggestions = useCallback(() => {
    setSuggestions(null)
    setError(null)
  }, [])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * Cancel ongoing request
   */
  const cancelRequest = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
      debounceTimer.current = null
    }
    if (abortController.current) {
      abortController.current.abort()
      abortController.current = null
    }
    setIsGenerating(false)
  }, [])

  return {
    /** Whether suggestions are currently being generated */
    isGenerating,
    /** Current error message (null if no error) */
    error,
    /** Current typography suggestions (null if none) */
    suggestions,
    /** Request new typography suggestions */
    requestSuggestions,
    /** Apply current suggestions to the creative */
    applySuggestions,
    /** Dismiss current suggestions */
    dismissSuggestions,
    /** Clear error state */
    clearError,
    /** Cancel ongoing request */
    cancelRequest,
  }
}

/**
 * Build typography context from creative store state
 * Helper function to extract context from current form data
 */
export function buildTypographyContextFromStore(): TypographyContext | null {
  const store = useCreativeStore.getState()
  const { selectedFormat, formData, selectedVertical } = store

  if (!selectedFormat || !selectedVertical) {
    console.warn('[Typography] Cannot build context: missing format or vertical', {
      hasFormat: !!selectedFormat,
      hasVertical: !!selectedVertical,
    })
    return null
  }

  const selectedFormatId = selectedFormat.id

  // Validate form data exists
  if (!formData || !formData.formData || Object.keys(formData.formData).length === 0) {
    console.warn('[Typography] Cannot build context: form data is empty')
    return null
  }

  // Extract event type from form data
  const dynamicFormData = formData.formData
  const eventType = (dynamicFormData?.eventName as string) || (dynamicFormData?.title as string) || (dynamicFormData?.eventType as string) || 'Event'

  // Extract audience if available
  const audience = (dynamicFormData?.audience as string) || (dynamicFormData?.targetAudience as string)

  // Extract brand colors if available
  const brandColors: string[] = []
  const customColors = store.formData?.designData?.colorConfig?.customColors
  if (customColors?.primary) brandColors.push(customColors.primary)
  if (customColors?.secondary) brandColors.push(customColors.secondary)
  if (customColors?.accent) brandColors.push(customColors.accent)

  // Check if speaker photo exists
  const hasSpeakerPhoto = !!formData.designData?.customization?.speakerPhoto?.enabled

  return {
    eventType,
    verticalSlug: selectedVertical.slug,
    formatId: selectedFormatId,
    audience,
    brandColors: brandColors.length > 0 ? brandColors : undefined,
    hasSpeakerPhoto,
    // formData removed - not used by typography prompt builder
    // (was passing entire Zustand store with non-serializable data)
  }
}
