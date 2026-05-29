/**
 * Field Registry v2 — Semantic + Influence metadata (stage 2)
 *
 * ADDITIVE extension of lib/config/field-registry.ts. v1 owns id/label/type/
 * category/aliases/validation; v2 adds the two things the architecture doc asks
 * for and v1 lacks:
 *   - `semantic`  — what a field MEANS (identity, location, person…)
 *   - `affects`   — which downstream stages a field influences
 *
 * Keyed by the v1 canonical id (e.g. 'eventName', 'venue'). Re-exports the v1
 * resolver helpers so callers have one import surface and nothing v1 breaks.
 */

import { resolveFieldId, getField } from '@/lib/config/field-registry'

export { resolveFieldId, getField }

/** What a field means creatively. */
export type FieldSemantic =
  | 'identity'
  | 'location'
  | 'time'
  | 'person'
  | 'organization'
  | 'message'
  | 'cta'
  | 'contact'
  | 'branding'
  | 'meta'

/** Downstream stages a field can influence (the "affects" list). */
export type DownstreamConsumer =
  | 'creativeDirector'
  | 'typography'
  | 'layout'
  | 'composition'
  | 'sceneGeneration'
  | 'lighting'
  | 'backgroundEnvironment'
  | 'rendering'
  | 'branding'
  | 'footer'

export interface SemanticFieldMeta {
  semantic: FieldSemantic
  affects: DownstreamConsumer[]
}

/**
 * Semantic metadata for the core event_poster fields (increment 1 scope).
 * Extend this map as more fields are pulled into the engine.
 */
export const SEMANTIC_FIELD_REGISTRY: Record<string, SemanticFieldMeta> = {
  eventName: { semantic: 'identity', affects: ['creativeDirector', 'typography', 'composition', 'rendering'] },
  eventTagline: { semantic: 'message', affects: ['creativeDirector', 'typography', 'rendering'] },
  eventDescription: { semantic: 'message', affects: ['creativeDirector', 'sceneGeneration'] },
  eventDate: { semantic: 'time', affects: ['rendering'] },
  eventTime: { semantic: 'time', affects: ['rendering'] },
  eventEndTime: { semantic: 'time', affects: ['rendering'] },
  venue: { semantic: 'location', affects: ['sceneGeneration', 'lighting', 'backgroundEnvironment', 'rendering'] },
  speakerName: { semantic: 'person', affects: ['creativeDirector', 'composition', 'rendering'] },
  speakerDesignation: { semantic: 'person', affects: ['rendering'] },
  organizationName: { semantic: 'organization', affects: ['branding', 'rendering', 'footer'] },
  targetAudience: { semantic: 'meta', affects: ['creativeDirector', 'sceneGeneration'] },
}

/** Resolve any raw/alias field id to its semantic metadata (undefined if unknown). */
export function getFieldMeta(fieldId: string): SemanticFieldMeta | undefined {
  const canonicalId = resolveFieldId(fieldId)
  return SEMANTIC_FIELD_REGISTRY[canonicalId]
}

/** The semantic of a field, or 'meta' for unknown fields. */
export function getFieldSemantic(fieldId: string): FieldSemantic {
  return getFieldMeta(fieldId)?.semantic ?? 'meta'
}

/** Downstream consumers of a field, or [] for unknown fields. */
export function getFieldAffects(fieldId: string): DownstreamConsumer[] {
  return getFieldMeta(fieldId)?.affects ?? []
}
