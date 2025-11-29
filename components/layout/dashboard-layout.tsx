'use client'

import { useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from './sidebar'
import { TopNav } from './top-nav'
import { MobileNav } from './mobile-nav'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RoleProvider } from '@/contexts/RoleContext'
import { SimulationBanner } from '@/components/rbac'
import { useAuthStore } from '@/stores/auth-store'
import type { UserProfile, Organization, OrganizationMember } from '@/types/database.types'

interface InitialAuthData {
  profile: UserProfile | null
  membership: OrganizationMember | null
  currentOrganization: Organization | null
  organizations: Organization[]
}

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
  initialAuthData?: InitialAuthData
}

export function DashboardLayout({ children, className, initialAuthData }: DashboardLayoutProps) {
  const { setProfile, setMembership, setCurrentOrganization, setOrganizations } = useAuthStore()

  // Hydrate auth store with server-fetched data
  useEffect(() => {
    if (initialAuthData) {
      if (initialAuthData.profile) {
        setProfile(initialAuthData.profile)
      }
      if (initialAuthData.membership) {
        setMembership(initialAuthData.membership)
      }
      if (initialAuthData.currentOrganization) {
        setCurrentOrganization(initialAuthData.currentOrganization)
      }
      if (initialAuthData.organizations) {
        setOrganizations(initialAuthData.organizations)
      }
    }
  }, [initialAuthData, setProfile, setMembership, setCurrentOrganization, setOrganizations])

  return (
    <RoleProvider>
      <TooltipProvider>
        <div className="relative flex min-h-screen">
          {/* Sidebar - Desktop */}
          <Sidebar />

          {/* Mobile Navigation */}
          <MobileNav />

          {/* Main Content Area */}
          <div className="flex flex-1 flex-col">
            {/* Role Simulation Banner */}
            <SimulationBanner />

            {/* Top Navigation */}
            <TopNav />

            {/* Page Content */}
            <main className={cn('flex-1 p-4 md:p-6', className)}>
              {children}
            </main>
          </div>
        </div>
      </TooltipProvider>
    </RoleProvider>
  )
}
