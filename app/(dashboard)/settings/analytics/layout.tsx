'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AnalyticsSidebar } from '@/components/analytics/analytics-sidebar'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/lib/config/constants'
import { useUIStore } from '@/stores/ui-store'
import { BarChart3, Coins, MessageSquare } from 'lucide-react'

export type TimeRange = '7d' | '30d' | '90d' | 'all'

interface AnalyticsLayoutProps {
  children: React.ReactNode
}

// Get current page info for mobile header
function getPageInfo(pathname: string) {
  if (pathname === ROUTES.analytics) {
    return { title: 'Overview', icon: <BarChart3 className="h-4 w-4" /> }
  }
  if (pathname.includes('/costs')) {
    return { title: 'Token Costs', icon: <Coins className="h-4 w-4" /> }
  }
  if (pathname.includes('/feedback')) {
    return { title: 'Feedback', icon: <MessageSquare className="h-4 w-4" /> }
  }
  return { title: 'Analytics', icon: <BarChart3 className="h-4 w-4" /> }
}

export default function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  const pathname = usePathname()
  const { title: pageTitle, icon: pageIcon } = getPageInfo(pathname)
  const { enterAnalyticsMode, exitAnalyticsMode } = useUIStore()

  // Enter analytics mode on mount (hides parent sidebar, shows analytics sidebar)
  useEffect(() => {
    enterAnalyticsMode()
    return () => exitAnalyticsMode()
  }, [enterAnalyticsMode, exitAnalyticsMode])

  return (
    <div className="flex min-h-screen">
      {/* Analytics Sidebar - Desktop only */}
      <AnalyticsSidebar />

      {/* Main Content Area */}
      <div className={cn('flex-1 flex flex-col min-w-0', 'md:ml-64')}>
        {/* Mobile Header - Shows current page */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b md:hidden">
          <div className="px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                {pageIcon}
              </div>
              <div>
                <p className="text-sm font-medium">{pageTitle}</p>
                <p className="text-xs text-muted-foreground">Analytics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 py-6 px-6">
          <div className="space-y-6">
            {/* Page Header - Hidden on mobile since we have the mobile header */}
            <div className="hidden md:flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Usage Analytics</h1>
                <p className="text-muted-foreground">
                  Track your creative generation, costs, and feedback
                </p>
              </div>
            </div>

            {/* Page Content */}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
