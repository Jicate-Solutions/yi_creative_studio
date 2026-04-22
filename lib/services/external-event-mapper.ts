/**
 * External Event Mapper Service
 *
 * Maps external event data from various sources to Yi Studio form fields.
 * Handles field aliases, transformations, and validation warnings.
 */

import type {
  ExternalEvent,
  ExternalEventSpeaker,
  EventMappingResult,
  FieldMappingConfig,
  ExternalEventMeta,
  EventChangeDetectionResult,
  DynamicField,
  DynamicFieldType,
} from '@/types/external-event.types'
import type { CreativeFormatId } from '@/lib/config/creative-formats'
import { isFeatureEnabled } from '@/lib/config/feature-flags'

// ============================================================================
// Field Mapping Configuration
// ============================================================================

/**
 * Maps external event fields to Yi Studio form fields.
 * Based on the data mapping table in the PRD.
 *
 * @version 2.0 - Added virtual event, capacity, chapter, and guest policy mappings
 */
const FIELD_MAPPINGS: FieldMappingConfig[] = [
  // Core event details - Use CANONICAL field IDs from field-registry.ts
  { externalField: 'name', formField: 'eventName' },
  { externalField: 'eventType', formField: 'eventType' },

  // Date/Time - Use canonical IDs: eventDate, eventTime, eventEndTime
  { externalField: 'date', formField: 'eventDate' },
  {
    externalField: 'startTime',
    formField: 'eventTime',
    transform: formatTime24to12,
  },
  {
    externalField: 'endTime',
    formField: 'eventEndTime',
    transform: formatTime24to12,
  },

  // Location - venue is canonical
  { externalField: 'venue', formField: 'venue' },
  { externalField: 'venueAddress', formField: 'venueAddress' },
  { externalField: 'city', formField: 'city' },
  // v2.0: Venue GPS (for map QR code generation)
  { externalField: 'venueLatitude', formField: 'venueLatitude' },
  { externalField: 'venueLongitude', formField: 'venueLongitude' },
  { externalField: 'venueCapacity', formField: 'venueCapacity' },

  // v2.0: Virtual Event Support
  { externalField: 'isVirtual', formField: 'isVirtual' },
  { externalField: 'virtualMeetingLink', formField: 'meetingLink' },

  // Organization - organizationName is canonical
  { externalField: 'organizerName', formField: 'organizationName' },
  { externalField: 'organizationName', formField: 'organizationName' },
  // v2.0: Chapter info (fallback to organizationName if not set)
  { externalField: 'chapterName', formField: 'chapterName' },
  { externalField: 'chapterLocation', formField: 'chapterLocation' },

  // Content - Use canonical IDs: eventDescription, eventTagline
  { externalField: 'description', formField: 'eventDescription' },
  { externalField: 'tagline', formField: 'eventTagline' },
  // v2.0: Tags and featured flag
  {
    externalField: 'tags',
    formField: 'hashtags',
    transform: formatTagsToHashtags,
  },
  { externalField: 'isFeatured', formField: 'isFeatured' },

  // Registration - registrationInfo is canonical
  { externalField: 'registrationUrl', formField: 'registrationInfo' },
  { externalField: 'entryFee', formField: 'entryFee' },
  // v2.0: Capacity fields
  { externalField: 'registrationDeadline', formField: 'registrationDeadline' },
  { externalField: 'registrationStartDate', formField: 'registrationStartDate' },
  { externalField: 'maxCapacity', formField: 'maxCapacity' },
  { externalField: 'currentRegistrations', formField: 'currentRegistrations' },
  { externalField: 'waitlistEnabled', formField: 'waitlistEnabled' },

  // v2.0: Guest policy
  { externalField: 'allowGuests', formField: 'allowGuests' },
  { externalField: 'guestLimit', formField: 'guestLimit' },

  // Target audience
  { externalField: 'targetAudience', formField: 'targetAudience' },
]

/**
 * Human-readable labels for fields (used in change detection UI)
 *
 * @version 2.0 - Added virtual event, capacity, chapter, and guest policy labels
 */
