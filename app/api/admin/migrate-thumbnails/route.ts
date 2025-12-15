import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

/**
 * Admin API to generate thumbnails for existing creatives that are missing them.
 * This fixes the gallery display issue where recent creatives show placeholder icons.
 *
 * The issue occurred because client-side thumbnail generation failed silently due to CORS
 * when trying to load Supabase Storage URLs into browser Canvas API.
 *
 * POST /api/admin/migrate-thumbnails
 * Query params:
 *   - limit: Number of records to process (default: 10, max: 20 due to image processing overhead)
 *   - dryRun: If 'true', only report what would be migrated without making changes
 *
 * Response:
 *   - migrated: Number of records successfully updated with thumbnails
 *   - skipped: Number of records skipped (no image_url, or base64 image)
 *   - failed: Number of records that failed to process
 *   - details: Array of results per record
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin in any organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20)
    const dryRun = searchParams.get('dryRun') === 'true'

    // Find creatives with missing thumbnail_url but valid image_url (not base64)
    const { data: creatives, error: fetchError } = await supabase
      .from('creatives')
      .select('id, organization_id, image_url, thumbnail_url')
      .is('thumbnail_url', null)
      .like('image_url', 'https://%')
      .limit(limit)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!creatives || creatives.length === 0) {
      return NextResponse.json({
        message: 'No creatives found needing thumbnail generation',
        migrated: 0,
        skipped: 0,
        failed: 0,
      })
    }

    const results = {
      migrated: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{ id: string; status: string; thumbnailUrl?: string; error?: string }>,
    }

    // Dynamic import Sharp only when needed
    let sharp: typeof import('sharp') | null = null

    // Process each creative
    for (const creative of creatives) {
      const imageUrl = creative.image_url

      // Skip if no valid image URL
      if (!imageUrl || !imageUrl.startsWith('https://')) {
        results.skipped++
        results.details.push({ id: creative.id, status: 'skipped', error: 'No valid image URL' })
        continue
      }

      if (dryRun) {
        results.migrated++
        results.details.push({
          id: creative.id,
          status: 'would_migrate',
        })
        continue
      }

      try {
        // Lazy load Sharp
        if (!sharp) {
          sharp = (await import('sharp')).default
        }

        // Fetch the full image from storage
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`)
        }

        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

        // Generate thumbnail (400px width, maintain aspect ratio, 70% JPEG quality)
        const thumbnailBuffer = await sharp(imageBuffer)
          .resize(400, null, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 70 })
          .toBuffer()

        // Upload thumbnail to storage
        const thumbnailFilename = `${creative.organization_id}/thumb_${randomUUID()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('creatives')
          .upload(thumbnailFilename, thumbnailBuffer, {
            contentType: 'image/jpeg',
            cacheControl: '31536000',
            upsert: false,
          })

        if (uploadError) {
          throw new Error(`Storage upload failed: ${uploadError.message}`)
        }

        // Get public URL for thumbnail
        const { data: thumbUrlData } = supabase.storage
          .from('creatives')
          .getPublicUrl(thumbnailFilename)

        // Update database record with thumbnail URL
        const { error: updateError } = await supabase
          .from('creatives')
          .update({ thumbnail_url: thumbUrlData.publicUrl })
          .eq('id', creative.id)

        if (updateError) {
          // Try to clean up uploaded thumbnail
          await supabase.storage.from('creatives').remove([thumbnailFilename])
          throw new Error(`Database update failed: ${updateError.message}`)
        }

        results.migrated++
        results.details.push({
          id: creative.id,
          status: 'migrated',
          thumbnailUrl: thumbUrlData.publicUrl,
        })
      } catch (err) {
        results.failed++
        results.details.push({
          id: creative.id,
          status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    return NextResponse.json({
      message: dryRun ? 'Dry run complete' : 'Thumbnail migration complete',
      dryRun,
      totalRecordsFound: creatives.length,
      ...results,
    })
  } catch (error) {
    console.error('Thumbnail migration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check thumbnail migration status
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Count creatives with and without thumbnails
    const { count: missingThumbnails } = await supabase
      .from('creatives')
      .select('id', { count: 'exact', head: true })
      .is('thumbnail_url', null)
      .like('image_url', 'https://%')

    const { count: hasThumbnails } = await supabase
      .from('creatives')
      .select('id', { count: 'exact', head: true })
      .not('thumbnail_url', 'is', null)

    const { count: totalCount } = await supabase
      .from('creatives')
      .select('id', { count: 'exact', head: true })

    return NextResponse.json({
      total: totalCount || 0,
      withThumbnails: hasThumbnails || 0,
      missingThumbnails: missingThumbnails || 0,
      migrationNeeded: (missingThumbnails || 0) > 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status check failed' },
      { status: 500 }
    )
  }
}
