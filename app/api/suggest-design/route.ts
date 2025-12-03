import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateDesignSuggestions,
  getDefaultSuggestions,
  type DesignSuggestionsInput,
} from '@/lib/prompts/services/design-suggestions'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()

    const input: DesignSuggestionsInput = {
      eventType: body.eventType,
      eventName: body.eventName,
      currentTheme: body.currentTheme,
      currentStyle: body.currentStyle,
      hasSpeakerPhoto: body.hasSpeakerPhoto,
      guestName: body.guestName,
      guestDesignation: body.guestDesignation,
      additionalContext: body.additionalContext,
    }

    console.log('[API suggest-design] Request:', {
      eventType: input.eventType,
      eventName: input.eventName,
      hasSpeakerPhoto: input.hasSpeakerPhoto,
    })

    // Check if ANTHROPIC_API_KEY is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn('[API suggest-design] ANTHROPIC_API_KEY not configured, returning defaults')
      return NextResponse.json(getDefaultSuggestions(input.eventType))
    }

    // Generate AI suggestions
    const suggestions = await generateDesignSuggestions(input)

    return NextResponse.json(suggestions)
  } catch (error) {
    console.error('[API suggest-design] Error:', error)

    // Return default suggestions on error
    const body = await request.json().catch(() => ({}))
    return NextResponse.json(getDefaultSuggestions(body.eventType), {
      status: 200, // Return 200 with defaults instead of error
    })
  }
}
