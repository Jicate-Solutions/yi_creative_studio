/**
 * Designer Pipeline — natural colour-name support.
 *
 * Designers type colours in words ("Magenta", "Gold gradient", "Rose gold"), but the
 * colour-config path only accepts hex and silently falls back to Yi brand colours for
 * anything else. This module normalises natural colour names / gradients into hex +
 * role tokens so the Designer Color Theory can honour them instead of falling back.
 */

interface NamedColor {
  /** Representative hex. */
  hex: string
  /** Premium / metallic tones that imply a "luxury" palette. */
  luxury?: boolean
  /**
   * Multi-stop gradient stops for colours that ARE a gradient by nature (e.g. "gold").
   * When a request says "<name> gradient" and the base colour defines `gradient`, the
   * resolved entry carries these stops; otherwise a two-stop gradient is synthesised.
   */
  gradient?: string[]
}

/**
 * Canonical colour vocabulary. Multi-word keys (e.g. "rose gold") are matched before
 * single words so "rose gold" never collapses to "gold".
 */
const NAMED_COLORS: Record<string, NamedColor> = {
  // The exact mappings requested by the designer (task #3).
  magenta: { hex: '#D0006F' },
  'hot pink': { hex: '#FF1493' },
  fuchsia: { hex: '#FF00FF' },
  gold: { hex: '#D4AF37', luxury: true, gradient: ['#D4AF37', '#F7D774', '#FFF1A8'] },
  'rose gold': { hex: '#B76E79', luxury: true, gradient: ['#B76E79', '#E0BFB8', '#F7E7CE'] },
  champagne: { hex: '#F7E7CE', luxury: true },
  'luxury black': { hex: '#080808', luxury: true },
  black: { hex: '#0A0A0A' },
  ivory: { hex: '#FFFFF0' },
  white: { hex: '#FFFFFF' },
  emerald: { hex: '#046307', luxury: true },
  navy: { hex: '#001F3F' },
  burgundy: { hex: '#800020', luxury: true },
  silver: { hex: '#C0C0C0', luxury: true, gradient: ['#C0C0C0', '#E8E8E8', '#A8A8A8'] },
  'royal blue': { hex: '#4169E1' },
  'deep purple': { hex: '#301934', luxury: true },
  maroon: { hex: '#800000', luxury: true },
  cream: { hex: '#FFFDD0' },
  // Common extras so everyday colour words also resolve.
  red: { hex: '#E11D48' },
  crimson: { hex: '#DC143C' },
  blue: { hex: '#2563EB' },
  'sky blue': { hex: '#38BDF8' },
  teal: { hex: '#14B8A6' },
  turquoise: { hex: '#40E0D0' },
  green: { hex: '#16A34A' },
  olive: { hex: '#6B7A3A' },
  yellow: { hex: '#F4C430' },
  mustard: { hex: '#D4A017' },
  orange: { hex: '#F97316' },
  coral: { hex: '#FF6F61' },
  peach: { hex: '#FFB7A0' },
  pink: { hex: '#EC4899' },
  purple: { hex: '#7C3AED' },
  violet: { hex: '#8B5CF6' },
  lavender: { hex: '#B57EDC' },
  brown: { hex: '#6B4423' },
  bronze: { hex: '#CD7F32', luxury: true, gradient: ['#CD7F32', '#E6A85C', '#A86B2D'] },
  copper: { hex: '#B87333', luxury: true },
  platinum: { hex: '#E5E4E2', luxury: true, gradient: ['#E5E4E2', '#FFFFFF', '#C7C6C4'] },
  charcoal: { hex: '#36454F' },
  grey: { hex: '#9CA3AF' },
  gray: { hex: '#9CA3AF' },
  beige: { hex: '#E8DCC4' },
}

/** Keys sorted longest-first so multi-word names win (e.g. "rose gold" before "gold"). */
const COLOR_KEYS = Object.keys(NAMED_COLORS).sort((a, b) => b.length - a.length)

const GRADIENT_RE = /\bgradient\b/i

/**
 * Mood / palette words → an ORDERED list of canonical colour names. A single mood word
 * like "luxury" expands into a ready-made palette so designers can type a vibe instead
 * of enumerating hexes. Matched only when no concrete colour name is present in the same
 * fragment (concrete names always win).
 */
const MOOD_PALETTES: Record<string, string[]> = {
  luxury: ['luxury black', 'gold', 'champagne'],
  premium: ['luxury black', 'gold', 'ivory'],
  elegant: ['ivory', 'rose gold', 'charcoal'],
  royal: ['deep purple', 'gold', 'cream'],
  regal: ['burgundy', 'gold', 'cream'],
  festive: ['magenta', 'gold', 'white'],
  vibrant: ['magenta', 'orange', 'gold'],
  earthy: ['olive', 'brown', 'cream'],
  pastel: ['peach', 'lavender', 'cream'],
  monochrome: ['black', 'grey', 'white'],
  metallic: ['gold', 'silver', 'bronze'],
}

const MOOD_KEYS = Object.keys(MOOD_PALETTES).sort((a, b) => b.length - a.length)

/** A resolved colour entry. */
export interface NormalizedColorEntry {
  name: string
  hex: string
  isGradient: boolean
  luxury: boolean
  /**
   * Multi-stop gradient tokens when this entry is a gradient (>=2 stops), else undefined.
   * E.g. "gold gradient" → ["#D4AF37","#F7D774","#FFF1A8"].
   */
  gradientTokens?: string[]
}

