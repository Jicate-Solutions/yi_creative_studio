/**
 * AI Form Suggestion Types
 * Types for the adaptive form auto-fill feature
 */

export interface FieldSuggestion {
  value: string
  confidence: number // 0.0 - 1.0
  reasoning?: string // Optional explanation for debugging
}

export interface SuggestFieldsRequest {
  title: string
  verticalSlug: string
  organizationId: string
  organizationType: string
  existingFields?: {
    date?: string
    time?: string
    venue?: string
    speaker?: string
    description?: string
  }
  targetFields?: SuggestableField[]
}

export interface SuggestFieldsResponse {
  success: true
  suggestions: {
    date?: FieldSuggestion
    time?: FieldSuggestion
    venue?: FieldSuggestion
    speaker?: FieldSuggestion
    description?: FieldSuggestion
  }
  metadata: {
    model: string
    processingTimeMs: number
    cached: boolean
  }
}

export interface SuggestFieldsError {
  success: false
  error: string
  code: 'UNAUTHORIZED' | 'RATE_LIMITED' | 'AI_ERROR' | 'VALIDATION_ERROR' | 'TIMEOUT'
}

export type SuggestFieldsResult = SuggestFieldsResponse | SuggestFieldsError

export type SuggestableField = 'date' | 'time' | 'venue' | 'speaker' | 'description'

export interface AIFormState {
  suggestions: Record<SuggestableField, FieldSuggestion | null>
  isLoadingSuggestions: boolean
  suggestionError: string | null
  hasPendingSuggestions: boolean
}

export interface AIFormActions {
  requestSuggestions: (title: string, verticalSlug: string) => Promise<void>
  acceptSuggestion: (field: SuggestableField) => void
  dismissSuggestion: (field: SuggestableField) => void
  acceptAllSuggestions: () => void
  dismissAllSuggestions: () => void
  clearSuggestions: () => void
}

// Suggestion config constants
export const SUGGESTION_CONFIG = {
  minTitleLength: 5,
  debounceMs: 800,
  timeoutMs: 8000,
  rateLimitPerMinute: 20,
  cacheMinutes: 5,
} as const

// Field labels for UI
export const FIELD_LABELS: Record<SuggestableField, string> = {
  date: 'Event Date',
  time: 'Event Time',
  venue: 'Venue',
  speaker: 'Speaker/Guest',
  description: 'Additional Details',
}
