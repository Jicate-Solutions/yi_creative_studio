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

  // Check if user has an organization
  const { data: memberships } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1)

  if (!memberships || memberships.length === 0) {
    redirect('/onboarding')
  }

  return <DashboardLayout>{children}</DashboardLayout>
}
