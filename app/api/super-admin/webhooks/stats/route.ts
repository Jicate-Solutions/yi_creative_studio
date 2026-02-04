import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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

  // Get event sources stats
  const { data: allSources } = (await supabase.from('event_sources' as any).select('is_active')) as { data: Array<Record<string, any>> | null }

  const sourcesStats = {
    total: allSources?.length || 0,
    active: allSources?.filter((s) => s.is_active).length || 0,
    inactive: allSources?.filter((s) => !s.is_active).length || 0,
  }

  // Get synced events stats
  const { count: totalEvents } = await supabase
    .from('synced_events' as any)
    .select('*', { count: 'exact', head: true })

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { count: events24h } = await supabase
    .from('synced_events' as any)
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneDayAgo)

  // Get webhook logs stats (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: logsLast7Days } = (await supabase
    .from('webhook_logs' as any)
    .select('status')
    .gte('created_at', sevenDaysAgo)) as { data: Array<Record<string, any>> | null }

  const totalLogs = logsLast7Days?.length || 0
  const successLogs = logsLast7Days?.filter((log) => log.status === 'success').length || 0
  const errorLogs = logsLast7Days?.filter((log) => log.status === 'error').length || 0

  const successRate = totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 100

  // Get recent activity
  const { data: recentActivity } = (await supabase
    .from('webhook_logs' as any)
    .select('id, source_app_id, action, status, event_name, created_at')
    .order('created_at', { ascending: false })
    .limit(10)) as { data: Array<Record<string, any>> | null }

  return NextResponse.json({
    success: true,
    stats: {
      sources: sourcesStats,
      events: {
        total: totalEvents || 0,
        last24h: events24h || 0,
      },
      logs: {
        successRate,
        recentErrors: errorLogs,
        totalLast7Days: totalLogs,
      },
    },
    recentActivity: recentActivity || [],
  })
}
