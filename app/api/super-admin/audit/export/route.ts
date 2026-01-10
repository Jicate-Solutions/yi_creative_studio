/**
 * Super Admin API: Export Audit Logs
 * POST /api/super-admin/audit/export
 *
 * Export audit logs as CSV or JSON
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'
import { createClient } from '@/lib/supabase/server'
import { logSuperAdminAction } from '@/lib/services/audit-service'

export async function POST(request: NextRequest) {
  return superAdminGuard(request, async (req, { superAdmin }) => {
    const supabase = await createClient()

    try {
      const body = await req.json()
      const {
        format = 'csv',
        action,
        resourceType,
        dateFrom,
        dateTo,
        limit = 10000,
      } = body

      // Build query
      let query = supabase
        .from('super_admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      // Apply filters
      if (action) query = query.eq('action', action)
      if (resourceType) query = query.eq('resource_type', resourceType)
      if (dateFrom) query = query.gte('created_at', dateFrom)
      if (dateTo) query = query.lte('created_at', dateTo)

      const { data: logs, error } = await query

      if (error) {
        console.error('[super-admin] Failed to fetch logs for export:', error)
        return NextResponse.json(
          { error: 'Failed to fetch logs', details: error.message },
          { status: 500 }
        )
      }

      if (!logs || logs.length === 0) {
        return NextResponse.json(
          { error: 'No logs found matching the criteria' },
          { status: 404 }
        )
      }

      // Log export action
      await logSuperAdminAction({
        super_admin_id: superAdmin.id,
        action: 'audit:export',
        resource_type: 'audit_logs',
        changes: {
          after: {
            format,
            count: logs.length,
            filters: { action, resourceType, dateFrom, dateTo },
          },
        },
      })

      if (format === 'json') {
        // JSON export
        return new NextResponse(JSON.stringify(logs, null, 2), {
          headers: {
            'Content-Type': 'application/json',
            'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.json"`,
          },
        })
      } else {
        // CSV export
        const csvHeaders = [
          'Timestamp',
          'Super Admin',
          'Action',
          'Resource Type',
          'Resource ID',
          'Target Org ID',
          'Target User ID',
          'IP Address',
          'Was Impersonating',
          'Changes',
        ].join(',')

        const csvRows = logs.map((log) => {
          return [
            log.created_at,
            log.super_admin_email,
            log.action,
            log.resource_type,
            log.resource_id || '',
            log.target_organization_id || '',
            log.target_user_id || '',
            log.ip_address || '',
            log.was_impersonating ? 'Yes' : 'No',
            log.changes ? JSON.stringify(log.changes).replace(/"/g, '""') : '',
          ]
            .map((field) => `"${field}"`)
            .join(',')
        })

        const csv = [csvHeaders, ...csvRows].join('\n')

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="audit-logs-${new Date().toISOString()}.csv"`,
          },
        })
      }
    } catch (error) {
      console.error('[super-admin] Failed to export audit logs:', error)
      return NextResponse.json(
        {
          error: 'Failed to export audit logs',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
