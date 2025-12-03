/**
 * Gemini Prompt Adapter
 * Transforms PromptIntent into Gemini-optimized natural language prompts
 *
 * ULTRA-PRO DESIGNER approach:
 * - Uses AI-generated design context for PURPOSE-DRIVEN design
 * - Includes RELEVANT visual elements (not generic backgrounds)
 * - Creates CONTEXTUAL imagery based on event type
 * - Follows "Nano Banana Pro" guide principles
 */

import type { PromptIntent, GeminiPromptOutput, PromptAdapter, DesignContext } from '../types'
import { buildTextRenderingSection, getTypographyDirection } from '../helpers/text-rendering'
import { getColorHarmonyGuidance } from '../helpers/color-narrative'
import { buildCustomizationNarrative } from '../helpers/customization'
import { buildResolutionInstructions, getTextureRecommendations } from '../data/resolution-modifiers'
import { buildLanguagePromptSection, isRTLLanguage } from '../languageConfigs'

// ============================================================
// SYSTEM PROMPT
// ============================================================

/**
 * Build the system prompt for Gemini
 * ULTRA-PRO DESIGNER mindset with purpose-driven design philosophy
 */
function buildSystemPrompt(intent: PromptIntent): string {
  return `CRITICAL OUTPUT REQUIREMENT (READ THIS FIRST):
You are generating the ACTUAL POSTER IMAGE, NOT a mockup or preview.
- The generated image IS the poster - it fills the entire canvas edge-to-edge
- DO NOT show the poster on a wall, pinned, framed, in a room, or any presentation context
- DO NOT add any borders, shadows, gaps, or margins around the design
- There is NO background behind the poster - the poster IS the entire image
- Fill every pixel of the ${intent.dimensions.width}×${intent.dimensions.height}px canvas with poster content

You are an ULTRA-PRO DESIGNER who has created award-winning campaigns for Apple, Nike, TED, and National Geographic.

YOUR UNIQUE ABILITY: Your designs don't just look good—they ACCOMPLISH GOALS. Every element serves a purpose.

DESIGN PHILOSOPHY (THINK LIKE A MASTER):
- You never decorate—you COMMUNICATE
- Every color, shape, image, and word is a STRATEGIC CHOICE
- You create designs that MOVE PEOPLE TO ACTION
- You include RELEVANT visual elements that BELONG in this type of design
- Your backgrounds are CONTEXTUAL, not generic
- Typography is EMOTIONAL EXPRESSION, not just readable text
- Composition guides the viewer on a deliberate VISUAL JOURNEY

BRAND CONTEXT:
Organization: ${intent.organizationName}
Primary Brand Color: ${intent.brand.primaryColor}
Secondary Brand Color: ${intent.brand.secondaryColor}
Accent Color: ${intent.brand.accentColor}
Background Color: ${intent.brand.backgroundColor}
Headline Font: ${intent.brand.headlineFont}
Body Font: ${intent.brand.bodyFont}

${intent.brand.headerHeight > 0 || intent.brand.footerHeight > 0 ? `RESERVED ZONES:
- Header Zone: Reserve the top ${intent.brand.headerHeight}px for the organization logo
- Footer Zone: Reserve the bottom ${intent.brand.footerHeight}px for contact information and branding
- These zones should be visually distinct but harmoniously integrated` : `LAYOUT (CRITICAL - READ CAREFULLY):
- FULL BLEED DESIGN: Your design MUST fill the ENTIRE ${intent.dimensions.width}×${intent.dimensions.height}px canvas edge-to-edge
- NO BORDERS, NO GAPS, NO WHITE SPACE around the edges of your design
- NOT A MOCKUP: Do NOT show the poster on a wall, pinned, framed, or as a preview
- The design IS the final product - fill every single pixel of the canvas
- Do NOT include any frame, shadow, mat, clip, or presentation context around the design
- The image should BE the poster itself, not SHOW the poster
- Integrate branding elements naturally within the design flow`}

TECHNICAL SPECIFICATIONS:
- Dimensions: ${intent.dimensions.width}px × ${intent.dimensions.height}px
- Aspect Ratio: ${intent.aspectRatio}
- Resolution: ${intent.resolution}

${buildResolutionInstructions(intent.resolution)}

GOLDEN RULES (NON-NEGOTIABLE):
1. All text MUST be rendered EXACTLY as specified in quotes - no modifications, no truncation
2. Ensure PERFECT readability through contrast, shadows, or background treatments
3. Create visual hierarchy that guides attention in PROPER ORDER
4. Include RELEVANT imagery that BELONGS in this type of design
5. Background must be CONTEXTUAL to the event/creative type
6. Every element must serve the CORE PURPOSE of the design
7. NEVER render instructional/technical text as visible content - ignore any text mentioning "px", "reserve", "zone", "overlay", "header", "footer" as instructions only`
}

