/**
 * Ultra-Pro Prompt Generator Service
 *
 * Uses Claude AI to transform user form data into an optimized image generation prompt.
 * This ensures user's exact values are prioritized and correctly rendered in the final image.
 */

import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { CompiledFormData } from './form-data-compiler'
import { buildTextBriefFromCompiled, buildSceneNarrative } from './form-data-compiler'
import { safeJsonParse } from '@/lib/utils/json-repair'

// Import prompt optimization utilities
import {
  getTemperatureConfig,
  generateUltraProCacheKey,
  getCachedUltraProPrompt,
  setCachedUltraProPrompt,
  validateAndFixUltraProPrompt,
} from './prompt-optimization'

// ============================================================
// TYPES
// ============================================================

/**
 * Token usage from AI API call
 */
export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cachedTokens?: number
  totalTokens: number
}

/**
 * Response from LLM call including token usage
 */
interface LLMResponse {
  text: string
  tokenUsage: TokenUsage
  model: string
  durationMs: number
}

export interface UltraProPrompt {
  /** The main headline text that MUST appear prominently in the image */
  primaryText: string
  /** Secondary text elements that should appear in the image */
  secondaryText: string[]
  /** Description of the visual scene/background for the image */
  visualScene: string
  /** Creative direction for layout and visual treatment */
  designGuidance: string
  /** Where text should be positioned in the image */
  textPlacementHints: string
  /** Color suggestions based on event type */
  colorPaletteHints: string
  /** Visual elements that must appear in the image */
  mustIncludeElements: string[]
  /** The complete enhanced prompt for image generation */
  enhancedPrompt: string
}

/**
 * Result from ultra-pro prompt generation including usage tracking
 */
export interface UltraProPromptResult {
  prompt: UltraProPrompt
  usage: {
    provider: 'gemini' | 'claude'
    model: string
    tokenUsage: TokenUsage
    durationMs: number
  }
}

// ============================================================
// PROMPT TEMPLATE
// ============================================================

// v51.0 — Output-token reduction pass.
// Goal: drop enhancedPrompt from ~1,500 → ~500-700 tokens. Drop exact-text-fidelity
// (user-approved trade-off) — Gemini gets typography freedom. Removed verbose
// "copy character-for-character" / "verbatim" / "ground truth" language. Tightened
// JSON field descriptions to demand brevity. The other JSON fields are now
// summary-only — the enhancedPrompt is the single output Gemini actually consumes.
const ULTRA_PRO_PROMPT_SYSTEM = `You are an image-prompt director. Transform event details into a tight, cinematic scene description for an AI image generator.

INTENT OVER LITERALISM:
Interpret the user's creative intent — you have full creative freedom over typography, exact text placement, font choices, and visual hierarchy. Describe the SCENE; let the image model render text as part of the composition. Do not over-specify exact positions, exact fonts, or exact character treatments.

INDIAN CONTEXT:
When people or a venue appear, render an authentic Indian setting (faces, clothing, architecture, signage). Match the venue type to the event — school, college, hotel banquet, community hall, IT office, or outdoor shamiana.

CUSTOM COLOR ENFORCEMENT:
If user-provided hex colors appear in the brief, use ONLY those exact values in colorPaletteHints. Do not substitute presets or invent complementary palettes.

LENGTH BUDGET (CRITICAL):
- enhancedPrompt: dense cinematic scene description, 400-600 tokens of flowing prose. No section headers, no bullet lists, no "Step 1 / Step 2" framing. One continuous paragraph (or two short ones) that paints the image.
- All other fields: short summary lines, not long descriptions. Each capped at one-to-three sentences.

OUTPUT FORMAT — return a single valid JSON object, no markdown, no commentary:
{
  "primaryText": "Event name as the headline (interpret if user phrasing is awkward)",
  "secondaryText": ["Date, time, venue, speaker name+designation — short strings (<50 chars), MAX 4-5 entries. No taglines or long notes."],
  "visualScene": "One-to-two sentence summary of the scene (camera angle, subject, environment, mood). Brief.",
  "designGuidance": "One sentence on layout/typography mood — adjectives, not coordinates.",
  "textPlacementHints": "One short phrase about general placement (e.g. 'headline upper-center, supporting details below'). No exact percentages.",
  "colorPaletteHints": "Color palette in one sentence (hex values if user-provided).",
  "mustIncludeElements": ["3-5 concrete event-specific elements (e.g. graduation cap, blood bag, microphone, mandala). Avoid generic patterns (waves, hexagons, mesh)."],
  "enhancedPrompt": "400-600 tokens of dense cinematic prose: scene, subject, environment, mood, light, color, composition. Mention the headline naturally as part of the composition. Trust the image model to render text creatively."
}`

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Generate an ultra-pro prompt using Claude AI.
 * Transforms compiled form data into an optimized image generation prompt.
 * Returns the prompt along with usage tracking information.
 *
 * OPTIMIZATIONS (v3.7):
 * - Response caching for similar requests
 * - Dynamic temperature based on format type
 * - Schema validation with auto-fix
 *
 * v5.1: Added logoStripEnabled parameter for conditional header band instructions
 */
