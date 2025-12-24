
import type {
  BriefAnalysisInput,
  DesignContext,
  DesignIntelligenceResult,
  DesignBrief,
  LLMResponse,
  TokenUsage,
} from './yi-prompt-builder/types'

export type { DesignBrief, DesignContextForPrompt } from './yi-prompt-builder/types'
import { safeJsonParse } from '@/lib/utils/json-repair'
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai'
import Anthropic from '@anthropic-ai/sdk'

import {
  generateFallbackContext,
  validateDesignContext,
} from './yi-prompt-builder/context-helpers'

// ============================================================
// PROMPT BUILDERS (Locally Defined)
// ============================================================

function buildDesignContextPrompt(template: string, input: DesignBrief): string {
  const brandColors = input.brandContext ? `
BRAND IDENTITY:
- Primary Color: ${input.brandContext.primaryColor || 'Not specified'}
- Secondary Color: ${input.brandContext.secondaryColor || 'Not specified'}
- Accent Color: ${input.brandContext.accentColor || 'Not specified'}
- Font Preference: ${input.brandContext.fontPreference || 'Not specified'}
` : ''

  const finalTitle = input.eventName && input.eventName.trim().length > 0
    ? input.eventName
    : "(Not Specified - Look for Greeting/Headline in Description)";

  const brief = `
${input.formatId ? `FORMAT TYPE: ${input.formatId} (${input.formatName || 'Creative Design'})
FORMAT CATEGORY: ${getCategoryName(input.formatId)}
` : ''}
${input.eventName ? `EVENT/CONTENT TITLE: ${input.eventName}` : `CONTENT TITLE: ${input.formatName || 'Design'}`}
FULL DESCRIPTION: ${input.details || ''}
${input.venue ? `VENUE: ${input.venue}` : ''}
ADDITIONAL CONTEXT: ${input.additionalContext || ''}
THEME: ${input.theme || ''}
STYLE: ${input.style || ''}
HOST ORGANIZATION: ${input.organizationName || ''} (For branding only - NOT the event theme)
${brandColors}
${getFormatSpecificGuidance(input.formatId, input.formatName)}
`
  return template.replace('{brief}', brief)
}

function buildCreativeBriefPrompt(input: BriefAnalysisInput): string {
  return ''
}


// ============================================================
// CONSTANTS & CONFIG
// ============================================================

// Model configuration
const GEMINI_MODEL = 'gemini-2.0-flash-exp' // Best for creative reasoning
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001' // Ultra-smart fallback

// ============================================================
// PROMPT TEMPLATE
// ============================================================

/**
 * Design Intelligence Master Prompt
 *
 * This prompt transforms the LLM into an ultra-pro designer who:
 * - Understands the CORE PURPOSE of every design
 * - Knows what visual elements BELONG in each context
 * - Thinks strategically about viewer psychology
 * - Outputs structured, actionable design guidance
 */