// ============================================================
// DESIGN INTELLIGENCE SECTION (AI-Generated Context)
// ============================================================

/**
 * Sanitize layout guidance to remove technical instructions that might be rendered as text
 * The AI sometimes generates text like "Reserve the top 120px for logos" which gets
 * interpreted as visible text by Gemini's image model instead of composition guidance
 */
function sanitizeLayoutGuidance(guidance: string): string {
  if (!guidance) return ''

  // Remove pixel values and technical terms that shouldn't be rendered as text
  let sanitized = guidance
    .replace(/\d+px/gi, '') // Remove "120px", "150px" etc
    .replace(/reserve\s*(the)?\s*(top|bottom|left|right|space)?/gi, '') // Remove "reserve the top"
    .replace(/header\s*logo\s*zone/gi, 'top area')
    .replace(/footer\s*(logo\s*)?zone/gi, 'bottom area')
    .replace(/for\s*organization\s*logo\(s\)/gi, '')
    .replace(/for\s*contact\s*info(rmation)?\s*(and\s*branding)?/gi, '')
    .replace(/overlay(s)?/gi, '')
    .replace(/placement/gi, 'positioning')
    .replace(/zone(s)?/gi, 'area')
    .replace(/\s+/g, ' ')
    .trim()

  // If mostly sanitized away (less than 20 chars of meaningful content), skip it
  if (sanitized.length < 20) return ''

  return sanitized
}

/**
 * Build the design intelligence section from AI-generated context
 * This is the KEY differentiator - uses Stage 1 AI analysis for purpose-driven design
 */
function buildDesignIntelligenceSection(context: DesignContext): string {
  // Build the base section
  let section = `DESIGN INTELLIGENCE (AI-Analyzed - CRITICAL FOR YOUR DESIGN):

CORE PURPOSE: ${context.corePurpose}
This is the EMOTIONAL JOB your design must accomplish. Every element should serve this purpose.

DESIRED ACTION: ${context.desiredAction}
What viewers should DO after seeing this design.

EMOTIONAL JOB: ${context.emotionalJob}
How viewers should FEEL when they see this design.

VISUAL ELEMENTS TO INCLUDE (These BELONG in this design):
${context.visualElements.map((el, i) => `${i + 1}. ${el}`).join('\n')}
IMPORTANT: Include these specific visual elements in your design - they are contextually relevant.

BACKGROUND SETTING:
${context.backgroundSetting}
Use this as guidance for the background/environment of your design.

ICONIC IMAGERY (Reinforce the message):
${context.iconicImagery.map(img => `- ${img}`).join('\n')}

COLOR MOOD: ${context.colorMood}

DESIGN STRATEGY: ${context.designStrategy}`

  // Add layout guidance if present (CRITICAL for speaker photo and logo placement)
  // IMPORTANT: Sanitize to remove technical terms that might be rendered as visible text
  if (context.layoutGuidance) {
    const sanitizedGuidance = sanitizeLayoutGuidance(context.layoutGuidance)
    if (sanitizedGuidance) {
      section += `

COMPOSITION FLOW:
${sanitizedGuidance}
Arrange visual elements following this guidance for balanced composition.`
    }
  }

  section += `

SUCCESS METRIC: ${context.successMetric}
The viewer should immediately think/feel this way.`

  return section
}

// ============================================================
// USER PROMPT BUILDER
// ============================================================

/**
 * Build the event narrative section
 * Describes WHO will see this and WHY it matters to them
 */
