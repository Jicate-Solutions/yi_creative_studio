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

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1000,
    temperature: 0.7,
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
  return `You are a visual storytelling expert. Unify these event context sources into ONE cohesive visual narrative.

<event_sources>
${input.eventProfile ? `
<event_understanding>
  Selected Concept: ${input.eventProfile.selectedConcept}
  Primary Visuals: ${input.eventProfile.visualAssociations.primary.join(', ')}
  Secondary: ${input.eventProfile.visualAssociations.secondary.join(', ')}
</event_understanding>
` : ''}

${input.aiEventContext ? `
<ai_context>
  Matched Preset: ${input.aiEventContext.matchedPreset}
  Visual Direction: ${input.aiEventContext.visualDirection}
  Custom Enhancements: ${input.aiEventContext.customEnhancements.join(' | ')}
  Key Visuals: ${input.aiEventContext.keyVisuals.join(' | ')}
</ai_context>
` : ''}

<content_mapper>
  Elements: ${input.contentElements.elements.join(' | ')}
  Backgrounds: ${input.contentElements.backgrounds.join(' | ')}
</content_mapper>
</event_sources>

<event_info>
Name: ${input.eventName}
${input.eventDescription ? `Description: ${input.eventDescription}` : ''}
Format: ${input.formatId}
</event_info>

<task>
Create ONE unified visual story that connects ALL elements coherently.

RULES:
1. Identify the CORE NARRATIVE THREAD (what story do these visuals tell together?)
2. Select ONE PRIMARY VISUAL (hero element that dominates composition)
3. Choose 2-3 SUPPORTING visuals that enhance the hero
4. Define ATMOSPHERIC elements (background, mood, depth)
5. Explain CONNECTIONS (how each visual relates to the story, NOT just a list!)

OUTPUT FORMAT (JSON):
{
  "visualNarrative": "One compelling sentence describing the unified visual story",
  "storyArc": {
    "opening": "Visual that sets the stage/context",
    "climax": "The hero visual (primary focal point)",
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
      "reasoning": "why this element is essential",
      "visualConnection": "how it connects to other elements"
    }
  ],
  "narrativeConfidence": 0.85
}
</task>

CRITICAL: Create a STORY, not a list. All visuals must serve the narrative.`
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
${result.elementCohesion.map(ec => `
- ${ec.element}
  Story Role: ${ec.storyRole.toUpperCase()}
  Why: ${ec.reasoning}
  Connection: ${ec.visualConnection}
`).join('')}

CRITICAL REQUIREMENTS:
- Create ONE unified visual story, NOT disconnected elements
- The HERO VISUAL (climax) must be THE dominant focal point
- Supporting elements must enhance the hero, not compete
- All visuals must serve the narrative cohesively
</visual_storytelling>
`.trim()
}
