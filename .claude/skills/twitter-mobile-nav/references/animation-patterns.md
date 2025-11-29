# Animation Patterns - Twitter Mobile Navigation

## Core Animation Principles

### 1. Natural Motion
- Use spring-based easing for organic feel
- Avoid linear animations (feels robotic)
- Match real-world physics expectations

### 2. Purposeful Animation
- Every animation should have meaning
- Guide user attention
- Provide feedback for interactions

### 3. Performance First
- Use transform and opacity only
- Avoid layout-triggering properties
- Use will-change sparingly

---

## Bottom Navigation Animations

### Active Pill Transition

When switching between tabs, the active indicator should smoothly transition.

```css
/* Base transition for all nav items */
.nav-item {
  transition: all 300ms cubic-bezier(0.33, 1, 0.68, 1);
}

/* Active pill expansion */
.nav-item-active {
  animation: pill-expand 300ms ease-out forwards;
}

@keyframes pill-expand {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

### Tailwind Implementation

```tsx
<Link
  href={item.href}
  className={cn(
    "transition-all duration-300 ease-out",
    "active:scale-95" // Press feedback
  )}
>
  {active ? (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-2 rounded-full",
      "bg-primary text-primary-foreground",
      "animate-in fade-in zoom-in-95 duration-300"
    )}>
      <Icon className="h-4 w-4" />
      <span className="text-xs font-semibold">{item.title}</span>
    </div>
  ) : (
    <div className="p-3">
      <Icon className={cn(
        "h-5 w-5 text-muted-foreground",
        "transition-colors duration-200"
      )} />
    </div>
  )}
</Link>
```

### Icon Bounce on Tap

```css
@keyframes icon-bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.9); }
}

.nav-icon:active {
  animation: icon-bounce 150ms ease-out;
}
```

---

## FAB Animations

### FAB Button States

```css
/* Default state */
.fab-button {
  transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Hover state */
.fab-button:hover {
  transform: scale(1.05);
  box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.4);
}

/* Active/pressed state */
.fab-button:active {
  transform: scale(0.95);
}

/* Open state - icon rotation */
.fab-button[data-open="true"] .fab-icon {
  transform: rotate(45deg);
}
```

### Tailwind Implementation

```tsx
<button
  onClick={toggleFab}
  className={cn(
    "w-14 h-14 rounded-full",
    "bg-gradient-to-br from-emerald-500 to-teal-500",
    "shadow-lg shadow-emerald-500/30",
    "transition-all duration-300",
    "hover:shadow-xl hover:scale-105",
    "active:scale-95"
  )}
>
  <Plus className={cn(
    "h-6 w-6 text-white",
    "transition-transform duration-300",
    fabOpen && "rotate-45"
  )} />
</button>
```

---

## Radial Menu Animation

### Staggered Fan-Out

Items should animate out one by one with slight delay.

```typescript
// Calculate position and delay for each item
const menuItems.map((item, index) => {
  const angle = -90 - (index * 45) // Start from top
  const radius = 80
  const delay = index * 50 // 50ms stagger

  return {
    ...item,
    x: Math.cos((angle * Math.PI) / 180) * radius,
    y: Math.sin((angle * Math.PI) / 180) * radius,
    delay,
  }
})
```

### CSS Animation

```css
@keyframes radial-item-in {
  0% {
    opacity: 0;
    transform: scale(0) translate(0, 0);
  }
  100% {
    opacity: 1;
    transform: scale(1) translate(var(--x), var(--y));
  }
}

@keyframes radial-item-out {
  0% {
    opacity: 1;
    transform: scale(1) translate(var(--x), var(--y));
  }
  100% {
    opacity: 0;
    transform: scale(0) translate(0, 0);
  }
}

.radial-item {
  animation: radial-item-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  animation-delay: var(--delay);
}

.radial-item[data-closing="true"] {
  animation: radial-item-out 200ms ease-in forwards;
  animation-delay: calc(var(--total-items) - var(--index)) * 30ms;
}
```

### Tailwind Implementation

```tsx
{menuItems.map((item, index) => (
  <Link
    key={item.href}
    href={item.href}
    className={cn(
      "absolute bottom-0 right-0",
      "flex items-center gap-2 px-3 py-2 rounded-full",
      "bg-background border shadow-lg",
      "transition-all duration-300",
      fabOpen
        ? "opacity-100 scale-100"
        : "opacity-0 scale-0 pointer-events-none"
    )}
    style={{
      transform: fabOpen
        ? `translate(${x}px, ${y}px)`
        : 'translate(0, 0)',
      transitionDelay: fabOpen ? `${index * 50}ms` : '0ms',
      transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    }}
  >
    <Icon className="h-4 w-4" />
    <span className="text-xs font-medium">{item.title}</span>
  </Link>
))}
```

---

## Backdrop Animation

### Fade In/Out

```css
.backdrop {
  transition: opacity 300ms ease-out;
}

