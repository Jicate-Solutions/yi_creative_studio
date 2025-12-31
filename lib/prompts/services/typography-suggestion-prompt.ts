/**
 * Typography Suggestion Prompt Builder
 * Generates AI prompts for intelligent font recommendations
 */

import type { TypographyContext } from '@/types/typography-suggestions'

/**
 * Few-shot examples for typography suggestions
 */
export const TYPOGRAPHY_EXAMPLES = [
  {
    input: { eventType: 'Blood Donation Camp', verticalSlug: 'healthcare', formatId: 'event_poster' },
    output: {
      headingFont: { value: 'playfair_display', label: 'Playfair Display', category: 'serif', reason: 'Elegant serif conveys trust and authority.' },
      bodyFont: { value: 'inter', label: 'Inter', category: 'sans', reason: 'Highly legible sans-serif for critical info.' },
      scale: 1.1,
      typographySystem: 'Serif-Classical',
      confidence: 0.9
    }
  },
  {
    input: { eventType: 'Tech Innovation Fest', verticalSlug: 'livelihood', formatId: 'event_poster' },
    output: {
      headingFont: { value: 'bebas_neue', label: 'Bebas Neue', category: 'display', reason: 'Bold all-caps display for modern tech impact.' },
      bodyFont: { value: 'roboto', label: 'Roboto', category: 'sans', reason: 'Geometric sans aligns with tech standards.' },
      scale: 1.2,
      typographySystem: 'Display-Impact',
      confidence: 0.85
    }
  }
]

/**
 * Build typography suggestion prompt
 */
export function buildTypographySuggestionPrompt(context: TypographyContext): string {
  const { eventType, verticalSlug, formatId, audience, brandColors } = context

  return `You are a professional typography consultant for Yi CreativeStudio. Recommend a font pair (one heading font + one body font) for the following event.

AVAILABLE FONTS:
SANS: inter, dm_sans, nunito, source_sans_pro, open_sans, roboto, poppins, montserrat, lato, raleway, manrope, karla, rubik, barlow, cabin, quicksand
SERIF: merriweather, playfair_display, lora, pt_serif, crimson_text, cormorant, libre_baskerville, eb_garamond, spectral, cardo, yeseva_one, neuton, philosopher
DISPLAY: oswald, bebas_neue, work_sans, syne, archivo_black, anton, righteous, exo_2, teko, passion_one, cinzel, abril_fatface
SCRIPT: dancing_script, pacifico, caveat, great_vibes, satisfy, kalam, permanent_marker

CONTEXT:
- Event: "${eventType}"
- Category: "${verticalSlug}" (healthcare/education/livelihood/sustainability)
- Format: "${formatId}"
- Audience: "${audience || 'General public'}"
${brandColors ? `- Brand Colors: ${brandColors.join(', ')}` : ''}

RULES:
1. Heading: personality-driven. Body: highly readable.
2. Pair Serif + Sans (classic), Sans + Sans (modern), or Display + Sans (impact).
3. Scale: 0.8-0.9 (Certificates), 1.0 (Standard), 1.1-1.3 (Energetic), 1.4+ (Viral).
4. Alignment: Match vertical (Healthcare=Trust, Education=Credibility, Livelihood=Professional).

OUTPUT JSON:
{
  "headingFont": { "value": "font-id", "label": "Font Name", "category": "category", "reason": "Specific rationale" },
  "bodyFont": { "value": "font-id", "label": "Font Name", "category": "category", "reason": "Specific rationale" },
  "scale": 1.0,
  "typographySystem": "Category-System",
  "confidence": 0.9,
  "tips": ["Tip 1", "Tip 2"]
}

  `
}

/**
 * Extract font family names for prompt context
 * All 48 fonts available in the library
 */
