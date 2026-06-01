/**
 * Designer Pipeline — Stage 04: Layout Plan
 *
 * Thin adapter over the shared format-zones profile (lib/config/format-zones.ts).
 * The Forge route already trusts getFormatProfile() for canvas shape and reserve
 * bands, so we reuse it verbatim rather than inventing parallel layout math — the
 * designer pipeline just re-expresses it as focal/text zones for the summary +
 * Director constraints.
 */

import { getFormatCategory, getFormatProfile } from '@/lib/config/format-zones'
import type { DesignerPipelineInput, LayoutPlan } from './contracts'

export function buildLayoutPlan(input: DesignerPipelineInput): LayoutPlan {
  const formatCategory = getFormatCategory(input.formatId)
  const profile = getFormatProfile(input.formatId)

  // Content lives between the reserved top and bottom bands.
  const contentTop = profile.reserveTopPct
  const contentBottom = 100 - profile.reserveBottomPct

  return {
    formatCategory,
    shape: profile.shape,
    reserveTopPct: profile.reserveTopPct,
    reserveBottomPct: profile.reserveBottomPct,
    footerStripActive: profile.footerStripActive,
    focalZone: `the active middle band (~${contentTop}%–${contentBottom}% of height)`,
    textZones: [
      `headline in the upper part of the content band (around ${contentTop + 5}%)`,
      `supporting details / date / venue in the lower-middle, above the bottom ${profile.reserveBottomPct}%`,
    ],
  }
}
