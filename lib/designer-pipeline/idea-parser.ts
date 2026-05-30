/**
 * Designer Pipeline — userVisualIdea parser.
 *
 * The user's free-text idea mixes very different requests:
 *   "add some makeup brush as bg texture, Oswald + Montserrat, magenta + gold, 50% stroke"
 * Treating the whole thing as the HERO is wrong (it made "add some makeup brush" the
 * subject). This parser splits the idea into role buckets so each request reaches the
 * right place — only genuine people/activity phrases become the mainSubject.
 */

import type { CreativeDirectives, ParsedIdea } from './contracts'
import { matchColorNames } from './color-names'

// ----------------------------------------------------------------------------
// Actor / subject extraction (shared with s01-user-bridge)
// ----------------------------------------------------------------------------

export const HONORIFICS = /^(?:dr|mr|mrs|ms|smt|shri|sri|prof|er|capt|col|adv)\.?$/i

/** Leading imperative the user tends to prefix an idea with ("Show …", "Depict …"). */
export const IDEA_IMPERATIVE_RE =
  /^(?:please\s+)?(?:show|depict|feature|create|design|illustrate|render|make|generate|draw|picture|visuali[sz]e)\s+/i

/** In a free-text idea the actor is the noun phrase BEFORE the first action verb / preposition. */
const IDEA_ACTION_BOUNDARY_RE =
  /\s+\b(?:helping|help|assisting|assist|wearing|wear|teaching|teach|guiding|guide|holding|hold|standing|performing|perform|doing|conducting|distributing|planting|cleaning|riding|crossing|walking|demonstrating|showing|near|at|in|on|with|beside|around|by|during|while|as)\b/i

/**
 * Normalise an actor phrase: keep ALL-CAPS acronyms ("JKKN"), lowercase descriptive
 * words ("Nursing Students" → "nursing students"), drop leading honorifics.
 */
export function normalizeActor(phrase: string): string {
  const tokens = phrase
    .trim()
    .split(/\s+/)
    .filter((t) => !HONORIFICS.test(t))
    .map((t) => (/^[A-Z0-9&.]{2,}$/.test(t) ? t : t.toLowerCase()))
  return tokens.join(' ').trim()
}

/**
 * Pull the lead actor out of a free-text fragment: strip the leading imperative, then
 * take everything before the first action verb / preposition.
 */
export function extractActorFromIdea(idea: string): string | null {
  if (!idea) return null
  const body = idea.replace(IDEA_IMPERATIVE_RE, '').trim()
  const boundary = body.search(IDEA_ACTION_BOUNDARY_RE)
  const head = (boundary > 0 ? body.slice(0, boundary) : body).trim()
  if (!head || head.split(/\s+/).length > 6) return null
  const norm = normalizeActor(head)
  return norm || null
}

// ----------------------------------------------------------------------------
// Request classifiers
// ----------------------------------------------------------------------------

/** Text effects on type — checked first (so "50% stroke" never reads as a colour). */
const TEXT_EFFECT_RE =
  /\b(\d+\s*%?\s*)?(stroke|outline|drop\s*shadow|inner\s*shadow|long\s*shadow|glow|neon\s*glow|emboss|bevel|extrude|3d\s*text|gradient\s*text|metallic\s*text|chrome|foil)\b/i

/**
 * Text-effect cue that needs a "text" / "title" / "font" anchor to count (so plain
 * "gold gradient" stays a colour but "gold gradient text" / "metallic title" is an effect).
 */
const TEXT_EFFECT_ANCHORED_RE =
  /\b(metallic|chrome|gold\s*gradient|gradient)\b[\s\S]*\b(text|title|headline|font|type|lettering)\b/i

/** Mood / tone requests — adjectives describing the feeling, not an object. */
const MOOD_RE =
  /\b(festive|celebratory|joyful|energetic|vibrant|premium|luxurious|luxury|elegant|sophisticated|calm|serene|minimal(?:ist)?|bold|dramatic|playful|fun|warm|cozy|professional|corporate|formal|modern|youthful|nostalgic|dreamy|moody|romantic|edgy|clean)\b/i

/** Art-direction / rendering style requests. */
const STYLE_RE =
  /\b(cinematic|photoreal(?:istic)?|flat\s*illustration|illustrat(?:ed|ion)|watercolou?r|hand[-\s]?drawn|sketch|vector|isometric|3d\s*render|pixel\s*art|retro|vintage|grunge|collage|paper\s*cut|line\s*art|low[-\s]?poly|gradient\s*mesh|glassmorphism|neon\s*noir|art\s*deco|bauhaus|memphis|risograph|claymation|anime|comic|pop\s*art|surreal)\b/i