.backdrop[data-open="false"] {
  opacity: 0;
  pointer-events: none;
}

.backdrop[data-open="true"] {
  opacity: 1;
  pointer-events: auto;
}
```

### Blur Animation (Experimental)

```css
.backdrop {
  transition: opacity 300ms ease-out,
              backdrop-filter 300ms ease-out;
}

.backdrop[data-open="false"] {
  opacity: 0;
  backdrop-filter: blur(0px);
}

.backdrop[data-open="true"] {
  opacity: 1;
  backdrop-filter: blur(4px);
}
```

### Tailwind Implementation

```tsx
{fabOpen && (
  <div
    className={cn(
      "fixed inset-0 z-40",
      "bg-black/40 backdrop-blur-sm",
      "animate-in fade-in duration-300"
    )}
    onClick={() => setFabOpen(false)}
  />
)}
```

---

## Micro-Interactions

### Haptic Feedback (Mobile)

```typescript
const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  if ('vibrate' in navigator) {
    const durations = { light: 10, medium: 20, heavy: 30 }
    navigator.vibrate(durations[type])
  }
}

// Usage
<button
  onClick={() => {
    triggerHaptic('light')
    toggleFab()
  }}
>
```

### Ripple Effect

```css
.ripple-container {
  position: relative;
  overflow: hidden;
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(0);
  animation: ripple 400ms ease-out;
  pointer-events: none;
}

@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
```

### Press Scale

```tsx
<button
  className={cn(
    "transition-transform duration-150",
    "active:scale-95"
  )}
>
```

---

## Reduced Motion Support

Always respect user preferences for reduced motion.

```css
@media (prefers-reduced-motion: reduce) {
  .nav-item,
  .fab-button,
  .radial-item,
  .backdrop {
    transition: none !important;
    animation: none !important;
  }
}
```

### Tailwind Implementation

```tsx
<div
  className={cn(
    "transition-all duration-300",
    "motion-reduce:transition-none motion-reduce:animate-none"
  )}
>
```

### React Hook

```typescript
function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return prefersReducedMotion
}

// Usage
const prefersReducedMotion = usePrefersReducedMotion()

<div
  style={{
    transitionDuration: prefersReducedMotion ? '0ms' : '300ms'
  }}
>
```

---

## Animation Timeline Examples

### Tab Switch Animation

```
Time:    0ms    100ms   200ms   300ms
         |       |       |       |
Old Tab: [Pill shrinks and fades out  ]
New Tab:         [       Pill grows and fades in]
Icon:    [Scale down     ][Scale up              ]
```

### FAB Open Animation

```
Time:    0ms    50ms    100ms   150ms   200ms   250ms   300ms
         |      |       |       |       |       |       |
FAB:     [Icon rotates 45deg                            ]
Backdrop:[       Fades in with blur                     ]
Item 1:          [Pops out to position                  ]
Item 2:                  [Pops out to position          ]
Item 3:                          [Pops out to position  ]
Item 4:                                  [Pops out      ]
```

### FAB Close Animation

```
Time:    0ms    50ms    100ms   150ms   200ms
         |      |       |       |       |
Item 4:  [Pops back     ]
Item 3:          [Pops back     ]
Item 2:                  [Pops back     ]
Item 1:                          [Pops back]
Backdrop:[       Fades out              ]
FAB:     [Icon rotates back             ]
```

---

## Framer Motion Alternative

If using Framer Motion for more complex animations:

```tsx
import { motion, AnimatePresence } from 'framer-motion'

const menuVariants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    x: getRadialPosition(i).x,
    y: getRadialPosition(i).y,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
      delay: i * 0.05,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0,
    transition: { duration: 0.2 },
  },
}

<AnimatePresence>
  {fabOpen && menuItems.map((item, i) => (
    <motion.div
      key={item.href}
      custom={i}
      variants={menuVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      ...
    </motion.div>
  ))}
</AnimatePresence>
```
