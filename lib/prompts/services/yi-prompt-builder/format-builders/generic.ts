/**
 * Generic Prompt Builder v4.0
 * Fallback for unknown or custom formats
 * Enhanced with logo awareness, brand context, and quality context
 *
 * v4.0: Now extracts ALL form fields dynamically instead of hardcoded patterns
 * This ensures format-specific fields (videoTitle, hookText, recipientName, etc.)
 * are properly passed to the image generation AI.
 */

import type { EnhancedBuildOptions } from '../types'
import { buildLogoContext, buildBrandContext, buildQualityContext } from '../context-helpers'

// ============================================================
// FIELD EXTRACTION HELPERS
// ============================================================

// Fields to skip (internal/meta fields)
const SKIP_FIELDS = new Set([
  '_id', '_timestamp', '_version', '_cache',
  'language', 'style', 'colorScheme', 'theme',
  'formatId', 'format', 'organizationId', 'verticalSlug'
])

// Priority fields that should appear first in text content
const PRIORITY_FIELDS = [
  'title', 'headline', 'eventName', 'name', 'videoTitle', 'postTitle',
  'recipientName', 'certificateTitle', 'fullName'
]

// Fields that are typically secondary/supporting text
const SECONDARY_FIELDS = [
  'description', 'caption', 'body', 'details', 'message',
  'hookText', 'tagline', 'subheadline', 'subtitle'
]

interface ExtractedField {
  role: string
  value: string
  prominence: 'primary' | 'secondary' | 'tertiary'
}

/**
 * Convert camelCase or snake_case field names to human-readable roles
 */
function fieldToRole(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1') // camelCase to spaces
    .replace(/_/g, ' ')         // snake_case to spaces
    .trim()
    .toLowerCase()
}

/**
 * Extract all text-like fields from form data
 * Preserves field semantics for better AI prompting
 */
function extractAllFields(formData: Record<string, unknown>): ExtractedField[] {
  const fields: ExtractedField[] = []
  const processedKeys = new Set<string>()

  // First pass: Extract priority fields (titles, headlines)
  for (const key of PRIORITY_FIELDS) {
    const value = formData[key]
    if (typeof value === 'string' && value.trim() && !processedKeys.has(key)) {
      fields.push({
        role: fieldToRole(key),
        value: value.trim(),
        prominence: 'primary'
      })
      processedKeys.add(key)
    }
  }

  // Second pass: Extract secondary fields (descriptions, captions)
  for (const key of SECONDARY_FIELDS) {
    const value = formData[key]
    if (typeof value === 'string' && value.trim() && !processedKeys.has(key)) {
      fields.push({
        role: fieldToRole(key),
        value: value.trim(),
        prominence: 'secondary'
      })
      processedKeys.add(key)
    }
  }

  // Third pass: Extract all remaining string fields
  for (const [key, value] of Object.entries(formData)) {
    if (
      typeof value === 'string' &&
      value.trim() &&
      !processedKeys.has(key) &&
      !SKIP_FIELDS.has(key) &&
      !key.startsWith('_')
    ) {
      fields.push({
        role: fieldToRole(key),
        value: value.trim(),
        prominence: 'tertiary'
      })
      processedKeys.add(key)
    }
  }

  return fields
}

/**
 * Build text content section from extracted fields
 */
function buildTextContentSection(fields: ExtractedField[]): string {
  if (fields.length === 0) {
    return '<text_content>\n<text role="headline" prominence="LARGEST">Professional Design</text>\n</text_content>'
  }

  const lines: string[] = ['<text_content>']

  for (const field of fields) {
    const prominence = field.prominence === 'primary' ? 'LARGEST'
      : field.prominence === 'secondary' ? 'medium'
      : 'small'
    const style = field.prominence === 'primary' ? 'bold, clear, high contrast'
      : field.prominence === 'secondary' ? 'clean, readable'
      : 'subtle, supporting'

    lines.push(`<text role="${field.role}" prominence="${prominence}" style="${style}">${field.value}</text>`)
  }

  lines.push('</text_content>')
  return lines.join('\n')
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildGenericPrompt(
  formatId: string,
  formData: Record<string, unknown>,
  options: EnhancedBuildOptions = {}
): string {
  // Extract ALL text fields from form data dynamically
  const extractedFields = extractAllFields(formData)

  // Get primary title for subject line (fallback to formatId)
  const primaryField = extractedFields.find(f => f.prominence === 'primary')
  const title = primaryField?.value || formatId

  // Get description for subject details
  const secondaryField = extractedFields.find(f => f.prominence === 'secondary')
  const description = secondaryField?.value || ''

  // Build text content section from ALL fields
  const textContentSection = buildTextContentSection(extractedFields)

  // Style and color scheme (these are meta, not content)
  const style = (formData.style || 'modern professional') as string
  const colorScheme = (formData.colorScheme || 'brand-appropriate colors') as string

  // Build context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, formatId)

  // Determine aspect ratio from format ID
  let aspectRatio = '1:1 Square'
  if (formatId.includes('story') || formatId.includes('vertical')) {
    aspectRatio = '9:16 Portrait'
  } else if (formatId.includes('banner') || formatId.includes('cover') || formatId.includes('thumbnail')) {
    aspectRatio = '16:9 Landscape'
  } else if (formatId.includes('a4') || formatId.includes('a5') || formatId.includes('poster')) {
    aspectRatio = '4:5 Portrait'
  } else if (formatId.includes('certificate')) {
    aspectRatio = '1.41:1 Landscape'
  }

  // Format the ID for display
  const formattedFormat = formatId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Determine colors - use brand colors if available
  const finalColorScheme = options.brandContext?.primaryColor
    ? `Brand colors: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}, ${options.brandContext.accentColor || 'accent'}`
    : colorScheme

  return `
<task>Generate a professional ${formattedFormat} design</task>

<format>
Type: ${formattedFormat}
Aspect Ratio: ${aspectRatio}
Purpose: Professional marketing/communication material
</format>

${logoContext}

${brandContext}

${qualityContext}

<subject>
A professional graphic for: "${title}"
${description ? `Details: ${description}` : ''}
The design should be visually appealing, clear, and effective for its purpose.
</subject>

<composition>
Layout: Clean, organized layout with clear visual hierarchy
- Main title/headline as the most prominent element
- Supporting content appropriately sized
- Brand elements positioned properly
${options.logoAwareness?.hasLogo ? `- Logo zone: ${options.logoAwareness.logoPosition} kept clear for overlay` : '- Logo space in corner'}
- Adequate spacing and margins
- Balanced composition

Background: ${style} background ${options.brandContext ? `using brand colors (${options.brandContext.primaryColor})` : 'appropriate for the format'}
Visual Treatment: Professional, clean, purposeful
</composition>

${textContentSection}

<style>
Visual Style: ${style}
Color Palette: ${finalColorScheme}
Mood: Professional, appropriate, effective
Typography: Clear hierarchy, readable fonts
</style>

<quality_markers>
- Professional quality output
- Clear visual hierarchy
- All text clearly legible
- Appropriate for intended use
- Clean, polished design
${options.logoAwareness?.hasLogo ? '- Logo area clean for overlay' : ''}
${options.brandContext ? '- Brand colors properly applied' : ''}
</quality_markers>

<constraints>
Avoid: Cluttered layout, poor hierarchy, illegible text, unprofessional design, mismatched elements, inconsistent styling
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>
`.trim()
}