const DESIGN_INTELLIGENCE_PROMPT = `You are a VISIONARY ART DIRECTOR with a hatred for boring, generic designs.AVOID "SAFE" CHOICES.You characterize yourself by bold, unexpected creative decisions that perfectly capture the story.
You think like a HUMAN ARTIST who reads event context, understands the VISUAL NARRATIVE, and makes decisions that WOW the viewer.

=== YOUR MISSION ===

    Read the event details and create a design that TELLS THE STORY visually.Don't just identify the domain - understand the FULL CONTEXT:
      - What narrative is this event telling ?
        - What should people FEEL when they see this ?
          - How do typography, colors, and layout support this story ?

            CRITICAL : The SAME event type(e.g., "climate change") can have DIFFERENT stories:
  - "Climate Change Leadership Summit for Professionals" → Prestigious, authoritative, golden tones, refined decorations
    - "Climate Awareness Workshop for Kids" → Playful, educational, bright colors, cartoon elements

You must analyze the FULL CONTEXT, not just the event type.

=== 7 - STEP STORY - DRIVEN DESIGN FRAMEWORK ===

## STEP 1: STORY ANALYSIS(Think deeply about the narrative)

Analyze the narrative this event is telling:

** Story Identification **:
  - What is the core narrative ? (e.g., "Young leaders conquering climate crisis")
    - What's the emotional arc? (e.g., Challenge → Empowerment → Victory)
      - Who are the characters ? (e.g., Ambitious professionals becoming heroes)

** Message Extraction **:
  - What's the primary message? (1 sentence)
    - What secondary themes exist ? (list 2 - 3)
  - What transformation occurs ? (before → after)

** Context Layers **:
  - Event formality: Casual / Professional / Premium / Exclusive
    - Energy level: Calm / Moderate / High / Explosive
      - Time horizon: Past(heritage) / Present(current) / Future(visionary)
        - Scope: Personal / Community / Regional / Global / Universal

        **CRITICAL ANTI-HALLUCINATION RULES**:
        1. **ORGANIZATION ≠ EVENT THEME**:
           - The "Organization" field (e.g., "Yi Salem", "Tech Corp") tells you WHO is hosting.
           - It does **NOT** tell you WHAT the event is.
           - **NEVER** infer the event theme from the Organization Name.
           - Example: If "Yi Salem" (known for marathons) hosts a "Christmas Party", the theme is **CHRISTMAS**, NOT "Marathon".

        2. **STRICT TEXT ADHERENCE**:
           - Only use the explicit text provided in the "TITLE" and "DESCRIPTION".
           - If the Title is "Merry Christmas", the design **MUST** be about Christmas/Holidays.
           - Do NOT invent a "Charity Run" or "Water Project" just because the organization usually does that.

        3. **DOMAIN INFERENCE**:
           - Do NOT infer "Sustainability", "Climate", "Tech", or "Health" usage unless EXPLICITLY mentioned in the input text.
           - If no specific event details are found, default to the **Visual Theme** of the Title itself (e.g., "Christmas" -> Ornaments/Snow/Gold).

## STEP 2: VIBE & MOOD DISCOVERY

Based on the story, determine the FEELING this design should evoke:

** Vibe Keywords ** (3 - 5 descriptive words):
  - Consider: empowering, prestigious, urgent, playful, authoritative, innovative, caring, bold, elegant, rebellious, traditional, futuristic
    - Example: "Empowering, authoritative, urgent, hopeful, modern"

      ** Mood Atmosphere **:
  - Visual atmosphere: (e.g., "Golden spotlight of achievement with environmental undertones")
    - Emotional temperature: Warm / Neutral / Cool
      - Energy dynamics: Static / Flowing / Explosive / Pulsing

        ** Audience Resonance **:
  - What will make THIS audience connect emotionally ?
    - What visual language speaks to them ?

## STEP 3: TYPOGRAPHY STORYTELLING

Design typography that embodies the story:

** Headline Personality **:
  - What character should the main headline have ?
    - Font personality: Bold / Elegant / Playful / Technical / Organic / Geometric
      - Sizing strategy: Dominant / Balanced / Subtle
        - CRITICAL: AVOID DEFAULTISM.Do NOT default to "Bold Sans-Serif" for every event.
- Use SERIF for elegance / heritage, SLAB for industrial / bold, MONO for tech / data, SCRIPT for celebration.
- Example: "Ultra-bold sans-serif (Montserrat Black) - commanding attention like a leader's call to action"

        ** Multi - Color Typography Strategy **:
  - Analyze the event name / headline
    - Which words carry POWER ? (use primary / accent colors)
  - Which words show ACTION ? (use energetic colors)
  - Which words create EMOTION ? (use mood colors)
  - Example: "CLIMATE"(forest green #0B6D41 - environmental) "LEADERSHIP"(gold #FFD700 - achievement) "SUMMIT"(deep blue #003366 - authority)

    ** Hierarchy Flow **:
  - How should the eye travel through text to tell the story ?
    - Main headline → Supporting text → Details(flow supports narrative)

## STEP 4: COLOR STORYTELLING

Colors that convey the story's emotion:

    ** Dominant Hues ** (primary story colors):
  - What color represents the MAIN theme ?
    - What color adds EMOTIONAL depth ?
      - What color creates ENERGY / ACTION ?

** Color Psychology Application **:
  - Leadership / Achievement → Gold(#FFD700), amber, deep blue
    - Environment / Growth → Forest green(#0B6D41), earth tones, sky blue
      - Innovation / Tech → Electric blue(#0066FF), cyan, purple
        - Health / Caring → Soft green(#34C759), healing blue, warm white
          - Energy / Sports → Red(#FF3B30), orange, electric yellow
            - Culture / Heritage → Rich burgundy, gold, traditional colors
              - Youth / Modern → Vibrant, saturated, bold colors

   - How many colors in headline ? (2 - 4 based on complexity)
   - Color rhythm: Alternating / Gradient / Emphasis - based

    ** BRAND IDENTITY INTEGRATION (CRITICAL) **:
   - If BRAND COLORS are provided in the brief, you MUST use them as the foundation.
   - Do not invent random colors if brand colors are specified.
   - Mix Brand Colors with semantic colors (e.g., Brand Blue + Gold for "Achievement").

## STEP 5: BACKGROUND & ATMOSPHERE

Create a visual world that supports the story:

** Background Treatment ** (choose based on mood):
- ** Linear Gradient **: Simple, clean(formal events, minimalist mood)
    - ** Radial Gradient **: Spotlight focus(singular theme, centered narrative)
      - ** Sunburst Radial **: Achievement, celebration(leadership, success stories)
        - ** Mesh Gradient **: Complex, artistic(creative, multi - layered narratives)
          - ** Atmospheric **: Immersive depth(festive, experiential events)

            ** Gradient Specification **:
  - Describe gradient in detail with color stops, direction, atmosphere
    - Example: "Golden radial sunburst emanating from upper center (0%: bright gold #FFD700 → 50%: warm amber #FFA500 → 100%: deep navy #003366) with 12 subtle light rays at 3% opacity creating achievement spotlight effect"

      ** Atmospheric Elements **:
  - Depth layers: How many visual layers ? (1 - 3)
    - Light rays: Subtle / Prominent / None
      - Particles: Subtle atmospheric particles / None

## STEP 6: DECORATIVE ELEMENTS(Story - Specific)

Generate decorations that enhance the narrative:

** Thematic Elements ** (based on story analysis):
  - What visual symbols reinforce the story ?
    - What imagery creates emotional connection ?
      - Sophistication level: Refined / Balanced / Playful

        ** Element Examples by Context (RICH DESCRIPTION REQUIRED) **:
  - Climate + Leadership → "Translucent, crystalline geometric leaves with fine gold veins" (NOT just "leaves")
    - Tech + Innovation → "Holographic neural nodes connected by glowing cyan data streams" (NOT just "lines")
      - Health + Community → "Soft, warm-lit silhouettes of caring hands forming a protective circle"
        - Sports + Energy → "Explosive motion-blur streaks in fiery orange cutting through deep navy"
          - Culture + Heritage → "Intricate gold foil paisley patterns overlaid on rich burgundy velvet texture"
            - Youth + Celebration → "Suspended 3D confetti particles with depth-of-field blur and sparkle effects"

              ** Placement Strategy **:
  - Where do decorations support(not distract from) story ?
    - Opacity levels that create depth without noise(8 - 15 % typically)
      - Placement: Corner accents / Background patterns / Focal elements

## STEP 7: LAYOUT NARRATIVE FLOW

Design content flow that tells the story:

** Visual Hierarchy ** (storytelling order):
  - What grabs attention first ? (The impact / hook)
  - What builds context ? (The details)
  - What drives action ? (The CTA)

** Content Area Design **:
  - Event details container: Style that matches vibe
    - Speaker prominence: How much spotlight ?
      - Logo strip treatment: Sophisticated / Modern / Classic / Minimal

        ** Spatial Story **:
  - Negative space: How much breathing room supports the mood ?
    - Spatial density: Minimal / Balanced / Rich(based on sophistication)

      === DOMAIN - SPECIFIC DESIGN GUIDANCE(Reference) ===

** AI / Tech Events **: Clean sans - serif, electric blue accents, minimalist gradients, refined glassmorphism
    ** Sports Events **: Bold condensed fonts, high - energy colors(red, orange), dynamic diagonal stripes
      ** Medical / Health **: Humanist sans - serif, trust blue(#007AFF), healing green, pulse line motifs
        ** Cultural / Traditional **: Elegant serifs, rich golds, deep maroons, traditional motifs, ornate borders
          ** Corporate / Business **: Professional sans - serif, corporate blue, charcoal, subtle geometric grids
            ** Education / Academic **: Scholarly serifs, academic navy, wisdom gold, laurel wreaths
              ** Entertainment / Party **: Bold display fonts, vibrant multi - color, confetti, sparkles, energetic lines
                ** Environment / Sustainability **: Clean slab serifs, deep forest green(#0B3D2E), stone textures, refined leaf motifs
                  ** Fun Activity / Kids **: ROUNDED sans - serif(Nunito, Quicksand) or playful display, bright primary colors, soft shapes
                    ** Social Awareness / Cause **: HUMANIST sans - serif(Open Sans) for approachability, clear hierarchy, hopeful visuals
                      ** Cultural / Arts **: DECORATIVE SERIF or CUSTOM SCRIPT, rich textures, traditional patterns, artistic composition
                        ** Environment / Sustainability **: Clean slab serifs, deep forest green(#0B3D2E), stone textures, refined leaf motifs

ANALYZE THE FOLLOWING CREATIVE BRIEF:
  { brief }

=== ANALYSIS PROCESS ===

    Now follow the 7 - step framework above to analyze this brief.Think deeply about:
  1. The STORY being told
  2. The VIBE and MOOD to evoke
  3. TYPOGRAPHY that tells the story
  4. COLORS that convey emotion
  5. BACKGROUND atmosphere
  6. DECORATIVE elements that enhance narrative
  7. LAYOUT that supports the story flow

    === DESIGN SOPHISTICATION RULES(MANDATORY) ===

      1. ** NEGATIVE SPACE IS A FEATURE **: 40 % of the design should feel "breathable" and uncluttered
  2. ** THE 3 - SECOND TEST **: Viewer must identify WHAT(Header) and WHEN(Details) in 3 seconds
  3. ** MICRO - DETAIL > MACRO - CLUTTER **: Use one high - quality visual element instead of many busy ones
  4. ** SACROSANCT ZONES **: Keep top 15 % (Logo Zone) and bottom 10 % (Contact Zone) clean
  5. ** TYPOGRAPHY HIERARCHY **: One hero size(Massive), one primary size(Medium), everything else (Small / Clean)

    === CRITICAL RULES ===
      - Be HYPER - SPECIFIC: NEVER use single nouns like "leaves". Use "translucent geometric leaves".
        - Not "technology elements" but "holographic AI brain visualization with cyan neural pathways"
        - Be CONTEXT - AWARE: Same event type can have different stories based on audience / purpose
          - Be VIEWER - FOCUSED: What will viewer IMMEDIATELY understand about this event ?
            - FULL - BLEED design that fills the canvas edge - to - edge
              - NEVER describe poster "on a wall" - describe what's IN the design

                === MULTI - COLOR TYPOGRAPHY(CRITICAL) ===
                  Each text role MUST have a distinct color for visual hierarchy:

** HERO TEXT **: MOST PROMINENT color, 7: 1 contrast minimum(e.g., Pure white, bold gold, electric cyan)
    ** HEADLINE TEXT **: COMPLEMENTARY color, 7: 1 contrast(e.g., Light blue, off - white, bright yellow)
      ** BODY TEXT **: READABLE color, 4.5: 1 contrast(e.g., Light gray #E0E0E0, medium gray #666)
        ** CTA TEXT **: ATTENTION - GRABBING color, 7: 1 contrast(e.g., Bright gold, electric green, vibrant orange)
          ** CAPTION TEXT **: SUBTLE color, 4.5: 1 contrast(e.g., Muted gray #999, soft brown, dim blue)

            === LAYOUT RULES ===
              - If SPEAKER PHOTO position is LEFT: Content flows RIGHT
                - If SPEAKER PHOTO position is RIGHT: Content flows LEFT
                  - If SPEAKER PHOTO position is CENTER: Content frames around center
                    - NEVER generate illustrated faces if speaker photo will be added
                      - Keep HEADER area clean for logos
                        - Use VISUAL language only in layoutGuidance(no "px", "zone", "overlay")

Return ONLY valid JSON with BOTH legacy fields(for backward compatibility) AND new story - driven fields:
  {
    "corePurpose": "What emotional job this design MUST accomplish",
      "desiredAction": "Specific action viewers should take",
        "emotionalJob": "How viewers should FEEL",
          "visualElements": ["SPECIFIC element 1", "SPECIFIC element 2", "SPECIFIC element 3", "SPECIFIC element 4", "SPECIFIC element 5"],
            "backgroundSetting": "Detailed background description - immersive and contextual",
              "iconicImagery": ["specific icon 1", "specific icon 2", "specific icon 3"],
                "colorMood": "Color psychology with hex codes",
                  "designStrategy": "Strategic visual approach",
                    "successMetric": "What viewer thinks in 3 seconds",
                      "layoutGuidance": "Visual composition using design language only",
                        "typographyGuidance": {
      "headlineStyle": "specific font style and weight description",
        "bodyStyle": "readable font style description",
          "typographyStyle": "Pick ONE: serif | sans | slab | mono | script | display",
            "alignment": "Pick ONE: center | left | right | asymmetric",
              "hierarchy": "size and weight hierarchy mapping",
                "colorMapping": {
        "hero": { "color": "hex code or name", "contrastRatio": 7.0, "description": "rationale" },
        "headline": { "color": "hex code or name", "contrastRatio": 7.0, "description": "rationale" },
        "body": { "color": "hex or name", "contrastRatio": 4.5, "description": "rationale" },
        "cta": { "color": "hex or name", "contrastRatio": 7.0, "description": "rationale" },
        "caption": { "color": "hex or name", "contrastRatio": 4.5, "description": "rationale" }
      }
    },
    "decorativeElements": {
      "corners": "corner treatment description",
        "patterns": "pattern description with opacity",
          "accents": "accent elements description"
    },
    "creativeTwist": "ONE unexpected visual element that makes this design UNIQUE",

      "storyAnalysis": {
      "narrative": "Core story in one sentence",
        "emotionalArc": "Beginning → Middle → End emotional journey",
          "themes": ["primary theme", "secondary theme"],
            "transformation": "Before state → After state",
              "context": {
        "formality": "casual | professional | premium | exclusive",
          "energyLevel": "calm | moderate | high | explosive",
            "timeHorizon": "past | present | future",
              "scope": "personal | community | regional | global | universal"
      }
    },

    "vibeAndMood": {
      "vibeKeywords": ["keyword1", "keyword2", "keyword3"],
        "moodAtmosphere": "Visual atmosphere description",
          "emotionalTemperature": "warm | neutral | cool",
            "energyDynamics": "static | flowing | explosive | pulsing",
              "audienceResonance": "What makes audience connect emotionally"
    },

    "typographyStrategy": {
      "headlinePersonality": "Font character description",
        "fontRecommendations": {
        "headline": "Font name with reasoning",
          "subheading": "Font name with reasoning",
            "body": "Font name with reasoning"
      },
      "multiColorStrategy": {
        "words": [
          { "word": "WORD", "color": "#HEX", "reasoning": "Why this color for this word" }
        ],
          "colorRhythm": "alternating | gradient | emphasis-based"
      },
      "hierarchyFlow": "How eye travels through text",
        "sizingStrategy": "dominant | balanced | subtle"
    },

    "colorStorytelling": {
      "dominantHues": [
        { "color": "#HEX", "role": "theme role", "usage": "where used" }
      ]
    },

    "decorativeElementsContext": {
      "sophisticationLevel": "minimalist | balanced | rich | playful | refined",
      "placementStrategy": "Guide for where elements should go (e.g., 'Corners only', 'Background texture', 'Flowing across')",
      "thematicElements": [
        { 
          "element": "HIGHLY DETAILED visual element description (e.g., 'Translucent neon neural nodes with glowing edges')", 
          "placement": "Specific location (e.g., 'Top-right corner bleeding off edge')",
          "opacity": 0.1,
          "reasoning": "Why this element tells the story"
        }
      ]
    },

    "layoutNarrative": {
      "visualHierarchy": ["first", "second", "third"],
        "spatialStory": "How space supports mood",
          "flowDirection": "left-to-right | center-out | asymmetric"
    }
  }
  `

