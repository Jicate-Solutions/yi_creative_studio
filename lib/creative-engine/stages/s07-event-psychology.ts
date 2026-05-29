/**
 * Stage 7 — Event Psychology Engine
 *
 * Wraps the existing Claude subject classifier (which already has its own AI +
 * heuristic fallback) and layers on visual energy + audience psychology from the
 * semantic profile. Also re-applies the v55.x "speaker photo forces portrait"
 * rule so an uploaded face is always treated as the hero subject.
 */

import { classifySubject, type SubjectAnalysis } from '@/lib/agents/subject-classifier'
import type { CanonicalEvent } from '../contracts/canonical'
import type { SemanticProfile, EventPsychology } from '../contracts/semantic'
import type { EngineConfig } from '../pipeline.types'

function heuristic(
  c: CanonicalEvent,
  s: SemanticProfile,
  photoProvided: boolean
): SubjectAnalysis {
  const personFamilies = ['TRIBUTE-LIVING', 'MEMORIAL-DECEASED', 'BIRTHDAY-LIVING']
  if (photoProvided || (c.speakers.length === 1 && personFamilies.includes(s.eventFamily))) {
    return { subjectType: 'person', compositionStrategy: 'portrait-hero', reasoning: 'heuristic', confidence: 0.4 }
  }
  const activityFamilies = ['CELEBRATION-LIVE', 'CULTURAL-FESTIVAL', 'SPORTS-MOTION']
  if (activityFamilies.includes(s.eventFamily)) {
    return { subjectType: 'activity', compositionStrategy: 'activity-collage', reasoning: 'heuristic', confidence: 0.4 }
  }
  return { subjectType: 'concept', compositionStrategy: 'concept-iconic', reasoning: 'heuristic', confidence: 0.3 }
}

export async function runEventPsychology(
  canonical: CanonicalEvent,
  semantic: SemanticProfile,
  cfg: EngineConfig
): Promise<EventPsychology> {
  const photoProvided = canonical.speakers.some((s) => s.photoProvided)

  let analysis: SubjectAnalysis
  let source: 'ai' | 'heuristic'

  if (cfg.forceFallback) {
    analysis = heuristic(canonical, semantic, photoProvided)
    source = 'heuristic'
  } else {
    try {
      analysis = await classifySubject(
        {
          eventName: canonical.eventName,
          description: canonical.description,
          tagline: canonical.tagline,
          targetAudience: canonical.targetAudience,
          speakers: canonical.speakers.map((s) => ({
            name: s.name,
            designation: s.designation,
            photoUrl: s.photoProvided ? 'provided' : null,
          })),
          organizationContext: { name: canonical.organizationName },
        },
        { signal: cfg.signal }
      )
      source = 'ai'
    } catch {
      analysis = heuristic(canonical, semantic, photoProvided)
      source = 'heuristic'
    }
  }

  // v55.x SPEAKER PHOTO FORCES PORTRAIT — an uploaded face is an explicit
  // "put this person on the poster" signal that overrides text classification.
  let { subjectType, compositionStrategy } = analysis
  if (photoProvided) {
    subjectType = 'person'
    compositionStrategy = 'portrait-hero'
  }

  const lead = canonical.speakers[0]
  return {
    subjectType,
    compositionStrategy,
    subjectIdentity:
      analysis.subjectIdentity ??
      (lead ? { name: lead.name, role: lead.role, photoProvided } : undefined),
    visualEnergy: semantic.eventPsychology.energy,
    audiencePsychology: semantic.eventPsychology.audienceEmotion,
    confidence: analysis.confidence ?? 0.5,
    source,
  }
}
