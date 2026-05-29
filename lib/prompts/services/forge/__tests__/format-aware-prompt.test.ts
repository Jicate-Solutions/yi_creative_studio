/**
 * Forge format-aware prompt — runnable test harness (no jest runner installed).
 *
 * Pure-function test (NO API call, no env needed). Verifies that the v57.0 Format Profile
 * makes the Forge Director + assembler shape-aware across creative formats — and, critically,
 * that event_poster output is UNCHANGED (40% / 576px / 18% bands preserved).
 *
 * Covers:
 *   1. getFormatProfile() returns the correct shape/bands/footer-flag per format.
 *   2. buildUserPrompt() emits a FORMAT PROFILE block with the profile-correct reserve band.
 *   3. assembleForgePrompt() safety-net uses the profile bands and gates the footer-content
 *      ban on footerStripActive.
 *
 * Run with:
 *   npx tsx lib/prompts/services/forge/__tests__/format-aware-prompt.test.ts
 *
 * Exits 0 if all assertions pass, 1 otherwise.
 */

import { getFormatProfile } from '@/lib/config/format-zones'
import { assembleForgePrompt } from '../forge-prompt-assembler'
import { buildUserPrompt, type DirectorInput, type DirectorOutput } from '@/lib/agents/forge-creative-director'

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

// --- helpers -----------------------------------------------------------------
function baseDirectorInput(formatId: string, w: number, h: number): DirectorInput {
  return {
    eventName: 'Test Event',
    subjectType: 'concept',
    compositionStrategy: 'concept-iconic',
    brandColors: { primary: '#107023', secondary: '#fcff33' },
    formatId,
    canvasDimensions: { width: w, height: h },
    formatProfile: getFormatProfile(formatId),
    hasReferencePhoto: false,
  }
}

const stubOutput: DirectorOutput = {
  prosePrompt: 'A clean modern composition with a bold central motif and generous negative space.',
  visualThemeName: 'Modern Motif',
  mood: 'confident, clean, modern',
  reasoning: 'stub',
  lighting: 'clean even studio light',
  camera: 'flat front-on editorial view',
  qualityBar: 'premium print sharpness',
  avoidNotes: 'clutter, warped lettering',
}

// =============================================================================
console.log('\n[Forge Format Profile] getFormatProfile() per format\n')

{
  const ep = getFormatProfile('event_poster')
  check('event_poster reserveTopPct = 40 (unchanged)', ep.reserveTopPct === 40)
  check('event_poster reserveBottomPct = 18 (unchanged)', ep.reserveBottomPct === 18)
  check('event_poster footerStripActive = true', ep.footerStripActive === true)

  const ig = getFormatProfile('instagram_post')
  check('instagram_post is square (top 30)', ig.reserveTopPct === 30)
  check('instagram_post footerStripActive = true', ig.footerStripActive === true)

  const yt = getFormatProfile('youtube_thumbnail')
  check('youtube_thumbnail is landscape (top 20)', yt.reserveTopPct === 20)
  check('youtube_thumbnail footerStripActive = false', yt.footerStripActive === false)

  const fbc = getFormatProfile('facebook_cover')
  check('facebook_cover is ultrawide (top 12)', fbc.reserveTopPct === 12)
  check('facebook_cover footerStripActive = false', fbc.footerStripActive === false)
  check('facebook_cover has profile-photo safe-zone note', !!fbc.safeZoneNotes && /profile photo/i.test(fbc.safeZoneNotes))

  const cert = getFormatProfile('certificate')
  check('certificate footerStripActive = false', cert.footerStripActive === false)

  const unknown = getFormatProfile('totally_made_up_format')
  check('unknown format falls back to poster_portrait (top 40)', unknown.reserveTopPct === 40)
}

// =============================================================================
console.log('\n[Forge Format Profile] buildUserPrompt() FORMAT PROFILE block\n')

