/**
 * Alias Resolution Layer (stage 3)
 *
 * Normalizes the unstable raw form payload into canonical ids using the v1
 * resolver, while GUARANTEEING no field is ever silently lost — anything the
 * registry doesn't recognize is preserved in `customFields` (with a humanized
 * label and any known `affects`). Also records provenance (which raw key fed
 * each canonical id) for traceability.
 *
 * Pure + total: never throws, always returns a valid resolution.
 */

import { getField } from '@/lib/config/field-registry'
import { getFieldAffects } from './field-registry-v2'
import type { CustomField } from '../contracts/canonical'

/**
 * Raw keys that are structural / design-control / engine-meta — NOT renderable
 * poster content. These must never leak into customFields (or they'd be drawn as
 * visible text). Covers the dynamic form's control knobs and engine inputs.
 */
const META_KEYS = new Set([
  'language',
  'designData',
  'speakers',
  'rawFormData',
  // design controls + engine meta
  'backgroundStyle',
  'visualStrategy',
  'sophistication',
  'creativeFidelity',
  'alignment',
  'fontStyle',
  'visualDirection',
  'theme',
  'style',
  'format',
  'formatId',
  'creationMode',
  'aspectRatio',
  'resolution',
  'model',
  'promptStyle',
  'logoStripMode',
  'enhanced4RowStrip',
  'speakerPhotoEnabled',
])

export interface AliasResolution {
  /** canonicalId → value (first non-empty alias wins). */
  resolved: Record<string, string>
  /** canonicalId → the raw key it came from. */
  resolvedFrom: Record<string, string>
  /** Unmatched fields, preserved verbatim. */
  customFields: CustomField[]
  /** Every raw key seen (for provenance). */
  rawFieldKeys: string[]
}

function humanize(key: string): string {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Resolve raw form fields. Scalar values only — arrays/objects (e.g. the
 * `speakers` array) are handled by dedicated extraction upstream and skipped here.
 */
export function resolveAliases(raw: Record<string, unknown>): AliasResolution {
  const resolved: Record<string, string> = {}
  const resolvedFrom: Record<string, string> = {}
  const customFields: CustomField[] = []
  const rawFieldKeys = Object.keys(raw ?? {})

  for (const [key, value] of Object.entries(raw ?? {})) {
    if (value === undefined || value === null || value === '') continue
    if (key.startsWith('_') || META_KEYS.has(key)) continue
    if (typeof value === 'object') continue

    const field = getField(key)
    if (field) {
      // Known canonical field — first non-empty writer wins.
      if (resolved[field.id] === undefined) {
        resolved[field.id] = String(value).trim()
        resolvedFrom[field.id] = key
      }
    } else {
      // Unknown — preserve, never drop.
      customFields.push({
        key,
        label: humanize(key),
        value: String(value).trim(),
        affects: getFieldAffects(key),
      })
    }
  }

  return { resolved, resolvedFrom, customFields, rawFieldKeys }
}
