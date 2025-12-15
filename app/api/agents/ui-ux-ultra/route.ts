/**
 * UI/UX Ultra Agent API Route
 *
 * AI-powered UI component design and redesign with:
 * - Actor-Critic dual-perspective analysis
 * - Component code generation
 * - Glassmorphism, shadows, animations styling
 * - Chrome DevTools preview integration
 *
 * POST /api/agents/ui-ux-ultra - Process design request
 * GET /api/agents/ui-ux-ultra - Get agent capabilities
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUsageTracker } from '@/lib/services/api-usage'
import {
  processUIUXRequestSafe,
  YI_BRAND_COLORS,
  DEFAULT_STYLE_PREFERENCES,
} from '@/lib/agents/ui-ux-ultra-agent'
import type { UIUXAgentRequest } from '@/types/ui-ux-agent.types'

/**
 * POST - Process a UI/UX design request
 */
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

    const body: UIUXAgentRequest = await request.json()

    // Validate required fields
    if (!body.mode) {
      return NextResponse.json(
        { error: 'Mode is required. Valid options: design, redesign, analyze, component-library' },
        { status: 400 }
      )
    }

    if (!body.description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      )
    }

    // Validate mode
    const validModes = ['design', 'redesign', 'analyze', 'component-library']
    if (!validModes.includes(body.mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Valid options: ${validModes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate style preferences if provided
    if (body.stylePreferences) {
      const { glassmorphism, shadowLevel, animations, borderStyle, colorScheme } = body.stylePreferences

      if (glassmorphism && !['none', 'subtle', 'medium', 'strong', 'premium'].includes(glassmorphism)) {
        return NextResponse.json(
          { error: 'Invalid glassmorphism level. Options: none, subtle, medium, strong, premium' },
          { status: 400 }
        )
      }

      if (shadowLevel && !['xs', 'sm', 'md', 'lg', 'xl', 'premium'].includes(shadowLevel)) {
        return NextResponse.json(
          { error: 'Invalid shadow level. Options: xs, sm, md, lg, xl, premium' },
          { status: 400 }
        )
      }

      if (animations && !['none', 'minimal', 'standard', 'enhanced', 'premium'].includes(animations)) {
        return NextResponse.json(
          { error: 'Invalid animation level. Options: none, minimal, standard, enhanced, premium' },
          { status: 400 }
        )
      }

      if (borderStyle && !['solid', 'none', 'gradient', 'glow'].includes(borderStyle)) {
        return NextResponse.json(
          { error: 'Invalid border style. Options: solid, none, gradient, glow' },
          { status: 400 }
        )
      }

      if (colorScheme && !['brand', 'neutral', 'vibrant', 'custom'].includes(colorScheme)) {
        return NextResponse.json(
          { error: 'Invalid color scheme. Options: brand, neutral, vibrant, custom' },
          { status: 400 }
        )
      }
    }

    console.log('[UI/UX Ultra API] Processing request:', {
      mode: body.mode,
      description: body.description.substring(0, 100) + (body.description.length > 100 ? '...' : ''),
      hasExistingComponent: !!body.existingComponent,
      stylePreferences: body.stylePreferences,
      enablePreview: body.enablePreview,
    })

    // Process the request
    const result = await processUIUXRequestSafe(body)

    // Track usage if we have an organization
    if (member?.organization_id && result.usage.inputTokens > 0) {
      const usageTracker = createUsageTracker({
        organizationId: member.organization_id,
        userId: user.id,
      })

      await usageTracker.track(
        'ui_ux_ultra_agent',
        'claude',
        result.usage.model,
        {
          inputTokens: result.usage.inputTokens,
          outputTokens: result.usage.outputTokens,
          cachedTokens: 0,
        }
      )
    }

    console.log('[UI/UX Ultra API] Request complete:', {
      success: result.success,
      componentsGenerated: result.components.length,
      durationMs: result.usage.durationMs,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[UI/UX Ultra API] Error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check for API key issues
    if (errorMessage.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { error: 'UI/UX agent service not configured. Please set ANTHROPIC_API_KEY.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { error: `Agent processing failed: ${errorMessage}` },
      { status: 500 }
    )
  }
}

/**
 * GET - Return agent capabilities and status
 */
export async function GET() {
  return NextResponse.json({
    name: 'UI/UX Ultra Agent',
    version: '1.0.0',
    description: 'AI-powered UI component design with Actor-Critic analysis, glassmorphism, and live preview',
    capabilities: {
      modes: [
        { name: 'design', description: 'Create new components from scratch' },
        { name: 'redesign', description: 'Improve existing components' },
        { name: 'analyze', description: 'Analyze UI/UX without generating code' },
        { name: 'component-library', description: 'Generate a set of related components' },
      ],
      stylePreferences: {
        glassmorphism: {
          options: ['none', 'subtle', 'medium', 'strong', 'premium'],
          default: DEFAULT_STYLE_PREFERENCES.glassmorphism,
          description: 'Glass blur effect intensity',
        },
        shadowLevel: {
          options: ['xs', 'sm', 'md', 'lg', 'xl', 'premium'],
          default: DEFAULT_STYLE_PREFERENCES.shadowLevel,
          description: 'Shadow elevation level',
        },
        animations: {
          options: ['none', 'minimal', 'standard', 'enhanced', 'premium'],
          default: DEFAULT_STYLE_PREFERENCES.animations,
          description: 'Animation complexity',
        },
        borderStyle: {
          options: ['solid', 'none', 'gradient', 'glow'],
          default: DEFAULT_STYLE_PREFERENCES.borderStyle,
          description: 'Border treatment style',
        },
        colorScheme: {
          options: ['brand', 'neutral', 'vibrant', 'custom'],
          default: DEFAULT_STYLE_PREFERENCES.colorScheme,
          description: 'Color palette preference',
        },
      },
      targetViewport: {
        options: ['mobile', 'tablet', 'desktop', 'all'],
        default: 'all',
        description: 'Target device viewport',
      },
      mcpIntegration: {
        shadcn: {
          enabled: true,
          description: 'Component discovery and examples',
        },
        chromeDevtools: {
          enabled: true,
          description: 'Live preview and responsive testing',
        },
        actorCriticThinking: {
          enabled: true,
          description: 'Dual-perspective design analysis',
        },
        context7: {
          enabled: true,
          description: 'Library documentation lookup',
        },
      },
    },
    brandColors: YI_BRAND_COLORS,
    designSystem: {
      glassmorphism: {
        'glass-subtle': '50% white, blur-12',
        'glass-medium': '70% white, blur-16',
        'glass-strong': '80% white, blur-20',
        'glass-premium': '85% white, blur-20',
      },
      shadows: {
        'elevation-1': 'shadow-xs',
        'elevation-2': 'shadow-sm',
        'elevation-3': 'shadow-md',
        'elevation-4': 'shadow-lg',
        'elevation-5': 'shadow-xl',
        'shadow-premium': 'Premium glow effect',
      },
      animations: {
        'animate-float': 'Floating effect',
        'animate-shimmer': 'Shimmer loading',
        'hover-lift': 'Lift on hover',
        'active-press': 'Press effect',
        'transition-spring': 'Spring easing',
      },
    },
    usage: {
      endpoint: 'POST /api/agents/ui-ux-ultra',
      contentType: 'application/json',
      authentication: 'Required (Supabase session)',
      example: {
        mode: 'design',
        description: 'Create a premium pricing card with glassmorphism and hover animations',
        stylePreferences: {
          glassmorphism: 'premium',
          shadowLevel: 'lg',
          animations: 'enhanced',
        },
        referenceComponents: ['card', 'badge'],
        targetViewport: 'all',
        enablePreview: false,
      },
    },
  })
}
