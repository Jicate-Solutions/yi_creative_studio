/**
 * Standalone dump of the FULL event-poster prompt the pipeline sends to Gemini.
 * Reconstructs the real SMILEATHON build inputs (captured from a live run's logs)
 * and calls the actual YiPromptBuilder. Run: npx tsx scripts/dump-prompt.ts
 */
import { writeFileSync, readFileSync } from 'node:fs'
import { YiPromptBuilder } from '@/lib/prompts/services/yi-prompt-builder/yi-prompt-builder'
import { buildLeanPrompt, getLeanSystemInstruction } from '@/lib/prompts/services/lean-prompt-builder'
import { generateCreativeDirectorBrief } from '@/lib/prompts/services/creative-director'
import { getGeminiStyleLock } from '@/lib/config/background-styles'

// Load .env.local so the Creative Director (Anthropic) call works under tsx.
try {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
} catch { /* no .env.local — CD call will fall back to a mock */ }

const formData = {
  eventName: 'SMILEATHON 2026',
  eventTagline: 'A Run for Bright Smiles and a Brighter Future!',
  eventDate: '2026-03-29',
  eventTime: '06:00',
  eventEndTime: '10:00',
  venue: 'Nattraja Vidhyalya (CBSE) School Campus',
  eventDescription: 'A 3 km run event for children aged 4 to 12 years promoting dental health awareness',
  registrationInfo: 'Registration Fee: ₹250. Open to children aged 4 to 12 years.',
  organizationName: 'JKKN Dental College & Hospital',
  targetAudience: 'Children aged 4 to 12 years and their parents',
  additionalDetails: 'Special offer of ₹30k for dental implants exclusively for parents of participating children',
  theme: 'tricolor',
}

const options: any = {
  verticalId: 'membership',
  resolution: '1K',
  language: 'en',
  engine: 'yi_vision',
  backgroundStyle: 'scene', // Realistic — the default we now always send
  logoAwareness: {
    hasLogo: true,
    logoPosition: 'top-1',
    logoSize: 'medium',
    clearZone:
      'The top edge has 3 small branded overlay elements (left and right). The upper 10% should be clean atmospheric background. ALL text MUST be placed in the CENTER BAND (40% to 65% from top).',
    logos: [
      { position: 'top-1', size: 'medium' },
      { position: 'top-2', size: 'medium' },
      { position: 'top-6', size: 'medium' },
    ],
  },
  brandContext: {
    organizationName: 'JKKN Institutions',
    brandName: 'JKKN Institutions',
    primaryColor: '#107023',
    secondaryColor: '#fcff33',
    accentColor: '#faf9f4',
    useBrandColors: true,
    colorSource: 'brand',
    fontPreference: 'Inter',
    useBrandFont: true,
  },
  resolvedColors: { primaryColor: '#107023', secondaryColor: '#fcff33', accentColor: '#faf9f4', source: 'brand' },
  theme: 'corporate',
  style: 'gradient',
  layout: { headerHeight: 0, footerHeight: 0 },
  organizationContext: { name: 'JKKN Institutions', industry: 'membership' },
  designContext: {
    corePurpose: 'To ignite a sense of boundless joy and energetic community spirit while promoting active wellness.',
    visualElements: [
      'Dynamic low-angle shot of ecstatic Indian children and adults energetically crossing a finish line made of sparkling, iridescent fabric ribbons, faces beaming with joy',
      'Vibrant motion trails and streaks of bright yellow (#fcff33) and fresh green (#107023) light emphasizing high-speed movement behind active running Indian figures',
      'Sun-drenched, well-maintained Indian urban park landscape with a visible running track, out-of-focus cheering Indian crowd silhouettes in the distance',
      'Close-up framing of individual confident Indian smiles, highlighting pure happiness and infectious enthusiasm, with natural light catching a healthy glow',
      'Confetti cannons releasing an explosive burst of #fcff33 yellow and #faf9f4 off-white metallic streamers and sparkling glitter over the central runners',
    ],
    backgroundSetting:
      'An open, sprawling Indian city park bathed in bright, soft diffused natural sunlight on a clear day, with lush green open fields leading into a slightly blurred modern track.',
    iconicImagery: [
      'Radiant, natural Indian smiles that light up faces, conveying pure joy and healthy living in a dynamic moment',
      "Gold-hued abstract 'burst' or 'glow' effects symbolizing energy and celebration",
    ],
    emotionalJob: 'Viewers should feel invigorated, joyous, inspired, and a sense of belonging.',
  },
  footerContext: {
    website: 'http://www.jkkn.ac.in',
    phone: '8610730916',
    email: 'sroja@jkkn.ac.in',
    address: 'Kumarapalayam',
    social: { instagram: '@yisalem', linkedin: '', facebook: 'yisalem', twitter: 'yi_salem' },
  },
  ultraProContext: {
    primaryText: 'SMILEATHON 2026',
    secondaryText: [
      'Sun, 29 Mar 2026 | 6:00 AM – 10:00 AM',
      'Nattraja Vidhyalya (CBSE) School Campus',
      'Children aged 4–12 years | ₹250 registration',
      'JKKN Dental College & Hospital',
    ],
    visualScene:
      'Low-angle dynamic shot capturing Indian children and parents mid-stride crossing a shimmering finish line at dawn, faces radiant with joy. Bright morning sunlight, motion-blur streaks of brand yellow and green, confetti overhead, out-of-focus cheering silhouettes.',
    designGuidance:
      'Bold, energetic, uplifting—designed for children and families. Warm natural light and vibrant brand colors creating infectious joy without feeling corporate.',
    textPlacementHints:
      'Event headline anchors the upper-center; supporting details flow within the lower half, integrated with the scene.',
    colorPaletteHints:
      'Primary forest green (#107023) dominant, electric yellow (#fcff33) as motion streaks and confetti, off-white (#faf9f4) as metallic accents.',
    mustIncludeElements: [
      'Racing bibs with visible numbers on Indian child and adult runners',
      'Shimmering iridescent finish-line ribbon in yellow and white',
      'Confetti cannons exploding with #fcff33 yellow and metallic streamers',
      'Natural morning sunlight catching healthy glows on smiling Indian faces',
      'Blurred school track and green playing fields in the background',
    ],
    enhancedPrompt:
      'A high-energy dawn photograph capturing the electric moment Indian children aged 4–12 and their parents cross a sparkling finish line at a school sports track, beaming with joy, motion trails of yellow and green light, confetti bursts, iridescent finish-line ribbons, set in a sun-drenched Indian school park.',
  },
  sceneNarrative: 'A professional event poster design in Event Poster format set in an Indian school environment',
  compositionStrategy: 'concept-iconic',
  speakerRenderMode: 'gemini',
  speakerPhotoZoneCoordinates: undefined,
  logoStripZoneCoordinates: undefined,
}

