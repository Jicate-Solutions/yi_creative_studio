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
  return `Design a seamless, edge-to-edge composition that fills the entire canvas with no margins or empty borders.

The background, patterns, and visual elements should extend fully to all four edges of the image. Avoid any gray, neutral, or empty space around the perimeter. If the design needs breathing room or neutral areas, use the brand background color (${intent.brand.backgroundColor}) rather than gray tones.

Create a cohesive design where every part of the canvas contains intentional visual content - whether that's the main imagery, background textures, gradients, or brand colors flowing to the edges.

Generate the actual design itself, not a mockup or preview of it. The image should be the finished artwork directly - not a poster shown on a wall, pinned to a board, framed, or displayed in any room setting. There should be no presentation context, shadows, or frames around the design.

Approach this as a world-class designer creating award-winning work. Every element in the design should serve a clear purpose - communicating the message, guiding attention, and inspiring action.

Include visual elements that are contextually relevant to this specific type of creative. The background should feel intentional and connected to the theme, not generic. Typography should convey emotion and hierarchy, guiding the viewer through the content in a deliberate visual journey.

Brand identity for ${intent.organizationName}:
Colors: Primary ${intent.brand.primaryColor}, Secondary ${intent.brand.secondaryColor}, Accent ${intent.brand.accentColor}, Background ${intent.brand.backgroundColor}
Typography: Headlines in ${intent.brand.headlineFont}, body text in ${intent.brand.bodyFont}

${intent.brand.headerHeight > 0 || intent.brand.footerHeight > 0 ? `Leave clean space at the top and bottom edges for branding elements that will be added later. These areas should have simple backgrounds that harmonize with the overall design.` : `Integrate any branding elements naturally within the design flow. The complete design should fill the entire image area without any border, frame, or presentation context.`}

${intent.logoAwareness?.hasLogos ? `Organization branding will be added after generation. Design with clean, simple backgrounds in the corners and edges where logos might appear. Place the main content and headlines in the central areas, using subtle gradients or solid colors in peripheral spaces.` : ''}

Format: ${intent.aspectRatio} aspect ratio at ${intent.resolution} resolution.

${buildResolutionInstructions(intent.resolution)}

Key design principles:
Render all text content exactly as quoted, with no modifications or truncation. Ensure excellent readability through proper contrast and background treatments. Create clear visual hierarchy that guides the viewer's attention through the content in the intended order. Include imagery that feels natural and contextually appropriate for this type of design.`
}

// ============================================================
// DESIGN INTELLIGENCE SECTION (AI-Generated Context)
// ============================================================

/**
 * Sanitize layout guidance to remove technical instructions that might be rendered as text
 * The AI sometimes interprets instruction text as content to render in the image.
 *
 * CRITICAL: This function must remove ALL technical/instruction-like text including:
 * - Pixel values (120px, etc.)
 * - Technical keywords (ZONE, CRITICAL, LAYOUT RULES, etc.)
 * - Instructional phrases (Keep the top, Reserve space, etc.)
 */
function sanitizeLayoutGuidance(guidance: string): string {
  if (!guidance) return ''

  // Remove pixel values and technical terms that shouldn't be rendered as text
  let sanitized = guidance
    // Remove ALL pixel measurements
    .replace(/~?\d+\s*px/gi, '')
    // Remove technical keywords that look like instructions
    .replace(/\b(CRITICAL|ZONE|RULES|LAYOUT|PLACEMENT|RESERVE|HEADER|FOOTER|OVERLAY|AWARENESS)\b/gi, '')
    .replace(/TOP ZONE:|BOTTOM ZONE:|CENTER ZONE:|SIDE ZONE:/gi, '')
    .replace(/LOGO PLACEMENT AWARENESS:/gi, '')
    .replace(/CRITICAL LAYOUT RULES.*?:/gi, '')
    // Remove instructional phrases
    .replace(/reserve\s*(the)?\s*(top|bottom|left|right|space)?/gi, '')
    .replace(/keep\s*(the)?\s*(top|bottom|left|right|areas?)?\s*(clear)?/gi, '')
    .replace(/for\s*(header\s*)?logo(s)?/gi, '')
    .replace(/for\s*organization\s*logo\(s\)/gi, '')
    .replace(/for\s*contact\s*info(rmation)?\s*(and\s*branding)?/gi, '')
    .replace(/will\s*be\s*(digitally\s*)?(overlaid|placed)/gi, '')
    // Clean up residual formatting
    .replace(/side\(s\)/gi, 'side')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^\s*[,.:]+\s*/g, '') // Remove leading punctuation
    .replace(/\s*[,.:]+\s*$/g, '') // Remove trailing punctuation
    .trim()

  // If mostly sanitized away (less than 15 chars of meaningful content), skip it
  if (sanitized.length < 15) return ''

  return sanitized
}

