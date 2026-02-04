import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Verify super admin
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = (await supabase
    .from('profiles' as any)
    .select('is_super_admin')
    .eq('id', user.id)
    .single()) as { data: { is_super_admin: boolean } | null }

  if (!profile?.is_super_admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get query params
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '25')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || 'all'

  const offset = (page - 1) * pageSize

  // Build query
  let query = supabase
    .from('event_sources' as any)
    .select(
      `
      *,
      organization:organizations!inner(id, name)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })

  // Apply filters
  if (search) {
    query = query.or(`name.ilike.%${search}%,source_app_id.ilike.%${search}%`)
  }

  if (status === 'active') {
    query = query.eq('is_active', true)
  } else if (status === 'inactive') {
    query = query.eq('is_active', false)
  }

  // Pagination
  query = query.range(offset, offset + pageSize - 1)

  const { data: sources, error, count } = (await query) as { data: Array<Record<string, any>> | null; error: any; count: number | null }

  if (error) {
    console.error('Error fetching event sources:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add webhook_secret_preview (first 8 chars)
  const sourcesWithPreview = sources?.map((source) => ({
    ...source,
    webhook_secret_preview: source.webhook_secret?.substring(0, 8) || null,
  }))

  return NextResponse.json({
    success: true,
    sources: sourcesWithPreview,
    pagination: {
      page,
      pageSize,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
    },
  })
}
