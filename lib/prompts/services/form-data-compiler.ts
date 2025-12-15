/**
 * Form Data Compiler Service
 *
 * Compiles ALL user form fields into a structured format for AI prompt generation.
 * Unlike hardcoded extraction, this captures dynamic/custom fields too.
 */

import type { DesignData } from '@/lib/config/design-constants'
import { getFormatById, type CreativeFormatId } from '@/lib/config/creative-formats'
import { formatEventTime } from '@/lib/utils/time-formatter'

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

  // Additional note (footer content)
  eventNote: string | null

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
  tagline: ['tagline', 'slogan', 'subtitle', 'subheading', 'motto', 'eventTagline'],
  eventNote: ['eventNote', 'note', 'additionalNote', 'footerNote', 'extraInfo', 'announcement', 'additionalDetails'],
}

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Compiles ALL user form fields into a structured format.
 * Handles both standard fields (via aliases) and custom/dynamic fields.
 *
 * @param speakerPhotoEnabled - When false, speaker name/designation fields are excluded
 *   to prevent speaker data from leaking into AI prompts when speaker photo is disabled
 */
export function compileFormData(
  userFormData: Record<string, unknown> | undefined,
  formatId: CreativeFormatId | undefined,
  designData: DesignData | undefined | null,
  language: string = 'en',
  speakerPhotoEnabled: boolean = false
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

  // Clear speaker fields when speaker photo is disabled
  // This prevents speaker data from leaking into AI prompts
  if (!speakerPhotoEnabled) {
    extractedFields.speakerName = null
    extractedFields.speakerDesignation = null
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

    // Additional note (footer content)
    eventNote: extractedFields.eventNote,

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
  if (data.time) lines.push(`Time: ${formatEventTime(data.time)}`)
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
 *
 * IMPORTANT: This function outputs VALUES ONLY without field labels.
 * Previously, labels like "Event Name:", "Date:", "Venue:" were being
 * rendered as literal text in generated images by Gemini.
 *
 * Structure:
 * - Line 1: Event name (primary headline)
 * - Line 2: Tagline/subtitle (if present)
 * - Line 3: Date and time
 * - Line 4: Venue
 * - Line 5+: Speaker info, organization, custom fields
 */
export function buildTextBriefFromCompiled(data: CompiledFormData): string {
  const textValues: string[] = []

  // Primary text - Event name (no label)
  if (data.eventName?.trim()) {
    textValues.push(`"${data.eventName.trim()}"`)
  }

  // Tagline/subtitle (no label)
  if (data.tagline?.trim()) {
    textValues.push(`"${data.tagline.trim()}"`)
  }

  // Date and time combined naturally (no labels)
  const dateTimeParts: string[] = []
  if (data.date?.trim()) dateTimeParts.push(data.date.trim())
  if (data.time?.trim()) dateTimeParts.push(formatEventTime(data.time.trim()))
  if (dateTimeParts.length > 0) {
    textValues.push(`"${dateTimeParts.join(' | ')}"`)
  }

  // Venue (no label)
  if (data.venue?.trim()) {
    textValues.push(`"${data.venue.trim()}"`)
  }

  // Speaker info - natural combination (no labels)
  if (data.speakerName?.trim()) {
    let speakerText = data.speakerName.trim()
    if (data.speakerDesignation?.trim()) {
      speakerText += `, ${data.speakerDesignation.trim()}`
    }
    textValues.push(`"${speakerText}"`)
  }

  // Organization (no label)
  if (data.organizationName?.trim()) {
    textValues.push(`"${data.organizationName.trim()}"`)
  }

  // Custom fields - VALUES ONLY, no field names
  for (const value of Object.values(data.customFields)) {
    if (value?.trim()) {
      textValues.push(`"${value.trim()}"`)
    }
  }

  // Event note / additional note (footer content)
  if (data.eventNote?.trim()) {
    textValues.push(`"${data.eventNote.trim()}"`)
  }

  // Build the brief as a simple list of quoted strings
  // This tells the AI "these are the exact texts to render"
  return textValues.join('\n')
}

/**
 * Builds a narrative description of the event for scene context.
 * This describes the IMAGE SCENE, not what text to render.
 * Safe to include in prompts as it uses prose, not labels.
 */
export function buildSceneNarrative(data: CompiledFormData): string {
  const parts: string[] = []

  // Event type context
  const eventType = data.eventType || 'professional event'
  parts.push(`A ${eventType} poster design`)

  // Format context
  if (data.format) {
    parts.push(`in ${data.format.name} format`)
  }

  // Speaker context (affects composition)
  if (data.speakerName?.trim()) {
    parts.push('featuring a speaker presentation')
  }

  // Venue context (affects mood/atmosphere)
  if (data.venue?.trim()) {
    const venue = data.venue.toLowerCase()
    if (venue.includes('hotel') || venue.includes('convention')) {
      parts.push('with an elegant corporate atmosphere')
    } else if (venue.includes('university') || venue.includes('college')) {
      parts.push('with an academic ambiance')
    } else if (venue.includes('outdoor') || venue.includes('garden')) {
      parts.push('with a fresh natural setting')
    }
  }

  return parts.join(' ')
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
