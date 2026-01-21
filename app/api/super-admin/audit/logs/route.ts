/**
 * Super Admin API: Audit Logs
 * GET /api/super-admin/audit/logs
 *
 * Search and filter Super Admin audit logs
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { adminClient }) => {
    // Use adminClient to bypass RLS and access all audit logs
    const supabase = adminClient
    const { searchParams } = new URL(request.url)

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '50')
    const action = searchParams.get('action') || ''
    const resourceType = searchParams.get('resourceType') || ''
    const superAdminId = searchParams.get('superAdminId') || ''
    const targetOrgId = searchParams.get('targetOrgId') || ''
    const targetUserId = searchParams.get('targetUserId') || ''
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''
    const wasImpersonating = searchParams.get('wasImpersonating') || ''

    const offset = (page - 1) * pageSize

    try {
      // Build query
      let query = supabase
        .from('super_admin_audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (action) {
        query = query.eq('action', action)
      }

      if (resourceType) {
        query = query.eq('resource_type', resourceType)
      }

      if (superAdminId) {
        query = query.eq('super_admin_id', superAdminId)
      }

      if (targetOrgId) {
        query = query.eq('target_organization_id', targetOrgId)
      }

      if (targetUserId) {
        query = query.eq('target_user_id', targetUserId)
      }

      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }

      if (dateTo) {
        query = query.lte('created_at', dateTo)
      }

      if (wasImpersonating === 'true') {
        query = query.eq('was_impersonating', true)
      } else if (wasImpersonating === 'false') {
        query = query.eq('was_impersonating', false)
      }

      // Pagination
      query = query.range(offset, offset + pageSize - 1)

      const { data: logs, error, count } = await query

      if (error) {
        console.error('[super-admin] Failed to fetch audit logs:', error)
        return NextResponse.json(
          { error: 'Failed to fetch audit logs', details: error.message },
          { status: 500 }
        )
      }

      // Get unique actions and resource types for filters
      const { data: actions } = await supabase
        .from('super_admin_audit_logs')
        .select('action')
        .order('action')

      const { data: resourceTypes } = await supabase
        .from('super_admin_audit_logs')
        .select('resource_type')
        .order('resource_type')

      const uniqueActions = [...new Set(actions?.map((a) => a.action) || [])]
      const uniqueResourceTypes = [...new Set(resourceTypes?.map((r) => r.resource_type) || [])]

      return NextResponse.json({
        success: true,
        logs: logs || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
        filters: {
          actions: uniqueActions,
          resourceTypes: uniqueResourceTypes,
        },
      })
    } catch (error) {
      console.error('[super-admin] Exception fetching audit logs:', error)
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      )
    }
  })
}
