/**
 * Super Admin API: Export Users
 * GET /api/super-admin/users/export
 *
 * Export users data in CSV or JSON format
 * Uses same pattern as users/list API
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
        'email',
        'full_name',
        'phone',
        'is_active',
        'organization_name',
        'created_at',
        'last_sign_in_at',
      ]

      // Parse requested columns
      const requestedColumns = columnsParam
        ? columnsParam.split(',').filter((c) => allColumns.includes(c))
        : allColumns

      if (requestedColumns.length === 0) {
        return NextResponse.json({ error: 'No valid columns specified' }, { status: 400 })
      }

      // Fetch ALL users from auth.users using admin API (for export)
      // Get up to 1000 users per page for bulk export
      type AuthUser = Awaited<
        ReturnType<typeof supabase.auth.admin.listUsers>
      >['data']['users'][number]
      const allUsers: AuthUser[] = []

      let page = 1
      const perPage = 1000
      let hasMore = true

      while (hasMore) {
        const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
          page,
          perPage,
        })

        if (authError) {
          console.error('[users-export] Failed to fetch auth users:', authError)
          throw new Error('Failed to fetch users')
        }

        const users = authData?.users || []
        allUsers.push(...users)

        // Check if there are more pages
        hasMore = users.length === perPage
        page++

        // Safety limit - max 10 pages (10000 users)
        if (page > 10) break
      }

      // Get organization memberships for all users
      const userIds = allUsers.map((u) => u.id)
      const { data: memberships } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          role,
          organizations (
            id,
            name
          )
        `)
        .in('user_id', userIds)

      // Build membership map
      const membershipMap = new Map<string, { org_name: string; role: string }>()
      memberships?.forEach((m) => {
        const org = m.organizations as { id: string; name: string } | null
        if (org && !membershipMap.has(m.user_id)) {
          membershipMap.set(m.user_id, {
            org_name: org.name,
            role: m.role,
          })
        }
      })

      // Fetch user profiles for all users
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name, phone')
        .in('id', userIds)

      // Build profile map
      const profileMap = new Map<
        string,
        { full_name: string | null; phone: string | null }
      >()
      profiles?.forEach((p) => {
        profileMap.set(p.id, {
          full_name: p.full_name,
          phone: p.phone,
        })
      })

      // Transform to export format
      let exportData = allUsers.map((user) => {
        const userMeta = user.user_metadata
        const appMeta = user.app_metadata
        const isBanned = !!(userMeta?.banned_until || appMeta?.banned_until)
        const isActive = !isBanned && !!user.confirmed_at

        const profile = profileMap.get(user.id)
        const membership = membershipMap.get(user.id)

        return {
          id: user.id,
          email: user.email || 'No email',
          full_name: profile?.full_name || (userMeta?.full_name as string) || '',
          phone: profile?.phone || '',
          is_active: isActive ? 'Yes' : 'No',
          organization_name: membership?.org_name || 'None',
          created_at: user.created_at ? new Date(user.created_at).toISOString() : '',
          last_sign_in_at: user.last_sign_in_at
            ? new Date(user.last_sign_in_at).toISOString()
            : 'Never',
        }
      })

      // Apply filters
      if (search) {
        const searchLower = search.toLowerCase()
        exportData = exportData.filter(
          (u) =>
            u.email.toLowerCase().includes(searchLower) ||
            u.full_name.toLowerCase().includes(searchLower)
        )
      }

      if (status === 'active') {
        exportData = exportData.filter((u) => u.is_active === 'Yes')
      } else if (status === 'inactive') {
        exportData = exportData.filter((u) => u.is_active === 'No')
      }

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
            'Content-Disposition': `attachment; filename="users_export.json"`,
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
          'Content-Disposition': `attachment; filename="users_export.csv"`,
        },
      })
    } catch (error) {
      console.error('[users-export] Export failed:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Export failed' },
        { status: 500 }
      )
    }
  })
}
