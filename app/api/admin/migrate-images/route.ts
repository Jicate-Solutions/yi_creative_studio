import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

/**
 * Admin API to migrate existing base64 images from the database to Supabase Storage.
 * This is a one-time migration to fix the database bloat issue where images were
 * stored as base64 in the `image_url` column instead of URLs to Storage.
 *
 * POST /api/admin/migrate-images
 * Query params:
 *   - limit: Number of records to process (default: 10, max: 50)
 *   - dryRun: If 'true', only report what would be migrated without making changes
 *
 * Response:
 *   - migrated: Number of records successfully migrated
 *   - skipped: Number of records already using URLs
 *   - failed: Number of records that failed to migrate
 *   - details: Array of migration results per record
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
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
    const dryRun = searchParams.get('dryRun') === 'true'

    // Find creatives with base64 image_url
    const { data: creatives, error: fetchError } = await supabase
      .from('creatives')
      .select('id, organization_id, image_url, thumbnail_url')
      .like('image_url', 'data:image%')
      .limit(limit)

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!creatives || creatives.length === 0) {
      return NextResponse.json({
        message: 'No base64 images found to migrate',
        migrated: 0,
        skipped: 0,
        failed: 0,
      })
    }

    const results = {
      migrated: 0,
      skipped: 0,
      failed: 0,
      details: [] as Array<{ id: string; status: string; oldSize?: number; newUrl?: string; error?: string }>,
    }

    for (const creative of creatives) {
      const imageUrl = creative.image_url

      // Skip if not base64
      if (!imageUrl.startsWith('data:image')) {
        results.skipped++
        results.details.push({ id: creative.id, status: 'skipped', error: 'Not a base64 image' })
        continue
      }

      // Parse base64 data
      const [header, base64Data] = imageUrl.split(',')
      const mimeMatch = header.match(/data:([^;]+);/)
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
      const extension = mimeType.split('/')[1] || 'png'
      const oldSize = Math.round(base64Data.length * 0.75) // Approximate actual bytes

      if (dryRun) {
        results.migrated++
        results.details.push({
          id: creative.id,
          status: 'would_migrate',
          oldSize,
        })
        continue
      }

      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(base64Data, 'base64')

        // Generate unique filename
        const filename = `${creative.organization_id}/${randomUUID()}.${extension}`

        // Upload to Storage
        const { error: uploadError } = await supabase.storage
          .from('creatives')
          .upload(filename, buffer, {
            contentType: mimeType,
            cacheControl: '31536000',
            upsert: false,
          })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('creatives')
          .getPublicUrl(filename)

        // Update database record
        const { error: updateError } = await supabase
          .from('creatives')
          .update({ image_url: urlData.publicUrl })
          .eq('id', creative.id)

        if (updateError) {
          // Try to clean up uploaded file
          await supabase.storage.from('creatives').remove([filename])
          throw new Error(updateError.message)
        }

        results.migrated++
        results.details.push({
          id: creative.id,
          status: 'migrated',
          oldSize,
          newUrl: urlData.publicUrl,
        })
      } catch (err) {
        results.failed++
        results.details.push({
          id: creative.id,
          status: 'failed',
          oldSize,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    // Calculate total bytes saved
    const totalBytesSaved = results.details
      .filter(d => d.status === 'migrated' || d.status === 'would_migrate')
      .reduce((sum, d) => sum + (d.oldSize || 0), 0)

    return NextResponse.json({
      message: dryRun ? 'Dry run complete' : 'Migration complete',
      dryRun,
      totalRecordsFound: creatives.length,
      totalBytesSaved,
      totalMBSaved: (totalBytesSaved / 1024 / 1024).toFixed(2),
      ...results,
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Migration failed' },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check migration status
 */
export async function GET() {
  try {
    const supabase = await createClient()

    // Count base64 vs URL images
    const { data: base64Count } = await supabase
      .from('creatives')
      .select('id', { count: 'exact', head: true })
      .like('image_url', 'data:image%')

    const { data: urlCount } = await supabase
      .from('creatives')
      .select('id', { count: 'exact', head: true })
      .like('image_url', 'https://%')

    const { count: totalCount } = await supabase
      .from('creatives')
      .select('id', { count: 'exact', head: true })

    return NextResponse.json({
      total: totalCount || 0,
      base64Images: base64Count || 0,
      urlImages: urlCount || 0,
      migrationNeeded: (base64Count || 0) > 0,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Status check failed' },
      { status: 500 }
    )
  }
}
