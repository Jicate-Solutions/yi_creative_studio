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
}

export interface AIPlacementResult {
  placements: Array<{
    logoId: string
    position: LogoPosition
    size?: LogoSizePreset
    backgroundShape?: LogoBackgroundShape
  }>
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

## Size Recommendations
Based on logo count per strip:
- 1-2 logos: "large"
- 3-4 logos: "medium"
- 5-6 logos: "small"

## Background Shape Recommendations
- Brand logos: "none" (they have their own backgrounds)
- Vertical/program logos: "rounded" or "none"
- Sponsor/partner logos: "rectangle" or "rounded" (for visibility)

## Output Format
Respond with ONLY a valid JSON object (no markdown, no explanation):
{
  "placements": [
    { "logoId": "...", "position": "top-1", "size": "large", "backgroundShape": "none" },
    ...
  ],
  "reasoning": "Brief 1-2 sentence explanation of the strategy used",
  "confidence": 0.95
}

Important: The confidence should be between 0.0 and 1.0, where 1.0 means perfect placement.`
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
    if (userId) {
      await trackApiUsage({
        userId,
        organizationId,
        provider: 'anthropic',
        model,
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        stage: 'logo_placement',
        requestId: `logo-placement-${Date.now()}`,
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
