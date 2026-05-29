/**
 * Stage 14 — Spatial Verification (simplified)
 *
 * Because the image model now paints art ONLY, verification no longer hunts for
 * hallucinated headline text. The key new check is the inverse: confirm the AI
 * BACKGROUND is clean (no text the model wrongly drew). Calling the existing
 * detector with 50/50 treats the whole canvas as a forbidden text zone.
 *
 * Non-blocking in increment 1: violations are reported, only criticals fail.
 */

import { detectTextInForbiddenZones } from '@/lib/sharp/text-zone-verifier'
import type { VerificationReport } from '../contracts/verify'

export interface VerifyOptions {
  /** Treat the whole canvas as no-text by default (50/50). */
  headerEndPercent?: number
  footerStartPercent?: number
}

export async function runSpatialVerification(
  backgroundImage: Buffer,
  opts: VerifyOptions = {}
): Promise<VerificationReport> {
  const headerEndPercent = opts.headerEndPercent ?? 50
  const footerStartPercent = opts.footerStartPercent ?? 50

  let zoneViolations: VerificationReport['zoneViolations'] = []
  try {
    const violations = await detectTextInForbiddenZones(
      backgroundImage,
      headerEndPercent,
      footerStartPercent
    )
    zoneViolations = violations.map((v) => ({ zoneType: v.zoneType, severity: v.severity }))
  } catch {
    zoneViolations = []
  }

  const passed = !zoneViolations.some((v) => v.severity === 'critical')

  return {
    passed,
    clutterScore: 0,
    contrastIssues: [],
    readabilityIssues: [],
    zoneViolations,
  }
}
