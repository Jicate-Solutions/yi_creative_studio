'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
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
  Settings,
  HelpCircle,
  ChevronLeft,
  Plus,
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
  const { sidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useUIStore()
  const { canManage } = useAuthStore()

  const isAdmin = canManage()

  const filteredSettingsItems = settingsNavItems.filter(
    (item) => !item.adminOnly || isAdmin
  )

  if (!sidebarOpen) return null

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-sidebar transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center border-b px-4">
        <Logo showText={!sidebarCollapsed} size="sm" />
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'ml-auto h-8 w-8',
            sidebarCollapsed && 'rotate-180'
          )}
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Create Button */}
      <div className="p-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              className={cn(
                'w-full gap-2 gradient-yi hover:opacity-90',
                sidebarCollapsed && 'px-2'
              )}
            >
              <Link href={ROUTES.create}>
                <Plus className="h-4 w-4" />
                {!sidebarCollapsed && <span>Create New</span>}
              </Link>
            </Button>
          </TooltipTrigger>
          {sidebarCollapsed && (
            <TooltipContent side="right">Create New</TooltipContent>
          )}
        </Tooltip>
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
              <Separator className="my-4" />
              {!sidebarCollapsed && (
                <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
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
      <div className="border-t p-4">
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
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
          : 'text-sidebar-foreground',
        collapsed && 'justify-center px-2'
      )}
    >
      <item.icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
      {!collapsed && (
        <>
          <span className="flex-1">{item.title}</span>
          {item.badge && (
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
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
