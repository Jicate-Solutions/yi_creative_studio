import { LucideIcon, LayoutDashboard, Sparkles, Images, Library, Layers,
         Palette, Image as ImageIcon, Users, CreditCard, BarChart3, Coins } from 'lucide-react';
import { ROUTES } from '@/lib/config/constants';

export interface MobileNavMenuItem {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  submenus: Array<{ href: string; label: string; active: boolean }>;
}

export interface MobileNavGroup {
  groupLabel: string;
  menus: MobileNavMenuItem[];
}

export function getMobileNavPages(
  pathname: string,
  canManage: boolean = false,
  isSuperAdmin: boolean = false
): MobileNavGroup[] {
  const isActive = (href: string) => {
    if (href === ROUTES.dashboard) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  };

  // First 4 groups = primary navbar items
  const primaryGroups: MobileNavGroup[] = [
    {
      groupLabel: 'Dashboard',
      menus: [{ href: ROUTES.dashboard, label: 'Dashboard', icon: LayoutDashboard,
                active: isActive(ROUTES.dashboard), submenus: [] }]
    },
    {
      groupLabel: 'Create',
      menus: [{ href: ROUTES.create, label: 'Create', icon: Sparkles,
                active: isActive(ROUTES.create), submenus: [] }]
    },
    {
      groupLabel: 'Gallery',
      menus: [{ href: ROUTES.gallery, label: 'Gallery', icon: Images,
                active: isActive(ROUTES.gallery), submenus: [] }]
    },
    {
      groupLabel: 'Templates',
      menus: [{ href: ROUTES.templates, label: 'Templates', icon: Library,
                active: isActive(ROUTES.templates), submenus: [] }]
    }
  ];

  // Groups 5+ = More menu
  const secondaryGroups: MobileNavGroup[] = [
    {
      groupLabel: 'Bulk Generate',
      menus: [{ href: ROUTES.bulk, label: 'Bulk Generate', icon: Layers,
                active: isActive(ROUTES.bulk), submenus: [] }]
    }
  ];

  // Admin settings
  const adminGroups: MobileNavGroup[] = canManage ? [
    {
      groupLabel: 'Settings',
      menus: [
        { href: ROUTES.brandConfig, label: 'Brand Config', icon: Palette,
          active: isActive(ROUTES.brandConfig), submenus: [] },
        { href: ROUTES.logoManagement, label: 'Logo Management', icon: ImageIcon,
          active: isActive(ROUTES.logoManagement), submenus: [] },
        { href: ROUTES.team, label: 'Team', icon: Users,
          active: isActive(ROUTES.team), submenus: [] },
        { href: ROUTES.billing, label: 'Billing', icon: CreditCard,
          active: isActive(ROUTES.billing), submenus: [] },
        { href: ROUTES.analytics, label: 'Analytics', icon: BarChart3,
          active: isActive(ROUTES.analytics),
          submenus: [
            { href: ROUTES.analyticsCosts, label: 'Cost Analysis',
              active: isActive(ROUTES.analyticsCosts) },
            { href: ROUTES.analyticsFeedback, label: 'Feedback',
              active: isActive(ROUTES.analyticsFeedback) },
            { href: ROUTES.analyticsLearning, label: 'Learning',
              active: isActive(ROUTES.analyticsLearning) }
          ]
        }
      ]
    }
  ] : [];

  // Super admin
  const superAdminGroups: MobileNavGroup[] = isSuperAdmin ? [
    {
      groupLabel: 'Administration',
      menus: [{ href: ROUTES.adminCredits, label: 'Admin Credits', icon: Coins,
                active: isActive(ROUTES.adminCredits), submenus: [] }]
    }
  ] : [];

  return [...primaryGroups, ...secondaryGroups, ...adminGroups, ...superAdminGroups];
}
