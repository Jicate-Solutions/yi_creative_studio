/**
 * Canonical Event Model — contracts (stages 1–4 output)
 *
 * The platform's internal creative language. Every downstream stage consumes
 * ONLY this model (and what's derived from it) — never the raw, unstable form
 * payload. Field names here are stable; aliasing is resolved upstream (stage 3).
 *
 * Provider-neutral: no sharp / Anthropic / Gemini types.
 */

export type SupportedLanguage = 'en' | 'ta' | 'hi'

/**
 * An input field the registry did NOT recognize. Preserved verbatim so no user
 * data is ever silently lost (stage 3 guarantee). `affects` is populated only
 * when the registry happens to know downstream consumers for the resolved id.
 */
export interface CustomField {
  /** Original (unmatched) field id from the raw form. */
  key: string
  /** Humanized label for display / debugging. */
  label: string
  value: string
  affects?: string[]
}

export interface CanonicalSpeaker {
  name: string
  designation?: string
  /** Resolved event-role display label, e.g. "CHIEF GUEST". */
  role?: string
  photoProvided: boolean
}

/**
 * Stage 4 — the canonical event. Stable, normalized, format-aware.
 */
export interface CanonicalEvent {
  eventName: string
  eventType?: string
  tagline?: string
  description?: string
  date?: string
  startTime?: string
  endTime?: string
  venue?: string
  speakers: CanonicalSpeaker[]
  organizationName?: string
  targetAudience?: string
  callToAction?: string
  registrationInfo?: string
  /** Footer note / additional free text. */
  footerNote?: string

  /** Unmatched fields, preserved (never dropped). */
  customFields: CustomField[]

  format: {
    id: string
    width: number
    height: number
    aspectRatio: string
    /** FormatCategory from lib/config/format-zones.ts (e.g. 'poster_portrait'). */
    category: string
  }

  brand: {
    primary: string
    secondary?: string
    accent?: string
    /** Cultural region hint (e.g. 'tamil-nadu') resolved from address/org. */
    region?: string
  }

  /** User-selected design knobs (from the existing CompiledFormData controls). */
  controls: {
    backgroundStyle?: string
    sophistication?: 'minimalist' | 'balanced' | 'rich'
    creativeFidelity?: 'high' | 'standard' | 'artistic'
    alignment?: 'center' | 'left' | 'right' | 'asymmetric'
    fontStyle?: string
    /** Free-text user brief for the background visual. */
    visualDirection?: string
    language: SupportedLanguage
    /** No logo bars / footer strip → compose edge-to-edge. */
    fullCanvas: boolean
    logoBarsEnabled: boolean
  }

  /** Traceability: which raw alias resolved to each canonical id. */
  provenance: {
    resolvedFrom: Record<string, string>
    rawFieldKeys: string[]
  }
}