// ============================================================
// VALIDATION
// ============================================================

/**
 * Validate that design context matches the current event
 * Prevents context bleeding from cached/wrong contexts
 */
function validateContextMatchesEvent(
  context: DesignContext,
  eventName: string,
  eventType?: string
): { valid: boolean; reason?: string } {
  // Safety: Allow if no event name
  if (!eventName || eventName.trim().length === 0) {
    return { valid: true }
  }

  const normalizedEventName = eventName.toLowerCase().trim()
  const contextString = JSON.stringify(context).toLowerCase()

  // Extract meaningful keywords (>3 chars to avoid "for", "the")
  const eventKeywords = normalizedEventName
    .split(/\s+/)
    .filter(word => word.length > 3)

  if (eventKeywords.length === 0) {
    return { valid: true }
  }

  // RULE 1: At least ONE keyword must appear in context
  const hasEventReference = eventKeywords.some(keyword =>
    contextString.includes(keyword)
  )

  if (!hasEventReference) {
    return {
      valid: false,
      reason: `Context missing event keywords. Expected: ${eventKeywords.join(', ')}`
    }
  }

  // RULE 2: Check for contradicting themes
  const contradictions = [
    { event: 'christmas', contradicts: ['marathon', 'run', 'water', 'sports', 'race'] },
    { event: 'marathon', contradicts: ['christmas', 'festive', 'holiday'] },
    { event: 'tech', contradicts: ['sports', 'marathon', 'athletic'] },
    { event: 'wedding', contradicts: ['business', 'corporate', 'conference'] },
  ]

  for (const pattern of contradictions) {
    if (normalizedEventName.includes(pattern.event)) {
      const foundContradiction = pattern.contradicts.find(word =>
        contextString.includes(word)
      )
      if (foundContradiction) {
        return {
          valid: false,
          reason: `Context contains contradicting keyword "${foundContradiction}" for "${pattern.event}" event`
        }
      }
    }
  }

  return { valid: true }
}

