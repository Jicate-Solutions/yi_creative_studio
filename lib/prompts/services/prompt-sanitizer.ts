/**
 * Prompt Sanitizer Service
 *
 * Sanitizes prompts before sending to Gemini to prevent field labels,
 * instructions, and metadata from being rendered as visible text in images.
 *
 * The core principle: Gemini should receive only:
 * 1. Scene/style descriptions (narrative prose)
 * 2. Exact text values to render (no labels)
 * 3. Semantic exclusions (what the image should NOT contain)
 */

import type { CompiledFormData } from './form-data-compiler'

// ============================================================
// PATTERNS TO REMOVE
// ============================================================

/**
 * Field label patterns that leak into prompts.
 * These appear as "Label: value" and Gemini renders "Label:" as text.
 */
const FIELD_LABEL_PATTERNS = [
  /\bEvent\s*Name\s*:\s*/gi,
  /\bEvent\s*Type\s*:\s*/gi,
  /\bEvent\s*Title\s*:\s*/gi,
  /\bDate\s*:\s*/gi,
  /\bTime\s*:\s*/gi,
  /\bVenue\s*:\s*/gi,
  /\bLocation\s*:\s*/gi,
  /\bSpeaker\s*:\s*/gi,
  /\bGuest\s*\/?\s*Speaker\s*:\s*/gi,
  /\bChief\s*Guest\s*:\s*/gi,
  /\bOrganization\s*:\s*/gi,
  /\bOrganisation\s*:\s*/gi,
  /\bTagline\s*:\s*/gi,
  /\bDescription\s*:\s*/gi,
  /\bDetails\s*:\s*/gi,
  /\bText\s*:\s*/gi,
  /\bTitle\s*:\s*/gi,
  /\bSubtitle\s*:\s*/gi,
  /\bHeadline\s*:\s*/gi,
  /\bOutput\s*Format\s*:\s*/gi,
]

/**
 * Instruction phrases that should not appear in the final prompt.
 * Gemini sometimes renders these literally.
 */
const INSTRUCTION_PATTERNS = [
  /\bIMPORTANT\s*:\s*/gi,
  /\bCRITICAL\s*:\s*/gi,
  /\bNOTE\s*:\s*/gi,
  /\bWARNING\s*:\s*/gi,
  /\bAVOID\s*:\s*/gi,
  /\bMUST\s+/gi,
  /\bSHOULD\s+/gi,
  /\bDO\s+NOT\s+/gi,
  /\bNEVER\s+/gi,
  /\bALWAYS\s+/gi,
  /\bInclude\s+these\s+details\s*:\s*/gi,
  /\bFeature\s+the\s+/gi,
  /\bRender\s+/gi,
  /\bGenerate\s+/gi,
  /\bCreate\s+/gi,
  /\bDesign\s+/gi,
  /\bMake\s+sure\s+/gi,
  /\bEnsure\s+/gi,
]

/**
 * Section header patterns that leak into prompts.
 */
const SECTION_HEADER_PATTERNS = [
  /={3,}\s*[A-Z\s]+\s*={3,}/g,  // === SECTION HEADERS ===
  /\[{2,}[^\]]+\]{2,}/g,        // [[BRACKETS]]
  /#{3,}\s*[A-Z\s]+\s*#{3,}/g,  // ### HEADERS ###
  /---+\s*[A-Z\s]+\s*---+/g,    // --- SEPARATORS ---
]

/**
 * XML/HTML-like tag patterns that might leak.
 */
const TAG_PATTERNS = [
  /<\/?[a-z_]+[^>]*>/gi,        // <tag> or </tag>
  /\[\/?[a-z_]+\]/gi,           // [tag] or [/tag]
]

/**
 * Design terminology that Gemini might render as text.
 */
const DESIGN_TERMINOLOGY_PATTERNS = [
  /\bDOMINANT\b/g,
  /\bLARGEST\b/g,
  /\bMOST\s+IMPACTFUL\b/gi,
  /\bvisual\s+weight\b/gi,
  /\bfocal\s+point\b/gi,
  /\bhierarchy\b/gi,
  /\bprominence\b/gi,
  /\blayout\s+zone\b/gi,
  /\bsafe\s+zone\b/gi,
  /\bclear\s+zone\b/gi,
  /\boverlay\s+zone\b/gi,
]

/**
 * Placeholder patterns like {{variable}} or [placeholder].
 */
const PLACEHOLDER_PATTERNS = [
  /\{\{[^}]+\}\}/g,             // {{placeholder}}
  /\[\[[^\]]+\]\]/g,            // [[placeholder]]
  /\[TBA\]/gi,                  // [TBA]
  /\[TBD\]/gi,                  // [TBD]
  /\[placeholder\]/gi,
]

// ============================================================
// MAIN SANITIZATION FUNCTIONS
// ============================================================

/**
 * Sanitizes a prompt string for Gemini image generation.
 * Removes field labels, instructions, headers, and other text that
 * might be rendered literally in the generated image.
 */
