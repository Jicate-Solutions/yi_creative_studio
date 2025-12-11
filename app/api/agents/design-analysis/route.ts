/**
 * Design Analysis Agent API Route
 *
 * Analyzes event details using Claude Agent and returns contextual
 * design recommendations for AI-driven background generation.
 *
 * POST /api/agents/design-analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUsageTracker } from '@/lib/services/api-usage'
import {
  analyzeEventWithAgentSafe,
  type DesignConstraints,
  type EventAnalysisInput,
} from '@/lib/agents/design-analysis-agent'
import type { VerticalPreset } from '@/types/database.types'

interface RequestBody {
  /** Event title */
  title: string
  /** Event description */
  description?: string
  /** Venue information */
  venue?: string
  /** Additional context */
  additionalContext?: string
  /** Vertical slug (to load preset) */
  verticalSlug?: string
  /** Organization ID (for brand context) */
  organizationId?: string
  /** Brand colors override */
  brandContext?: {
    organizationName: string
    primaryColor?: string
    secondaryColor?: string
    accentColor?: string
    useBrandColors?: boolean
  }
  /** User-selected colors from Color tab */
  userColors?: {
    hasCustomColors: boolean
    primary?: string
    secondary?: string
    accent?: string
    paletteName?: string
  }
  /** Logo awareness context */
  logoAwareness?: {
    hasLogo: boolean
    logoPosition: string
    logoSize: string
    logos?: Array<{ position: string; size: string }>
  }
  /** Format dimensions */
  formatDimensions?: {
    width: number
    height: number
  }
  /** Format name */
  formatName?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization for usage tracking
    const { data: member } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    const body: RequestBody = await request.json()

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Build event analysis input
    const input: EventAnalysisInput = {
      title: body.title,
      description: body.description,
      venue: body.venue,
      additionalContext: body.additionalContext,
    }

    // Build constraints from request
    const constraints: DesignConstraints = {
      formatDimensions: body.formatDimensions,
      formatName: body.formatName,
    }

    // Load vertical preset if slug provided
    if (body.verticalSlug) {
      const { data: vertical } = await supabase
        .from('vertical_presets')
        .select('*')
        .eq('slug', body.verticalSlug)
        .eq('is_active', true)
        .single()

      if (vertical) {
        constraints.verticalPreset = vertical as VerticalPreset
      }
    }

    // Set brand context if provided
    if (body.brandContext) {
      constraints.brandContext = {
        organizationName: body.brandContext.organizationName,
        primaryColor: body.brandContext.primaryColor,
        secondaryColor: body.brandContext.secondaryColor,
        accentColor: body.brandContext.accentColor,
        useBrandColors: body.brandContext.useBrandColors,
      }
    }

    // Set user-selected colors if provided
    if (body.userColors) {
      constraints.userColors = {
        hasCustomColors: body.userColors.hasCustomColors,
        primary: body.userColors.primary,
        secondary: body.userColors.secondary,
        accent: body.userColors.accent,
        paletteName: body.userColors.paletteName,
      }
    }

    // Set logo awareness if provided
    if (body.logoAwareness) {
      constraints.logoAwareness = {
        hasLogo: body.logoAwareness.hasLogo,
        logoPosition: body.logoAwareness.logoPosition as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top',
        logoSize: body.logoAwareness.logoSize as 'small' | 'medium' | 'large',
        logos: body.logoAwareness.logos?.map(l => ({
          position: l.position as 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-top',
          size: l.size as 'small' | 'medium' | 'large',
        })),
      }
    }

    console.log('[Design Analysis API] Analyzing event:', body.title)
    console.log('[Design Analysis API] Constraints:', {
      hasVertical: !!constraints.verticalPreset,
      hasBrand: !!constraints.brandContext?.useBrandColors,
      hasUserColors: !!constraints.userColors?.hasCustomColors,
      hasLogo: !!constraints.logoAwareness?.hasLogo,
    })

    // Call the agent
    const result = await analyzeEventWithAgentSafe(input, constraints)

    // Track usage if we have an organization
    if (member?.organization_id && result.usage.inputTokens > 0) {
      const usageTracker = createUsageTracker({
        organizationId: member.organization_id,
        userId: user.id,
      })

      await usageTracker.track(
        'design_analysis_agent',
        'claude',
        result.usage.model,
        {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          cachedTokens: 0,
        }
      )
    }

    console.log('[Design Analysis API] Analysis complete:', {
      eventType: result.recommendation.detectedEventType,
      secondaryContext: result.recommendation.secondaryContext,
      mood: result.recommendation.mood,
      durationMs: result.usage.durationMs,
    })

    return NextResponse.json({
      success: true,
      recommendation: result.recommendation,
      usage: result.usage,
      constraintsApplied: result.constraintsApplied,
    })
  } catch (error) {
    console.error('[Design Analysis API] Error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check for API key issues
    if (errorMessage.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { error: 'Design analysis service not configured' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: `Analysis failed: ${errorMessage}` },
      { status: 500 }
    )
  }
}
