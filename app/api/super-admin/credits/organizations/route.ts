/**
 * Super Admin Credits Organizations API
 * Returns all organizations with their credit information
 */

import { NextRequest, NextResponse } from 'next/server'
import { superAdminGuard } from '@/lib/middleware/super-admin-guard'

export async function GET(request: NextRequest) {
  return superAdminGuard(request, async (req, { superAdmin, adminClient }) => {
    // Use adminClient to bypass RLS and access all organizations' credit data
    const supabase = adminClient

    // Parse query parameters
    const searchParams = req.nextUrl.searchParams
    const search = searchParams.get('search') || ''

    try {
      // Fetch organizations - credits_balance is directly on organizations table
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('credits_balance', { ascending: false })

      if (orgsError) {
        throw orgsError
      }

      // Format results
      let organizations = orgsData?.map((org: any) => ({
        organization_id: org.id,
        organization_name: org.name || 'Unknown',
        balance: org.credits_balance || 0,
        total_allocated: 0,  // Not tracked in current schema
        total_consumed: 0,   // Not tracked in current schema
        total_purchased: 0,  // Not tracked in current schema
        low_balance_threshold: 100,  // Default value
        last_allocation_at: null,
        last_consumption_at: null,
        is_active: org.is_active ?? true,
      })) || []

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase()
        organizations = organizations.filter((org) =>
          org.organization_name.toLowerCase().includes(searchLower) ||
          org.organization_id.toLowerCase().includes(searchLower)
        )
      }

      return NextResponse.json({
        success: true,
        organizations,
      })
    } catch (error) {
      console.error('Failed to fetch organization credits:', error)
      return NextResponse.json(
        { error: 'Failed to fetch organization credits' },
        { status: 500 }
      )
    }
  })
}
