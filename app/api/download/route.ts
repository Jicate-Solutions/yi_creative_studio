import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    const creativeId = searchParams.get('id')
    const format = searchParams.get('format') || 'png'
    const quality = parseInt(searchParams.get('quality') || '90')

    if (!creativeId) {
      return NextResponse.json({ error: 'Creative ID required' }, { status: 400 })
    }

    // Validate format
    const allowedFormats = ['png', 'jpeg', 'webp']
    if (!allowedFormats.includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Allowed: png, jpeg, webp' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch creative and verify ownership (specific columns to reduce disk IO)
    const { data: creative, error } = await supabase
      .from('creatives')
      .select(`
        id,
        organization_id,
        download_count,
        image_url,
        title,
        creative_type,
        organizations!inner (
          id
        )
      `)
      .eq('id', creativeId)
      .single()

    if (error || !creative) {
      return NextResponse.json({ error: 'Creative not found' }, { status: 404 })
    }

    // Verify user has access to this creative's organization
    const { data: membership } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', user.id)
      .eq('organization_id', creative.organization_id)
      .single()

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Update download count
    await supabase
      .from('creatives')
      .update({ download_count: (creative.download_count || 0) + 1 })
      .eq('id', creativeId)

    // Get the image
    const imageUrl = creative.image_url

    // If it's a data URL (base64), convert it
    if (imageUrl.startsWith('data:')) {
      const base64Data = imageUrl.split(',')[1]
      const mimeType = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp'

      // For data URLs, we return as-is for now (conversion would require sharp)
      const buffer = Buffer.from(base64Data, 'base64')

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': mimeType,
          'Content-Disposition': `attachment; filename="${creative.title || 'creative'}.${format}"`,
          'Cache-Control': 'no-cache',
        },
      })
    }

    // For external URLs, fetch and return
    const response = await fetch(imageUrl)
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 500 })
    }

    const imageBuffer = await response.arrayBuffer()
    const mimeType = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp'

    // In production, use Sharp for format conversion:
    // const sharp = require('sharp')
    // const convertedBuffer = await sharp(Buffer.from(imageBuffer))
    //   .toFormat(format, { quality })
    //   .toBuffer()

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `attachment; filename="${creative.title || 'creative'}.${format}"`,
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Download failed' },
      { status: 500 }
    )
  }
}
