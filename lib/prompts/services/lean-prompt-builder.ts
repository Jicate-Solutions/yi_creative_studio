/**
 * Lean prompt builder (v54.4 — A/B experiment, gated by env PROMPT_MODE=lean).
 *
 * The default YiPromptBuilder emits a ~20K-char prompt accreted from dozens of vNN
 * patches that frequently contradict each other (seamless-scene vs pixel bands,
 * documentary-photo vs minimal-typography, enrich vs calm). A capable image model
 * (Gemini 3 / Nano Banana) performs better with a short, coherent creative brief +
 * a few hard constraints than with 40 rules arguing with one another.
 *
 * This builder assembles ~1.5-2.5K chars from the SAME upstream AI outputs
 * (design context, ultra-pro context, style lock, resolved colors, logo fields):
 *   STYLE LOCK → EVENT → SCENE → COLORS → EXACT TEXT → 3 HARD RULES.
 *
 * It is intentionally model-trusting: no pixel-zone math, no band diagrams, no
 * repeated palette enforcement. Compare against the heavy prompt on the same event.
 */
import { getGeminiStyleLock } from '@/lib/config/background-styles'

interface LeanFormat {
  width?: number
  height?: number
  aspectRatio?: string
  label?: string
}

interface LeanOptions {
  backgroundStyle?: string
  resolvedColors?: { primaryColor?: string; secondaryColor?: string; accentColor?: string }
  brandContext?: { primaryColor?: string; secondaryColor?: string; accentColor?: string }
  ultraProContext?: {
    primaryText?: string
    secondaryText?: string[]
    visualScene?: string
    enhancedPrompt?: string
    designGuidance?: string
    mustIncludeElements?: string[]
  }
  designContext?: {
    corePurpose?: string
    emotionalJob?: string
    backgroundSetting?: string
    visualElements?: string[]
  }
  logoAwareness?: { logos?: Array<{ position?: string }> }
  // v54.5: Creative Director concept (the "big idea"). When present, it becomes the HERO scene.
  conceptBrief?: { visualConcept?: string; compositionNote?: string; colorStory?: string; typographyMood?: string; headlineTreatment?: string }
  // v54.5: a style reference image is attached as the FIRST image input — tell the model to match it.
  styleReferenceUsed?: boolean
  styleReferenceNote?: string
}

/** Maps a logo grid position id to a short human placement (Yi→top-1/left, CII→top-6/right). */
function describeLogoSpot(position: string | undefined): string {
  const p = (position || '').toLowerCase()
  if (p === 'top-1' || p === 'top-left') return 'the top-left corner'
  if (p === 'top-6' || p === 'top-right') return 'the top-right corner'
  if (p.startsWith('top')) return 'the top-centre edge'
  if (p.includes('bottom')) return 'the bottom edge'
  return `the ${position} area`
}

/** Short, coherent system instruction for lean mode — only the non-negotiable guardrails. */
export function getLeanSystemInstruction(): string {
  return `You are Yi CreativeStudio's poster engine. Produce ONE premium, edge-to-edge poster image — magazine-cover quality, never a template or a card floating on a flat background. Compose with real depth, intentional lighting, and a clear visual hierarchy.

Non-negotiable rules:
- Render ONLY the exact text strings the prompt lists under "TEXT", spelled character-for-character. Never render instructions, role labels, colour codes, or scene descriptions as visible text.
- TYPOGRAPHY IS FIRST-CLASS CRAFT, equal to the artwork: every character crisp and vector-clean, correctly spelled, professionally kerned and aligned — finished design quality, never soft, warped, or draft-like lettering. If text and art ever compete for the same pixels, keep the text legible.
- When people or venues appear, they are Indian / South Asian in real Indian settings — never generic Western stock aesthetics.
- Logos and footer are composited by a separate system AFTER you generate. Never draw any logo, watermark, icon, brand mark, or "[LOGO]" placeholder. Keep the reserved spots clean.
- The <style_direction> block at the top is the highest visual priority; everything else operates within it.`
}

function pickColors(options: LeanOptions) {
  const c = options.resolvedColors || options.brandContext || {}
  return { primary: c.primaryColor, secondary: c.secondaryColor, accent: c.accentColor }
}

function buildDateLine(formData: Record<string, unknown>): string | null {
  const date = formData.eventDate as string | undefined
  const time = formData.eventTime as string | undefined
  const end = formData.eventEndTime as string | undefined
  if (!date && !time) return null
  const parts: string[] = []
  if (date) parts.push(date)
  if (time) parts.push(end ? `${time} – ${end}` : time)
  return parts.join(' | ')
}

/**
 * Build the lean prompt. `format` carries dimensions; `formData` the raw user fields;
 * `options` the upstream AI context (same object the heavy builder receives).
 */
