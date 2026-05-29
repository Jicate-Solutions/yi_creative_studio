/**
 * Acceptance test (requirement F) — the exact Road Safety Awareness Drive brief.
 * Run: npx tsx lib/creative-engine/__tests__/smoke-roadsafety.ts
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
try {
  const envText = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of envText.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) {
      let v = m[2].trim()
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
      process.env[m[1]] = v
    }
  }
} catch {
  /* ambient env */
}

import type { CompiledFormData } from '@/lib/prompts/services/form-data-compiler'
import { planCreative } from '../pipeline'
import type { CanonicalAdapterExtras } from '../adapters/form-compiler-adapter'

// The exact brief from requirement F.
const rawFormData: Record<string, unknown> = {
  backgroundStyle: 'advertising',
  eventName: 'Road Safety Awareness Drive',
  eventTagline: 'Drive Safe. Save Lives.',
  eventDate: '2026-06-15',
  eventTime: '09:00',
  venue: 'Kumarapalayam Junction',
  organizationName: 'JKKN Nursing Students Initiative',
  eventDescription:
    'Promote road safety awareness and responsible driving practices. JKKN nursing students conduct a community awareness drive by guiding commuters, helping riders understand helmet safety, and supporting safer pedestrian movement at Kumarapalayam Junction.',
  visualStrategy: 'activity-driven',
}

const compiled: CompiledFormData = {
  eventName: 'Road Safety Awareness Drive',
  eventType: 'awareness campaign',
  date: '15 June 2026',
  time: '09:00 AM',
  endTime: null,
  venue: 'Kumarapalayam Junction',
  speakerName: null,
  speakerDesignation: null,
  organizationName: 'JKKN Nursing Students Initiative',
  speakers: null,
  description: rawFormData.eventDescription as string,
  tagline: 'Drive Safe. Save Lives.',
  eventNote: null,
  initiativeText: null,
  initiativeColor: null,
  customFields: {},
  format: { id: 'event_poster', name: 'Event Poster', dimensions: { width: 1080, height: 1440 } },
  theme: null,
  style: 'advertising',
  language: 'en',
  sophistication: null,
  creativeFidelity: null,
  alignment: null,
  fontStyle: null,
  visualDirection: null,
  targetAudience: 'commuters, students, and the local community',
  subjectAnalysis: undefined,
  rawFormData,
}

const extras: CanonicalAdapterExtras = {
  formatId: 'event_poster',
  brand: { primary: '#005B96', secondary: '#FF6B35', accent: '#FFFFFF', region: 'tamil-nadu' },
  backgroundStyle: 'advertising',
  fullCanvas: false,
  logoBarsEnabled: true,
  speakerPhotoFlags: [],
  rawFormData,
}

async function main() {
  console.log(`\nANTHROPIC_API_KEY present: ${!!process.env.ANTHROPIC_API_KEY}\n`)
  const plan = await planCreative(
    { compiled, extras },
    { formatId: 'event_poster', visualStrategy: 'activity-driven' }
  )

  const a = plan.direction.narrativeAnchor
  console.log('── STRATEGY & ACTOR ────────────────────────')
  console.log(`RENDERING MODE = ${plan.renderingMode}`)
  console.log(`VISUAL STRATEGY = ${plan.strategy.strategy} (${plan.strategy.source})`)
  console.log(`theme = "${plan.direction.creativeTheme}" | director = ${plan.direction.source}`)
  console.log(`primaryActor   = ${a.primaryActor}`)
  console.log(`primaryAction  = ${a.primaryAction}`)
  console.log(`mustRemainVisible = ${a.mustRemainVisible}`)
  console.log(`supportingSymbols = [${a.supportingSymbols.join(', ')}]`)

  console.log('\n══ SCENE PROMPT (background-only) ══\n')
  console.log(plan.scene.backgroundPrompt)

  console.log('\n── DETERMINISTIC TEXT LAYERS (SVG/Sharp) ───')
  for (const l of plan.layout.textLayers) console.log(`  [${l.role}] "${l.text}"`)

  console.log('\n── ACCEPTANCE CHECKS ───────────────────────')
  const sp = plan.scene.backgroundPrompt
  const hay = (a.primaryActor + ' ' + plan.direction.sceneNarrative).toLowerCase()
  check('strategy is activity-driven', plan.strategy.strategy === 'activity-driven')
  check('primaryActor names the nursing students', /nursing students/i.test(a.primaryActor))
  check('actor must remain visible', a.mustRemainVisible === true)
  check('scene mentions the students (actor preserved)', /nursing students|students/i.test(hay))
  check('headline = tagline (advertising hierarchy)', plan.context.renderableText.headline === 'Drive Safe. Save Lives.')
  check('subheadline = event name', plan.context.renderableText.subtitle === 'Road Safety Awareness Drive')
  // advertising → ai_native: the AI renders the copy, so the scene INCLUDES it (and verification runs post-gen)
  check('rendering mode = ai_native (advertising)', plan.renderingMode === 'ai_native')
  check('scene instructs AI to render the copy', sp.includes('Drive Safe. Save Lives.') && sp.includes('Road Safety Awareness Drive'))
  check(
    'requiredVisibleText lists headline + venue',
    plan.scene.requiredVisibleText.includes('Drive Safe. Save Lives.') &&
      plan.scene.requiredVisibleText.includes('Kumarapalayam Junction')
  )
  check('brand colors present in palette', sp.includes('#005B96') || sp.includes('#FF6B35'))
  console.log('')
}

let failed = 0
function check(name: string, cond: boolean) {
  console.log(`  ${cond ? '✅' : '❌'} ${name}`)
  if (!cond) failed++
}

main()
  .then(() => process.exit(failed > 0 ? 1 : 0))
  .catch((e) => {
    console.error('crashed:', e)
    process.exit(1)
  })