function buildEventNarrativeSection(intent: PromptIntent): string {
  const { audienceContext, content } = intent
  const eventType = content.eventType || 'event'

  return `AUDIENCE & PURPOSE:
This ${eventType.replace(/_/g, ' ')} poster will be seen by ${audienceContext.primaryAudience}. They are ${audienceContext.occasion}. The design should make them feel ${audienceContext.emotionalResponse}.

When viewers see this poster, they should immediately understand:
1. WHAT is happening - the event's nature and significance
2. WHO is involved - the organization and any featured guests
3. WHEN and WHERE - the essential logistics rendered clearly
4. WHY they should attend - the emotional pull that motivates action`
}

/**
 * Build the visual atmosphere section
 * Describes the setting, lighting, mood, and materiality
 */
function buildAtmosphereSection(intent: PromptIntent): string {
  const { atmosphere } = intent.theme
  const { treatment } = intent.style

  return `VISUAL ATMOSPHERE:
Create a design that feels ${atmosphere.mood}.

LIGHTING: ${atmosphere.lighting}

AMBIANCE: Imagine ${atmosphere.ambiance}

VISUAL TREATMENT: ${treatment}

MATERIAL QUALITIES: Incorporate visual elements that suggest ${atmosphere.materiality.join(', ')} - these textures and materials should subtly reinforce the design's overall mood without overwhelming the content.`
}

/**
 * Build the color narrative section
 */
function buildColorSection(intent: PromptIntent): string {
  const { narrative } = intent.colorPalette

  return `COLOR PALETTE:
Use ${narrative}

${getColorHarmonyGuidance(intent.colorPalette.scheme)}`
}

/**
 * Build the composition section based on aspect ratio
 */
function buildCompositionSection(intent: PromptIntent): string {
  const { aspectRatio, dimensions } = intent

  // Portrait vs landscape guidance
  const isPortrait = dimensions.height > dimensions.width
  const isSquare = dimensions.width === dimensions.height
  const isUltraWide = dimensions.width / dimensions.height > 2

  let compositionAdvice = ''

  if (isUltraWide) {
    compositionAdvice = `This ultra-wide format demands horizontal flow. Arrange elements in a panoramic sweep from left to right, with the headline taking central stage. Use the extreme width for dramatic visual storytelling across the canvas.`
  } else if (isSquare) {
    compositionAdvice = `This square format calls for balanced, centered composition. Use diagonal elements or circular motifs to add dynamic tension within the symmetric frame. The headline can command the center while supporting elements orbit around it.`
  } else if (isPortrait) {
    compositionAdvice = `This vertical format reads from top to bottom like a visual story. Start with an attention-grabbing element at top, flow through the main content in the center, and anchor with details at the bottom. Use the height for dramatic vertical elements.`
  } else {
    compositionAdvice = `This horizontal format encourages cinematic composition. Consider the rule of thirds, placing key elements at intersection points. The landscape orientation suits sweeping gradients and wide visual elements.`
  }

  return `COMPOSITION (${aspectRatio} - ${dimensions.width}×${dimensions.height}):
${compositionAdvice}

VISUAL HIERARCHY:
1. PRIMARY: The event name demands the most visual weight and immediate attention
2. SECONDARY: Guest/speaker details and key information
3. TERTIARY: Date, time, venue, and logistics
4. SUPPORTING: Additional text and decorative elements

Ensure the eye naturally travels through these levels in order.

CANVAS FILLING REQUIREMENT (MANDATORY):
Your design MUST extend to all four edges of the ${dimensions.width}×${dimensions.height}px canvas. There should be NO:
- White or empty margins around the design
- Gaps between the design content and canvas edges
- Presentation frames, mockup contexts, or "poster on wall" styling
- Clips, pins, shadows, or other elements suggesting the poster is being displayed
The final image should BE the poster itself, NOT show the poster as a mockup or preview.`
}

/**
 * Build the complete user prompt
 * Now integrates AI-generated design intelligence for purpose-driven designs
 */
