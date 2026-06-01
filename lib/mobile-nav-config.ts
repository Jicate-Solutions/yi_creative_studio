import { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  PenTool,
  Images,
  Library,
  Palette,
  Image as ImageIcon,
  Users,
  CreditCard,
  BarChart3,
  Coins,
  Settings,
  CalendarDays,
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
      id: 'designer',
      groupLabel: 'Designer',
      icon: PenTool,
      menus: [
        {
          href: ROUTES.designer,
          label: 'Designer',
          icon: PenTool,
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
    // Events (5th group - appears in More menu)
    {
      id: 'events',
      groupLabel: 'Events',
      icon: CalendarDays,
      menus: [
        {
          href: ROUTES.events,
          label: 'Events',
          icon: CalendarDays,
        },
      ],
    },
  ]

  // Settings group (appears in More menu for all users)
  const settingsMenus: MobileNavItem[] = [
    {
      href: ROUTES.integrations,
      label: 'Integrations',
      icon: Settings,
    },
  ]

  if (isAdmin) {
    settingsMenus.push(
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
    )
  }

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

  return groups
}

/**
 * Icon mapping for menu groups (used by More menu)
 */
export const GROUP_ICONS: Record<string, LucideIcon> = {
  'Home': LayoutDashboard,
  'Designer': PenTool,
  'Gallery': Images,
  'Templates': Library,
  'Events': CalendarDays,
  'Settings': Settings,
}
