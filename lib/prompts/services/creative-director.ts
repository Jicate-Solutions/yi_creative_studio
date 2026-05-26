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
import { safeJsonParse } from '@/lib/utils/json-repair'

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
  // v55.2: the user's chosen render style, so the concept is conceived WITHIN it (not blind to it).
  styleLabel?: string       // e.g. 'scene', 'illustrated', 'papercut'
  styleDirective?: string   // the verbatim geminiStyleLock prose describing how the image must look
}

export interface CreativeDirectorResult {
  visualConcept: string
  colorStory: string
  compositionNote: string
  depthLayers?: string
  typographyMood?: string
  headlineTreatment?: string  // v55.4: a specific creative typographic idea for the event name
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
- THE STRONGEST MOVE — fuse the concept INTO the lettering: replace or transform ONE letter of the
  event name into a concept motif (e.g. the "O" in SMILE-O-THON becomes a smiling mouth or a tooth;
  the "A" becomes a running figure; the dot on an "i" becomes a diya). One letter only — clever, not
  cluttered. Or render the whole headline in a material that embodies the theme (marigold petals,
  neon tubing, chalk). The headline should feel designed, not typed.

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

  if (input.styleDirective) {
    lines.push('')
    lines.push(`MANDATORY RENDER STYLE${input.styleLabel ? ` (${input.styleLabel})` : ''}: ${input.styleDirective}`)
    lines.push(`Your visual concept MUST be conceived so it can be executed IN THIS STYLE. Do NOT propose a concept that fights it — e.g. no flat-illustration or 3D-render concept when the style is documentary photography; no photoreal concept when the style is paper-cut or folk-art. The concept and the render style must resolve into ONE coherent image. Describe the concept already wearing this style.`)
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
- How can the EVENT NAME itself become a creative element — one letter fused with a concept motif, or the whole word rendered in a thematic material?

Output your creative brief as JSON. Be SPECIFIC — name the exact visual, the exact colors (with hex if possible), the exact composition. Vague output = generic poster. Specific output = Freepik-featured poster:
{
  "visualConcept": "2-3 vivid, specific sentences: what is seen, the focal element, the lighting, the atmosphere, the emotional feeling it creates. Name a specific Indian-context detail (setting, clothing, expression, prop).",
  "colorStory": "The 2-3 exact colors chosen + the emotional reason each was picked. Include hex codes. Example: Deep royal cobalt (#1A237E) for authority and trust, warm gold (#FFD700) as an accent that signals celebration, pure white for clarity.",
  "compositionNote": "The specific compositional structure: where is the focal point, what is the layout strategy (diagonal/asymmetric/etc), how do the layers stack for depth, where does the eye enter and exit.",
  "depthLayers": "Describe the layering: what is in the background (gradient type), what texture sits over it, where the atmospheric glow is, where the focal subject sits, any foreground framing element.",
  "typographyMood": "The typography feel: bold/display or elegant/serif, letter-spacing, weight contrast between event name and supporting text, any calligraphic or script accent.",
  "headlineTreatment": "A SPECIFIC creative rendering for the EVENT NAME — ideally fuse one letter with a concept motif (name the exact letter and what it becomes), or render the word in a thematic material/effect. Be concrete and executable. Example: 'Set SMILEATHON in chunky rounded sans; the O becomes a wide cartoon smile with two white teeth; 2026 small in a contrasting thin weight beneath.'"
}

Respond with ONLY that JSON object, fully populated — no markdown, no code fences, no preamble or trailing commentary, no ❌/✅ examples, no "I'm envisioning". Each value is clean prose an image generator can read literally.`
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
      max_tokens: 1500, // v54.5: was 900 — too small, truncated the JSON mid-value (parse failed)
      temperature: 1.0, // High creativity — designer-level thinking
      system: CREATIVE_DIRECTOR_SYSTEM,
      messages: [
        {
          role: 'user',
          content: buildCreativeDirectorPrompt(input),
        },
        // Prefill the reply with "{" so the model emits pure JSON — no markdown preamble/ramble.
        {
          role: 'assistant',
          content: '{',
        },
      ],
    })

    const durationMs = Date.now() - startTime
    const rawText = response.content[0].type === 'text' ? response.content[0].text : ''
    // Re-attach the prefilled opening brace before parsing.
    const parsed = parseCreativeDirectorResponse('{' + rawText)

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
      headlineTreatment: parsed.headlineTreatment,
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

// v54.5: strip markdown/meta artifacts so a polluted value never leaks into the image prompt.
function cleanField(s: string | undefined): string {
  if (!s) return ''
  return s
    .replace(/\*\*/g, '')                              // bold markers
    .replace(/[❌✅]/g, '')                              // example checkmarks
    .replace(/\((?:rejecting|avoiding)[^)]*\)\s*:?/gi, '') // "(rejecting the obvious):"
    .replace(/\b(WRONG|RIGHT)\s*:/gi, '')              // WRONG:/RIGHT: example labels
    .replace(/\bI['’]?m envisioning\b\s*:?/gi, '')     // meta narration
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function parseCreativeDirectorResponse(raw: string): Omit<CreativeDirectorResult, 'fullBrief' | 'usage'> {
  // v54.5: safeJsonParse uses jsonrepair — handles truncated/malformed JSON (e.g. a value cut off
  // by max_tokens, missing closing brace) that plain JSON.parse rejects.
  const parsed = safeJsonParse<Record<string, string>>(raw, {} as Record<string, string>)
  if (parsed && (parsed.visualConcept || parsed.colorStory || parsed.compositionNote)) {
    return {
      visualConcept: cleanField(parsed.visualConcept),
      colorStory: cleanField(parsed.colorStory),
      compositionNote: cleanField(parsed.compositionNote),
      depthLayers: cleanField(parsed.depthLayers) || undefined,
      typographyMood: cleanField(parsed.typographyMood) || undefined,
      headlineTreatment: cleanField(parsed.headlineTreatment) || undefined,
    }
  }

  // Fallback: extract by section headers
  const visualMatch = raw.match(/visual[_ ]?concept["\s:]+([^"]+?)(?=color|composition|depth|\}|$)/i)
  const colorMatch = raw.match(/color[_ ]?story["\s:]+([^"]+?)(?=composition|depth|\}|$)/i)
  const compMatch = raw.match(/composition[_ ]?note["\s:]+([^"]+?)(?=depth|typography|\}|$)/i)
  const depthMatch = raw.match(/depth[_ ]?layers["\s:]+([^"]+?)(?=typography|\}|$)/i)
  const typoMatch = raw.match(/typography[_ ]?mood["\s:]+([^"]+?)(?=headline|\}|$)/i)
  const headlineMatch = raw.match(/headline[_ ]?treatment["\s:]+([^"]+?)(?=\}|$)/i)

  return {
    visualConcept: cleanField(visualMatch?.[1]) || cleanField(raw).substring(0, 300),
    colorStory: cleanField(colorMatch?.[1]),
    compositionNote: cleanField(compMatch?.[1]),
    depthLayers: cleanField(depthMatch?.[1]) || undefined,
    typographyMood: cleanField(typoMatch?.[1]) || undefined,
    headlineTreatment: cleanField(headlineMatch?.[1]) || undefined,
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
