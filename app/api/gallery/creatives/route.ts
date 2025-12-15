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
    // CRITICAL: Exclude heavy columns to prevent JSON parsing failures (57MB+ responses)
    // - image_url: 1MB+ base64 per row
    // - prompt_used: 10KB+ per row (AI prompts)
    // - form_data: JSON form values (fetch on-demand for template saving)
    // - logo_config: JSON logo placements (fetch on-demand for template saving)
    let query = supabase
      .from('creatives')
      .select('id, organization_id, creative_type, vertical, title, ai_model, thumbnail_url, credits_used, is_favorite, created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: sortBy === 'oldest' })
      .limit(50) // Pagination limit to prevent large result sets

    if (verticalFilter && verticalFilter !== 'all') {
      query = query.eq('vertical', verticalFilter)
    }

    if (favoritesOnly) {
      query = query.eq('is_favorite', true)
    }

    if (searchQuery) {
      // Only search on title - searching prompt_used forces loading 10KB+ per row
      // even though it's not in the select (performance killer)
      query = query.ilike('title', `%${searchQuery}%`)
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
