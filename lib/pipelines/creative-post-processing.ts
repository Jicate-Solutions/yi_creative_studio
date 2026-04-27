/**
 * Minimum post-processing pipeline for provider-agnostic image outputs.
 *
 * Runs: resize → logo overlay → Supabase upload (with retry) → thumbnail.
 *
 * Used by `app/api/generate-openai/route.ts`. The giant post-processing
 * block in `app/api/generate/route.ts` (Gemini route) contains additional
 * steps (spatial verification retry, enhanced 4-row strip, speaker overlay,
 * zone debug overlay, colour verification) that are NOT yet supported in
 * the OpenAI pipeline — callers that pass those configs should expect
 * them to be silently skipped with a warning log.
 *
 * The helpers below (`overlayLogosInline`, `uploadImageToStorageWithRetry`,
 * `generateThumbnail`) are copied from `app/api/generate/route.ts` —
 * documented duplication until a future consolidation PR unifies them.
 */

import { randomUUID } from 'crypto'
import sharp from 'sharp'
import {
  processImageWithLogos,
  resizeImageToExactDimensions,
  type LogoPosition,
} from '@/lib/sharp/logo-overlay'
import type {
  LogoSizePreset,
  LogoBackgroundShape,
  LogoBackgroundStyle,
} from '@/lib/constants/logoConstants'
import type { createClient } from '@/lib/supabase/server'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

export interface LogoPlacementInput {
  logoId: string
  position: string
  size?: LogoSizePreset | number
  backgroundShape?: LogoBackgroundShape
  backgroundStyle?: LogoBackgroundStyle
  logo?: { file_url: string; name?: string }
}

export interface PostProcessingInput {
  imageBase64: string
  formatDimensions: { width: number; height: number } | null
  logoPlacements?: LogoPlacementInput[]
  logoBackgroundColor?: string
  logoStripMode?: {
    enabled: boolean
    rows: Array<'header' | 'middle' | 'footer'>
    opacity?: number
    logoBound?: boolean
  }
  /**
   * When true AND `logoStripMode` is not provided by the caller, compose a
   * solid header band under the logos so they remain readable over any
   * scene content (gpt-image-1 output frequently fills the top with bright
   * imagery that swallows transparent logo bars).
   */
  forceSolidLogoStrip?: boolean
  stripShape?: string
  organizationId: string
  supabase: SupabaseClient
}

export interface PostProcessingResult {
  finalImageUrl: string
  thumbnailUrl: string | null
}

/**
 * Log dimensions and file size for a data URL. Cheap: Sharp.metadata() is
 * O(1) on a PNG (reads header only).
 */
async function logImageStats(label: string, imageUrl: string): Promise<void> {
  if (!imageUrl.startsWith('data:')) {
    console.log(`[OpenAI Pipeline] ${label}: (stored URL)`)
    return
  }
  try {
    const base64 = imageUrl.split(',')[1] || ''
    const bytes = Math.floor((base64.length * 3) / 4)
    const kb = (bytes / 1024).toFixed(1)
    const meta = await sharp(Buffer.from(base64, 'base64')).metadata()
    console.log(
      `[OpenAI Pipeline] ${label}: ${meta.width}x${meta.height} ${meta.format ?? 'png'} (${kb} KB)`
    )
  } catch {
    console.log(`[OpenAI Pipeline] ${label}: (stats unavailable)`)
  }
}