const prompt = YiPromptBuilder.buildPrompt('event_poster', formData, options)
const system = YiPromptBuilder.getSystemInstruction()

const out = `========== SYSTEM INSTRUCTION (${system.length} chars) ==========\n${system}\n\n========== USER PROMPT (${prompt.length} chars) ==========\n${prompt}\n`
writeFileSync('scripts/full-prompt-smileathon.txt', out, 'utf8')
console.log(`Wrote scripts/full-prompt-smileathon.txt — system ${system.length} chars, prompt ${prompt.length} chars`)

// v54.4: lean version of the same event for comparison
const leanFormat = { width: 1080, height: 1440, aspectRatio: '3:4', label: 'Event Poster' }
const leanPrompt = buildLeanPrompt(leanFormat, formData as any, options)
const leanSystem = getLeanSystemInstruction()
const leanOut = `========== LEAN SYSTEM INSTRUCTION (${leanSystem.length} chars) ==========\n${leanSystem}\n\n========== LEAN USER PROMPT (${leanPrompt.length} chars) ==========\n${leanPrompt}\n`
writeFileSync('scripts/lean-prompt-smileathon.txt', leanOut, 'utf8')
console.log(`Wrote scripts/lean-prompt-smileathon.txt — system ${leanSystem.length} chars, prompt ${leanPrompt.length} chars`)

// v54.5: CONCEPT-FIRST — run the REAL Creative Director, then build the concept-first lean prompt.
;(async () => {
  let conceptBrief: any
  try {
    const cd = await generateCreativeDirectorBrief({
      eventName: 'SMILEATHON 2026',
      eventDescription: 'A 3 km run event for children aged 4 to 12 years promoting dental health awareness',
      venue: 'Nattraja Vidhyalya (CBSE) School Campus',
      targetAudience: 'Children aged 4 to 12 years and their parents',
      tagline: 'A Run for Bright Smiles and a Brighter Future!',
      styleLabel: 'scene',
      styleDirective: getGeminiStyleLock('scene') || undefined,
    })
    conceptBrief = { visualConcept: cd.visualConcept, compositionNote: cd.compositionNote, colorStory: cd.colorStory, typographyMood: cd.typographyMood, headlineTreatment: cd.headlineTreatment }
    console.log(`\n[Creative Director] 🎨 BIG IDEA: ${cd.visualConcept}\n`)
    console.log(`[Creative Director] 🔤 HEADLINE TREATMENT: ${cd.headlineTreatment}\n`)
  } catch (e) {
    console.warn('[Creative Director] call failed, using mock concept:', e instanceof Error ? e.message : e)
    conceptBrief = { visualConcept: 'A giant gleaming molar shaped like a championship finish-line medal on a ribbon, with tiny joyful child runners crossing a track that curves into a smile beneath it.', compositionNote: 'Radial focus on the tooth-medal; runners small along the smile-curve; generous sky of negative space above.' }
  }
  const cfPrompt = buildLeanPrompt(leanFormat, formData as any, {
    ...options,
    conceptBrief,
    styleReferenceUsed: true,
    styleReferenceNote: 'modern paper-cut graphic, one bold focal device, generous whitespace',
  })
  const cfOut = `========== CONCEPT-FIRST LEAN PROMPT (${cfPrompt.length} chars) ==========\n[Creative Director big idea is the hero. Style reference attached as first image.]\n\n${cfPrompt}\n`
  writeFileSync('scripts/concept-first-prompt-smileathon.txt', cfOut, 'utf8')
  console.log(`Wrote scripts/concept-first-prompt-smileathon.txt — prompt ${cfPrompt.length} chars`)
})()
