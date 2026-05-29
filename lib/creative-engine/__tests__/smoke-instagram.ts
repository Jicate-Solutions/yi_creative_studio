/**
 * Live demo — traffic-awareness campaign (JKKN nursing students), Instagram post.
 * Run: npx tsx lib/creative-engine/__tests__/smoke-instagram.ts
 * Style chosen by the engine operator: photo-real documentary.
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
  /* rely on ambient env */
}

import type { CompiledFormData } from '@/lib/prompts/services/form-data-compiler'
import { planCreative } from '../pipeline'
import type { CanonicalAdapterExtras } from '../adapters/form-compiler-adapter'
import type { VisualStrategy } from '../contracts/strategy'

// Optional CLI arg: a strategy override (e.g. `activity-driven`). Omit for the default.
const override = process.argv[2] as VisualStrategy | undefined

const rawFormData: Record<string, unknown> = {
  title: 'Road Safety Awareness Drive',
  organization: 'JKKN College of Nursing',
  place: 'Kumarapalayam Junction',
}

const compiled: CompiledFormData = {
  eventName: 'Road Safety Awareness Drive',
  eventType: 'awareness campaign',
  date: '15 June 2026',
  time: '9:00 AM',
  endTime: null,
  venue: 'Kumarapalayam Junction',
  speakerName: null,
  speakerDesignation: null,
  organizationName: 'JKKN College of Nursing',
  speakers: null,
  description:
    'Nursing students lead a community traffic-safety drive — promoting helmet use, zebra-crossing discipline, and no drunk driving for safer roads.',
  tagline: 'Drive Safe, Save Lives',
  eventNote: null,
  initiativeText: null,
  initiativeColor: null,
  customFields: {},
  format: { id: 'instagram_post', name: 'Instagram Post', dimensions: { width: 1080, height: 1080 } },
  theme: null,
  style: 'photo-real',
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
  formatId: 'instagram_post',
  brand: { primary: '#005B96', secondary: '#FF6B35', accent: '#FFFFFF', region: 'tamil-nadu' },
  backgroundStyle: 'photo-real',
  fullCanvas: false,
  logoBarsEnabled: true,
  speakerPhotoFlags: [],
  rawFormData,
}

async function main() {
  console.log(`\nANTHROPIC_API_KEY present: ${!!process.env.ANTHROPIC_API_KEY}`)
  console.log(`strategy override: ${override ?? '(none — engine default)'}\n`)
  const plan = await planCreative(
    { compiled, extras },
    { formatId: 'instagram_post', visualStrategy: override }
  )

  console.log('── CLASSIFICATION ──────────────────────────')
  console.log(`eventFamily=${plan.semantic.eventFamily} | subjectType=${plan.psychology.subjectType} | composition=${plan.psychology.compositionStrategy}`)
  console.log(`VISUAL STRATEGY=${plan.strategy.strategy} (${plan.strategy.source})`)
  console.log(`theme="${plan.direction.creativeTheme}" | directorSource=${plan.direction.source}`)

  console.log('\n══ SCENE PROMPT (background-only, Instagram 1080×1080) ══\n')
  console.log(plan.scene.backgroundPrompt)

  console.log('\n── DETERMINISTIC TEXT LAYERS (drawn by Sharp, not the model) ──')
  for (const l of plan.layout.textLayers) {
    console.log(`  [${l.role}] "${l.text}"`)
  }
  console.log('')
}

main().catch((e) => {
  console.error('crashed:', e)
  process.exit(1)
})
