/**
 * One-off import: save a poster that was generated DIRECTLY in Gemini (outside the app
 * pipeline) into the gallery, so it isn't lost.
 *
 * It mirrors the app's normal save flow:
 *   1. Upload the full image to the `creatives` Storage bucket  (see app/api/generate/route.ts:221-274)
 *   2. Generate + upload a 400px thumbnail                       (see app/api/generate/route.ts:3686-3709)
 *   3. Insert a `creatives` row                                  (see components/canvas-create/CanvasCreatePage.tsx:476-501)
 *
 * Run once:  npx tsx scripts/import-smileathon-poster.ts
 */

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { randomUUID } from 'crypto'
import fs from 'fs'
import path from 'path'
import type { Database } from '@/types/database.types'

// ---- Config: the resolved values from the plan (verified against Supabase) ----
const SOURCE_FILE = 'C:/Users/Admin/Downloads/02248f78-5aa2-4ed4-b281-0b556138c72e.jpg'
const ORGANIZATION_ID = 'bd21dd9d-2f08-478f-a457-74f014d5d6d1' // JKKN Institutions
const CREATED_BY = '5c112429-b256-4a83-8913-92605d4da30d'      // automation@jkkn.ac.in
const AI_MODEL = 'Nano Banana 2'
const AI_MODEL_ID = '85e06aa6-f65a-4f82-acfd-c5db66fd2996'      // ai_models row for gemini-3.1-flash-image-preview
const CREATIVE_TYPE = 'event_poster'
const TITLE = 'Smileathon 2026'
const CREDITS_USED = 0 // external image — no AI generation happened
const MIME_TYPE = 'image/jpeg'

// ---- Load .env.local (tsx does not auto-load it) — same parser as scripts/seed-verticals.ts ----
function parseEnv(content: string): Record<string, string> {
  const result: Record<string, string> = {}
  content.split('\n').forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      let value = match[2].trim()
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
      result[key] = value
    }
  })
  return result
}

const envPath = path.resolve(process.cwd(), '.env.local')
const env = fs.existsSync(envPath) ? parseEnv(fs.readFileSync(envPath, 'utf-8')) : {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  }
  if (!fs.existsSync(SOURCE_FILE)) {
    throw new Error(`Source image not found: ${SOURCE_FILE}`)
  }

  // Service-role client bypasses Storage/RLS for this admin-side import (see lib/supabase/admin.ts)
  const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const imageBuffer = fs.readFileSync(SOURCE_FILE)
  console.log(`Read source image (${(imageBuffer.length / 1024).toFixed(0)} KB)`)

  // 1) Upload full image
  const imageFilename = `${ORGANIZATION_ID}/${randomUUID()}.jpg`
  const { error: imgErr } = await supabase.storage
    .from('creatives')
    .upload(imageFilename, imageBuffer, {
      contentType: MIME_TYPE,
      cacheControl: '31536000',
      upsert: false,
    })
  if (imgErr) throw new Error(`Full-image upload failed: ${imgErr.message}`)
  const imageUrl = supabase.storage.from('creatives').getPublicUrl(imageFilename).data.publicUrl
  console.log('Uploaded full image  ->', imageUrl)

  // 2) Generate + upload 400px thumbnail
  const thumbnailBuffer = await sharp(imageBuffer)
    .resize(400, null, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer()
  const thumbFilename = `${ORGANIZATION_ID}/thumb_${randomUUID()}.jpg`
  const { error: thumbErr } = await supabase.storage
    .from('creatives')
    .upload(thumbFilename, thumbnailBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    })
  if (thumbErr) throw new Error(`Thumbnail upload failed: ${thumbErr.message}`)
  const thumbnailUrl = supabase.storage.from('creatives').getPublicUrl(thumbFilename).data.publicUrl
  console.log('Uploaded thumbnail   ->', thumbnailUrl)

  // Match the vertical the org's other event posters use (gallery filter consistency)
  const { data: sibling } = await supabase
    .from('creatives')
    .select('vertical')
    .eq('organization_id', ORGANIZATION_ID)
    .eq('creative_type', CREATIVE_TYPE)
    .not('vertical', 'is', null)
    .limit(1)
    .maybeSingle()
  const vertical = sibling?.vertical ?? null
  console.log('Vertical             ->', vertical ?? '(none)')

  // 3) Insert the creatives row (mirrors CanvasCreatePage.tsx creativeInsert)
  const { data: inserted, error: insertErr } = await supabase
    .from('creatives')
    .insert({
      organization_id: ORGANIZATION_ID,
      created_by: CREATED_BY,
      ai_model: AI_MODEL,
      ai_model_id: AI_MODEL_ID,
      creative_type: CREATIVE_TYPE,
      vertical,
      credits_used: CREDITS_USED,
      image_url: imageUrl,
      thumbnail_url: thumbnailUrl,
      title: TITLE,
      prompt_used: '',
      logo_config: null,
      form_data: {
        source: 'manual-import',
        note: 'Generated directly in Gemini; imported one-off via scripts/import-smileathon-poster.ts',
      } as unknown as Database['public']['Tables']['creatives']['Insert']['form_data'],
    })
    .select('id')
    .single()
  if (insertErr) throw new Error(`Creatives insert failed: ${insertErr.message}`)

  console.log('\n✅ Imported successfully')
  console.log('   creative id ->', inserted!.id)
  console.log('   image_url   ->', imageUrl)
}

main().catch((err) => {
  console.error('\n❌ Import failed:', err instanceof Error ? err.message : err)
  process.exit(1)
})
