/**
 * Content Density Analyzer
 *
 * v25.1: Analyzes user content length to determine visual density needs
 *
 * When content is sparse (short event name, no description, few speakers),
 * the poster needs richer background visuals to fill the empty space.
 * When content is rich (long descriptions, many speakers), the background
 * should be cleaner to prioritize text readability.
 */

export type ContentDensity = 'sparse' | 'moderate' | 'rich'

export interface ContentDensityAnalysis {
  /** Total character count of all text content */
  totalChars: number
  /** Estimated word count */
  wordCount: number
  /** Number of distinct content elements (speakers, venue, description, etc.) */
  elementCount: number
  /** Content density classification */
  density: ContentDensity
  /** Whether background should be visually enriched */
  shouldEnrichBackground: boolean
  /** Recommended decorative element count multiplier */
  decorativeMultiplier: number
  /** Recommended background complexity level */
  backgroundComplexity: 'simple' | 'moderate' | 'immersive'
  /** Detailed analysis for logging */
  analysis: string
}

/**
 * Analyzes the content length and density of event poster data
 * Returns recommendations for visual density adjustments
 */
export function analyzeContentDensity(data: {
  eventName?: string
  eventDescription?: string
  eventNote?: string
  venue?: string
  speakers?: Array<{ name?: string; designation?: string }>
  subheadline?: string
  tagline?: string
}): ContentDensityAnalysis {
  // Collect all content fields
  const contentFields = [
    data.eventName || '',
    data.eventDescription || '',
    data.eventNote || '',
    data.venue || '',
    data.subheadline || '',
    data.tagline || '',
    ...(data.speakers || []).map(s =>
      `${s.name || ''} ${s.designation || ''}`.trim()
    )
  ]

  // Calculate metrics
  const combinedText = contentFields.join(' ').trim()
  const totalChars = combinedText.length
  const wordCount = combinedText.split(/\s+/).filter(w => w.length > 0).length

  // Count non-empty content elements
  const elementCount = contentFields.filter(f => f.trim().length > 0).length
  const speakerCount = (data.speakers || []).filter(s => s.name?.trim()).length

  // Determine density thresholds
  // Sparse: < 80 chars OR < 15 words
  // Moderate: 80-250 chars OR 15-50 words
  // Rich: > 250 chars OR > 50 words
  let density: ContentDensity
  let shouldEnrichBackground: boolean
  let decorativeMultiplier: number
  let backgroundComplexity: 'simple' | 'moderate' | 'immersive'

  // v24.12.4: Increased multipliers for richer, more professional backgrounds
  if (totalChars < 80 || wordCount < 15) {
    density = 'sparse'
    shouldEnrichBackground = true
    decorativeMultiplier = 2.2  // Was 1.8 → Now 2.2 (120% more elements)
    backgroundComplexity = 'immersive'
  } else if (totalChars < 250 || wordCount < 50) {
    density = 'moderate'
    shouldEnrichBackground = true  // Was conditional → Now always true
    decorativeMultiplier = 1.6     // Was 1.0-1.3 → Now 1.6
    backgroundComplexity = 'immersive'  // Was 'moderate' → Now 'immersive'
  } else {
    density = 'rich'
    shouldEnrichBackground = true  // Was false → Now true (even rich content gets enhanced background)
    decorativeMultiplier = 1.2     // Was 0.8 → Now 1.2
    backgroundComplexity = 'moderate'  // Was 'simple' → Now 'moderate'
  }

  // Special cases
  // If only event name with no other content, maximize background richness
  const hasOnlyEventName =
    data.eventName &&
    !data.eventDescription &&
    !data.eventNote &&
    speakerCount === 0

  if (hasOnlyEventName) {
    density = 'sparse'
    shouldEnrichBackground = true
    decorativeMultiplier = 2.0  // Double decorative elements
    backgroundComplexity = 'immersive'
  }

  // Build analysis string for logging
  const analysis = [
    `Content: ${totalChars} chars, ${wordCount} words, ${elementCount} elements`,
    `Speakers: ${speakerCount}`,
    `Density: ${density}`,
    `Background: ${backgroundComplexity}`,
    shouldEnrichBackground ? '⚡ ENRICH BACKGROUND' : '✓ Standard background'
  ].join(' | ')

  return {
    totalChars,
    wordCount,
    elementCount,
    density,
    shouldEnrichBackground,
    decorativeMultiplier,
    backgroundComplexity,
    analysis
  }
}

/**
 * Generates prompt instructions for background enrichment based on content density
 * Returns empty string if no enrichment needed
 */
export function buildContentDensityGuidance(analysis: ContentDensityAnalysis): string {
  if (!analysis.shouldEnrichBackground) {
    return ''
  }

  const guidance = `
========================================
⚡ SPARSE CONTENT DETECTED - ENRICH BACKGROUND (v25.1)
========================================

CONTENT ANALYSIS:
- Total content: ${analysis.totalChars} characters, ${analysis.wordCount} words
- Density classification: ${analysis.density.toUpperCase()}
- Background complexity: ${analysis.backgroundComplexity.toUpperCase()}

VISUAL DENSITY INSTRUCTIONS:
Since the text content is minimal, the poster needs RICH, IMMERSIVE VISUALS to fill the canvas and create visual impact.

MANDATORY BACKGROUND REQUIREMENTS:
1. FULL-BLEED IMMERSIVE DESIGN: Background should extend edge-to-edge with rich visual depth
2. ELABORATE DECORATIVE ELEMENTS: Use more decorative patterns, shapes, and visual motifs
3. LAYERED DEPTH: Create multiple visual layers (foreground particles, midground elements, background atmosphere)
4. VISUAL STORYTELLING: Let the background tell the event story since text is minimal
5. DYNAMIC COMPOSITION: Use organic shapes, gradient transitions, and layered depth to create visual interest WITHOUT lines or dividers

RECOMMENDED VISUAL TREATMENTS:
- Organic shapes and blob elements filling negative space
- Gradient meshes with multiple color stops and smooth transitions
- Subtle texture overlays (noise, paper grain, fine fabric weave)
- Iconic imagery related to event theme (larger scale, more prominent)
- Atmospheric bokeh effects, soft light rays, or floating particles
- Environmental depth through color and opacity layers

AVOID:
- Large empty/blank areas (especially in content zone 40-70%)
- Simple flat color backgrounds
- Minimal gradient-only designs
- Sparse compositions that feel incomplete

GOAL: The poster should feel COMPLETE and VISUALLY RICH even with minimal text.
The background becomes the star when content is sparse.
`

  return guidance.trim()
}

/**
 * Returns adjusted decorative element count based on content density
 */
export function getAdjustedElementCount(
  baseCount: number,
  analysis: ContentDensityAnalysis
): number {
  return Math.round(baseCount * analysis.decorativeMultiplier)
}
