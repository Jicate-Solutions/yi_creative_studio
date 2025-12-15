'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from './sidebar'
import { TopNav } from './top-nav'
import { MobileNav } from './mobile-nav'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RoleProvider } from '@/contexts/RoleContext'
import { SimulationBanner } from '@/components/rbac'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { FloatingActionButton } from '@/components/ui/floating-action-button'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
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
  const { setProfile, setMembership, setCurrentOrganization, setOrganizations, setLoading, setServerHydrated } = useAuthStore()
  const { createModeActive, analyticsModeActive, sidebarOpen, sidebarCollapsed } = useUIStore()
  const hydrationDone = useRef(false)

  // CRITICAL: Hydrate auth store SYNCHRONOUSLY on first render to prevent
  // auth-provider from making duplicate API calls. useLayoutEffect runs
  // before useEffect, ensuring hydration happens before auth-provider checks.
  useLayoutEffect(() => {
    if (initialAuthData && !hydrationDone.current) {
      hydrationDone.current = true

      // Batch all state updates together
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
      // Mark as server-hydrated FIRST to prevent auth-provider from fetching
      setServerHydrated(true)
      setLoading(false)

      console.log('[DashboardLayout] Server data hydrated - auth-provider will skip fetch')
    }
  }, [initialAuthData, setProfile, setMembership, setCurrentOrganization, setOrganizations, setLoading, setServerHydrated])

  return (
    <RoleProvider>
      <TooltipProvider>
        <div className={cn(
          "relative flex",
          createModeActive ? "h-screen overflow-hidden" : "min-h-screen"
        )}>
          {/* Sidebar - Desktop */}
          <Sidebar />

          {/* Mobile Navigation */}
          <MobileNav />

          {/* Main Content Area */}
          <div className={cn(
            "flex flex-1 flex-col",
            // Add margin for fixed sidebar on desktop (when not in create/analytics mode)
            !createModeActive && !analyticsModeActive && sidebarOpen && (sidebarCollapsed ? "md:ml-16" : "md:ml-64")
          )}>
            {/* Role Simulation Banner */}
            <SimulationBanner />

            {/* Offline Detection Banner (E04) */}
            <OfflineBanner />

            {/* Top Navigation */}
            <TopNav />

            {/* Page Content */}
            <main className={cn(
              'flex-1',
              createModeActive ? 'overflow-hidden' : 'overflow-x-hidden',
              !createModeActive && 'p-3 sm:p-4 md:p-6',
              // Add padding for mobile bottom navigation (not in create mode)
              !createModeActive && 'pb-20 md:pb-6',
              className
            )}>
              {children}
            </main>

            {/* Application Footer - Hidden in create mode for cleaner workspace */}
            {!createModeActive && (
              <footer className="hidden md:flex items-center justify-center py-3 bg-muted/20">
                <p className="text-[11px] text-muted-foreground/70">
                  Developed by <span className="font-medium text-muted-foreground">Roja</span> • Powered by{" "}
                  <span className="font-medium text-muted-foreground">JICATE Solutions Private Limited</span>
                </p>
              </footer>
            )}
          </div>

          {/* Floating Action Button */}
          <FloatingActionButton />
        </div>
      </TooltipProvider>
    </RoleProvider>
  )
}
