/**
 * Designer Pipeline — Stage 07-Typography: Typography Intelligence (v1.3)
 *
 * Gemini ai_native posters were rendering titles like plain centered document text.
 * Designers expect EXPRESSIVE poster typography — cinematic title treatments, luxury
 * display lettering, festival hierarchy, custom title shapes, better pairing/spacing.
 *
 * We don't fine-tune Gemini. Instead we add a deterministic Typography Intelligence
 * layer that:
 *   1. picks a headline PERSONALITY (a recipe) from the style blend + domain + event +
 *      rendering mode + the user's font requests,
 *   2. describes the fonts by VISUAL PERSONALITY (not just names) so Gemini renders the
 *      right letterforms even without the exact font,
 *   3. emits a dedicated <TYPOGRAPHY_DIRECTION> block for the final Gemini prompt and a
 *      hard typography constraint block for the Claude Director,
 *   4. self-audits the plan before generation (the plan-level "typography critic").
 *
 * Pure / synchronous / no LLM — stable and testable. General for ALL posters.
 */

import type {
  ColorPlan,
  DesignDomain,
  EventFamily,
  HeadlinePersonality,
  RenderingMode,
  TypographyAudit,
  TypographyFontRoles,
  TypographyMode,
  TypographyPlan,
} from './contracts'
import { resolveTypographyRoles } from './idea-parser'

// ----------------------------------------------------------------------------
// Typography anti-patterns — ALWAYS forbidden (the "document text" failure modes).
// ----------------------------------------------------------------------------

const TYPOGRAPHY_ANTIPATTERNS: string[] = [
  'plain document heading look',
  'PowerPoint-style centered title',
  'default Arial/Calibri system-font appearance',
  'weak, thin or undersized title',
  'generic UI date/venue card',
  'mismatched flat overlay text style',
  'cramped text blocks',
  'random font mixing',
  'unreadable over-decorative lettering',
]

// ----------------------------------------------------------------------------
// Font-personality dictionary — describe a font by its VISUAL VOICE, not just name.
// "Use Oswald" is weak for Gemini; the letterform description is what steers it.
// ----------------------------------------------------------------------------

const FONT_PERSONA: Array<{ re: RegExp; desc: string; short: string }> = [
  {
    re: /^(oswald|bebas|bebas neue|anton|teko|fjalla(?:\s*one)?|staatliches|league gothic|archivo black)$/i,
    desc: 'bold condensed display lettering — tall, compact uppercase letterforms, strong vertical weight, confident cinematic poster presence',
    short: 'bold condensed display title',
  },
  {
    re: /^(playfair(?:\s*display)?|cormorant|cinzel|abril fatface|didot|bodoni)$/i,
    desc: 'high-contrast elegant display serif — refined thick-to-thin strokes, luxury editorial presence, generous tracking',
    short: 'high-contrast elegant serif title',
  },
  {
    re: /^(garamond|merriweather|lora|crimson|pt serif|noto serif)$/i,
    desc: 'classic readable serif — warm, premium, editorial body voice',
    short: 'classic premium serif',
  },
  {
    re: /^(montserrat|gotham|futura|poppins|dm sans|work sans|manrope|raleway|josefin sans|quicksand)$/i,
    desc: 'geometric modern sans — even strokes, clean and contemporary, confident but neutral',
    short: 'geometric modern sans',
  },
  {
    re: /^(open sans|roboto|lato|inter|source sans(?:\s*pro)?|pt sans|noto sans|nunito(?:\s*sans)?|barlow|rubik)$/i,
    desc: 'humanist readable sans — neutral and highly legible, ideal for small secondary detail text',
    short: 'humanist readable sans',
  },
  {
    re: /^(dancing script|pacifico|satisfy|great vibes|sacramento|alex brush|lobster|amatic)$/i,
    desc: 'flowing script lettering — fluid connected strokes with natural pen-pressure variation, expressive and personal, suited for warm or celebratory contexts',
    short: 'expressive script lettering',
  },
  {
    re: /^(rockwell|clarendon|zilla slab|roboto slab|arvo|crete round|quattrocento)$/i,
    desc: 'slab-serif display lettering — uniform-weight rectangular serifs, sturdy and mechanical, strong at large sizes with a vintage poster authority',
    short: 'slab-serif display title',
  },
  {
    re: /^(quicksand|varela|comfortaa|rounded mplus|nunito)$/i,
    desc: 'rounded geometric sans — circular terminals, friendly consistent weight, warm and approachable, suggests an accessible professional context',
    short: 'rounded geometric sans',
  },
]

/** Describe a font by its visual personality (used in fontDirection). */
export function describeFont(name: string): string {
  const n = name.trim()
  for (const f of FONT_PERSONA) if (f.re.test(n)) return f.desc
  return `a distinctive ${n}-style display voice — designed poster lettering, never a plain system font`
}

// ----------------------------------------------------------------------------
// The 9 typography recipes (the personality registry).
// ----------------------------------------------------------------------------

