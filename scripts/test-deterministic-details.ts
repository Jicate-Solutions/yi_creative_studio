/**
 * Validate the deterministic factual-details overlay (date/time · venue · organisation · events list)
 * that the legacy Forge hybrid composites in a reserved band over an AI scene.
 * Run: npx tsx scripts/test-deterministic-details.ts
 */
import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import { resolve } from 'path'
import sharp from 'sharp'
try {
  const t = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8')
  for (const line of t.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (m && !process.env[m[1]]) { let v = m[2].trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[m[1]] = v }
  }
} catch {}

import { renderEventTextOverlay } from '@/lib/sharp/event-text-overlay'

const BRAND = { primary: '#107023', secondary: '#fcff33', accent: '#faf9f4' } // user's JKKN brand

async function gen(prompt: string): Promise<Buffer> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
  if (!apiKey) throw new Error('no key')
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '3:4' } } }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`)
  const d: any = await res.json()
  const p = d?.candidates?.[0]?.content?.parts?.find((x: any) => x.inlineData)
  if (!p) throw new Error('no image')
  return Buffer.from(p.inlineData.data, 'base64')
}

async function main() {
  const outDir = resolve(process.cwd(), 'tests/output')
  mkdirSync(outDir, { recursive: true })

  const bgPrompt = `Render the following scene as a single coherent image — background artwork only.
<scene_description>
A vibrant pop-art screen-print Indian college sports-day scene: five diverse South-Indian student-athletes mid-action (sprinter, long-jumper, shot-put thrower, relay runners) across a sunlit sports ground, bold halftone texture, thick black contour outlines, saturated emerald green (#107023) and sunshine yellow (#fcff33), the big stylized headline word "SPORTS DAY" across the top third. The athletes occupy the upper two-thirds. Keep the LOWER THIRD a calm simple deep-green field with a gentle gradient — no figures, no busy detail, and NO text there — clear quiet space for typography.
</scene_description>
<scene_description>
Apart from the headline word at top, no other text, no dates, no lists, no logos, no watermark — the lower third is pure quiet background.
</scene_description>`

  console.log('[1/2] Generating clean sports background (calm lower band)...')
  let bg: Buffer
  try { bg = await sharp(await gen(bgPrompt)).resize(1080, 1440, { fit: 'cover' }).png().toBuffer() }
  catch (e) {
    console.warn('Gemini failed, using gradient:', e instanceof Error ? e.message : e)
    bg = await sharp(Buffer.from(`<svg width="1080" height="1440" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="1440" fill="${BRAND.primary}"/></svg>`)).png().toBuffer()
  }
  writeFileSync(resolve(outDir, 'sports-day-bg.png'), bg)

  console.log('[2/2] Compositing deterministic factual block (date/venue/org/events) in band 63–95%...')
  const out = await renderEventTextOverlay(bg, {
    dateTime: '15 July 2026  ·  9:30 AM – 4:00 PM',
    venue: 'College Sports Ground',
    organizationName: 'Department of Physical Education',
    additionalDetails: 'Events: 100m Race, 200m Race, Relay Race, Long Jump, Shot Put, Tug of War, Kabaddi, Volleyball',
    speakers: [],
  }, {
    canvasWidth: 1080, canvasHeight: 1440,
    renderZone: { startPercent: 63, endPercent: 95 },
    brandColors: BRAND,
  })

  const finalPath = resolve(outDir, 'sports-day-deterministic.png')
  writeFileSync(finalPath, out)
  console.log('\n✅ DONE\n   ' + finalPath)
}

main().catch((e) => { console.error('crashed:', e); process.exit(1) })
