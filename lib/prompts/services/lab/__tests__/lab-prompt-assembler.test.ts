/**
 * Lab Prompt Assembler — runnable test harness (no jest runner installed).
 *
 * Pure-function test (NO API call, no env needed): feeds a stub DirectorOutput
 * carrying the v55.x photographic-spec fields (lighting / camera / qualityBar /
 * avoidNotes) and asserts the assembled Gemini prompt weaves them in.
 *
 * Run with:
 *   npx tsx lib/prompts/services/lab/__tests__/lab-prompt-assembler.test.ts
 *
 * Exits 0 if all assertions pass, 1 otherwise.
 */

import { assembleLabPrompt } from '../lab-prompt-assembler'
import type { DirectorOutput } from '@/lib/agents/lab-creative-director'

// --- tiny assertion runner ---------------------------------------------------
let passed = 0
let failed = 0
function check(name: string, cond: boolean): void {
  if (cond) {
    passed++
    console.log(`  ✅ ${name}`)
  } else {
    failed++
    console.error(`  ❌ ${name}`)
  }
}

// --- stub Director output with distinctive spec values -----------------------
const baseOutput: DirectorOutput = {
  prosePrompt:
    'A decisive-moment photojournalistic capture of four Indian schoolchildren mid-stride on a bright morning track. ' +
    'Keep the top 40% and bottom 18% as soft atmospheric continuation of the background — Sharp will composite logo bars afterwards.',
  visualThemeName: 'Sunrise Run Energy',
  mood: 'joyful, energetic, bright',
  reasoning: 'Kids-in-motion event demands real motion and high-key light.',
  lighting: 'hard directional 6 AM sun, long warm shadows, high-key bright',
  camera: '35mm full-frame, f/4, eye-level, fast shutter freezing mid-stride',
  qualityBar: 'magazine-print sharpness, vivid color grade, premium poster finish',
  avoidNotes: 'distorted faces, extra fingers, warped lettering, flat clip-art',
}

console.log('\n[Lab Prompt Assembler] photographic-spec weaving\n')

// Case 1 — full spec is woven into the prompt
{
  const { prompt } = assembleLabPrompt(baseOutput, { canvasWidth: 1080, canvasHeight: 1440 })
  check('includes Lighting line', prompt.includes('hard directional 6 AM sun'))
  check('includes Camera line', prompt.includes('35mm full-frame, f/4'))
  check('includes Finish/quality line', prompt.includes('magazine-print sharpness'))
  check('includes Mood line', prompt.includes('joyful, energetic, bright'))
  check('includes negative "free of" tail', prompt.includes('free of distorted faces, extra fingers, warped lettering, flat clip-art'))
  check('keeps the Director prose', prompt.includes('decisive-moment photojournalistic capture'))
  check('has a Photographic direction block', prompt.includes('Photographic direction for this poster'))
}

// Case 2 — empty avoidNotes must not produce a dangling "free of ."
{
  const { prompt } = assembleLabPrompt(
    { ...baseOutput, avoidNotes: '' },
    { canvasWidth: 1080, canvasHeight: 1440 }
  )
  check('no dangling "free of ." when avoidNotes empty', !/free of\s*\.?/i.test(prompt) || prompt.includes('Rendered with clean natural anatomy'))
  check('still includes camera line when avoidNotes empty', prompt.includes('35mm full-frame, f/4'))
}

// Case 3 — trailing period on avoidNotes is normalised (no double period)
{
  const { prompt } = assembleLabPrompt(
    { ...baseOutput, avoidNotes: 'muddy colors.' },
    { canvasWidth: 1080, canvasHeight: 1440 }
  )
  check('normalises trailing period (no "colors..")', !prompt.includes('muddy colors..'))
  check('includes normalised negative', prompt.includes('free of muddy colors.'))
}

// --- summary -----------------------------------------------------------------
console.log(`\n[Lab Prompt Assembler] ${passed} passed, ${failed} failed\n`)
process.exit(failed === 0 ? 0 : 1)
