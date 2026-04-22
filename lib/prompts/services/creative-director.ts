/**
 * Creative Director Agent
 *
 * Activated for the yi_spotlight vertical. Instead of following static rules,
 * Claude reasons through design choices like a professional creative director —
 * choosing a visual concept, color story, and composition intentionally.
 *
 * Output is injected as `additionalVisualBrief` (HIGHEST PRIORITY) into the
 * Design Intelligence and Ultra-Pro Prompt pipelines.
 */

import Anthropic from '@anthropic-ai/sdk'

// ============================================================
// TYPES
// ============================================================

export interface CreativeDirectorInput {
  eventName: string
  eventDescription?: string
  venue?: string
  targetAudience?: string
  tagline?: string
  eventType?: string
}

export interface CreativeDirectorResult {
  visualConcept: string
  colorStory: string
  compositionNote: string
  depthLayers?: string
  typographyMood?: string
  fullBrief: string
  usage: {
    inputTokens: number
    outputTokens: number
    durationMs: number
  }
}

// ============================================================
// SYSTEM PROMPT — Designer Persona
// ============================================================

const CREATIVE_DIRECTOR_SYSTEM = `You are a world-class creative director whose event posters are regularly featured on Freepik, Behance, and shared across Indian Instagram design communities.
Your work wins because you think like a designer first — every choice is intentional, every element earns its place.

━━━ WHAT YOU KNOW ABOUT GREAT POSTER DESIGN ━━━

FOCAL POINT LAW: Every outstanding poster has exactly ONE element the eye hits first.
Everything else — color, texture, typography, depth — exists only to amplify that one focal point.
A poster with two focal points has zero focal points.

COMPOSITION CREATES EMOTION:
- Diagonal arrangements → energy, dynamism, forward motion
- Asymmetric balance → sophistication, tension, surprise
- Radial composition → draws the eye inward, creates intensity
- Negative space → confidence, luxury, breathing room
NEVER use static center-stacked layouts unless the concept demands it.

2025 DESIGN LANGUAGE (from Freepik trends):
- Deep jewel-tone gradients with atmospheric glow (not flat corporate gradients)
- Painterly/grainy texture layer at 8–12% opacity over gradient = instant depth and premium feel
- Bold typography treated as a VISUAL ELEMENT — letterforms as graphic shapes, not just text containers
- Metallic or electric color accents (chrome silver, electric blue, warm gold) as punctuation
- Layered depth: background gradient → texture → midground subject → foreground type
- Mixed media feel: photographic subjects + graphic overlays + typographic energy

COLOR PSYCHOLOGY (choose deliberately, not by category):
- Deep emerald + gold → dignity, healing, prestige
- Royal cobalt + white → authority, trust, clarity
- Rich violet + rose gold → aspiration, empowerment, modernity
- Deep burnt orange + cream → warmth, community, celebration
- Midnight navy + electric cyan → technology, innovation, precision
Never match color to event category mechanically. Ask: what EMOTION does this event need to carry?

TYPOGRAPHY AS VISUAL ANCHOR:
- Event name rendered LARGE — not as information, but as a visual weight that grounds the poster
- Contrast: one bold display typeface (impact) + one clean secondary (readability)
- Letter-spacing on ALL-CAPS headlines adds power and visual width
- Optional: one calligraphic/script accent word for emotional texture

DEPTH THROUGH LAYERING (the Freepik premium technique):
Layer 1 — Background: deep gradient (dark rich tone at top, slightly lighter at bottom)
Layer 2 — Texture: subtle grain or painterly brush texture at low opacity
Layer 3 — Atmospheric glow: a soft radial bloom of light behind the focal subject
Layer 4 — Midground: the focal subject (person, object, or concept)
Layer 5 — Foreground hint: optional graphic element that frames the subject
Layer 6 — Type: large, confident, clearly readable

━━━ YOUR THINKING PROCESS ━━━

Step 1 — EMOTIONAL CORE: What single emotion should this poster trigger the instant someone sees it?
Step 2 — VISUAL CONCEPT: What ONE specific image or composition embodies that emotion for THIS event?
  Do not default to literal (health → doctor). Ask: what unexpected, striking image captures the FEELING of this event?
  The most memorable posters are conceptual: Graduation → books unfolding into wings.
  Road Safety → traffic signs forming a human silhouette. Health → heartbeat line becoming a running figure.
Step 3 — COLOR DECISION: What 2–3 color palette carries the emotion? Choose and justify deliberately.
Step 4 — COMPOSITION CHOICE: What compositional structure creates the right energy for this event?
Step 5 — DEPTH PLAN: How do the layers stack to create a premium, dimensional feel?
Step 6 — INDIAN CONTEXT: How is this authentically Indian — in faces, setting, cultural resonance?

━━━ OUTPUT FORMAT ━━━

Output a JSON creative brief. Be VIVID and SPECIFIC — describe what a talented AI image generator will actually see and render.
A vague brief produces a generic poster. A specific brief produces a Freepik-featured poster.`

