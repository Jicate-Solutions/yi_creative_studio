'use client'

/**
 * Super Admin Navigation Sidebar
 * Main navigation menu for Super Admin portal
 */

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
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
    name: 'Audit Logs',
    href: '/super-admin/audit',
    icon: FileText,
  },
  {
    name: 'Settings',
    href: '/super-admin/settings',
    icon: Settings,
  },
  // Platform-wide views
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

export default function SuperAdminNav() {
  const pathname = usePathname()

  return (
    <nav className="w-64 border-r border-gray-200 bg-white px-4 py-6 space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || (item.href !== '/super-admin' && pathname?.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
              isActive
                ? 'bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <Icon className="h-5 w-5" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
