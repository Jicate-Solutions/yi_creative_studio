# Twitter-Style Mobile Navigation Skill

A comprehensive skill for implementing Twitter/X-style mobile bottom navigation with slide-up "More Options" menu in Next.js applications.

## Overview

This skill provides complete guidance for building a modern mobile navigation system inspired by Twitter/X's mobile app, featuring:

- **Bottom Tab Navigation** - 5-item tab bar with pill-style active indicators
- **Slide-Up Bottom Sheet** - "More Options" menu triggered by the last nav item
- **Glassmorphism Styling** - Modern frosted glass effect
- **Smooth Animations** - CSS transitions for natural feel
- **Accessibility** - Full ARIA support and screen reader compatibility
- **Floating Button Management** - Handles conflicts with cart/bug reporter buttons

## Directory Structure

```
.claude/skills/twitter-mobile-nav/
├── SKILL.md                          # Main skill documentation
├── README.md                         # This file
└── references/
    ├── design-tokens.md              # Colors, spacing, typography
    ├── component-api.md              # Props, types, usage examples
    ├── animation-patterns.md         # Animation guidelines
    └── implementation-checklist.md   # Step-by-step checklist
```

## Quick Start

### 1. Reference the Skill

When implementing Twitter-style mobile navigation, tell Claude:

```
Use the twitter-mobile-nav skill to implement mobile navigation
```

### 2. Follow the Implementation Steps

The skill guides you through:

1. Creating Zustand store for nav state
2. Building MobileBottomNav component
3. Building MobileFab (slide-up bottom sheet) component
4. Integrating with existing layout
5. Handling floating button conflicts (cart, bug reporter)
6. Testing and polish

## Design Specifications

### Bottom Navigation

```
╔═══════════════════════════════════════════════════════╗
║   🏠      ┌─🛒─Sales─┐    📦      👥      ⋯          ║
║  Home         Active      Inv    Cust    More        ║
╚═══════════════════════════════════════════════════════╝
```

- **Position:** Fixed bottom-4 left-4 right-4 (full width with padding)
- **Style:** Glassmorphism with rounded-2xl border-radius
- **Active State:** Pill shape with icon + label
- **Inactive State:** Icon only, muted color
- **More Button:** Triggers slide-up menu

### Slide-Up Bottom Sheet (Replaced Radial FAB)

```
┌─────────────────────────────────────────────────────┐
│  ═══════  (handle bar)                              │
│                                                      │
│  More Options                                    ✕   │
│                                                      │
│  [Suppliers] [Orders] [Expenses] [Promos]           │
│  [Stores]   [Staff]   [Reports]  [Settings]         │
└─────────────────────────────────────────────────────┘
```

- **Position:** Fixed bottom-0, slides up from bottom
- **Trigger:** "More" button (...) in bottom nav
- **Layout:** 4-column grid with colorful gradient icons
- **Style:** White background with rounded-t-3xl corners

## Key Features

### Glassmorphism Effect
```css
bg-background/90 backdrop-blur-xl border border-border/40 shadow-[0_8px_32px_rgba(0,0,0,0.12)]
```

### Active Pill Animation
```css
transition-all duration-300 ease-out
animate-in fade-in zoom-in-95
```

### Bottom Sheet Animation
```css
animate-in slide-in-from-bottom duration-300
```

### Floating Button Management
- Bug reporter and cart buttons automatically hide when menu opens
- Uses `fab-menu-open` class on body to toggle visibility
- Proper z-index hierarchy prevents overlap issues

## Z-Index Hierarchy

| Element | Z-Index |
|---------|---------|
| Bottom sheet content | z-[61] |
| Backdrop overlay | z-[60] |
| Bottom navigation | z-50 |
| Cart/Bug reporter buttons | z-40 |

## Position Calculations

| Element | Bottom | Right |
|---------|--------|-------|
| Bottom nav | 16px (bottom-4) | 16px (left-4 right-4) |
| Cart button | 80px (bottom-20) | 20px (right-[20px]) |
| Bug reporter | 128px | 16px |

## Common Issues Solved

1. **Bug reporter overlaying menu** - Solved with `fab-menu-open` class
2. **Cart button overlapping nav** - Solved with `bottom-20` positioning
3. **Buttons misaligned horizontally** - Solved by adjusting right values
4. **Radial menu items overlapping** - Solved by switching to bottom sheet

## Dependencies

- **Next.js 13+** (App Router)
- **React 18+**
- **Tailwind CSS 3+**
- **Zustand** (state management)
- **Lucide React** (icons)

## Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

## Accessibility

- Full keyboard navigation
- Screen reader support
- ARIA attributes (role, aria-label, aria-current)
- Reduced motion support
- Touch target sizing (44px minimum)

## Why Bottom Sheet Over Radial FAB

| Aspect | Radial FAB | Bottom Sheet |
|--------|------------|--------------|
| Overlap issues | Common with floating buttons | None |
| Max items | 4-5 | 8+ |
| Touch targets | Small, awkward angles | Large, grid layout |
| Twitter alignment | Outdated style | Modern X/Twitter style |
| Accessibility | Harder to navigate | Easy grid navigation |

## Related Skills

- `mobile-fab-navigation` - Original FAB navigation (deprecated)
- `brand-styling` - Color and theme guidelines
- `ui-ux-designer` - General UI/UX patterns
- `mobile-responsive` - Responsive design patterns
- `bug-reporter-positioning` - Floating button positioning

## Version History

- **v2.0.0** - Replaced radial FAB with slide-up bottom sheet
- **v1.1.0** - Added floating button conflict handling
- **v1.0.0** - Initial release with core components
