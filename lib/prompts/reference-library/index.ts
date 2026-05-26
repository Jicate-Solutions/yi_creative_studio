/**
 * Style reference library (v54.5 — concept-first experiment).
 *
 * A small curated set of poster references (in public/references/) used as a VISUAL
 * QUALITY BAR: the matching reference is attached to the Gemini request as an image
 * input so the model composes in a proven design language instead of regressing to
 * the generic "average poster" mean. The model is told to match the reference's
 * visual language — composition, negative space, type treatment, palette confidence —
 * NOT to copy its content, text, logos, or people.
 *
 * Keyed by Subject Classifier `subjectType` (person | concept | activity | product | place).
 *
 * NOTE: the festival/patriotic/awareness references are Canva/Freepik-style stock
 * templates — fine as internal style cues for testing, but swap to owned/licensed
 * references before relying on this in production.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export interface ReferenceEntry {
  id: string
  file: string
  subjectTypes: string[]
  /**
   * Optional backgroundStyle id (lib/config/background-styles.ts). When set, this
   * reference is attached whenever the user PICKS that style — independent of the
   * classified subjectType. Used for style-driven references (e.g. 'spotlight-event')
   * where the look is the selectable thing, not the subject.
   */
  styleId?: string
  /** One-line description of the visual language to imitate. */
  note: string
}

export const STYLE_REFERENCES: ReferenceEntry[] = [
  { id: 'person-dark', file: 'person-dark-cinematic.png', subjectTypes: ['person'], note: 'dark dramatic gradient, gold-lit cut-out portrait, huge bold name headline, logo row at top, skyline footer — premium and confident' },
  { id: 'person-bright', file: 'person-bright-gradient.png', subjectTypes: ['person'], note: 'green→orange gradient, cut-out portrait, bold headline, logo row top, date/venue strip, skyline footer — clean and structured' },
  { id: 'person-green', file: 'person-green-event.png', subjectTypes: ['person'], note: 'green gradient, real photo subject, bold headline + competition sub-line, date chip, logo row, skyline footer' },
  { id: 'festival', file: 'festival-illustrated.png', subjectTypes: ['activity', 'concept'], note: 'flat illustrated festive, ONE focal motif, mandala watermark, warm palette, generous clean negative space' },
  { id: 'festival-min', file: 'festival-minimal.png', subjectTypes: ['concept'], note: 'minimal elegant, single focal motif made of light, mandala line-art, lots of whitespace, calm premium' },
  { id: 'patriotic', file: 'patriotic-vector.png', subjectTypes: ['place'], note: 'tricolor vector swoosh, monuments silhouette, map motif, big headline, lots of whitespace, flat vector' },
  { id: 'awareness', file: 'awareness-papercut.png', subjectTypes: ['activity'], note: 'modern paper-cut graphic, ONE bold focal device, bold sans headline with highlight box, confident limited palette, generous whitespace' },
  // Style-driven reference (attached when backgroundStyle === 'spotlight-event'). STYLE-ONLY:
  // teaches palette / lighting / composition / type-hierarchy — never its content.
  { id: 'spotlight-event', file: 'spotlight-event.png', subjectTypes: ['person', 'activity'], styleId: 'spotlight-event', note: 'STYLE ONLY — match the bright gradient field, lighting, composition, type hierarchy and the headline-band / colored competition sub-line / rounded date chip / thin detail strip / flat city-skyline footer layout, with the top zone left clean for the logo overlay. Do NOT reproduce its people, text, or logos. Bright, structured, confident.' },
]

/**
 * Pick a reference by selected backgroundStyle id. Returns the entry whose `styleId`
 * matches (null otherwise). Style takes priority over subject when the user has
 * explicitly chosen a style-driven look (e.g. 'spotlight-event').
 */
export function pickReferenceForStyle(styleId?: string): ReferenceEntry | null {
  if (!styleId) return null
  return STYLE_REFERENCES.find((r) => r.styleId === styleId) || null
}

/** Pick the best reference for a subject type. Falls back to a clean concept reference. */
export function pickReferenceForSubject(subjectType?: string): ReferenceEntry | null {
  if (subjectType) {
    const match = STYLE_REFERENCES.find((r) => r.subjectTypes.includes(subjectType))
    if (match) return match
  }
  return STYLE_REFERENCES.find((r) => r.subjectTypes.includes('concept')) || STYLE_REFERENCES[0] || null
}

/** Read a reference image from public/references/ as base64 (server-side). Null on failure. */
export function loadReferenceBase64(file: string): { data: string; mimeType: string } | null {
  try {
    const buf = readFileSync(join(process.cwd(), 'public', 'references', file))
    return { data: buf.toString('base64'), mimeType: 'image/png' }
  } catch (err) {
    console.warn(`[Reference Library] Failed to load reference "${file}":`, err)
    return null
  }
}
