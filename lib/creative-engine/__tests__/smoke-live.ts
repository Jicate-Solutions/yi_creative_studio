/**
 * Live smoke test — exercises the REAL AI path (no forceFallback).
 * Run: npx tsx lib/creative-engine/__tests__/smoke-live.ts
 * Requires ANTHROPIC_API_KEY (Director). Falls back gracefully if absent.
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
// Minimal .env.local loader (tsx doesn't auto-load it; avoids a dotenv dependency).
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
  /* no .env.local — rely on ambient env */
}
import type { CompiledFormData } from '@/lib/prompts/services/form-data-compiler'
import { planCreative } from '../pipeline'
import type { CanonicalAdapterExtras } from '../adapters/form-compiler-adapter'

const rawFormData: Record<string, unknown> = {
  title: 'PATHFINDER',
  place: 'Royal Embassy',
  chief_guest: 'Roja',
  specialNote: 'networking dinner included',
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
  description: 'career growth and professional networking for young leaders',
  tagline: 'Navigate your future',
  eventNote: null,
  initiativeText: null,
  initiativeColor: null,
  customFields: { specialNote: 'networking dinner included' },
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
  console.log(`\nANTHROPIC_API_KEY present: ${!!process.env.ANTHROPIC_API_KEY}\n`)
  const plan = await planCreative({ compiled, extras }, { formatId: 'event_poster' })

  console.log('── PSYCHOLOGY ──────────────────────────────')
  console.log(`subjectType=${plan.psychology.subjectType} strategy=${plan.psychology.compositionStrategy} source=${plan.psychology.source}`)
  console.log(`eventFamily=${plan.semantic.eventFamily}`)

  console.log('\n── CREATIVE DIRECTION ──────────────────────')
  console.log(`source: ${plan.direction.source}`)
  console.log(`theme: ${plan.direction.creativeTheme}`)
  console.log(`hero: [${plan.direction.heroElement.kind}] ${plan.direction.heroElement.description}`)
  console.log(`scene: ${plan.direction.sceneNarrative}`)
  console.log(`lighting: ${plan.direction.lightingStyle}`)
  console.log(`palette: ${plan.direction.paletteDirection}`)
  console.log(`mood: ${plan.direction.moodWords.join(', ')}`)

  console.log('\n── SCENE PROMPT (background-only, sent to Gemini) ──')
  console.log(plan.scene.backgroundPrompt)

  console.log('\n── DETERMINISTIC TEXT LAYERS ───────────────')
  for (const l of plan.layout.textLayers) {
    console.log(`  [${l.role}] "${l.text}" @ y=${l.rect.y} font=${l.typography.minFontPx}-${l.typography.maxFontPx}px`)
  }

  console.log('\n── SANITY ──────────────────────────────────')
  console.log(`scene contains "PATHFINDER"? ${plan.scene.backgroundPrompt.includes('PATHFINDER')} (should be false)`)
  console.log(`scene forbids text? ${/No text/i.test(plan.scene.backgroundPrompt)} (should be true)`)
  console.log('')
}

main().catch((e) => {
  console.error('Smoke crashed:', e)
  process.exit(1)
})