interface TypographyRecipe {
  id: HeadlinePersonality
  label: string
  titleTreatment: string
  /** Default font direction when the user did NOT name fonts. */
  fontDirection: string
  /** Short default-font phrase for the preview one-liner. */
  fontShort: string
  hierarchy: string
  letterSpacing: string
  textEffects: string[]
  supportingTextStyle: string
  /** Recipe-specific things to avoid (merged with the global anti-patterns). */
  avoid: string[]
}

const TYPOGRAPHY_RECIPES: Record<HeadlinePersonality, TypographyRecipe> = {
  'cinematic-title': {
    id: 'cinematic-title',
    label: 'Cinematic title',
    titleTreatment:
      'Theatrical movie-poster title treatment: a large custom display title in bold condensed or cinematic block/serif lettering, dimensional with a controlled highlight and a subtle metallic or glow edge, commanding the frame with strong dramatic scale.',
    fontDirection:
      'Render the headline letters as MONOLITHIC VERTICAL COLUMNS — each character is tall and narrow (height ≈ 3–4× its width), with uniform-weight strokes and razor-sharp angular terminals, zero decorative elements. The letterforms are architectural and weight-forward, like a championship marquee or military inscription engraved in stone.',
    fontShort: 'bold cinematic display title',
    hierarchy:
      'Title is the dominant focal element (often the largest object after the hero); tagline sits tight beneath it; details are clearly tertiary.',
    letterSpacing: 'Tight, deliberate tracking on the title; slightly open on the tagline for drama.',
    textEffects: [
      'Each letter appears to physically protrude from the surface, with a directional drop shadow offset 3–5% of letter height, matching the scene\'s primary light source',
      'A bright thin light catches the upper-left edge of each letter as if a spotlight is positioned above-left — a luminous rim on the raised letter edge',
      'A subtle metallic sheen runs across the face of the letterforms — not reflective chrome, but a cinematic title-card burnished finish',
    ],
    supportingTextStyle:
      'Supporting text in a clean condensed sans, smaller and quieter, with cinematic spacing — never competing with the title.',
    avoid: ['flat office sans-serif title', 'evenly-lit pasted-on text'],
  },
  'luxury-display': {
    id: 'luxury-display',
    label: 'Luxury display',
    titleTreatment:
      'Premium luxury display lettering: an elegant high-contrast serif or refined display sans with gold-foil / champagne highlights or a subtle bevel, generous tracking, and clean breathing space that signals premium quality.',
    fontDirection:
      'Each headline letter has HIGH-CONTRAST COUTURE architecture: ultra-thin hairline crossbars and serifs that flare into dramatic thick downstrokes — as if written with a broad calligraphy nib pressed to its widest angle. Stroke tension between thin and thick is extreme; the letterforms feel expensive and deliberate, with generous air between each character.',
    fontShort: 'elegant high-contrast display',
    hierarchy:
      'Title leads with quiet authority and ample negative space; supporting lines are delicate and well-spaced; nothing crowds the lockup.',
    letterSpacing: 'Generous, luxurious tracking; airy line spacing; refined kerning.',
    textEffects: [
      'The letter strokes have a foil-stamped finish: a smooth gradient from pale champagne at the highlight through warm gold to deep amber in the deepest shadow',
      'Each letter has a soft raised profile: lighter along the top edge, darker along the bottom, as if the letter is a shallow relief pressed into expensive card stock',
      'A fine premium sheen catches across the thick strokes — the quiet gleam of polished metal, not the blaze of chrome',
    ],
    supportingTextStyle:
      'Supporting text in a light, refined sans with wide tracking — understated and elegant.',
    avoid: ['cheap neon glow', 'heavy clutter', 'basic Arial-like text'],
  },
  'editorial-condensed': {
    id: 'editorial-condensed',
    label: 'Editorial condensed',
    titleTreatment:
      'Magazine-cover title lockup: a tall condensed bold display face with strong left/grid alignment, premium spacing, and a crisp masthead-style title lockup.',
    fontDirection:
      'The title letters are TALL PRECISION BLADES — condensed to roughly half their natural width, with flat-cut terminals and strict geometric construction. Every character aligns to an invisible vertical grid with the discipline of a newspaper masthead or magazine cover logotype. No unnecessary curves; only the essential geometry of each letter.',
    fontShort: 'tall condensed editorial display',
    hierarchy:
      'Title anchored to a strong alignment line; subheads and details follow a clear editorial grid; confident size jumps between levels.',
    letterSpacing: 'Tight condensed tracking on the title; structured, even spacing throughout.',
    textEffects: [
      'The letterforms have perfectly sharp edges with zero anti-aliasing blur — like letterpress printing or precision laser engraving on metal',
      'A single hairline horizontal rule (1–2px) sits beneath the title, extending to the width of the longest word — a refined editorial separator that grounds the lockup',
    ],
    supportingTextStyle: 'Supporting text in a clean sans set on the same grid — small caps or tracked labels for kickers.',
    avoid: ['generic centered paragraph text', 'soft fuzzy edges'],
  },
  'festival-bold': {
    id: 'festival-bold',
    label: 'Festival bold',
    titleTreatment:
      'Celebratory festival title: big, joyful premium display lettering with a warm glow, confetti-aware spacing, and high readability — festive energy that still feels designed and premium, not cheap.',
    fontDirection:
      'The headline letters are BIG CELEBRATORY SHAPES — wide, rounded, and visually warm. Each letter has generous ink weight with smooth curves (no sharp corners), as if stamped or pressed with a thick rubber die. The overall impression is cheerful, high-energy, and immediately readable even across the room.',
    fontShort: 'big festive display title',
    hierarchy:
      'Title is large and central-stage, radiating energy; tagline supports the celebration; details stay clean and legible amid the festivity.',
    letterSpacing: 'Comfortable, slightly open tracking so the title breathes among festive elements.',
    textEffects: [
      'A warm orange-gold halo radiates softly from behind and around each letter, as if the text is lit from within by candlelight or the glow of fireworks',
      'Each letter appears to gently protrude from the surface with a soft directional highlight on the upper face — celebratory dimensional warmth, not harsh shadow',
      'Tiny sparkle or foil accents appear at letter intersections or stroke ends — very subtle, like reflected light catching the tips of the letters',
    ],
    supportingTextStyle: 'Supporting text in a friendly clean sans, high-contrast against the festive scene for legibility.',
    avoid: ['plain document heading style', 'muddy low-contrast text on busy backgrounds'],
  },
  'youthful-pop': {
    id: 'youthful-pop',
    label: 'Youthful pop',
    titleTreatment:
      'Energetic youth title: bold rounded display or varsity-style lettering with playful scale variation and strong colour accents — fun, dynamic, and confident.',
    fontDirection:
      'The letters are BOLD ROUNDED BUBBLES — each character has a friendly, slightly inflated quality with smooth rounded terminals, consistent thick strokes, and a playful scale difference between words (the key word is 20–30% larger). Think varsity block letters or a bold printed sticker — every character feels physically present and confident.',
    fontShort: 'bold rounded / varsity display',
    hierarchy:
      'Title is big and lively with playful scale shifts between words; supporting text is upbeat and clear; accents pop on key words.',
    letterSpacing: 'Punchy, slightly tight tracking; expressive size contrast between words allowed.',
    textEffects: [
      'Key letters or words have a vivid fill colour (the accent from the palette) while others stay in the dominant colour — deliberate colour-blocking, not random',
      'Each letter is surrounded by a solid 3–5% stroke in the darkest palette colour, making the letterform read like a sticker or bold screenprinted label',
      'A clean offset drop shadow sits 4–6% below and right of each letter in a darker version of the background — pops the text off the surface',
    ],
    supportingTextStyle: 'Supporting text in a rounded geometric sans — friendly and readable.',
    avoid: ['formal corporate text', 'stiff thin lettering'],
  },
  'institutional-premium': {
    id: 'institutional-premium',
    label: 'Institutional premium',
    titleTreatment:
      'Clean-but-designed institutional title: a strong geometric sans or editorial serif with structured hierarchy, premium spacing, and brand-safe polish — authoritative, never boring.',
    fontDirection:
      'The letterforms are STRUCTURED GEOMETRIC BLOCKS — even-stroke-weight sans-serif capitals with open apertures and measured proportions, or a refined editorial serif with clear classical structure. Every letter sits with authority on a disciplined baseline. There is no frivolity in the form; only confident, precise geometry that communicates institutional credibility.',
    fontShort: 'strong geometric sans / editorial serif',
    hierarchy:
      'Title leads with structured authority; clear, disciplined levels; generous, deliberate spacing signalling premium institution.',
    letterSpacing: 'Measured, even tracking; disciplined alignment; confident size hierarchy.',
    textEffects: [
      'The letterforms have perfectly sharp edges — clean and precise, as if produced by a high-quality offset press or institutional signage',
      'A single thin brand-accent rule (1–2px in the accent colour) sits beneath or beside the title — a restrained institutional flourish',
    ],
    supportingTextStyle: 'Supporting text in a clean geometric sans — structured, legible, premium.',
    avoid: ['boring default document font', 'cluttered or playful styling'],
  },
  'minimal-modern': {
    id: 'minimal-modern',
    label: 'Minimal modern',
    titleTreatment:
      'Restrained modern title: an elegant sans or serif with high spacing discipline and quiet confidence — refined, spacious, and effect-light.',
    fontDirection:
      'The letters are REFINED AND WEIGHTLESS — thin to medium strokes with high x-height, abundant negative space both within and around each character, and precise optical spacing. The letterforms recede elegantly, drawing attention through restraint rather than mass. Every letter is a study in considered reduction.',
    fontShort: 'elegant minimal sans/serif',
    hierarchy:
      'Title leads through scale and spacing alone; very few levels; abundant negative space is the design.',
    letterSpacing: 'Generous, disciplined tracking; large line spacing; precise kerning.',
    textEffects: [
      'No glow, no bevel, no shadow — the typography communicates purely through letterform weight, generous scale, and disciplined negative space',
      'At most: a single hairline accent in the palette accent colour — one thin line only, nothing more',
    ],
    supportingTextStyle: 'Supporting text whisper-quiet — light weight, wide tracking, plenty of room.',
    avoid: ['plain default-font appearance', 'busy effects', 'crowded layout'],
  },
  'cultural-crafted': {
    id: 'cultural-crafted',
    label: 'Cultural crafted',
    titleTreatment:
      'Handcrafted cultural title: decorative-yet-readable lettering with a warm traditional rhythm and festival energy — culturally inspired ornament that never sacrifices legibility.',
    fontDirection:
      'The letters have HANDMADE WARMTH — subtle variations in stroke pressure, slightly irregular edges as if drawn with a broad brush or a traditional reed pen, and a rhythm that feels hand-placed rather than machine-set. The letterforms reference Indian festival lettering or hand-painted signage from temple towns: warm, crafted, and unmistakably human in character.',
    fontShort: 'crafted cultural display',
    hierarchy:
      'Title carries crafted character and leads warmly; supporting text stays simple and clear so ornament never blocks reading.',
    letterSpacing: 'Rhythmic, comfortable tracking that suits the crafted forms; clear spacing on details.',
    textEffects: [
      'A warm earthy gold gradient runs diagonally across the letter strokes, as if gilded with natural pigment or turmeric-tinged gold — rich but not garish',
      'The title lockup is flanked by a single pair of traditional ornament elements (a thin divider rule, a small floral motif, or a decorative bracket) — one pair only, never overwhelming the text',
    ],
    supportingTextStyle: 'Supporting text in a clean, simple sans/serif — the calm counterpoint to the crafted title.',
    avoid: ['over-ornamental unreadable text', 'sterile corporate styling'],
  },
  'tech-futuristic': {
    id: 'tech-futuristic',
    label: 'Tech futuristic',
    titleTreatment:
      'Futuristic tech title: sharp geometric lettering with subtle chrome or precise glow and digital precision — clean, advanced, and confident.',
    fontDirection:
      'Each letter is a PRECISION GEOMETRIC FORM — constructed with exact angles, minimal curves (only where structurally necessary), and ultra-clean terminals as if machined from aerospace-grade metal. The overall impression is a technical blueprint or circuit schematic: clinical, forward-looking, zero organic variation. Every character is engineered, not drawn.',
    fontShort: 'sharp geometric tech display',
    hierarchy:
      'Title leads with precise geometry; tight, exact alignment; clear, machined levels of hierarchy.',
    letterSpacing: 'Precise, slightly wide tracking; exact, grid-locked alignment.',
    textEffects: [
      'Each letter has a sharp metallic rim: a thin specular highlight line along the top-left edge, as if the character is fabricated from brushed aluminium — no soft glow, only a precision edge',
      'A crisp 1–2px luminous edge traces the letter outline, suggesting a neon tube or laser-cut indicator light — precision only, no soft diffuse glow spreading beyond the letter',
    ],
    supportingTextStyle: 'Supporting text in a clean technical sans — exact and legible.',
    avoid: ['random sci-fi clutter', 'noisy glitch overload'],
  },
}

