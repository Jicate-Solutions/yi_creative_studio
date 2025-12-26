/**
 * AI Logo Placement Agent
 * Uses Claude AI for intelligent logo placement decisions
 *
 * This agent enhances the algorithmic optimizer with AI reasoning for:
 * - Complex multi-strip placement decisions
 * - Visual hierarchy optimization
 * - Context-aware size recommendations
 */

import Anthropic from '@anthropic-ai/sdk'
import type { LogoPosition } from '@/lib/config/constants'
import type { LogoSizePreset, LogoBackgroundShape } from '@/lib/constants/logoConstants'
import type { LogoType } from '@/lib/config/logo-locks'
import type { SpeakerZoneOccupancy } from './speaker-zone-analyzer'
import { trackApiUsage } from '@/lib/services/api-usage'

// ============================================================================
// Types
// ============================================================================

export interface AIPlacementInput {
  logos: Array<{
    id: string
    name: string
    type?: LogoType
    category?: string
  }>
  formatId: string
  formatDimensions: { width: number; height: number }
  existingPlacements?: Array<{
    logoId: string
    position: LogoPosition
  }>
  brandConstraints: {
    yiLogoId?: string
    ciiLogoId?: string
    bharatRisingId?: string
  }
  speakerZones?: SpeakerZoneOccupancy | null  // NEW: Speaker photo zone awareness
}

export interface StripRecommendation {
  widthPercentage: number // Optimal strip width as % of image width (60-100)
  spacingStrategy: 'tight' | 'normal' | 'loose' // Spacing between logos
  alignment: 'left' | 'center' | 'right' | 'justified' // How logos should align
  paddingHorizontal: number // Left/right padding in pixels
  gapBelow?: number // Optional: Gap in pixels before next strip (10-30px, default 15)
}

export interface AIPlacementResult {
  placements: Array<{
    logoId: string
    position: LogoPosition
    size?: LogoSizePreset
    backgroundShape?: LogoBackgroundShape
  }>
  stripRecommendations?: {
    header?: StripRecommendation  // For top-1 to top-6
    middle?: StripRecommendation  // For mid-1 to mid-6
    footer?: StripRecommendation  // For bottom-1 to bottom-6
  }
  reasoning: string
  confidence: number
}

// ============================================================================
// AI Prompt Construction
// ============================================================================