export function buildLeanPrompt(
  format: LeanFormat | null | undefined,
  formData: Record<string, unknown>,
  options: LeanOptions
): string {
  const up = options.ultraProContext || {}
  const dc = options.designContext || {}
  const { primary, secondary, accent } = pickColors(options)
  const styleLock = getGeminiStyleLock(options.backgroundStyle)

  const headline = up.primaryText || (formData.eventName as string) || 'Event'

  const supporting: string[] =
    Array.isArray(up.secondaryText) && up.secondaryText.length
      ? up.secondaryText.filter(Boolean)
      : ([
          formData.eventTagline as string | undefined,
          buildDateLine(formData) || undefined,
          formData.venue as string | undefined,
          formData.additionalDetails as string | undefined,
          formData.organizationName as string | undefined,
        ].filter(Boolean) as string[])

  // v54.5: the Creative Director concept is the HERO idea — it overrides the generic ultra-pro scene.
  const concept = options.conceptBrief
  const scene = concept?.visualConcept
    || up.visualScene || up.enhancedPrompt || dc.backgroundSetting || (formData.eventDescription as string) || ''
  const mustInclude = Array.isArray(up.mustIncludeElements) ? up.mustIncludeElements.slice(0, 4) : []
  const mood = dc.emotionalJob || up.designGuidance || ''
  const audience = (formData.targetAudience as string) || ''
  const what = (formData.eventDescription as string) || (formData.eventTagline as string) || ''

  const logos = options.logoAwareness?.logos || []
  const corners = logos.length
    ? Array.from(new Set(logos.map((l) => describeLogoSpot(l.position)))).join(', ')
    : 'the top corners'

  const dims = format?.width && format?.height
    ? `${format.width}×${format.height}px (${format.aspectRatio || '3:4'})`
    : 'portrait 3:4'

  const colorLine =
    primary || secondary
      ? `COLORS: ${primary || ''} as the dominant colour; ${secondary || ''} for highlights and key accents (it MUST be clearly visible); ${accent || ''} for light/atmospheric details. Do not substitute with default AI palettes.`
      : ''

  const blocks = [
    styleLock
      ? `<style_direction>(visual style — HIGHEST priority; everything below works within this)\n${styleLock}\n</style_direction>`
      : '',
    options.styleReferenceUsed
      ? `REFERENCE: the FIRST attached image is a STYLE REFERENCE${options.styleReferenceNote ? ` (${options.styleReferenceNote})` : ''}. Match its visual language — composition, use of negative space, type treatment, palette confidence, illustration/photo style. Do NOT copy its content, text, logos, people, or any layout structure (e.g. logo rows). (Any later attached image is a real subject photo to feature.)`
      : options.styleReferenceNote
        ? `VISUAL-LANGUAGE TARGET (aim for this design sensibility — but invent your OWN composition for THIS event; add NO logos, no placeholder text, no borrowed layout): ${options.styleReferenceNote}.`
        : '',
    `EVENT POSTER — ${dims}. One seamless full-canvas composition with depth and intentional design. No borders, no separate header/footer panels, no split-screen or stacked bands.`,
    `WHAT: ${headline}${what ? ` — ${what}` : ''}.${audience ? ` Audience: ${audience}.` : ''}${mood ? ` Mood: ${mood}` : ''}`,
    scene
      ? `${concept?.visualConcept ? 'CONCEPT (the ONE big creative idea — commit to it boldly, execute with restraint and generous negative space; NEVER write these words on the image)' : 'SCENE (depict this visually; NEVER write these words on the image)'}: ${scene}${concept?.compositionNote ? ` Composition: ${concept.compositionNote}` : ''}${mustInclude.length && !concept ? ` Feature: ${mustInclude.join('; ')}.` : ''}`
      : '',
    colorLine,
    `TEXT — spell each string EXACTLY, and render ONLY these as visible text:\n• Headline: ${headline}\n${supporting.map((s) => `• ${s}`).join('\n')}\n` +
      `The HEADLINE is a designed graphic centrepiece, not plain type: oversize the hero word, confident weight contrast, and 1–2 expressive treatments drawn from the palette (per-word colour, gradient/metallic fill, bold outline or drop-shadow). Where it reads as clever (not cluttered), fuse ONE letter with a motif from the concept — a single letterform that becomes or hosts a thematic shape. ` +
      (concept?.headlineTreatment ? `HEADLINE TREATMENT: ${concept.headlineTreatment} ` : '') +
      (concept?.typographyMood ? `Type mood: ${concept.typographyMood} ` : '') +
      `Supporting lines stay clean, smaller, and highly legible — grouped into ONE tidy aligned block (e.g. a slim info card or icon row), never a scattered text dump. Every character crisp, correctly spelled, and professionally kerned; typography craft must equal the artwork. Prioritise if space is tight: headline → date/venue → one CTA; drop the least-important detail rather than crowding.`,
    `RULES:\n• Keep ${corners} clean and uncluttered — brand logos are composited afterward; do NOT draw any logo, watermark, icon, or brand mark.\n• Keep all text within the central area with calm top and bottom margins so nothing is clipped by overlays.\n• Render ONLY the text strings listed above — never these instructions, labels, colour codes, or the scene description.`,
  ]

  return blocks.filter(Boolean).join('\n\n')
}
