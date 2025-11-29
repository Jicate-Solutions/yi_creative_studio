# Twitter-Style Mobile Navigation + FAB Skill

> Complete workflow for implementing Twitter/X-style mobile bottom navigation with slide-up "More Options" menu for Next.js/React applications using Tailwind CSS.

## Trigger Conditions

This skill should be used when user mentions:
- "twitter mobile navigation"
- "bottom navigation with FAB"
- "floating action button menu"
- "mobile nav twitter style"
- "X app navigation"
- "slide-up menu"
- "bottom sheet menu"
- "pill navigation"
- "glassmorphism navigation"

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    COMPONENT STRUCTURE                        │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  components/layout/                                           │
│  ├── mobile-bottom-nav.tsx    → Bottom tab bar (5 items)     │
│  ├── mobile-fab.tsx           → Slide-up bottom sheet menu   │
│  └── sidebar.tsx              → Integrates mobile components │
│                                                               │
│  lib/store/                                                   │
│  └── mobile-nav-store.ts      → Zustand store (menu state)   │
│                                                               │
│  components/                                                  │
│  └── bug-reporter-wrapper.tsx → Handles FAB menu visibility  │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Visual Design Specification

### Bottom Navigation Bar

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  INACTIVE STATE:          ACTIVE STATE:                      │
│  ┌────┐                   ┌──────────────┐                   │
│  │ 🏠 │                   │  🛒  Sales   │  ← Pill shape     │
│  └────┘                   └──────────────┘    with label     │
│  Icon only                Icon + Label                       │
│  Muted color              Primary/White                      │
│                                                              │
│  FULL BAR:                                                   │
│  ╔═══════════════════════════════════════════════════════╗  │
│  ║                                                        ║  │
│  ║   🏠      ┌─🛒─Sales─┐    📦      👥      ⋯          ║  │
│  ║  Home         ↑       Inventory Customers More        ║  │
│  ║            Active                                      ║  │
│  ╚═══════════════════════════════════════════════════════╝  │
│                                                              │
│  Styling:                                                    │
│  • Background: Glassmorphism (blur + transparency)           │
│  • Border: Subtle border/40 border                          │
│  • Shadow: Soft shadow for elevation                         │
│  • Border-radius: rounded-2xl                               │
│  • Position: Fixed bottom-4 left-4 right-4                  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Slide-Up Bottom Sheet Menu (Replaces Radial FAB)

```
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  CLOSED STATE:                                               │
│  • No floating button visible                               │
│  • "More" button (...) in bottom nav triggers the menu      │
│                                                              │
│  OPEN STATE (Slide-up Bottom Sheet):                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ═══════  (handle bar)                              │    │
│  │                                                      │    │
│  │  More Options                                    ✕   │    │
│  │                                                      │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │    │
│  │  │ 🏭    │ │ 📋    │ │ 💰    │ │ 🏷️    │       │    │
│  │  │Supplier│ │Orders  │ │Expenses│ │Promos  │       │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │    │
│  │                                                      │    │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │    │
│  │  │ 🏪    │ │ 👥    │ │ 📊    │ │ ⚙️    │       │    │
│  │  │Stores  │ │Staff   │ │Reports │ │Settings│       │    │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Benefits over Radial FAB:                                  │
│  • No overlap with floating buttons (cart, bug reporter)    │
│  • Cleaner Twitter/X style                                  │
│  • More menu items without crowding                         │
│  • Better touch targets on mobile                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Create Zustand Store

```typescript
// lib/store/mobile-nav-store.ts
import { create } from 'zustand'

interface MobileNavState {
  fabOpen: boolean
  setFabOpen: (open: boolean) => void
  toggleFab: () => void
}

export const useMobileNavStore = create<MobileNavState>((set) => ({
  fabOpen: false,
  setFabOpen: (open) => set({ fabOpen: open }),
  toggleFab: () => set((state) => ({ fabOpen: !state.fabOpen })),
}))
```

### Step 2: Create Bottom Navigation Component

```typescript
// components/layout/mobile-bottom-nav.tsx
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
}

interface MobileBottomNavProps {
  items: NavItem[]
  className?: string
  onMoreClick?: () => void  // Callback for "More" button
}

