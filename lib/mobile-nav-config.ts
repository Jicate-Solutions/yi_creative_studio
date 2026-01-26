import { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Sparkles,
  Images,
  Library,
  Layers,
  Palette,
  Image as ImageIcon,
  Users,
  CreditCard,
  BarChart3,
  Coins,
  Settings,
} from 'lucide-react'
import { ROUTES } from '@/lib/config/constants'

export interface MobileNavItem {
  href: string
  label: string
  icon: LucideIcon
  adminOnly?: boolean
  superAdminOnly?: boolean
}

export interface MobileNavGroup {
  id: string
  groupLabel: string
  icon: LucideIcon
  menus: MobileNavItem[]
}

/**
 * Mobile navigation configuration for Yi CreativeStudio
 * Returns navigation groups based on user role
 */
export function getMobileNavConfig(
  isAdmin: boolean,
  isSuperAdmin: boolean
): MobileNavGroup[] {
  const groups: MobileNavGroup[] = [
    // Primary navigation (first 4 groups show in bottom bar)
    {
      id: 'dashboard',
      groupLabel: 'Home',
      icon: LayoutDashboard,
      menus: [
        {
          href: ROUTES.dashboard,
          label: 'Dashboard',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      id: 'create',
      groupLabel: 'Create',
      icon: Sparkles,
      menus: [
        {
          href: ROUTES.create,
          label: 'Create',
          icon: Sparkles,
        },
        {
          href: ROUTES.bulk,
          label: 'Bulk Generate',
          icon: Layers,
        },
      ],
    },
    {
      id: 'gallery',
      groupLabel: 'Gallery',
      icon: Images,
      menus: [
        {
          href: ROUTES.gallery,
          label: 'Gallery',
          icon: Images,
        },
      ],
    },
    {
      id: 'templates',
      groupLabel: 'Templates',
      icon: Library,
      menus: [
        {
          href: ROUTES.templates,
          label: 'Templates',
          icon: Library,
        },
      ],
    },
  ]

  // Admin-only settings group (appears in More menu)
  if (isAdmin) {
    const settingsMenus: MobileNavItem[] = [
      {
        href: ROUTES.brandConfig,
        label: 'Brand Config',
        icon: Palette,
        adminOnly: true,
      },
      {
        href: ROUTES.logoManagement,
        label: 'Logo Management',
        icon: ImageIcon,
        adminOnly: true,
      },
      {
        href: ROUTES.analytics,
        label: 'Analytics',
        icon: BarChart3,
        adminOnly: true,
      },
      {
        href: ROUTES.team,
        label: 'Team',
        icon: Users,
        adminOnly: true,
      },
      {
        href: ROUTES.billing,
        label: 'Billing',
        icon: CreditCard,
        adminOnly: true,
      },
    ]

    // Add super admin credits if applicable
    if (isSuperAdmin) {
      settingsMenus.push({
        href: ROUTES.adminCredits,
        label: 'Admin Credits',
        icon: Coins,
        superAdminOnly: true,
      })
    }

    groups.push({
      id: 'settings',
      groupLabel: 'Settings',
      icon: Settings,
      menus: settingsMenus,
    })
  }

  return groups
}

/**
 * Icon mapping for menu groups (used by More menu)
 */
export const GROUP_ICONS: Record<string, LucideIcon> = {
  'Home': LayoutDashboard,
  'Create': Sparkles,
  'Gallery': Images,
  'Templates': Library,
  'Settings': Settings,
}
