import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Organization membership not found' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      name,
      description,
      category,
      vertical,
      formData,
      logoConfig,
      previewImageUrl,
      sourceCreativeId,
      isPublic,
      tags,
    } = body

    // Validate required fields
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Template name is required' },
        { status: 400 }
      )
    }

    // Validate category
    const validCategories = [
      'event_poster',
      'social_post',
      'banner',
      'announcement',
      'custom',
    ]
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid template category' },
        { status: 400 }
      )
    }

    // Verify source creative belongs to user's organization (if provided)
    if (sourceCreativeId) {
      const { data: creative, error: creativeError } = await supabase
        .from('creatives')
        .select('id, organization_id')
        .eq('id', sourceCreativeId)
        .eq('organization_id', membership.organization_id)
        .single()

      if (creativeError || !creative) {
        return NextResponse.json(
          { error: 'Source creative not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Create the template
    const { data: template, error: insertError } = await supabase
      .from('templates')
      .insert({
        organization_id: membership.organization_id,
        created_by: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        category: category || 'custom',
        vertical: vertical || null,
        form_data: formData || {},
        logo_config: logoConfig || [],
        preview_image_url: previewImageUrl || null,
        source_creative_id: sourceCreativeId || null,
        is_public: isPublic || false,
        is_featured: false,
        use_count: 0,
      })
      .select()
      .single()

    if (insertError) {
      console.error('[API templates/save] Insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to save template' },
        { status: 500 }
      )
    }

    // Store tags if provided (we can store them in metadata or a separate table)
    // For now, we'll include them in the response for the client to handle
    console.log('[API templates/save] Template saved:', {
      id: template.id,
      name: template.name,
      tags,
    })

    return NextResponse.json({
      success: true,
      template: {
        ...template,
        tags: tags || [],
      },
    })
  } catch (error) {
    console.error('[API templates/save] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// GET endpoint to list user's templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: 'Organization membership not found' },
        { status: 403 }
      )
    }

    // Get templates for the organization
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const vertical = searchParams.get('vertical')
    const onlyMine = searchParams.get('onlyMine') === 'true'

    let query = supabase
      .from('templates')
      .select('id, organization_id, created_by, name, description, category, vertical, form_data, logo_config, preview_image_url, source_creative_id, is_public, is_featured, use_count, created_at, updated_at')
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: false })
      .limit(100) // Safety limit for templates list

    if (category) {
      query = query.eq('category', category)
    }

    if (vertical) {
      query = query.eq('vertical', vertical)
    }

    if (onlyMine) {
      query = query.eq('created_by', user.id)
    } else {
      // Show public templates OR user's own templates
      query = query.or(`is_public.eq.true,created_by.eq.${user.id}`)
    }

    const { data: templates, error: fetchError } = await query

    if (fetchError) {
      console.error('[API templates/save] Fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch templates' },
        { status: 500 }
      )
    }

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('[API templates/save] Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