const FIELD_LABELS: Record<string, string> = {
  // Core - Canonical IDs from field-registry.ts
  eventName: 'Event Name',
  eventType: 'Event Type',
  eventDate: 'Date',
  eventTime: 'Start Time',
  eventEndTime: 'End Time',
  venue: 'Venue',
  venueAddress: 'Venue Address',
  city: 'City',
  // v2.0: Venue GPS
  venueLatitude: 'Venue Latitude',
  venueLongitude: 'Venue Longitude',
  venueCapacity: 'Venue Capacity',
  // v2.0: Virtual event
  isVirtual: 'Virtual Event',
  meetingLink: 'Meeting Link',
  organizationName: 'Organization',
  // v2.0: Chapter info
  chapterName: 'Chapter Name',
  chapterLocation: 'Chapter Location',
  eventDescription: 'Description',
  eventTagline: 'Tagline',
  // v2.0: Tags/Featured
  hashtags: 'Hashtags',
  isFeatured: 'Featured Event',
  registrationInfo: 'Registration URL',
  entryFee: 'Entry Fee',
  // v2.0: Capacity
  registrationDeadline: 'Registration Deadline',
  registrationStartDate: 'Registration Opens',
  maxCapacity: 'Max Capacity',
  currentRegistrations: 'Current Registrations',
  waitlistEnabled: 'Waitlist Enabled',
  // v2.0: Guest policy
  allowGuests: 'Allow Guests',
  guestLimit: 'Guest Limit',
  targetAudience: 'Target Audience',
  speakerName: 'Speaker Name',
  speakerDesignation: 'Speaker Designation',
  speakers: 'Speakers',
}

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Converts 24h time format (HH:MM) to 12h format (h:mm AM/PM)
 */
function formatTime24to12(time: unknown): string | null {
  if (typeof time !== 'string' || !time) return null

  const match = time.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return time // Return as-is if not standard format

  const hours = parseInt(match[1], 10)
  const minutes = match[2]

  if (hours === 0) {
    return `12:${minutes} AM`
  } else if (hours < 12) {
    return `${hours}:${minutes} AM`
  } else if (hours === 12) {
    return `12:${minutes} PM`
  } else {
    return `${hours - 12}:${minutes} PM`
  }
}

/**
 * Formats date from ISO (YYYY-MM-DD) to display format
 * Returns the ISO format for form compatibility
 */
function formatDateForForm(date: unknown): string | null {
  if (typeof date !== 'string' || !date) return null
  // Form expects ISO date format (YYYY-MM-DD)
  return date
}

/**
 * Converts tags array to hashtag string for poster display
 * @example ["annual", "flagship"] -> "#annual #flagship"
 */
