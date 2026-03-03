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
  endTime: string | null

  // Location
  venue: string | null

  // People
  speakerName: string | null
  speakerDesignation: string | null
  organizationName: string | null

  // NEW: Multi-speaker support
  speakers: Array<{
    name: string | null
    designation: string | null
  }> | null

  // Description
  description: string | null
  tagline: string | null

  // Additional note (footer content)
  eventNote: string | null

  // NEW v15.1: Enhanced 4-Row Strip initiative text (Row 3)
  initiativeText: string | null
  initiativeColor: string | null

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

  // NEW v4.0: Design intensity/fidelity controls
  sophistication: 'minimalist' | 'balanced' | 'rich' | null
  creativeFidelity: 'high' | 'standard' | 'artistic' | null

  // NEW v4.2: Typography and Layout controls
  alignment: 'center' | 'left' | 'right' | 'asymmetric' | null
  fontStyle: 'serif' | 'sans' | 'slab' | 'mono' | 'script' | 'display' | null

  // Visual direction: free-text user brief for background visual
  visualDirection: string | null

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
  eventName: ['title', 'eventName', 'eventTitle', 'name', 'event_name', 'event', 'postTitle', 'postHeadline'],
  eventType: ['eventType', 'type', 'event_type', 'category'],
  date: ['date', 'eventDate', 'event_date'],
  time: ['time', 'eventTime', 'event_time', 'startTime', 'start_time'],
  endTime: ['endTime', 'eventEndTime', 'event_end_time', 'end_time'],
  venue: ['venue', 'location', 'venueName', 'venue_name', 'place', 'address'],
  speakerName: ['speaker', 'guestName', 'speakerName', 'guest', 'chief_guest', 'chiefGuest', 'speaker_name', 'guest_name'],
  speakerDesignation: ['designation', 'guestDesignation', 'speakerDesignation', 'title', 'role', 'position', 'speaker_designation'],
  organizationName: ['organization', 'organizationName', 'org', 'company', 'institution', 'organization_name'],
  description: ['description', 'additionalInfo', 'details', 'about', 'info', 'content', 'message', 'postCaption', 'eventCaption', 'eventDescription'],
  tagline: ['tagline', 'slogan', 'subtitle', 'subheading', 'motto', 'eventTagline'],
  eventNote: ['eventNote', 'note', 'additionalNote', 'footerNote', 'extraInfo', 'announcement', 'additionalDetails'],
  // NEW v4.0: Design intensity aliases
  sophistication: ['sophistication', 'intensity', 'designComplexity', 'minimalism'],
  creativeFidelity: ['creativeFidelity', 'fidelity', 'qualityLevel', 'artistLogic'],
  // NEW v4.2: Typography and Layout aliases
  alignment: ['alignment', 'textAlignment', 'layoutAlignment', 'text_alignment'],
  fontStyle: ['fontStyle', 'font_style', 'typography', 'typographyStyle', 'vibe'],
}

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Compiles ALL user form fields into a structured format.
 * Handles both standard fields (via aliases) and custom/dynamic fields.
 *
 * @param speakerPhotoEnabled - Controls whether speaker photos are overlaid post-generation.
 *   NOTE: Speaker text data (name, designation) is ALWAYS included in prompts when provided.
 *   This flag only affects photo overlay processing, not text rendering.
 * @param enhanced4RowStrip - Enhanced 4-row strip configuration (v15.1: for initiative text extraction)
 */
