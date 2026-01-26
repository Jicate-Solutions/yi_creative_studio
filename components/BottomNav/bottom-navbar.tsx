'use client'

import { useState, useEffect, useMemo, useCallback, useLayoutEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'
import { useBottomNav, useBottomNavHydration } from '@/hooks/use-bottom-nav'
import { useAuthStore } from '@/stores/auth-store'
import { useUIStore } from '@/stores/ui-store'
import { getMobileNavConfig } from '@/lib/mobile-nav-config'
import { BottomNavItem } from './bottom-nav-item'
import { BottomNavSubmenu } from './bottom-nav-submenu'
import { BottomNavMoreMenu } from './bottom-nav-more-menu'
import { BottomNavGroup, FlatMenuItem, ActivePageInfo } from './types'

export function BottomNavbar() {
  const pathname = usePathname()
  const router = useRouter()
  const isMobile = useIsMobile()
  const hasInitialized = useRef(false)
  const hasHydrated = useBottomNavHydration()

  // Get auth state for role-based navigation
  const { canManage, checkSuperAdmin } = useAuthStore()
  const { createModeActive, analyticsModeActive } = useUIStore()

  const isAdmin = canManage()
  const isSuperAdmin = checkSuperAdmin()

  const {
    activeNavId,
    isExpanded,
    isMoreMenuOpen,
    isMinimized,
    activePage,
    setActiveNav,
    switchToNav,
    setExpanded,
    setMoreMenuOpen,
    setMinimized,
    setActivePage
  } = useBottomNav()

  // Get navigation groups based on user role
  const allNavGroups = useMemo((): BottomNavGroup[] => {
    const config = getMobileNavConfig(isAdmin, isSuperAdmin)
    return config.map((group) => ({
      id: group.id,
      groupLabel: group.groupLabel,
      icon: group.icon,
      menus: group.menus.map((item) => ({
        href: item.href,
        label: item.label,
        icon: item.icon,
        active: pathname === item.href || pathname.startsWith(item.href + '/')
      }))
    }))
  }, [pathname, isAdmin, isSuperAdmin])

  // Primary nav groups (first 4)
  const primaryNavGroups = useMemo(() => {
    return allNavGroups.slice(0, 4)
  }, [allNavGroups])

  // Remaining groups for "More" menu
  const moreNavGroups = useMemo(() => {
    return allNavGroups.slice(4)
  }, [allNavGroups])

  // Find the group that contains the current pathname
  const currentActiveGroup = useMemo(() => {
    for (const group of allNavGroups) {
      for (const menu of group.menus) {
        if (pathname === menu.href || pathname.startsWith(menu.href + '/')) {
          return group
        }
      }
    }
    return allNavGroups[0] || null
  }, [pathname, allNavGroups])

  // Find the active page info based on current pathname
  const currentActivePage = useMemo((): ActivePageInfo | null => {
    if (!currentActiveGroup) return null

    for (const menu of currentActiveGroup.menus) {
      if (pathname === menu.href || pathname.startsWith(menu.href + '/')) {
        return {
          href: menu.href,
          label: menu.label,
          icon: menu.icon,
          groupLabel: currentActiveGroup.groupLabel
        }
      }
    }
    return null
  }, [pathname, currentActiveGroup])

  // Determine the effective active nav ID
  const effectiveActiveNavId = useMemo(() => {
    if (isExpanded && activeNavId) {
      return activeNavId
    }
    if (currentActiveGroup) {
      return currentActiveGroup.id
    }
    return activeNavId
  }, [currentActiveGroup, activeNavId, isExpanded])

  // Current active submenu items
  const activeSubmenus = useMemo(() => {
    if (effectiveActiveNavId) {
      const selectedGroup = allNavGroups.find((g) => g.id === effectiveActiveNavId)
      if (selectedGroup) {
        return selectedGroup.menus
      }
    }
    return currentActiveGroup?.menus || []
  }, [effectiveActiveNavId, allNavGroups, currentActiveGroup])

  // Update active page when pathname changes
  useLayoutEffect(() => {
    if (currentActivePage) {
      setActivePage(currentActivePage)

      if (!hasInitialized.current) {
        hasInitialized.current = true
        setMinimized(false)
      }
    }
  }, [currentActivePage, setActivePage, setMinimized])

  // Sync activeNavId with pathname
  useEffect(() => {
    if (!isExpanded && currentActiveGroup && currentActiveGroup.id !== activeNavId) {
      setActiveNav(currentActiveGroup.id)
    }
  }, [currentActiveGroup, activeNavId, setActiveNav, isExpanded])

  // Handle nav item click
  const handleNavClick = useCallback(
    (groupId: string) => {
      if (isExpanded && activeNavId === groupId) {
        setExpanded(false)
        setMoreMenuOpen(false)
      } else {
        switchToNav(groupId)
      }
    },
    [activeNavId, isExpanded, switchToNav, setExpanded, setMoreMenuOpen]
  )

  // Handle submenu item click
  const handleSubmenuClick = useCallback(
    (href: string) => {
      router.push(href)
      setExpanded(false)
    },
    [router, setExpanded]
  )

  // Handle "More" menu toggle
  const handleMoreClick = useCallback(() => {
    setExpanded(false)
    setMoreMenuOpen(!isMoreMenuOpen)
  }, [setMoreMenuOpen, setExpanded, isMoreMenuOpen])

  // Handle More menu item click
  const handleMoreItemClick = useCallback(
    (href: string) => {
      router.push(href)
      setMoreMenuOpen(false)
    },
    [router, setMoreMenuOpen]
  )

  // Close submenu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-bottom-nav]')) {
        setExpanded(false)
      }
    }

    if (isExpanded) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isExpanded, setExpanded])

  // Wait for hydration
  if (!hasHydrated) {
    return null
  }

  // Don't render on desktop or when in create/analytics mode
  if (!isMobile || createModeActive || analyticsModeActive) {
    return null
  }

  // Don't render if no groups available
  if (primaryNavGroups.length === 0) return null

  return (
    <>
      {/* Backdrop when submenu expanded */}
      <AnimatePresence>
        {isExpanded && !isMoreMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[75] md:hidden"
            onClick={() => {
              setExpanded(false)
            }}
          />
        )}
      </AnimatePresence>

      {/* Bottom navigation */}
      <motion.nav
        data-bottom-nav
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 35,
          mass: 0.8
        }}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-[80]',
          'md:hidden',
          'bg-background border-t border-border',
          'shadow-[0_-4px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]'
        )}
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        {/* Expanded submenu */}
        <BottomNavSubmenu
          items={activeSubmenus}
          isOpen={isExpanded}
          onItemClick={handleSubmenuClick}
        />

        {/* Nav items */}
        <div className="flex items-center justify-around">
          {primaryNavGroups.map((group) => (
            <BottomNavItem
              key={group.id}
              id={group.id}
              icon={group.icon}
              label={group.groupLabel}
              isActive={effectiveActiveNavId === group.id}
              hasSubmenu={group.menus.length > 1}
              onClick={() => handleNavClick(group.id)}
            />
          ))}

          {/* More button if there are additional groups */}
          {moreNavGroups.length > 0 && (
            <BottomNavItem
              id="more"
              icon={MoreHorizontal}
              label="More"
              isActive={isMoreMenuOpen}
              hasSubmenu={true}
              badgeCount={moreNavGroups.length}
              onClick={handleMoreClick}
            />
          )}
        </div>
      </motion.nav>

      {/* More menu sheet */}
      <BottomNavMoreMenu
        groups={moreNavGroups}
        isOpen={isMoreMenuOpen}
        onClose={() => setMoreMenuOpen(false)}
        onItemClick={handleMoreItemClick}
      />
    </>
  )
}
