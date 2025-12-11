import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('[Gallery API] Auth error:', userError.message)
      return NextResponse.json({ error: 'Authentication error', details: userError.message }, { status: 401 })
    }

    if (!user) {
      console.error('[Gallery API] No user found in session')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organizationId')
    const sortBy = searchParams.get('sortBy') || 'newest'
    const verticalFilter = searchParams.get('vertical')
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true'
    const searchQuery = searchParams.get('search')

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID required' }, { status: 400 })
    }

    // Build query - select only columns needed for list view
    // Exclude image_url (1MB+ base64 per row) - fetch separately for detail view
    let query = supabase
      .from('creatives')
      .select('id, organization_id, created_by, creative_type, vertical, title, form_data, logo_config, ai_model, ai_model_id, prompt_used, thumbnail_url, image_url, credits_used, generation_time_ms, download_count, is_favorite, created_at, expires_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: sortBy === 'oldest' })

    if (verticalFilter && verticalFilter !== 'all') {
      query = query.eq('vertical', verticalFilter)
    }

    if (favoritesOnly) {
      query = query.eq('is_favorite', true)
    }

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,prompt_used.ilike.%${searchQuery}%`)
    }

    const { data, error } = await query

    if (error) {
      console.error('[Gallery API] Supabase query error:', error.message, error.code, error.hint)
      // If it's an RLS/auth error (code 42501 or similar), return 401 for retry
      if (error.message?.includes('permission') || error.code === '42501' || error.message?.includes('RLS')) {
        return NextResponse.json({ error: 'Database permission error', details: error.message }, { status: 401 })
      }
      return NextResponse.json({ error: 'Failed to fetch creatives', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ creatives: data || [] })
  } catch (error) {
    console.error('Error in gallery creatives API:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Internal server error', details: errorMessage }, { status: 500 })
  }
}
