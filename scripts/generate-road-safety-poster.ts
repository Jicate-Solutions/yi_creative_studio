/**
 * Standalone Forge poster generator + detail verify-and-regenerate harness.
 *
 * Drives the creative-engine end to end, OUTSIDE the auth-gated route, and mirrors
 * the route's DETAIL VERIFY-AND-REGENERATE loop so you can reproduce + confirm the
 * "event details sometimes missing" fix on real pixels.
 *
 * Run:
 *   npx tsx scripts/generate-road-safety-poster.ts                 # road-safety (default)
 *   npx tsx scripts/generate-road-safety-poster.ts fresher-day     # the reported failing brief
 *
 * Outputs (per brief): tests/output/<brief>-background.png + tests/output/<brief>-final.png
 */

import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import sharp from 'sharp'

// ── load .env.local (tsx doesn't auto-load it) ────────────────────────────────
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
import { planCreative, renderTextLayers, verifyVisibleText } from '@/lib/creative-engine'
import type { CanonicalAdapterExtras } from '@/lib/creative-engine'
import { textToPath, getTextWidth } from '@/lib/sharp/text-to-path'
import { formatEventDate } from '@/lib/utils/time-formatter'

const BRAND = { primary: '#005B96', secondary: '#FF6B35', accent: '#FFFFFF' }

interface Brief {
  id: string
  compiled: CompiledFormData
  extras: CanonicalAdapterExtras
}

function baseCompiled(over: Partial<CompiledFormData>): CompiledFormData {
  return {
    eventName: '', eventType: null, date: null, time: null, endTime: null, venue: null,
    speakerName: null, speakerDesignation: null, organizationName: null, speakers: null,
    description: null, tagline: null, eventNote: null, initiativeText: null, initiativeColor: null,
    customFields: {}, format: { id: 'event_poster', name: 'Event Poster', dimensions: { width: 1080, height: 1440 } },
    theme: null, style: null, language: 'en', sophistication: null, creativeFidelity: null,
    alignment: null, fontStyle: null, visualDirection: null, targetAudience: null,
    subjectAnalysis: undefined, rawFormData: {},
    ...over,
  }
}

function baseExtras(over: Partial<CanonicalAdapterExtras>): CanonicalAdapterExtras {
  return {
    formatId: 'event_poster',
    brand: { ...BRAND, region: 'tamil-nadu' },
    fullCanvas: false,
    logoBarsEnabled: true,
    speakerPhotoFlags: [],
    rawFormData: {},
    ...over,
  }
}

const BRIEFS: Record<string, () => Brief> = {
  'road-safety': () => {
    const raw = {
      backgroundStyle: 'advertising', eventName: 'Road Safety Awareness Drive',
      eventTagline: 'Drive Safe. Save Lives.', eventDate: '2026-06-15', eventTime: '09:00',
      venue: 'Kumarapalayam Junction', organizationName: 'JKKN Nursing Students Initiative',
      visualStrategy: 'activity-driven',
    }
    return {
      id: 'road-safety',
      compiled: baseCompiled({
        eventName: 'Road Safety Awareness Drive', eventType: 'awareness campaign',
        date: '2026-06-15', time: '09:00 AM', venue: 'Kumarapalayam Junction',
        organizationName: 'JKKN Nursing Students Initiative',
        description: 'JKKN nursing students conduct a community road-safety awareness drive — guiding commuters, helping riders with helmet safety, supporting safer pedestrian movement.',
        tagline: 'Drive Safe. Save Lives.', style: 'advertising',
        targetAudience: 'commuters, students, and the local community', rawFormData: raw,
      }),
      extras: baseExtras({ backgroundStyle: 'advertising', rawFormData: raw }),
    }
  },
  // The reported failing brief — details (date/venue/org) were dropped by Gemini.
  'fresher-day': () => {
    const raw = {
      backgroundStyle: 'advertising', eventName: 'Fresher Day', eventDate: '2026-06-08',
      eventTime: '09:00', venue: 'Vibrant Arangam',
      organizationName: 'College of Engineering and Technology', targetAudience: 'Fresh talent, new students',
    }
    return {
      id: 'fresher-day',
      compiled: baseCompiled({
        eventName: 'Fresher Day', eventType: 'fresher welcome',
        date: '2026-06-08', time: '09:00 AM', venue: 'Vibrant Arangam',
        organizationName: 'College of Engineering and Technology',
        description: 'Welcome freshers to JKKN Institutions! Explore opportunities and launch your journey as a young innovator and changemaker.',
        style: 'advertising', targetAudience: 'Fresh talent, new students', rawFormData: raw,
      }),
      extras: baseExtras({ backgroundStyle: 'advertising', rawFormData: raw }),
    }
  },
}

