/**
 * Super Admin API: List Webhook Logs
 * GET /api/super-admin/webhooks/logs/list
 *
 * Returns paginated list of webhook call logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { adminClient }) => {
    const { searchParams } = new URL(req.url)

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '25')
    const source = searchParams.get('source') // source_app_id filter
    const status = searchParams.get('status') // success, error, validation_error
    const action = searchParams.get('action') // create, update, delete
    const organizationId = searchParams.get('organization_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')

    const offset = (page - 1) * pageSize

    try {
      // Build query - Using 'as any' because webhook_logs table is not yet in database types
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let query = (adminClient as any)
        .from('webhook_logs')
        .select(
          `
          id,
          event_source_id,
          source_app_id,
          organization_id,
          action,
          external_event_id,
          event_name,
          status,
          error_message,
          ip_address,
          user_agent,
          duration_ms,
          created_at,
          organization:organizations(id, name)
        `,
          { count: 'exact' }
        )

      // Source filter
      if (source) {
        query = query.eq('source_app_id', source)
      }

      // Status filter
      if (status) {
        query = query.eq('status', status)
      }

      // Action filter
      if (action) {
        query = query.eq('action', action)
      }

      // Organization filter
      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      // Date range filter
      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }

      // Sorting and pagination
      query = query.order('created_at', { ascending: false }).range(offset, offset + pageSize - 1)

      const { data: logs, error, count } = await query

      if (error) {
        console.error('[super-admin] Failed to fetch webhook logs:', error)
        return NextResponse.json({ error: 'Failed to fetch webhook logs', details: error.message }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        logs: logs || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
      })
    } catch (error) {
      console.error('[super-admin] Exception fetching webhook logs:', error)
      return NextResponse.json(
        { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  })
}