export function compileFormData(
  userFormData: Record<string, unknown> | undefined,
  formatId: CreativeFormatId | undefined,
  designData: DesignData | undefined | null,
  language: string = 'en',
  speakerPhotoEnabled: boolean = false,
  enhanced4RowStrip?: any // v15.1: Extract initiative text for AI prompt
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
    // Phase 2: mark ALL present aliases for this field as used (prevent sibling leak to customFields)
    for (const alias of aliases) {
      if (formData[alias] !== undefined && formData[alias] !== null && formData[alias] !== '') {
        usedKeys.add(alias)
      }
    }
    // If not found, set to null
    if (!extractedFields[standardField]) {
      extractedFields[standardField] = null
    }
  }

  // NEW: Extract speakers array (supports both legacy and new formats)
  // Speaker text data is ALWAYS included in prompts when provided.
  // The speakerPhotoEnabled flag only controls whether photos are overlaid post-generation.
  let speakersArray: Array<{ name: string | null; designation: string | null }> | null = null

  // Check for speakers array in form data
  if (Array.isArray(formData.speakers)) {
    speakersArray = formData.speakers
      .map((s: any) => ({
        name: s.name || s.speakerName || null,
        designation: s.designation || s.speakerDesignation || null,
      }))
      .filter(s => s.name && s.name.trim())
  } else if (extractedFields.speakerName) {
    // BACKWARD COMPATIBILITY: Single speaker
    speakersArray = [{
      name: extractedFields.speakerName,
      designation: extractedFields.speakerDesignation,
    }]
  }

  // Set to null only if truly empty (no speakers at all)
  if (speakersArray && speakersArray.length === 0) {
    speakersArray = null
  }

  // Extract custom fields (fields not matched by aliases)
  const customFields: Record<string, string> = {}
  for (const [key, value] of Object.entries(formData)) {
    if (!usedKeys.has(key) && value !== undefined && value !== null && value !== '') {
      // Skip internal/meta fields
      if (key.startsWith('_') || key === 'language' || key === 'designData') continue
      // Skip objects — they stringify to "[object Object]" which poisons AI briefs
      if (typeof value === 'object') continue
      customFields[key] = String(value).trim()
    }
  }

  // v15.1: Extract initiative text from Enhanced 4-Row Strip (Row 3)
  const initiativeText = enhanced4RowStrip?.rows?.initiative?.text?.trim() || null
  const initiativeColor = enhanced4RowStrip?.rows?.initiative?.color || null

  return {
    // Core event details
    eventName: extractedFields.eventName,
    eventType: extractedFields.eventType,

    // Date/Time
    date: extractedFields.date,
    time: extractedFields.time,
    endTime: extractedFields.endTime,

    // Location
    venue: extractedFields.venue,

    // People
    speakerName: speakersArray?.[0]?.name || extractedFields.speakerName,
    speakerDesignation: speakersArray?.[0]?.designation || extractedFields.speakerDesignation,
    organizationName: extractedFields.organizationName,

    // NEW: Multi-speaker support
    speakers: speakersArray,

    // Description
    description: extractedFields.description,
    tagline: extractedFields.tagline,

    // Additional note (footer content)
    eventNote: extractedFields.eventNote,

    // NEW v15.1: Enhanced 4-Row Strip initiative text (Row 3)
    initiativeText,
    initiativeColor,

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

    // NEW v4.0: Intensity controls (prioritize explicit form fields, then designData, then null)
    sophistication: (extractedFields.sophistication as any) || null,
    creativeFidelity: (extractedFields.creativeFidelity as any) || null,

    // NEW v4.2: Typography and Layout controls
    alignment: (extractedFields.alignment as any) || null,
    fontStyle: (extractedFields.fontStyle as any) || null,

    // Visual direction: free-text user brief for background visual
    visualDirection: designData?.visualDirection?.trim() || null,

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
  if (data.initiativeText) lines.push(`Initiative Text (Row 3): ${data.initiativeText} (${data.initiativeColor})`)
  if (data.date) lines.push(`Date: ${data.date}`)
  if (data.time && data.endTime) {
    lines.push(`Time: ${formatEventTime(data.time)} - ${formatEventTime(data.endTime)}`)
  } else if (data.time) {
    lines.push(`Time: ${formatEventTime(data.time)}`)
  }
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
  // Time range (start - end) or just start time
  if (data.time?.trim() && data.endTime?.trim()) {
    dateTimeParts.push(`${formatEventTime(data.time.trim())} - ${formatEventTime(data.endTime.trim())}`)
  } else if (data.time?.trim()) {
    dateTimeParts.push(formatEventTime(data.time.trim()))
  }
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

  // v15.2: REMOVED initiative text from user brief
  // Why: AI was rendering it in original color (not adjusted color), causing visibility issues
  // Solution: Backend handles initiative text overlay with auto-adjusted color
  // The AI no longer sees initiative text in the brief, preventing duplicate rendering

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
