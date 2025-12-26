/**
 * Enhanced Typography Enforcer v1.0
 *
 * Strengthens typography enforcement in AI prompts by adding:
 * - Explicit pixel sizes with visual examples
 * - Strict font weight specifications
 * - Visual hierarchy scoring
 * - Font pairing rules
 * - Typography anti-patterns to avoid
 *
 * This makes font styling more prominent and better followed by AI models.
 */

import {
  getTypographySystem,
  getFormatTypography,
  calculatePixelSize,
  type TypographySystem,
  type TextRole,
} from '../knowledge-base/typography-spec'

import {
  getTypographyPromptFragment,
  type TextHierarchySystem,
} from '../knowledge-base/design-architecture/typography/hierarchy-rules'

// ============================================================================
// TYPES
// ============================================================================

export interface EnhancedTypographySpec {
  formatId: string
  systemName: string
  basePixelSize: number
  hierarchy: {
    role: TextRole
    pixelSize: number
    weight: number
    visualWeight: number
    example: string
    enforcement: string
  }[]
  fontPairing: {
    primary: string[]
    secondary?: string[]
    avoid: string[]
  }
  antiPatterns: string[]
  promptFragment: string
}

// ============================================================================
// ENHANCED PROMPT BUILDER
// ============================================================================

/**
 * Build enhanced typography prompt with strict enforcement
 *
 * @param formatId - Format identifier (e.g., 'instagram_post', 'event_poster')
 * @param width - Design width in pixels (for size calculations)
 * @param customBaseSize - Optional custom base size override
 * @returns Comprehensive typography enforcement prompt
 */