export function MobileBottomNav({ items, className, onMoreClick }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isActive = (href: string) => {
    if (!mounted) return false
    if (href === '/') return pathname === '/'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  if (!mounted) return null

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        // Position & Layout - Full width bottom nav
        "fixed bottom-4 left-4 right-4 z-50 lg:hidden",
        // Glassmorphism
        "bg-background/90 backdrop-blur-xl",
        // Border & Shadow
        "border border-border/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
        // Shape
        "rounded-2xl",
        className
      )}
    >
      <div className="flex items-center justify-around h-[3.25rem] px-1">
        {items.map((item, index) => {
          const Icon = item.icon
          const active = isActive(item.href)
          const isMoreButton = item.href === '#more'

          // Handle "More" button separately
          if (isMoreButton) {
            return (
              <button
                key={`more-${index}`}
                onClick={onMoreClick}
                className={cn(
                  "relative flex items-center justify-center",
                  "transition-all duration-300 ease-out",
                  "active:scale-90"
                )}
                aria-label="More options"
              >
                <div className="flex items-center justify-center p-2.5">
                  <Icon className="h-[1.35rem] w-[1.35rem] text-muted-foreground/70 transition-colors duration-200 hover:text-foreground" />
                </div>
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              aria-label={`Navigate to ${item.title}`}
              className={cn(
                "relative flex items-center justify-center",
                "transition-all duration-300 ease-out",
                "active:scale-90"
              )}
            >
              {active ? (
                // Active state - pill with icon + label
                <div className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5",
                  "rounded-xl",
                  "bg-primary text-primary-foreground",
                  "shadow-md shadow-primary/20",
                  "animate-in fade-in zoom-in-95 duration-300"
                )}>
                  <Icon className="h-4 w-4" />
                  <span className="text-[11px] font-semibold tracking-tight">{item.title}</span>
                </div>
              ) : (
                // Inactive state - icon only
                <div className="flex items-center justify-center p-2.5 group">
                  <Icon className="h-[1.35rem] w-[1.35rem] text-muted-foreground/70 transition-colors duration-200 group-hover:text-foreground" />
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

### Step 3: Create Slide-Up Bottom Sheet Menu (MobileFab)

```typescript
// components/layout/mobile-fab.tsx
"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { X, LucideIcon } from "lucide-react"
import { useMobileNavStore } from "@/lib/store/mobile-nav-store"

export interface FabMenuItem {
  title: string
  href: string
  icon: LucideIcon
  gradient?: string  // e.g., "from-blue-500 to-cyan-500"
}

interface MobileFabProps {
  menuItems: FabMenuItem[]
  className?: string
}

export function MobileFab({
  menuItems,
  className
}: MobileFabProps) {
  const { fabOpen, setFabOpen } = useMobileNavStore()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close menu on route change
  useEffect(() => {
    setFabOpen(false)
  }, [pathname, setFabOpen])

  if (!mounted) return null

  // Don't render anything if menu is closed
  // The "More" button in bottom nav triggers this menu
  if (!fabOpen) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={cn(
          "fixed inset-0 z-[60] lg:hidden",
          "bg-black/50 backdrop-blur-[2px]",
          "animate-in fade-in duration-200"
        )}
        onClick={() => setFabOpen(false)}
        aria-hidden="true"
      />

      {/* Twitter-style slide-up menu sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[61] lg:hidden",
          "bg-background",
          "border-t border-border/50",
          "rounded-t-3xl",
          "shadow-[0_-10px_40px_rgba(0,0,0,0.15)]",
          "animate-in slide-in-from-bottom duration-300",
          className
        )}
        role="menu"
        aria-label="More options"
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3">
          <h3 className="text-base font-semibold">More Options</h3>
          <button
            onClick={() => setFabOpen(false)}
            className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Menu items grid - 4 columns */}
        <div className="px-4 pb-6">
          <div className="grid grid-cols-4 gap-3">
            {menuItems.map((item) => {
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setFabOpen(false)}
                  role="menuitem"
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl",
                    "transition-all duration-200 ease-out",
                    "hover:bg-muted active:scale-95"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-2xl",
                    item.gradient
                      ? `bg-gradient-to-br ${item.gradient} text-white shadow-md`
                      : "bg-muted"
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-medium text-center leading-tight text-muted-foreground">
                    {item.title}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Safe area padding for iOS */}
        <div className="h-safe-area-bottom" />
      </div>
    </>
  )
}
```

### Step 4: Integration in Layout/Sidebar

```typescript
// In your sidebar.tsx or layout component
import { MobileBottomNav, type NavItem } from "@/components/layout/mobile-bottom-nav"
import { MobileFab, type FabMenuItem } from "@/components/layout/mobile-fab"
import { useMobileNavStore } from "@/lib/store/mobile-nav-store"
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  MoreHorizontal,
  Truck,
  ClipboardList,
  Receipt,
  Tag,
  Store,
  UserCog,
  BarChart3,
  Settings
} from "lucide-react"

// Bottom nav items (max 5 - last one is "More" trigger)
const bottomNavItems: NavItem[] = [
  { title: "Home", href: "/dashboard", icon: LayoutDashboard },
  { title: "Sales", href: "/sales", icon: ShoppingCart },
  { title: "Inventory", href: "/inventory", icon: Package },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "More", href: "#more", icon: MoreHorizontal },  // Special trigger
]

// FAB menu items with gradients
const fabMenuItems: FabMenuItem[] = [
  { title: "Suppliers", href: "/suppliers", icon: Truck, gradient: "from-blue-500 to-cyan-500" },
  { title: "Orders", href: "/orders", icon: ClipboardList, gradient: "from-indigo-500 to-purple-500" },
  { title: "Expenses", href: "/expenses", icon: Receipt, gradient: "from-red-500 to-pink-500" },
  { title: "Promotions", href: "/promotions", icon: Tag, gradient: "from-orange-500 to-amber-500" },
  { title: "Stores", href: "/stores", icon: Store, gradient: "from-emerald-500 to-teal-500" },
  { title: "Staff", href: "/staff", icon: UserCog, gradient: "from-pink-500 to-rose-500" },
  { title: "Reports", href: "/reports", icon: BarChart3, gradient: "from-cyan-500 to-blue-500" },
  { title: "Settings", href: "/settings", icon: Settings, gradient: "from-gray-500 to-slate-500" },
]

function MobileSidebar() {
  const { toggleFab } = useMobileNavStore()

  return (
    <>
      <MobileBottomNav items={bottomNavItems} onMoreClick={toggleFab} />
      <MobileFab menuItems={fabMenuItems} />
    </>
  )
}
```

### Step 5: Handle Floating Button Conflicts (CRITICAL)

When you have other floating buttons (cart, bug reporter, etc.), they will overlap with the bottom sheet menu. Here's how to handle this:

```typescript
// In your bug-reporter-wrapper.tsx or similar floating button wrapper
"use client"

import { useEffect } from "react"
import { useMobileNavStore } from "@/lib/store/mobile-nav-store"

export function FloatingButtonWrapper({ children }) {
  const { fabOpen } = useMobileNavStore()

  // Toggle class on body when FAB menu is open
  useEffect(() => {
    if (fabOpen) {
      document.body.classList.add("fab-menu-open")
    } else {
      document.body.classList.remove("fab-menu-open")
    }
    return () => {
      document.body.classList.remove("fab-menu-open")
    }
  }, [fabOpen])

  return (
    <>
      {/* CSS to hide floating buttons when menu is open */}
      <style jsx global>{`
        /* Position floating buttons above bottom nav */
        /* Bottom nav: bottom-4 (16px) + height ~52px = ends at ~68px */
        [data-floating-button],
        button[aria-label*="bug" i],
        button[aria-label*="report" i] {
          bottom: 128px !important;
          right: 16px !important;
          z-index: 40 !important;
          transition: opacity 0.2s ease-out, visibility 0.2s ease-out !important;
        }

        /* Hide floating buttons when FAB menu is open */
        .fab-menu-open [data-floating-button],
        .fab-menu-open button[aria-label*="bug" i],
        .fab-menu-open button[aria-label*="report" i] {
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        /* Desktop: Reset to standard position */
        @media (min-width: 1024px) {
          [data-floating-button],
          button[aria-label*="bug" i],
          button[aria-label*="report" i] {
            bottom: 20px !important;
            right: 20px !important;
          }
        }
      `}</style>
      {children}
    </>
  )
}
```

### Step 6: Position Cart Button (on pages with cart)

```typescript
// In your sales page or any page with floating cart button
// Position it above the bottom nav but below bug reporter

{/* Mobile Cart Button - positioned above bottom nav, aligned with other floating buttons */}
<div className="lg:hidden fixed bottom-20 right-[20px] z-40">
  <Button size="icon" className="rounded-full h-10 w-10 shadow-lg">
    <ShoppingCart className="h-4 w-4" />
  </Button>
</div>
```

## Z-Index Hierarchy

```
┌────────────────────────────────────────────────────────────┐
│  Z-INDEX STACKING ORDER (Mobile)                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  z-[61]  → Bottom sheet menu content                      │
│  z-[60]  → Backdrop overlay                               │
│  z-50    → Bottom navigation bar                          │
│  z-40    → Cart button, Bug reporter (floating buttons)   │
│                                                            │
│  IMPORTANT: Floating buttons use z-40 so they appear      │
│  BELOW the menu when it opens (z-60/61)                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Position Calculations

```
┌────────────────────────────────────────────────────────────┐
│  VERTICAL STACKING (from bottom)                           │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Bottom nav:    bottom-4 (16px)                           │
│                 height: ~52px (h-[3.25rem])               │
│                 → ends at ~68px from bottom               │
│                                                            │
│  Cart button:   bottom-20 (80px)                          │
│                 → ~12px gap above nav                     │
│                                                            │
│  Bug reporter:  bottom: 128px                             │
│                 → 8px gap above cart (40px button)        │
│                                                            │
│  RIGHT ALIGNMENT:                                          │
│  Cart button:   right-[20px]                              │
│  Bug reporter:  right: 16px                               │
│  → Centers align vertically                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Bug reporter overlays menu | z-index conflict | Use `fab-menu-open` class to hide it |
| Cart button overlaps nav | Wrong bottom position | Use `bottom-20` for cart |
| Buttons misaligned | Different sizes | Adjust right position to center-align |
| Menu doesn't close on nav | Missing pathname effect | Add `useEffect` with pathname dependency |
| Hydration mismatch | SSR rendering | Add `mounted` state check |
| Animation jank | Using position properties | Use transform and opacity only |

## Accessibility Considerations

1. **ARIA Labels**: Add proper aria-labels to all navigation items
2. **Role attributes**: Use `role="navigation"`, `role="menu"`, `role="menuitem"`
3. **aria-current**: Mark active page with `aria-current="page"`
4. **Focus Management**: Ensure menu items are focusable
5. **Keyboard Navigation**: Support Escape key to close menu
6. **Screen Reader**: Announce menu open/close states

## Responsive Behavior

| Breakpoint | Navigation Type |
|------------|-----------------|
| < 1024px (lg) | Mobile bottom nav + slide-up menu |
| >= 1024px | Desktop sidebar (hide mobile components) |

```typescript
// Hide on desktop
<nav className="lg:hidden">
  ...
</nav>
```

## Animation Effects

The bottom sheet menu includes polished animation effects:

### Staggered Item Entry
```typescript
// Each item has a delay based on its index
const delay = index * 40  // 40ms between items

// Initial state (hidden)
className={cn(
  !showItems && "opacity-0 scale-75 translate-y-4",
  showItems && "opacity-100 scale-100 translate-y-0"
)}
style={{ transitionDelay: showItems ? `${delay}ms` : '0ms' }}
```

### Animation Sequence
1. **Sheet slides up** (duration: 300ms)
2. **Items trigger** (150ms delay after sheet)
3. **Each item cascades** (40ms stagger per item)
4. **Icons zoom in** (50ms after item)
5. **Labels fade in** (100ms after item)

### Close Button Interaction
```css
hover:rotate-90 active:scale-90
```

### Implementation
```typescript
const [showItems, setShowItems] = useState(false)

// Trigger staggered animation after sheet slides up
useEffect(() => {
  if (fabOpen) {
    const timer = setTimeout(() => setShowItems(true), 150)
    return () => clearTimeout(timer)
  } else {
    setShowItems(false)
  }
}, [fabOpen])
```

## Performance Optimizations

1. **Lazy mount**: Don't render until client-side mounted
2. **CSS transforms**: Use transform for animations (GPU accelerated)
3. **Conditional rendering**: Don't render menu when closed
4. **Smooth transitions**: Use CSS transitions instead of JS animations
5. **Staggered delays**: Use CSS transition-delay for cascade effect (no JS timers per item)

## Why Bottom Sheet > Radial FAB

1. **No Overlap Issues**: Bottom sheet covers entire bottom, no floating button conflicts
2. **More Items**: Can fit 8+ items in a grid vs 4-5 in radial
3. **Better Touch Targets**: Larger, easier to tap buttons
4. **Cleaner Design**: More aligned with modern Twitter/X style
5. **Accessibility**: Better keyboard navigation and screen reader support

## Related Skills

- `mobile-fab-navigation` - Original FAB navigation skill
- `brand-styling` - Color and theme guidelines
- `ui-ux-designer` - General UI/UX patterns
- `bug-reporter-positioning` - Floating button positioning
