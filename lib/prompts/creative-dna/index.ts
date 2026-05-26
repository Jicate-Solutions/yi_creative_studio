/**
 * Creative DNA — Curated archetype library (v53.0 spike)
 *
 * Why this exists:
 * Even after the Subject Classifier correctly identifies what a poster is ABOUT
 * (person / activity / concept / product / place), the downstream pipeline still
 * collapses into a narrow band of generic defaults — "luxury Indian banquet hall
 * with chandeliers and emerald walls" for nearly every premium event, regardless
 * of whether the brief is a chairperson birthday tribute or a TED-style summit.
 *
 * A human designer wouldn't think that way. Given "Honoring our Chairperson",
 * a designer reaches for a concrete reference language — TIME 100 cover, Vogue
 * editorial, royal Indian dynasty portrait, Fortune annual report. Each one is
 * a complete visual world: lighting direction, palette discipline, what motifs
 * belong, what must be avoided. The DNA library puts those references into a
 * data file the pipeline can read and inject as a prompt hint.
 *
 * This is the DATA + SELECTOR layer only. It does NOT call any AI, does NOT
 * touch route.ts, and does NOT import from any pipeline file. The dependency
 * runs one-way: pipeline → creative-dna, never the reverse. Stream A wires
 * the consumer.
 */

import type {
  SubjectType,
  CompositionStrategy,
} from '@/lib/agents/subject-classifier'

import { EVENT_POSTER_PERSON_ARCHETYPES } from './event-poster-person'
import { EVENT_POSTER_ACTIVITY_ARCHETYPES } from './event-poster-activity'
import { EVENT_POSTER_CONCEPT_ARCHETYPES } from './event-poster-concept'
import { EVENT_POSTER_PRODUCT_ARCHETYPES } from './event-poster-product'
import { EVENT_POSTER_PLACE_ARCHETYPES } from './event-poster-place'

// ============================================================
// PUBLIC TYPES
// ============================================================

export type Formality = 'casual' | 'professional' | 'premium' | 'exclusive'
export type EnergyLevel = 'calm' | 'moderate' | 'high' | 'explosive'
/**
 * Cultural region affinity. Used to prevent visual mismatch — e.g. picking
 * a Bollywood-tribute archetype for a Tamil Nadu organization. Most archetypes
 * are tagged with the regions where they "read correctly"; archetypes without
 * a tag are considered region-neutral (pan-india / global).
 *
 * 'pan-india' = recognizably Indian but not regionally specific (TIME 100 style,
 * Vogue editorial, royal Indian motifs).
 * 'global' = no Indian cultural specificity at all (Apple keynote, TED title).
 */
export type CulturalRegion =
  | 'north-india'
  | 'south-india'
  | 'tamil-nadu'
  | 'kerala'
  | 'karnataka'
  | 'andhra-telangana'
  | 'pan-india'
  | 'global'

export interface CreativeArchetype {
  /** Lowercase-kebab-case unique id. Stable identifier — referenced by tests. */
  id: string
  /** Human-readable label (used in logs / debug panels). */
  name: string
  applicableTo: {
    /** Format ids from lib/config/creative-formats.ts (e.g. 'event_poster'). */
    formats: string[]
    subjectTypes: SubjectType[]
    strategies: CompositionStrategy[]
    /** Optional filter — background style ids from lib/config/background-styles.ts. */
    backgroundStyles?: string[]
    /** Optional formality bracket. */
    formalities?: Formality[]
    /** Optional energy bracket. */
    energies?: EnergyLevel[]
    /**
     * Optional cultural region affinity. When the caller passes a `region`, we
     * prefer archetypes whose `regions` array contains it OR contains
     * 'pan-india' / 'global'. Untagged archetypes are treated as 'pan-india'.
     */
    regions?: CulturalRegion[]
  }
  referenceLanguage: {
    /** 80-120 words of concrete scene description (hand-authored, evocative). */
    visualScene: string
    /** 3-5 specific decorative motifs to include. */
    decorativeMotifs: string[]
    /** 3-5 things the AI must NOT include. */
    avoid: string[]
    /** Concrete lighting direction (key light, fill, rim). */
    lightingDirection: string
    /** Palette discipline — base, accent, one highlight. */
    paletteApproach: string
  }
  /** 1-2 example briefs this archetype fits well — used for human review and tests. */
  exampleBriefs: string[]
}