/**
 * Build the design intelligence section from AI-generated context
 * This is the KEY differentiator - uses Stage 1 AI analysis for purpose-driven design
 */
function buildDesignIntelligenceSection(context: DesignContext): string {
  // Build the base section with natural language
  let section = `Design goal: ${context.corePurpose ?? 'create impactful design'}

The design should inspire viewers to ${context.desiredAction ?? 'engage'} and make them feel ${context.emotionalJob ?? 'inspired'}.

Visual elements to include: ${context.visualElements?.join(', ') ?? 'relevant visual elements'}

Background and setting: ${context.backgroundSetting ?? 'professional setting'}

Supporting imagery: ${context.iconicImagery?.join(', ') ?? 'supporting visuals'}

Color atmosphere: ${context.colorMood ?? 'professional and engaging'}

Design approach: ${context.designStrategy}`

  // Add layout guidance if present
  if (context.layoutGuidance) {
    const sanitizedGuidance = sanitizeLayoutGuidance(context.layoutGuidance)
    if (sanitizedGuidance) {
      section += `

Composition guidance: ${sanitizedGuidance}`
    }
  }

  section += `

Success looks like: ${context.successMetric ?? 'achieving the design goal'}`

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

  return `This ${eventType.replace(/_/g, ' ')} design will be seen by ${audienceContext.primaryAudience} who are ${audienceContext.occasion}. The design should make them feel ${audienceContext.emotionalResponse}.

Viewers should immediately grasp the nature of the event, who is involved, when and where it takes place, and feel compelled to participate.`
}

/**
 * Build the visual atmosphere section
 * Describes the setting, lighting, mood, and materiality
 */
function buildAtmosphereSection(intent: PromptIntent): string {
  const { atmosphere } = intent.theme
  const { treatment } = intent.style

  return `Create a design that feels ${atmosphere.mood} with ${atmosphere.lighting}. The ambiance should evoke ${atmosphere.ambiance}.

Apply a ${treatment} visual style. Incorporate subtle textures suggesting ${atmosphere.materiality.join(', ')} to reinforce the mood without overwhelming the content.`
}

/**
 * Build the color narrative section
 */
function buildColorSection(intent: PromptIntent): string {
  const { narrative } = intent.colorPalette

  return `Use ${narrative}. ${getColorHarmonyGuidance(intent.colorPalette.scheme)}`
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

  return `${compositionAdvice}

Create clear visual hierarchy: the event name should have the most visual weight and draw immediate attention, followed by guest or speaker details, then date, time, and venue information, with supporting elements in the background.

The design should extend seamlessly to all four edges with no empty margins, borders, or gray space around the perimeter. Use brand colors or design patterns to fill any edge areas rather than leaving neutral space.`
}

/**
 * Build the complete user prompt
 * Now integrates AI-generated design intelligence for purpose-driven designs
 */
