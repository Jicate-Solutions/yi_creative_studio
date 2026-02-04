import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get organization_id from query
  const searchParams = request.nextUrl.searchParams
  const organizationId = searchParams.get('organization_id')

  if (!organizationId) {
    return NextResponse.json({ error: 'organization_id is required' }, { status: 400 })
  }

  // Verify user is admin of this organization
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .single()

  if (!membership || membership.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
  }

  // Fetch event sources for this organization
  const { data: sources, error } = (await supabase
    .from('event_sources' as any)
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })) as { data: Array<Record<string, any>> | null; error: any }

  if (error) {
    console.error('Error fetching event sources:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get event counts for each source
  const sourcesWithCounts = await Promise.all(
    (sources || []).map(async (source) => {
      const { count } = await supabase
        .from('synced_events' as any)
        .select('*', { count: 'exact', head: true })
        .eq('source_app_id', source.source_app_id)
        .eq('organization_id', organizationId)

      return {
        ...source,
        webhook_secret_preview: source.webhook_secret?.substring(0, 8) || null,
        eventsCount: count || 0,
      }
    })
  )

  // Get total stats
  const { count: totalEvents } = await supabase
    .from('synced_events' as any)
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)

  return NextResponse.json({
    success: true,
    sources: sourcesWithCounts,
    stats: {
      totalSources: sources?.length || 0,
      activeSources: sources?.filter((s) => s.is_active).length || 0,
      totalEvents: totalEvents || 0,
    },
  })
}