export async function applyMinimumPostProcessing(
  input: PostProcessingInput
): Promise<PostProcessingResult> {
  let imageUrl = input.imageBase64

  await logImageStats('OpenAI output', imageUrl)

  if (input.formatDimensions) {
    // gpt-image-1 only outputs 1:1, 2:3, or 3:2. Our formats use ratios like 3:4 that
    // never match, so `fill` would distort and the v20.5 safety switches to `contain`
    // (white padding bars — not what we want for a poster). `cover` crops to the target
    // aspect ratio instead, giving a clean full-bleed result.
    const { width: tw, height: th } = input.formatDimensions
    console.log(
      `[OpenAI Pipeline] Resizing to ${tw}x${th} (mode: cover — crop to fill)`
    )

    // Compute aspect-ratio drift for visibility. The `cover` mode bypasses the
    // resize function's v20.5 `fill→contain` guard, so the warning won't fire there.
    try {
      const base64 = imageUrl.split(',')[1] || ''
      const meta = await sharp(Buffer.from(base64, 'base64')).metadata()
      const sw = meta.width ?? tw
      const sh = meta.height ?? th
      const sAR = sw / sh
      const tAR = tw / th
      const drift = Math.abs(sAR - tAR) / tAR
      if (drift > 0.10) {
        // cover scales the shorter dimension to match and crops the longer one.
        const scale = Math.max(tw / sw, th / sh)
        const scaledW = sw * scale
        const scaledH = sh * scale
        const cropW = Math.max(0, scaledW - tw)
        const cropH = Math.max(0, scaledH - th)
        const cropSide = cropW > cropH ? 'left/right' : 'top/bottom'
        const cropPct = cropW > cropH ? (cropW / scaledW) * 100 : (cropH / scaledH) * 100
        console.warn(
          `[OpenAI Pipeline] ⚠ Aspect drift ${(drift * 100).toFixed(1)}% — cover will crop ~${cropPct.toFixed(1)}% from ${cropSide}`
        )
      }
    } catch {
      // Non-fatal — drift logging is best-effort.
    }

    imageUrl = await resizeImageToExactDimensions(imageUrl, tw, th, 'cover')
    await logImageStats('After resize', imageUrl)
  }

  if (input.logoPlacements && input.logoPlacements.length > 0) {
    // Decide strip mode: honour caller's explicit mode; otherwise, when
    // forceSolidLogoStrip is on, synthesise a header-only opaque strip so
    // gpt-image-1's scene content doesn't bleed through behind the logos.
    const callerStrip = input.logoStripMode
    const effectiveStripMode =
      callerStrip
        ? { enabled: callerStrip.enabled, rows: callerStrip.rows }
        : input.forceSolidLogoStrip
        ? { enabled: true, rows: ['header'] as Array<'header' | 'middle' | 'footer'> }
        : undefined

    const stripNote = !callerStrip && input.forceSolidLogoStrip
      ? ' (forceSolidLogoStrip — synthetic header strip for OpenAI readability)'
      : ''
    console.log(
      `[OpenAI Pipeline] Overlaying ${input.logoPlacements.length} logo(s)${stripNote}`
    )

    imageUrl = await overlayLogosInline(
      imageUrl,
      input.logoPlacements,
      input.supabase,
      input.logoBackgroundColor,
      effectiveStripMode,
      input.stripShape
    )
    await logImageStats('After logo overlay', imageUrl)
  }

  if (imageUrl.startsWith('data:')) {
    imageUrl = await uploadImageToStorageWithRetry(imageUrl, input.organizationId, input.supabase)
    console.log(`[OpenAI Pipeline] Uploaded → ${imageUrl.substring(0, 80)}${imageUrl.length > 80 ? '…' : ''}`)
  }

  let thumbnailUrl: string | null = null
  if (imageUrl && !imageUrl.startsWith('data:')) {
    const thumbT0 = Date.now()
    try {
      thumbnailUrl = await generateThumbnail(imageUrl, input.organizationId, input.supabase)
      console.log(
        `[OpenAI Pipeline] Thumbnail generated in ${((Date.now() - thumbT0) / 1000).toFixed(1)}s`
      )
    } catch (err) {
      console.warn('[OpenAI Pipeline] Thumbnail generation failed (non-fatal)', err)
    }
  }

  return { finalImageUrl: imageUrl, thumbnailUrl }
}

// ─── overlayLogos (copy of app/api/generate/route.ts:4857-4935) ─────────────

