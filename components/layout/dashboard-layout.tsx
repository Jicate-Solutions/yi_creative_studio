'use client'

import { useLayoutEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Sidebar } from './sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RoleProvider } from '@/contexts/RoleContext'
import { SimulationBanner } from '@/components/rbac'
import { OfflineBanner } from '@/components/ui/offline-banner'
import ImpersonationBanner from '@/components/super-admin/ImpersonationBanner'
import { AnimatedBackground } from '@/components/ui/animated-background'
import { BottomNavbar } from '@/components/BottomNav'
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

      // CRITICAL: Check for SSO organization override in URL
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
      const ssoOrgId = params?.get('sso_org')
      const isSSOLogin = params?.get('sso_login') === 'true'

      // Batch all state updates together
      if (initialAuthData.profile) {
        setProfile(initialAuthData.profile)
      }
      if (initialAuthData.membership) {
        setMembership(initialAuthData.membership)
      }

      // CRITICAL: Override organization for SSO logins
      // This fixes the race condition where localStorage has stale org from pre-SSO
      let orgToSet = initialAuthData.currentOrganization
      if (ssoOrgId && initialAuthData.organizations) {
        const ssoOrg = initialAuthData.organizations.find((o) => o.id === ssoOrgId)
        if (ssoOrg) {
          orgToSet = ssoOrg
          console.log('[DashboardLayout] SSO org override:', {
            from: initialAuthData.currentOrganization?.name,
            to: ssoOrg.name,
            ssoOrgId
          })
        } else {
          console.warn('[DashboardLayout] SSO org not found in memberships:', ssoOrgId)
        }
      }

      if (orgToSet) {
        setCurrentOrganization(orgToSet)
      }
      if (initialAuthData.organizations) {
        setOrganizations(initialAuthData.organizations)
      }
      // Mark as server-hydrated FIRST to prevent auth-provider from fetching
      setServerHydrated(true)
      setLoading(false)

      // Clean up SSO parameters from URL after hydration (keep eventId)
      if (isSSOLogin && typeof window !== 'undefined') {
        const cleanParams = new URLSearchParams(window.location.search)
        cleanParams.delete('sso_login')
        cleanParams.delete('sso_org')
        const newUrl = window.location.pathname + (cleanParams.toString() ? '?' + cleanParams.toString() : '')
        window.history.replaceState({}, '', newUrl)
        console.log('[DashboardLayout] SSO URL params cleaned up')
      }

      console.log('[DashboardLayout] Server data hydrated - auth-provider will skip fetch')
    }
  }, [initialAuthData, setProfile, setMembership, setCurrentOrganization, setOrganizations, setLoading, setServerHydrated])

  return (
    <RoleProvider>
      <TooltipProvider>
        <div className={cn(
          "relative flex w-full text-foreground dark:text-white",
          createModeActive ? "h-screen overflow-hidden" : "min-h-screen"
        )}>
          {/* Animated Background - Only show when not in create mode */}
          {!createModeActive && <AnimatedBackground />}

          {/* Sidebar - Desktop */}
          <Sidebar />

          {/* Main Content Area */}
          <div className={cn(
            "flex flex-1 flex-col w-full",
            // Add margin for fixed sidebar on desktop (when not in create/analytics mode)
            !createModeActive && !analyticsModeActive && sidebarOpen && (sidebarCollapsed ? "md:ml-16" : "md:ml-64")
          )}>
            {/* Impersonation Banner (Super Admin) */}
            <ImpersonationBanner />

            {/* Role Simulation Banner */}
            <SimulationBanner />

            {/* Offline Detection Banner (E04) */}
            <OfflineBanner />



            {/* Page Content */}
            <main className={cn(
              'flex-1',
              createModeActive ? 'overflow-hidden' : 'overflow-x-hidden',
              !createModeActive && 'p-2 sm:p-3 md:p-3',
              // Add bottom padding for mobile navbar (64px navbar + safe area)
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

          {/* Mobile Bottom Navigation */}
          <BottomNavbar />
        </div>
      </TooltipProvider>
    </RoleProvider>
  )
}