export async function generateUltraProPrompt(
  compiledData: CompiledFormData,
  provider: 'claude' | 'gemini' = 'claude', // v50.2: Reverted to claude — gemini-2.5-flash flattened rich context into generic boilerplate
  designContext?: any, // DesignContext from Design Intelligence (optional)
  logoStripEnabled?: boolean, // Whether user has enabled logo strip feature (v5.1)
  resolvedColors?: { source: string; primaryColor: string; secondaryColor: string; accentColor: string }, // Custom colors to enforce (v5.3)
  dualStripeMode?: boolean, // v6.0: Whether dual-stripe header mode is enabled (primary + vertical logos)
  promptStyleOptions?: {
    temperatureOverride?: number | null // v31.0: Override dynamic temperature
    creativeDirection?: string          // v31.0: Prompt style creative direction
    modelGuidance?: string              // v31.0: Model-specific prompt tuning guidance
  },
  recentOrgPrompts?: string[], // v36.0: Recent org prompts for generation memory
  // v44.0: Downstream image-generation model. The system prompt's 40–83% content-zone
  // and top/bottom logo-bar assumptions are ONLY valid for Gemini (where Sharp overlays
  // logo bars post-generation). When 'openai', we append an override block that
  // neutralizes those assumptions so gpt-image-1 doesn't place text in the cropped zones.
  targetProvider: 'gemini' | 'openai' = 'gemini',
  // v53.0: Composition strategy from Subject Classifier (Stage 0). When provided,
  // conditional system-prompt guidance is appended so Claude writes an enhancedPrompt
  // consistent with the chosen composition (e.g. portrait-hero → zero drawn humans).
  compositionStrategy?: string
): Promise<UltraProPromptResult> {
  console.log('[Ultra-Pro Prompt] === GENERATING OPTIMIZED PROMPT ===')
  console.log('[Ultra-Pro Prompt] Event Name:', compiledData.eventName || '(not provided)')
  console.log('[Ultra-Pro Prompt] Format:', compiledData.format?.name || 'default')
  console.log('[Ultra-Pro Prompt] Provider:', provider)
  console.log('[Ultra-Pro Prompt] Target Provider:', targetProvider)
  console.log('[Ultra-Pro Prompt] Design Context:', designContext ? 'PROVIDED (v5.0 enhancement)' : 'NOT PROVIDED (fallback mode)')
  console.log('[Ultra-Pro Prompt] Dual-Stripe Mode:', dualStripeMode ? 'YES (18% reserved, 20% text start)' : 'NO (8% reserved, 15% text start)')

  if (designContext) {
    console.log('[Ultra-Pro Prompt] Story Analysis:', designContext.storyAnalysis?.narrative?.substring(0, 100) || '(none)')
    console.log('[Ultra-Pro Prompt] Visual Elements:', designContext.visualElements?.join(', ') || '(none)')
    console.log('[Ultra-Pro Prompt] Vibe Keywords:', designContext.vibeAndMood?.vibeKeywords?.join(', ') || '(none)')
  }

  // === OPTIMIZATION 1: Check cache first ===
  const formatId = compiledData.format?.id

  // v5.5: Add variation seed for creative formats to prevent identical generations
  const isCreativeFormat = ['event_poster', 'flyer', 'instagram_post', 'youtube_thumbnail'].includes(formatId || '')
  const variationSeed = isCreativeFormat ? Date.now().toString() : undefined

  const cacheKey = generateUltraProCacheKey({
    formatId,
    eventName: compiledData.eventName || undefined,
    eventType: compiledData.eventType || undefined,
    hasSpeaker: !!compiledData.speakerName,
    hasVenue: !!compiledData.venue,
    variationSeed, // NEW: Forces unique cache key every time for creative formats
    targetProvider, // v44.0: Different system prompt per target provider — do not share cache
  })

  // For creative formats, skip cache to ensure fresh variation
  const cachedPrompt = isCreativeFormat ? null : (getCachedUltraProPrompt(cacheKey) as UltraProPrompt | null)
  if (cachedPrompt) {
    console.log('[Ultra-Pro Prompt] Using CACHED prompt (non-creative format)')
    return {
      prompt: cachedPrompt,
      usage: {
        provider,
        model: 'cached',
        tokenUsage: { inputTokens: 0, outputTokens: 0, cachedTokens: 0, totalTokens: 0 },
        durationMs: 0,
      },
    }
  }

  if (isCreativeFormat) {
    console.log('[Ultra-Pro Prompt] Skipping cache for creative format (ensuring variation)')
  }

  // === OPTIMIZATION 2: Get dynamic temperature config ===
  const tempConfig = getTemperatureConfig(formatId)
  console.log('[Ultra-Pro Prompt] Temperature config:', tempConfig.description)

  // Build the user brief from compiled data
  const userBrief = buildTextBriefFromCompiled(compiledData)
  console.log('[Ultra-Pro Prompt] User Brief:', userBrief.substring(0, 200) + '...')

  // Build design context section (v5.0)
  let designContextSection = ''
  if (designContext) {
    designContextSection = `

DESIGN INTELLIGENCE CONTEXT (v5.0 - PRESERVE AND ENHANCE):
Story Analysis: ${designContext.storyAnalysis?.narrative || '(none)'}
Emotional Arc: ${designContext.storyAnalysis?.emotionalArc || '(none)'}
Visual Elements: ${designContext.visualElements?.join(', ') || '(none)'}
Vibe Keywords: ${designContext.vibeAndMood?.vibeKeywords?.join(', ') || '(none)'}
Mood Atmosphere: ${designContext.vibeAndMood?.moodAtmosphere || '(none)'}
Background Setting: ${designContext.backgroundSetting || '(none)'}
Iconic Imagery: ${designContext.iconicImagery?.join(', ') || '(none)'}
Decorative Elements: ${designContext.decorativeElementsContext ? JSON.stringify(designContext.decorativeElementsContext.thematicElements) : '(none)'}
Typography Strategy: ${designContext.typographyStrategy ? `${designContext.typographyStrategy.headlineApproach} / ${designContext.typographyStrategy.multiColorStrategy?.colorRhythm}` : '(none)'}
Color Storytelling: ${designContext.colorStorytelling ? `${designContext.colorStorytelling.palette?.dominantHues?.join(' + ')} - ${designContext.colorStorytelling.palette?.psychologyReasoning}` : '(none)'}

CRITICAL: Your enhancedPrompt MUST integrate these story-driven insights into a NARRATIVE SCENE DESCRIPTION (not keyword lists).
`
  }

  // Build logo strip instructions (v5.3: AI should NOT extend into reserved area - Sharp handles it)
  // IMPORTANT: When logo strip enabled, AI should START design below the reserved area
  // v6.0: Dual-stripe mode uses 18% reserved (vs 8% single-stripe) and 20% text start (vs 15%)
  const reservedPercent = dualStripeMode ? 18 : 8
  const textStartPercent = dualStripeMode ? 20 : 15

  const logoStripInstructions = logoStripEnabled
    ? `
TOP AREA GUIDANCE (CRITICAL):
- The top ${reservedPercent}% of the canvas is RESERVED and will be replaced in post-processing.
- START your design at approximately ${reservedPercent}% from the top edge.
- Do NOT extend backgrounds, gradients, or any graphics into the top ${reservedPercent}%.
- Treat ${reservedPercent}% from top as the TOP EDGE of your design canvas.
- Position the main headline starting at approximately ${textStartPercent}% from top.${dualStripeMode ? '\n- DUAL-STRIPE MODE: Two rows of logos occupy top 18%, ensure 2% buffer before text.' : ''}`
    : `
TOP AREA GUIDANCE:
- DO NOT create any visible stripe, band, or header section at the top.
- The background design should flow naturally and seamlessly from top to bottom.
- Keep the top 10% clean with simple background (no text, faces, or graphics).
- Use simple backgrounds (solid colors or subtle gradients) in the top area.`

  // Build color enforcement section (v5.5: STRICT enforcement for ALL sources)
  let colorBriefSection = ''
  if (resolvedColors && resolvedColors.source !== 'fallback') {
    // Determine enforcement language based on source
    const sourceLabel = {
      custom: 'MANDATORY CUSTOM USER COLORS (NON-NEGOTIABLE)',
      brand: 'MANDATORY ORGANIZATION BRAND COLORS (STRICT COMPLIANCE)',
      preset: 'USER-SELECTED COLOR PALETTE (STRICT COMPLIANCE)',
    }[resolvedColors.source]

    const sourceDescription = {
      custom: 'user-selected custom colors',
      brand: 'the organization\'s brand identity',
      preset: 'user-selected from preset palette',
    }[resolvedColors.source]

    colorBriefSection = `
${sourceLabel}:
Primary Color: ${resolvedColors.primaryColor}
Secondary Color: ${resolvedColors.secondaryColor}
Accent Color: ${resolvedColors.accentColor}

CRITICAL: These are ${sourceDescription}. You MUST use these exact hex values in your colorPaletteHints.
Background MUST use Primary Color (${resolvedColors.primaryColor}) as the dominant color - match the EXACT tone.
Do NOT suggest alternative palettes. Do NOT use theme-based colors (navy/gold, purple/pink, etc.).
Do NOT use event-type default colors (conference blue, workshop orange, etc.).
These colors are NON-NEGOTIABLE - override any other color suggestions in this prompt.

`
  }

  // v6.0: Build creativity enforcement section
  const creativityEnforcement = isCreativeFormat ? `

=== CREATIVE CONCEPT DIVERSITY v38.0 (MANDATORY) ===

CONCEPT LENS SELECTOR: ${variationSeed}
This seed determines which Creative Lens to FAVOR for this generation:
- Seeds ending in 0-1: FAVOR Lens B (Object-as-Hero)
- Seeds ending in 2-3: FAVOR Lens C (Conceptual Metaphor)
- Seeds ending in 4-5: FAVOR Lens D (Emotional Close-up)
- Seeds ending in 6-7: FAVOR Lens E (Environmental Storytelling)
- Seeds ending in 8-9: FAVOR Lens A (Literal Scene) — but make it EMOTIONALLY SPECIFIC, not generic
"FAVOR" means start your brainstorm with that lens. If it genuinely does not fit this event, choose another — but you MUST justify why.

CONCEPT QUALITY CHECK (v38.0):
Before finalizing your visualScene, answer these 3 questions:
1. "Could this EXACT visual concept have been generated for a DIFFERENT event in the same category?" If YES → too generic, choose a different lens.
2. "Does this concept use the MOST OBVIOUS visual interpretation?" If YES → deliberately explore a less obvious lens.
3. "Would a senior art director say 'I have seen this before'?" If YES → push harder on conceptual boldness.

ANTI-PATTERN ENFORCEMENT:
❌ Generic crowd/audience scenes that could be any event of this type
❌ Blue-to-purple or orange-to-pink generic gradients
❌ Stock photo aesthetic (perfect people, staged scenes)
❌ Default professional navy/gray palettes
❌ Random geometric shapes without meaning
❌ Overused sunburst/radial patterns
❌ Generic cityscape silhouettes
❌ Floating spheres/cubes without purpose
❌ Bokeh backgrounds without connection to content

YOUR GOAL: Each generation for the SAME event should look like it was designed by a DIFFERENT designer with a DIFFERENT creative philosophy.
` : ''

  // Build visual direction section (user's free-text visual brief)
  const visualDirectionSection = compiledData.visualDirection
    ? `\nUSER VISUAL DIRECTION (highest priority — override theme defaults):\n"${compiledData.visualDirection}"\nThe visualScene field MUST reflect this exact visual. Treat it as a direct creative brief from the user.\n`
    : ''

  // v31.0: Build creative style section
  const creativeStyleSection = promptStyleOptions?.creativeDirection
    ? `\nCREATIVE STYLE (v31.0 — Pipeline-Level Creative Mode):\n${promptStyleOptions.creativeDirection}\nApply this creative approach to ALL visual decisions — scene, composition, color, typography.\n`
    : ''

  // v31.0: Build model guidance section
  const modelGuidanceSection = promptStyleOptions?.modelGuidance
    ? `\nMODEL-SPECIFIC APPROACH (v31.0):\n${promptStyleOptions.modelGuidance}\n`
    : ''

  // v36.0: Build generation memory section from recent org prompts
  const generationMemorySection = recentOrgPrompts && recentOrgPrompts.length > 0
    ? `\nORG VISUAL HISTORY (v36.0 — THIS CHAPTER'S RECENT POSTERS FOR REFERENCE):
${recentOrgPrompts.map((p, i) => `[Recent #${i + 1}]: ${p.substring(0, 500)}`).join('\n')}
Use these as style/tone reference — same org, same audience. Push for FRESH composition each time — never repeat the same scene, angle, or layout as a previous generation.\n`
    : ''

  if (recentOrgPrompts && recentOrgPrompts.length > 0) {
    console.log(`[Ultra-Pro Prompt] v36.0 Generation Memory: ${recentOrgPrompts.length} recent prompts injected`)
  }

  // v36.0: Build audience context section
  const audienceContextSection = compiledData.targetAudience
    ? `\nTARGET AUDIENCE (v36.0 — MUST shape visual style):
"${compiledData.targetAudience}"
The visual scene, style, environment, and complexity MUST be designed for THIS specific audience. Match their world, their visual language, their level of understanding. A poster for school children looks nothing like one for corporate executives.\n`
    : ''

  // v37.0: Build Indian environment context from venue/audience mapping
  const sceneNarrative = buildSceneNarrative(compiledData)
  const sceneNarrativeSection = sceneNarrative.length > 30
    ? `\nINDIAN ENVIRONMENT CONTEXT (v37.0):\n${sceneNarrative}\nThe visualScene MUST reflect this specific Indian environment.\n`
    : ''
  if (sceneNarrativeSection) {
    console.log(`[Ultra-Pro Prompt] v37.0 Indian Environment Context injected (${sceneNarrative.length} chars)`)
  }

  // v53.0: Composition-strategy guidance — appended BEFORE the user brief so
  // Claude treats it as part of the system contract for this generation.
  // portrait-hero is the load-bearing case: Claude must NOT write any drawn humans
  // into enhancedPrompt because the real portrait will be composited separately.
  const compositionStrategySection = compositionStrategy
    ? (() => {
        const map: Record<string, string> = {
          'portrait-hero': `
COMPOSITION STRATEGY OVERRIDE — PORTRAIT-HERO (v53.0, MANDATORY):
The upstream Subject Classifier determined this poster centers on ONE specific person being honored. A real portrait of that person will be composited separately AFTER you write the enhancedPrompt.

Therefore, when writing enhancedPrompt and visualScene:
- Write a scene with ZERO drawn humans. No people anywhere. Not in the foreground, not in the background, not as silhouettes, not as blurred figures, not as a crowd, not as attendees, not as audience, not as team members, not as loved ones surrounding the honoree.
- The scene MUST be an EMPTY DIGNIFIED BACKDROP: stage architecture (proscenium, ornate pillars, decorative drapes), ceremonial atmosphere (warm spotlights, soft glow, ambient backlight, theatrical depth), decorative objects (flowers, garlands, cake on stand, candles, ceremonial banners, brand-color textures).
- Do NOT use any of these phrases in enhancedPrompt or visualScene: "attendees", "audience gestures", "crowd", "team members around her/him", "blurred figures", "loved ones", "well-wishers", "people celebrating", "group of attendees", "silhouettes of people", "well-dressed crowd".
- If the user's brief mentions birthday / celebration / felicitation language, interpret it as the SETTING for an empty ceremonial stage — not as instruction to draw guests.
- mustIncludeElements MUST be ceremonial objects (decorative flowers, layered cake, garlands, podium, lit lamp, ornate drapes) — never people.
- The reserved center zone will hold the real portrait; design the rest of the canvas to FRAME that portrait without competing with it.
`,
          'activity-collage': `
COMPOSITION STRATEGY — ACTIVITY-COLLAGE (v53.0):
This is a multi-track / cultural-fest poster. Write enhancedPrompt as a multi-zone festive layout with distinct illustrated activity zones (one per listed activity), Indian festive motifs (mandala, paisley, kolam borders, confetti, fireworks), and energetic figures performing each activity. NOT a single hero scene.
`,
          'object-hero': `
COMPOSITION STRATEGY — OBJECT-HERO (v53.0):
This is a product / book / device / app launch. enhancedPrompt should describe ONE symbolic object dominating ~60% of the canvas with dramatic product lighting. People should be secondary or absent — the object is the hero.
`,
          'environment-scene': `
COMPOSITION STRATEGY — ENVIRONMENT-SCENE (v53.0):
The PLACE itself is the subject (heritage walk / lab inauguration / building opening). enhancedPrompt should depict the venue/building/landscape in architectural detail with cinematic depth. People are incidental scale figures only.
`,
          // 'concept-iconic' → no override
        }
        return map[compositionStrategy] || ''
      })()
    : ''

  // v44.0: Target-provider override block.
  // The ULTRA_PRO_PROMPT_SYSTEM hardcodes Gemini-specific zone rules
  // (40–83% content zone, 25% top logo bar, 17% bottom logo bar, "text at 42%" etc.)
  // that bake into Claude's enhancedPrompt. gpt-image-1 has NO logo bars and instead
  // gets ~11% cover-crop on top + bottom during post-processing — so following those
  // Gemini rules puts the headline in the cropped zone and chops the letters.
  //
  // This block, emitted AFTER the system prompt template, revokes those assumptions
  // for OpenAI. LLMs honor the most recent directive on conflict, so this wins.
  const openaiOverrideSection = targetProvider === 'openai'
    ? `

═══════════════════════════════════════════════════════════════
PROVIDER-SPECIFIC OVERRIDE — OpenAI gpt-image-1 (v44.0, MANDATORY)
═══════════════════════════════════════════════════════════════
The zone rules above (40–83% content zone, 25% top logo bar, 17% bottom
logo bar, "text at 42%", TEXT-SAFE ZONE v43.0 mid-section design, zone
sandwich) were written for Gemini's post-overlay pipeline. They are
INVALID for this request and MUST be ignored.

For THIS generation:
• Target model: OpenAI gpt-image-1 — renders text DIRECTLY into the image.
• NO post-overlay logo bars will be added. Do NOT reserve space at the
  top or bottom for logo bars.
• The output WILL be cropped by approximately 11% from the TOP edge and
  11% from the BOTTOM edge to fit the target 3:4 poster canvas.
• Therefore the SAFE AREA is the CENTER vertical band, roughly 11%–89%
  of canvas height (middle ~78%). Everything OUTSIDE this band will be
  erased by the crop.
• ALL rendered text (headline, tagline, date, time, venue, speakers)
  MUST be placed INSIDE the center safe area with clear margin from
  the top and bottom edges.

textPlacementHints override: DO NOT emit percentage-based placement
hints for OpenAI. Use abstract composition language such as
"upper-center with clear margin from top edge", "mid-center", or
"lower-center with clear margin from bottom edge". Do NOT reference
"40%", "42%", "83%", "logo bar", "reserved area", or "zone sandwich".

visualScene override: The scene will CONTAIN the text (no overlay
compositing). Compose so the text has readable surface beneath it,
but do NOT position subjects specifically for a "mid-section text
band" — that band is for Gemini only.
═══════════════════════════════════════════════════════════════
`
    : ''

  // Build the full prompt for the AI
  // v53.0: compositionStrategySection is part of the system contract — placed
  // BEFORE the user brief so prompt-caching split (at "USER'S CREATIVE BRIEF") keeps
  // it on the cacheable system side.
  const prompt = `${ULTRA_PRO_PROMPT_SYSTEM}
${creativityEnforcement}${creativeStyleSection}${modelGuidanceSection}${generationMemorySection}${compositionStrategySection}
${colorBriefSection}USER'S CREATIVE BRIEF:
${userBrief}
${designContextSection}${visualDirectionSection}${audienceContextSection}${sceneNarrativeSection}
SOPHISTICATION LEVEL: ${compiledData.sophistication || 'balanced'}
TYPOGRAPHY PREFERENCE: ${compiledData.fontStyle || 'AI-suggested'}
ALIGNMENT PREFERENCE: ${compiledData.alignment || 'AI-suggested'}
${logoStripInstructions}${openaiOverrideSection}

Generate the ultra-pro prompt JSON now. Keep enhancedPrompt to 400-600 tokens of cinematic prose — let the image model handle typography creatively.`

  // v31.0: Use style temperature override or format-based dynamic temperature
  const effectiveTemperature = promptStyleOptions?.temperatureOverride ?? tempConfig.ultraProPrompt
  if (promptStyleOptions?.temperatureOverride != null) {
    console.log(`[Ultra-Pro Prompt] v31.0 Style temperature override: ${effectiveTemperature} (was: ${tempConfig.ultraProPrompt})`)
  }

  // Call the appropriate AI provider with temperature
  let llmResponse: LLMResponse

  try {
    if (provider === 'gemini') {
      llmResponse = await callGemini(prompt, effectiveTemperature, tempConfig.topP)
    } else {
      llmResponse = await callClaude(prompt, effectiveTemperature)
    }
  } catch (error) {
    console.error('[Ultra-Pro Prompt] AI call failed:', error)
    // Return a fallback prompt if AI fails with zero usage (v5.1: Pass logoStripEnabled)
    return {
      prompt: generateFallbackPrompt(compiledData, logoStripEnabled),
      usage: {
        provider,
        model: 'fallback',
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          cachedTokens: 0,
          totalTokens: 0,
        },
        durationMs: 0,
      },
    }
  }

  console.log(`[Ultra-Pro Prompt] Response received in ${llmResponse.durationMs}ms`)

  // === OPTIMIZATION 3: Schema validation with auto-fix ===
  const parsedPrompt = parseUltraProPrompt(llmResponse.text, compiledData, logoStripEnabled)
  const validatedPrompt = validateAndFixUltraProPrompt(parsedPrompt)

  const ultraProPrompt = validatedPrompt || parsedPrompt
  console.log('[Ultra-Pro Prompt] === PROMPT GENERATED ===')
  console.log('[Ultra-Pro Prompt] Primary Text:', ultraProPrompt.primaryText)
  console.log('[Ultra-Pro Prompt] Enhanced Prompt:', ultraProPrompt.enhancedPrompt.substring(0, 200) + '...')

  // === OPTIMIZATION 4: Cache the result ===
  setCachedUltraProPrompt(cacheKey, ultraProPrompt)

  return {
    prompt: ultraProPrompt,
    usage: {
      provider,
      model: llmResponse.model,
      tokenUsage: llmResponse.tokenUsage,
      durationMs: llmResponse.durationMs,
    },
  }
}

/**
 * Safe version that returns fallback on error with zero usage
 * v5.0: Now accepts designContext parameter
 * v5.1: Now accepts logoStripEnabled parameter
 * v5.3: Now accepts resolvedColors parameter
 * v6.0: Now accepts dualStripeMode parameter
 */
export async function generateUltraProPromptSafe(
  compiledData: CompiledFormData,
  provider: 'claude' | 'gemini' = 'claude', // v50.2: Reverted to claude — gemini-2.5-flash flattened rich context into generic boilerplate
  designContext?: any, // DesignContext from Design Intelligence (optional)
  logoStripEnabled?: boolean, // Whether user has enabled logo strip feature (v5.1)
  resolvedColors?: { source: string; primaryColor: string; secondaryColor: string; accentColor: string }, // Custom colors to enforce (v5.3)
  dualStripeMode?: boolean, // v6.0: Whether dual-stripe header mode is enabled (primary + vertical logos)
  promptStyleOptions?: {
    temperatureOverride?: number | null
    creativeDirection?: string
    modelGuidance?: string
  },
  recentOrgPrompts?: string[], // v36.0: Recent org prompts for generation memory
  targetProvider: 'gemini' | 'openai' = 'gemini', // v44.0: Downstream image model — activates provider override block
  compositionStrategy?: string // v53.0: Composition strategy from Subject Classifier (Stage 0)
): Promise<UltraProPromptResult> {
  try {
    return await generateUltraProPrompt(compiledData, provider, designContext, logoStripEnabled, resolvedColors, dualStripeMode, promptStyleOptions, recentOrgPrompts, targetProvider, compositionStrategy)
  } catch (error) {
    console.error('[Ultra-Pro Prompt] Error:', error)
    return {
      prompt: generateFallbackPrompt(compiledData, logoStripEnabled, dualStripeMode),
      usage: {
        provider,
        model: 'fallback',
        tokenUsage: {
          inputTokens: 0,
          outputTokens: 0,
          cachedTokens: 0,
          totalTokens: 0,
        },
        durationMs: 0,
      },
    }
  }
}

// ============================================================
// AI PROVIDER IMPLEMENTATIONS
// ============================================================

async function callClaude(
  prompt: string,
  temperature: number = 0.9
): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const modelName = 'claude-haiku-4-5'

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const client = new Anthropic({ apiKey })

  console.log('[Ultra-Pro Prompt] Calling Claude Haiku 4.5 (temp:', temperature, ')...')
  const startTime = Date.now()

  // Use prompt caching for the system prompt
  const systemPromptEnd = prompt.indexOf("USER'S CREATIVE BRIEF")
  const systemPrompt = systemPromptEnd > 0 ? prompt.substring(0, systemPromptEnd).trim() : ''
  const userContent = systemPromptEnd > 0 ? prompt.substring(systemPromptEnd) : prompt

  const usePromptCaching = systemPrompt.length > 500

  const response = await client.messages.create({
    model: modelName,
    max_tokens: 900,
    ...(usePromptCaching ? {
      system: [
        {
          type: 'text' as const,
          text: systemPrompt,
          cache_control: { type: 'ephemeral' as const },
        },
      ],
      messages: [{ role: 'user' as const, content: userContent }],
    } : {
      messages: [{ role: 'user' as const, content: prompt }],
    }),
  })

  const durationMs = Date.now() - startTime

  const textBlock = response.content.find(block => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Claude')
  }

  // v51.0 — read Anthropic's cache-aware usage fields. Per SDK:
  //   input_tokens                 = uncached input only (excludes cached + created)
  //   cache_read_input_tokens      = tokens served from cache (the cache HIT count)
  //   cache_creation_input_tokens  = tokens written to cache on a MISS (first call)
  // Previously hardcoded cachedTokens=0 which masked whether caching was working.
  const cacheReadTokens = (response.usage as any).cache_read_input_tokens ?? 0
  const cacheCreationTokens = (response.usage as any).cache_creation_input_tokens ?? 0

  const tokenUsage: TokenUsage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    cachedTokens: cacheReadTokens,
    totalTokens: response.usage.input_tokens + response.usage.output_tokens + cacheReadTokens + cacheCreationTokens,
  }

  console.log('[Ultra-Pro Prompt] Token usage:', JSON.stringify({
    ...tokenUsage,
    cacheCreationTokens, // surface separately for debugging
  }))

  return { text: textBlock.text, tokenUsage, model: modelName, durationMs }
}

async function callGemini(
  prompt: string,
  temperature: number = 0.7,
  topP: number = 0.9
): Promise<LLMResponse> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  // v50.1 (Fix #9 — CHEAPEST DEFAULT): gemini-2.5-flash is the most affordable stable
  // model — $0.30/1M input, $2.50/1M output (70% cheaper than Claude Haiku 4.5).
  // Switched from gemini-3-flash-preview as default because Anthropic credits ran out
  // and we need maximum cost relief on every generation.
  // Override via env to upgrade quality (slightly more expensive):
  //   GEMINI_PROMPT_MODEL=gemini-3-flash-preview  → frontier-class at $0.50/1M
  //   GEMINI_PROMPT_MODEL=gemini-3.5-flash        → most intelligent at $1.50/1M
  const modelName = process.env.GEMINI_PROMPT_MODEL || 'gemini-2.5-flash'

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature, // Dynamic temperature based on format type
      topP, // Dynamic top-P for word choice variation
      maxOutputTokens: 2000, // Increased from 1500 for complex responses
      responseMimeType: 'application/json', // v7.0: Force valid JSON output
    }
  })

  console.log(`[Ultra-Pro Prompt] Calling Gemini (${modelName}, temp: ${temperature})...`)
  const startTime = Date.now()

  const result = await model.generateContent(prompt)
  const response = result.response

  const durationMs = Date.now() - startTime
  const text = response.text()

  // Extract token usage from response metadata
  const usageMetadata = response.usageMetadata
  const tokenUsage: TokenUsage = {
    inputTokens: usageMetadata?.promptTokenCount || Math.ceil(prompt.length / 4),
    outputTokens: usageMetadata?.candidatesTokenCount || Math.ceil(text.length / 4),
    cachedTokens: usageMetadata?.cachedContentTokenCount || 0,
    totalTokens: usageMetadata?.totalTokenCount || Math.ceil((prompt.length + text.length) / 4),
  }

  console.log('[Ultra-Pro Prompt] Token usage:', JSON.stringify(tokenUsage))

  return {
    text,
    tokenUsage,
    model: modelName,
    durationMs,
  }
}

// ============================================================
// RESPONSE PARSING
// ============================================================

function normaliseUltraProResult(
  parsed: any,
  compiledData: CompiledFormData,
  logoStripEnabled?: boolean
): UltraProPrompt {
  return {
    primaryText: parsed.primaryText || compiledData.eventName || 'Event',
    secondaryText: Array.isArray(parsed.secondaryText) ? parsed.secondaryText : [],
    visualScene: parsed.visualScene || 'Professional event setting',
    designGuidance: parsed.designGuidance || 'Clean, modern design with clear hierarchy',
    textPlacementHints: parsed.textPlacementHints || 'Center-aligned text with event name prominent',
    colorPaletteHints: parsed.colorPaletteHints || 'Professional color palette',
    mustIncludeElements: Array.isArray(parsed.mustIncludeElements) ? parsed.mustIncludeElements : [],
    enhancedPrompt: parsed.enhancedPrompt || buildFallbackEnhancedPrompt(compiledData, logoStripEnabled),
  }
}

function parseUltraProPrompt(
  response: string,
  compiledData: CompiledFormData,
  logoStripEnabled?: boolean
): UltraProPrompt {
  // Clean up the response - remove markdown code blocks
  let jsonStr = response.trim()
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7)
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3)
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3)
  }
  jsonStr = jsonStr.trim()

  // Extract JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    // Second attempt: response may be truncated (no closing }) — repair and retry
    if (jsonStr.startsWith('{')) {
      try {
        const repaired = safeJsonParse<any>(jsonStr)
        console.warn('[Ultra-Pro Prompt] Recovered truncated JSON via repair')
        return normaliseUltraProResult(repaired, compiledData, logoStripEnabled)
      } catch {
        // fall through to original fallback
      }
    }
    console.error('[Ultra-Pro Prompt] Failed to extract JSON:', response.substring(0, 200))
    return generateFallbackPrompt(compiledData, logoStripEnabled)
  }

  try {
    const parsed = safeJsonParse<any>(jsonMatch[0])
    return normaliseUltraProResult(parsed, compiledData, logoStripEnabled)
  } catch (error) {
    console.error('[Ultra-Pro Prompt] JSON parse error:', error)
    console.error('[Ultra-Pro Prompt] Raw JSON (first 500 chars):', jsonMatch[0].substring(0, 500))
    return generateFallbackPrompt(compiledData, logoStripEnabled)
  }
}

// ============================================================
// FALLBACK GENERATION
// ============================================================

function generateFallbackPrompt(
  compiledData: CompiledFormData,
  logoStripEnabled?: boolean,
  dualStripeMode?: boolean // v6.0: Whether dual-stripe header mode is enabled
): UltraProPrompt {
  console.log('[Ultra-Pro Prompt] Using fallback prompt generation')
  console.log('[Ultra-Pro Prompt] Logo strip enabled:', logoStripEnabled ? 'YES' : 'NO')
  console.log('[Ultra-Pro Prompt] Dual-stripe mode:', dualStripeMode ? 'YES' : 'NO')

  const eventName = compiledData.eventName || 'Event'
  const secondaryText: string[] = []

  // ONLY essential info in secondaryText (date, time, venue, speaker)
  if (compiledData.date) secondaryText.push(compiledData.date)
  if (compiledData.time) secondaryText.push(compiledData.time)
  if (compiledData.venue) secondaryText.push(compiledData.venue)
  if (compiledData.speakerName) {
    const speakerLine = compiledData.speakerDesignation
      ? `${compiledData.speakerName}, ${compiledData.speakerDesignation}`
      : compiledData.speakerName
    secondaryText.push(speakerLine)
  }

  // DO NOT add eventNote or other long content to secondaryText
  // (they'll be referenced in visualScene/designGuidance instead)

  return {
    primaryText: eventName,
    secondaryText,
    visualScene: `Professional ${compiledData.format?.name || 'poster'} design with clean modern aesthetic`,
    designGuidance: 'Bold headline with clear visual hierarchy. Secondary information in smaller but readable text.',
    textPlacementHints: 'Event name centered and prominent in 51-57% zone. Supporting details in 58-63% zone. ALL text strictly within 50-65% only.',
    colorPaletteHints: 'Professional color scheme appropriate for the event type',
    mustIncludeElements: ['event title', 'date and venue if provided', 'speaker name if provided'],
    enhancedPrompt: buildFallbackEnhancedPrompt(compiledData, logoStripEnabled),
  }
}

/**
 * Builds a fallback enhanced prompt using NARRATIVE descriptions.
 *
 * IMPORTANT: This function avoids instruction language that Gemini
 * might render as visible text. Instead of "Include X", "Feature Y",
 * it uses descriptive prose about the design.
 *
 * Anti-patterns AVOIDED:
 * - "Include these details: date: X, time: Y" (labels leak)
 * - "Feature the guest/speaker: X" (instruction language)
 * - "Create a design with..." (command language)
 *
 * v5.1: Now respects logoStripEnabled parameter
 */
function buildFallbackEnhancedPrompt(
  compiledData: CompiledFormData,
  logoStripEnabled?: boolean
): string {
  const parts: string[] = []

  // Format type - use narrative, not command
  const formatName = compiledData.format?.name || 'poster'
  const eventType = compiledData.eventType || 'professional event'
  parts.push(`A ${eventType} ${formatName} with clean, modern typography.`)

  // Event name - describe the headline, don't command
  if (compiledData.eventName) {
    parts.push(`The prominent headline reads "${compiledData.eventName}".`)
  }

  // Date, time, venue - list as supporting text, no labels
  const supportingText: string[] = []
  if (compiledData.date?.trim()) supportingText.push(`"${compiledData.date.trim()}"`)
  if (compiledData.time?.trim()) supportingText.push(`"${compiledData.time.trim()}"`)
  if (compiledData.venue?.trim()) supportingText.push(`"${compiledData.venue.trim()}"`)
  if (supportingText.length > 0) {
    parts.push(`Supporting text elements: ${supportingText.join(', ')}.`)
  }

  // Speaker/Guest - describe naturally, no "Feature" command
  if (compiledData.speakerName?.trim()) {
    const speakerText = compiledData.speakerDesignation?.trim()
      ? `"${compiledData.speakerName.trim()}, ${compiledData.speakerDesignation.trim()}"`
      : `"${compiledData.speakerName.trim()}"`
    parts.push(`Speaker attribution: ${speakerText}.`)
  }

  // Organization - describe as part of branding, no command
  if (compiledData.organizationName?.trim()) {
    parts.push(`Branding for "${compiledData.organizationName.trim()}".`)
  }

  // Custom fields - VALUES ONLY, wrapped in quotes
  for (const value of Object.values(compiledData.customFields)) {
    if (value?.trim()) {
      parts.push(`Additional text: "${value.trim()}".`)
    }
  }

  // Event note (footer content) - describe as footer text
  if (compiledData.eventNote?.trim()) {
    parts.push(`Footer note: "${compiledData.eventNote.trim()}".`)
  }

  // Style/Theme - describe the aesthetic, don't command
  const styleDescriptors: string[] = []
  if (compiledData.theme) styleDescriptors.push(compiledData.theme)
  if (compiledData.style) styleDescriptors.push(compiledData.style)

  // NEW v4.0: Sophistication-aware fallbacks
  // v5.1: Conditional logo stripe based on user toggle
  if (compiledData.sophistication === 'minimalist') {
    styleDescriptors.push('high-impact minimalism', 'generous negative space', 'ultra-clean layout')
    // Only mention logo stripe if explicitly enabled by user
    if (logoStripEnabled) {
      styleDescriptors.push('solid white logo stripe')
    }
  } else if (compiledData.sophistication === 'rich') {
    styleDescriptors.push('rich immersive atmosphere', 'multi-layered background', 'vivid lighting', 'ambient textures')
  }

  if (styleDescriptors.length > 0) {
    parts.push(`${styleDescriptors.join(', ')} aesthetic with professional layout.`)
  }

  // Quality note - describe outcome, not instruction
  parts.push('Crisp, legible typography throughout.')

  return parts.join(' ')
}