// ============================================================
// MAIN GENERATOR FUNCTION
// ============================================================

export async function generateDesignContext(
  input: DesignBrief
): Promise<DesignIntelligenceResult> {
  const startTime = Date.now()
  let llmResponse: LLMResponse

  try {
    // Stage 1: Construct the Prompt
    const prompt = buildDesignContextPrompt(DESIGN_INTELLIGENCE_PROMPT, input)

    // Stage 2: Call LLM (Gemini preferred, Claude fallback)
    // We prioritize speed/cost for this step since it's "thinking" not "rendering"
    try {
      llmResponse = await callGemini(prompt)
    } catch (e) {
      console.warn('[Design Intelligence] Gemini failed, falling back to Claude', e)
      llmResponse = await callClaude(prompt)
    }

    // Stage 3: Parse & Validate
    const designContext = parseDesignContext(llmResponse.text)

    // NEW: Validate context matches event
    const validation = validateContextMatchesEvent(
      designContext,
      input.eventName,
      input.eventType
    )

    if (!validation.valid) {
      console.error('[Design Intelligence] ⚠️  CONTEXT VALIDATION FAILED!')
      console.error('[Design Intelligence] Reason:', validation.reason)
      console.error('[Design Intelligence] Event Name:', input.eventName)
      console.error('[Design Intelligence] Triggering fallback...')

      // Trigger fallback by throwing error
      throw new Error(`Context validation failed: ${validation.reason}`)
    }

    // Stage 4: Return Enriched Context
    return {
      context: designContext,
      usage: {
        model: llmResponse.model,
        provider: llmResponse.model.includes('claude') ? 'claude' : 'gemini',
        tokenUsage: llmResponse.tokenUsage || { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        durationMs: Date.now() - startTime,
      },
    }
  } catch (error) {
    console.error('[Design Intelligence] Failed to generate context:', error)
    // Return safe fallback to prevent app crash
    // Return safe fallback to prevent app crash
    const fallbackContext = generateFallbackContext({
      title: input.eventName,
      description: input.details,
      venue: input.venue,
      additionalContext: input.additionalContext,
    })

    return {
      context: fallbackContext,
      usage: {
        model: 'fallback',
        provider: 'gemini',
        tokenUsage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        durationMs: Date.now() - startTime,
      },
    }
  }
}

// ============================================================
// HELPERS
// ============================================================

async function callGemini(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Missing Gemini API Key')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 4096, // v3.6: Increased for deeper reasoning
      responseMimeType: 'application/json', // v3.6: Native JSON Mode!
    },
    // v3.6: Explicit Safety Settings (BLOCK_ONLY_HIGH allows creative freedom)
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    ]
  })

  const result = await model.generateContent(prompt)
  const response = result.response

  const text = response.text()

  // Calculate approximate token usage (Gemini doesn't always return usage in this call style, but we can try)
  const usageMetadata = response.usageMetadata
  const tokenUsage: TokenUsage = {
    inputTokens: usageMetadata?.promptTokenCount || 0,
    outputTokens: usageMetadata?.candidatesTokenCount || 0,
    totalTokens: usageMetadata?.totalTokenCount || 0,
  }

  return {
    text,
    tokenUsage,
    model: GEMINI_MODEL,
    durationMs: 0, // Calculated by caller
  }
}

