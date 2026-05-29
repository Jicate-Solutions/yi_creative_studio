/**
 * Verify the v55.x style-fidelity fix: an EXPLICITLY-picked `scene` ("Realistic")
 * brief must produce documentary photography prose from the Lab Director — NOT pop-art.
 * Also dumps a pop-modern run to confirm the pop prose is unchanged (no regression).
 *
 * Calls the real Lab Director (Claude Sonnet) — one cheap text call per style, NO image gen.
 * Run: npx tsx scripts/verify-style-fidelity.ts
 */
import { readFileSync } from 'node:fs'
import { createDirectorBrief } from '@/lib/agents/lab-creative-director'
import { getBackgroundStyle, type BackgroundStyleOption } from '@/lib/config/background-styles'

// Load .env.local so the Anthropic call works under tsx.
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* no .env.local */ }

// Words that should NEVER appear in a Realistic/scene poster's prose (pop-art contamination).
const POP_CONTAMINATION = [
  'halftone', 'screen-print', 'screenprint', 'silkscreen', 'ben-day', 'benday',
  'contour outline', 'ink-registration', 'ink registration', 'registration mark',
  'registration offset', 'pop-art', 'pop art', 'risograph',
]

function buildInput(style: BackgroundStyleOption, styleId: string) {
  const hasCtx = !!(style.compatibleConcepts && style.designerReferences && style.craftSignatures && style.bannedCombinations)
  return {
    eventName: 'Smileathon 2026',
    description: 'A 3km charity run for children aged 4 to 12, organised by JKKN Dental College & Hospital',
    tagline: 'A Run for Bright Smiles and a Brighter Future',
    targetAudience: 'Children aged 4 to 12 years and their parents',
    subjectType: 'activity' as const,
    compositionStrategy: 'activity-collage' as const,
    brandColors: { primary: '#107023', secondary: '#fcff33', accent: '#faf9f4' },
    region: 'tamil-nadu',
    backgroundStyle: styleId,
    styleLock: style.geminiStyleLock ?? undefined,
    formatId: 'event_poster',
    canvasDimensions: { width: 1080, height: 1440 },
    hasReferencePhoto: false,
    fullCanvas: false,
    eventDetails: { dateLine: '29 March 2026', timeLine: '6 AM – 10 AM', venueLine: 'Nattraja Vidhyalya CBSE School Campus' },
    styleContext: hasCtx ? {
      label: style.label,
      compatibleConcepts: style.compatibleConcepts!,
      designerReferences: style.designerReferences!,
      craftSignatures: style.craftSignatures!,
      bannedCombinations: style.bannedCombinations!,
    } : undefined,
  }
}

;(async () => {
  for (const styleId of ['scene', 'pop-modern']) {
    const style = getBackgroundStyle(styleId)!
    const res = await createDirectorBrief(buildInput(style, styleId))
    const prose = res.output.prosePrompt
    const lower = prose.toLowerCase()
    const hits = POP_CONTAMINATION.filter((w) => lower.includes(w))

    console.log(`\n══════ STYLE: ${styleId} (${style.label}) ══════`)
    console.log(`Theme: ${res.output.visualThemeName} | Mood: ${res.output.mood}`)
    console.log(`Pop-vocabulary hits: ${hits.length ? hits.join(', ') : 'NONE'}`)
    if (styleId === 'scene') {
      console.log(hits.length === 0
        ? '✅ PASS — Realistic prose carries NO pop-art vocabulary'
        : '❌ FAIL — Realistic prose still leaked pop-art vocabulary')
    } else {
      console.log(hits.length > 0
        ? '✅ pop-modern still uses pop craft (no regression)'
        : '⚠️ pop-modern prose lost its pop craft — check')
    }
    console.log('\n--- prose ---\n' + prose + '\n')
  }
})()
