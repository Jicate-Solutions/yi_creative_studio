# Component API Reference - Twitter Mobile Navigation

## MobileBottomNav

Bottom navigation bar with Twitter-style active pill indicators.

### Props

```typescript
interface NavItem {
  /** Display title shown in active pill */
  title: string
  /** Navigation href */
  href: string
  /** Lucide icon component */
  icon: LucideIcon
  /** Optional badge text */
  badge?: string
}

interface MobileBottomNavProps {
  /** Array of navigation items (max 5 recommended) */
  items: NavItem[]
  /** Additional CSS classes */
  className?: string
  /** Callback when item clicked */
  onItemClick?: (item: NavItem) => void
  /** Custom active check function */
  isActive?: (href: string, pathname: string) => boolean
}
```

### Usage

```tsx
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { Home, ShoppingCart, Package, Users, Menu } from "lucide-react"

const navItems = [
  { title: "Home", href: "/dashboard", icon: Home },
  { title: "Sales", href: "/sales", icon: ShoppingCart },
  { title: "Inventory", href: "/inventory", icon: Package },
  { title: "Customers", href: "/customers", icon: Users },
  { title: "More", href: "#more", icon: Menu },
]

<MobileBottomNav items={navItems} />
```

### Variants

#### Default (Glassmorphism)
```tsx
<MobileBottomNav
  items={navItems}
  className="bg-background/80 backdrop-blur-xl"
/>
```

#### Solid Background
```tsx
<MobileBottomNav
  items={navItems}
  className="bg-background border-t"
/>
```

#### Primary Theme
```tsx
<MobileBottomNav
  items={navItems}
  className="bg-primary/90 backdrop-blur-xl"
/>
```

---

## MobileFab

Floating Action Button with expandable radial menu.

### Props

```typescript
interface FabMenuItem {
  /** Menu item title */
  title: string
  /** Navigation href */
  href: string
  /** Lucide icon component */
  icon: LucideIcon
  /** Optional gradient classes */
  gradient?: string
  /** Optional onClick handler instead of href */
  onClick?: () => void
}

interface PrimaryAction {
  /** Button label (for accessibility) */
  label: string
  /** Navigation href */
  href: string
  /** Lucide icon component */
  icon: LucideIcon
}

interface MobileFabProps {
  /** Primary action when FAB is collapsed */
  primaryAction?: PrimaryAction
  /** Menu items shown when FAB is expanded */
  menuItems: FabMenuItem[]
  /** Position offset from bottom */
  bottomOffset?: number
  /** Position offset from right */
  rightOffset?: number
  /** Custom FAB gradient */
  gradient?: string
  /** Additional CSS classes */
  className?: string
  /** Menu layout style */
  menuStyle?: 'radial' | 'vertical' | 'arc'
  /** Callback when FAB state changes */
  onStateChange?: (isOpen: boolean) => void
}
```

### Usage

```tsx
import { MobileFab } from "@/components/layout/mobile-fab"
import { Zap, BarChart3, Store, UserCog, Settings } from "lucide-react"

const menuItems = [
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Stores", href: "/stores", icon: Store },
  { title: "Staff", href: "/staff", icon: UserCog },
  { title: "Settings", href: "/settings", icon: Settings },
]

// With primary action
<MobileFab
  primaryAction={{
    label: "Quick Sale",
    href: "/sales/new",
    icon: Zap
  }}
  menuItems={menuItems}
/>

// Menu only (no primary action)
<MobileFab menuItems={menuItems} />
```

### Menu Styles

#### Radial (Default)
Items fan out in an arc pattern from FAB center.

```tsx
<MobileFab menuItems={items} menuStyle="radial" />
```

```
        📊
         ↖
    🏪 ← ⊕ → 👨‍💼
         ↙
        ⚙️
```

#### Vertical
Items stack vertically above FAB.

```tsx
<MobileFab menuItems={items} menuStyle="vertical" />
```

```
    ┌─────────────┐
    │ ⚙️ Settings │
    ├─────────────┤
    │ 👨‍💼 Staff    │
    ├─────────────┤
    │ 🏪 Stores   │
    ├─────────────┤
    │ 📊 Reports  │
    └─────────────┘
         ⊕
```

