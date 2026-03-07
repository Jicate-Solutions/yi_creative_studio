/**
 * AI Prompt templates for Smart Paste field extraction
 * Used by /api/extract-fields endpoint
 */

import { EXTRACTABLE_FIELDS, FIELD_LABELS } from '@/types/extraction.types'

/**
 * System prompt for the extraction AI
 * Defines the role, rules, and response format
 */
export const FIELD_EXTRACTION_SYSTEM_PROMPT = `You are an AI assistant specialized in extracting structured event information from unformatted text.

Your task is to parse event details from raw text (emails, WhatsApp messages, flyers, announcements, social media posts) and extract structured fields with confidence scores.

CONTEXT:
- This is for Yi CreativeStudio, used by Young Indians (Yi) chapters to create event posters
- Events are typically professional, community-focused gatherings
- Text may contain emojis, bullet points, hashtags, or informal formatting
- Common event types: workshops, seminars, summits, drives, sessions, meets

EXTRACTION RULES:

1. DATE FORMATS - Normalize to ISO (YYYY-MM-DD):
   - Indian dot format: 28.01.2026 → 2026-01-28
   - Indian slash format: 28/01/2026 → 2026-01-28
   - Hyphen format: 28-01-2026 → 2026-01-28
   - Written: 28th January 2026 → 2026-01-28
   - Short: Jan 28, 2026 → 2026-01-28
   - Short year: 28/01/26 → 2026-01-28 (assume 2000s)

2. TIME FORMATS - Normalize to HH:MM (24-hour):
   - Dot format: 10.00 AM → 10:00
   - Colon format: 10:00 AM → 10:00
   - No minutes: 10 AM → 10:00
   - 24-hour: 22:00 → 22:00
   - PM times: 2:30 PM → 14:30
   - Time ranges: "10.00 AM - 12.00 PM" → extract BOTH startTime AND endTime

3. SPEAKER EXTRACTION:
   - Look for patterns: "by", "featuring", "Resource Person", "Speaker", "Presenter", "Guest", "Chief Guest"
   - Extract name AND designation/organization separately
   - Handle multiple speakers (comma-separated, bullet lists, numbered lists)
   - Recognize prefixes: Mr., Ms., Mrs., Dr., Prof., Shri, Smt.
   - Example: "Mr. V. Velavan – V Teach Project Solutions, Erode" → name: "Mr. V. Velavan", designation: "V Teach Project Solutions, Erode"

4. VENUE EXTRACTION:
   - Look for markers: "at", "venue", "location", "@", "📍"
   - Include full location details (room name, building, city if present)

5. EVENT NAME EXTRACTION:
   - Look for the main title (usually prominent, often with emojis)
   - May include quotes: "Journey of Our Alumni"
   - Strip formatting emojis from the value but preserve the text
   - Use 'eventName' as the ONLY field ID for the event name or title. NEVER use 'eventTitle' — it is not a valid field ID and causes duplicates.

6. CONFIDENCE SCORING:
   - 0.95-1.0: Explicitly labeled (e.g., "Date: 28.01.2026", "Venue: Hall A")
   - 0.80-0.94: Strong context (e.g., date follows 📅 emoji)
   - 0.60-0.79: Inferred from context patterns
   - 0.40-0.59: Ambiguous but likely
   - 0.20-0.39: Low confidence guess
   - Below 0.2: Don't include the field

RESPONSE FORMAT:
You MUST respond with valid JSON only. No markdown code blocks. No explanations outside JSON.
{
  "fields": [
    { "fieldId": "eventName", "value": "Alumni Insight Session", "confidence": 0.95 },
    { "fieldId": "eventTagline", "value": "Journey of Our Alumni", "confidence": 0.90 },
    { "fieldId": "eventDate", "value": "2026-01-28", "confidence": 0.95 },
    { "fieldId": "eventTime", "value": "10:00", "confidence": 0.90 },
    { "fieldId": "eventEndTime", "value": "12:00", "confidence": 0.85 },
    { "fieldId": "venue", "value": "E-Yantra Lab", "confidence": 0.95 }
  ],
  "speakers": [
    { "name": "Mr. V. Velavan", "designation": "V Teach Project Solutions, Erode", "confidence": 0.90 },
    { "name": "Ms. A. Anandhavalli", "designation": "Trainee, R&D, Royal Enfield, Chennai", "confidence": 0.85 }
  ],
  "warnings": ["Date appears to be in the past"]
}

IMPORTANT:
- Only include fields you can confidently extract (confidence >= 0.2)
- For fields not found in the text, simply omit them from the response
- Preserve the exact text for names and venues (don't modify or abbreviate)
- Speakers array can be empty if no speakers are mentioned`

