/**
 * Speaker Migration Utilities
 * Handles backward compatibility between legacy single-speaker and new multi-speaker formats
 */

import type { SpeakerPhotoCustomization } from '@/lib/config/design-constants'

/**
 * Detect if speaker config is legacy (single) or new (multi)
 */
export function isLegacySpeakerConfig(config: SpeakerPhotoCustomization): boolean {
  // Has photoUrl but no speakers array = legacy
  return !!config.photoUrl && (!config.speakers || config.speakers.length === 0)
}

/**
 * Normalize speaker config - migrate legacy to new format
 * This ensures all speaker configs use the new structure internally
 */
export function normalizeSpeakerConfig(
  config: SpeakerPhotoCustomization
): SpeakerPhotoCustomization {
  if (isLegacySpeakerConfig(config)) {
    // Migrate single speaker to array format
    return {
      ...config,
      speakers: config.photoUrl ? [{
        id: crypto.randomUUID(),
        name: '',  // Name comes from formData, not photo config
        designation: '',
        photoUrl: config.photoUrl,
      }] : [],
      layoutMode: 'auto',
      // Keep legacy fields for rollback capability
    }
  }

  return config
}

/**
 * Get speaker count (handles both legacy and new formats)
 */
export function getSpeakerCount(config: SpeakerPhotoCustomization): number {
  if (config.speakers && config.speakers.length > 0) {
    return config.speakers.length
  }
  if (config.photoUrl) {
    return 1  // Legacy single speaker
  }
  return 0
}

/**
 * Check if multi-speaker mode (more than 1 speaker)
 */
export function isMultiSpeakerMode(config: SpeakerPhotoCustomization): boolean {
  return getSpeakerCount(config) > 1
}
