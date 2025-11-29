import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardLayout } from '@/components/layout'
import { ROUTES } from '@/lib/config/constants'

// Force dynamic rendering for authenticated routes
export const dynamic = 'force-dynamic'

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(ROUTES.login)
  }

  // Fetch full membership data with organization details
  const { data: memberships } = await supabase
    .from('organization_members')
    .select(`
      *,
      organizations (*)
    `)
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) {
    redirect('/onboarding')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

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
