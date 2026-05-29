/**
 * Form Compiler Adapter (stage 4 — Canonical Event Model)
 *
 * Anti-corruption bridge: maps the existing CompiledFormData (which already does
 * mature alias extraction, speaker parsing, date handling) into the engine's
 * stable CanonicalEvent. Provenance + enriched customFields come from the
 * registry-v2 alias resolver, so no field is ever lost.
 */

import type { CompiledFormData } from '@/lib/prompts/services/form-data-compiler'
import { getFormatById, type CreativeFormatId } from '@/lib/config/creative-formats'
import { getFormatCategory } from '@/lib/config/format-zones'
import { formatEventDate } from '@/lib/utils/time-formatter'
import { resolveAliases } from '../registry/alias-resolver'
import type {
  CanonicalEvent,
  CanonicalSpeaker,
  CustomField,
  SupportedLanguage,
} from '../contracts/canonical'

export interface CanonicalAdapterExtras {
  formatId: string
  brand: { primary: string; secondary?: string; accent?: string; region?: string }
  backgroundStyle?: string
  fullCanvas: boolean
  logoBarsEnabled: boolean
  /** Per-speaker photo-uploaded flags (the route knows uploads; index-aligned). */
  speakerPhotoFlags?: boolean[]
  /** Raw form payload for provenance + customFields. Falls back to compiled.rawFormData. */
  rawFormData?: Record<string, unknown>
}

function pickCustom(customFields: CustomField[], ...keys: string[]): string | undefined {
  const lowered = keys.map((k) => k.toLowerCase())
  return customFields.find((c) => lowered.includes(c.key.toLowerCase()))?.value
}

export function toCanonicalEvent(
  compiled: CompiledFormData,
  extras: CanonicalAdapterExtras
): CanonicalEvent {
  const format = getFormatById(extras.formatId as CreativeFormatId)
  const width = compiled.format?.dimensions.width ?? format?.width ?? 1080
  const height = compiled.format?.dimensions.height ?? format?.height ?? 1440
  const aspectRatio = format?.aspectRatio ?? `${width}:${height}`

  // Alias resolution → provenance + enriched (never-dropped) custom fields.
  const resolution = resolveAliases(extras.rawFormData ?? compiled.rawFormData ?? {})
  const customFields = resolution.customFields

  // Reuse CompiledFormData's mature speaker extraction.
  const speakers: CanonicalSpeaker[] = (compiled.speakers ?? [])
    .filter((s) => !!s.name)
    .map((s, i) => ({
      name: String(s.name),
      designation: s.designation ?? undefined,
      role: (s.role as string | null) ?? undefined,
      photoProvided: extras.speakerPhotoFlags?.[i] ?? false,
    }))

  return {
    eventName: compiled.eventName?.trim() || 'Untitled Event',
    eventType: compiled.eventType ?? undefined,
    tagline: compiled.tagline ?? undefined,
    description: compiled.description ?? undefined,
    date: compiled.date ? formatEventDate(compiled.date) || undefined : undefined,
    startTime: compiled.time ?? undefined,
    endTime: compiled.endTime ?? undefined,
    venue: compiled.venue ?? undefined,
    speakers,
    organizationName: compiled.organizationName ?? undefined,
    targetAudience: compiled.targetAudience ?? undefined,
    callToAction: pickCustom(customFields, 'callToAction', 'cta', 'call_to_action'),
    registrationInfo: pickCustom(customFields, 'registrationInfo', 'registration', 'register', 'rsvp'),
    footerNote: compiled.eventNote ?? undefined,
    customFields,
    format: {
      id: extras.formatId,
      width,
      height,
      aspectRatio,
      category: getFormatCategory(extras.formatId),
    },
    brand: {
      primary: extras.brand.primary,
      secondary: extras.brand.secondary,
      accent: extras.brand.accent,
      region: extras.brand.region,
    },
    controls: {
      backgroundStyle: extras.backgroundStyle ?? compiled.style ?? undefined,
      sophistication: compiled.sophistication ?? undefined,
      creativeFidelity: compiled.creativeFidelity ?? undefined,
      alignment: compiled.alignment ?? undefined,
      fontStyle: compiled.fontStyle ?? undefined,
      visualDirection: compiled.visualDirection ?? undefined,
      language: (compiled.language as SupportedLanguage) ?? 'en',
      fullCanvas: extras.fullCanvas,
      logoBarsEnabled: extras.logoBarsEnabled,
    },
    provenance: {
      resolvedFrom: resolution.resolvedFrom,
      rawFieldKeys: resolution.rawFieldKeys,
    },
  }
}
