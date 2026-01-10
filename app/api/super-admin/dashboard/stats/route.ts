/**
 * Super Admin Dashboard Stats API
 * Returns platform-wide statistics
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Check Super Admin authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify Super Admin role
  const { data: userData } = await supabase
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!userData?.is_super_admin) {
    return NextResponse.json({ error: 'Forbidden - Super Admin access required' }, { status: 403 })
  }

  try {
    // Fetch organization count
    const { count: orgCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })

    // Fetch user count
    const { count: userCount } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })

    // Fetch active subscriptions count
    const { count: activeSubsCount } = await supabase
      .from('organization_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')

    // Calculate total credits allocated
    const { data: creditData } = await supabase
      .from('organization_credits')
      .select('total_allocated')

    const totalCreditsAllocated = creditData?.reduce((sum, org) => sum + (org.total_allocated || 0), 0) || 0

    return NextResponse.json({
      success: true,
      stats: {
        orgCount: orgCount || 0,
        userCount: userCount || 0,
        activeSubsCount: activeSubsCount || 0,
        totalCreditsAllocated,
      },
    })
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}