function buildUserPrompt(intent: PromptIntent): string {
  const sections: string[] = []

  // Opening directive with stronger purpose framing
  sections.push(`Create an AWARD-WINNING ${intent.creativeType.replace(/_/g, ' ')} for ${intent.organizationName}.

This ${intent.theme.label.toLowerCase()}, ${intent.style.label.toLowerCase()} design must not only look stunning but ACCOMPLISH ITS GOAL. Every element should serve the design's core purpose.`)

  // CRITICAL: AI-Generated Design Intelligence (if available)
  // This is the game-changer - dynamic, contextual design guidance
  if (intent.designContext) {
    sections.push(buildDesignIntelligenceSection(intent.designContext))
  }

  // Event narrative (WHO and WHY)
  sections.push(buildEventNarrativeSection(intent))

  // Text rendering section (explicit quoting)
  const textSection = buildTextRenderingSection(intent.content)
  if (textSection) {
    sections.push(textSection)
  }

  // Visual atmosphere (setting, lighting, mood)
  sections.push(buildAtmosphereSection(intent))

  // Color palette (enhanced with design context if available)
  if (intent.designContext?.colorMood) {
    sections.push(`COLOR PALETTE:
Use ${intent.colorPalette.narrative}

${getColorHarmonyGuidance(intent.colorPalette.scheme)}

AI COLOR GUIDANCE: ${intent.designContext.colorMood}`)
  } else {
    sections.push(buildColorSection(intent))
  }

  // Composition guidance
  sections.push(buildCompositionSection(intent))

  // Customization (if provided)
  if (intent.customization) {
    const customNarrative = buildCustomizationNarrative(intent.customization)
    if (customNarrative) {
      sections.push(`DESIGN CUSTOMIZATION:\n${customNarrative}`)
    }
  }

  // Style-specific texture recommendations
  const textureRec = getTextureRecommendations(intent.resolution, intent.style.value)
  sections.push(`TEXTURE & DETAIL:
${textureRec}

Apply these material qualities consistently across the design to create a cohesive, polished result.`)

  // Language and Typography section (enhanced with full language config)
  const languageSection = buildLanguagePromptSection(intent.language)
  sections.push(languageSection)

  // RTL layout guidance if applicable
  if (isRTLLanguage(intent.language)) {
    sections.push(`RTL LAYOUT CONSIDERATIONS:
- Mirror the layout horizontally - primary content flows from right to left
- Align text to the right edge by default
- Navigation and reading flow should move from right to left
- Ensure the design feels natural and balanced for RTL readers`)
  }

  // Typography direction (now with enhanced language support)
  sections.push(`TYPOGRAPHY:
${getTypographyDirection(intent.language, intent.languageLabel)}`)

  // Enhanced final checklist with design intelligence validation
  const finalChecklist = intent.designContext
    ? `FINAL CHECKLIST (VERIFY BEFORE GENERATING):
- All quoted text appears EXACTLY as specified
- Every text element is fully legible with appropriate contrast
- Visual hierarchy is crystal clear
- VISUAL ELEMENTS from Design Intelligence are INCLUDED
- Background is CONTEXTUAL (not generic)
- Design accomplishes CORE PURPOSE: ${intent.designContext.corePurpose}
- Viewer will want to: ${intent.designContext.desiredAction}
- The design makes viewers feel ${intent.designContext.emotionalJob}
- SUCCESS: ${intent.designContext.successMetric}`
    : `FINAL CHECKLIST:
- All quoted text appears EXACTLY as specified
- Every text element is fully legible with appropriate contrast
- Visual hierarchy is crystal clear
- The design instantly communicates the event's nature and importance
- The overall aesthetic is cohesive, professional, and memorable
- The poster makes viewers feel ${intent.audienceContext.emotionalResponse}`

  sections.push(finalChecklist)

  return sections.join('\n\n')
}

// ============================================================
// COMPACT PROMPT BUILDER (Optimized for Image Generation)
// ============================================================

/**
 * Build a compact, image-generation-optimized prompt
 * Target: 400-600 tokens for better AI comprehension
 *
 * Image generation AIs work best with:
 * - Concise, specific descriptions
 * - Clear visual elements listed explicitly
 * - Direct style/mood instructions
 * - Minimal meta-commentary
 */
