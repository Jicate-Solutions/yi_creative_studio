/**
 * Stage 15 — Poster Critic (AI QA)
 *
 * Wraps the existing Gemini-vision poster critic (which already has its own
 * fallback) and maps its verdict to the engine's CritiqueResult contract.
 * In increment 1 the result is logged only — no regeneration loop yet.
 */

import { criticReview } from '@/lib/agents/poster-critic'
import type { CanonicalEvent } from '../contracts/canonical'
import type { EventPsychology } from '../contracts/semantic'
import type { CritiqueResult } from '../contracts/verify'
import type { EngineConfig } from '../pipeline.types'

function acceptByDefault(reason: string): CritiqueResult {
  return {
    overallScore: 7,
    passesThreshold: true,
    dimensions: [],
    topIssues: [],
    regenerationHint: reason,
    source: 'fallback',
  }
}

export async function runPosterCritic(
  finalImageBase64: string,
  canonical: CanonicalEvent,
  psychology: EventPsychology,
  cfg: EngineConfig
): Promise<CritiqueResult> {
  if (cfg.forceFallback) return acceptByDefault('forceFallback')

  try {
    const verdict = await criticReview(
      {
        imageBase64: finalImageBase64,
        imageMimeType: 'image/png',
        brief: {
          eventName: canonical.eventName,
          description: canonical.description,
          tagline: canonical.tagline,
          formatId: canonical.format.id,
          brandColors: {
            primary: canonical.brand.primary,
            secondary: canonical.brand.secondary,
            accent: canonical.brand.accent,
          },
          backgroundStyle: canonical.controls.backgroundStyle,
          compositionStrategy: psychology.compositionStrategy,
          hasSpeakerPhoto: canonical.speakers.some((s) => s.photoProvided),
        },
      },
      { signal: cfg.signal }
    )

    return {
      overallScore: verdict.overallScore,
      passesThreshold: verdict.passesThreshold,
      dimensions: verdict.dimensions.map((d) => ({
        dimension: d.dimension,
        score: d.score,
        issues: d.issues,
      })),
      topIssues: verdict.topIssues,
      regenerationHint: verdict.regenerationHint,
      source: 'ai',
    }
  } catch {
    return acceptByDefault('critic API failed')
  }
}
