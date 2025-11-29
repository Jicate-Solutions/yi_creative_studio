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
  Palette,
  Image as ImageIcon,
  Users,
  CreditCard,
  X,
  Plus,
} from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const mainNavItems: NavItem[] = [
  { title: 'Dashboard', href: ROUTES.dashboard, icon: LayoutDashboard },
  { title: 'Create', href: ROUTES.create, icon: Sparkles },
  { title: 'Gallery', href: ROUTES.gallery, icon: Images },
]

const settingsNavItems: NavItem[] = [
  { title: 'Brand Config', href: ROUTES.brandConfig, icon: Palette, adminOnly: true },
  { title: 'Logo Management', href: ROUTES.logoManagement, icon: ImageIcon, adminOnly: true },
  { title: 'Team', href: ROUTES.team, icon: Users, adminOnly: true },
  { title: 'Billing', href: ROUTES.billing, icon: CreditCard, adminOnly: true },
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

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="flex flex-row items-center justify-between border-b p-4">
          <Logo size="sm" />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileNavOpen(false)}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close menu</span>
          </Button>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-4rem)]">
          <div className="flex flex-col p-4 gap-2">
            {/* Create Button */}
            <Button
              asChild
              className="w-full gap-2 gradient-yi hover:opacity-90 mb-4"
              onClick={handleNavClick}
            >
              <Link href={ROUTES.create}>
                <Plus className="h-4 w-4" />
                <span>Create New</span>
              </Link>
            </Button>

            {/* Main Navigation */}
            {mainNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  pathname === item.href
                    ? 'bg-accent text-accent-foreground font-medium'
                    : 'text-foreground'
                )}
              >
                <item.icon className={cn(
                  'h-5 w-5',
                  pathname === item.href && 'text-primary'
                )} />
                <span>{item.title}</span>
              </Link>
            ))}

            {/* Settings Section */}
            {filteredSettingsItems.length > 0 && (
              <>
                <Separator className="my-4" />
                <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                  Settings
                </span>
                {filteredSettingsItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors',
                      'hover:bg-accent hover:text-accent-foreground',
                      pathname === item.href
                        ? 'bg-accent text-accent-foreground font-medium'
                        : 'text-foreground'
                    )}
                  >
                    <item.icon className={cn(
                      'h-5 w-5',
                      pathname === item.href && 'text-primary'
                    )} />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
