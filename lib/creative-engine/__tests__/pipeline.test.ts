/**
 * Creative Engine — pure-stage harness.
 * Run: npx tsx lib/creative-engine/__tests__/pipeline.test.ts
 *
 * Offline only (forceFallback) — no API keys required. Asserts the load-bearing
 * invariants: no field is ever dropped, the scene prompt carries NO headline text,
 * the context partitions are well-formed, and the Director fallback is valid.
 */

import type { CompiledFormData } from '@/lib/prompts/services/form-data-compiler'
import { planCreative } from '../pipeline'
import { resolveAliases } from '../registry/alias-resolver'
import { enrichSemantics } from '../stages/s05-semantic-enrichment'
import { toCanonicalEvent, type CanonicalAdapterExtras } from '../adapters/form-compiler-adapter'

let passed = 0
let failed = 0
function ok(name: string, cond: boolean, detail?: string) {
  if (cond) {
    passed++
    console.log(`  ✅ ${name}`)
  } else {
    failed++
    console.error(`  ❌ ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

const rawFormData: Record<string, unknown> = {
  title: 'PATHFINDER',
  place: 'Royal Embassy',
  chief_guest: 'Roja',
  specialNote: 'networking dinner included',
  someUnknownField: 'keep me safe',
  language: 'en', // meta — must be ignored
}

const compiled: CompiledFormData = {
  eventName: 'PATHFINDER',
  eventType: 'leadership summit',
  date: '26 January 2026',
  time: '4:00 PM',
  endTime: null,
  venue: 'Royal Embassy',
  speakerName: 'Roja',
  speakerDesignation: 'JICATE',
  organizationName: 'Young Indians Erode',
  speakers: [{ name: 'Roja', designation: 'JICATE', role: null }],
  description: 'career growth and professional networking',
  tagline: 'Navigate your future',
  eventNote: null,
  initiativeText: null,
  initiativeColor: null,
  customFields: { specialNote: 'networking dinner included', someUnknownField: 'keep me safe' },
  format: { id: 'event_poster', name: 'Event Poster', dimensions: { width: 1080, height: 1440 } },
  theme: null,
  style: null,
  language: 'en',
  sophistication: null,
  creativeFidelity: null,
  alignment: null,
  fontStyle: null,
  visualDirection: null,
  targetAudience: 'young professionals',
  subjectAnalysis: undefined,
  rawFormData,
}

const extras: CanonicalAdapterExtras = {
  formatId: 'event_poster',
  brand: { primary: '#005B96', secondary: '#FF6B35', accent: '#FFFFFF', region: 'tamil-nadu' },
  backgroundStyle: 'pop-modern',
  fullCanvas: false,
  logoBarsEnabled: true,
  speakerPhotoFlags: [false],
  rawFormData,
}

async function main() {
  console.log('\n[Creative Engine] Pure-stage harness\n')

  // 1 — Alias resolution never drops a field.
  console.log('Stage 3 — Alias resolution')
  const res = resolveAliases(rawFormData)
  const accountedFor = new Set([...Object.values(res.resolvedFrom), ...res.customFields.map((c) => c.key)])
  const scalarKeys = Object.keys(rawFormData).filter((k) => k !== 'language')
  ok(
    'every scalar raw key is resolved or preserved (never dropped)',
    scalarKeys.every((k) => accountedFor.has(k)),
    `missing: ${scalarKeys.filter((k) => !accountedFor.has(k)).join(', ')}`
  )
  ok(
    'unknown field lands in customFields',
    res.customFields.some((c) => c.key === 'someUnknownField')
  )
  ok('meta key (language) is ignored', !accountedFor.has('language'))

  // 2 — Canonical model.
  console.log('\nStage 4 — Canonical model')
  const canonical = toCanonicalEvent(compiled, extras)
  ok('eventName carried', canonical.eventName === 'PATHFINDER')
  ok('speaker carried with designation', canonical.speakers[0]?.designation === 'JICATE')
  ok('format category resolved', canonical.format.category === 'poster_portrait')
  ok('provenance recorded', Object.keys(canonical.provenance.resolvedFrom).length > 0)

  // 3 — Semantic enrichment.
  console.log('\nStage 5 — Semantic enrichment')
  const semantic = enrichSemantics(canonical)
  ok('classifies a known family', !!semantic.eventFamily)
  ok('summit → academic conference', semantic.eventFamily === 'ACADEMIC-CONFERENCE', `got ${semantic.eventFamily}`)

  // 4 — Full plan, offline.
  console.log('\nStages 1–12a — planCreative (offline)')
  const plan = await planCreative({ compiled, extras }, { formatId: 'event_poster', forceFallback: true })

  ok('director falls back offline', plan.direction.source === 'fallback')
  ok('scene prompt forbids text', /No text/i.test(plan.scene.backgroundPrompt))
  ok(
    'scene prompt does NOT contain the headline (text is rendered deterministically)',
    !plan.scene.backgroundPrompt.includes('PATHFINDER')
  )
  ok('renderableText keeps the real headline', plan.context.renderableText.headline === 'PATHFINDER')
  ok(
    'layout produced a headline text layer',
    plan.layout.textLayers.some((l) => l.role === 'headline' && l.text === 'PATHFINDER')
  )
  ok(
    'layout reserves a header band for logos',
    plan.layout.reservedZones.header.rect.h > 0
  )
  ok(
    'speaker rendered as text layer (no photo)',
    plan.layout.textLayers.some((l) => l.role === 'speaker' && l.text.includes('Roja'))
  )

  // 5 — Context partition firewall (spot check).
  console.log('\nStage 6 — Context partitions')
  ok('typographyContext has headline', plan.context.typographyContext.headlineText === 'PATHFINDER')
  ok('spatialContext has zone bands', Array.isArray(plan.context.spatialContext.zones.header))
  ok('brandContext carries primary', plan.context.brandContext.primary === '#005B96')

  console.log(`\n${'─'.repeat(48)}`)
  console.log(`  ${passed} passed, ${failed} failed`)
  console.log(`${'─'.repeat(48)}\n`)
  if (failed > 0) process.exit(1)
}

main().catch((e) => {
  console.error('Harness crashed:', e)
  process.exit(1)
})