function buildUserPrompt(intent: PromptIntent): string {
  const sections: string[] = []

  // Opening directive with purpose framing
  sections.push(`Create a stunning ${intent.creativeType.replace(/_/g, ' ')} for ${intent.organizationName}.

This ${intent.theme.label.toLowerCase()}, ${intent.style.label.toLowerCase()} design should be visually striking while serving its core purpose. Every element should contribute to the overall message.`)

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
    sections.push(`Use ${intent.colorPalette.narrative}. ${getColorHarmonyGuidance(intent.colorPalette.scheme)} The colors should feel ${intent.designContext.colorMood}.`)
  } else {
    sections.push(buildColorSection(intent))
  }

  // Composition guidance
  sections.push(buildCompositionSection(intent))

  // Customization (if provided)
  if (intent.customization) {
    const customNarrative = buildCustomizationNarrative(intent.customization)
    if (customNarrative) {
      sections.push(customNarrative)
    }
  }

  // Style-specific texture recommendations
  const textureRec = getTextureRecommendations(intent.resolution, intent.style.value)
  sections.push(`${textureRec} Apply these material qualities consistently for a cohesive, polished result.`)

  // Language and Typography section (enhanced with full language config)
  const languageSection = buildLanguagePromptSection(intent.language)
  sections.push(languageSection)

  // RTL layout guidance if applicable
  if (isRTLLanguage(intent.language)) {
    sections.push(`For this right-to-left language, mirror the layout so content flows naturally from right to left. Align text to the right edge by default and ensure the design feels balanced for readers of this script.`)
  }

  // Typography direction
  sections.push(getTypographyDirection(intent.language, intent.languageLabel))

  // Edge coverage guidance
  sections.push(`Ensure the design fills the entire image with no gray or neutral borders around the edges. If neutral space is needed, use the brand background color (${intent.brand.backgroundColor}) or gradients rather than gray tones.`)

  // SPEAKER PHOTO PROTECTION (v6.3: Enhanced with placeholder ban)
  if (intent.speakerContext?.hasSpeakerPhoto) {
    sections.push(`SPEAKER PHOTO INTEGRATION: A real photo will be composited onto this design by post-processing.
    CRITICALLY IMPORTANT - DO NOT GENERATE:
    1. Any illustration of people, faces, characters, or human figures
    2. Circular frames, oval shapes, or highlighted areas
    3. White circles, highlighted zones, or "photo spot" indicators
    4. Any visual element that suggests "a photo belongs here"

    INSTEAD:
    1. Keep the background clean, minimal, and seamless
    2. Use soft gradients, solid brand colors, or subtle abstract patterns
    3. Ensure the design flows naturally without interruption
    4. The photo overlay will be handled separately - create an uninterrupted background`)
  }

  // Final quality notes
  const qualityNotes = intent.designContext
    ? `Render all text exactly as quoted with excellent contrast and legibility. Include the visual elements mentioned and ensure the background feels contextual. The design should accomplish its purpose of ${intent.designContext.corePurpose} and inspire viewers to ${intent.designContext.desiredAction}.`
    : `Render all text exactly as quoted with excellent contrast and legibility. The design should instantly communicate the event's nature and importance while making viewers feel ${intent.audienceContext.emotionalResponse}.`

  sections.push(qualityNotes)

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
/**
 * Build a MAXIMALIST, CINEMA-QUALITY prompt (The "Nano Banana" Strategy)
 *
 * Modern models (Imagen 3, Flux) crave DETAIL and STRUCTURE.
 * We no longer compact/shrink prompts. We expand them.
 *
 * Structure:
 * 1. HEADLINE (The Hook): "A cinematic, award-winning..."
 * 2. SUBJECT (The Core): Rich description of the main visual.
 * 3. CONTEXT (The Vibe): Lighting, atmosphere, mood.
 * 4. STYLE (The Look): Medium, art style, influences.
 * 5. TECHNICAL (The Specs): Renderer, resolution, quality tokens.
 */
