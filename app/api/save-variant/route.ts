/**
 * Save Variant API Endpoint
 *
 * Uploads a chosen color-shuffled variant to Supabase Storage and updates
 * the creative record with the shuffled image URL and color mapping.
 *
 * POST /api/save-variant
 * Body: {
 *   creativeId: string,
 *   variantDataUrl: string (base64),
 *   colorMapping: ColorMapping[]
 * }
 * Response: { success: true, shuffledImageUrl: string }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

// ============================================================
// REQUEST VALIDATION
// ============================================================

const RequestSchema = z.object({
  creativeId: z.string().uuid(),
  variantDataUrl: z.string().startsWith('data:image/'), // base64 data URL
  colorMapping: z.array(z.object({
    zone: z.enum(['background', 'text', 'accent']),
    fromColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    toColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/)
  }))
})

// ============================================================
// HANDLER
// ============================================================

export async function POST(request: NextRequest) {
  console.log('[Save Variant API] Request received')

  try {
    // Parse and validate request body
    const body = await request.json()
    const { creativeId, variantDataUrl, colorMapping } = RequestSchema.parse(body)

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch creative and verify ownership
    const { data: creative, error: creativeError } = await supabase
      .from('creatives')
      .select('*, organization_id')
      .eq('id', creativeId)
      .single()

    if (creativeError || !creative) {
      return NextResponse.json(
        { error: 'Creative not found' },
        { status: 404 }
      )
    }

    // Verify user belongs to organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', creative.organization_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    console.log('[Save Variant API] User authorized for creative:', creativeId)

    // Convert base64 data URL to Buffer
    const base64Data = variantDataUrl.split(',')[1]
    const imageBuffer = Buffer.from(base64Data, 'base64')

    console.log('[Save Variant API] Image buffer size:', (imageBuffer.length / 1024).toFixed(2), 'KB')

    // Upload to Supabase Storage (overwrites previous shuffled_latest.png)
    const storagePath = `${creative.organization_id}/${creativeId}/shuffled_latest.png`

    const { error: uploadError } = await supabase.storage
      .from('creatives')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true // Overwrite existing file
      })

    if (uploadError) {
      console.error('[Save Variant API] Upload error:', uploadError)
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('creatives')
      .getPublicUrl(storagePath)

    const shuffledImageUrl = urlData.publicUrl

    console.log('[Save Variant API] Uploaded to:', shuffledImageUrl)

    // Update creative record
    const { error: updateError } = await supabase
      .from('creatives')
      .update({
        shuffled_image_url: shuffledImageUrl,
        shuffled_color_mapping: colorMapping,
        shuffled_at: new Date().toISOString()
      })
      .eq('id', creativeId)

    if (updateError) {
      console.error('[Save Variant API] Update error:', updateError)
      throw new Error(`Failed to update creative: ${updateError.message}`)
    }

    console.log('[Save Variant API] Success - variant saved')

    return NextResponse.json({
      success: true,
      shuffledImageUrl,
      colorMapping,
      message: 'Variant saved successfully'
    })
  } catch (error) {
    console.error('[Save Variant API] Error:', error)

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      )
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to save variant',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