/** Avoid / negative requests — "no X", "avoid X", "without X", "don't X". */
const AVOID_RE = /\b(no|avoid|without|don'?t|do\s*not|never|skip|exclude)\b/i

/** Explicit background-instruction cue (a full instruction, not just a motif word). */
const BG_INSTRUCTION_RE =
  /\b(backdrop|background)\b[\s\S]*\b(dark|light|soft|blurred|bokeh|gradient|studio|solid|plain|textured|abstract|night|sky|sunset|outdoor|indoor)\b/i

/** Known display/body/detail fonts (display strings; matched case-insensitively). */
const KNOWN_FONTS = [
  'Montserrat', 'Oswald', 'Open Sans', 'Poppins', 'Roboto', 'Lato', 'Inter',
  'Raleway', 'Nunito Sans', 'Nunito', 'Bebas Neue', 'Bebas', 'Anton',
  'Playfair Display', 'Playfair', 'Merriweather', 'Work Sans', 'DM Sans',
  'Source Sans Pro', 'Source Sans', 'PT Sans', 'Noto Sans', 'Futura', 'Gotham',
  'Archivo Black', 'Archivo', 'Teko', 'Fjalla One', 'Abril Fatface', 'Manrope',
  'Quicksand', 'Barlow', 'Rubik', 'Josefin Sans', 'Cinzel', 'Cormorant', 'Garamond',
]
const FONT_KEYS = [...KNOWN_FONTS].sort((a, b) => b.length - a.length)

/** Condensed/display fonts → title role. */
const TITLE_FONT_RE = /^(oswald|bebas|bebas neue|anton|teko|fjalla|archivo black|abril fatface|staatliches)$/i
/** Humanist / readable fonts → details role. */
const DETAIL_FONT_RE =
  /^(open sans|roboto|lato|inter|source sans|source sans pro|pt sans|noto sans|nunito|nunito sans|merriweather|garamond|cormorant)$/i

/** Background-motif / texture requests. */
const MOTIF_RE =
  /\b(background|backdrop|\bbg\b|texture|pattern|overlay|wallpaper|motif|watermark|border|frame)\b/i

/**
 * Decorative OBJECTS that are ornament, not the hero (festive/floral/border props). When a
 * clause is built only of these — with no person/role/activity word — it is a motif.
 */
const DECORATIVE_OBJECT_RE =
  /\b(diya|diyas|kolam|rangoli|lantern|lanterns|confetti|garland|garlands|marigold|flower|flowers|floral|petal|petals|fairy\s*lights|sparkle|sparkles|firework|fireworks|ornament|ornaments|swirl|swirls|ribbon|ribbons|leaf|leaves|vine|vines|mandala)\b/i

/** Human / role / actor words — their presence keeps a clause in the subject lane. */
const PERSON_WORD_RE =
  /\b(student|students|people|person|men|women|man|woman|child|children|kid|kids|team|staff|teacher|teachers|nurse|nurses|doctor|doctors|artist|artists|player|players|athlete|athletes|participant|participants|crowd|audience|family|families|worker|workers|rider|riders|commuter|commuters|performer|performers|volunteer|volunteers|guest|guests|chef|chefs|model|models|professional|professionals)\b/i

/**
 * Decorative-placement cues. When a clause places an object "in/as the background",
 * "as texture/pattern", "around" or "as decoration", that object is a MOTIF — never the
 * hero. This is the heart of subject-vs-motif separation.
 */
const DECORATIVE_PLACEMENT_RE =
  /\b(in\s+(?:the\s+)?(?:background|backdrop|bg)|as\s+(?:a\s+)?(?:background|backdrop|texture|pattern|overlay|watermark|decoration|border|frame)|around\s+the\s+(?:edges?|border|frame)|as\s+(?:bg|deco)\b|behind\b)\b/i

/** Layout / composition requests. */
const LAYOUT_RE =
  /\b(layout|grid|center(ed)?|centre(d)?|left[-\s]?align|right[-\s]?align|top|bottom|symmetr|asymmetr|margin|rule of thirds|split|two[-\s]?column|stacked|alignment)\b/i

/** Split the idea into clauses on separators that are genuine list boundaries. */
function splitClauses(idea: string): string[] {
  return idea
    .split(/[,;\n]|\.\s|\band\b|\bplus\b|\s\+\s|\s&\s|\bwith\b(?=\s+\d)/i)
    .map((c) => c.trim())
    .filter(Boolean)
}

function matchFonts(clause: string): string[] {
  const out: string[] = []
  for (const f of FONT_KEYS) {
    const re = new RegExp(`\\b${f.replace(/\s+/g, '\\s+')}\\b`, 'i')
    if (re.test(clause) && !out.some((o) => o.toLowerCase().includes(f.toLowerCase()))) out.push(f)
  }
  return out
}

/** Pick the motif ROLE word from the trailing role description. */
function roleWordFrom(rolePart: string): string {
  const p = rolePart.toLowerCase()
  if (/texture/.test(p)) return 'texture'
  if (/pattern/.test(p)) return 'pattern'
  if (/overlay/.test(p)) return 'overlay'
  if (/border|frame/.test(p)) return 'border'
  if (/decoration|deco\b/.test(p)) return 'decoration'
  return 'background'
}

/**
 * Turn a decorative clause into a normalised motif phrase:
 *   "add some makeup brush as bg texture"   → "makeup brush texture"
 *   "makeup brushes in the background"        → "makeup brushes background"
 *   "diya and kolam around the border"        → "diya and kolam border"
 */
function normalizeMotif(clause: string): string {
  let subjectPart = clause
  let roleWord = 'background'

  // "X as <role>" — subject is everything before "as".
  const asMatch = clause.match(/(.*?)\bas\b\s+(.*)/i)
  // "X in (the) background / around the border / behind …" — subject is before the cue.
  const placementMatch = clause.match(
    /(.*?)\b(?:in\s+(?:the\s+)?(?:background|backdrop|bg)|around\s+the\s+(?:edges?|border|frame)|behind)\b(.*)/i
  )

  if (asMatch) {
    subjectPart = asMatch[1]
    roleWord = roleWordFrom(asMatch[2])
  } else if (placementMatch) {
    subjectPart = placementMatch[1]
    roleWord = roleWordFrom(`${placementMatch[0]}`)
  } else {
    // No "as"/placement grammar — keep the motif role word the clause already names
    // ("kolam border" → border), defaulting to "background" only when none is present.
    roleWord = roleWordFrom(clause)
  }

  const core = subjectPart
    .replace(/^(add|use|include|with|put|place|set|make|show|feature)\s+/i, '')
    .replace(/\b(some|a|an|the)\b/gi, '')
    .replace(MOTIF_RE, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return `${core} ${roleWord}`.replace(/\s{2,}/g, ' ').trim()
}

/** Strip a leading imperative + filler so a subject clause reads as a clean actor phrase. */
function cleanSubjectClause(clause: string): string {
  return clause
    .replace(IDEA_IMPERATIVE_RE, '')
    .replace(/^(add|use|include|with|put|place|set|make)\s+/i, '')
    .trim()
}

// ----------------------------------------------------------------------------
// Public parser
// ----------------------------------------------------------------------------

/** An empty 10-bucket ParsedIdea (also used as the safe fallback elsewhere). */
export function emptyParsedIdea(): ParsedIdea {
  return {
    subjectIntent: [],
    visualMotifs: [],
    backgroundInstructions: [],
    colorRequests: [],
    typographyRequests: [],
    textEffectsRequests: [],
    layoutRequests: [],
    moodRequests: [],
    styleRequests: [],
    avoidRequests: [],
  }
}

export function parseVisualIdea(idea: string): ParsedIdea {
  const result = emptyParsedIdea()
  if (!idea || !idea.trim()) return result

  const clauses = splitClauses(idea)
  const subjectClauses: string[] = []

  for (const clause of clauses) {
    // 1. avoid / negative requests ("no clutter", "avoid neon") — claim first so the
    //    forbidden noun never leaks into another bucket.
    if (AVOID_RE.test(clause)) {
      result.avoidRequests.push(clause.trim())
      continue
    }
    // 2. text effects (before colour, so "50% stroke" / "gold gradient text" isn't a colour).
    if (TEXT_EFFECT_RE.test(clause) || TEXT_EFFECT_ANCHORED_RE.test(clause)) {
      result.textEffectsRequests.push(clause.trim())
      continue
    }
    // 3. typography (font names + roles).
    const fonts = matchFonts(clause)
    if (fonts.length) {
      result.typographyRequests.push(...fonts)
      continue
    }
    // 4. typographic role phrases without a named font ("luxury serif title", "bold headline").
    //    A clause that ALSO names a colour ("Font Colors: Gold gradient") is a colour
    //    request, not a font — defer it to the colour step below.
    if (
      /\b(title|headline|serif|sans|condensed|display|lettering|typeface|font\s+style|font\s+family)\b/i.test(
        clause
      ) &&
      matchColorNames(clause).length === 0
    ) {
      result.typographyRequests.push(clause.trim())
      continue
    }
    // 5. explicit background INSTRUCTIONS ("dark studio background", "soft bokeh backdrop").
    if (BG_INSTRUCTION_RE.test(clause)) {
      result.backgroundInstructions.push(clause.trim())
      continue
    }
    // 6. decorative-placement / decorative-object motifs. A clause is a motif when it
    //    states placement ("X in background", "X around the border"), names a motif role
    //    word (texture/pattern/border/frame…), OR is built from purely decorative objects
    //    (diya, kolam, garland…) with NO person/role word to make it a real subject.
    const isDecorativeObject =
      DECORATIVE_OBJECT_RE.test(clause) && !PERSON_WORD_RE.test(clause)
    if (DECORATIVE_PLACEMENT_RE.test(clause) || MOTIF_RE.test(clause) || isDecorativeObject) {
      result.visualMotifs.push(normalizeMotif(clause))
      continue
    }
    // 7. colours / gradients (after motif/effect so "gold gradient text" already left).
    const colors = matchColorNames(clause)
    if (colors.length) {
      result.colorRequests.push(...colors)
      continue
    }
    // 8. layout / composition.
    if (LAYOUT_RE.test(clause)) {
      result.layoutRequests.push(clause.trim())
      continue
    }
    // 9. art-direction / style.
    if (STYLE_RE.test(clause)) {
      result.styleRequests.push(clause.trim())
      continue
    }
    // 10. mood / tone (adjective-only descriptions).
    if (MOOD_RE.test(clause) && clause.trim().split(/\s+/).length <= 4) {
      result.moodRequests.push(clause.trim())
      continue
    }
    // otherwise it may describe the SUBJECT (people / activity / explicit hero).
    subjectClauses.push(clause)
  }

  // Subject intent — genuine people/activity/hero phrases only. Each subject clause is
  // cleaned and reduced to its actor phrase; a clause that yields no actor is still kept
  // as an explicit hero fragment so nothing real is dropped.
  const seen = new Set<string>()
  for (const clause of subjectClauses) {
    const cleaned = cleanSubjectClause(clause)
    if (!cleaned) continue
    const actor = extractActorFromIdea(cleaned) ?? cleaned
    const key = actor.toLowerCase()
    if (actor && !seen.has(key)) {
      seen.add(key)
      result.subjectIntent.push(actor)
    }
  }

  // Legacy single-phrase hero (s01/s02 still read subjectIdea).
  if (result.subjectIntent.length) result.subjectIdea = result.subjectIntent[0]

  return result
}

// ----------------------------------------------------------------------------
// Creative directives (typography roles + effects + layout) for Director + preview
// ----------------------------------------------------------------------------

function classifyFont(font: string): 'title' | 'detail' | 'general' {
  if (TITLE_FONT_RE.test(font)) return 'title'
  if (DETAIL_FONT_RE.test(font)) return 'detail'
  return 'general'
}

export interface TypographyRoles {
  /** Display/condensed font for the big headline (Gemini renders this). */
  title?: string
  /** Primary body/general font. */
  general?: string
  /** Humanist/readable font for small factual details (date, venue, etc.). */
  detail?: string
  /** Any extra fonts beyond the three core roles. */
  accents: string[]
}

/** Assign user fonts to roles by their typographic character (title/general/detail). */
export function resolveTypographyRoles(fonts: string[]): TypographyRoles {
  let title: string | undefined
  let general: string | undefined
  let detail: string | undefined
  const leftovers: string[] = []

  for (const f of fonts) {
    const cat = classifyFont(f)
    if (cat === 'title' && !title) title = f
    else if (cat === 'detail' && !detail) detail = f
    else if (cat === 'general' && !general) general = f
    else leftovers.push(f)
  }
  if (!general && leftovers.length) general = leftovers.shift()

  return { title, general, detail, accents: leftovers }
}

/** Assign role labels: "Oswald title, Montserrat general, Open Sans details". */
export function buildTypographyDirectives(fonts: string[]): string[] {
  const { title, general, detail, accents } = resolveTypographyRoles(fonts)
  const out: string[] = []
  if (title) out.push(`${title} title`)
  if (general) out.push(`${general} general`)
  if (detail) out.push(`${detail} details`)
  for (const l of accents) out.push(`${l} accent`)
  return out
}

/**
 * Pick the best font for the deterministic factual overlay (date/venue/details).
 * Prefers the readable "detail" font, then "general", then the "title" font — returns
 * undefined when the user named no fonts, so the overlay keeps its AI default.
 */
export function overlayFontFromTypography(fonts: string[]): string | undefined {
  const { detail, general, title } = resolveTypographyRoles(fonts)
  return detail ?? general ?? title
}

export function buildCreativeDirectives(parsed: ParsedIdea): CreativeDirectives {
  return {
    typography: buildTypographyDirectives(parsed.typographyRequests),
    textEffects: parsed.textEffectsRequests,
    layout: parsed.layoutRequests,
  }
}
