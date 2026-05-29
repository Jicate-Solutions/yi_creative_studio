/**
 * Stage 5 — Semantic Enrichment Layer
 *
 * Fields → MEANING. Classifies the brief into an EventFamily, then derives the
 * emotional + visual-behavior profile. Pure + deterministic in increment 1
 * (AI-augmentable later without changing the contract).
 *
 * ── TASTE DECISION POINT (yours to tune) ───────────────────────────────────────
 * The keyword tables below and the FAMILY_PROFILE map encode the platform's
 * creative judgment: what "annual day" should FEEL like vs "memorial" vs
 * "admission campaign". This is the single highest-leverage place to shape output
 * character. Edit the regexes / profiles freely — the rest of the pipeline keys
 * off EventFamily + the profile, so changes here ripple through the Director,
 * typography, and scene without touching other files.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import type { CanonicalEvent } from '../contracts/canonical'
import type { SemanticProfile, EventFamily } from '../contracts/semantic'

const MEMORIAL = /\b(memorial|remembrance|tribute to the late|in memory|condolence|rip|passed away)\b/i
const BIRTHDAY = /\b(birthday|b'?day|happy birthday)\b/i
const MARKETING = /\b(admission|admissions|enroll|enrol|join now|register now|offer|launch|sale|book your|limited seats|apply now|hiring|placement)\b/i
const SPORTS = /\b(marathon|\brun\b|\brace\b|sports|tournament|match|cricket|football|athletic|cycling|walkathon)\b/i
const FESTIVAL = /\b(diwali|deepavali|pongal|holi|christmas|\beid\b|navratri|onam|festival|new year|republic day|independence day|gandhi jayanti)\b/i
const AWARENESS = /\b(awareness|hygiene|safety|donation|blood|environment|climate|menstrual|cancer|literacy|\bdrive\b|plantation|cleanliness)\b/i
const ACADEMIC = /\b(seminar|workshop|conference|lecture|webinar|symposium|orientation|convocation|training|hackathon|summit|forum|guest lecture)\b/i
const CULTURAL = /\b(cultural|annual day|college day|\bfest\b|talent|dance|music night|farewell|fresher|reunion|celebration|function|fete)\b/i

/** Classify the brief into one EventFamily (decision-ordered: most specific first). */
export function classifyEventFamily(c: CanonicalEvent): EventFamily {
  const hay = [
    c.eventName,
    c.eventType,
    c.tagline,
    c.description,
    c.targetAudience,
    ...c.customFields.map((f) => f.value),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (MEMORIAL.test(hay)) return 'MEMORIAL-DECEASED'
  if (BIRTHDAY.test(hay)) return 'BIRTHDAY-LIVING'
  if (MARKETING.test(hay)) return 'MARKETING-PROMO'
  if (SPORTS.test(hay)) return 'SPORTS-MOTION'
  if (FESTIVAL.test(hay)) return 'CULTURAL-FESTIVAL'
  if (AWARENESS.test(hay)) return 'AWARENESS-CAUSE'
  if (ACADEMIC.test(hay)) return 'ACADEMIC-CONFERENCE'
  if (CULTURAL.test(hay)) return 'CELEBRATION-LIVE'
  return 'GENERIC-EVENT'
}

type Profile = Omit<SemanticProfile, 'eventFamily' | 'isMarketing'>

const FAMILY_PROFILE: Record<EventFamily, Profile> = {
  'BIRTHDAY-LIVING': {
    eventPsychology: { tone: 'joyful, warm', energy: 'high', audienceEmotion: 'affection and celebration' },
    visualBehavior: { composition: 'centered', sceneEnergy: 'kinetic', motionLanguage: 'flowing' },
  },
  'TRIBUTE-LIVING': {
    eventPsychology: { tone: 'honoring, gracious', energy: 'moderate', audienceEmotion: 'respect and admiration' },
    visualBehavior: { composition: 'centered', sceneEnergy: 'still', motionLanguage: 'static' },
  },
  'MEMORIAL-DECEASED': {
    eventPsychology: { tone: 'reverent, solemn', energy: 'calm', audienceEmotion: 'remembrance and grief' },
    visualBehavior: { composition: 'centered', sceneEnergy: 'still', motionLanguage: 'static' },
  },
  'SPORTS-MOTION': {
    eventPsychology: { tone: 'energetic, competitive', energy: 'explosive', audienceEmotion: 'adrenaline and drive' },
    visualBehavior: { composition: 'asymmetric', sceneEnergy: 'kinetic', motionLanguage: 'mid-action' },
  },
  'CULTURAL-FESTIVAL': {
    eventPsychology: { tone: 'festive, vibrant', energy: 'high', audienceEmotion: 'belonging and joy' },
    visualBehavior: { composition: 'panoramic', sceneEnergy: 'kinetic', motionLanguage: 'flowing' },
  },
  'CONCEPT-LAUNCH': {
    eventPsychology: { tone: 'bold, forward-looking', energy: 'high', audienceEmotion: 'anticipation' },
    visualBehavior: { composition: 'centered', sceneEnergy: 'ambient', motionLanguage: 'flowing' },
  },
  'ACADEMIC-CONFERENCE': {
    eventPsychology: { tone: 'premium, focused', energy: 'moderate', audienceEmotion: 'aspiration and curiosity' },
    visualBehavior: { composition: 'asymmetric', sceneEnergy: 'ambient', motionLanguage: 'static' },
  },
  'AWARENESS-CAUSE': {
    eventPsychology: { tone: 'earnest, empowering', energy: 'moderate', audienceEmotion: 'concern and resolve' },
    visualBehavior: { composition: 'centered', sceneEnergy: 'ambient', motionLanguage: 'flowing' },
  },
  'MARKETING-PROMO': {
    eventPsychology: { tone: 'persuasive, confident', energy: 'high', audienceEmotion: 'desire and urgency' },
    visualBehavior: { composition: 'asymmetric', sceneEnergy: 'ambient', motionLanguage: 'flowing' },
  },
  'CELEBRATION-LIVE': {
    eventPsychology: { tone: 'celebratory, lively', energy: 'high', audienceEmotion: 'pride and excitement' },
    visualBehavior: { composition: 'panoramic', sceneEnergy: 'kinetic', motionLanguage: 'mid-action' },
  },
  'GENERIC-EVENT': {
    eventPsychology: { tone: 'contemporary, professional', energy: 'moderate', audienceEmotion: 'interest' },
    visualBehavior: { composition: 'centered', sceneEnergy: 'ambient', motionLanguage: 'static' },
  },
}

export function enrichSemantics(canonical: CanonicalEvent): SemanticProfile {
  const eventFamily = classifyEventFamily(canonical)
  const profile = FAMILY_PROFILE[eventFamily]
  return {
    ...profile,
    eventFamily,
    isMarketing: eventFamily === 'MARKETING-PROMO',
  }
}