function buildCompactPrompt(intent: PromptIntent): string {
  // STRATEGY 1: RAW INJECTION (Best Quality)
  // If the Ultra-Pro agent gave us a handcrafted prompt, USE IT.
  if (intent.ultraProContext?.enhancedPrompt) {
    const rawPrompt = intent.ultraProContext.enhancedPrompt

    // v6.4: CRITICAL FIX - Color enforcement for BACKGROUND/DESIGN, not text
    // These colors should dominate the visual design, not be applied to typography
    const { colors } = intent.colorPalette
    const colorEnforcement = `

MANDATORY BACKGROUND & DESIGN COLORS (CRITICAL - NOT FOR TEXT):
These colors define the VISUAL DESIGN (backgrounds, gradients, shapes) - NOT text colors:

🎨 DOMINANT BACKGROUND: ${colors.primary}
   - This MUST be the MAIN COLOR of the entire design
   - Use in: background gradients, geometric shapes, accent blocks, decorative elements
   - The poster should be DOMINATED by this color when viewed

🎨 SECONDARY DESIGN: ${colors.secondary}
   - Use for secondary visual elements, overlays, and design accents

🎨 ACCENT/HIGHLIGHT: ${colors.accent}
   - Use for small pops of color and emphasis elements

⚠️ CRITICAL RULES:
- TEXT should be WHITE for maximum contrast against these background colors
- DO NOT apply these colors to text/typography
- DO NOT use brown, amber, tan, beige, or warm earth tones as background
- DO NOT ignore these colors and use AI default palettes
- The user's ${colors.primary} MUST be the dominant visible color of the design`

    // v6.3: CRITICAL FIX - Speaker photo area protection
    // v6.5: ENHANCED - Position-specific zone restrictions
    // Prevent AI from generating circular frames or shapes
    let speakerBan = ''
    if (intent.speakerContext?.hasSpeakerPhoto) {
      const position = intent.speakerContext.speakerPhotoPosition || 'left'
      const shape = intent.speakerContext.speakerPhotoShape || 'circle'

      // Position-specific zone definitions
      const zoneRestrictions: Record<string, string> = {
        'left': `
RESTRICTED ZONE: LEFT 35-40% of the design canvas
- The LEFT portion of the image (from left edge to approximately 40% width) MUST be a clean, seamless background
- NO illustrated faces, people, silhouettes, or human figures in this zone
- NO circular frames, white circles, oval shapes, or any markers
- The background should use the primary design color with subtle gradients or patterns only
- All text content (headline, details) should flow to the RIGHT 55-60% of the design`,

        'right': `
RESTRICTED ZONE: RIGHT 35-40% of the design canvas
- The RIGHT portion of the image (from 60% width to right edge) MUST be a clean, seamless background
- NO illustrated faces, people, silhouettes, or human figures in this zone
- NO circular frames, white circles, oval shapes, or any markers
- The background should use the primary design color with subtle gradients or patterns only
- All text content (headline, details) should flow to the LEFT 55-60% of the design`,

        'center': `
RESTRICTED ZONE: CENTER 30% of the design canvas (vertically centered)
- The CENTER zone (from 35% to 65% of height) MUST be a clean, seamless background
- NO illustrated faces, people, silhouettes, or human figures in this zone
- NO circular frames, white circles, oval shapes, or any markers
- Content should flow ABOVE and BELOW the center zone
- Headline at TOP (upper 30%), Details at BOTTOM (lower 30%)`,

        'bottom-left': `
RESTRICTED ZONE: BOTTOM-LEFT quadrant of the design canvas
- The BOTTOM-LEFT corner (left 40%, bottom 40%) MUST be a clean, seamless background
- NO illustrated faces, people, silhouettes, or human figures in this zone
- NO circular frames, white circles, oval shapes, or any markers
- All text content should flow to the TOP and RIGHT portions of the design`,

        'bottom-right': `
RESTRICTED ZONE: BOTTOM-RIGHT quadrant of the design canvas
- The BOTTOM-RIGHT corner (right 40%, bottom 40%) MUST be a clean, seamless background
- NO illustrated faces, people, silhouettes, or human figures in this zone
- NO circular frames, white circles, oval shapes, or any markers
- All text content should flow to the TOP and LEFT portions of the design`,
      }

      const zoneInstruction = zoneRestrictions[position] || zoneRestrictions['left']

      speakerBan = `

BACKGROUND AREA REQUIREMENTS:
A clean background area is required in the ${position.toUpperCase()} position.

${zoneInstruction}

CRITICAL REQUIREMENTS FOR THIS AREA:
- DO NOT create: circular frames, white circles, oval shapes, or any shapes
- DO NOT generate: illustrated faces, people silhouettes, human figures, character drawings
- DO NOT add: any text labels, markers, or frame outlines
- The background in this area must be SEAMLESS and CONTINUOUS with the rest of the design
- Keep this area SIMPLE and CLEAR - just clean background, nothing else`
    }

    const techSpecs = `High resolution, 8k, sharp focus, cinematic lighting, award-winning composition, edge-to-edge design.`
    return `${rawPrompt}${colorEnforcement}${speakerBan}\n\n${techSpecs}`
  }

  // STRATEGY 2: STRUCTURED BUILDER (The "Banana" Protocol)
  const parts: string[] = []

  // 1. HEADLINE
  const designType = intent.creativeType.replace(/_/g, ' ')
  parts.push(`A stunning, award-winning ${designType} design for "${intent.organizationName}".`)

  // 2. SUBJECT & STORY
  // 2. SUBJECT & STORY
  // Use the rich Design Intelligence context if available
  if (intent.designContext) {
    // v6.2: SPEAKER PHOTO OVERRIDE
    // If a speaker photo is present, we must FORCE the AI to create a background, not a scene.
    if (intent.speakerContext?.hasSpeakerPhoto) {
      parts.push(`SUBJECT: A premium, abstract background design for "${intent.content.eventName}". (A real speaker photo will be overlaid separately).`)

      // Filter out people-related elements that might trigger hallucinations
      if (intent.designContext.visualElements?.length) {
        const safeElements = intent.designContext.visualElements.filter(el =>
          !/person|people|face|man|woman|speaker|crowd|audience|human|character/i.test(el)
        )
        if (safeElements.length) {
          parts.push(`VISUAL ELEMENTS: ${safeElements.join(', ')}`)
        }
      }
    } else {
      // Standard behavior for non-speaker designs
      parts.push(`SUBJECT: ${intent.designContext.corePurpose || intent.content.eventName}`)
      if (intent.designContext.visualElements?.length) {
        parts.push(`VISUAL ELEMENTS: ${intent.designContext.visualElements.join(', ')}`)
      }
    }

    // Include the sanitized layout guidance as "Compostion"
    if (intent.designContext.layoutGuidance) {
      const layout = sanitizeLayoutGuidance(intent.designContext.layoutGuidance)
      if (layout) parts.push(`COMPOSITION: ${layout}`)
    }
  } else {
    // Fallback for basic briefs
    parts.push(`SUBJECT: ${intent.content.eventName || 'Event Poster'}`)
    parts.push(`COMPOSITION: Full canvas edge-to-edge design. No margins.`)
  }

  // 3. TEXT TO RENDER (Crucial for adherence)
  const textItems: string[] = []
  if (intent.content.eventName) textItems.push(`- Headline: "${intent.content.eventName}"`)
  if (intent.content.date) textItems.push(`- Date: "${intent.content.date}"`)
  if (intent.content.time) textItems.push(`- Time: "${intent.content.time}"`)
  if (intent.content.venue) textItems.push(`- Venue: "${intent.content.venue}"`)
  if (intent.content.additionalText) textItems.push(`- Details: "${intent.content.additionalText}"`)

  // Custom fields support (v6.0)
  // We don't have direct access to customFields here unless they are mapped to content
  // Assuming they might be in intent.content or handled upstream. 
  // For now, relies on what's passed in intent.content.

  if (textItems.length > 0) {
    parts.push(`TEXT CONTENT (Must be legible and exactly as quoted):\n${textItems.join('\n')}`)
  }

  // 4. ATMOSPHERE & LIGHTING
  const atmosphere = intent.theme.atmosphere
  parts.push(`ATMOSPHERE: ${atmosphere.mood}. ${atmosphere.lighting}.`)
  parts.push(`AMBIANCE: ${atmosphere.ambiance}.`)

  // 5. STYLE & MEDIUM
  parts.push(`STYLE: ${intent.style.treatment} (${intent.style.label})`)
  if (intent.style.value === '3d_render') {
    parts.push(`MEDIUM: 3D Render, Octane Render, Ray Tracing, Unreal Engine 5 style.`)
  } else if (intent.style.value === 'digital_art') {
    parts.push(`MEDIUM: Digital Art, Vector Illustration, Clean Lines, Vibrant Colors.`)
  } else if (intent.style.value === 'photographic') {
    parts.push(`MEDIUM: Professional Photography, 85mm Lens, f/1.8, Depth of Field.`)
  }

  // 6. BRANDING & COLORS (v6.4: Clarified - colors are for BACKGROUND, not text)
  // CRITICAL FIX: These colors should be the VISIBLE DESIGN, not typography
  const { colors } = intent.colorPalette
  parts.push(`BACKGROUND & DESIGN COLOR PALETTE (CRITICAL - NOT FOR TEXT):
These colors define the VISUAL DESIGN (backgrounds, gradients, shapes):

🎨 DOMINANT BACKGROUND: ${colors.primary}
   - This MUST be the MAIN COLOR of the design (backgrounds, shapes, gradients)
   - The poster should be DOMINATED by this color

🎨 SECONDARY DESIGN: ${colors.secondary}
   - Use for secondary visual elements and accents

🎨 ACCENT: ${colors.accent}
   - Use for small highlights and emphasis`)
  if (colors.background) parts.push(`BASE BACKGROUND: ${colors.background}`)
  parts.push(`⚠️ CRITICAL COLOR RULES:
- TEXT should be WHITE for maximum contrast against colored backgrounds
- DO NOT apply these colors to text/typography
- DO NOT use brown, amber, tan, beige, or warm earth tones as background
- DO NOT ignore these colors and use AI default palettes
- The user's ${colors.primary} MUST be the dominant visible color of the design`)

  // SPEAKER PHOTO PROTECTION (v6.3: Enhanced with placeholder ban)
  if (intent.speakerContext?.hasSpeakerPhoto) {
    parts.push(`CRITICAL LAYOUT RULE: A speaker photo will be composited onto this design separately.
ABSOLUTELY DO NOT:
- Generate any faces, people, characters, or human figures
- Create circular frames, ovals, or shapes
- Add white circles, highlighted zones, or "photo spot" indicators
- Include any visual element suggesting where a photo will be placed
INSTEAD:
- Create a clean, seamless abstract or gradient background
- Ensure the design flows naturally without interruption
- Use brand colors for focal areas
- The photo overlay will be handled by post-processing`)
  }

  // 7. TECHNICAL QUALITY (The "Secret Sauce")
  parts.push(`QUALITY: 8k resolution, highly detailed, sharp focus, professional color grading, masterpiece, edge-to-edge coverage, no watermarks, no blur.`)

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