#### Arc
Items spread in a quarter-circle arc.

```tsx
<MobileFab menuItems={items} menuStyle="arc" />
```

```
    📊 ─ 🏪 ─ 👨‍💼 ─ ⚙️
              ╲
               ⊕
```

### Custom Styling

```tsx
// Custom gradient
<MobileFab
  menuItems={items}
  gradient="from-violet-500 to-purple-500"
/>

// Custom position
<MobileFab
  menuItems={items}
  bottomOffset={24}
  rightOffset={24}
/>

// With state callback
<MobileFab
  menuItems={items}
  onStateChange={(isOpen) => {
    console.log('FAB is', isOpen ? 'open' : 'closed')
  }}
/>
```

---

## useMobileNavStore (Zustand Store)

Global state management for mobile navigation.

### State

```typescript
interface MobileNavState {
  /** Whether FAB menu is open */
  fabOpen: boolean
  /** Set FAB open state */
  setFabOpen: (open: boolean) => void
  /** Toggle FAB state */
  toggleFab: () => void
}
```

### Usage

```tsx
import { useMobileNavStore } from "@/lib/store/mobile-nav-store"

function MyComponent() {
  const { fabOpen, setFabOpen, toggleFab } = useMobileNavStore()

  // Check if FAB is open
  if (fabOpen) {
    // Do something
  }

  // Close FAB programmatically
  const handleAction = () => {
    setFabOpen(false)
  }

  // Toggle FAB
  const handleToggle = () => {
    toggleFab()
  }
}
```

### With Selectors (Performance)

```tsx
// Only subscribe to specific state
const fabOpen = useMobileNavStore((state) => state.fabOpen)
const toggleFab = useMobileNavStore((state) => state.toggleFab)
```

---

## Utility Functions

### isActivePath

Check if a path is currently active.

```typescript
function isActivePath(href: string, pathname: string): boolean {
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}
```

### getRadialPosition

Calculate radial menu item position.

```typescript
interface Position {
  x: number
  y: number
}

function getRadialPosition(
  index: number,
  total: number,
  radius: number = 80,
  startAngle: number = -90
): Position {
  const spreadAngle = 180 / (total + 1)
  const angle = startAngle - (index + 1) * spreadAngle

  return {
    x: Math.cos((angle * Math.PI) / 180) * radius,
    y: Math.sin((angle * Math.PI) / 180) * radius,
  }
}
```

### useRouteChange

Hook to detect route changes.

```typescript
function useRouteChange(callback: () => void) {
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  useEffect(() => {
    if (prevPathname.current !== pathname) {
      callback()
      prevPathname.current = pathname
    }
  }, [pathname, callback])
}
```

---

## Events & Callbacks

### Navigation Events

```tsx
<MobileBottomNav
  items={items}
  onItemClick={(item) => {
    // Track analytics
    analytics.track('nav_click', { item: item.title })
  }}
/>
```

### FAB Events

```tsx
<MobileFab
  menuItems={items}
  onStateChange={(isOpen) => {
    // Track FAB usage
    if (isOpen) {
      analytics.track('fab_opened')
    }
  }}
/>
```

---

## Accessibility Props

```tsx
// Navigation with full accessibility
<nav
  role="navigation"
  aria-label="Main navigation"
>
  <Link
    href={item.href}
    aria-current={isActive ? "page" : undefined}
    aria-label={`Navigate to ${item.title}`}
  >
    ...
  </Link>
</nav>

// FAB with accessibility
<button
  aria-expanded={fabOpen}
  aria-haspopup="menu"
  aria-label={fabOpen ? "Close quick actions menu" : "Open quick actions menu"}
  aria-controls="fab-menu"
>
  ...
</button>

<div
  id="fab-menu"
  role="menu"
  aria-hidden={!fabOpen}
>
  ...
</div>
```

---

## TypeScript Types

```typescript
// Export all types for external use
export type { NavItem, MobileBottomNavProps }
export type { FabMenuItem, PrimaryAction, MobileFabProps }
export type { MobileNavState }
```
