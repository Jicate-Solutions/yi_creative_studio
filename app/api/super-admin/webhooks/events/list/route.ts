/**
 * Super Admin API: List Synced Events
 * GET /api/super-admin/webhooks/events/list
 *
 * Returns paginated list of synced events from external sources
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { adminClient }) => {
    const { searchParams } = new URL(req.url)

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '25')
    const search = searchParams.get('search') || ''
    const source = searchParams.get('source') // source_app_id filter
    const organizationId = searchParams.get('organization_id')
    const status = searchParams.get('status') // published, draft, cancelled
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    const offset = (page - 1) * pageSize

    try {
      // Build query - Using 'as any' because synced_events table is not yet in database types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (adminClient as any)
        .from('synced_events' as any)
        .select(
          `
          id,
          external_id,
          source_app_id,
          organization_id,
          event_name,
          event_date,
          event_time,
          venue,
          city,
          status,
          is_virtual,
          chapter_name,
          synced_at,
          created_at,
          updated_at,
          organization:organizations(id, name)
        `,
          { count: 'exact' }
        )

      // Search filter
      if (search) {
        query = query.or(`event_name.ilike.%${search}%,external_id.ilike.%${search}%,venue.ilike.%${search}%`)
      }

      // Source filter
      if (source) {
        query = query.eq('source_app_id', source)
      }

      // Organization filter
      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      // Status filter
      if (status) {
        query = query.eq('status', status)
      }

      // Date range filter
      if (dateFrom) {
        query = query.gte('event_date', dateFrom)
      }
      if (dateTo) {
        query = query.lte('event_date', dateTo)
      }

      // Sorting and pagination
      query = query.order('synced_at', { ascending: false }).range(offset, offset + pageSize - 1)

      const { data: events, error, count } = await query

      if (error) {
        console.error('[super-admin] Failed to fetch synced events:', error)
        return NextResponse.json({ error: 'Failed to fetch synced events', details: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        events: events || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      })
    } catch (error) {
      console.error('[super-admin] Exception fetching synced events:', error)
      return NextResponse.json(
        { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  })
}
