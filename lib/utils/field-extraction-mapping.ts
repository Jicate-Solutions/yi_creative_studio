/**
 * Shared utility: maps Smart Paste extraction field IDs → form field IDs.
 *
 * Single source of truth — previously duplicated in:
 *   - components/canvas-create/SmartPasteSheet.tsx
 *   - hooks/use-field-extraction.ts
 *
 * Key rules:
 * - `eventTitle` → `eventName` (Claude sometimes extracts "eventTitle" for the
 *   same text; we want it to land in the correct form field, not a ghost field)
 * - Unknown field IDs pass through unchanged (identity mapping)
 */

export const EXTRACTION_FIELD_MAP: Record<string, string> = {
  eventName: 'eventName',
  eventTitle: 'eventName', // Legacy / fallback — both mean the same form field
  eventDate: 'eventDate',
  eventTime: 'eventTime',
  eventEndTime: 'eventEndTime',
  venue: 'venue',
  eventDescription: 'eventDescription',
  eventTagline: 'eventTagline',
  registrationInfo: 'registrationInfo',
  contactNumber: 'contactNumber',
  contactEmail: 'contactEmail',
  websiteUrl: 'websiteUrl',
  organizationName: 'organizationName',
  targetAudience: 'targetAudience',
  additionalDetails: 'additionalDetails',
}

/**
 * Maps an extraction field ID to the canonical form field ID.
 * Falls back to the original ID if no mapping is defined.
 */
export function mapExtractionFieldId(extractionFieldId: string): string {
  return EXTRACTION_FIELD_MAP[extractionFieldId] ?? extractionFieldId
}