/**
 * Build the user prompt with the raw text to extract from
 */
export interface ExtractionPromptParams {
  rawText: string
  verticalSlug?: string
  verticalName?: string
  formatId?: string
}

export function buildExtractionPrompt(params: ExtractionPromptParams): string {
  const { rawText, verticalSlug, verticalName, formatId } = params

  const fieldList = EXTRACTABLE_FIELDS.map(
    (f) => `- ${f}: ${FIELD_LABELS[f] || f}`
  ).join('\n')

  let prompt = `Extract event information from the following text.

TARGET FIELDS TO EXTRACT:
${fieldList}

SPEAKER FIELDS:
- name: Full name with title (Mr., Ms., Dr., etc.)
- designation: Role, company, or organization
- organization: Company/institution name (if separate from designation)`

  // Add vertical context if available
  if (verticalSlug || verticalName) {
    prompt += `

CONTEXT:
- Vertical: ${verticalName || verticalSlug}
- This context may help understand event themes and terminology`
  }

  // Add format context if available
  if (formatId) {
    prompt += `
- Format: ${formatId} (use this to understand which fields are most relevant)`
  }

  prompt += `

RAW TEXT TO EXTRACT FROM:
"""
${rawText}
"""

Extract all detectable fields with confidence scores. For fields not found, omit them from the response. Return valid JSON only.`

  return prompt
}

/**
 * Validate and normalize extracted date to ISO format
 */
export function normalizeExtractedDate(dateStr: string): string | null {
  if (!dateStr) return null

  // Already ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }

  // Indian formats: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
  const indianMatch = dateStr.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/)
  if (indianMatch) {
    const [, day, month, year] = indianMatch
    const fullYear = year.length === 2 ? `20${year}` : year
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  return dateStr // Return as-is if we can't parse
}

/**
 * Validate and normalize extracted time to HH:MM format
 */
export function normalizeExtractedTime(timeStr: string): string | null {
  if (!timeStr) return null

  // Already 24-hour format
  if (/^\d{2}:\d{2}$/.test(timeStr)) {
    return timeStr
  }

  // Handle various formats
  const timeMatch = timeStr.match(
    /^(\d{1,2})[.:]?(\d{2})?\s*(AM|PM|am|pm)?$/i
  )
  if (timeMatch) {
    let [, hours, minutes = '00', period] = timeMatch
    let h = parseInt(hours, 10)

    if (period) {
      const isPM = period.toUpperCase() === 'PM'
      if (isPM && h !== 12) h += 12
      if (!isPM && h === 12) h = 0
    }

    return `${h.toString().padStart(2, '0')}:${minutes}`
  }

  return timeStr // Return as-is if we can't parse
}

/**
 * Generate warnings based on extracted data
 */
export function generateExtractionWarnings(
  fields: Array<{ fieldId: string; value: string }>
): string[] {
  const warnings: string[] = []

  // Check for past dates
  const dateField = fields.find(
    (f) => f.fieldId === 'eventDate' || f.fieldId === 'date'
  )
  if (dateField) {
    const eventDate = new Date(dateField.value)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (eventDate < today) {
      warnings.push('Event date appears to be in the past')
    }
  }

  // Check for missing critical fields
  const hasEventName = fields.some(
    (f) => f.fieldId === 'eventName' || f.fieldId === 'eventTitle'
  )
  if (!hasEventName) {
    warnings.push('Event name/title could not be detected')
  }

  return warnings
}
