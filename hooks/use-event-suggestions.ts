'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useCreativeStore } from '@/stores/creative-store'
import type {
  SuggestFieldsRequest,
  SuggestFieldsResponse,
  SuggestFieldsError,
  SuggestableField,
} from '@/types/suggestions'
import { SUGGESTION_CONFIG } from '@/types/suggestions'

interface UseEventSuggestionsProps {
  organizationId: string
  organizationType: string
}

interface UseEventSuggestionsReturn {
  isLoading: boolean
  error: string | null
  hasSuggestions: boolean
  requestSuggestions: (title: string) => Promise<void>
  acceptSuggestion: (field: SuggestableField) => void
  dismissSuggestion: (field: SuggestableField) => void
  acceptAllSuggestions: () => void
  dismissAllSuggestions: () => void
  getSuggestion: (field: SuggestableField) => { value: string; confidence: number } | null
}

export function useEventSuggestions({
  organizationId,
  organizationType,
}: UseEventSuggestionsProps): UseEventSuggestionsReturn {
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // PERMANENT FIX: Track component mount status to prevent state updates after unmount
  const isMountedRef = useRef(true)

  // Set up mount tracking - cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false

      // Cancel any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }

      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  const {
    selectedVertical,
    formData,
    aiForm,
    setSuggestions,
    setLoadingSuggestions,
    setSuggestionError,
    acceptSuggestion: storeAcceptSuggestion,
    dismissSuggestion: storeDismissSuggestion,
    acceptAllSuggestions: storeAcceptAllSuggestions,
    dismissAllSuggestions: storeDismissAllSuggestions,
  } = useCreativeStore()

  const hasSuggestions = Object.values(aiForm.suggestions).some(
    (s) => s !== null && s !== undefined
  )

  const requestSuggestions = useCallback(
    async (title: string) => {
      // PERMANENT FIX: Early exit if component unmounted
      if (!isMountedRef.current) return

      // Clear any pending debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }

      // Abort any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      // Validate input
      if (!title || title.trim().length < SUGGESTION_CONFIG.minTitleLength) {
        if (isMountedRef.current) {
          setError('Title must be at least 5 characters')
        }
        return
      }

      if (!selectedVertical?.slug) {
        if (isMountedRef.current) {
          setError('Please select a vertical first')
        }
        return
      }

      // Debounce the request
      return new Promise<void>((resolve) => {
        debounceRef.current = setTimeout(async () => {
          // PERMANENT FIX: Check mount status before starting async operation
          if (!isMountedRef.current) {
            resolve()
            return
          }

          setError(null)
          setLoadingSuggestions(true)

          // Create new abort controller
          abortControllerRef.current = new AbortController()

          try {
            // Build existing fields from current form data
            const existingFields: SuggestFieldsRequest['existingFields'] = {}
            const fd = formData.formData as Record<string, unknown>

            if (fd.date && typeof fd.date === 'string') existingFields.date = fd.date
            if (fd.time && typeof fd.time === 'string') existingFields.time = fd.time
            if (fd.venue && typeof fd.venue === 'string') existingFields.venue = fd.venue
            if (fd.speaker && typeof fd.speaker === 'string') existingFields.speaker = fd.speaker
            if (fd.description && typeof fd.description === 'string')
              existingFields.description = fd.description

            const request: SuggestFieldsRequest = {
              title: title.trim(),
              verticalSlug: selectedVertical.slug,
              organizationId,
              organizationType,
              existingFields:
                Object.keys(existingFields).length > 0 ? existingFields : undefined,
            }

            const response = await fetch('/api/suggest-fields', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(request),
              signal: abortControllerRef.current.signal,
            })

            // PERMANENT FIX: Check mount status after async operation
            if (!isMountedRef.current) {
              resolve()
              return
            }

            // Check content type to avoid parsing HTML as JSON
            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
              // If not authenticated, redirect to login
              if (response.status === 401 || response.status === 403) {
                throw new Error('Session expired. Please log in again.')
              }
              throw new Error('Server returned an invalid response. Please try again.')
            }

            const data: SuggestFieldsResponse | SuggestFieldsError = await response.json()

            if (!data.success) {
              const errorData = data as SuggestFieldsError
              throw new Error(errorData.error || 'Failed to get suggestions')
            }

            // PERMANENT FIX: Check mount status before updating state
            if (isMountedRef.current) {
              const successData = data as SuggestFieldsResponse
              setSuggestions(successData.suggestions)
              setError(null)
            }
          } catch (err) {
            if (err instanceof Error) {
              if (err.name === 'AbortError') {
                // Request was cancelled, ignore
                resolve()
                return
              }
              // PERMANENT FIX: Check mount status before error state update
              if (isMountedRef.current) {
                setError(err.message)
                setSuggestionError(err.message)
              }
            } else {
              if (isMountedRef.current) {
                setError('An unexpected error occurred')
                setSuggestionError('An unexpected error occurred')
              }
            }
          } finally {
            // PERMANENT FIX: Check mount status before final state update
            if (isMountedRef.current) {
              setLoadingSuggestions(false)
            }
            resolve()
          }
        }, SUGGESTION_CONFIG.debounceMs)
      })
    },
    [
      organizationId,
      organizationType,
      selectedVertical,
      formData,
      setSuggestions,
      setLoadingSuggestions,
      setSuggestionError,
    ]
  )

  const getSuggestion = useCallback(
    (field: SuggestableField) => {
      const suggestion = aiForm.suggestions[field]
      if (!suggestion) return null
      return { value: suggestion.value, confidence: suggestion.confidence }
    },
    [aiForm.suggestions]
  )

  const acceptSuggestion = useCallback(
    (field: SuggestableField) => {
      storeAcceptSuggestion(field)
    },
    [storeAcceptSuggestion]
  )

  const dismissSuggestion = useCallback(
    (field: SuggestableField) => {
      storeDismissSuggestion(field)
    },
    [storeDismissSuggestion]
  )

  const acceptAllSuggestions = useCallback(() => {
    storeAcceptAllSuggestions()
  }, [storeAcceptAllSuggestions])

  const dismissAllSuggestions = useCallback(() => {
    storeDismissAllSuggestions()
  }, [storeDismissAllSuggestions])

  return {
    // PERMANENT FIX: Consolidated loading state - use only store's loading state
    // This eliminates dual loading state sources that caused sync issues
    isLoading: aiForm.isLoadingSuggestions,
    error: error || aiForm.suggestionError,
    hasSuggestions,
    requestSuggestions,
    acceptSuggestion,
    dismissSuggestion,
    acceptAllSuggestions,
    dismissAllSuggestions,
    getSuggestion,
  }
}