/** Human label for a personality (preview / summary). */
export function personalityLabel(p: HeadlinePersonality): string {
  return TYPOGRAPHY_RECIPES[p].label
}

// ----------------------------------------------------------------------------
// Affinity tables — which signals vote for which personality.
// ----------------------------------------------------------------------------

/** Explicit background-style id → personality (keyword fallback covers the rest). */
const STYLE_PERSONALITY: Record<string, HeadlinePersonality> = {
  'movie-keyart': 'cinematic-title',
  advertising: 'cinematic-title',
  'double-exposure': 'cinematic-title',
  dark: 'cinematic-title',
  luxury: 'luxury-display',
  product: 'luxury-display',
  'art-deco': 'luxury-display',
  'spotlight-event': 'festival-bold',
  festive: 'festival-bold',
  patriotic: 'festival-bold',
  'bw-editorial': 'editorial-condensed',
  typographic: 'editorial-condensed',
  split: 'editorial-condensed',
  collage: 'editorial-condensed',
  minimal: 'minimal-modern',
  monoline: 'minimal-modern',
  glassmorphism: 'tech-futuristic',
  varsity: 'youthful-pop',
  collegiate: 'youthful-pop',
  'campus-doodle': 'youthful-pop',
  comic: 'youthful-pop',
  'pop-modern': 'youthful-pop',
  'photo-pop': 'youthful-pop',
  naive: 'youthful-pop',
  'temple-mural': 'cultural-crafted',
  gond: 'cultural-crafted',
  mandala: 'cultural-crafted',
  'folk-art': 'cultural-crafted',
  watercolor: 'cultural-crafted',
  'tech-hud': 'tech-futuristic',
  vaporwave: 'tech-futuristic',
  neon: 'tech-futuristic',
  isometric: 'tech-futuristic',
  geometric: 'institutional-premium',
  'premium-institutional': 'institutional-premium',
  'institutional-premium': 'institutional-premium',
}