export function sanitizeForGemini(prompt: string): string {
  if (!prompt) return ''

  let sanitized = prompt

  // Remove field labels
  for (const pattern of FIELD_LABEL_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  // Remove instruction phrases
  for (const pattern of INSTRUCTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  // Remove section headers
  for (const pattern of SECTION_HEADER_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  // Remove XML/HTML tags
  for (const pattern of TAG_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  // Remove design terminology (uppercase versions that look like instructions)
  for (const pattern of DESIGN_TERMINOLOGY_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  // Remove placeholders
  for (const pattern of PLACEHOLDER_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
  }

  // Clean up resulting whitespace
  sanitized = sanitized
    .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
    .replace(/[ \t]{2,}/g, ' ')   // Max 1 space
    .replace(/^\s+|\s+$/gm, '')   // Trim lines
    .trim()

  return sanitized
}

/**
 * Extracts only the pure text content values from compiled form data.
 * Returns an array of strings without any labels or metadata.
 */
export function extractPureTextContent(data: CompiledFormData): string[] {
  const textValues: string[] = []

  // Primary text (event name/title)
  if (data.eventName?.trim()) {
    textValues.push(data.eventName.trim())
  }

  // Tagline/subtitle
  if (data.tagline?.trim()) {
    textValues.push(data.tagline.trim())
  }

  // Date (formatted, no label)
  if (data.date?.trim()) {
    textValues.push(data.date.trim())
  }

  // Time (no label)
  if (data.time?.trim()) {
    textValues.push(data.time.trim())
  }

  // Venue (no label)
  if (data.venue?.trim()) {
    textValues.push(data.venue.trim())
  }

  // Speaker info (combine name and designation naturally)
  if (data.speakerName?.trim()) {
    let speakerText = data.speakerName.trim()
    if (data.speakerDesignation?.trim()) {
      speakerText += `, ${data.speakerDesignation.trim()}`
    }
    textValues.push(speakerText)
  }

  // Organization (no label)
  if (data.organizationName?.trim()) {
    textValues.push(data.organizationName.trim())
  }

  // Custom fields (values only)
  for (const value of Object.values(data.customFields || {})) {
    if (value?.trim()) {
      textValues.push(value.trim())
    }
  }

  return textValues
}

/**
 * Builds a narrative description of the event for scene context.
 * This describes the IMAGE SCENE, not what text to render.
 */
export function buildNarrativeDescription(
  data: CompiledFormData,
  eventType?: string
): string {
  const parts: string[] = []

  // Determine the event type for narrative
  const type = eventType || data.eventType || 'professional event'

  // Build the scene narrative
  if (data.eventName) {
    parts.push(`A professionally designed ${type} poster`)
  } else {
    parts.push(`A ${type} promotional design`)
  }

  // Add venue context if available (affects scene mood)
  if (data.venue?.trim()) {
    const venue = data.venue.toLowerCase()
    if (venue.includes('hotel') || venue.includes('convention')) {
      parts.push('with an elegant, corporate atmosphere')
    } else if (venue.includes('university') || venue.includes('college')) {
      parts.push('with an academic, intellectual ambiance')
    } else if (venue.includes('stadium') || venue.includes('arena')) {
      parts.push('with an energetic, grand-scale feel')
    } else if (venue.includes('outdoor') || venue.includes('garden')) {
      parts.push('with a fresh, natural setting')
    }
  }

  // Add speaker context if available (affects composition)
  if (data.speakerName?.trim()) {
    parts.push('featuring a speaker presentation area')
  }

  return parts.join(' ')
}

/**
 * Creates a clean text manifest - just the values to render.
 * No labels, no instructions, just quoted strings.
 */
export function buildTextManifest(data: CompiledFormData): string {
  const textValues = extractPureTextContent(data)

  if (textValues.length === 0) {
    return ''
  }

  // Format as simple quoted strings, one per line
  return textValues
    .map(text => `"${text}"`)
    .join('\n')
}

/**
 * Creates semantic negative prompts to exclude labels and instructions.
 * Uses descriptive language, not "don't" or "no" instructions.
 */
export function buildLabelExclusionPrompts(): string[] {
  return [
    'clean design without visible field labels',
    'no colon-prefixed text labels',
    'no instruction text or metadata',
    'no placeholder brackets',
    'no XML or HTML tags',
    'no section headers or separators',
    'no uppercase instruction words',
    'professional typography without data labels',
  ]
}

/**
 * Sanitizes the entire prompt structure for Gemini.
 * Combines all sanitization steps into one comprehensive clean.
 */
export function sanitizePromptForGemini(
  prompt: string,
  compiledData?: CompiledFormData
): {
  sceneDescription: string
  textContent: string[]
  exclusions: string[]
  sanitizedPrompt: string
} {
  // 1. Sanitize the main prompt
  const sanitizedPrompt = sanitizeForGemini(prompt)

  // 2. Extract pure text content if compiled data is provided
  const textContent = compiledData
    ? extractPureTextContent(compiledData)
    : []

  // 3. Build scene description
  const sceneDescription = compiledData
    ? buildNarrativeDescription(compiledData)
    : ''

  // 4. Get semantic exclusions
  const exclusions = buildLabelExclusionPrompts()

  return {
    sceneDescription,
    textContent,
    exclusions,
    sanitizedPrompt,
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Checks if a string contains potential label leaks.
 * Useful for debugging and validation.
 */
export function detectLabelLeaks(text: string): string[] {
  const leaks: string[] = []

  // Check for field labels
  for (const pattern of FIELD_LABEL_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      leaks.push(...matches.map(m => `Field label: "${m.trim()}"`))
    }
  }

  // Check for instruction phrases
  for (const pattern of INSTRUCTION_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      leaks.push(...matches.map(m => `Instruction: "${m.trim()}"`))
    }
  }

  // Check for section headers
  for (const pattern of SECTION_HEADER_PATTERNS) {
    const matches = text.match(pattern)
    if (matches) {
      leaks.push(...matches.map(m => `Header: "${m.trim()}"`))
    }
  }

  return leaks
}

/**
 * Validates that a prompt is clean before sending to Gemini.
 * Returns true if no leaks detected.
 */
export function isPromptClean(prompt: string): boolean {
  return detectLabelLeaks(prompt).length === 0
}
