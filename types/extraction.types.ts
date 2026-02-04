/**
 * Types for Smart Paste / AI Field Extraction feature
 * Allows users to paste raw event text and auto-extract structured fields
 */

// Extractable field IDs (canonical names used across the app)
export const EXTRACTABLE_FIELDS = [
  'eventName',
  'eventTitle',
  'eventTagline',
  'eventDate',
  'eventTime',
  'eventEndTime',
  'venue',
  'eventDescription',
  'registrationInfo',
  'contactNumber',
  'contactEmail',
  'websiteUrl',
  'organizationName',
  'targetAudience',
  'additionalDetails',
] as const

export type ExtractableFieldId = (typeof EXTRACTABLE_FIELDS)[number]

// Human-readable labels for extracted fields
export const FIELD_LABELS: Record<string, string> = {
  eventName: 'Event Name',
  eventTitle: 'Event Title',
  eventTagline: 'Tagline / Subtitle',
  eventDate: 'Event Date',
  eventTime: 'Start Time',
  eventEndTime: 'End Time',
  venue: 'Venue / Location',
  eventDescription: 'Description',
  registrationInfo: 'Registration Info',
  contactNumber: 'Contact Number',
  contactEmail: 'Contact Email',
  websiteUrl: 'Website URL',
  organizationName: 'Organization Name',
  targetAudience: 'Target Audience',
  additionalDetails: 'Additional Details',
}

// Single extracted field with confidence
export interface ExtractedField {
  fieldId: string
  label: string
  value: string
  confidence: number // 0.0 - 1.0
  source?: string // Original text snippet that was parsed
  needsReview?: boolean // Flag for low-confidence values
}

// Extracted speaker info
export interface ExtractedSpeaker {
  name: string
  designation?: string
  organization?: string
  confidence: number
}

// Successful extraction result
export interface ExtractionResult {
  success: true
  fields: ExtractedField[]
  speakers: ExtractedSpeaker[]
  metadata: {
    model: string
    processingTimeMs: number
    rawTextLength: number
    confidence: number // Overall confidence
  }
  warnings?: string[] // e.g., "Date appears to be in the past"
}

// API request body
export interface ExtractFieldsRequest {
  rawText: string
  verticalSlug?: string
  formatId?: string
  organizationId: string
}

// Error response
export interface ExtractFieldsError {
  success: false
  error: string
  code:
    | 'UNAUTHORIZED'
    | 'RATE_LIMITED'
    | 'AI_ERROR'
    | 'VALIDATION_ERROR'
    | 'TIMEOUT'
    | 'TEXT_TOO_SHORT'
}

export type ExtractFieldsResponse = ExtractionResult | ExtractFieldsError

// Confidence thresholds for UI display
export const CONFIDENCE_THRESHOLDS = {
  HIGH: 0.8,
  MEDIUM: 0.5,
  LOW: 0.3,
} as const

export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'not-found'

/**
 * Get confidence level category from numeric confidence
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= CONFIDENCE_THRESHOLDS.HIGH) return 'high'
  if (confidence >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium'
  if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'low'
  return 'not-found'
}

/**
 * Get display info for confidence level
 */
export function getConfidenceDisplay(level: ConfidenceLevel): {
  bg: string
  text: string
  border: string
  label: string
} {
  switch (level) {
    case 'high':
      return {
        bg: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
        label: 'High',
      }
    case 'medium':
      return {
        bg: 'bg-amber-100',
        text: 'text-amber-700',
        border: 'border-amber-200',
        label: 'Medium',
      }
    case 'low':
      return {
        bg: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
        label: 'Low',
      }
    case 'not-found':
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-500',
        border: 'border-gray-200',
        label: 'Not Found',
      }
  }
}

// Configuration
export const EXTRACTION_CONFIG = {
  minTextLength: 20,
  maxTextLength: 5000,
  timeoutMs: 12000,
  rateLimitPerMinute: 15,
} as const
