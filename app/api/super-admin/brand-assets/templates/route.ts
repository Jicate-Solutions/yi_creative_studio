/**
 * Super Admin API: Brand Assets - Templates
 * GET /api/super-admin/brand-assets/templates
 *
 * List all templates across all organizations
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { adminClient }) => {
    // Use adminClient to bypass RLS and access all templates
    const supabase = adminClient
    const { searchParams } = new URL(request.url)

    // Query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '24')
    const search = searchParams.get('search') || ''
    const organizationId = searchParams.get('organizationId') || ''
    const category = searchParams.get('category') || ''

    const offset = (page - 1) * pageSize

    try {
      // Build query for templates
      let query = supabase
        .from('templates')
        .select(`
          *,
          organizations(id, name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Organization filter
      if (organizationId) {
        query = query.eq('organization_id', organizationId)
      }

      // Category filter
      if (category) {
        query = query.eq('category', category)
      }

      // Search by name or description
      if (search) {
        query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Pagination
      query = query.range(offset, offset + pageSize - 1)

      const { data: templates, error, count } = await query

      if (error) {
        console.error('[super-admin] Failed to fetch templates:', error)
        return NextResponse.json(
          { error: 'Failed to fetch templates', details: error.message },
          { status: 500 }
        )
      }

      // Get unique organizations for filter
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name')

      // Get unique categories from templates
      const { data: categoriesData } = await supabase
        .from('templates')
        .select('category')
        .not('category', 'is', null)

      const uniqueCategories = [...new Set(categoriesData?.map((t) => t.category) || [])]

      return NextResponse.json({
        success: true,
        templates: templates || [],
        pagination: {
          page,
          pageSize,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize),
        },
        filters: {
          organizations: organizations || [],
          categories: uniqueCategories,
        },
      })
    } catch (error) {
      console.error('[super-admin] Exception fetching templates:', error)
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
