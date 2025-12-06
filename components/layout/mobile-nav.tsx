'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useUIStore } from '@/stores/ui-store'
import { useAuthStore } from '@/stores/auth-store'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import {
  LayoutDashboard,
  Sparkles,
  Images,
  Library,
  Palette,
  Image as ImageIcon,
  Users,
  CreditCard,
  X,
  Plus,
  MoreHorizontal,
  Settings,
  BarChart3,
} from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

// Bottom nav items (always visible)
const bottomNavItems: NavItem[] = [
  { title: 'Home', href: ROUTES.dashboard, icon: LayoutDashboard },
  { title: 'Create', href: ROUTES.create, icon: Sparkles },
  { title: 'Gallery', href: ROUTES.gallery, icon: Images },
  { title: 'Templates', href: ROUTES.templates, icon: Library },
]

// Settings items (in "More" sheet)
const settingsNavItems: NavItem[] = [
  { title: 'Brand Config', href: ROUTES.brandConfig, icon: Palette, adminOnly: true },
  { title: 'Logo Management', href: ROUTES.logoManagement, icon: ImageIcon, adminOnly: true },
  { title: 'Team', href: ROUTES.team, icon: Users, adminOnly: true },
  { title: 'Billing', href: ROUTES.billing, icon: CreditCard, adminOnly: true },
  { title: 'Analytics', href: ROUTES.analytics, icon: BarChart3, adminOnly: true },
]

export function MobileNav() {
  const pathname = usePathname()
  const { mobileNavOpen, setMobileNavOpen } = useUIStore()
  const { canManage } = useAuthStore()

  const isAdmin = canManage()
  const filteredSettingsItems = settingsNavItems.filter(
    (item) => !item.adminOnly || isAdmin
  )

  const handleNavClick = () => {
    setMobileNavOpen(false)
  }

  // Check if current path matches a nav item (including nested routes)
  const isActive = (href: string) => {
    if (href === ROUTES.dashboard) {
      return pathname === href
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Check if any settings item is active
  const isSettingsActive = settingsNavItems.some(item => isActive(item.href))

  return (
    <>
      {/* ========================================
          FIXED BOTTOM NAVIGATION BAR
          ======================================== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-mobile-nav overflow-x-hidden">
        <div className="flex items-center justify-around h-14 pb-[env(safe-area-inset-bottom,0px)] px-1">
          {bottomNavItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 pt-1",
                  "transition-colors duration-200",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {/* Active indicator bar */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
                <item.icon className={cn("h-5 w-5", active && "text-primary")} />
                <span className="text-[10px] font-medium leading-tight">{item.title}</span>
              </Link>
            )
          })}

          {/* More Button - Opens Sheet */}
          <button
            onClick={() => setMobileNavOpen(true)}
            className={cn(
              "relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 pt-1",
              "transition-colors duration-200",
              isSettingsActive || mobileNavOpen
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {isSettingsActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
            )}
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-tight">More</span>
          </button>
        </div>
      </nav>

      {/* ========================================
          MORE SHEET (Settings & Additional Items)
          ======================================== */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl p-0">
          {/* Handle bar indicator */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
          </div>

          <SheetHeader className="flex flex-row items-center justify-between px-4 pb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <span className="font-semibold">Settings & More</span>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setMobileNavOpen(false)}
            >
              <X className="h-5 w-5" />
              <span className="sr-only">Close menu</span>
            </Button>
          </SheetHeader>

          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col p-4 gap-2">
              {/* Quick Create Button */}
              <Button
                asChild
                className="w-full gap-2 gradient-yi hover:opacity-90 mb-4 h-12"
                onClick={handleNavClick}
              >
                <Link href={ROUTES.create}>
                  <Plus className="h-5 w-5" />
                  <span className="font-medium">Create New Design</span>
                </Link>
              </Button>

              {/* Settings Section */}
              {filteredSettingsItems.length > 0 && (
                <>
                  <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                    Settings
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {filteredSettingsItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleNavClick}
                        className={cn(
                          'flex flex-col items-center gap-2 rounded-xl p-4 text-sm transition-all',
                          'hover:bg-accent hover:text-accent-foreground',
                          'shadow-[var(--shadow-card)]',
                          isActive(item.href)
                            ? 'bg-primary/10 shadow-[var(--shadow-card-active)] text-primary'
                            : 'text-foreground'
                        )}
                      >
                        <item.icon className={cn(
                          'h-6 w-6',
                          isActive(item.href) && 'text-primary'
                        )} />
                        <span className="text-xs font-medium text-center">{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              <Separator className="my-4" />

              {/* App Info */}
              <div className="flex items-center justify-center gap-2 py-2">
                <Logo size="sm" />
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  )
}
