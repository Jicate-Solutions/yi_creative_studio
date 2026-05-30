/**
 * Designer Pipeline — Design-domain detection (v1.1).
 *
 * Reads the brief (eventName / tagline / description / userVisualIdea) and decides the
 * coarse DesignDomain the poster lives in, plus the drift the Director must forbid. This
 * is the deterministic guard that keeps a Makeup Carnival in the beauty world instead of
 * letting the image model reinterpret it as a tech hub / coding conference. Nothing here
 * calls an LLM — it is pure pattern matching so the result is stable and testable.
 */

import type { DesignDomain, DomainLock } from './contracts'

/**
 * Domain pattern table. Order matters — the FIRST match wins, so more specific worlds
 * (road-safety, healthcare) are listed before broad ones (education, general). Each entry
 * carries the human label and the list of worlds the Director must NOT drift into.
 */
const DOMAIN_PATTERNS: Array<{
  domain: DesignDomain
  label: string
  re: RegExp
  forbiddenDrift: string[]
}> = [
  {
    domain: 'beauty',
    label: 'beauty / cosmetics / makeup',
    re: /\b(makeup|make-?up|cosmetic|cosmetics|beauty|salon|glam|glamour|bridal|mehndi|nail|nails|skincare|spa|hairsty|hairstyl|lipstick|mascara|eyeliner|foundation\s+brush|carnival\s+of\s+beauty)\b/i,
    forbiddenDrift: [
      'tech hub',
      'coding / software screens',
      'digital tablets / dashboards',
      'futuristic conference',
      'corporate office setting',
    ],
  },
  {
    domain: 'road-safety',
    label: 'road safety',
    re: /\b(road\s*safety|helmet|zebra\s*cross|crosswalk|traffic\s*(?:safety|signal|rule)|seat\s*belt|rider\s*safety|drink\s*and\s*drive|speed\s*limit)\b/i,
    forbiddenDrift: [
      'empty road with no people',
      'only a floating helmet symbol',
      'generic highway stock photo',
      'tech / office setting',
    ],
  },
  {
    domain: 'healthcare',
    label: 'healthcare / nursing / medical',
    re: /\b(nursing|nurse|nurses|health\s*worker|paramedic|pharmacy|pharma|medical|clinic|hospital|stethoscope|patient|doctor|surgeon|wellness\s*check|first\s*aid|blood\s*donation)\b/i,
    forbiddenDrift: [
      'tech / corporate office setting',
      'futuristic lab with holograms',
      'empty clinic with no people',
    ],
  },
  {
    domain: 'sports',
    label: 'sports / fitness',
    re: /\b(sport|sports|cricket|football|soccer|basketball|volleyball|marathon|athletic|athlete|tournament|fitness|yoga|\bgym\b|track\s*and\s*field|kabaddi|hockey)\b/i,
    forbiddenDrift: ['corporate office', 'tech conference', 'empty stadium with no players'],
  },
  {
    domain: 'cultural',
    label: 'cultural / festive',
    re: /\b(diwali|deepavali|pongal|onam|holi|eid|christmas|navratri|dussehra|festival|festive|cultural|kolam|rangoli|diya|folk|classical\s*dance|temple\s*festival|carnival)\b/i,
    forbiddenDrift: ['corporate office', 'tech / coding scene', 'sterile modern minimalism'],
  },
  {
    domain: 'technology',
    label: 'technology',
    re: /\b(tech|technology|coding|hackathon|software|robotics|\bai\b|\bml\b|startup|developer|cyber|cloud\s*computing|blockchain|iot|web\s*dev|app\s*dev)\b/i,
    forbiddenDrift: ['rustic / vintage hand-drawn world', 'floral festive decoration'],
  },
  {
    domain: 'leadership',
    label: 'leadership / business',
    re: /\b(leadership|business|entrepreneur|management|corporate|summit|conclave|networking|strategy|board\s*meet|mentorship|industry\s*meet)\b/i,
    forbiddenDrift: ['childish / cartoonish world', 'cluttered festive decoration'],
  },
  {
    domain: 'education',
    label: 'education / academic',
    re: /\b(education|school|college|campus|student|students|workshop|seminar|lecture|academic|exam|graduation|convocation|department\s*day|inter[-\s]?college|orientation|fresher)\b/i,
    forbiddenDrift: ['corporate boardroom', 'futuristic tech hub', 'empty classroom with no people'],
  },
  {
    domain: 'official',
    label: 'official / formal',
    re: /\b(certificate|letterhead|notice|circular|memorandum|official|government|gazette|appointment\s*letter|id\s*card)\b/i,
    forbiddenDrift: ['playful illustration', 'busy decorative collage', 'neon party styling'],
  },
]

/** Formats that are inherently official regardless of topic wording. */
const OFFICIAL_FORMAT_RE =
  /certificate|letterhead|report_cover|book_cover|business_card|id_card|notice|resume/i

/**
 * Detect the design domain from the brief. `formatId` lets formal documents force the
 * `official` domain even when the topic text reads like something else.
 */
export function detectDesignDomain(haystack: string, formatId?: string): DomainLock {
  if (formatId && OFFICIAL_FORMAT_RE.test(formatId)) {
    const off = DOMAIN_PATTERNS.find((d) => d.domain === 'official')!
    return { domain: 'official', confidence: 0.9, label: off.label, forbiddenDrift: off.forbiddenDrift }
  }

  for (const entry of DOMAIN_PATTERNS) {
    const m = haystack.match(new RegExp(entry.re, 'gi'))
    if (m && m.length) {
      // More distinct keyword hits → higher confidence (capped at 0.95).
      const distinct = new Set(m.map((s) => s.toLowerCase())).size
      const confidence = Math.min(0.95, 0.65 + (distinct - 1) * 0.1)
      return {
        domain: entry.domain,
        confidence: Number(confidence.toFixed(2)),
        label: entry.label,
        forbiddenDrift: entry.forbiddenDrift,
      }
    }
  }

  return {
    domain: 'general',
    confidence: 0.3,
    label: 'general',
    forbiddenDrift: [],
  }
}
