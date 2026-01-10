/**
 * Super Admin Layout
 * Protected layout for Super Admin portal
 * Includes navigation sidebar and header
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SuperAdminHeader from '@/components/super-admin/SuperAdminHeader'
import SuperAdminNav from '@/components/super-admin/SuperAdminNav'

export const metadata = {
  title: 'Super Admin Portal | Yi CreativeStudio',
  description: 'Platform administration dashboard for Yi CreativeStudio',
}

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  // Check authentication
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/auth/login?redirect=/super-admin')
  }

  // Check Super Admin flag using secure database function
  const { data: isSuperAdminData, error: superAdminError } = await supabase
    .rpc('is_current_user_super_admin')

  if (superAdminError) {
    console.error('Error checking Super Admin status:', superAdminError)
    redirect('/dashboard')
  }

  const isSuperAdmin = isSuperAdminData === true

  if (!isSuperAdmin) {
    // Redirect non-super-admins to regular dashboard
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Super Admin Header */}
      <SuperAdminHeader user={user} />

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar Navigation */}
        <SuperAdminNav />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