export function buildEnhancedTypographyPrompt(
  formatId: string,
  width: number = 1080,
  customBaseSize?: number
): string {
  const formatSpec = getFormatTypography(formatId)
  const hierarchySystem = getTypographyPromptFragment(formatId)

  if (!formatSpec) {
    return hierarchySystem || buildFallbackTypographyPrompt(width)
  }

  const systemSpec = getTypographySystem(formatSpec.system)
  const baseSize = customBaseSize || formatSpec.baseSizePixels

  // Build hierarchy with exact pixel sizes
  const hierarchyLevels = systemSpec.variants.slice(0, 4).map((variant) => {
    const pixelSize = calculatePixelSize(baseSize, variant.sizeRatio)
    return {
      role: variant.role,
      pixelSize,
      weight: variant.weight,
      visualWeight: variant.renderingPriority === 'highest' ? 100 :
        variant.renderingPriority === 'high' ? 75 :
          variant.renderingPriority === 'medium' ? 50 : 25,
      letterSpacing: variant.letterSpacing,
      lineHeight: variant.lineHeight,
      maxChars: variant.maxChars,
      textTransform: variant.textTransform || 'none',
    }
  })

  return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                     TYPOGRAPHY ENFORCEMENT (STRICT)                          ║
╚══════════════════════════════════════════════════════════════════════════════╝

⚠️  CRITICAL: These typography specifications are MANDATORY and must be followed
EXACTLY. The AI model MUST NOT deviate from these font size, weight, and
hierarchy rules. Typography is the PRIMARY vehicle for visual communication.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 TYPOGRAPHY SYSTEM: ${systemSpec.name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Font Families (use these EXACT families):
  Primary: ${systemSpec.fontFamilies.slice(0, 2).join(', ')}
  Fallback: ${systemSpec.fontFamilies.slice(2, 4).join(', ') || 'sans-serif'}

Mood: ${systemSpec.mood.join(', ')}
Minimum Contrast Ratio: ${systemSpec.wcagMinimumContrast}:1 (WCAG ${systemSpec.wcagMinimumContrast >= 7 ? 'AAA' : 'AA'})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 VISUAL HIERARCHY (EXACT SPECIFICATIONS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${hierarchyLevels.map((level, index) => `
${index + 1}. ${level.role.toUpperCase()} TEXT (Visual Weight: ${level.visualWeight}/100)
   ├─ Size: ${level.pixelSize}px EXACT (at ${width}px width)
   ├─ Weight: ${level.weight} (${getFontWeightName(level.weight)})
   ├─ Line Height: ${level.lineHeight}x
   ├─ Letter Spacing: ${level.letterSpacing}em
   ├─ Max Characters: ${level.maxChars} chars
   ├─ Transform: ${level.textTransform}
   └─ ${getTypographyGuidance(level.role, level.pixelSize, level.weight)}
`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ TYPOGRAPHY DO's
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getTypographyDos(formatId).map(rule => `  ✓ ${rule}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✗ TYPOGRAPHY DON'Ts (ANTI-PATTERNS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${getTypographyAntiPatterns(formatSpec.system).map(pattern => `  ✗ ${pattern}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📏 SIZE REFERENCE (Visual Scale)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${buildVisualSizeReference(hierarchyLevels)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 FORMAT-SPECIFIC RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${formatSpec.specialRules.map(rule => `  • ${rule}`).join('\n')}

${hierarchySystem}

⚠️  FINAL REMINDER: Typography is NOT optional styling - it is the PRIMARY
visual hierarchy tool. The above specifications are MANDATORY and cannot be
overridden by creative interpretation. Follow them EXACTLY.
`
}

/**
 * Build fallback typography prompt when format spec not found
 */
function buildFallbackTypographyPrompt(width: number): string {
  const baseSize = Math.round(width / 36) // Roughly 30px for 1080px width

  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 TYPOGRAPHY HIERARCHY (DEFAULT)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. HERO TEXT: ${baseSize * 3}px, weight 800, LARGEST element
2. HEADLINE TEXT: ${baseSize * 2}px, weight 700, secondary emphasis
3. BODY TEXT: ${baseSize}px, weight 400, readable size
4. CAPTION TEXT: ${Math.round(baseSize * 0.75)}px, weight 400, supporting info

Use bold, modern sans-serif fonts. Ensure high contrast and readability.
`
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get human-readable font weight name
 */
function getFontWeightName(weight: number): string {
  const weights: Record<number, string> = {
    300: 'Light',
    400: 'Regular/Normal',
    500: 'Medium',
    600: 'Semi-Bold',
    700: 'Bold',
    800: 'Extra-Bold',
    900: 'Black/Heavy',
  }
  return weights[weight] || `${weight}`
}

/**
 * Get typography guidance for specific role
 */
function getTypographyGuidance(role: TextRole, pixelSize: number, weight: number): string {
  const guidance: Record<string, string> = {
    hero: `This is the DOMINANT text - must be the LARGEST and BOLDEST element on the entire design`,
    headline: `Secondary headline - prominent but not competing with hero text`,
    subheadline: `Supporting headline - readable but clearly subordinate to main headlines`,
    body: `Body text - comfortable reading size, good line spacing`,
    caption: `Small supporting text - legible but not prominent`,
    label: `Uppercase labels - often used for categories or tags`,
    cta: `Call-to-action text - bold, high contrast, demands attention`,
  }

  return guidance[role] || 'Standard text element'
}

/**
 * Get typography DO's for format
 */
function getTypographyDos(formatId: string): string[] {
  const commonDos = [
    'Use the EXACT pixel sizes specified above',
    'Maintain clear size differentiation between hierarchy levels',
    'Ensure hero text is AT LEAST 2x larger than body text',
    'Use font weights to create visual hierarchy (bold for important, regular for supporting)',
    'Apply proper line height for readability (1.1-1.2 for headlines, 1.5-1.6 for body)',
    'Use letter spacing to enhance readability (tighter for large headlines, wider for labels)',
    'Respect maximum character limits to prevent text cramping',
    'Ensure high contrast between text and background (minimum 4.5:1 ratio)',
  ]

  const formatSpecificDos: Record<string, string[]> = {
    event_poster: [
      'Make event name the LARGEST text element - it should dominate the design',
      'Use icons with date/venue for instant scanability',
      'CTA button text must be bold and high-contrast',
    ],
    instagram_post: [
      'Headline must be readable while thumb-scrolling',
      'Text should fill 40%+ of frame for scroll-stopping impact',
      'Mobile-first sizing - test readability on small screens',
    ],
    certificate: [
      'Recipient name is the hero - use elegant script or bold serif',
      'Formal spacing and centered alignment throughout',
      'Traditional, prestigious typography appropriate for framing',
    ],
    youtube_thumbnail: [
      'Maximum 3-5 words only',
      'ALL CAPS for maximum impact',
      'Thick black outline (3-4px) around text for visibility',
      'Must be readable at 160x90px thumbnail size',
    ],
  }

  return [...commonDos, ...(formatSpecificDos[formatId] || [])]
}

/**
 * Get typography anti-patterns to avoid
 */
function getTypographyAntiPatterns(system: TypographySystem): string[] {
  const commonAntiPatterns = [
    'DO NOT make all text the same size - hierarchy is MANDATORY',
    'DO NOT use thin fonts (weight < 400) for hero/headline text',
    'DO NOT use overly decorative fonts that sacrifice readability',
    'DO NOT place text over busy backgrounds without proper contrast',
    'DO NOT ignore line height - cramped text is unreadable',
    'DO NOT exceed maximum character limits - text will look cramped',
    'DO NOT use all caps for body text - only for headlines/labels',
    'DO NOT mix more than 2-3 font weights in a single design',
  ]

  const systemAntiPatterns: Record<TypographySystem, string[]> = {
    'geometric-sans': [
      'DO NOT use serif fonts - this system requires clean sans-serif only',
      'DO NOT use script/handwriting fonts - contradicts geometric aesthetic',
    ],
    'humanist-sans': [
      'DO NOT use geometric or rigid fonts - this system needs organic forms',
      'DO NOT use display/impact fonts - too aggressive for friendly tone',
    ],
    'neo-grotesque': [
      'DO NOT use decorative or stylized fonts - neutrality is key',
      'DO NOT use script fonts - not appropriate for universal appeal',
    ],
    'serif-classical': [
      'DO NOT use modern sans-serif - traditional serif required',
      'DO NOT use decorative fonts for body text - only for accents',
    ],
    'serif-modern': [
      'DO NOT use old-style serif - modern high-contrast serif required',
      'DO NOT use sans-serif for body - contradicts editorial aesthetic',
    ],
    'display': [
      'DO NOT use thin weights - bold impact required',
      'DO NOT use display fonts for body text - too aggressive',
      'DO NOT use lowercase for hero text - ALL CAPS for maximum impact',
    ],
    'script': [
      'DO NOT use script for body text - use only for headlines/accents',
      'DO NOT use multiple script fonts - one script font maximum',
      'DO NOT use all caps with script - natural flow required',
    ],
  }

  return [...commonAntiPatterns, ...(systemAntiPatterns[system] || [])]
}

/**
 * Build visual size reference with ASCII art
 */
function buildVisualSizeReference(levels: any[]): string {
  return levels.map((level, index) => {
    const bars = '█'.repeat(Math.min(Math.round((level.visualWeight / 100) * 40), 40))
    return `  ${level.pixelSize}px │${bars} ${level.role.toUpperCase()}`
  }).join('\n')
}

// ============================================================================
// EXPORT MAIN FUNCTION
// ============================================================================

export {

  buildFallbackTypographyPrompt,
}
