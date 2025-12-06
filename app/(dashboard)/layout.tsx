import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout'
import { ROUTES } from '@/lib/config/constants'

// Use revalidate instead of force-dynamic for better performance
// Pages will still be dynamic due to cookies() usage in createClient
// but Next.js can optimize static parts of the page
export const revalidate = 0

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Middleware handles primary auth protection and cookie refresh.
  // This check serves as a safety net - if we get here without a user,
  // the middleware should have already redirected with preserved cookies.
  if (!user) {
    console.warn('[DashboardLayout] No user found - this should have been caught by middleware')
    redirect(ROUTES.login)
  }

  // Fetch membership and profile data in PARALLEL for better performance
  // This reduces ~900ms (3 sequential queries) to ~300ms (2 parallel queries)
  const [membershipsResult, profileResult] = await Promise.all([
    supabase
      .from('organization_members')
      .select(`
        *,
        organizations (*)
      `)
      .eq('user_id', user.id),
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
  ])

  const memberships = membershipsResult.data
  const profile = profileResult.data

  if (!memberships || memberships.length === 0) {
    redirect('/onboarding')
  }

  // Prepare initial auth data for client hydration
  const organizations = memberships
    .map((m) => m.organizations)
    .filter(Boolean)

  const currentOrganization = organizations[0] || null
  const membership = currentOrganization
    ? memberships.find((m) => m.organizations?.id === currentOrganization.id)
    : null

  const initialAuthData = {
    profile,
    membership: membership ? {
      id: membership.id,
      user_id: membership.user_id,
      organization_id: membership.organization_id,
      role: membership.role,
      invited_by: membership.invited_by,
      joined_at: membership.joined_at,
    } : null,
    currentOrganization,
    organizations,
  }

  return (
    <DashboardLayout initialAuthData={initialAuthData}>
      {children}
    </DashboardLayout>
  )
}
