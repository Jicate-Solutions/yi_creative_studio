# Design Tokens - Twitter Mobile Navigation

## Color Palette

### Primary Colors (FAB & Active States)
```css
/* Emerald-Teal Gradient - Primary Action */
--fab-gradient-from: #10b981;  /* emerald-500 */
--fab-gradient-to: #14b8a6;    /* teal-500 */
--fab-shadow: rgba(16, 185, 129, 0.3);

/* Active Nav Item */
--nav-active-bg: var(--primary);
--nav-active-text: var(--primary-foreground);
--nav-active-shadow: rgba(var(--primary), 0.25);
```

### Neutral Colors
```css
/* Glassmorphism Background */
--glass-bg: rgba(var(--background), 0.8);
--glass-border: rgba(255, 255, 255, 0.1);
--glass-blur: 20px;

/* Inactive States */
--nav-inactive-text: var(--muted-foreground);
--nav-inactive-hover: var(--accent);
```

### Overlay Colors
```css
/* FAB Menu Backdrop */
--backdrop-bg: rgba(0, 0, 0, 0.4);
--backdrop-blur: 4px;
```

## Spacing

### Navigation Bar
```css
--nav-height: 56px;           /* 14 * 4 = 56px (h-14) */
--nav-padding-x: 8px;         /* px-2 */
--nav-bottom-offset: 16px;    /* bottom-4 */
--nav-side-margin: 16px;      /* left-4 right-20 */
--nav-fab-gap: 64px;          /* Space for FAB (right-20 = 80px) */
```

### FAB Button
```css
--fab-size: 56px;             /* w-14 h-14 */
--fab-icon-size: 24px;        /* h-6 w-6 */
--fab-bottom-offset: 16px;    /* bottom-4 */
--fab-right-offset: 16px;     /* right-4 */
```

### Active Pill
```css
--pill-padding-x: 12px;       /* px-3 */
--pill-padding-y: 8px;        /* py-2 */
--pill-gap: 6px;              /* gap-1.5 */
--pill-icon-size: 16px;       /* h-4 w-4 */
--pill-font-size: 12px;       /* text-xs */
```

### Radial Menu
```css
--radial-radius: 80px;        /* Distance from FAB center */
--radial-start-angle: -90deg; /* Start from top */
--radial-spread: 45deg;       /* Angle between items */
--radial-item-padding: 8px 12px;
```

## Typography

### Navigation Labels
```css
/* Active state label */
--nav-label-active: {
  font-size: 12px;      /* text-xs */
  font-weight: 600;     /* font-semibold */
  line-height: 1;
}

/* FAB menu item label */
--fab-menu-label: {
  font-size: 12px;      /* text-xs */
  font-weight: 500;     /* font-medium */
  white-space: nowrap;
}
```

## Shadows

### Navigation Bar Shadow
```css
--nav-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -2px rgba(0, 0, 0, 0.1);
/* Equivalent: shadow-lg */
```

### FAB Shadow
```css
--fab-shadow-default: 0 10px 15px -3px rgba(16, 185, 129, 0.3),
                      0 4px 6px -4px rgba(16, 185, 129, 0.3);
/* Equivalent: shadow-lg shadow-emerald-500/30 */

--fab-shadow-hover: 0 20px 25px -5px rgba(16, 185, 129, 0.3),
                    0 8px 10px -6px rgba(16, 185, 129, 0.3);
/* Equivalent: shadow-xl */
```

### Active Pill Shadow
```css
--pill-shadow: 0 10px 15px -3px rgba(var(--primary), 0.25);
/* Equivalent: shadow-lg shadow-primary/25 */
```

## Border Radius

```css
--nav-radius: 9999px;         /* rounded-full (pill shape) */
--fab-radius: 9999px;         /* rounded-full */
--pill-radius: 9999px;        /* rounded-full */
--menu-item-radius: 9999px;   /* rounded-full */
```

## Animations

### Timing Functions
```css
--ease-out: cubic-bezier(0.33, 1, 0.68, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Durations
```css
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

### Stagger Delays
```css
--stagger-delay: 50ms;  /* Delay between each radial menu item */
```

### Keyframes

```css
/* FAB rotation on open */
@keyframes fab-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(45deg); }
}

/* Menu item pop-in */
@keyframes pop-in {
  0% {
    opacity: 0;
    transform: scale(0) translate(0, 0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translate(var(--x), var(--y));
  }
}

/* Active pill expand */
@keyframes pill-expand {
  0% {
    width: 44px;
    padding: 12px;
  }
  100% {
    width: auto;
    padding: 8px 12px;
  }
}
```

## Z-Index Scale

```css
--z-nav: 50;          /* Bottom navigation */
--z-fab: 50;          /* FAB button */
--z-backdrop: 40;     /* FAB menu backdrop */
--z-fab-menu: 50;     /* FAB menu items */
```

## Safe Areas

```css
/* iOS Safe Area Support */
--safe-area-bottom: env(safe-area-inset-bottom, 0px);

/* Apply to navigation */
.nav-with-safe-area {
  padding-bottom: calc(var(--nav-bottom-offset) + var(--safe-area-bottom));
}
```

## Tailwind Configuration

```javascript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      animation: {
        'fab-spin': 'fab-rotate 0.3s ease-out forwards',
        'pop-in': 'pop-in 0.3s var(--ease-spring) forwards',
      },
      keyframes: {
        'fab-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(45deg)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
    },
  },
}
```

## Responsive Breakpoints

```css
/* Mobile navigation visible */
@media (max-width: 1023px) {
  .mobile-nav { display: flex; }
  .desktop-nav { display: none; }
}

/* Desktop navigation visible */
@media (min-width: 1024px) {
  .mobile-nav { display: none; }
  .desktop-nav { display: flex; }
}
```