// ============================================================
// USER PROMPT BUILDER
// ============================================================

function buildCreativeDirectorPrompt(input: CreativeDirectorInput): string {
  const lines: string[] = []

  lines.push(`EVENT: ${input.eventName}`)

  if (input.tagline) {
    lines.push(`TAGLINE: ${input.tagline}`)
  }

  if (input.eventDescription) {
    lines.push(`DESCRIPTION: ${input.eventDescription}`)
  }

  if (input.venue) {
    lines.push(`VENUE: ${input.venue}`)
  }

  if (input.targetAudience) {
    lines.push(`AUDIENCE: ${input.targetAudience}`)
  }

  if (input.eventType) {
    lines.push(`EVENT TYPE: ${input.eventType}`)
  }

  return `${lines.join('\n')}

Think through your design process step by step (internally), then output ONE creative brief for this poster.

Ask yourself:
- What is the emotional core of this event?
- What unexpected, striking visual concept captures that emotion?
- What 2-3 colors carry this emotion deliberately (not just "event-matching")?
- What composition structure (diagonal, asymmetric, radial) creates the right energy?
- How do I layer depth to make this feel premium and dimensional?
- What makes this authentically Indian in faces, setting, and cultural feel?

Output your creative brief as JSON. Be SPECIFIC — name the exact visual, the exact colors (with hex if possible), the exact composition. Vague output = generic poster. Specific output = Freepik-featured poster:
{
  "visualConcept": "2-3 vivid, specific sentences: what is seen, the focal element, the lighting, the atmosphere, the emotional feeling it creates. Name a specific Indian-context detail (setting, clothing, expression, prop).",
  "colorStory": "The 2-3 exact colors chosen + the emotional reason each was picked. Include hex codes. Example: Deep royal cobalt (#1A237E) for authority and trust, warm gold (#FFD700) as an accent that signals celebration, pure white for clarity.",
  "compositionNote": "The specific compositional structure: where is the focal point, what is the layout strategy (diagonal/asymmetric/etc), how do the layers stack for depth, where does the eye enter and exit.",
  "depthLayers": "Describe the layering: what is in the background (gradient type), what texture sits over it, where the atmospheric glow is, where the focal subject sits, any foreground framing element.",
  "typographyMood": "The typography feel: bold/display or elegant/serif, letter-spacing, weight contrast between event name and supporting text, any calligraphic or script accent."
}`
}

// ============================================================
// MAIN FUNCTION
// ============================================================

/**
 * Run Creative Director reasoning for Spotlight tab generation.
 * Returns a rich design brief that gets injected as HIGHEST PRIORITY visual direction.
 */
export async function generateCreativeDirectorBrief(
  input: CreativeDirectorInput
): Promise<CreativeDirectorResult> {
  const startTime = Date.now()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Graceful fallback — don't break generation if key missing
    return buildFallback(input)
  }

  try {
    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 900,
      temperature: 1.0, // High creativity — designer-level thinking
      system: CREATIVE_DIRECTOR_SYSTEM,
      messages: [
        {
          role: 'user',
          content: buildCreativeDirectorPrompt(input),
        },
      ],
    })

    const durationMs = Date.now() - startTime
    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    const parsed = parseCreativeDirectorResponse(rawText)

    // Assemble a rich, prioritised brief — visual concept first as it carries most weight
    const fullBrief = [
      parsed.visualConcept,
      parsed.colorStory,
      parsed.compositionNote,
      parsed.depthLayers,
      parsed.typographyMood,
    ]
      .filter(Boolean)
      .join(' ')

    console.log('[Creative Director] Visual concept generated:', fullBrief.substring(0, 120) + '...')

    return {
      visualConcept: parsed.visualConcept,
      colorStory: parsed.colorStory,
      compositionNote: parsed.compositionNote,
      depthLayers: parsed.depthLayers,
      typographyMood: parsed.typographyMood,
      fullBrief,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        durationMs,
      },
    }
  } catch (err) {
    console.error('[Creative Director] Failed, using fallback:', err)
    return buildFallback(input)
  }
}

// ============================================================
// RESPONSE PARSER
// ============================================================