/** Map any style id → personality (explicit table first, then keyword inference). */
function styleToPersonality(id: string): HeadlinePersonality | null {
  const explicit = STYLE_PERSONALITY[id]
  if (explicit) return explicit
  const s = id.toLowerCase()
  if (/institution|official|corporate|govern/.test(s)) return 'institutional-premium'
  if (/cinema|movie|keyart|noir|dramatic|theatrical/.test(s)) return 'cinematic-title'
  if (/luxur|premium|gold|opulent|gala|couture/.test(s)) return 'luxury-display'
  if (/minimal|mono|swiss|simple/.test(s)) return 'minimal-modern'
  if (/festiv|spotlight|carnival|celebrat|patriot/.test(s)) return 'festival-bold'
  if (/editorial|magazine|typograph|split|^bw/.test(s)) return 'editorial-condensed'
  if (/varsity|collegi|campus|comic|\bpop\b|doodle|naive/.test(s)) return 'youthful-pop'
  if (/tech|hud|neon|vapor|cyber|iso|geometric|glass/.test(s)) return 'tech-futuristic'
  if (/temple|gond|mandala|folk|kolam|cultural|mural|watercolor|deco/.test(s)) return 'cultural-crafted'
  return null
}

const DOMAIN_PERSONALITY: Record<DesignDomain, HeadlinePersonality | null> = {
  beauty: 'luxury-display',
  education: 'youthful-pop',
  healthcare: 'institutional-premium',
  'road-safety': 'institutional-premium',
  sports: 'youthful-pop',
  cultural: 'cultural-crafted',
  technology: 'tech-futuristic',
  leadership: 'institutional-premium',
  official: 'institutional-premium',
  general: null,
}

