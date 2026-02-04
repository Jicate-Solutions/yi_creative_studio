'use client'

/**
 * Super Admin Navigation Sidebar
 * Main navigation menu for Super Admin portal
 * Responsive: desktop sidebar + mobile drawer
 */

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  FileText,
  Settings,
  Coins,
  BarChart3,
  UserCog,
  DollarSign,
  Crown,
  Menu,
  Webhook,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

const navItems = [
  {
    name: 'Dashboard',
    href: '/super-admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Organizations',
    href: '/super-admin/organizations',
    icon: Building2,
  },
  {
    name: 'Users',
    href: '/super-admin/users',
    icon: Users,
  },
  {
    name: 'Credits',
    href: '/super-admin/credits',
    icon: CreditCard,
  },
  {
    name: 'Subscriptions',
    href: '/super-admin/subscriptions',
    icon: Crown,
  },
  {
    name: 'Audit Logs',
    href: '/super-admin/audit',
    icon: FileText,
  },
  {
    name: 'Webhooks',
    href: '/super-admin/webhooks',
    icon: Webhook,
  },
  {
    name: 'Settings',
    href: '/super-admin/settings',
    icon: Settings,
  },
  // Platform-wide views (separator)
  {
    name: 'Platform Credits',
    href: '/super-admin/credits-platform',
    icon: Coins,
  },
  {
    name: 'Platform Analytics',
    href: '/super-admin/analytics',
    icon: BarChart3,
  },
  {
    name: 'Platform Teams',
    href: '/super-admin/teams',
    icon: UserCog,
  },
  {
    name: 'Platform Billing',
    href: '/super-admin/billing',
    icon: DollarSign,
  },
]

function NavLink({
  item,
  isActive,
  onClick,
}: {
  item: (typeof navItems)[number]
  isActive: boolean
  onClick?: () => void
}) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
        isActive
          ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700'
          : 'text-gray-700 hover:bg-gray-100'
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <span className="truncate">{item.name}</span>
    </Link>
  )
}

export default function SuperAdminNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isItemActive = (href: string) =>
    pathname === href || (href !== '/super-admin' && pathname?.startsWith(href))

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile/tablet */}
      <nav className="hidden lg:block w-64 border-r border-gray-200 bg-white px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            isActive={isItemActive(item.href)}
          />
        ))}
      </nav>

      {/* Mobile Menu Button - Visible only on mobile/tablet */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="px-4 py-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SA</span>
                </div>
                Super Admin
              </SheetTitle>
            </SheetHeader>
            <nav className="px-4 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-120px)]">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  isActive={isItemActive(item.href)}
                  onClick={() => setOpen(false)}
                />
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