async function overlayLogosInline(
  imageUrl: string,
  logosPlacements: LogoPlacementInput[],
  supabase: SupabaseClient,
  backgroundColor?: string,
  stripMode?: { enabled: boolean; rows: Array<'header' | 'middle' | 'footer'> },
  stripShape?: string
): Promise<string> {
  try {
    const logoIds = logosPlacements.map((p) => p.logoId)

    const { data: logos, error } = await supabase
      .from('organization_logos')
      .select('id, file_url')
      .in('id', logoIds)

    if (error) {
      console.error('[OpenAI Pipeline][overlayLogos] DB error:', error)
    }

    const logoMap = new Map((logos || []).map((l) => [l.id, l]))

    const placementsWithLogos = logosPlacements
      .map((p) => {
        const dbLogo = logoMap.get(p.logoId)
        const passedLogo = p.logo
        const logo = dbLogo || passedLogo
        return {
          logoId: p.logoId,
          position: p.position as LogoPosition,
          size: p.size,
          backgroundShape: p.backgroundShape,
          backgroundStyle: p.backgroundStyle,
          logo,
        }
      })
      .filter((p) => p.logo?.file_url)

    if (placementsWithLogos.length === 0) {
      console.log('[OpenAI Pipeline][overlayLogos] No valid logo placements — returning original image')
      return imageUrl
    }

    return await processImageWithLogos(
      imageUrl,
      placementsWithLogos,
      backgroundColor,
      stripMode,
      stripShape
    )
  } catch (err) {
    console.error('[OpenAI Pipeline][overlayLogos] Error (falling back to original):', err)
    return imageUrl
  }
}

// ─── Supabase upload (copy of route.ts:214-267 wrapped in retry loop 3296-3323) ──

async function uploadImageToStorage(
  base64Data: string,
  mimeType: string,
  organizationId: string,
  supabase: SupabaseClient
): Promise<string> {
  const buffer = Buffer.from(base64Data, 'base64')
  const extension = mimeType.split('/')[1] || 'png'
  const filename = `${organizationId}/${randomUUID()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from('creatives')
    .upload(filename, buffer, {
      contentType: mimeType,
      cacheControl: '31536000',
      upsert: false,
    })

  if (uploadError) {
    console.error('[OpenAI Pipeline][uploadImageToStorage] Error:', uploadError.message)
    if (uploadError.message?.includes('<!DOCTYPE') || uploadError.message?.includes('<html')) {
      throw new Error(
        'Storage bucket not configured. Please create "creatives" bucket in Supabase dashboard with public access enabled.'
      )
    }
    throw new Error(`Failed to upload image to storage: ${uploadError.message}`)
  }

  const { data: urlData } = supabase.storage.from('creatives').getPublicUrl(filename)
  return urlData.publicUrl
}

async function uploadImageToStorageWithRetry(
  dataUrl: string,
  organizationId: string,
  supabase: SupabaseClient
): Promise<string> {
  const [header, base64Data] = dataUrl.split(',')
  const mimeMatch = header.match(/data:([^;]+);/)
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'

  const MAX_UPLOAD_ATTEMPTS = 3
  let attempt = 0
  let lastError: unknown

  while (attempt < MAX_UPLOAD_ATTEMPTS) {
    attempt++
    try {
      const url = await uploadImageToStorage(base64Data, mimeType, organizationId, supabase)
      console.log(`[OpenAI Pipeline] Image uploaded (attempt ${attempt}/${MAX_UPLOAD_ATTEMPTS})`)
      return url
    } catch (err) {
      lastError = err
      console.error(`[OpenAI Pipeline] Upload attempt ${attempt}/${MAX_UPLOAD_ATTEMPTS} failed:`, err)
      if (attempt < MAX_UPLOAD_ATTEMPTS) {
        const delayMs = 1000 * Math.pow(2, attempt - 1)
        await new Promise((resolve) => setTimeout(resolve, delayMs))
      }
    }
  }

  console.warn('[OpenAI Pipeline] All upload attempts failed — falling back to base64', lastError)
  return dataUrl
}

// ─── Thumbnail (copy of route.ts:3349-3377) ─────────────────────────────────

async function generateThumbnail(
  imageUrl: string,
  organizationId: string,
  supabase: SupabaseClient
): Promise<string> {
  const imageResponse = await fetch(imageUrl)
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image for thumbnail: ${imageResponse.status}`)
  }
  const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

  const thumbnailBuffer = await sharp(imageBuffer)
    .resize(400, null, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer()

  const thumbnailFilename = `${organizationId}/thumb_${randomUUID()}.jpg`
  const { error: thumbUploadError } = await supabase.storage
    .from('creatives')
    .upload(thumbnailFilename, thumbnailBuffer, {
      contentType: 'image/jpeg',
      cacheControl: '31536000',
      upsert: false,
    })

  if (thumbUploadError) {
    throw new Error(`Thumbnail upload failed: ${thumbUploadError.message}`)
  }

  const { data: thumbUrlData } = supabase.storage
    .from('creatives')
    .getPublicUrl(thumbnailFilename)

  return thumbUrlData.publicUrl
}
