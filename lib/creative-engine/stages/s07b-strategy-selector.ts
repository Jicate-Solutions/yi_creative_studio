/**
 * Stage 7b — Creative Strategy Selection
 *
 * Chooses HOW the visual story is told, intentionally — instead of letting the
 * Director drift. Picks a sensible default from event family + composition, but
 * accepts a user override so the same brief can be steered (e.g. a traffic-
 * awareness campaign → `symbolic` helmet by default, or `activity-driven` nursing
 * students on demand). The chosen directive hard-constrains the Director.
 *
 * ── TASTE DECISION POINT (yours to tune) ───────────────────────────────────────
 * DIRECTIVES is the contract each strategy imposes on the Director, and
 * `defaultStrategy` is the routing table. Both are pure judgment — edit freely.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import type { SemanticProfile } from '../contracts/semantic'
import type { EventPsychology } from '../contracts/semantic'
import type { CanonicalEvent } from '../contracts/canonical'
import type { VisualStrategy, StrategySelection } from '../contracts/strategy'

/**
 * Civic / participatory campaigns must show their human actors, not drift to a
 * lone symbol. These terms force `activity-driven` by default (user override wins).
 */
const ACTIVITY_FORCING =
  /\b(awareness|drive|students?|nursing|nurses?|initiative|community|safety|campaign|volunteers?|rally|outreach|cleanliness|plantation|donation|blood camp|marathon|walkathon)\b/i

function actorHaystack(c: CanonicalEvent): string {
  return [c.eventName, c.eventType, c.tagline, c.description, c.organizationName, c.targetAudience]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export const DIRECTIVES: Record<VisualStrategy, string> = {
  symbolic:
    'Center ONE bold iconic symbol that embodies the message, in generous negative space; minimal or no human figures.',
  documentary:
    'A candid, authentic real-world photographic moment with natural light and a believable place and people.',
  'activity-driven':
    'Show REAL people actively performing the event (participants mid-action, engaged), populated and energetic — never a lone symbol or an empty venue.',
  institutional:
    'A composed, premium setting that conveys the institution’s authority, credibility, and trust.',
  emotional:
    'Lead with human emotion and intimacy — a tender, resonant moment that makes the cause feel personal.',
  cinematic:
    'A dramatic film-still atmosphere: bold directional lighting, depth, and mood, high production value.',
  'editorial-minimal':
    'Restrained editorial design: abundant negative space, one clean focal idea, refined and modern.',
}

function defaultStrategy(semantic: SemanticProfile, psychology: EventPsychology): VisualStrategy {
  // People actually present / doing the activity → show them.
  if (psychology.compositionStrategy === 'activity-collage' || psychology.subjectType === 'activity') {
    return 'activity-driven'
  }
  if (psychology.subjectType === 'person' || psychology.compositionStrategy === 'portrait-hero') {
    return semantic.eventFamily === 'MEMORIAL-DECEASED' || semantic.eventFamily === 'TRIBUTE-LIVING'
      ? 'emotional'
      : 'documentary'
  }
  switch (semantic.eventFamily) {
    case 'ACADEMIC-CONFERENCE':
      return 'institutional'
    case 'AWARENESS-CAUSE':
      return 'symbolic'
    case 'MARKETING-PROMO':
      return 'cinematic'
    case 'CONCEPT-LAUNCH':
      return 'editorial-minimal'
    case 'MEMORIAL-DECEASED':
      return 'emotional'
    case 'CULTURAL-FESTIVAL':
    case 'CELEBRATION-LIVE':
    case 'SPORTS-MOTION':
      return 'activity-driven'
    default:
      return 'editorial-minimal'
  }
}

export function selectVisualStrategy(
  semantic: SemanticProfile,
  psychology: EventPsychology,
  canonical: CanonicalEvent,
  override?: VisualStrategy
): StrategySelection {
  // 1. Explicit user override always wins.
  if (override && DIRECTIVES[override]) {
    return { strategy: override, directive: DIRECTIVES[override], source: 'override' }
  }

  // 2. Civic/participatory keywords force activity-driven — UNLESS a single human
  //    is clearly the hero (e.g. an uploaded portrait), which keeps person handling.
  const isPersonHero =
    psychology.subjectType === 'person' || psychology.compositionStrategy === 'portrait-hero'
  if (!isPersonHero && ACTIVITY_FORCING.test(actorHaystack(canonical))) {
    return { strategy: 'activity-driven', directive: DIRECTIVES['activity-driven'], source: 'default' }
  }

  // 3. Otherwise fall back to the family/composition default.
  const strategy = defaultStrategy(semantic, psychology)
  return { strategy, directive: DIRECTIVES[strategy], source: 'default' }
}
