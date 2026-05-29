/**
 * Spot-check the v56.0 new styles: confirm the Lab Director renders each in its OWN
 * signature medium (and doesn't bleed into a neighbour). One cheap Claude call per
 * style, NO image gen. Run: npx tsx scripts/verify-new-styles.ts
 */
import { readFileSync } from 'node:fs'
import { createDirectorBrief } from '@/lib/agents/lab-creative-director'
import { getBackgroundStyle, type BackgroundStyleOption } from '@/lib/config/background-styles'

try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* no .env.local */ }

// styleId → { mustMention (its own signature, any one), mustAvoid (a neighbour's signature) }
const CHECKS: Record<string, { want: string[]; avoid: string[] }> = {
  comic:      { want: ['ink', 'speed-line', 'speed line', 'comic', 'ben-day', 'panel', 'bubble'], avoid: ['screen-print', 'silkscreen'] },
  luxury:     { want: ['gold', 'foil', 'serif', 'jewel', 'obsidian', 'navy'], avoid: ['halftone', 'screen-print', 'pop-art'] },
  collegiate: { want: ['crest', 'laurel', 'heraldic', 'shield', 'serif'], avoid: ['halftone', 'screen-print', 'pop-art', 'neon'] },
}

function buildInput(style: BackgroundStyleOption, styleId: string) {
  return {
    eventName: 'Annual Day 2026',
    description: 'The annual college celebration with cultural performances, awards and chief-guest address',
    tagline: 'A Night to Remember',
    targetAudience: 'Students, faculty and families',
    subjectType: 'activity' as const,
    compositionStrategy: 'activity-collage' as const,
    brandColors: { primary: '#005B96', secondary: '#FF6B35', accent: '#faf9f4' },
    region: 'tamil-nadu',
    backgroundStyle: styleId,
    styleLock: style.geminiStyleLock ?? undefined,
    formatId: 'event_poster',
    canvasDimensions: { width: 1080, height: 1440 },
    hasReferencePhoto: false,
    fullCanvas: false,
    eventDetails: { dateLine: '15 March 2026', timeLine: '6 PM', venueLine: 'College Auditorium' },
    styleContext: {
      label: style.label,
      compatibleConcepts: style.compatibleConcepts!,
      designerReferences: style.designerReferences!,
      craftSignatures: style.craftSignatures!,
      bannedCombinations: style.bannedCombinations!,
    },
  }
}

;(async () => {
  for (const styleId of Object.keys(CHECKS)) {
    const style = getBackgroundStyle(styleId)!
    const res = await createDirectorBrief(buildInput(style, styleId))
    const lower = res.output.prosePrompt.toLowerCase()
    const { want, avoid } = CHECKS[styleId]
    const wantHit = want.filter((w) => lower.includes(w))
    // A neighbour-style word only counts as real bleed if it is NOT a negation
    // (the Director legitimately echoes banlist words as "no neon / not pop-art").
    const NEG = /(no|not|never|without|avoid|free of|zero)\s[\w\s,'-]{0,28}$/
    const isNegated = (w: string) => {
      let from = 0
      while (true) {
        const i = lower.indexOf(w, from)
        if (i < 0) return true // no non-negated occurrence found
        const before = lower.slice(Math.max(0, i - 32), i)
        if (!NEG.test(before)) return false // a real, non-negated use
        from = i + w.length
      }
    }
    const avoidHit = avoid.filter((w) => lower.includes(w) && !isNegated(w))
    console.log(`\n══════ ${styleId} (${style.label}) — "${res.output.visualThemeName}" ══════`)
    console.log(`own-signature hits: ${wantHit.length ? wantHit.join(', ') : 'NONE'}`)
    console.log(`neighbour-bleed hits: ${avoidHit.length ? avoidHit.join(', ') : 'NONE'}`)
    console.log(wantHit.length > 0 && avoidHit.length === 0
      ? '✅ PASS — renders in its own medium, no bleed'
      : '⚠️ REVIEW — check the prose below')
    console.log('--- prose (first 500 chars) ---\n' + res.output.prosePrompt.slice(0, 500))
  }
})()
