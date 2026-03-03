import Anthropic from '@anthropic-ai/sdk'
import { trackApiUsage } from '@/lib/services/api-usage'
import type { EventProfile } from './event-understanding'
import type { AIEventContext } from '@/lib/ai/event-context-analyzer'
import type { ContentElements } from './content-element-mapper'
import { safeJsonParse } from '@/lib/utils/json-repair'

// ============================================================
// STORYTELLING FUSION TYPES (v26.0)
// ============================================================

export interface StorytellingFusionInput {
  eventProfile?: EventProfile | null
  aiEventContext?: AIEventContext | null
  contentElements: ContentElements
  eventName: string
  eventDescription?: string
  formatId: string
  uniquenessSeed?: string // v30.0: Creative seed for anti-convergence
  temperature?: number | null // v31.0: Prompt style temperature override
  creativeDirection?: string  // v31.0: Prompt style creative direction
}

export interface StorytellingOutput {
  visualNarrative: string // 1-2 sentence story
  storyArc: {
    opening: string // Scene setting
    climax: string // Hero visual (primary focal point)
    resolution: string // Supporting context
  }
  cohesiveElements: {
    primaryElement: string // THE hero visual
    supportingElements: string[] // 2-3 elements that enhance hero
    atmosphericElements: string[] // Background/mood
  }
  elementCohesion: Array<{
    element: string
    storyRole: 'hero' | 'support' | 'atmosphere'
    reasoning: string
    visualConnection: string
  }>
  narrativeConfidence: number // 0-1 quality score
  geminiStoryBrief: string // XML-structured prompt section
}

// ============================================================
// STORYTELLING FUSION SERVICE (v26.0)
// ============================================================

/**
 * Unifies multiple event analyzers into ONE cohesive visual narrative
 *
 * Instead of deduplicating visual elements (which creates disconnected lists),
 * this service uses AI to synthesize a unified story with clear hero/support/atmosphere roles.
 *
 * @param input - Event context from multiple analyzers
 * @param options - User/organization for tracking
 * @returns Unified visual narrative with storytelling structure
 */
export async function fuseStorytellingContext(
  input: StorytellingFusionInput,
  options?: { userId?: string; organizationId?: string }
): Promise<StorytellingOutput> {
  const startTime = Date.now()

  // Build fusion prompt for Claude Haiku
  const prompt = buildStorytellingFusionPrompt(input)

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  // v31.0: Use style temperature or default to 1.0
  const temperature = input.temperature ?? 1.0

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1000,
    temperature, // v31.0: Configurable via prompt style (default: 1.0)
    messages: [{
      role: 'user',
      content: prompt
    }]
  })

  const textContent = response.content[0]
  if (textContent.type !== 'text') {
    throw new Error('Unexpected response type from Claude API')
  }

  const result = safeJsonParse<StorytellingOutput>(textContent.text)

  // Track API usage (only if userId and organizationId are available)
  if (options?.userId && options?.organizationId) {
    // Calculate estimated cost (Haiku: ~$0.80 per million input, ~$4.00 per million output)
    const inputCost = (response.usage.input_tokens / 1000000) * 0.80
    const outputCost = (response.usage.output_tokens / 1000000) * 4.00
    const estimatedCostUsd = inputCost + outputCost

    await trackApiUsage({
      requestType: 'design_intelligence',
      provider: 'claude',
      model: 'claude-haiku-4-5',
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      estimatedCostUsd,
      success: true,
      userId: options.userId,
      organizationId: options.organizationId,
    })
  }

  return {
    ...result,
    geminiStoryBrief: buildGeminiStoryBrief(result)
  }
}

// ============================================================
// PROMPT BUILDERS
// ============================================================

