/**
 * Rendering Mode Selection
 *
 * Picks the division of labour between the image model and the deterministic
 * engine, per the brief. Advertising leans on the AI's integrated typography;
 * certificates / official / multilingual demand pixel-exact deterministic text;
 * institutional wants designed containers with exact copy.
 *
 * Precedence: explicit user override > brand-safe/strict rules > style/family.
 */

import type { CanonicalEvent } from '../contracts/canonical'
import type { SemanticProfile } from '../contracts/semantic'
import type { RenderingMode } from '../contracts/scene'

/** Formats where text accuracy is non-negotiable → always engine_exact. */
const EXACT_FORMATS = /certificate|letterhead|report_cover|book_cover|business_card|id_card|notice|resume/i

export function selectRenderingMode(
  canonical: CanonicalEvent,
  semantic: SemanticProfile,
  override?: RenderingMode
): RenderingMode {
  if (override) return override

  // Brand-safe / strict cases first — exact deterministic text only.
  if (canonical.controls.language !== 'en') return 'engine_exact' // multilingual (Tamil/Hindi)
  if (EXACT_FORMATS.test(canonical.format.id)) return 'engine_exact'

  // Advertising → let the AI design the full poster (typography included); verify after.
  if (canonical.controls.backgroundStyle === 'advertising') return 'ai_native'

  // Institutional → AI scene + empty designed containers, exact copy by the engine.
  if (
    canonical.controls.backgroundStyle === 'institutional' ||
    semantic.eventFamily === 'ACADEMIC-CONFERENCE'
  ) {
    return 'hybrid_shape'
  }

  // Default: brand-safe exact text.
  return 'engine_exact'
}
