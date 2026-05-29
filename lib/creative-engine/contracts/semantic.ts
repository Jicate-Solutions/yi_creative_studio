/**
 * Semantic Enrichment + Event Psychology — contracts (stages 5 & 7 output)
 *
 * This is where "fields → meaning" happens. SemanticProfile is pure rule output
 * (AI-augmentable later); EventPsychology wraps the existing subject classifier
 * and adds energy / audience reasoning.
 *
 * subjectType / compositionStrategy are imported from the existing classifier so
 * the vocabulary stays single-sourced — never redefine them here.
 */

import type { SubjectType, CompositionStrategy } from '@/lib/agents/subject-classifier'

export type { SubjectType, CompositionStrategy }

export type EnergyLevel = 'calm' | 'moderate' | 'high' | 'explosive'

/**
 * Event family — mirrors the Director's principle-11 families. The single most
 * load-bearing classification: it prevents memorial vocabulary on a birthday,
 * empty venues on a live celebration, etc.
 */
export type EventFamily =
  | 'BIRTHDAY-LIVING'
  | 'TRIBUTE-LIVING'
  | 'MEMORIAL-DECEASED'
  | 'SPORTS-MOTION'
  | 'CULTURAL-FESTIVAL'
  | 'CONCEPT-LAUNCH'
  | 'ACADEMIC-CONFERENCE'
  | 'AWARENESS-CAUSE'
  | 'MARKETING-PROMO'
  | 'CELEBRATION-LIVE'
  | 'GENERIC-EVENT'

/** Stage 5 — fields → meaning. Pure rules in increment 1. */
export interface SemanticProfile {
  eventPsychology: {
    tone: string
    energy: EnergyLevel
    audienceEmotion: string
  }
  visualBehavior: {
    composition: 'centered' | 'asymmetric' | 'panoramic' | 'stacked'
    sceneEnergy: 'still' | 'kinetic' | 'ambient'
    motionLanguage: 'static' | 'mid-action' | 'flowing'
  }
  eventFamily: EventFamily
  isMarketing: boolean
}

/** Stage 7 — Event Psychology Engine. Wraps SubjectAnalysis + adds strategy. */
export interface EventPsychology {
  subjectType: SubjectType
  compositionStrategy: CompositionStrategy
  subjectIdentity?: {
    name: string
    role?: string
    photoProvided: boolean
  }
  visualEnergy: EnergyLevel
  audiencePsychology: string
  confidence: number
  source: 'ai' | 'heuristic'
}
