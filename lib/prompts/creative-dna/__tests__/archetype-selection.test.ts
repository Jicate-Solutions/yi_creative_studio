/**
 * Archetype selection tests.
 *
 * Run with:  npx tsx lib/prompts/creative-dna/__tests__/archetype-selection.test.ts
 *
 * No test framework — these are plain assertions. Exits with code 1 on failure
 * so CI / the team-lead handoff can grep on it.
 */

import {
  selectArchetype,
  archetypeToPromptHint,
  ALL_ARCHETYPES,
} from '../index'

let passed = 0
let failed = 0
const failures: string[] = []

function assert(condition: boolean, label: string, detail?: string): void {
  if (condition) {
    passed++
    console.log(`  PASS  ${label}`)
  } else {
    failed++
    const msg = detail ? `${label} — ${detail}` : label
    failures.push(msg)
    console.error(`  FAIL  ${msg}`)
  }
}

function section(title: string): void {
  console.log(`\n── ${title} ──`)
}

// ============================================================
// CASE 1 — Happy Birthday Chairperson → person-tribute archetype
// ============================================================
section('Case 1: Happy Birthday Chairperson')

const c1 = selectArchetype({
  formatId: 'event_poster',
  subjectType: 'person',
  compositionStrategy: 'portrait-hero',
  backgroundStyle: 'scene',
  formality: 'premium',
  energy: 'moderate',
  seed: 'Happy Birthday Chairperson Smt JKKN Sendamaraai',
})

const c1Acceptable = [
  'royal-indian-tribute',
  'corporate-annual-report-leader',
  'temple-honor-darshan',
  'bollywood-birthday-tribute',
  'time-100-portrait',
  'vogue-india-cover',
  'modern-magazine-cover',
  'national-geographic-environmental-portrait',
  // v53.3 — South Indian / Tamil archetypes added for region-aware picking
  'kollywood-hand-painted-tribute',
  'chettinad-elder-honor',
  'tamil-temple-darshan-tribute',
  'carnatic-recital-tribute',
]

assert(c1 !== null, 'Case 1 returned an archetype (not null)')
assert(
  c1 !== null && c1Acceptable.includes(c1.id),
  'Case 1 picked an acceptable person archetype',
  c1 ? `got: ${c1.id}` : 'got: null'
)

// v53.3: Case 1b — Same Chairperson brief WITH region='tamil-nadu' should
// pick a regionally appropriate Tamil/South Indian archetype, NEVER Bollywood.
const c1b = selectArchetype({
  formatId: 'event_poster',
  subjectType: 'person',
  compositionStrategy: 'portrait-hero',
  backgroundStyle: 'scene',
  formality: 'premium',
  energy: 'moderate',
  region: 'tamil-nadu',
  seed: 'Happy Birthday Chairperson Smt JKKN Sendamaraai',
})
const c1bTamilAcceptable = [
  'kollywood-hand-painted-tribute',
  'chettinad-elder-honor',
  'tamil-temple-darshan-tribute',
  'carnatic-recital-tribute',
  // pan-india / global / untagged person archetypes also acceptable
  'royal-indian-tribute',
  'corporate-annual-report-leader',
  'time-100-portrait',
  'vogue-india-cover',
  'modern-magazine-cover',
  'national-geographic-environmental-portrait',
  'temple-honor-darshan',
]
assert(c1b !== null, 'Case 1b (Tamil region) returned an archetype')
assert(
  c1b !== null && c1bTamilAcceptable.includes(c1b.id),
  'Case 1b (region=tamil-nadu) picked a region-appropriate archetype',
  c1b ? `got: ${c1b.id}` : 'got: null'
)
assert(
  c1b !== null && c1b.id !== 'bollywood-birthday-tribute',
  'Case 1b (region=tamil-nadu) did NOT pick Bollywood archetype',
  c1b ? `got: ${c1b.id}` : 'got: null'
)

// ============================================================
// CASE 2 — Pulse 2K26 cultural fest → activity archetype
// ============================================================
section('Case 2: Pulse 2K26 Cultural Fest')

const c2 = selectArchetype({
  formatId: 'event_poster',
  subjectType: 'activity',
  compositionStrategy: 'activity-collage',
  backgroundStyle: 'festive',
  formality: 'casual',
  energy: 'high',
  seed: 'Pulse 2K26 College Cultural Fest',
})

const c2Acceptable = [
  'college-fest-poster',
  'community-utsav',
  'diwali-festival-flyer',
]

assert(c2 !== null, 'Case 2 returned an archetype (not null)')
assert(
  c2 !== null && c2Acceptable.includes(c2.id),
  'Case 2 picked an acceptable activity archetype',
  c2 ? `got: ${c2.id}` : 'got: null'
)

// ============================================================
// CASE 3 — Annual Leadership Summit → concept archetype
// ============================================================
section('Case 3: Annual Leadership Summit')

const c3 = selectArchetype({
  formatId: 'event_poster',
  subjectType: 'concept',
  compositionStrategy: 'concept-iconic',
  backgroundStyle: 'scene',
  formality: 'premium',
  energy: 'moderate',
  seed: 'Annual Leadership Summit 2026',
})

const c3Acceptable = [
  'leadership-summit-classic',
  'ted-talk-titlecard',
  'un-summit-poster',
  'apple-keynote-slide',
  'innovation-launch-momentum',
]

assert(c3 !== null, 'Case 3 returned an archetype (not null)')
assert(
  c3 !== null && c3Acceptable.includes(c3.id),
  'Case 3 picked an acceptable concept archetype',
  c3 ? `got: ${c3.id}` : 'got: null'
)

