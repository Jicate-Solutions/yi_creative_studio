'use client'

import { cn } from '@/lib/utils'
import { ArrowLeft, BarChart3, Brain, Coins, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROUTES } from '@/lib/config/constants'

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

const analyticsNavItems: NavItem[] = [
  {
    title: 'Overview',
    href: ROUTES.analytics,
    icon: <BarChart3 className="h-4 w-4" />,
  },
  {
    title: 'Token Costs',
    href: ROUTES.analyticsCosts,
    icon: <Coins className="h-4 w-4" />,
  },
  {
    title: 'Feedback',
    href: ROUTES.analyticsFeedback,
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    title: 'Learning',
    href: ROUTES.analyticsLearning,
    icon: <Brain className="h-4 w-4" />,
  },
]

interface AnalyticsSidebarProps {
  className?: string
}

/**
 * Vertical sidebar navigation for Analytics pages
 * Based on CreateSidebar but simplified for page navigation (not wizard steps)
 */
export function AnalyticsSidebar({ className }: AnalyticsSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === ROUTES.analytics) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col w-64 h-screen',
        'fixed top-0 left-0 z-50',
        'glass-sidebar',
        className
      )}
    >
      {/* Header - Back to Dashboard */}
      <div className="flex h-16 items-center px-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
      </div>

      {/* Section Title */}
      <div className="px-4 py-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Analytics
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {analyticsNavItems.map((item) => {
            const active = isActive(item.href)

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200',
                    active && 'bg-primary/10 shadow-[var(--shadow-card-active)]',
                    !active && 'hover:bg-muted'
                  )}
                >
                  {/* Icon */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200',
                      active && 'gradient-yi text-white shadow-md',
                      !active && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {item.icon}
                  </div>

                  {/* Title */}
                  <span
                    className={cn(
                      'text-sm font-medium truncate',
                      active && 'text-primary',
                      !active && 'text-foreground/80'
                    )}
                  >
                    {item.title}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