async function callClaude(prompt: string): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('Missing Anthropic API Key')

  const anthropic = new Anthropic({ apiKey })

  const startTime = Date.now()
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: "You are a JSON-only API. return VALID, PARSEABLE JSON matching the schema.",
    // v3.7: Enable Prompt Caching for the 4k system prompt (save cost/latency)
    ...(process.env.ANTHROPIC_PROMPT_CACHING === 'true' ? {
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt,
              cache_control: { type: 'ephemeral' }
            }
          ]
        },
        {
          role: 'assistant',
          content: '{', // v3.7: Force JSON start to prevent preamble/hallucination
        },
      ]
    } : {
      messages: [
        {
          role: 'user',
          content: prompt,
        },
        {
          role: 'assistant',
          content: '{', // v3.7: Force JSON start to prevent preamble/hallucination
        },
      ],
    }),
  })

  const durationMs = Date.now() - startTime

  console.log(`[Design Intelligence] Response received in ${durationMs} ms`)

  // Extract text from response
  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  const text = textBlock.text

  // v3.7: If we forced the start with '{', we need to prepend it back if it's missing
  // Claude usually continues from the pre-fill, so the response is just the REST of the JSON.
  // We need to check if the response starts with the key, e.g. `"corePurpose":...`
  // or if it includes the brace. 
  // With prompt caching, the pre-fill behavior is tricky, so we handle both cases.

  const finalJson = text.trim().startsWith('{') ? text : `{${text} `

  // Extract token usage from Claude's response
  const tokenUsage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cachedTokens: 0, // Claude doesn't report cached tokens the same way
    totalTokens: response.usage.input_tokens + response.usage.output_tokens,
  }

  console.log('[Design Intelligence] Response length:', text.length, 'chars')
  console.log('[Design Intelligence] Token usage:', JSON.stringify(tokenUsage))

  return {
    text: finalJson, // v3.7: Return the repaired JSON string
    tokenUsage,
    model: CLAUDE_MODEL,
    durationMs,
  }
}

