/**
 * Super Admin API: Export Organizations
 * GET /api/super-admin/organizations/export
 *
 * Export organizations data in CSV or JSON format
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { adminClient }) => {
    const supabase = adminClient

    try {
      const { searchParams } = new URL(req.url)
      const format = searchParams.get('format') || 'csv'
      const columnsParam = searchParams.get('columns') || ''
      const search = searchParams.get('search') || ''
      const status = searchParams.get('status') || ''

      // Define all available columns
      const allColumns = [
        'id',
        'name',
        'slug',
        'credits_balance',
        'member_count',
        'is_active',
        'created_at',
        'updated_at',
      ]

      // Parse requested columns
      const requestedColumns = columnsParam
        ? columnsParam.split(',').filter((c) => allColumns.includes(c))
        : allColumns

      if (requestedColumns.length === 0) {
        return NextResponse.json({ error: 'No valid columns specified' }, { status: 400 })
      }

      // Build query with member count
      let query = supabase.from('organizations').select(`
        id,
        name,
        slug,
        credits_balance,
        is_active,
        created_at,
        updated_at,
        organization_members(count)
      `)

      // Apply filters
      if (search) {
        query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
      }

      if (status === 'active') {
        query = query.eq('is_active', true)
      } else if (status === 'inactive') {
        query = query.eq('is_active', false)
      }

      const { data: organizations, error } = await query.order('created_at', { ascending: false })

      if (error) {
        console.error('[organizations-export] Failed to fetch organizations:', error)
        throw new Error('Failed to fetch organizations')
      }

      // Transform data to flat structure
      const exportData = (organizations || []).map((org) => {
        const memberCount = org.organization_members?.[0]?.count || 0

        return {
          id: org.id,
          name: org.name,
          slug: org.slug || '',
          credits_balance: org.credits_balance || 0,
          member_count: memberCount,
          is_active: org.is_active ? 'Yes' : 'No',
          created_at: org.created_at ? new Date(org.created_at).toISOString() : '',
          updated_at: org.updated_at ? new Date(org.updated_at).toISOString() : '',
        }
      })

      // Filter to requested columns
      const filteredData = exportData.map((row) => {
        const filtered: Record<string, unknown> = {}
        requestedColumns.forEach((col) => {
          filtered[col] = row[col as keyof typeof row]
        })
        return filtered
      })

      if (format === 'json') {
        return NextResponse.json(filteredData, {
          headers: {
            'Content-Disposition': `attachment; filename="organizations_export.json"`,
          },
        })
      }

      // CSV format
      const header = requestedColumns.join(',')
      const rows = filteredData.map((row) =>
        requestedColumns
          .map((col) => {
            const value = row[col]
            if (value === null || value === undefined) return ''
            const str = String(value)
            if (str.includes(',') || str.includes('\n') || str.includes('"')) {
              return `"${str.replace(/"/g, '""')}"`
            }
            return str
          })
          .join(',')
      )
      const csv = [header, ...rows].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="organizations_export.csv"`,
        },
      })
    } catch (error) {
      console.error('[organizations-export] Export failed:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Export failed' },
        { status: 500 }
      )
    }
  })
}
