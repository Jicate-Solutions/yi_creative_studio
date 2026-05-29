/**
 * Spatial Verification + Poster Critic — contracts (stages 14 & 15)
 *
 * Verification is now SIMPLE: because the image model paints art only, there is
 * no hallucinated-text detection — just clutter / contrast / readability / reserved
 * zone checks. The Critic is the final AI QA pass.
 */

export interface VerificationReport {
  passed: boolean
  /** 0 (clean) → 1 (very cluttered). */
  clutterScore: number
  contrastIssues: Array<{ layerId: string; ratio: number; minRequired: number }>
  readabilityIssues: Array<{ layerId: string; reason: string }>
  zoneViolations: Array<{ zoneType: 'header' | 'footer'; severity: 'critical' | 'warning' }>
}

export interface CritiqueResult {
  overallScore: number
  passesThreshold: boolean
  dimensions: Array<{ dimension: string; score: number; issues: string[] }>
  topIssues: string[]
  regenerationHint?: string
  source: 'ai' | 'fallback'
}