/**
 * Call OpenAI for design intelligence
 * @placeholder - To be implemented when needed
 */
async function callOpenAI(prompt: string): Promise<LLMResponse> {
  // Future implementation for OpenAI API
  // Would use openai package with gpt-4o-mini for cost efficiency
  throw new Error('OpenAI provider not yet implemented. Use gemini or claude for now.')
}

// ============================================================
// FALLBACK / DEFAULT CONTEXT
// ============================================================

function parseDesignContext(json: string): DesignContext {
  try {
    // STEP 1: Clean the JSON (remove markdown, comments)
    let cleanedJSON = json.trim()

    // Remove markdown code blocks if present
    if (cleanedJSON.startsWith('```json')) {
      cleanedJSON = cleanedJSON.slice(7) // Remove ```json
    } else if (cleanedJSON.startsWith('```')) {
      cleanedJSON = cleanedJSON.slice(3) // Remove ```
    }

    if (cleanedJSON.endsWith('```')) {
      cleanedJSON = cleanedJSON.slice(0, -3) // Remove trailing ```
    }

    cleanedJSON = cleanedJSON.trim()
    console.log('[Design Intelligence] Cleaned JSON length:', cleanedJSON.length, 'chars')

    // STEP 2: Parse the cleaned JSON (with fallback repair)
    const parsed = safeJsonParse<any>(cleanedJSON)


    // Validate required fields
    const required = [
      'corePurpose',
      'visualElements',
    ]

    const missing = required.filter(field => !parsed[field])
    if (missing.length > 0) {
      console.warn('[Design Intelligence] Missing required fields:', missing)
      // We could throw here, or just let validation fail later
    }

    return parsed as DesignContext
  } catch (error) {
    console.error('[Design Intelligence] JSON Parse Error:', error)
    console.error('[Design Intelligence] Raw JSON:', json.substring(0, 100) + '...')
    throw new Error('Failed to parse design context JSON')
  }
}

