/**
 * Certificate Border Styles
 * Comprehensive border definitions for professional certificate designs
 *
 * Each style includes detailed prompt fragments that describe the visual
 * architecture Gemini should generate for frame-worthy certificates.
 */

import type { BorderStyle, BorderStyleId } from '../types'

// ============================================================
// CERTIFICATE BORDER STYLES
// ============================================================

export const CERTIFICATE_BORDER_STYLES: Record<BorderStyleId, BorderStyle> = {
  classic_ornate: {
    id: 'classic_ornate',
    name: 'Classic Ornate',
    category: 'ornate',
    description: 'Victorian-inspired with intricate scrollwork and nested lines',
    innerPadding: '10-12% of width',
    outerBorder: '3-4% of width',
    cornerTreatment: {
      type: 'flourish',
      description: 'Elaborate Victorian corner flourishes with spiral scrollwork extending into frame',
      size: '15-20% of border width',
    },
    lineStyles: [
      { position: 'outer', style: 'ornate', thickness: '3-4px', colorRole: 'gold' },
      { position: 'inner', style: 'double', thickness: '1-2px', colorRole: 'primary' },
      { position: 'accent', style: 'solid', thickness: '1px', colorRole: 'secondary' },
    ],
    decorativeElements: [
      { type: 'flourish', position: 'corners', description: 'Elaborate Victorian scrollwork spirals' },
      { type: 'pattern', position: 'border-fill', description: 'Subtle filigree pattern between border lines' },
      { type: 'seal', position: 'top-right', description: 'Embossed gold seal with ribbon' },
    ],
    colorGuidance: 'Antique gold (#D4AF37) for outer decorations, deep navy (#1E3A5F) for inner lines, cream (#F5F5DC) background',
    promptFragment: `
BORDER ARCHITECTURE - CLASSIC ORNATE STYLE:
Ornate decorative gold border featuring intricate Victorian scrollwork with the following layers:
- OUTER FRAME (3-4% width): Antique gold (#D4AF37) ornate border with embossed appearance
- CORNER FLOURISHES: Elaborate Victorian spiral scrollwork extending 15-20% into the frame at each corner
- INNER ACCENT LINES: Double-line frame in deep navy (#1E3A5F) creating depth and formality
- FILIGREE FILL: Subtle decorative filigree pattern between outer and inner border lines
- DECORATIVE ELEMENTS: Gold foil accents, ribbon graphics near seal area
- BACKGROUND: Cream/ivory (#F5F5DC) aged parchment texture with subtle warmth

The border should appear embossed and prestigious, worthy of framing.
Victorian elegance with timeless sophistication.`,
  },

  modern_minimal: {
    id: 'modern_minimal',
    name: 'Modern Minimal',
    category: 'modern',
    description: 'Clean geometric lines with subtle sophistication',
    innerPadding: '8-10% of width',
    outerBorder: '1-2% of width',
    cornerTreatment: {
      type: 'geometric',
      description: 'Clean 90-degree corners with subtle accent marks',
      size: '5% of border width',
    },
    lineStyles: [
      { position: 'outer', style: 'solid', thickness: '2px', colorRole: 'primary' },
      { position: 'accent', style: 'solid', thickness: '0.5px', colorRole: 'accent' },
    ],
    decorativeElements: [
      { type: 'geometric', position: 'corners', description: 'Small geometric accent at each corner' },
    ],
    colorGuidance: 'Charcoal (#36454F) primary, silver (#C0C0C0) accents, pure white background',
    promptFragment: `
BORDER ARCHITECTURE - MODERN MINIMAL STYLE:
Clean, contemporary border design with refined simplicity:
- OUTER FRAME (1-2% width): Thin charcoal (#36454F) line with precise edges
- INNER ACCENT: Hair-thin silver (#C0C0C0) line 5mm inside primary border
- CORNER TREATMENT: Small geometric accent marks at each corner (subtle, not ornate)
- GENEROUS WHITE SPACE: Abundant breathing room between border and content
- BACKGROUND: Pure white or very light gray, minimal texture

Modern sophistication through restraint. Clean lines convey contemporary professionalism.
Design should feel like premium stationery from a world-class design studio.`,
  },

  corporate_professional: {
    id: 'corporate_professional',
    name: 'Corporate Professional',
    category: 'corporate',
    description: 'Business-appropriate with authoritative presence',
    innerPadding: '8-10% of width',
    outerBorder: '2-3% of width',
    cornerTreatment: {
      type: 'minimal',
      description: 'Clean corners with small decorative brackets',
      size: '8% of border width',
    },
    lineStyles: [
      { position: 'outer', style: 'solid', thickness: '3px', colorRole: 'primary' },
      { position: 'inner', style: 'solid', thickness: '1px', colorRole: 'gold' },
    ],
    decorativeElements: [
      { type: 'geometric', position: 'corners', description: 'Small corner brackets or chevrons' },
      { type: 'seal', position: 'top-right', description: 'Corporate seal placeholder' },
    ],
    colorGuidance: 'Corporate blue (#002366) for frame, gold (#C9A227) for accents, white background',
    promptFragment: `
BORDER ARCHITECTURE - CORPORATE PROFESSIONAL STYLE:
Business-appropriate border conveying authority and trust:
- OUTER FRAME (2-3% width): Solid corporate blue (#002366) with clean edges
- GOLD ACCENT LINE: Thin gold (#C9A227) inner border adding executive polish
- CORNER BRACKETS: Small, refined corner brackets or chevrons (not ornate)
- CORPORATE SEAL ZONE: Space in top-right for official seal or emblem
- BACKGROUND: Clean white, professional and crisp

Design suitable for boardroom display. Conveys institutional authority.
Business elegance without ostentation. Trustworthy and respectable.`,
  },

  academic_traditional: {
    id: 'academic_traditional',
    name: 'Academic Traditional',
    category: 'academic',
    description: 'Scholarly with classical motifs',
    innerPadding: '10-12% of width',
    outerBorder: '3-4% of width',
    cornerTreatment: {
      type: 'laurel',
      description: 'Laurel leaf motifs at corners symbolizing achievement',
      size: '12-15% of border width',
    },
    lineStyles: [
      { position: 'outer', style: 'solid', thickness: '2px', colorRole: 'primary' },
      { position: 'inner', style: 'double', thickness: '1px', colorRole: 'bronze' },
    ],
    decorativeElements: [
      { type: 'laurel', position: 'corners', description: 'Classical laurel wreaths at corners' },
      { type: 'seal', position: 'top-center', description: 'Academic crest or seal placeholder' },
      { type: 'pattern', position: 'border-fill', description: 'Subtle Greco-Roman pattern' },
    ],
    colorGuidance: 'Deep burgundy (#722F37) for frame, bronze (#CD7F32) for accents, ivory (#FFFFF0) background',
    promptFragment: `
BORDER ARCHITECTURE - ACADEMIC TRADITIONAL STYLE:
Scholarly border inspired by prestigious university certificates:
- OUTER FRAME (3-4% width): Deep burgundy (#722F37) with classical proportions
- LAUREL CORNERS: Classical laurel leaf motifs at each corner symbolizing achievement
- BRONZE ACCENTS: Double-line inner border in bronze (#CD7F32) for scholarly warmth
- ACADEMIC CREST ZONE: Space at top-center for institutional seal or crest
- GRECO-ROMAN ELEMENTS: Subtle classical pattern details between border lines
- BACKGROUND: Warm ivory (#FFFFF0) with subtle paper texture

Evokes the prestige of Harvard, Oxford, or Cambridge certificates.
Scholarly elegance with centuries of academic tradition.`,
  },
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get border style by ID
 */
export function getBorderStyle(styleId: string): BorderStyle {
  const normalizedId = styleId.toLowerCase().replace(/\s+/g, '_') as BorderStyleId
  return CERTIFICATE_BORDER_STYLES[normalizedId] || CERTIFICATE_BORDER_STYLES.classic_ornate
}

/**
 * Get prompt fragment for a border style
 */
export function getBorderStylePromptFragment(styleId: string): string {
  const style = getBorderStyle(styleId)
  return style.promptFragment
}

/**
 * Get all available border style IDs
 */
export function getAvailableBorderStyles(): BorderStyleId[] {
  return Object.keys(CERTIFICATE_BORDER_STYLES) as BorderStyleId[]
}

/**
 * Map legacy style names to new style IDs
 */
export function normalizeStyleId(style: string): BorderStyleId {
  const styleMap: Record<string, BorderStyleId> = {
    classic: 'classic_ornate',
    ornate: 'classic_ornate',
    victorian: 'classic_ornate',
    traditional: 'classic_ornate',
    modern: 'modern_minimal',
    minimal: 'modern_minimal',
    contemporary: 'modern_minimal',
    clean: 'modern_minimal',
    corporate: 'corporate_professional',
    professional: 'corporate_professional',
    business: 'corporate_professional',
    executive: 'corporate_professional',
    academic: 'academic_traditional',
    scholarly: 'academic_traditional',
    university: 'academic_traditional',
  }

  const normalized = style.toLowerCase().replace(/\s+/g, '_')
  return styleMap[normalized] || (normalized as BorderStyleId) || 'classic_ornate'
}