export function getFontFamilyList(): string[] {
  return [
    // Sans Serif (16 fonts)
    'inter',
    'dm_sans',
    'nunito',
    'source_sans_pro',
    'open_sans',
    'roboto',
    'poppins',
    'montserrat',
    'lato',
    'raleway',
    'manrope',
    'karla',
    'rubik',
    'barlow',
    'cabin',
    'quicksand',
    // Serif (13 fonts)
    'merriweather',
    'playfair_display',
    'lora',
    'pt_serif',
    'crimson_text',
    'cormorant',
    'libre_baskerville',
    'eb_garamond',
    'spectral',
    'cardo',
    'yeseva_one',
    'neuton',
    'philosopher',
    // Display (12 fonts)
    'oswald',
    'bebas_neue',
    'work_sans',
    'syne',
    'archivo_black',
    'anton',
    'righteous',
    'exo_2',
    'teko',
    'passion_one',
    'cinzel',
    'abril_fatface',
    // Handwriting (7 fonts)
    'dancing_script',
    'pacifico',
    'caveat',
    'great_vibes',
    'satisfy',
    'kalam',
    'permanent_marker',
  ]
}

/**
 * Validate font ID against available fonts
 */
export function isValidFontId(fontId: string): boolean {
  return getFontFamilyList().includes(fontId)
}

/**
 * Font label to ID mapping
 * Maps user-friendly labels to their underscore/kebab-case IDs
 * All 48 fonts in the library
 */
const FONT_LABEL_TO_ID_MAP: Record<string, string> = {
  // Sans Serif (16 fonts)
  'Inter': 'inter',
  'DM Sans': 'dm_sans',
  'Nunito': 'nunito',
  'Source Sans Pro': 'source_sans_pro',
  'Open Sans': 'open_sans',
  'Roboto': 'roboto',
  'Poppins': 'poppins',
  'Montserrat': 'montserrat',
  'Lato': 'lato',
  'Raleway': 'raleway',
  'Manrope': 'manrope',
  'Karla': 'karla',
  'Rubik': 'rubik',
  'Barlow': 'barlow',
  'Cabin': 'cabin',
  'Quicksand': 'quicksand',
  // Serif (13 fonts)
  'Merriweather': 'merriweather',
  'Playfair Display': 'playfair_display',
  'Lora': 'lora',
  'PT Serif': 'pt_serif',
  'Crimson Text': 'crimson_text',
  'Cormorant': 'cormorant',
  'Libre Baskerville': 'libre_baskerville',
  'EB Garamond': 'eb_garamond',
  'Spectral': 'spectral',
  'Cardo': 'cardo',
  'Yeseva One': 'yeseva_one',
  'Neuton': 'neuton',
  'Philosopher': 'philosopher',
  // Display (12 fonts)
  'Oswald': 'oswald',
  'Bebas Neue': 'bebas_neue',
  'Work Sans': 'work_sans',
  'Syne': 'syne',
  'Archivo Black': 'archivo_black',
  'Anton': 'anton',
  'Righteous': 'righteous',
  'Exo 2': 'exo_2',
  'Teko': 'teko',
  'Passion One': 'passion_one',
  'Cinzel': 'cinzel',
  'Abril Fatface': 'abril_fatface',
  // Handwriting (7 fonts)
  'Dancing Script': 'dancing_script',
  'Pacifico': 'pacifico',
  'Caveat': 'caveat',
  'Great Vibes': 'great_vibes',
  'Satisfy': 'satisfy',
  'Kalam': 'kalam',
  'Permanent Marker': 'permanent_marker',
}

/**
 * Normalize font ID from various formats to standard kebab-case
 * Handles: labels, capitalized IDs, extra whitespace
 */
export function normalizeFontId(input: string): string | null {
  if (!input || typeof input !== 'string') return null

  // Trim whitespace
  const trimmed = input.trim()

  // Check if already a valid ID (exact match)
  if (isValidFontId(trimmed)) {
    return trimmed
  }

  // Try lowercase (in case Claude returns capitalized ID like "Inter")
  const lowercase = trimmed.toLowerCase()
  if (isValidFontId(lowercase)) {
    return lowercase
  }

  // Try label-to-ID mapping (e.g., "Playfair Display" → "playfair-display")
  if (FONT_LABEL_TO_ID_MAP[trimmed]) {
    return FONT_LABEL_TO_ID_MAP[trimmed]
  }

  // Try case-insensitive label lookup
  const labelKey = Object.keys(FONT_LABEL_TO_ID_MAP).find(
    key => key.toLowerCase() === trimmed.toLowerCase()
  )
  if (labelKey) {
    return FONT_LABEL_TO_ID_MAP[labelKey]
  }

  // No match found
  return null
}
