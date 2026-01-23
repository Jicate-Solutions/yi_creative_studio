# Mobile Bottom Navbar - Quick Reference

## Navigation Structure

```
┌─────────────────────────────────────────────┐
│  Mobile Bottom Navbar (< 1024px only)      │
├─────────────────────────────────────────────┤
│  [Dashboard] [Create] [Gallery] [Templates] [More •] │
└─────────────────────────────────────────────┘
                                              ▲
                                              │
                                    Badge count for items
                                    in More menu
```

## More Menu Structure

### Regular User (Badge: 1)
```
More Menu
├── Bulk Generate
```

### Admin User (Badge: 6)
```
More Menu
├── Bulk Generate
└── Settings ▼
    ├── Brand Config
    ├── Logo Management
    ├── Team
    ├── Billing
    └── Analytics ▶
        ├── Cost Analysis
        ├── Feedback
        └── Learning
```

### Super Admin (Badge: 7)
```
More Menu
├── Bulk Generate
├── Settings ▼ (5 items + Analytics submenu = 3 items)
│   └── ... (same as admin)
└── Administration ▼
    └── Admin Credits
```

## File Structure

```
components/BottomNav/
├── bottom-navbar.tsx          # Main component (adapted for Yi)
├── bottom-nav-item.tsx        # Individual nav item
├── bottom-nav-more-menu.tsx   # Accordion More menu
├── bottom-nav-submenu.tsx     # Dropdown submenu
├── bottom-nav-minimized.tsx   # Minimized state (unused)
├── types.ts                   # TypeScript types
└── index.ts                   # Barrel exports

hooks/
├── use-bottom-nav.ts          # Zustand store (persistent state)
└── use-mobile.tsx             # Mobile detection hook

lib/
└── mobile-nav-config.ts       # Yi navigation structure
```

## Usage in Dashboard Layout

```tsx
// components/layout/dashboard-layout.tsx
import { BottomNavbar } from '@/components/BottomNav'

<div>
  <Sidebar />           {/* Desktop sidebar */}
  <BottomNavbar />      {/* Mobile bottom navbar */}
  <main>...</main>
</div>
```

## State Management

```typescript
// Zustand store with localStorage persistence
{
  activeNavId: string           // Current active nav group ID
  isExpanded: boolean           // Submenu dropdown open
  isMoreMenuOpen: boolean       // More menu sheet open
  isMinimized: boolean          // Minimized state (always false)
  activePage: ActivePageInfo    // Current page info
}
```

## Behavior Rules

1. **Mobile Only**: Hidden on desktop (≥1024px)
2. **Create Mode**: Hidden when `createModeActive` is true
3. **Badge Count**: Shows items in More menu (groups 5+)
4. **Active Indicator**: Blue top border on active nav item
5. **State Persistence**: Remembers active nav across refreshes
6. **iOS Safe Area**: Respects notch and home indicator

## Key Differences from Old Nav

| Feature | Old MobileNav | New BottomNavbar |
|---------|---------------|------------------|
| Type | Sheet-based | Bottom navbar |
| More Menu | 2-column grid | Accordion + 3-col grid |
| State | ui-store (transient) | Zustand (persistent) |
| Submenu | None | Dropdown above navbar |
| Animation | Slide up | Spring + fade |
| Role Filtering | Client-side fetch | Direct store access |

## Testing Quick Checklist

- [ ] Navbar shows on mobile (< 1024px)
- [ ] Hidden on desktop (≥ 1024px)
- [ ] Hidden in create mode
- [ ] Badge shows correct count
- [ ] More menu opens with accordion
- [ ] Settings shows 3-column grid
- [ ] Analytics has 3 submenu items
- [ ] Admin sees Settings section
- [ ] Super Admin sees Administration
- [ ] State persists after refresh

## Routes Configured

### Primary (Always Visible)
- `/dashboard` - Dashboard
- `/create` - Create
- `/gallery` - Gallery
- `/templates` - Templates

### More Menu (All Users)
- `/bulk` - Bulk Generate

### Settings (Admin Only)
- `/settings/brand` - Brand Config
- `/settings/logos` - Logo Management
- `/settings/team` - Team
- `/settings/billing` - Billing
- `/settings/analytics` - Analytics (parent)
  - `/settings/analytics/costs` - Cost Analysis
  - `/settings/analytics/feedback` - Feedback
  - `/settings/analytics/learning` - Learning

### Administration (Super Admin Only)
- `/settings/admin/credits` - Admin Credits

## Troubleshooting

**Navbar not showing:**
- Check if screen width < 1024px
- Verify `createModeActive` is false
- Check console for hydration errors

**Wrong badge count:**
- Verify user role (admin vs regular)
- Check `getMobileNavPages()` return value
- Inspect filteredPages in React DevTools

**State not persisting:**
- Check localStorage for `bottom-nav-store`
- Verify `useBottomNavHydration()` returns true
- Check browser console for rehydration errors

**More menu not opening:**
- Check `isMoreMenuOpen` state
- Verify Sheet component is rendering
- Check for z-index conflicts

## Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Type check only
npx tsc --noEmit
```

## Dependencies (All Pre-installed)

- zustand v5.0.8
- framer-motion v12.23.26
- lucide-react v0.552.0
- @radix-ui/react-sheet
- @radix-ui/react-accordion
- @radix-ui/react-scroll-area