function buildPlacementPrompt(input: AIPlacementInput): string {
  const { logos, formatId, formatDimensions, brandConstraints } = input

  const logosList = logos.map(l => ({
    id: l.id,
    name: l.name,
    type: l.type || 'other',
    category: l.category || 'unspecified',
  }))

  const brandInfo = []
  if (brandConstraints.yiLogoId) {
    brandInfo.push(`- Yi Logo (id: ${brandConstraints.yiLogoId}) → MUST be at "top-1" (LOCKED)`)
  }
  if (brandConstraints.ciiLogoId) {
    brandInfo.push(`- CII Logo (id: ${brandConstraints.ciiLogoId}) → MUST be at "top-6" (LOCKED)`)
  }
  if (brandConstraints.bharatRisingId) {
    brandInfo.push(`- Bharat Rising (id: ${brandConstraints.bharatRisingId}) → SHOULD be at "top-3" (preferred)`)
  }

  return `You are an expert graphic designer optimizing logo placement for visual balance on marketing materials.

## Task
Analyze the provided logos and determine optimal positions for each logo to create a visually balanced design.

## Input Data
**Format:** ${formatId} (${formatDimensions.width}×${formatDimensions.height} pixels)
**Logos to place:** ${JSON.stringify(logosList, null, 2)}

## Brand Constraints (MANDATORY)
${brandInfo.length > 0 ? brandInfo.join('\n') : 'No specific brand constraints'}

${input.speakerZones ? `
## Speaker Photo Zones ⚠️ CRITICAL - AVOID OVERLAPS

${input.speakerZones.description}

**Occupied Grid Positions**: ${input.speakerZones.occupiedGridPositions.join(', ')}

PLACEMENT RULES FOR SPEAKER ZONES:
1. DO NOT place any logos at the occupied positions listed above
2. Speaker photos and logos will visually clash and create poor composition
3. Maintain at least 1 column gap from speaker zones when possible
4. If speaker zones occupy the middle row, prefer placing non-brand logos in top or bottom rows
5. Brand logos (Yi, CII, Bharat Rising) have fixed positions and must remain as locked
6. Example: If speakers occupy mid-1 and mid-6, place flexible logos at mid-3 or mid-4 (center)
` : `
## Speaker Photo Zones

No speaker photos configured. All 18 grid positions are available for logo placement.
`}

## Grid System
The design uses a 6-column × 3-row grid (18 positions total):

**Header Strip (top row):** top-1, top-2, top-3, top-4, top-5, top-6
- For brand logos (Yi, CII, Bharat Rising)
- Yi is LOCKED to top-1, CII is LOCKED to top-6

**Middle Strip (second row):** mid-1, mid-2, mid-3, mid-4, mid-5, mid-6
- For vertical/program logos (Yi Learning, Yi Innovation, etc.)
- For chapter logos

**Footer Strip (bottom row):** bottom-1, bottom-2, bottom-3, bottom-4, bottom-5, bottom-6
- For sponsor and partner logos

## Placement Rules
1. **Brand logos MUST be in header strip** - their positions are locked
2. **Distribute evenly** - avoid clustering logos on one side
3. **Balance visual weight** - larger/important logos at edges or center
4. **Maintain hierarchy** - brand logos most prominent, sponsors smaller
5. **Fill the center** - If you have 3+ logos, use mid-slots (top-3, top-4) to bridge the gap between edges. Avoid [1,2...5,6] clustering.

## Size Recommendations
Based on logo count per strip:
- 1-2 logos: "large"
- 3-4 logos: "medium"
- 5-6 logos: "small"

## Background Shape Recommendations
- Brand logos: "none" (they have their own backgrounds)
- Vertical/program logos: "rounded" or "none"
- Sponsor/partner logos: "rectangle" or "rounded" (for visibility)

## Strip Width & Spacing Intelligence (CRITICAL)
You must analyze the logo count and provide optimal strip configuration:

**Strip Width Guidelines:**
- 1-2 logos: Use 60-70% width (avoid too wide, looks sparse)
- 3-4 logos: Use 75-85% width (balanced distribution)
- 5-6 logos: Use 90-100% width (full width needed)

**Spacing Strategy:**
- "tight": 20-30px gaps (for 5-6 logos, space-constrained)
- "normal": 40-60px gaps (for 3-4 logos, balanced)
- "loose": 80-120px gaps (for 1-2 logos, spacious)

**Alignment Strategy:**
- "left": Logos start from left edge (for asymmetric designs)
- "center": Logos centered in strip (for symmetric, balanced look)
- "right": Logos aligned to right (rare, special cases)
- "justified": Logos spread edge-to-edge (for full-width strips with 3+ logos)

**Padding Recommendations:**
- 1-2 logos: 40-60px horizontal padding (generous breathing room)
- 3-4 logos: 30-40px horizontal padding (moderate)
- 5-6 logos: 20-30px horizontal padding (minimal, maximize space)

**Strip Gap (Vertical Spacing):**
- Gap below header before middle: 10-15px (tight, layered header effect)
- Gap below middle before footer: 20-30px (moderate separation)
- For single strip: No gap needed

**Critical Thinking Required:**
- DON'T make strips too wide for few logos (causes awkward gaps)
- DON'T make strips too narrow for many logos (causes cramping)
- THINK about visual balance: width + spacing + alignment together
- CONSIDER the logo positions you're using (if using only columns 1-3, recommend narrower width)

## Output Format
Respond with ONLY a valid JSON object (no markdown, no explanation):

**For logos on ONE strip:**
{
  "placements": [
    { "logoId": "...", "position": "top-1", "size": "large", "backgroundShape": "none" },
    ...
  ],
  "stripRecommendations": {
    "header": {
      "widthPercentage": 80,
      "spacingStrategy": "normal",
      "alignment": "justified",
      "paddingHorizontal": 40
    }
  },
  "reasoning": "Brief explanation of placement + width/spacing strategy",
  "confidence": 0.95
}

**For logos on TWO strips (e.g., header + middle):**
{
  "placements": [
    { "logoId": "yi-logo", "position": "top-1", "size": "medium", "backgroundShape": "none" },
    { "logoId": "cii-logo", "position": "top-6", "size": "medium", "backgroundShape": "none" },
    { "logoId": "vertical1", "position": "mid-2", "size": "small", "backgroundShape": "rounded" },
    { "logoId": "vertical2", "position": "mid-5", "size": "small", "backgroundShape": "rounded" }
  ],
  "stripRecommendations": {
    "header": {
      "widthPercentage": 70,
      "spacingStrategy": "normal",
      "alignment": "justified",
      "paddingHorizontal": 40,
      "gapBelow": 12
    },
    "middle": {
      "widthPercentage": 60,
      "spacingStrategy": "loose",
      "alignment": "center",
      "paddingHorizontal": 50
    }
  },
  "reasoning": "Header: 2 brand logos at edges with 70% width. Middle: 2 verticals centered at 60% width. Tight 12px gap creates layered header effect.",
  "confidence": 0.95
}

**For logos on THREE strips:**
{
  "stripRecommendations": {
    "header": { "widthPercentage": 85, "spacingStrategy": "normal", "alignment": "justified", "paddingHorizontal": 35, "gapBelow": 15 },
    "middle": { "widthPercentage": 75, "spacingStrategy": "normal", "alignment": "center", "paddingHorizontal": 40, "gapBelow": 25 },
    "footer": { "widthPercentage": 90, "spacingStrategy": "tight", "alignment": "justified", "paddingHorizontal": 30 }
  },
  ...
}

Important:
- The confidence should be between 0.0 and 1.0, where 1.0 means perfect placement
- Provide SEPARATE recommendations for each strip that has logos
- Analyze each strip independently: header logos may need different width than footer logos
- Think about strip hierarchy: brand logos (header) usually wider/more prominent than sponsors (footer)`
}

