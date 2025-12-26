'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/lib/providers/auth-provider'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Sparkles,
  Images,
  Palette,
  Image as ImageIcon,
  Users,
  CreditCard,
  Settings,
  LogOut,
  User,
  ChevronRight,
  BarChart3,
  Library,
  Layers,
  Coins,
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
  const { user, profile, signOut, currentOrganization } = useAuth()

  // Hide sidebar when closed or when Create/Analytics mode is active (child sidebar takes over)
  if (!sidebarOpen || createModeActive || analyticsModeActive) return null

  const initials = profile?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?'
  const isAdmin = canManage()

  const filteredSettingsItems = settingsNavItems.filter(
    (item) => !item.adminOnly || isAdmin
  )

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-[100dvh] transition-all duration-500',
        'fixed top-0 left-0 z-40',
        'bg-background/80 backdrop-blur-2xl border-r border-white/10 shadow-2xl',
        sidebarCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Header: Logo */}
      <div className={cn("flex h-20 items-center justify-center transition-all", sidebarCollapsed ? "px-0" : "px-6 justify-between")}>
        <div className={cn("transition-transform duration-300 origin-center", sidebarCollapsed ? "scale-90" : "scale-100")}>
          <Logo showText={!sidebarCollapsed} size="sm" />
        </div>

        {!sidebarCollapsed && (
          <Button variant="ghost" size="icon" onClick={() => setSidebarCollapsed(true)}>
            <ChevronRight className="h-4 w-4 rotate-180 opacity-50" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 min-h-0 px-4 py-2">
        <nav className="flex flex-col gap-2">
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
              <div className="my-2" />
              {!sidebarCollapsed && (
                <span className="px-3 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-70">
                  System
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

      {/* Bottom User Dock */}
      <div className="p-3 mt-auto flex flex-col gap-2 items-center">

        {/* Credits Pill (Mini) */}
        {currentOrganization && (
          <div className={cn(
            "w-full flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-2",
            sidebarCollapsed ? "justify-center aspect-square p-0" : ""
          )}>
            <Coins className="h-4 w-4 text-amber-500 shrink-0" />
            {!sidebarCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-xs font-bold text-amber-600 dark:text-amber-500">{currentOrganization.credits_balance}</span>
                <span className="text-[9px] uppercase opacity-60">Credits</span>
              </div>
            )}
          </div>
        )}

        <div className="w-full h-px bg-border/10" />

        {/* User Profile & Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex items-center gap-3 w-full p-2 rounded-2xl transition-all hover:bg-muted/50 group outline-none",
              sidebarCollapsed ? "justify-center" : ""
            )}>
              <Avatar className="h-9 w-9 rounded-xl border border-white/10 shadow-sm transition-transform group-hover:scale-105">
                <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-[10px]">{initials}</AvatarFallback>
              </Avatar>

              {!sidebarCollapsed && (
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="text-sm font-bold truncate w-full text-left">{profile?.full_name || 'Creator'}</span>
                  <span className="text-[10px] text-muted-foreground truncate w-full text-left">{user?.email}</span>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-60 ml-4 rounded-2xl backdrop-blur-xl bg-background/90 p-2">
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-widest px-2 py-1.5">My Studio</DropdownMenuLabel>
            <DropdownMenuItem className="rounded-xl gap-3 p-2.5 cursor-pointer">
              <User className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl gap-3 p-2.5 cursor-pointer">
              <Settings className="h-4 w-4" /> Global Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl gap-3 p-2.5 cursor-pointer">
              <CreditCard className="h-4 w-4" /> Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="p-2 flex items-center justify-between">
              <span className="text-xs font-medium">Dark Mode</span>
              <ThemeToggle />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="rounded-xl gap-3 p-2.5 text-destructive focus:text-destructive cursor-pointer" onClick={() => signOut()}>
              <LogOut className="h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Collapsed Toggle (if mobile or alternative interaction needed) */}
        {sidebarCollapsed && (
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-30 hover:opacity-100" onClick={() => setSidebarCollapsed(false)}>
            <ChevronRight className="h-3 w-3" />
          </Button>
        )}
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
        'flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition-all duration-300 relative group',
        isActive
          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-bold'
          : 'hover:bg-muted text-muted-foreground hover:text-foreground',
        collapsed ? 'justify-center px-0 w-12 h-12 mx-auto' : ''
      )}
    >
      <item.icon className={cn(
        'h-5 w-5 shrink-0 transition-all',
        isActive ? 'scale-110' : 'group-hover:scale-110'
      )} />

      {!collapsed && (
        <span className="flex-1">{item.title}</span>
      )}

      {/* Active Indicator Dot for Collapsed Mode */}
      {isActive && collapsed && (
        <span className="absolute right-1 top-1 w-2 h-2 rounded-full bg-white ring-2 ring-primary" />
      )}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="font-bold ml-2">{item.title}</TooltipContent>
      </Tooltip>
    )
  }

  return content
}