function parseCreativeDirectorResponse(raw: string): Omit<CreativeDirectorResult, 'fullBrief' | 'usage'> {
  // Try JSON parse first
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0])
      return {
        visualConcept: parsed.visualConcept || '',
        colorStory: parsed.colorStory || '',
        compositionNote: parsed.compositionNote || '',
        depthLayers: parsed.depthLayers || undefined,
        typographyMood: parsed.typographyMood || undefined,
      }
    }
  } catch {
    // fall through to text extraction
  }

  // Fallback: extract by section headers
  const visualMatch = raw.match(/visual[_ ]?concept["\s:]+([^"]+?)(?=color|composition|depth|\}|$)/i)
  const colorMatch = raw.match(/color[_ ]?story["\s:]+([^"]+?)(?=composition|depth|\}|$)/i)
  const compMatch = raw.match(/composition[_ ]?note["\s:]+([^"]+?)(?=depth|typography|\}|$)/i)
  const depthMatch = raw.match(/depth[_ ]?layers["\s:]+([^"]+?)(?=typography|\}|$)/i)
  const typoMatch = raw.match(/typography[_ ]?mood["\s:]+([^"]+?)(?=\}|$)/i)

  return {
    visualConcept: visualMatch?.[1]?.trim() || raw.substring(0, 300),
    colorStory: colorMatch?.[1]?.trim() || '',
    compositionNote: compMatch?.[1]?.trim() || '',
    depthLayers: depthMatch?.[1]?.trim() || undefined,
    typographyMood: typoMatch?.[1]?.trim() || undefined,
  }
}

// ============================================================
// SPOTLIGHT CREATIVE BRIEF — Single focal visual for Spotlight tab
// ============================================================

const SPOTLIGHT_CREATIVE_SYSTEM = `You are a visual concept specialist for event posters. Your job is to find ONE perfect image that represents an event theme — not a scene, not layers, just a single focal element described with precision.

━━━ THE SPOTLIGHT RULE ━━━
ONE element. ONE focal point. ONE clean composition.

Not: "a figure stands in front of a crowd near a festival stage with marigolds and diyas in the foreground"
Yes: "a traditional clay Pongal pot overflowing with rice, steam rising gently, placed on clean red earth with a single marigold flower beside it — golden afternoon light from the left, clean simple background"

━━━ HOW TO FIND THE ONE IMAGE ━━━
Ask: What is the OBJECT, SYMBOL, or MOMENT that IS this event?
- "Plastic Free Pongal" → the Pongal pot itself. Clean earth. Marigolds. No plastic.
- "Tech Summit" → a single glowing circuit board node, isolated on dark background
- "Leadership Conclave" → a compass pointing forward, sharp and precise against clean light
- "Blood Donation Drive" → a single drop of blood catching warm light, crystalline and purposeful
- "Tree Plantation Drive" → one small green sapling breaking through dry earth, first rain drops falling

Do NOT describe people (unless the event is literally about a person).
Do NOT add background crowds, supporting cast, or complex environmental context.
Do NOT describe multiple objects — one object, one story.

━━━ COLOR PALETTE ━━━
A theme hint will be provided. Use it to anchor the color story:
- tricolor → saffron (#FF9933), white, green (#138808); warm golden light; patriotic energy
- brand → Yi blue (#005B96) dominant background; white and orange (#FF6B35) accents; professional
- gradient → deep navy (#1a2332) to Yi blue (#005B96); cool, modern, polished

The single focal element sits cleanly against a background derived from this palette.

━━━ OUTPUT ━━━
A vivid 2–3 sentence visual concept. Name the exact object, its surface, its lighting, the mood.
Keep colorStory to 1–2 sentences. Keep compositionNote to 1 sentence.
Return as JSON with only these keys: visualConcept, colorStory, compositionNote.`

function buildSpotlightPrompt(input: CreativeDirectorInput, theme: 'tricolor' | 'brand' | 'gradient'): string {
  const lines: string[] = []
  lines.push(`EVENT: ${input.eventName}`)
  if (input.tagline) lines.push(`TAGLINE: ${input.tagline}`)
  if (input.eventDescription) lines.push(`DESCRIPTION: ${input.eventDescription}`)
  if (input.eventType) lines.push(`EVENT TYPE: ${input.eventType}`)

  const themeDescriptions = {
    tricolor: 'tricolor (saffron / white / green palette, warm golden light, patriotic energy)',
    brand: 'brand (Yi blue #005B96 dominant, white + orange #FF6B35 accents, professional)',
    gradient: 'gradient (deep navy #1a2332 to Yi blue, cool and modern)',
  }

  return `${lines.join('\n')}

COLOR PALETTE HINT: ${themeDescriptions[theme]}

Find the ONE object or symbol that IS this event. Describe it vividly and precisely. Clean background derived from the palette hint. No crowds. No complex scenes. Just one powerful focal element.

Output JSON with exactly these keys:
{
  "visualConcept": "2-3 sentences describing the single focal object — what it is, its surface texture, the lighting angle and quality, the mood it creates. Be specific and vivid.",
  "colorStory": "1-2 sentences: the dominant background color/gradient + the accent color on the focal object. Include hex codes.",
  "compositionNote": "1 sentence: where the focal object sits in the frame, how much canvas it occupies, what surrounds it (clean space, gradient backdrop, etc)."
}`
}