const EVENT_KEYWORD_PERSONALITY: Array<{ re: RegExp; p: HeadlinePersonality }> = [
  { re: /\b(fresher|orientation|annual\s*day|college\s*day|cultural\s*night|carnival|fest(?:ival)?|celebration|farewell|talent|reunion|fun\s*fair)\b/i, p: 'festival-bold' },
  { re: /\b(conference|summit|symposium|conclave|seminar|convocation|inauguration|valedictory)\b/i, p: 'institutional-premium' },
  { re: /\b(diwali|deepavali|pongal|onam|navratri|temple|kolam|rangoli|classical\s*dance)\b/i, p: 'cultural-crafted' },
  { re: /\b(hackathon|innovation|tech\s*fest|coding|robotics|cyber|ai\s*summit)\b/i, p: 'tech-futuristic' },
  { re: /\b(luxury|premium|gala|bridal|fashion|elegance|couture)\b/i, p: 'luxury-display' },
  { re: /\b(magazine|editorial|cover\s*story)\b/i, p: 'editorial-condensed' },
]

const FAMILY_PERSONALITY: Partial<Record<EventFamily, HeadlinePersonality>> = {
  celebration: 'festival-bold',
  student: 'youthful-pop',
  conference: 'institutional-premium',
  official: 'institutional-premium',
  greeting: 'cultural-crafted',
}

const MOODSTYLE_PERSONALITY: Array<{ re: RegExp; p: HeadlinePersonality }> = [
  { re: /\b(cinematic|dramatic|theatrical|epic)\b/i, p: 'cinematic-title' },
  { re: /\b(luxur(?:y|ious)|premium|elegant|sophisticated|opulent|glam)\b/i, p: 'luxury-display' },
  { re: /\b(minimal(?:ist)?|clean|simple|restrained)\b/i, p: 'minimal-modern' },
  { re: /\b(festive|celebratory|joyful|vibrant)\b/i, p: 'festival-bold' },
  { re: /\b(editorial|magazine)\b/i, p: 'editorial-condensed' },
  { re: /\b(futuristic|tech|digital|cyber|neon)\b/i, p: 'tech-futuristic' },
  { re: /\b(cultural|traditional|handcrafted|folk|ethnic)\b/i, p: 'cultural-crafted' },
  { re: /\b(youthful|playful|energetic|\bfun\b|\bpop\b)\b/i, p: 'youthful-pop' },
]

/** Stable tie-break order when two personalities score equally (and neither is the lead). */
const PRIORITY: HeadlinePersonality[] = [
  'cinematic-title',
  'luxury-display',
  'festival-bold',
  'editorial-condensed',
  'institutional-premium',
  'cultural-crafted',
  'youthful-pop',
  'tech-futuristic',
  'minimal-modern',
]

// ----------------------------------------------------------------------------
// Selection
// ----------------------------------------------------------------------------