export interface NormalizedColors {
  /** Ordered resolved colours (1st = dominant). */
  entries: NormalizedColorEntry[]
  dominantHex: string
  supportHex: string
  accentHex: string
  /** Base colour names without "gradient", e.g. ["magenta", "gold"]. */
  names: string[]
  /** Any entry was a gradient request. */
  hasGradient: boolean
  /**
   * Aggregate gradient tokens — the multi-stop stops of the FIRST gradient entry, so a
   * consumer can apply "the requested gradient" without re-scanning entries. Undefined
   * when no entry is a gradient.
   */
  gradientTokens?: string[]
  /** Any entry is a premium/metallic tone → a "luxury" palette. */
  isLuxury: boolean
  /** Designer-facing direction, e.g. "magenta + gold luxury palette". */
  direction: string
}

/** Build a synthetic 2-stop gradient around a base hex when no named gradient exists. */
function synthGradient(hex: string): string[] {
  return [hex, hex]
}

/**
 * Find canonical colour requests (and mood palettes) inside a free-text fragment.
 * Returns request strings (with a trailing "gradient" preserved when present) ready for
 * normalizeColorRequests. Concrete colour names win; a mood word only expands when no
 * concrete colour was found in the fragment.
 */
export function matchColorNames(text: string): string[] {
  if (!text) return []
  const lower = text.toLowerCase()
  const isGradient = GRADIENT_RE.test(lower)
  const found: string[] = []
  const consumed: string[] = []
  for (const key of COLOR_KEYS) {
    const re = new RegExp(`\\b${key.replace(/\s+/g, '\\s+')}\\b`, 'i')
    if (re.test(lower) && !consumed.some((c) => c.includes(key))) {
      consumed.push(key)
      found.push(isGradient ? `${key} gradient` : key)
    }
  }
  if (found.length === 0) {
    for (const mood of MOOD_KEYS) {
      const re = new RegExp(`\\b${mood}\\b`, 'i')
      if (re.test(lower)) {
        return MOOD_PALETTES[mood].slice()
      }
    }
  }
  return found
}

/**
 * Resolve a single colour token to a hex string. Accepts:
 *  - a hex value ("#faf9f4" / "#fff") → returned unchanged
 *  - a known colour name ("Magenta") → its canonical hex
 *  - a "<name> gradient" phrase ("Gold gradient") → the base colour's hex
 * Returns null when the token resolves to neither hex nor a known name.
 */
export function colorNameToHex(token: string | null | undefined): string | null {
  if (!token) return null
  const trimmed = token.trim()
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(trimmed)) return trimmed
  const entry = resolveOne(trimmed)
  return entry ? entry.hex : null
}

/**
 * Resolve a single colour token to its multi-stop gradient tokens. Returns the named
 * gradient stops for known gradient colours (e.g. "gold gradient" → 3 stops), or null
 * when the token is unknown or has no gradient definition.
 */
export function colorNameToGradient(token: string | null | undefined): string[] | null {
  if (!token) return null
  const entry = resolveOne(token.trim())
  return entry?.gradientTokens ?? null
}

/** Resolve a single request string ("Gold gradient") to a canonical entry. */
function resolveOne(request: string): NormalizedColorEntry | null {
  const lower = request.toLowerCase().trim()
  if (!lower) return null
  const isGradient = GRADIENT_RE.test(lower)
  const base = lower.replace(GRADIENT_RE, '').trim()
  const key = COLOR_KEYS.find((k) => new RegExp(`\\b${k.replace(/\s+/g, '\\s+')}\\b`).test(base))
  if (!key) return null
  const named = NAMED_COLORS[key]
  // Gradient tokens: prefer a named multi-stop gradient; otherwise synthesise a 2-stop
  // gradient from the base hex when a gradient was explicitly requested.
  let gradientTokens: string[] | undefined
  if (named.gradient && named.gradient.length >= 2) {
    gradientTokens = named.gradient.slice()
  } else if (isGradient) {
    gradientTokens = synthGradient(named.hex)
  }
  return {
    name: key,
    hex: named.hex,
    isGradient: isGradient || !!named.gradient,
    luxury: !!named.luxury,
    gradientTokens,
  }
}

/**
 * Normalise a list of natural colour requests into hex role tokens + a direction string.
 * Returns null when nothing resolves (so callers keep their brand fallback).
 */
export function normalizeColorRequests(requests: string[]): NormalizedColors | null {
  const entries: NormalizedColorEntry[] = []
  const seen = new Set<string>()
  for (const req of requests) {
    const e = resolveOne(req)
    if (e && !seen.has(e.name)) {
      seen.add(e.name)
      entries.push(e)
    }
  }
  if (entries.length === 0) return null

  const dominantHex = entries[0].hex
  const supportHex = entries[1]?.hex ?? entries[0].hex
  const accentHex = entries[2]?.hex ?? entries[1]?.hex ?? entries[0].hex
  const names = entries.map((e) => e.name)
  const hasGradient = entries.some((e) => e.isGradient)
  const gradientTokens = entries.find((e) => e.gradientTokens)?.gradientTokens
  const isLuxury = entries.some((e) => e.luxury)
  const direction = `${names.join(' + ')}${isLuxury ? ' luxury' : ''} palette`

  return {
    entries,
    dominantHex,
    supportHex,
    accentHex,
    names,
    hasGradient,
    gradientTokens,
    isLuxury,
    direction,
  }
}
