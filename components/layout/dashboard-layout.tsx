'use client'

import { cn } from '@/lib/utils'
import { Sidebar } from './sidebar'
import { TopNav } from './top-nav'
import { MobileNav } from './mobile-nav'
import { TooltipProvider } from '@/components/ui/tooltip'
import { RoleProvider } from '@/contexts/RoleContext'
import { SimulationBanner } from '@/components/rbac'

interface DashboardLayoutProps {
  children: React.ReactNode
  className?: string
}

export function DashboardLayout({ children, className }: DashboardLayoutProps) {
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