// ============================================================
// CASE 4 — iPhone 17 Launch → product object-hero archetype
// ============================================================
section('Case 4: iPhone 17 Pro Launch')

const c4 = selectArchetype({
  formatId: 'event_poster',
  subjectType: 'product',
  compositionStrategy: 'object-hero',
  backgroundStyle: 'dark',
  formality: 'premium',
  energy: 'moderate',
  seed: 'iPhone 17 Pro Launch Showcase',
})

assert(c4 !== null, 'Case 4 returned an archetype (not null)')
assert(
  c4 !== null && c4.applicableTo.strategies.includes('object-hero'),
  'Case 4 archetype supports object-hero strategy',
  c4 ? `got: ${c4.id} with strategies=${c4.applicableTo.strategies.join(',')}` : 'got: null'
)

// ============================================================
// CASE 5 — Determinism and variety: same brief → same archetype,
//          different briefs → distribution across more than one bucket
// ============================================================
section('Case 5: Determinism + Variety')

const seedA = 'Brief A — Honoring Founder'
const seedB = 'Brief B — Welcome New Director Dr Priya'
const seedC = 'Brief C — Lifetime Achievement for Chairperson'
const seedD = 'Brief D — Felicitation Evening for Mrs Lakshmi'

const pick = (seed: string) =>
  selectArchetype({
    formatId: 'event_poster',
    subjectType: 'person',
    compositionStrategy: 'portrait-hero',
    seed,
  })

const pickA1 = pick(seedA)
const pickA2 = pick(seedA)
const pickB = pick(seedB)
const pickC = pick(seedC)
const pickD = pick(seedD)

assert(
  pickA1 !== null && pickA2 !== null && pickA1.id === pickA2.id,
  'Determinism: same seed always picks the same archetype',
  pickA1 && pickA2 ? `seedA pick1=${pickA1.id} pick2=${pickA2.id}` : 'one was null'
)

const distinctIds = new Set([pickA1, pickB, pickC, pickD].filter(Boolean).map((a) => a!.id))
assert(
  distinctIds.size >= 2,
  'Variety: four different seeds pick at least 2 distinct archetypes',
  `distinct=${distinctIds.size} ids=${[...distinctIds].join(',')}`
)

// ============================================================
// SANITY — total archetype count meets the floor
// ============================================================
section('Sanity: minimum archetype counts by category')

const byCategory = {
  person: ALL_ARCHETYPES.filter((a) => a.applicableTo.subjectTypes.includes('person')).length,
  activity: ALL_ARCHETYPES.filter((a) => a.applicableTo.subjectTypes.includes('activity')).length,
  concept: ALL_ARCHETYPES.filter((a) => a.applicableTo.subjectTypes.includes('concept')).length,
  product: ALL_ARCHETYPES.filter((a) => a.applicableTo.subjectTypes.includes('product')).length,
  place: ALL_ARCHETYPES.filter((a) => a.applicableTo.subjectTypes.includes('place')).length,
}

console.log(`  Counts by subject: ${JSON.stringify(byCategory)} (total=${ALL_ARCHETYPES.length})`)

assert(byCategory.person >= 8, `>= 8 person archetypes (got ${byCategory.person})`)
assert(byCategory.activity >= 6, `>= 6 activity archetypes (got ${byCategory.activity})`)
assert(byCategory.concept >= 5, `>= 5 concept archetypes (got ${byCategory.concept})`)
assert(byCategory.product >= 3, `>= 3 product archetypes (got ${byCategory.product})`)
assert(byCategory.place >= 3, `>= 3 place archetypes (got ${byCategory.place})`)

// ============================================================
// SANITY — every archetype has well-formed referenceLanguage
// ============================================================
section('Sanity: every archetype is well-formed')

for (const a of ALL_ARCHETYPES) {
  const rl = a.referenceLanguage
  const sceneOk = rl.visualScene.split(/\s+/).length >= 60
  const motifsOk = rl.decorativeMotifs.length >= 3 && rl.decorativeMotifs.length <= 6
  const avoidOk = rl.avoid.length >= 3 && rl.avoid.length <= 6
  const lightOk = rl.lightingDirection.length > 20
  const paletteOk = rl.paletteApproach.length > 20
  const idOk = /^[a-z][a-z0-9-]*$/.test(a.id)

  if (!sceneOk) failures.push(`${a.id}: visualScene too short`)
  if (!motifsOk) failures.push(`${a.id}: decorativeMotifs count out of range (${rl.decorativeMotifs.length})`)
  if (!avoidOk) failures.push(`${a.id}: avoid count out of range (${rl.avoid.length})`)
  if (!lightOk) failures.push(`${a.id}: lightingDirection too short`)
  if (!paletteOk) failures.push(`${a.id}: paletteApproach too short`)
  if (!idOk) failures.push(`${a.id}: id not kebab-case`)

  const ok = sceneOk && motifsOk && avoidOk && lightOk && paletteOk && idOk
  if (ok) passed++
  else failed++
}

console.log(`  ${ALL_ARCHETYPES.length} archetypes validated`)

// ============================================================
// EXAMPLE HINT — print the prompt block for the Happy Birthday brief
// ============================================================
section('Example: archetypeToPromptHint for Happy Birthday Chairperson')

if (c1) {
  console.log('')
  console.log(archetypeToPromptHint(c1))
  console.log('')
}

// ============================================================
// SUMMARY
// ============================================================
console.log('\n────────────────────────────────────────')
console.log(`Passed: ${passed}    Failed: ${failed}`)
console.log('────────────────────────────────────────')

if (failed > 0) {
  console.error('\nFailures:')
  for (const f of failures) console.error(`  - ${f}`)
  process.exit(1)
}
process.exit(0)