// ============================================================================
// AI Integration
// ============================================================================

/**
 * Get AI-optimized logo placements using Claude
 */
export async function getAIOptimizedPlacements(
  input: AIPlacementInput,
  userId?: string,
  organizationId?: string
): Promise<AIPlacementResult> {
  const anthropic = new Anthropic()
  const model = 'claude-3-5-haiku-latest'

  const prompt = buildPlacementPrompt(input)

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    // Track API usage
    if (userId && organizationId) {
      // Estimate cost based on Claude Haiku pricing
      const inputCost = (response.usage.input_tokens / 1_000_000) * 0.25
      const outputCost = (response.usage.output_tokens / 1_000_000) * 1.25
      const estimatedCostUsd = inputCost + outputCost

      await trackApiUsage({
        userId,
        organizationId,
        provider: 'claude',
        model,
        requestType: 'logo_placement',
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        estimatedCostUsd,
        success: true,
        metadata: {
          logoCount: input.logos.length,
          formatId: input.formatId,
        },
      })
    }

    // Parse response
    const textBlock = response.content.find(block => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from AI')
    }

    const result = JSON.parse(textBlock.text) as AIPlacementResult

    // Validate and sanitize placements
    const validPositions = new Set([
      'top-1', 'top-2', 'top-3', 'top-4', 'top-5', 'top-6',
      'mid-1', 'mid-2', 'mid-3', 'mid-4', 'mid-5', 'mid-6',
      'bottom-1', 'bottom-2', 'bottom-3', 'bottom-4', 'bottom-5', 'bottom-6',
    ])

    const validSizes = new Set(['small', 'medium', 'large', 'xlarge'])
    const validShapes = new Set(['none', 'rectangle', 'rounded', 'circle'])

    result.placements = result.placements.filter(p => {
      if (!validPositions.has(p.position)) return false
      if (p.size && !validSizes.has(p.size)) p.size = 'medium'
      if (p.backgroundShape && !validShapes.has(p.backgroundShape)) p.backgroundShape = 'none'
      return true
    })

    // NEW: Validate against speaker zones (safety filter)
    if (input.speakerZones && input.speakerZones.occupiedGridPositions.length > 0) {
      const originalCount = result.placements.length

      result.placements = result.placements.filter(placement => {
        const isOccupied = input.speakerZones!.occupiedGridPositions.includes(placement.position)

        if (isOccupied) {
          console.warn(`[Logo Agent] AI placed logo at speaker-occupied zone ${placement.position}, filtering out`)
        }

        return !isOccupied
      })

      const filteredCount = originalCount - result.placements.length
      if (filteredCount > 0) {
        console.log(`[Logo Agent] Filtered ${filteredCount} placement(s) that overlapped with speaker zones`)
      }
    }

    return result
  } catch (error) {
    console.error('AI logo placement failed:', error)

    // Return a fallback result
    return {
      placements: [],
      reasoning: 'AI optimization failed, please use manual placement',
      confidence: 0,
    }
  }
}