function buildStorytellingFusionPrompt(input: StorytellingFusionInput): string {
  // When a specific event description is present, it is the PRIMARY truth source.
  // The content_mapper keyword elements are loose inspiration only — they must NOT
  // override the actual meaning of the event.
  const hasSpecificDescription = (input.eventDescription || '').trim().length > 10

  return `You are a visual storytelling expert creating a poster for a SPECIFIC event.

${input.uniquenessSeed ? `<creative_seed>
CREATIVE SEED: ${input.uniquenessSeed}
Use this seed to inspire a UNIQUE creative direction. Avoid repeating common visual patterns
(silhouettes, lotus flowers, generic podiums, ripple patterns). Each generation should look
distinctly different even for similar events.
</creative_seed>
` : ''}${input.creativeDirection ? `<creative_style>
CREATIVE STYLE DIRECTION: ${input.creativeDirection}
Apply this creative approach to your visual storytelling. Let it shape the mood, composition, and visual choices.
</creative_style>
` : ''}
<event_identity>
Event Name: ${input.eventName}
${input.eventDescription ? `Event Topic/Description: ${input.eventDescription}` : ''}
Format: ${input.formatId}
</event_identity>

${hasSpecificDescription ? `
⚠️ PRIMARY DIRECTIVE: The "Event Topic/Description" above defines WHAT THIS EVENT IS ACTUALLY ABOUT.
Your visual story MUST reflect that specific topic — not just the event name.
Example: if the name is "Forum" but description says "Menstrual Health & Hygiene", the visuals
must be about health and hygiene, NOT about generic leadership/forum imagery.
` : ''}

<supporting_context>
${input.eventProfile ? `
<event_understanding>
  Concept: ${input.eventProfile.selectedConcept}
  Primary Visuals: ${input.eventProfile.visualAssociations.primary.join(', ')}
  Secondary: ${input.eventProfile.visualAssociations.secondary.join(', ')}
</event_understanding>
` : ''}

${input.aiEventContext ? `
<ai_context>
  Visual Direction: ${input.aiEventContext.visualDirection}
  Key Visuals: ${input.aiEventContext.keyVisuals.join(' | ')}
</ai_context>
` : ''}

${/* v29.0: Removed keyword_suggestions — let AI reason purely from event context */''}
</supporting_context>

<task>
Create ONE unified visual story that represents the ACTUAL MEANING of this event.

RULES:
1. START from the event topic/description — understand what this event is really about
2. Select ONE PRIMARY VISUAL (hero element) that embodies the core message
3. Choose 2-3 SUPPORTING visuals that reinforce the hero
4. Define ATMOSPHERIC elements (background, mood, colour, depth)
5. DISCARD any keyword suggestions that do not match the event's actual topic
6. Explain how each visual connects to the EVENT'S STORY

OUTPUT FORMAT (JSON):
{
  "visualNarrative": "One compelling sentence describing the visual story of THIS specific event",
  "storyArc": {
    "opening": "Visual that sets the event's context",
    "climax": "The hero visual that captures the core message",
    "resolution": "Supporting visuals that complete the story"
  },
  "cohesiveElements": {
    "primaryElement": "Detailed description of THE hero visual",
    "supportingElements": ["support visual 1", "support visual 2"],
    "atmosphericElements": ["background treatment", "mood element"]
  },
  "elementCohesion": [
    {
      "element": "visual description",
      "storyRole": "hero|support|atmosphere",
      "reasoning": "why this element serves the event's message",
      "visualConnection": "how it connects to the event topic"
    }
  ],
  "narrativeConfidence": 0.85
}
</task>

CRITICAL: The visuals must tell the story of THIS SPECIFIC EVENT. A health awareness event
must look like a health awareness event, not a generic leadership/corporate event.`
}

function buildGeminiStoryBrief(result: StorytellingOutput): string {
  return `
<visual_storytelling confidence="${(result.narrativeConfidence * 100).toFixed(0)}%">
CORE NARRATIVE:
${result.visualNarrative}

STORY ARC:
1. OPENING (Scene Setting): ${result.storyArc.opening}
2. CLIMAX (Hero Visual - PRIMARY FOCUS): ${result.storyArc.climax}
3. RESOLUTION (Supporting Context): ${result.storyArc.resolution}

ELEMENT COHESION:
${(result.elementCohesion ?? []).map(ec => `
- ${ec.element ?? ''}
  Story Role: ${(ec.storyRole ?? '').toUpperCase()}
  Why: ${ec.reasoning ?? ''}
  Connection: ${ec.visualConnection ?? ''}
`).join('')}

CRITICAL REQUIREMENTS:
- Create ONE unified visual story, NOT disconnected elements
- The HERO VISUAL (climax) must be THE dominant focal point
- Supporting elements must enhance the hero, not compete
- All visuals must serve the narrative cohesively
</visual_storytelling>
`.trim()
}