async function generateBackground(prompt: string, aspectRatio: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY missing')
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent'
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio } },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' },
    ],
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 400)}`)
  const data: any = await res.json()
  const parts = data?.candidates?.[0]?.content?.parts
  const imagePart = parts?.find((p: { inlineData?: { data: string } }) => p.inlineData)
  if (!imagePart?.inlineData?.data) throw new Error('No image in Gemini response: ' + JSON.stringify(data).slice(0, 300))
  return Buffer.from(imagePart.inlineData.data, 'base64')
}

function gradientBackground(w: number, h: number): Promise<Buffer> {
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0%" stop-color="${BRAND.primary}"/><stop offset="70%" stop-color="${BRAND.primary}"/><stop offset="100%" stop-color="${BRAND.secondary}"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

async function compositeInitiativeLine(img: Buffer, org: string, w: number, h: number): Promise<Buffer> {
  const text = org.trim().toUpperCase()
  if (!text) return img
  let font = 30
  const maxW = w - 160
  while (getTextWidth(text, 'poppins', font, 'bold') > maxW && font > 16) font -= 1
  const tw = getTextWidth(text, 'poppins', font, 'bold')
  const rectH = Math.round(font * 2.0)
  const rectW = Math.round(tw + 72)
  const rectX = Math.round((w - rectW) / 2)
  const rectY = h - rectH - 44
  const baseline = rectY + Math.round(rectH / 2 + font * 0.34)
  const path = textToPath(text, { fontFamily: 'poppins', fontSize: font, fontWeight: 'bold', x: w / 2, y: baseline, fill: '#FFFFFF', textAnchor: 'middle' })
  const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect x="${rectX}" y="${rectY}" width="${rectW}" height="${rectH}" rx="${Math.round(rectH / 2)}" fill="${BRAND.primary}" fill-opacity="0.86"/>${path}</svg>`
  return sharp(img).composite([{ input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer()
}

async function main() {
  const which = (process.argv[2] || 'road-safety').trim()
  const make = BRIEFS[which]
  if (!make) {
    console.error(`Unknown brief "${which}". Options: ${Object.keys(BRIEFS).join(', ')}`)
    process.exit(1)
  }
  const brief = make()

  const outDir = resolve(process.cwd(), 'tests/output')
  mkdirSync(outDir, { recursive: true })
  const bgPath = resolve(outDir, `${brief.id}-background.png`)
  const finalPath = resolve(outDir, `${brief.id}-final.png`)

  console.log(`\n[1/4] Planning "${brief.id}" (creative-engine)...`)
  const plan = await planCreative(
    { compiled: brief.compiled, extras: brief.extras },
    { formatId: 'event_poster', visualStrategy: 'activity-driven' }
  )
  const W = plan.layout.canvas.width
  const H = plan.layout.canvas.height
  const aspect = plan.canonical.format.aspectRatio
  console.log(`      mode=${plan.renderingMode} | strategy=${plan.strategy.strategy} | actor="${plan.direction.narrativeAnchor.primaryActor}" | director=${plan.direction.source} | ${W}x${H} (${aspect})`)

  console.log('[2/4] Generating background (Gemini)...')
  let raw: Buffer
  try {
    raw = await generateBackground(plan.scene.backgroundPrompt, aspect)
  } catch (e) {
    console.warn(`      ⚠️ Gemini failed (${e instanceof Error ? e.message : e}) — using brand gradient.`)
    raw = await gradientBackground(W, H)
  }
  let bg = await sharp(raw).resize(W, H, { fit: 'cover' }).png().toBuffer()
  writeFileSync(bgPath, bg)

  // Factual lines the poster MUST show (the ones that went missing).
  const factualRequired = [
    formatEventDate(brief.compiled.date),
    brief.compiled.venue,
    brief.compiled.organizationName,
  ].filter((s): s is string => !!s && s.trim().length > 0)

  if (plan.renderingMode === 'ai_native') {
    // Mirror the route's DETAIL VERIFY-AND-REGENERATE loop.
    const maxRetries = Number(process.env.TEXT_VERIFY_MAX_RETRIES ?? 1)
    console.log(`[3/4] ai_native — verify-and-regenerate (required: ${factualRequired.join(' | ')})`)
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const v = await verifyVisibleText(bg.toString('base64'), factualRequired)
      if (v.allPresent) {
        console.log(`      ✅ all details present${attempt > 0 ? ` (after ${attempt} regen)` : ''}`)
        break
      }
      if (attempt === maxRetries) {
        console.warn(`      ⚠️ still missing after ${attempt} regen: ${v.missing.join(' | ')}`)
        break
      }
      console.warn(`      ❌ missing: ${v.missing.join(' | ')} — regenerating (${attempt + 1}/${maxRetries})`)
      const emphasis = `\n\n<scene_description>\nThese exact text lines are REQUIRED and must appear clearly, legibly, and correctly spelled in the finished poster: ${v.missing.map((m) => `"${m}"`).join(', ')}. Render every one of them prominently — do not omit any.\n</scene_description>`
      try {
        const regenRaw = await generateBackground(plan.scene.backgroundPrompt + emphasis, aspect)
        bg = await sharp(regenRaw).resize(W, H, { fit: 'cover' }).png().toBuffer()
      } catch (e) {
        console.warn(`      regen failed: ${e instanceof Error ? e.message : e}`)
        break
      }
    }
    console.log('[4/4] Saving AI-native poster...')
    writeFileSync(finalPath, bg)
  } else {
    console.log(`[3/4] ${plan.renderingMode} — deterministic text (SVG/Sharp)...`)
    const rendered = await renderTextLayers(bg, plan.layout, plan.context.renderableText, { brand: BRAND })
    console.log('[4/4] Compositing initiative line (text-to-path)...')
    const finalBuf = await compositeInitiativeLine(rendered.imageBuffer, plan.canonical.organizationName ?? '', W, H)
    writeFileSync(finalPath, finalBuf)
  }

  console.log('\n✅ DONE')
  console.log(`   background : ${bgPath}`)
  console.log(`   final      : ${finalPath}`)
}

main().catch((e) => {
  console.error('Generator crashed:', e)
  process.exit(1)
})
