# Implementation Checklist - Twitter Mobile Navigation

## Pre-Implementation

- [ ] Confirm design requirements with stakeholder
- [ ] Review existing navigation components
- [ ] Check for conflicting z-index values
- [ ] Verify Tailwind configuration supports animations
- [ ] Ensure Zustand is installed (`npm install zustand`)

---

## Phase 1: Store Setup

### Create Mobile Nav Store

**File:** `lib/store/mobile-nav-store.ts`

```typescript
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

**Checklist:**
- [ ] Create store file
- [ ] Export store hook
- [ ] Test store in isolation

---

## Phase 2: Bottom Navigation Component

### Create MobileBottomNav

**File:** `components/layout/mobile-bottom-nav.tsx`

**Core Features:**
- [ ] Accept array of nav items via props
- [ ] Detect active route using `usePathname()`
- [ ] Render inactive items as icon-only
- [ ] Render active item as pill (icon + label)
- [ ] Apply glassmorphism styling
- [ ] Position fixed at bottom with safe-area padding
- [ ] Leave space for FAB (right-20 or similar)
- [ ] Hide on desktop (lg:hidden)

**Styling Checklist:**
- [ ] Glassmorphism background (bg-background/80 backdrop-blur-xl)
- [ ] Rounded full (pill shape)
- [ ] Proper shadow (shadow-lg)
- [ ] Border (border-border/50)
- [ ] Correct z-index (z-50)
- [ ] Safe area bottom padding

**Accessibility:**
- [ ] Add role="navigation"
- [ ] Add aria-label="Main navigation"
- [ ] Add aria-current="page" for active item
- [ ] Ensure touch targets are 44px minimum

---

## Phase 3: FAB Component

### Create MobileFab

**File:** `components/layout/mobile-fab.tsx`

**Core Features:**
- [ ] Primary action mode (optional)
- [ ] Menu toggle mode
- [ ] Radial menu expansion
- [ ] Backdrop overlay when open
- [ ] Close on backdrop click
- [ ] Close on route change
- [ ] Icon rotation animation (+ → ×)

**Menu Features:**
- [ ] Calculate radial positions
- [ ] Staggered animation delays
- [ ] Spring-based easing
- [ ] Menu item click navigation
- [ ] Menu item styling (bg, border, shadow)

**Styling Checklist:**
- [ ] Gradient background (emerald → teal)
- [ ] Drop shadow with color
- [ ] Hover scale effect
- [ ] Active press scale
- [ ] Proper z-index (z-50)
- [ ] Position fixed bottom-right

**Accessibility:**
- [ ] aria-expanded for FAB button
- [ ] aria-haspopup="menu"
- [ ] aria-label for button states
- [ ] role="menu" for menu container
- [ ] role="menuitem" for menu items

---

## Phase 4: Integration

### Update Sidebar Component

**File:** `components/layout/sidebar.tsx`

**Changes:**
- [ ] Replace existing MobileSidebar with new components
- [ ] Define nav items array
- [ ] Define FAB menu items array
- [ ] Import and render MobileBottomNav
- [ ] Import and render MobileFab
- [ ] Keep DesktopSidebar unchanged

### Update Layout

**File:** `app/(dashboard)/layout.tsx`

**Changes:**
- [ ] Ensure proper bottom padding for content (pb-24 on mobile)
- [ ] Verify z-index hierarchy works correctly
- [ ] Test on various screen sizes

---

## Phase 5: Testing

### Visual Testing

- [ ] Test on iPhone SE (smallest common mobile)
- [ ] Test on iPhone 14 Pro Max (largest common mobile)
- [ ] Test on iPad (tablet breakpoint)
- [ ] Test on desktop (should be hidden)
- [ ] Test dark mode appearance
- [ ] Test light mode appearance

### Functional Testing

- [ ] Tab navigation works correctly
- [ ] Active state updates on route change
- [ ] FAB opens and closes properly
- [ ] Menu items navigate correctly
- [ ] Backdrop closes menu
- [ ] Route change closes menu
- [ ] Animations are smooth
- [ ] No layout shifts

### Accessibility Testing

- [ ] Screen reader announces navigation
- [ ] Touch targets are large enough
- [ ] Color contrast meets WCAG AA
- [ ] Focus states are visible
- [ ] Reduced motion is respected

### Performance Testing

- [ ] No layout thrashing during animations
- [ ] Smooth 60fps animations
- [ ] No unnecessary re-renders
- [ ] Bundle size impact is acceptable

---

## Phase 6: Polish

### Fine-tuning

- [ ] Adjust animation timing if needed
- [ ] Fine-tune radial menu positions
- [ ] Optimize shadow values
- [ ] Add haptic feedback (optional)
- [ ] Add sound effects (optional)

### Documentation

- [ ] Update component README
- [ ] Add JSDoc comments
- [ ] Document props and usage
- [ ] Add Storybook stories (if applicable)

---

## Common Issues & Solutions

### Issue: FAB hidden behind content
**Solution:** Increase z-index to z-50 or higher

### Issue: Backdrop blur not working
**Solution:** Add -webkit-backdrop-filter for Safari support

### Issue: Animation jank on low-end devices
**Solution:** Use transform instead of position properties

### Issue: Safe area not respected
**Solution:** Add pb-[env(safe-area-inset-bottom)] or use safe-area-inset-bottom

### Issue: Menu items overlap FAB
**Solution:** Adjust radial radius or start angle

### Issue: Pill transition looks choppy
**Solution:** Use cubic-bezier easing instead of ease-out

---

## Files Created/Modified Summary

| File | Action | Purpose |
|------|--------|---------|
| `lib/store/mobile-nav-store.ts` | Create | Zustand store for FAB state |
| `components/layout/mobile-bottom-nav.tsx` | Create | Bottom navigation component |
| `components/layout/mobile-fab.tsx` | Create | FAB with radial menu |
| `components/layout/sidebar.tsx` | Modify | Integrate new mobile nav |
| `app/(dashboard)/layout.tsx` | Modify | Adjust padding/z-index |

---

## Verification Commands

```bash
# Check for TypeScript errors
npx tsc --noEmit

# Run linting
npm run lint

# Build to verify no errors
npm run build

# Start dev server for testing
npm run dev
```

---

## Sign-off

- [ ] Code review completed
- [ ] Design review completed
- [ ] QA testing completed
- [ ] Performance approved
- [ ] Accessibility approved
- [ ] Ready for production
