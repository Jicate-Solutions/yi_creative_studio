import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError) {
      console.error('Auth error in user-data:', userError)
      return NextResponse.json({ error: 'Authentication error', details: userError.message }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Fetch profile and memberships in parallel
    const [profileResult, membershipsResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single(),
      supabase
        .from('organization_members')
        .select(`
          *,
          organizations (*)
        `)
        .eq('user_id', user.id)
    ])

    const profile = profileResult.data
    const memberships = membershipsResult.data || []

    // Define type for membership with nested organization
    type MembershipWithOrg = {
      id: string
      user_id: string
      organization_id: string
      role: string
      invited_by: string | null
      joined_at: string
      organizations: {
        id: string
        name: string
        [key: string]: unknown
      } | null
    }

    // Get organizations from memberships
    const organizations = (memberships as MembershipWithOrg[])
      .map((m) => m.organizations)
      .filter(Boolean)

    // Get first organization and its membership
    const organization = organizations[0] || null
    const membership = organization
      ? (memberships as MembershipWithOrg[]).find((m) =>
          m.organizations?.id === organization.id
        )
      : null

    return NextResponse.json({
      profile,
      membership,
      organization,
      organizations,
    })
  } catch (error) {
    console.error('Error fetching user data:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({
      error: 'Internal server error',
      details: errorMessage
    }, { status: 500 })
  }
}