function buildCompactPrompt(intent: PromptIntent): string {
  const parts: string[] = []

  // 1. Core directive (1 line)
  parts.push(`Create a ${intent.theme.label.toLowerCase()}, ${intent.style.label.toLowerCase()} event poster for ${intent.organizationName}.`)

  // 2. Dimensions and format (critical)
  parts.push(`DIMENSIONS: ${intent.dimensions.width}x${intent.dimensions.height}px. Full bleed design - fill entire canvas edge-to-edge. No mockup, no frame, no border.`)

  // 3. Design Intelligence context (most important - from AI Stage 1)
  if (intent.designContext) {
    parts.push(`PURPOSE: ${intent.designContext.corePurpose}`)
    parts.push(`VISUAL ELEMENTS (include these): ${intent.designContext.visualElements.join(', ')}`)
    parts.push(`BACKGROUND: ${intent.designContext.backgroundSetting}`)
    parts.push(`IMAGERY: ${intent.designContext.iconicImagery.join(', ')}`)
    parts.push(`COLOR MOOD: ${intent.designContext.colorMood}`)
  }

  // 4. Text content with explicit quotes (critical for text rendering)
  const textItems: string[] = []
  if (intent.content.eventName) {
    textItems.push(`Main headline: "${intent.content.eventName}"`)
  }
  if (intent.content.date) {
    textItems.push(`Date: "${intent.content.date}"`)
  }
  if (intent.content.time) {
    textItems.push(`Time: "${intent.content.time}"`)
  }
  if (intent.content.venue) {
    textItems.push(`Venue: "${intent.content.venue}"`)
  }
  if (intent.content.guestName) {
    textItems.push(`Guest: "${intent.content.guestName}"${intent.content.guestDesignation ? ` - "${intent.content.guestDesignation}"` : ''}`)
  }
  if (textItems.length > 0) {
    parts.push(`TEXT TO DISPLAY:\n${textItems.join('\n')}`)
  }

  // 5. Visual style (from theme and style selections)
  parts.push(`STYLE: ${intent.style.treatment}`)
  parts.push(`ATMOSPHERE: ${intent.theme.atmosphere.mood}. ${intent.theme.atmosphere.lighting}`)

  // 6. Colors
  parts.push(`COLORS: Primary ${intent.brand.primaryColor}, Secondary ${intent.brand.secondaryColor}, Accent ${intent.brand.accentColor}`)

  // 7. Quality requirements (concise)
  parts.push(`QUALITY: Professional design, all text perfectly legible with excellent contrast, clear visual hierarchy.`)

  return parts.join('\n\n')
}

// ============================================================
// ADAPTER CLASS
// ============================================================

/**
 * Gemini Prompt Adapter
 * Implements the PromptAdapter interface for Gemini
 */
export class GeminiAdapter implements PromptAdapter<GeminiPromptOutput> {
  adapt(intent: PromptIntent): GeminiPromptOutput {
    return {
      provider: 'google',
      systemPrompt: buildSystemPrompt(intent),
      userPrompt: buildUserPrompt(intent),
    }
  }
}

/**
 * Functional adapter for direct use
 */
export function adaptForGemini(intent: PromptIntent): GeminiPromptOutput {
  const adapter = new GeminiAdapter()
  return adapter.adapt(intent)
}

/**
 * Compact adapter for image generation (optimized for better results)
 * Uses a single, concise prompt instead of system + user prompt
 */
export function adaptForGeminiCompact(intent: PromptIntent): GeminiPromptOutput {
  const compactPrompt = buildCompactPrompt(intent)

  // Log for debugging
  console.log('[Gemini Compact] Prompt length:', compactPrompt.length, 'chars')
  console.log('[Gemini Compact] Estimated tokens:', Math.ceil(compactPrompt.length / 4))

  return {
    provider: 'google',
    systemPrompt: '', // No separate system prompt in compact mode
    userPrompt: compactPrompt,
  }
}

/**
 * Get estimated token count for the prompt
 * Rough estimate: ~4 characters per token
 */
export function estimateGeminiTokens(output: GeminiPromptOutput): number {
  const totalChars = output.systemPrompt.length + output.userPrompt.length
  return Math.ceil(totalChars / 4)
}