{
  // event_poster — must restate the legacy 40% / 576px / 18% band
  const epPrompt = buildUserPrompt(baseDirectorInput('event_poster', 1080, 1440))
  check('event_poster prompt has FORMAT PROFILE block', epPrompt.includes('FORMAT PROFILE'))
  check('event_poster band = top 40% (upper 576 pixels)', epPrompt.includes('TOP 40% (the upper 576 pixels)'))
  check('event_poster band = bottom 18%', epPrompt.includes('BOTTOM 18%'))

  // instagram_post (square 1080×1080) — top 30%, 324px
  const igPrompt = buildUserPrompt(baseDirectorInput('instagram_post', 1080, 1080))
  check('instagram describes a square canvas', /square 1:1/i.test(igPrompt))
  check('instagram band = top 30% (upper 324 pixels)', igPrompt.includes('TOP 30% (the upper 324 pixels)'))

  // youtube_thumbnail (1280×720) — top 20%, 144px
  const ytPrompt = buildUserPrompt(baseDirectorInput('youtube_thumbnail', 1280, 720))
  check('youtube describes a wide landscape canvas', /landscape/i.test(ytPrompt))
  check('youtube band = top 20% (upper 144 pixels)', ytPrompt.includes('TOP 20% (the upper 144 pixels)'))

  // full-canvas mode suppresses the reserve band
  const fcInput = { ...baseDirectorInput('instagram_post', 1080, 1080), fullCanvas: true }
  const fcPrompt = buildUserPrompt(fcInput)
  check('full-canvas mode omits the reserve-band line', !fcPrompt.includes('Reserve bands:'))
  check('full-canvas mode still describes the shape', /square 1:1/i.test(fcPrompt))
}

// =============================================================================
console.log('\n[Forge Format Profile] assembleForgePrompt() safety-net + footer gate\n')

{
  // Use a prose WITHOUT a Sharp hint so the safety net fires.
  const noHintOutput: DirectorOutput = { ...stubOutput }

  // event_poster — safety net must read 40% / 576px / 18% (unchanged)
  const ep = assembleForgePrompt(noHintOutput, {
    canvasWidth: 1080,
    canvasHeight: 1440,
    reserveTopPct: 40,
    reserveBottomPct: 18,
    footerStripActive: true,
  })
  check('event_poster safety-net = top 40% (upper 576 pixels)', ep.prompt.includes('top 40% of the 1080×1440 canvas (the upper 576 pixels)'))
  check('event_poster safety-net = bottom 18%', ep.prompt.includes('The bottom 18% must also be quiet'))
  check('event_poster includes footer-content ban', ep.prompt.includes('NO hashtag'))

  // instagram_post square — top 30% / 324px
  const ig = assembleForgePrompt(noHintOutput, {
    canvasWidth: 1080,
    canvasHeight: 1080,
    reserveTopPct: 30,
    reserveBottomPct: 14,
    footerStripActive: true,
  })
  check('instagram safety-net = top 30% (upper 324 pixels)', ig.prompt.includes('top 30% of the 1080×1080 canvas (the upper 324 pixels)'))
  check('instagram safety-net = bottom 14%', ig.prompt.includes('The bottom 14% must also be quiet'))

  // youtube_thumbnail — footer-content ban SUPPRESSED (footerStripActive=false)
  const yt = assembleForgePrompt(noHintOutput, {
    canvasWidth: 1280,
    canvasHeight: 720,
    reserveTopPct: 20,
    reserveBottomPct: 14,
    footerStripActive: false,
  })
  check('youtube safety-net = top 20% (upper 144 pixels)', yt.prompt.includes('top 20% of the 1280×720 canvas (the upper 144 pixels)'))
  check('youtube OMITS footer-content ban (no Yi footer strip)', !yt.prompt.includes('NO hashtag'))

  // defaults (no profile fields supplied) must reproduce poster 40/18
  const def = assembleForgePrompt(noHintOutput, { canvasWidth: 1080, canvasHeight: 1440 })
  check('assembler defaults to poster 40% (upper 576 pixels)', def.prompt.includes('top 40% of the 1080×1440 canvas (the upper 576 pixels)'))
  check('assembler defaults include footer ban', def.prompt.includes('NO hashtag'))
}

// --- summary -----------------------------------------------------------------
console.log(`\n[Forge Format Profile] ${passed} passed, ${failed} failed\n`)
process.exit(failed === 0 ? 0 : 1)