/**
 * Detect brand logos from logo list
 */
export function detectBrandLogos(logos: Array<{ id: string; name: string }>): {
  yiLogoId?: string
  ciiLogoId?: string
  bharatRisingId?: string
} {
  const constraints: {
    yiLogoId?: string
    ciiLogoId?: string
    bharatRisingId?: string
  } = {}

  for (const logo of logos) {
    const name = logo.name.toLowerCase()

    // Yi Logo detection
    if (/^yi$/i.test(name) || /^yi\s*logo$/i.test(name) || /^young\s*indians$/i.test(name)) {
      constraints.yiLogoId = logo.id
    }

    // CII Logo detection
    if (/^cii$/i.test(name) || /^cii\s*logo$/i.test(name) || /confederation.*india/i.test(name)) {
      constraints.ciiLogoId = logo.id
    }

    // Bharat Rising detection
    if (/bharat\s*rising/i.test(name)) {
      constraints.bharatRisingId = logo.id
    }
  }

  return constraints
}

/**
 * Apply AI strip recommendations to logo overlay configuration
 * Converts AI's width/spacing/alignment recommendations into practical values
 */
export function applyStripRecommendations(
  recommendation: StripRecommendation | undefined,
  imageWidth: number
): {
  stripWidth: number
  horizontalPadding: number
  spacingGuideline: { min: number; max: number }
} {
  // Default values if no recommendations
  if (!recommendation) {
    return {
      stripWidth: imageWidth,
      horizontalPadding: 40,
      spacingGuideline: { min: 40, max: 60 },
    }
  }

  const { widthPercentage, spacingStrategy, paddingHorizontal } = recommendation

  // Calculate actual strip width
  const stripWidth = Math.floor((imageWidth * widthPercentage) / 100)

  // Convert spacing strategy to pixel ranges
  const spacingGuidelines = {
    tight: { min: 20, max: 30 },
    normal: { min: 40, max: 60 },
    loose: { min: 80, max: 120 },
  }

  return {
    stripWidth,
    horizontalPadding: paddingHorizontal,
    spacingGuideline: spacingGuidelines[spacingStrategy] || spacingGuidelines.normal,
  }
}

/**
 * Get strip recommendation by row (for multi-strip scenarios)
 */
export function getStripRecommendationByRow(
  recommendations: AIPlacementResult['stripRecommendations'],
  row: 'header' | 'middle' | 'footer'
): StripRecommendation | undefined {
  if (!recommendations) return undefined
  return recommendations[row]
}

/**
 * Get spacing multiplier based on AI recommendations
 * Use this to adjust the existing logo-overlay spacing calculations
 */
export function getSpacingMultiplier(
  recommendation: StripRecommendation | undefined
): number {
  if (!recommendation) return 1.0

  const multipliers = {
    tight: 0.7,   // Reduce spacing by 30%
    normal: 1.0,  // Keep default spacing
    loose: 1.5,   // Increase spacing by 50%
  }

  return multipliers[recommendation.spacingStrategy] || 1.0
}
