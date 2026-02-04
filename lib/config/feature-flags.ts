/**
 * Feature Flags Configuration
 * Centralized feature flag management for safe rollouts
 *
 * @module lib/config/feature-flags
 * @version 1.0
 */

export const FEATURE_FLAGS = {
  /**
   * v3.1: External Event Format Inference
   *
   * When enabled, automatically infers optimal creative format
   * from external event type during import.
   *
   * When disabled, external events import without formatId
   * (user must manually select format before generating).
   *
   * @default false (opt-in for safe rollout)
   * @since v3.1
   */
  ENABLE_FORMAT_INFERENCE: process.env.NEXT_PUBLIC_ENABLE_FORMAT_INFERENCE === 'true',
} as const

/**
 * Helper to check if a feature is enabled
 * Includes logging for debugging
 *
 * @param flag - Feature flag key to check
 * @returns true if feature is enabled, false otherwise
 *
 * @example
 * ```typescript
 * if (isFeatureEnabled('ENABLE_FORMAT_INFERENCE')) {
 *   // Use new format inference logic
 * } else {
 *   // Use legacy behavior
 * }
 * ```
 */
export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  const enabled = FEATURE_FLAGS[flag]
  if (!enabled) {
    console.log(`[Feature Flag] ${flag} is DISABLED`)
  }
  return enabled
}