export interface TypographyPlanInput {
  /** Ordered style stack (1st = lead) from s06. */
  styleStack: { id: string; label: string }[]
  domain: DesignDomain
  renderingMode: RenderingMode
  eventFamily: EventFamily
  /** eventName + tagline + description (for keyword votes). */
  briefText: string
  /** parsedIdea.typographyRequests (font names / role phrases). */
  typographyRequests: string[]
  /** parsedIdea.moodRequests. */
  moodRequests: string[]
  /** parsedIdea.styleRequests. */
  styleRequests: string[]
  /** parsedIdea.textEffectsRequests (e.g. "50% stroke"). */
  textEffectsRequests: string[]
  /** parsedIdea.avoidRequests. */
  avoidRequests: string[]
  colorPlan: ColorPlan
}

function selectPersonalities(
  input: TypographyPlanInput
): { primary: HeadlinePersonality; blend: HeadlinePersonality[] } {
  const votes = new Map<HeadlinePersonality, number>()
  const add = (p: HeadlinePersonality | null | undefined, w: number) => {
    if (p) votes.set(p, (votes.get(p) ?? 0) + w)
  }

  const leadP = input.styleStack[0] ? styleToPersonality(input.styleStack[0].id) : null
  add(leadP, 4)
  for (const s of input.styleStack.slice(1)) add(styleToPersonality(s.id), 2)

  add(DOMAIN_PERSONALITY[input.domain], 1)
  for (const { re, p } of EVENT_KEYWORD_PERSONALITY) if (re.test(input.briefText)) add(p, 2)
  add(FAMILY_PERSONALITY[input.eventFamily], 1)

  const moodStyleText = [...input.moodRequests, ...input.styleRequests].join(' ')
  for (const { re, p } of MOODSTYLE_PERSONALITY) if (re.test(moodStyleText)) add(p, 2)

  if (votes.size === 0) {
    const fallback: HeadlinePersonality =
      input.renderingMode === 'engine_exact' ? 'institutional-premium' : 'editorial-condensed'
    return { primary: fallback, blend: [fallback] }
  }

  const sorted = [...votes.entries()].sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1]
    if (leadP && a[0] === leadP) return -1
    if (leadP && b[0] === leadP) return 1
    return PRIORITY.indexOf(a[0]) - PRIORITY.indexOf(b[0])
  })

  const primary = sorted[0][0]
  const second = sorted[1]
  const secondary = second && second[1] >= 2 && second[0] !== primary ? second[0] : undefined
  return { primary, blend: secondary ? [primary, secondary] : [primary] }
}

function toTypographyMode(rm: RenderingMode): TypographyMode {
  if (rm === 'ai_native') return 'ai-native-display'
  if (rm === 'hybrid_shape') return 'hybrid-text-zones'
  if (rm === 'engine_exact') return 'engine-exact'
  return 'ai-native-display'
}

/** Defensive colour-role read (v2 `dominant` or legacy `dominantColor`). */
function role(plan: ColorPlan, r: 'dominant' | 'support' | 'accent' | 'neutral'): string {
  const p = plan as unknown as Record<string, unknown>
  const v2 = p[r]
  const legacy = p[`${r}Color`]
  return (typeof v2 === 'string' && v2) || (typeof legacy === 'string' && legacy) || ''
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const i of items) {
    const t = i.trim()
    if (t && !seen.has(t.toLowerCase())) {
      seen.add(t.toLowerCase())
      out.push(t)
    }
  }
  return out
}

function layoutRelationshipFor(mode: TypographyMode): string {
  if (mode === 'hybrid-text-zones') {
    return 'Design beautiful typographic containers and title shapes integrated with the scene; leave clean, premium lockup zones for the exact copy — elegant designed containers, never generic UI cards.'
  }
  if (mode === 'engine-exact') {
    return 'The engine sets the exact copy; style the title backing/lockup so it reads as DESIGNED (premium container, scene-integrated) with clean space reserved for precise text.'
  }
  return 'Render the title AS PART OF the poster artwork — integrated with the scene lighting, depth and perspective; letters catch highlights and cast soft shadows that match the scene; never a flat pasted-on overlay.'
}

function colorTreatmentFor(plan: ColorPlan): string {
  const accent = role(plan, 'accent')
  const neutral = role(plan, 'neutral')
  const gradient = (plan as unknown as { gradientTokens?: unknown }).gradientTokens
  const gradientBits =
    Array.isArray(gradient) && gradient.length
      ? ` (gradient ${(gradient as string[]).filter((x) => typeof x === 'string').join(' → ')})`
      : ''
  const strategy = (plan as unknown as { textColorStrategy?: unknown }).textColorStrategy
  const strategyBit = typeof strategy === 'string' && strategy.trim() ? ` ${strategy.trim()}.` : ''
  const titleColor = accent || role(plan, 'support') || '#FFFFFF'
  const bodyColor = neutral || '#FFFFFF'
  return `Title in ${titleColor}${gradientBits}; supporting text in ${bodyColor}; keep text colour integrated with the scene lighting for legibility.${strategyBit}`.trim()
}

