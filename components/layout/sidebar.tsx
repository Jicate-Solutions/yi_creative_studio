'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  LayoutDashboard,
  Sparkles,
  Images,
  Palette,
  Image as ImageIcon,
  Users,
  CreditCard,
  HelpCircle,
  ChevronLeft,
  BarChart3,
  Library,
  Layers,
} from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  adminOnly?: boolean
}

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: ROUTES.dashboard,
    icon: LayoutDashboard,
  },
  {
    title: 'Create',
    href: ROUTES.create,
    icon: Sparkles,
  },
  {
    title: 'Bulk Generate',
    href: ROUTES.bulk,
    icon: Layers,
  },
  {
    title: 'Gallery',
    href: ROUTES.gallery,
    icon: Images,
  },
  {
    title: 'Templates',
    href: ROUTES.templates,
    icon: Library,
  },
]

const settingsNavItems: NavItem[] = [
  {
    title: 'Brand Config',
    href: ROUTES.brandConfig,
    icon: Palette,
    adminOnly: true,
  },
  {
    title: 'Logo Management',
    href: ROUTES.logoManagement,
    icon: ImageIcon,
    adminOnly: true,
  },
  {
    title: 'Analytics',
    href: ROUTES.analytics,
    icon: BarChart3,
    adminOnly: true,
  },
  {
    title: 'Team',
    href: ROUTES.team,
    icon: Users,
    adminOnly: true,
  },
  {
    title: 'Billing',
    href: ROUTES.billing,
    icon: CreditCard,
    adminOnly: true,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, sidebarCollapsed, setSidebarCollapsed, createModeActive, analyticsModeActive } = useUIStore()
  const { canManage } = useAuthStore()

  const isAdmin = canManage()

  const filteredSettingsItems = settingsNavItems.filter(
    (item) => !item.adminOnly || isAdmin
  )

  // Hide sidebar when closed or when Create/Analytics mode is active (child sidebar takes over)
  if (!sidebarOpen || createModeActive || analyticsModeActive) return null

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen shadow-sm transition-all duration-300',
        'fixed top-0 left-0 z-40',
        'glass-sidebar',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center px-4">
        <Logo showText={!sidebarCollapsed} size="sm" />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'ml-auto h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-200',
            sidebarCollapsed && 'rotate-180'
          )}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-2">
        <nav className="flex flex-col gap-1">
          {/* Main Nav */}
          {mainNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              collapsed={sidebarCollapsed}
            />
          ))}

          {/* Settings Section */}
          {filteredSettingsItems.length > 0 && (
            <>
              {/* Spacer instead of divider line */}
              <div className="my-4" />
              {!sidebarCollapsed && (
                <span className="px-3 text-xs font-semibold text-sidebar-muted uppercase tracking-wider mb-2">
                  Settings
                </span>
              )}
              {filteredSettingsItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  collapsed={sidebarCollapsed}
                />
              ))}
            </>
          )}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 mt-auto">
        <NavLink
          item={{
            title: 'Help & Support',
            href: '#',
            icon: HelpCircle,
          }}
          isActive={false}
          collapsed={sidebarCollapsed}
        />
      </div>
    </aside>
  )
}

interface NavLinkProps {
  item: NavItem
  isActive: boolean
  collapsed: boolean
}

function NavLink({ item, isActive, collapsed }: NavLinkProps) {
  const content = (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-2',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm'
          : 'text-sidebar-foreground/70',
        collapsed && 'justify-center px-2'
      )}
    >
      <item.icon className={cn(
        'h-5 w-5 shrink-0 transition-colors',
        isActive ? 'text-sidebar-primary' : 'text-sidebar-muted'
      )} />
      {!collapsed && (
        <>
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <span className="rounded-full bg-sidebar-primary/20 text-sidebar-primary px-2 py-0.5 text-xs font-medium">
              {item.badge}
            </span>
          )}
        </>
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    )
  }

  return content
}
