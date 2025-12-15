/**
 * API Route: Optimize Logo Positions
 * Intelligently distributes logos for visual balance using algorithm + AI hybrid approach
 *
 * POST /api/optimize-logo-positions
 *
 * Request body:
 * {
 *   logos: Array<{ id: string, name: string, type?: LogoType }>
 *   formatId: string
 *   useAI?: boolean  // Default: false (algorithm only for speed)
 *   currentPlacements?: Array<{ logoId: string, position: LogoPosition, size?: string, backgroundShape?: string }>
 * }
 *
 * Response:
 * {
 *   success: boolean
 *   placements: Array<{ logoId: string, position: LogoPosition, size?: string, backgroundShape?: string }>
 *   reasoning: string
 *   strategy: 'even' | 'weighted' | 'locked_only' | 'ai'
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  calculateOptimalPositions,
  getOptimizationSummary,
  type LogoInput,
} from '@/lib/services/logo-position-optimizer'
import {
  getAIOptimizedPlacements,
  detectBrandLogos,
} from '@/lib/agents/logo-placement-agent'
import { CREATIVE_FORMATS, type CreativeFormatId } from '@/lib/config/creative-formats'
import type { LogoPosition } from '@/lib/config/constants'
import type { LogoType } from '@/lib/config/logo-locks'
import type { LogoSizePreset, LogoBackgroundShape, LogoBackgroundStyle } from '@/lib/constants/logoConstants'

// ============================================================================
// Types
// ============================================================================

interface RequestBody {
  logos: Array<{
    id: string
    name: string
    type?: LogoType
    category?: string
  }>
  formatId: string
  useAI?: boolean
  currentPlacements?: Array<{
    logoId: string
    position: LogoPosition
    size?: LogoSizePreset
    backgroundShape?: LogoBackgroundShape
    backgroundStyle?: LogoBackgroundStyle
  }>
}

interface OptimizeResponse {
  success: boolean
  placements: Array<{
    logoId: string
    position: LogoPosition
    size?: LogoSizePreset
    backgroundShape?: LogoBackgroundShape
  }>
  reasoning: string
  strategy: 'even' | 'weighted' | 'locked_only' | 'ai'
}

// ============================================================================
// Helper Functions
// ============================================================================

function getFormatDimensions(formatId: string): { width: number; height: number } {
  const format = CREATIVE_FORMATS[formatId as CreativeFormatId]
  if (format) {
    return { width: format.width, height: format.height }
  }
  // Default to event poster dimensions
  return { width: 1080, height: 1350 }
}

// ============================================================================
// Route Handler
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json() as RequestBody
    const { logos, formatId, useAI = false, currentPlacements } = body

    // Validate input
    if (!logos || !Array.isArray(logos) || logos.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No logos provided' },
        { status: 400 }
      )
    }

    // Convert to LogoInput format
    const logoInputs: LogoInput[] = logos.map(l => ({
      id: l.id,
      name: l.name || '',
      type: l.type,
      category: l.category,
    }))

    let response: OptimizeResponse

    if (useAI) {
      // Use Claude AI for intelligent placement
      try {
        const aiResult = await getAIOptimizedPlacements(
          {
            logos: logoInputs,
            formatId,
            formatDimensions: getFormatDimensions(formatId),
            existingPlacements: currentPlacements,
            brandConstraints: detectBrandLogos(logos),
          },
          user.id,
          undefined // organizationId - could be fetched if needed
        )

        // Check if AI returned valid placements
        if (aiResult.placements.length > 0) {
          response = {
            success: true,
            placements: aiResult.placements,
            reasoning: aiResult.reasoning,
            strategy: 'ai',
          }
        } else {
          // Fall back to algorithm if AI failed
          console.log('AI returned no placements, falling back to algorithm')
          const algorithmResult = calculateOptimalPositions({
            logos: logoInputs,
            currentPlacements,
          })

          response = {
            success: true,
            placements: algorithmResult.placements,
            reasoning: getOptimizationSummary(algorithmResult),
            strategy: algorithmResult.reasoning.strategy,
          }
        }
      } catch (aiError) {
        console.error('AI optimization failed, using algorithm:', aiError)
        // Fall back to algorithm on AI error
        const algorithmResult = calculateOptimalPositions({
          logos: logoInputs,
          currentPlacements,
        })

        response = {
          success: true,
          placements: algorithmResult.placements,
          reasoning: getOptimizationSummary(algorithmResult),
          strategy: algorithmResult.reasoning.strategy,
        }
      }
    } else {
      // Use algorithmic distribution (fast, no AI cost)
      const algorithmResult = calculateOptimalPositions({
        logos: logoInputs,
        currentPlacements,
      })

      response = {
        success: true,
        placements: algorithmResult.placements,
        reasoning: getOptimizationSummary(algorithmResult),
        strategy: algorithmResult.reasoning.strategy,
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Logo position optimization error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Optimization failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