/**
 * Build the designed TypographyPlan from the resolved pipeline signals.
 */
export function buildTypographyPlan(input: TypographyPlanInput): TypographyPlan {
  const typographyMode = toTypographyMode(input.renderingMode)
  const { primary, blend } = selectPersonalities(input)
  const primaryRecipe = TYPOGRAPHY_RECIPES[primary]
  const secondaryRecipe = blend[1] ? TYPOGRAPHY_RECIPES[blend[1]] : undefined

  // Title treatment — primary recipe, augmented with the secondary's voice for blends.
  const titleTreatment = secondaryRecipe
    ? `${primaryRecipe.titleTreatment} Blend in ${secondaryRecipe.label.toLowerCase()} qualities: ${secondaryRecipe.titleTreatment}`
    : primaryRecipe.titleTreatment

  // Font direction — honour the user's named fonts (described by personality), else the recipe default.
  const roles = resolveTypographyRoles(input.typographyRequests)
  const userFontRoles: TypographyFontRoles | undefined =
    roles.title || roles.general || roles.detail
      ? { title: roles.title, general: roles.general, detail: roles.detail }
      : undefined
  const userFontsHonored = !!userFontRoles

  let fontDirection: string
  if (userFontRoles) {
    const parts: string[] = []
    if (roles.title) parts.push(`Main title: ${roles.title}-style ${describeFont(roles.title)}`)
    if (roles.general) parts.push(`General/body text: ${roles.general}-style ${describeFont(roles.general)}`)
    if (roles.detail) parts.push(`Date/venue details: ${roles.detail}-style ${describeFont(roles.detail)}`)
    // Keep the chosen personality's flavour so user fonts still read as a designed poster title.
    fontDirection = `${parts.join('. ')}. Render these as ${primaryRecipe.label.toLowerCase()} poster lettering — describe the letterforms by personality, not as a plain webfont.`
  } else {
    fontDirection = primaryRecipe.fontDirection
  }

  // Strip a leading "text effect(s):" label the parser may keep on a raw request,
  // so the Gemini block reads "50% stroke" rather than "Text Effects: 50% stroke".
  const cleanedEffectRequests = input.textEffectsRequests
    .map((e) => e.replace(/^\s*text\s*effects?\s*:\s*/i, '').trim())
    .filter(Boolean)
  const textEffects = dedupe([...primaryRecipe.textEffects, ...cleanedEffectRequests])
  const avoid = dedupe([...primaryRecipe.avoid, ...TYPOGRAPHY_ANTIPATTERNS, ...input.avoidRequests])

  return {
    typographyMode,
    headlinePersonality: primary,
    personalityBlend: blend,
    titleTreatment,
    fontDirection,
    hierarchy: primaryRecipe.hierarchy,
    letterSpacing: primaryRecipe.letterSpacing,
    textEffects,
    supportingTextStyle: primaryRecipe.supportingTextStyle,
    layoutRelationship: layoutRelationshipFor(typographyMode),
    colorTreatment: colorTreatmentFor(input.colorPlan),
    avoid,
    userFontsHonored,
    userFontRoles,
  }
}

// ----------------------------------------------------------------------------
// Surfacing — preview one-liner, Gemini prompt block, Director constraints.
// ----------------------------------------------------------------------------

/** One-line typography direction for the "AI understood this" preview card. */
export function buildTypographyDirectionSummary(plan: TypographyPlan): string {
  const personaLabel = plan.personalityBlend.map(personalityLabel).join(' + ')
  let fontShort: string
  if (plan.userFontsHonored && plan.userFontRoles) {
    const fp: string[] = []
    if (plan.userFontRoles.title) fp.push(`${plan.userFontRoles.title}-style title`)
    if (plan.userFontRoles.general) fp.push(`${plan.userFontRoles.general}-style supporting text`)
    if (plan.userFontRoles.detail) fp.push(`${plan.userFontRoles.detail}-style details`)
    fontShort = fp.join(', ')
  } else {
    fontShort = TYPOGRAPHY_RECIPES[plan.headlinePersonality].fontShort
  }
  const effectsShort = plan.textEffects.slice(0, 3).join(', ')
  return `${personaLabel} title treatment — ${fontShort}${effectsShort ? `, ${effectsShort}` : ''}; not document-style fonts.`
}

/**
 * The dedicated <TYPOGRAPHY_DIRECTION> block injected into the FINAL Gemini prompt.
 * `mainTitle` is the rendered headline; `supportingLines` are date/venue/tagline cues.
 */