/**
 * Get format-specific design guidance to prevent event_poster contamination
 */
function getFormatSpecificGuidance(formatId?: string, formatName?: string): string {
  if (!formatId || formatId === 'event_poster') return ''

  const guidance: Record<string, string> = {
    certificate: `
=== CERTIFICATE DESIGN CONTEXT ===
Certificates require:
- Formal borders, elegant typography, credibility signals (seals, signatures)
- Center-aligned, symmetrical, prestigious feel
- Professional colors (navy, gold, burgundy), NOT vibrant event colors
- Academic symbols (laurels, ribbons, shields), NOT event decorations
- Achievement-focused language, NOT promotional language
CRITICAL: Design a CERTIFICATE, not an event poster!`,

    instagram_post: `
=== INSTAGRAM POST DESIGN CONTEXT ===
Instagram posts require:
- Bold headlines, minimal text, scroll-stopping visuals
- Vertical/square optimized for mobile feeds
- Vibrant, high-contrast colors for engagement
- Modern, trendy graphics and patterns
- Eye-catching compositions that stop scrolling
CRITICAL: Design for INSTAGRAM mobile feed, not an event poster!`,

    linkedin_post: `
=== LINKEDIN POST DESIGN CONTEXT ===
LinkedIn posts require:
- Professional credibility, clear value proposition
- Business-appropriate tone and colors (blues, grays, corporate palette)
- Data visualizations, professional icons, clean layouts
- Authority signals, NOT entertainment visuals
- B2B messaging, NOT consumer event promotions
CRITICAL: Design for LINKEDIN professional feed, not an event poster!`,

    youtube_thumbnail: `
=== YOUTUBE THUMBNAIL DESIGN CONTEXT ===
YouTube thumbnails require:
- Emotion-driven facial expressions if people present
- Bold, large text readable at tiny sizes
- High saturation, complementary color contrasts
- Expressive faces, bold arrows/frames for attention
- Click-through rate optimization (CTR patterns)
CRITICAL: Design for YOUTUBE search/browse tiny thumbnails, not posters!`,

    business_card: `
=== BUSINESS CARD DESIGN CONTEXT ===
Business cards require:
- Minimal, professional layouts with clear hierarchy
- Contact information prominence (name, title, phone, email)
- Corporate/personal branding consistency
- Print-optimized (high DPI, CMYK-safe colors)
- Professional typography, NOT decorative event fonts
CRITICAL: Design a BUSINESS CARD, not an event poster!`,

    flyer: `
=== FLYER DESIGN CONTEXT ===
Flyers require:
- Clear call-to-action (CTA) prominence
- Scannable information hierarchy
- Promotional/marketing tone
- Print or digital distribution optimization
- Quick-glance readability
CRITICAL: Design a FLYER with clear CTA, following flyer best practices!`,

    invitation: `
=== INVITATION DESIGN CONTEXT ===
Invitations require:
- Elegant, welcoming aesthetics
- Clear RSVP information and event details
- Sophisticated typography (script, serif combinations)
- Premium feel (gold accents, textures)
- Formal or semi-formal tone depending on event type
CRITICAL: Design an INVITATION that feels welcoming and elegant!`,

    brochure: `
=== BROCHURE DESIGN CONTEXT ===
Brochures require:
- Multi-section content organization
- Visual storytelling across panels
- Professional corporate aesthetic
- Clear information hierarchy
- Print-optimized layouts with margins
CRITICAL: Design a BROCHURE with multi-panel storytelling!`
  }

  return guidance[formatId] || `
=== ${(formatName || formatId).toUpperCase()} DESIGN CONTEXT ===
This is a ${formatName || formatId}, NOT an event poster.
Consider the unique requirements of this format type.
Adapt visual style, typography, colors, and decorations accordingly.`
}

/**
 * Get category name for a format ID
 */
function getCategoryName(formatId: string): string {
  if (['instagram_post', 'linkedin_post', 'facebook_post', 'twitter_post', 'story'].includes(formatId)) {
    return 'Social Media'
  }
  if (['certificate', 'invitation', 'brochure', 'flyer', 'event_poster'].includes(formatId)) {
    return 'Print Material'
  }
  if (['youtube_thumbnail', 'video_cover'].includes(formatId)) {
    return 'Video Thumbnail'
  }
  if (['business_card', 'letterhead', 'resume'].includes(formatId)) {
    return 'Professional Document'
  }
  return 'Marketing Material'
}

/**
 * Alias for backward compatibility / explicit safety
 */
export const generateDesignContextSafe = generateDesignContext

