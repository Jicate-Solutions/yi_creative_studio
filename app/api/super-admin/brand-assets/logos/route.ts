/**
 * Super Admin API: Brand Assets - Logos
 * GET /api/super-admin/brand-assets/logos
 *
 * List all logos across all organizations
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async () => {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '24')
    const search = searchParams.get('search') || ''
    const organizationId = searchParams.get('organizationId') || ''
    const type = searchParams.get('type') || '' // 'primary', 'secondary', 'text'

    const offset = (page - 1) * pageSize

    try {
      // Build query for logos
      let query = supabase
        .from('logos')
        .select(`
          *,
          organizations(id, name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Organization filter
      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      // Type filter
      if (type) {
        query = query.eq('type', type)
      }

      // Search by name
      if (search) {
        query = query.ilike('name', `%${search}%`)
      }

      // Pagination
      query = query.range(offset, offset + pageSize - 1)

      const { data: logos, error, count } = await query

      if (error) {
        console.error('[super-admin] Failed to fetch logos:', error)
        return NextResponse.json(
          { error: 'Failed to fetch logos', details: error.message },
          { status: 500 }
        )
      }

      // Get unique organizations for filter
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name')

      return NextResponse.json({
        success: true,
        logos: logos || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
        filters: {
          organizations: organizations || [],
        },
      })
    } catch (error) {
      console.error('[super-admin] Exception fetching logos:', error)
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