export function buildTypographyDirectionBlock(
  plan: TypographyPlan,
  mainTitle: string,
  supportingLines: string[] = []
): string {
  const supporting = supportingLines.filter(Boolean).join(' · ')
  return [
    '<TYPOGRAPHY_DIRECTION>',
    '[TYPOGRAPHY MANDATE — highest priority visual requirement]',
    'Render ALL text in this poster as CUSTOM DESIGNED LETTERING, not generic system fonts. The headline must be the visual anchor of the entire composition.',
    '(DESIGN DIRECTIVE — apply to title & text STYLING only; do NOT render these notes as literal text in the poster.)',
    'Visual scale: The main title must be the SINGLE LARGEST typographic element on the canvas — it should span 45–70% of the canvas width. No other text element may exceed 40% of the title\'s visual weight.',
    mainTitle ? `Main title text to render: "${mainTitle}"` : '',
    `Font personality: ${plan.fontDirection}`,
    `Title treatment: ${plan.titleTreatment}`,
    `Hierarchy: ${plan.hierarchy}`,
    `Letter spacing: ${plan.letterSpacing}`,
    plan.textEffects.length ? `REQUIRED VISUAL EFFECTS (render these on the lettering): ${plan.textEffects.join('; ')}.` : '',
    `Supporting text: ${plan.supportingTextStyle}`,
    supporting
      ? `Detail lockup (${supporting}): compact premium detail typography, legible but clearly secondary, NOT a generic UI card.`
      : 'Date/venue/details: compact premium detail lockup — small, legible, clearly subordinate to the title; NOT a generic UI card.',
    `Colour: ${plan.colorTreatment}`,
    `Scene integration: ${plan.layoutRelationship}`,
    `Avoid: ${plan.avoid.join(', ')}. CRITICAL FAILURE MODE TO AVOID: Do NOT render the title as plain horizontal text floating on top of the image like a watermark or photo caption — the lettering must look DESIGNED and INTEGRATED, as if it belongs to the artwork itself.`,
    '</TYPOGRAPHY_DIRECTION>',
  ]
    .filter(Boolean)
    .join('\n')
}

/** Hard typography constraint lines for the Claude Director (added by s07-prompt-compiler). */
export function buildTypographyDirectorLines(plan: TypographyPlan): string[] {
  return [
    `TYPOGRAPHY (designed poster lettering, NOT document text) — personality: ${plan.personalityBlend.map(personalityLabel).join(' + ')}.`,
    `TITLE: ${plan.titleTreatment} It MUST be visually dominant and memorable.`,
    `FONTS: ${plan.fontDirection}`,
    `HIERARCHY: ${plan.hierarchy}`,
    plan.textEffects.length ? `TEXT EFFECTS (controlled): ${plan.textEffects.join('; ')}.` : '',
    `SUPPORTING TEXT: ${plan.supportingTextStyle}`,
    `Type must integrate with the scene lighting and match the chosen visual style and colour plan.`,
    `TYPOGRAPHY — DO NOT: ${plan.avoid.join('; ')}.`,
  ].filter(Boolean)
}

// ----------------------------------------------------------------------------
// Pre-generation typography audit (the plan-level "typography critic").
// ----------------------------------------------------------------------------

/**
 * Validate that the PLAN commits to designed poster typography. This is deterministic
 * (plan-level, not image-level): it guards that the direction we hand the model satisfies
 * the typography checklist — dominant title, controlled effects, style/domain-matched
 * voice, document-look forbidden, and user fonts honoured when requested.
 */
export function auditTypographyPlan(plan: TypographyPlan): TypographyAudit {
  const avoidText = plan.avoid.join(' ').toLowerCase()
  const checks: { label: string; ok: boolean }[] = [
    { label: 'title is visually dominant', ok: /dominant|leads|largest|commanding|central/i.test(plan.hierarchy + ' ' + plan.titleTreatment) },
    { label: 'title feels poster-designed (display treatment)', ok: /display|lettering|treatment|cinematic|lockup|crafted/i.test(plan.titleTreatment) },
    { label: 'a headline personality is assigned', ok: plan.personalityBlend.length >= 1 },
    { label: 'supporting text is secondary', ok: /support|secondary|quiet|smaller|tertiary|whisper/i.test(plan.supportingTextStyle + ' ' + plan.hierarchy) },
    { label: 'effects are controlled (not excessive)', ok: plan.textEffects.length <= 4 },
    { label: 'document-like typography is forbidden', ok: /document|powerpoint|arial|calibri|default/.test(avoidText) },
    { label: 'type integrates with the scene', ok: /scene|lighting|integrat|artwork|depth/i.test(plan.layoutRelationship) },
    { label: 'user fonts honoured when requested', ok: !plan.userFontsHonored || /-style/i.test(plan.fontDirection) },
  ]
  const okCount = checks.filter((c) => c.ok).length
  const score = Number((okCount / checks.length).toFixed(2))
  const notes: string[] = []
  if (plan.userFontsHonored && plan.userFontRoles) {
    const named = [plan.userFontRoles.title, plan.userFontRoles.general, plan.userFontRoles.detail].filter(Boolean)
    if (named.length) notes.push(`user fonts honoured: ${named.join(', ')}`)
  }
  for (const c of checks) if (!c.ok) notes.push(`needs: ${c.label}`)
  return { score, pass: score >= 0.7, checks, notes }
}