/**
 * Generate a single-focal-point creative brief for Spotlight tab generations.
 * Produces ONE clean, event-specific visual concept (not complex scenes).
 * Injected as `additionalVisualBrief` (HIGHEST PRIORITY) into Design Intelligence.
 */
export async function generateSpotlightCreativeBrief(
  input: CreativeDirectorInput,
  theme: 'tricolor' | 'brand' | 'gradient' = 'tricolor'
): Promise<CreativeDirectorResult> {
  const startTime = Date.now()

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return buildSpotlightFallback(input, theme)
  }

  try {
    const client = new Anthropic({ apiKey })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 400,
      temperature: 0.9,
      system: SPOTLIGHT_CREATIVE_SYSTEM,
      messages: [{ role: 'user', content: buildSpotlightPrompt(input, theme) }],
    })

    const durationMs = Date.now() - startTime
    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

    const parsed = parseCreativeDirectorResponse(rawText)

    // Spotlight brief: join only visual + color + composition (omit depth/typography — not needed)
    const fullBrief = [parsed.visualConcept, parsed.colorStory, parsed.compositionNote]
      .filter(Boolean)
      .join(' ')

    console.log('[Spotlight Brief] Single focal visual generated:', fullBrief.substring(0, 120) + '...')

    return {
      visualConcept: parsed.visualConcept,
      colorStory: parsed.colorStory,
      compositionNote: parsed.compositionNote,
      fullBrief,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        durationMs,
      },
    }
  } catch (err) {
    console.error('[Spotlight Brief] Failed, using fallback:', err)
    return buildSpotlightFallback(input, theme)
  }
}

// ============================================================
// FALLBACK
// ============================================================

function buildSpotlightFallback(input: CreativeDirectorInput, theme: 'tricolor' | 'brand' | 'gradient'): CreativeDirectorResult {
  const name = input.eventName || 'Event'
  const colorStories = {
    tricolor: 'Warm saffron (#FF9933) to clean white gradient background with forest green (#138808) accent — patriotic and vibrant.',
    brand: 'Rich Yi blue (#005B96) background fading to a lighter blue, with orange (#FF6B35) accent highlight on the focal element.',
    gradient: 'Deep navy (#1a2332) to Yi blue (#005B96) gradient background — cool, modern, polished.',
  }
  const visualConcept = `A single, clean focal symbol representing ${name} — one object that perfectly embodies the event's purpose, precisely lit against a ${theme} palette background with generous breathing space around it.`
  const colorStory = colorStories[theme]
  const compositionNote = `The focal element is centered, occupying 40–50% of the canvas height, with clean empty space above and below — no decorative clutter.`

  return {
    visualConcept,
    colorStory,
    compositionNote,
    fullBrief: [visualConcept, colorStory, compositionNote].join(' '),
    usage: { inputTokens: 0, outputTokens: 0, durationMs: 0 },
  }
}

function buildFallback(input: CreativeDirectorInput): CreativeDirectorResult {
  const name = input.eventName || 'Event'
  const visualConcept = `A bold, cinematic composition for ${name} — a single dynamic Indian figure in the foreground, powerfully lit against a deep gradient background, surrounded by event-specific elements that tell the story through atmosphere rather than explanation.`
  const colorStory = `Deep jewel-tone gradient (chosen for the event's emotional tone), with a bold Yi orange accent band anchoring the lower section for energy and information hierarchy.`
  const compositionNote = `Subject occupies 45–60% of canvas height in the lower half, leaving the upper-center clear for text. A subtle diagonal overlay at 15% opacity adds graphic depth without distracting from the subject.`

  return {
    visualConcept,
    colorStory,
    compositionNote,
    fullBrief: [visualConcept, colorStory, compositionNote].join(' '),
    usage: { inputTokens: 0, outputTokens: 0, durationMs: 0 },
  }
}
