/**
 * Form Data Compiler Service
 *
 * Compiles ALL user form fields into a structured format for AI prompt generation.
 * Unlike hardcoded extraction, this captures dynamic/custom fields too.
 */

import type { DesignData } from '@/lib/config/design-constants'
import { getFormatById, type CreativeFormatId } from '@/lib/config/creative-formats'

// ============================================================
// TYPES
// ============================================================

export interface CompiledFormData {
  // Core event details
  eventName: string | null
  eventType: string | null

  // Date/Time
  date: string | null
  time: string | null

  // Location
  venue: string | null

  // People
  speakerName: string | null
  speakerDesignation: string | null
  organizationName: string | null

  // Description
  description: string | null
  tagline: string | null

  // All other custom fields (dynamic)
  customFields: Record<string, string>

  // Design settings
  format: {
    id: string
    name: string
    dimensions: { width: number; height: number }
  } | null
  theme: string | null
  style: string | null
  language: 'en' | 'ta' | 'hi'

  // Raw form data for reference
  rawFormData: Record<string, unknown>
}

// ============================================================
// FIELD MAPPINGS
// ============================================================

/**
 * Maps various field name variations to standard field names.
 * This handles dynamic form fields that might use different naming conventions.
 */
const FIELD_ALIASES: Record<string, string[]> = {
  eventName: ['title', 'eventName', 'eventTitle', 'name', 'event_name', 'event'],
  eventType: ['eventType', 'type', 'event_type', 'category'],
  date: ['date', 'eventDate', 'event_date'],
  time: ['time', 'eventTime', 'event_time'],
  venue: ['venue', 'location', 'venueName', 'venue_name', 'place', 'address'],
  speakerName: ['speaker', 'guestName', 'speakerName', 'guest', 'chief_guest', 'chiefGuest', 'speaker_name', 'guest_name'],
  speakerDesignation: ['designation', 'guestDesignation', 'speakerDesignation', 'title', 'role', 'position', 'speaker_designation'],
  organizationName: ['organization', 'organizationName', 'org', 'company', 'institution', 'organization_name'],
  description: ['description', 'additionalInfo', 'details', 'about', 'info', 'content', 'message'],
  tagline: ['tagline', 'slogan', 'subtitle', 'subheading', 'motto'],
}

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Compiles ALL user form fields into a structured format.
 * Handles both standard fields (via aliases) and custom/dynamic fields.
 */
export function compileFormData(
  userFormData: Record<string, unknown> | undefined,
  formatId: CreativeFormatId | undefined,
  designData: DesignData | undefined | null,
  language: string = 'en'
): CompiledFormData {
  const formData = userFormData || {}

  // Get format info
  const format = formatId ? getFormatById(formatId) : null

  // Extract standard fields using aliases
  const extractedFields: Record<string, string | null> = {}
  const usedKeys = new Set<string>()

  for (const [standardField, aliases] of Object.entries(FIELD_ALIASES)) {
    for (const alias of aliases) {
      const value = formData[alias]
      if (value !== undefined && value !== null && value !== '') {
        extractedFields[standardField] = String(value).trim()
        usedKeys.add(alias)
        break // Use first matching alias
      }
    }
    // If not found, set to null
    if (!extractedFields[standardField]) {
      extractedFields[standardField] = null
    }
  }

  // Extract custom fields (fields not matched by aliases)
  const customFields: Record<string, string> = {}
  for (const [key, value] of Object.entries(formData)) {
    if (!usedKeys.has(key) && value !== undefined && value !== null && value !== '') {
      // Skip internal fields
      if (key.startsWith('_') || key === 'language') continue
      customFields[key] = String(value).trim()
    }
  }

  return {
    // Core event details
    eventName: extractedFields.eventName,
    eventType: extractedFields.eventType,

    // Date/Time
    date: extractedFields.date,
    time: extractedFields.time,

    // Location
    venue: extractedFields.venue,

    // People
    speakerName: extractedFields.speakerName,
    speakerDesignation: extractedFields.speakerDesignation,
    organizationName: extractedFields.organizationName,

    // Description
    description: extractedFields.description,
    tagline: extractedFields.tagline,

    // Custom fields
    customFields,

    // Design settings
    format: format ? {
      id: format.id,
      name: format.label,
      dimensions: { width: format.width, height: format.height },
    } : null,
    theme: designData?.theme || null,
    style: designData?.style || null,
    language: (language as 'en' | 'ta' | 'hi') || 'en',

    // Raw form data for reference
    rawFormData: formData,
  }
}

/**
 * Creates a human-readable summary of the compiled form data.
 * Useful for logging and debugging.
 */
export function summarizeCompiledData(data: CompiledFormData): string {
  const lines: string[] = []

  if (data.eventName) lines.push(`Event: ${data.eventName}`)
  if (data.eventType) lines.push(`Type: ${data.eventType}`)
  if (data.date) lines.push(`Date: ${data.date}`)
  if (data.time) lines.push(`Time: ${data.time}`)
  if (data.venue) lines.push(`Venue: ${data.venue}`)
  if (data.speakerName) {
    let speaker = `Speaker: ${data.speakerName}`
    if (data.speakerDesignation) speaker += ` (${data.speakerDesignation})`
    lines.push(speaker)
  }
  if (data.organizationName) lines.push(`Organization: ${data.organizationName}`)
  if (data.tagline) lines.push(`Tagline: ${data.tagline}`)
  if (data.description) lines.push(`Description: ${data.description.substring(0, 100)}...`)

  if (Object.keys(data.customFields).length > 0) {
    lines.push(`Custom Fields: ${Object.keys(data.customFields).join(', ')}`)
  }

  if (data.format) {
    lines.push(`Format: ${data.format.name} (${data.format.dimensions.width}x${data.format.dimensions.height})`)
  }

  return lines.join('\n')
}

/**
 * Builds a text brief from compiled data for AI consumption.
 */
export function buildTextBriefFromCompiled(data: CompiledFormData): string {
  const parts: string[] = []

  // Event info
  if (data.eventName) {
    parts.push(`Event Name: "${data.eventName}"`)
  }
  if (data.eventType) {
    parts.push(`Event Type: ${data.eventType}`)
  }

  // Date/Time/Venue
  const dateTimeParts: string[] = []
  if (data.date) dateTimeParts.push(`Date: ${data.date}`)
  if (data.time) dateTimeParts.push(`Time: ${data.time}`)
  if (data.venue) dateTimeParts.push(`Venue: ${data.venue}`)
  if (dateTimeParts.length > 0) {
    parts.push(dateTimeParts.join(' | '))
  }

  // Speaker/Guest
  if (data.speakerName) {
    let speakerInfo = `Guest/Speaker: ${data.speakerName}`
    if (data.speakerDesignation) {
      speakerInfo += `, ${data.speakerDesignation}`
    }
    parts.push(speakerInfo)
  }

  // Organization
  if (data.organizationName) {
    parts.push(`Organization: ${data.organizationName}`)
  }

  // Tagline
  if (data.tagline) {
    parts.push(`Tagline: "${data.tagline}"`)
  }

  // Description
  if (data.description) {
    parts.push(`Description: ${data.description}`)
  }

  // Custom fields
  for (const [key, value] of Object.entries(data.customFields)) {
    parts.push(`${formatFieldName(key)}: ${value}`)
  }

  // Format info
  if (data.format) {
    parts.push(`Output Format: ${data.format.name}`)
  }

  return parts.join('\n')
}

/**
 * Converts camelCase or snake_case to Title Case.
 */
function formatFieldName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\s+/, '')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}
