'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Breadcrumbs, type BreadcrumbItem } from '@/components/ui/breadcrumbs'
import { PageHeader } from '@/components/ui/page-header'
import {
  Palette,
  Image,
  Users,
  CreditCard,
  BarChart3,
  Brain,
  Settings,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'

interface SettingsNavItem {
  label: string
  href: string
  icon: LucideIcon
  description?: string
  children?: Omit<SettingsNavItem, 'children'>[]
}

const SETTINGS_NAV: SettingsNavItem[] = [
  {
    label: 'Brand',
    href: '/settings/brand',
    icon: Palette,
    description: 'Colors, fonts, and brand identity',
  },
  {
    label: 'Logos',
    href: '/settings/logos',
    icon: Image,
    description: 'Manage your organization logos',
  },
  {
    label: 'Team',
    href: '/settings/team',
    icon: Users,
    description: 'Members and permissions',
  },
  {
    label: 'Billing',
    href: '/settings/billing',
    icon: CreditCard,
    description: 'Plans and payment',
  },
  {
    label: 'Analytics',
    href: '/settings/analytics',
    icon: BarChart3,
    description: 'Usage and insights',
    children: [
      {
        label: 'Overview',
        href: '/settings/analytics',
        icon: BarChart3,
      },
      {
        label: 'Costs',
        href: '/settings/analytics/costs',
        icon: CreditCard,
      },
      {
        label: 'Feedback',
        href: '/settings/analytics/feedback',
        icon: Users,
      },
      {
        label: 'Learning',
        href: '/settings/analytics/learning',
        icon: Brain,
      },
    ],
  },
  {
    label: 'Knowledge',
    href: '/settings/knowledge-patches',
    icon: Brain,
    description: 'AI learning and patches',
  },
]

interface SettingsLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function SettingsLayout({
  children,
  title,
  description,
  actions,
}: SettingsLayoutProps) {
  const pathname = usePathname()

  // Build breadcrumbs from pathname
  const breadcrumbs: BreadcrumbItem[] = React.useMemo(() => {
    const items: BreadcrumbItem[] = [
      { label: 'Settings', href: '/settings/brand' },
    ]

    // Find current nav item
    const segments = pathname.split('/').filter(Boolean)

    // Skip 'settings' segment
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i]
      const navItem = SETTINGS_NAV.find(
        (item) =>
          item.href.includes(segment) ||
          item.children?.some((child) => child.href.includes(segment))
      )

      if (navItem) {
        // Check if it's a child item
        const childItem = navItem.children?.find((child) =>
          child.href.includes(segment)
        )

        if (childItem) {
          items.push({ label: navItem.label, href: navItem.href })
          items.push({ label: childItem.label })
        } else {
          items.push({ label: navItem.label })
        }
      }
    }

    return items
  }, [pathname])

  // Find current nav item for title
  const currentItem = React.useMemo(() => {
    for (const item of SETTINGS_NAV) {
      if (pathname === item.href) return item
      if (item.children) {
        const child = item.children.find((c) => pathname === c.href)
        if (child) return child
      }
    }
    return null
  }, [pathname])

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 min-h-full">
      {/* Sidebar Navigation */}
      <aside className="lg:w-64 shrink-0">
        <nav className="glass-elevated p-4 rounded-2xl sticky top-4">
          <div className="flex items-center gap-2 px-3 py-2 mb-4">
            <Settings className="h-5 w-5 text-muted-foreground" />
            <span className="font-semibold">Settings</span>
          </div>

          <ul className="space-y-1">
            {SETTINGS_NAV.map((item) => (
              <SettingsNavLink
                key={item.href}
                item={item}
                pathname={pathname}
              />
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        {/* Header */}
        <PageHeader
          title={title || currentItem?.label || 'Settings'}
          description={description || currentItem?.description}
          breadcrumbs={breadcrumbs}
          actions={actions}
        />

        {/* Content */}
        <div className="mt-6">{children}</div>
      </main>
    </div>
  )
}

interface SettingsNavLinkProps {
  item: SettingsNavItem
  pathname: string
}

function SettingsNavLink({ item, pathname }: SettingsNavLinkProps) {
  const Icon = item.icon
  const isActive =
    pathname === item.href ||
    (item.children && item.children.some((c) => pathname === c.href))
  const hasChildren = item.children && item.children.length > 0
  const [isOpen, setIsOpen] = React.useState(isActive)

  return (
    <li>
      <Link
        href={item.href}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault()
            setIsOpen(!isOpen)
          }
        }}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
          'transition-all duration-quick',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1">{item.label}</span>
        {hasChildren && (
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform duration-quick',
              isOpen && 'rotate-90'
            )}
          />
        )}
      </Link>

      {/* Children */}
      {hasChildren && isOpen && (
        <ul className="ml-6 mt-1 space-y-1 border-l border-border/50 pl-3">
          {item.children?.map((child) => {
            const ChildIcon = child.icon
            const isChildActive = pathname === child.href

            return (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm',
                    'transition-all duration-quick',
                    isChildActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                >
                  <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{child.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </li>
  )
}

export { SETTINGS_NAV }