export interface SelectArchetypeInput {
  formatId: string
  subjectType: SubjectType
  compositionStrategy: CompositionStrategy
  backgroundStyle?: string
  formality?: Formality
  energy?: EnergyLevel
  /**
   * Cultural region of the organization or brief. When provided, the selector
   * prefers archetypes tagged with this region (or 'pan-india' / 'global').
   * Strongly recommended — without it, a Tamil Nadu organization can end up
   * with a Bollywood archetype simply because Bollywood archetypes happen to
   * sort first in the candidate list.
   */
  region?: CulturalRegion
  /**
   * Optional — used as the seed for deterministic-but-varied picking when
   * multiple archetypes match. Pass the eventName (or any stable string)
   * so the same brief always picks the same archetype, but different briefs
   * pick different ones.
   */
  seed?: string
}

// ============================================================
// REGISTRY (combined from per-category files)
// ============================================================

export const ALL_ARCHETYPES: CreativeArchetype[] = [
  ...EVENT_POSTER_PERSON_ARCHETYPES,
  ...EVENT_POSTER_ACTIVITY_ARCHETYPES,
  ...EVENT_POSTER_CONCEPT_ARCHETYPES,
  ...EVENT_POSTER_PRODUCT_ARCHETYPES,
  ...EVENT_POSTER_PLACE_ARCHETYPES,
]

// ============================================================
// SELECTOR
// ============================================================

/**
 * Pick a single archetype for the given context.
 *
 * Filtering is progressive: we narrow by format → strategy → subject type,
 * then apply optional filters (backgroundStyle, formality, energy) only if
 * the archetype declares them. An archetype that omits an optional filter
 * is considered to match any value for that filter.
 *
 * If no archetype matches, returns `null`. The caller (Stream A wiring)
 * is expected to fall back to the current generic behavior — the DNA layer
 * augments, it does not gate.
 */
export function selectArchetype(input: SelectArchetypeInput): CreativeArchetype | null {
  const {
    formatId,
    subjectType,
    compositionStrategy,
    backgroundStyle,
    formality,
    energy,
    seed,
  } = input

  const { region } = input

  const baseCandidates = ALL_ARCHETYPES.filter((a) => {
    if (!a.applicableTo.formats.includes(formatId)) return false
    if (!a.applicableTo.subjectTypes.includes(subjectType)) return false
    if (!a.applicableTo.strategies.includes(compositionStrategy)) return false

    if (a.applicableTo.backgroundStyles && backgroundStyle) {
      if (!a.applicableTo.backgroundStyles.includes(backgroundStyle)) return false
    }
    if (a.applicableTo.formalities && formality) {
      if (!a.applicableTo.formalities.includes(formality)) return false
    }
    if (a.applicableTo.energies && energy) {
      if (!a.applicableTo.energies.includes(energy)) return false
    }
    return true
  })

  if (baseCandidates.length === 0) return null

  // v53.3: Region-aware filtering. If region is provided, prefer archetypes
  // tagged for that region (or 'pan-india' / 'global'). Archetypes with NO
  // regions tag are treated as 'pan-india' (broadly safe). Only fall back to
  // unfiltered candidates when no region-aware ones exist — prevents a Tamil
  // Nadu org getting a Bollywood archetype just because Bollywood sorts first.
  let candidates = baseCandidates
  if (region) {
    const regionAware = baseCandidates.filter((a) => {
      if (!a.applicableTo.regions || a.applicableTo.regions.length === 0) return true // untagged = pan-india
      if (a.applicableTo.regions.includes(region)) return true
      if (a.applicableTo.regions.includes('pan-india')) return true
      if (a.applicableTo.regions.includes('global')) return true
      return false
    })
    if (regionAware.length > 0) candidates = regionAware
  }

  if (candidates.length === 1) return candidates[0]

  const seedString = seed && seed.length > 0 ? seed : `${formatId}|${subjectType}|${compositionStrategy}`
  const idx = stableHash(seedString) % candidates.length
  return candidates[idx]
}

