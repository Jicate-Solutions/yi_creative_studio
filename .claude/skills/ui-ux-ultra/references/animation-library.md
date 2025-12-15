# Animation Library Reference

## Overview

This document catalogs all animation utilities available in Yi CreativeStudio's design system, including keyframes, timing functions, and usage patterns.

## Animation Keyframes (from globals.css)

### Float Animation

Gentle floating motion for decorative elements.

```css
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}
```

Usage:
```tsx
<div className="animate-float">
  Floating element
</div>
```

### Shimmer Animation

Loading shimmer effect for skeletons.

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-shimmer {
  animation: shimmer 1.5s ease-in-out infinite;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  background-size: 200% 100%;
}
```

### Pulse Slow

Slow, gentle pulse for attention.

```css
@keyframes pulse-slow {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.animate-pulse-slow {
  animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

### Fade In Up

Entry animation for content.

```css
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
}
```

### Button Animations

Press effect for buttons.

```css
@keyframes button-press {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.97); }
}

.button-press {
  animation: button-press 0.15s ease-out;
}
```

### FAB Animations

Floating Action Button effects.

```css
@keyframes fab-pop-in {
  from {
    opacity: 0;
    transform: scale(0.5) rotate(-180deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes fab-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(0, 91, 150, 0.4); }
  50% { box-shadow: 0 0 0 10px rgba(0, 91, 150, 0); }
}

.fab-pop-in {
  animation: fab-pop-in 0.3s var(--ease-spring) forwards;
}

.fab-pulse {
  animation: fab-pulse 2s ease-in-out infinite;
}
```

### Stagger Animation

For lists and grids.

```css
@keyframes stagger-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stagger-children > * {
  animation: stagger-in 0.3s ease-out forwards;
  opacity: 0;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
/* ... continues */
```

Usage:
```tsx
<ul className="stagger-children">
  <li>First item</li>
  <li>Second item</li>
  <li>Third item</li>
</ul>
```

## Timing Functions

### Spring Easing

Natural, bouncy motion.

```css
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

Characteristics:
- Overshoots target slightly
- Creates playful, organic feel
- Best for: buttons, toggles, popups

### Expo Out

Quick start, smooth finish.

```css
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
```

Characteristics:
- Fast initial movement
- Gradual deceleration
- Best for: page transitions, large movements

### Soft In-Out

Balanced, professional motion.

```css
--ease-in-out-soft: cubic-bezier(0.4, 0, 0.2, 1);
```

Characteristics:
- Smooth acceleration and deceleration
- Standard Material Design timing
- Best for: general UI transitions

## Transition Utilities

### Duration Classes

| Class | Duration | Use Case |
|-------|----------|----------|
| `duration-75` | 75ms | Micro-interactions |
| `duration-100` | 100ms | Button states |
| `duration-150` | 150ms | Quick feedback |
| `duration-200` | 200ms | Standard transitions |
| `duration-300` | 300ms | Card animations |
| `duration-500` | 500ms | Page transitions |

### Common Patterns

```tsx
// Hover lift effect
<div className="
  transition-all duration-200 ease-out
  hover:-translate-y-1
  hover:shadow-lg
">
  Lift on Hover
</div>

// Active press effect
<button className="
  transition-transform duration-150
  active:scale-[0.98]
">
  Press Me
</button>

// Spring animation
<div className="
  transition-all duration-300
  [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]
">
  Spring Motion
</div>
```

## Hover Utilities

### Hover Lift

```tsx
<div className="hover-lift">
  /* Equivalent to:
  transition: all 200ms ease-out;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  }
  */
</div>
```

### Active Press

```tsx
<button className="active-press">
  /* Equivalent to:
  transition: transform 150ms ease-out;
  &:active {
    transform: scale(0.98);
  }
  */
</button>
```

## Animation Levels

### None

No animations, instant state changes.

```tsx
<div className="transition-none">
  Static element
</div>
```

### Minimal

Only essential feedback animations.

```tsx
<button className="
  transition-colors duration-100
  hover:bg-slate-100
">
  Minimal hover
</button>
```

### Standard (Default)

Balanced animations for professional feel.

```tsx
<div className="
  transition-all duration-200
  hover:shadow-md hover:-translate-y-0.5
">
  Standard card
</div>
```

### Enhanced

Rich animations with multiple properties.

```tsx
<div className="
  transition-all duration-300
  [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]
  hover:shadow-xl hover:-translate-y-2
  hover:scale-[1.02]
">
  Enhanced card
</div>
```

### Premium

Full animation suite with special effects.

```tsx
<div className="
  group
  transition-all duration-300
  [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)]
  hover:shadow-[0_20px_50px_rgba(0,91,150,0.3)]
  hover:-translate-y-3
  hover:scale-[1.03]
">
  <div className="
    absolute inset-0 opacity-0
    group-hover:opacity-100
    transition-opacity duration-500
    bg-gradient-to-r from-yi-blue/10 to-yi-teal/10
    rounded-inherit
  " />
  Premium card with glow
</div>
```

## Reduced Motion Support

Always respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

React hook for conditional animations:

```tsx
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
```

## Best Practices

1. **Keep durations short** - UI animations should be 100-300ms
2. **Use spring for playful** - Buttons, toggles, popups
3. **Use expo for smooth** - Page transitions, large movements
4. **Respect reduced motion** - Always provide fallbacks
5. **Don't animate layout** - Avoid animating width/height (use transform)
6. **Use GPU-accelerated properties** - transform, opacity only