function formatTagsToHashtags(tags: unknown): string | null {
  if (!Array.isArray(tags) || tags.length === 0) return null

  return tags
    .filter((tag): tag is string => typeof tag === 'string' && tag.trim() !== '')
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag.trim().replace(/\s+/g, '')}`))
    .join(' ')
}

/**
 * Calculates spots remaining from capacity and registrations
 * @example (500, 450) -> "50 spots left"
 */
function calculateSpotsLeft(
  maxCapacity: number | undefined,
  currentRegistrations: number | undefined
): string | null {
  if (!maxCapacity || maxCapacity <= 0) return null

  const registrations = currentRegistrations || 0
  const spotsLeft = maxCapacity - registrations

  if (spotsLeft <= 0) return 'Sold out'
  if (spotsLeft === 1) return '1 spot left'
  if (spotsLeft <= 10) return `Only ${spotsLeft} spots left!`
  if (spotsLeft <= 50) return `${spotsLeft} spots left`

  return null // Don't show if plenty of spots
}

// ============================================================================
// Dynamic Field Processing (v3.0)
// ============================================================================

/**
 * Converts snake_case field ID to human-readable label
 * @example "dress_code" -> "Dress Code"
 * @example "parking_info" -> "Parking Info"
 */
function fieldIdToLabel(fieldId: string): string {
  return fieldId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Infers field type from value for form rendering
 */
function inferFieldType(value: unknown): DynamicFieldType {
  if (value === null || value === undefined) return 'text'

  if (typeof value === 'boolean') return 'boolean'
  if (typeof value === 'number') return 'number'

  if (typeof value === 'string') {
    // Check for date patterns (YYYY-MM-DD)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'date'
    // Check for time patterns (HH:MM or H:MM AM/PM)
    if (/^(\d{1,2}):(\d{2})(\s?(AM|PM))?$/i.test(value)) return 'time'
    // Long text -> textarea
    if (value.length > 100) return 'textarea'
    return 'text'
  }

  if (Array.isArray(value)) return 'select'

  return 'text'
}

/**
 * Processes customData from external event into DynamicField array
 */
function processDynamicFields(
  customData: Record<string, unknown> | undefined,
  customFieldMetadata: Record<string, { type?: DynamicFieldType; label?: string }> | undefined,
  sourceAppId: string | undefined
): DynamicField[] {
  if (!customData || Object.keys(customData).length === 0) {
    return []
  }

  const dynamicFields: DynamicField[] = []

  for (const [fieldId, value] of Object.entries(customData)) {
    // Skip null/undefined values
    if (value === null || value === undefined) continue

    // Get metadata if available
    const metadata = customFieldMetadata?.[fieldId]

    dynamicFields.push({
      fieldId,
      originalKey: fieldId, // Already normalized in webhook
      value,
      inferredType: metadata?.type || inferFieldType(value),
      inferredLabel: metadata?.label || fieldIdToLabel(fieldId),
      source: sourceAppId || 'unknown',
    })
  }

  return dynamicFields
}

/**
 * Infers optimal creative format from external event data
 *
 * @param event - External event to analyze
 * @returns Recommended format ID and reasoning
 * @version 1.0 - Initial implementation for auto-format selection
 *
 * @example
 * ```typescript
 * const result = inferFormatFromEventType(externalEvent)
 * // { formatId: 'event_poster', reasoning: 'Conference → Portrait poster format' }
 * ```
 */
export function inferFormatFromEventType(event: ExternalEvent): {
  formatId: CreativeFormatId
  reasoning: string
} {
  // Priority 1: Virtual events
  if (event.isVirtual) {
    return {
      formatId: 'announcement',
      reasoning: 'Virtual event → Optimized for online sharing',
    }
  }

  // Priority 2: Event type analysis
  const eventType = event.eventType?.toLowerCase() || ''

  // Conference/Summit/Workshop → Event Poster (1080x1440)
  if (
    ['conference', 'summit', 'workshop', 'seminar', 'training'].some((t) =>
      eventType.includes(t)
    )
  ) {
    return {
      formatId: 'event_poster',
      reasoning: `${event.eventType || 'Event'} → Portrait poster format`,
    }
  }

  // Networking/Meetup/Social → Event Poster (invitations are explicit, not inferred)
  if (['networking', 'meetup', 'social'].some((t) => eventType.includes(t))) {
    return {
      formatId: 'event_poster',
      reasoning: 'Social/networking event → Portrait poster format',
    }
  }

  // Explicit invitation events only
  if (['invitation', 'invite', 'gala', 'banquet'].some((t) => eventType.includes(t))) {
    return {
      formatId: 'invitation',
      reasoning: 'Invitation event → Invitation format',
    }
  }

  // Webinar → Instagram Post (square, shareable)
  if (eventType.includes('webinar')) {
    return {
      formatId: 'instagram_post',
      reasoning: 'Webinar → Square format for social media',
    }
  }

  // Awards/Celebration → Certificate
  if (
    ['awards', 'celebration', 'recognition'].some((t) => eventType.includes(t))
  ) {
    return {
      formatId: 'certificate',
      reasoning: 'Recognition event → Certificate format',
    }
  }

  // Priority 3: Default fallback
  return {
    formatId: 'event_poster',
    reasoning: 'Standard event → Default portrait poster',
  }
}

// ============================================================================
// Core Mapping Functions
// ============================================================================

/**
 * Maps an external event to Yi Studio form fields
 *
 * @param event - External event data
 * @returns Mapping result with form data, mapped fields, dynamic fields, and warnings
 *
 * @version 3.0 - Added dynamic fields support for capturing arbitrary custom data
 */
export function mapExternalEventToForm(event: ExternalEvent): EventMappingResult {
  const formData: Record<string, unknown> = {}
  const mappedFields: string[] = []
  const unmappedFields: string[] = []
  const warnings: string[] = []

  // Track which external fields we've processed
  const processedExternalFields = new Set<string>()

  // Apply field mappings
  for (const mapping of FIELD_MAPPINGS) {
    const externalValue = getNestedValue(event as unknown as Record<string, unknown>, mapping.externalField)

    if (externalValue !== undefined && externalValue !== null && externalValue !== '') {
      const transformedValue = mapping.transform
        ? mapping.transform(externalValue)
        : externalValue

      if (transformedValue !== null) {
        formData[mapping.formField] = transformedValue
        mappedFields.push(mapping.formField)
      }
    }

    processedExternalFields.add(mapping.externalField)
  }

  // Handle speakers specially (array mapping)
  if (event.speakers && event.speakers.length > 0) {
    const speakersResult = mapSpeakers(event.speakers)
    Object.assign(formData, speakersResult.formData)
    mappedFields.push(...speakersResult.mappedFields)
    processedExternalFields.add('speakers')
  }

  // Find unmapped external fields (excluding internal metadata and dynamic fields)
  const excludedFields = new Set([
    'id', 'status', 'createdAt', 'updatedAt', 'organizationId',
    'customData', 'customFieldMetadata', // v3.0: Dynamic fields handled separately
    '_syncedEventId', '_sourceAppId', '_syncedAt', // Internal metadata
  ])

  const allExternalFields = Object.keys(event).filter(
    (key) => !excludedFields.has(key)
  )

  for (const field of allExternalFields) {
    if (!processedExternalFields.has(field)) {
      const value = event[field as keyof ExternalEvent]
      if (value !== undefined && value !== null && value !== '') {
        unmappedFields.push(field)
      }
    }
  }

  // v3.0: Process dynamic fields from customData
  const dynamicFields = processDynamicFields(
    event.customData,
    event.customFieldMetadata,
    event._sourceAppId
  )

  // Add dynamic field values to formData for prompt compilation
  for (const field of dynamicFields) {
    formData[field.fieldId] = field.value
    // Also add to mappedFields for tracking
    mappedFields.push(field.fieldId)
  }

  // Generate warnings
  warnings.push(...generateWarnings(event, formData))

  // v3.1: Infer recommended format from event type (feature-flagged)
  let formatInference: { formatId?: import('@/lib/config/creative-formats').CreativeFormatId; reasoning?: string } = {}

  if (isFeatureEnabled('ENABLE_FORMAT_INFERENCE')) {
    formatInference = inferFormatFromEventType(event)
    console.log('[External Event Mapper] ✅ Format inference enabled:', formatInference.reasoning)
  } else {
    console.log('[External Event Mapper] ⚠️ Format inference disabled (feature flag)')
  }

  return {
    formData,
    mappedFields,
    unmappedFields,
    dynamicFields, // v3.0: Include dynamic fields in result
    warnings,
    recommendedFormatId: formatInference.formatId, // v3.1: Format inference
    formatReasoning: formatInference.reasoning, // v3.1: Format reasoning
  }
}

/**
 * Maps speaker array to form fields
 */
function mapSpeakers(
  speakers: ExternalEventSpeaker[]
): { formData: Record<string, unknown>; mappedFields: string[] } {
  const formData: Record<string, unknown> = {}
  const mappedFields: string[] = []

  // Map primary speaker to legacy fields
  const primarySpeaker = speakers[0]
  if (primarySpeaker) {
    if (primarySpeaker.name) {
      formData.speakerName = primarySpeaker.name
      mappedFields.push('speakerName')
    }
    if (primarySpeaker.designation) {
      formData.speakerDesignation = primarySpeaker.designation
      mappedFields.push('speakerDesignation')
    }
  }

  // Map full speakers array for multi-speaker support
  formData.speakers = speakers.map((speaker) => ({
    name: speaker.name || null,
    designation: speaker.designation || null,
    organization: speaker.organization || null,
    photoUrl: speaker.photoUrl || null,
  }))
  mappedFields.push('speakers')

  return { formData, mappedFields }
}

/**
 * Generates warnings based on event data
 *
 * @version 2.0 - Added virtual event and capacity warnings
 */
function generateWarnings(
  event: ExternalEvent,
  formData: Record<string, unknown>
): string[] {
  const warnings: string[] = []

  // Check for past date
  if (event.date) {
    const eventDate = new Date(event.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (eventDate < today) {
      warnings.push('Event date is in the past. You may want to update it.')
    }
  }

  // Check for missing recommended fields
  if (!formData.venue && !event.isVirtual) {
    warnings.push('No venue specified. Consider adding a location.')
  }

  if (!formData.eventTime) {
    warnings.push('No start time specified.')
  }

  // v2.0: Virtual event without meeting link
  if (event.isVirtual && !event.virtualMeetingLink) {
    warnings.push('Virtual event has no meeting link. Consider adding one.')
  }

  // v2.0: Event at capacity
  if (
    event.maxCapacity &&
    event.currentRegistrations &&
    event.currentRegistrations >= event.maxCapacity
  ) {
    if (event.waitlistEnabled) {
      warnings.push('Event is at capacity. Waitlist is active.')
    } else {
      warnings.push('Event is at capacity (sold out).')
    }
  }

  // v2.0: Registration deadline passed
  if (event.registrationDeadline) {
    const deadline = new Date(event.registrationDeadline)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (deadline < today) {
      warnings.push('Registration deadline has passed.')
    }
  }

  // Check for cancelled event
  if (event.status === 'cancelled') {
    warnings.push('This event has been cancelled in the source system.')
  }

  // Check for very long description
  if (
    typeof formData.description === 'string' &&
    formData.description.length > 500
  ) {
    warnings.push(
      'Description is very long. Consider shortening for poster readability.'
    )
  }

  return warnings
}

/**
 * Gets a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

// ============================================================================
// Change Detection
// ============================================================================

/**
 * Detects changes between stored event data and current external event
 *
 * @param storedFormData - Previously imported form data
 * @param currentEvent - Current event from external source
 * @returns Change detection result
 */
export function detectEventChanges(
  storedFormData: Record<string, unknown>,
  currentEvent: ExternalEvent
): EventChangeDetectionResult {
  const currentMapped = mapExternalEventToForm(currentEvent)
  const changedFields: EventChangeDetectionResult['changedFields'] = []

  // Compare each mapped field
  for (const field of currentMapped.mappedFields) {
    const oldValue = storedFormData[field]
    const newValue = currentMapped.formData[field]

    // Deep comparison for arrays (speakers)
    if (field === 'speakers') {
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changedFields.push({
          field,
          label: FIELD_LABELS[field] || field,
          oldValue,
          newValue,
        })
      }
    } else if (oldValue !== newValue) {
      changedFields.push({
        field,
        label: FIELD_LABELS[field] || field,
        oldValue,
        newValue,
      })
    }
  }

  return {
    hasChanges: changedFields.length > 0,
    changedFields,
    sourceUpdatedAt: currentEvent.updatedAt,
  }
}

// ============================================================================
// Metadata Generation
// ============================================================================

/**
 * Creates external event metadata for storage with creative
 *
 * @param event - External event
 * @param source - Source domain (e.g., "events.yichapter.org")
 * @param mappedFields - Fields that were mapped from the event
 * @returns External event metadata
 */
export function createExternalEventMeta(
  event: ExternalEvent,
  source: string,
  mappedFields: string[]
): ExternalEventMeta {
  return {
    id: event.id,
    source,
    importedAt: new Date().toISOString(),
    mappedFields,
    eventName: event.name,
    eventUpdatedAt: event.updatedAt,
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Applies updated event data to existing form data
 * Only updates fields that changed
 *
 * @param existingFormData - Current form data
 * @param changes - Detected changes
 * @returns Updated form data
 */
export function applyEventChanges(
  existingFormData: Record<string, unknown>,
  changes: EventChangeDetectionResult
): Record<string, unknown> {
  const updatedFormData = { ...existingFormData }

  for (const change of changes.changedFields) {
    updatedFormData[change.field] = change.newValue
  }

  return updatedFormData
}

/**
 * Gets human-readable label for a form field
 * Falls back to converting snake_case to Title Case for dynamic fields
 */
export function getFieldLabel(field: string): string {
  return FIELD_LABELS[field] || fieldIdToLabel(field)
}

/**
 * Validates if an external event has minimum required data
 */
export function validateExternalEvent(event: ExternalEvent): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!event.id) {
    errors.push('Event ID is required')
  }

  if (!event.name || event.name.trim() === '') {
    errors.push('Event name is required')
  }

  if (!event.date) {
    errors.push('Event date is required')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Merges form data with external event data, prioritizing form data
 * for fields the user has modified
 *
 * @param formData - Current form data (user may have edited)
 * @param eventData - External event mapped data
 * @param userModifiedFields - Fields the user has manually changed
 * @returns Merged form data
 */
export function mergeEventDataWithForm(
  formData: Record<string, unknown>,
  eventData: Record<string, unknown>,
  userModifiedFields: Set<string>
): Record<string, unknown> {
  const merged = { ...formData }

  for (const [field, value] of Object.entries(eventData)) {
    // Only update if user hasn't manually modified this field
    if (!userModifiedFields.has(field)) {
      merged[field] = value
    }
  }

  return merged
}

/**
 * Extracts dynamic fields from an event's customData
 * Useful for components that need direct access to dynamic fields
 *
 * @param event - External event with customData
 * @returns Array of DynamicField objects
 */
export function getDynamicFieldsFromEvent(event: ExternalEvent): DynamicField[] {
  return processDynamicFields(
    event.customData,
    event.customFieldMetadata,
    event._sourceAppId
  )
}