// ============================================================
// REGION DETECTION FROM ORG ADDRESS / METADATA
// ============================================================

/**
 * Best-effort region detection from a free-form org address string.
 * Used by route.ts to pass `region` into selectArchetype without requiring
 * a structured location field on the organization model.
 *
 * Returns undefined when no signal is found — selector then runs region-neutral.
 */
export function detectRegionFromAddress(address?: string | null): CulturalRegion | undefined {
  if (!address) return undefined
  const a = address.toLowerCase()

  // Tamil Nadu city/district signals (cover the major + JKKN catchment first)
  const tamilCities = [
    'tamil nadu', 'tamilnadu', 'chennai', 'coimbatore', 'madurai', 'tiruchirappalli', 'trichy',
    'salem', 'erode', 'kumarapalayam', 'tirupur', 'tiruppur', 'vellore', 'thanjavur', 'tanjore',
    'thoothukudi', 'tuticorin', 'tirunelveli', 'pollachi', 'karur', 'namakkal', 'dindigul',
    'kanchipuram', 'kanyakumari', 'nagercoil', 'tindivanam', 'cuddalore', 'krishnagiri', 'dharmapuri',
  ]
  if (tamilCities.some((c) => a.includes(c))) return 'tamil-nadu'

  if (a.includes('kerala') || ['kochi', 'cochin', 'trivandrum', 'thiruvananthapuram', 'kozhikode', 'calicut', 'thrissur'].some((c) => a.includes(c))) return 'kerala'
  if (a.includes('karnataka') || ['bangalore', 'bengaluru', 'mysore', 'mysuru', 'mangalore', 'hubli', 'belgaum'].some((c) => a.includes(c))) return 'karnataka'
  if (a.includes('telangana') || a.includes('andhra') || ['hyderabad', 'vijayawada', 'visakhapatnam', 'guntur', 'tirupati', 'warangal'].some((c) => a.includes(c))) return 'andhra-telangana'

  // North India fallback signals
  if (['delhi', 'mumbai', 'pune', 'gurgaon', 'gurugram', 'noida', 'jaipur', 'lucknow', 'ahmedabad', 'kolkata', 'patna', 'bhopal', 'chandigarh'].some((c) => a.includes(c))) return 'north-india'

  return undefined
}

/**
 * Format a chosen archetype as a ~250-token XML prompt block.
 *
 * The block is designed to be injected into the Design Intelligence + Ultra-Pro
 * prompt as a structured archetype reference. The `(DO NOT RENDER ...)` note
 * inside the opening tag mirrors the convention used elsewhere in the pipeline
 * (see CLAUDE.md: instruction vs content separation) so Gemini does not render
 * any of this as on-poster text.
 */
export function archetypeToPromptHint(archetype: CreativeArchetype): string {
  const { name, referenceLanguage, exampleBriefs } = archetype
  const motifs = referenceLanguage.decorativeMotifs.join('; ')
  const avoid = referenceLanguage.avoid.join('; ')
  const briefs = exampleBriefs.map((b) => `"${b}"`).join(', ')

  return [
    `<archetype>(DO NOT RENDER — creative archetype reference for visual composition)`,
    `Compose this in the style of a "${name}". ${referenceLanguage.visualScene}`,
    `Lighting: ${referenceLanguage.lightingDirection}`,
    `Palette: ${referenceLanguage.paletteApproach}`,
    `Include these motifs: ${motifs}.`,
    `Avoid: ${avoid}.`,
    `Reference briefs this style fits: ${briefs}.`,
    `</archetype>`,
  ].join('\n')
}

// ============================================================
// SEEDED PICK (deterministic + reasonably-distributed)
// ============================================================

/**
 * Tiny non-cryptographic string hash (FNV-1a 32-bit).
 *
 * Same input → same output → same archetype pick for the same brief, so the
 * user sees consistency on regenerate. Different briefs hash differently and
 * land in different buckets, so the design feels varied across the gallery.
 * We do NOT need cryptographic strength here, only distribution.
 */
function stableHash(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h >>> 0
}
