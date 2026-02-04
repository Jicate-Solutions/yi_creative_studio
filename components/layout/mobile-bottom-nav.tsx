'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/auth-store'
import { useAuth } from '@/lib/providers/auth-provider'
import { useUIStore } from '@/stores/ui-store'
import { useIsMobile } from '@/hooks/use-mobile'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/ui/theme-toggle'
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
  BarChart3,
  Library,
  Layers,
  Coins,
  MoreHorizontal,
  ChevronRight,
} from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
  superAdminOnly?: boolean
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: ROUTES.dashboard, icon: LayoutDashboard },
  { title: 'Create', href: ROUTES.create, icon: Sparkles },
  { title: 'Gallery', href: ROUTES.gallery, icon: Images },
  { title: 'Templates', href: ROUTES.templates, icon: Library },
]

const moreNavItems: NavItem[] = [
  { title: 'Bulk Generate', href: ROUTES.bulk, icon: Layers },
  { title: 'Brand Config', href: ROUTES.brandConfig, icon: Palette, adminOnly: true },
  { title: 'Logo Management', href: ROUTES.logoManagement, icon: ImageIcon, adminOnly: true },
  { title: 'Analytics', href: ROUTES.analytics, icon: BarChart3, adminOnly: true },
  { title: 'Team', href: ROUTES.team, icon: Users, adminOnly: true },
  { title: 'Billing', href: ROUTES.billing, icon: CreditCard, adminOnly: true },
  { title: 'Admin Credits', href: ROUTES.adminCredits, icon: Coins, superAdminOnly: true },
]

export function MobileBottomNav() {
  const pathname = usePathname()
  const isMobile = useIsMobile()
  const { canManage, checkSuperAdmin } = useAuthStore()
  const { user, profile, signOut } = useAuth()
  const { createModeActive, analyticsModeActive } = useUIStore()

  const [mounted, setMounted] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render during SSR or on desktop
  if (!mounted || !isMobile) return null

  // Hide when in Create/Analytics mode (child nav takes over)
  if (createModeActive || analyticsModeActive) return null

  const isAdmin = canManage()
  const isSuperAdmin = checkSuperAdmin()
  const initials = profile?.full_name?.split(' ').map((n) => n[0]).join('').toUpperCase() || '?'

  // Filter more items based on role
  const filteredMoreItems = moreNavItems.filter((item) => {
    if (item.superAdminOnly) return isSuperAdmin
    if (item.adminOnly) return isAdmin
    return true
  })

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:hidden',
          'bg-background/95 backdrop-blur-xl border-t',
          'shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]'
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around py-2">
          {/* Main 4 nav items */}
          {mainNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]',
                isActive(item.href)
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive(item.href) && 'scale-110')} />
              <span className="text-[10px] font-medium">{item.title}</span>
              {isActive(item.href) && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute bottom-1 w-6 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          ))}

          {/* More button */}
          <button
            onClick={() => setMoreMenuOpen(true)}
            className={cn(
              'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]',
              moreMenuOpen
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <div className="relative">
              <MoreHorizontal className="h-5 w-5" />
              {filteredMoreItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[8px] font-bold rounded-full flex items-center justify-center">
                  {filteredMoreItems.length}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More Menu Sheet */}
      <Sheet open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl px-0">
          <SheetHeader className="px-4 pb-4 border-b">
            <SheetTitle className="text-left">All Menus</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            {/* Navigation Grid */}
            <div className="px-4 mb-6">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Navigation
              </p>
              <div className="grid grid-cols-3 gap-3">
                {filteredMoreItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMoreMenuOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl transition-all',
                      'border hover:border-primary/30 hover:bg-muted/50',
                      isActive(item.href) && 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    )}
                  >
                    <div className={cn(
                      'p-2 rounded-lg',
                      isActive(item.href) ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-medium text-center line-clamp-2">
                      {item.title}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* User Section */}
            <div className="px-4 border-t pt-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Account
              </p>

              {/* User Info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 mb-3">
                <Avatar className="h-10 w-10 rounded-xl border shadow-sm">
                  <AvatarImage src={profile?.avatar_url || undefined} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{profile?.full_name || 'Creator'}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
              </div>

              {/* Account Actions */}
              <div className="space-y-1">
                <button
                  onClick={() => setMoreMenuOpen(false)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Profile</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </button>

                <button
                  onClick={() => setMoreMenuOpen(false)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors"
                >
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">Settings</span>
                  <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </button>

                <div className="flex items-center justify-between p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5" /> {/* Spacer for alignment */}
                    <span className="text-sm">Dark Mode</span>
                  </div>
                  <ThemeToggle />
                </div>

                <button
                  onClick={() => {
                    setMoreMenuOpen(false)
                    signOut()
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
