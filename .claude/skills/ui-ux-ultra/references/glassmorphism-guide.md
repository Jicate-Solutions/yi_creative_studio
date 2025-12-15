# Glassmorphism Implementation Guide

## Overview

Glassmorphism is a design style featuring frosted-glass effects with transparency, blur, and subtle borders. This guide covers implementation patterns for Yi CreativeStudio.

## CSS Classes (from globals.css)

### Available Classes

| Class | White/Dark Opacity | Blur | Border |
|-------|-------------------|------|--------|
| `glass-subtle` | 50%/80% | 12px | white/10 |
| `glass-medium` | 70%/85% | 16px | white/20 |
| `glass-strong` | 80%/88% | 20px | white/30 |
| `glass-premium` | 85%/90% | 20px | white/40 |
| `glass-card` | 70%/85% | 20px | white/30 + hover |

### CSS Implementation

```css
/* Base glass effect */
.glass-medium {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Dark mode */
.dark .glass-medium {
  background: rgba(30, 41, 59, 0.85);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Premium with glow */
.glass-premium {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow:
    0 8px 32px rgba(0, 91, 150, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
```

## Tailwind Utilities

### Basic Glass Card

```tsx
<div className="
  bg-white/70 dark:bg-slate-900/70
  backdrop-blur-xl
  border border-white/30 dark:border-white/10
  rounded-xl
  shadow-lg
">
  Content
</div>
```

### With Hover Effects

```tsx
<div className="
  glass-medium
  rounded-xl p-6
  transition-all duration-200
  hover:shadow-[var(--shadow-card-hover)]
  hover:-translate-y-0.5
  active:scale-[0.98]
">
  Interactive Card
</div>
```

### Gradient Border Glass

```tsx
<div className="relative p-[1px] rounded-xl bg-gradient-to-r from-yi-blue to-yi-teal">
  <div className="glass-strong rounded-xl p-6">
    Gradient Border Card
  </div>
</div>
```

## Performance Considerations

### GPU Acceleration

`backdrop-filter` triggers GPU compositing. Optimize by:

1. **Limit glass elements**: Avoid stacking multiple glass layers
2. **Use will-change sparingly**: Only on elements that animate
3. **Reduce blur radius**: Higher blur = more GPU work

```tsx
// Good: Single glass layer
<div className="glass-medium">
  <h2>Title</h2>
  <p>Content</p>
</div>

// Avoid: Nested glass layers
<div className="glass-medium">
  <div className="glass-subtle"> // Extra GPU work
    Content
  </div>
</div>
```

### Browser Support

| Browser | Support |
|---------|---------|
| Chrome | Full |
| Firefox | Full |
| Safari | -webkit prefix required |
| Edge | Full |
| iOS Safari | -webkit prefix required |

Always include both properties:
```css
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
```

## Accessibility

### Contrast Requirements

Glass effects reduce contrast. Ensure text meets WCAG AA:

| Text Size | Required Ratio |
|-----------|----------------|
| Normal (<18px) | 4.5:1 |
| Large (>18px bold) | 3:1 |

```tsx
// Good: High contrast text
<div className="glass-medium">
  <h2 className="text-slate-900 dark:text-white font-bold">
    Readable Title
  </h2>
</div>

// Add semi-transparent backing if needed
<div className="glass-subtle">
  <p className="bg-white/50 dark:bg-black/30 px-2 py-1 rounded">
    Enhanced readability
  </p>
</div>
```

### Reduced Motion

Respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  .glass-card {
    transition: none;
  }
}
```

## Common Patterns

### Glass Navigation

```tsx
<nav className="
  fixed top-0 w-full z-50
  glass-medium
  border-b border-white/10
">
  <div className="container mx-auto px-4 h-16 flex items-center">
    Navigation
  </div>
</nav>
```

### Glass Modal

```tsx
<dialog className="
  glass-premium
  rounded-2xl p-8
  max-w-md w-full
  shadow-2xl
">
  <h2 className="text-xl font-bold">Modal Title</h2>
  <p>Modal content with premium glass effect</p>
</dialog>
```

### Glass Input

```tsx
<input
  type="text"
  className="
    w-full px-4 py-3
    glass-subtle
    rounded-lg
    border border-white/20
    focus:border-yi-blue/50
    focus:ring-2 focus:ring-yi-blue/20
    placeholder:text-slate-400
    transition-all
  "
  placeholder="Glass input..."
/>
```

### Glass Button

```tsx
<button className="
  glass-medium
  px-6 py-3
  rounded-lg
  font-semibold
  text-yi-blue
  hover:bg-white/80
  active:scale-[0.98]
  transition-all duration-200
">
  Glass Button
</button>
```

## Dark Mode Handling

Glass effects need different opacity in dark mode:

```tsx
// Automatic dark mode adjustment
<div className="
  bg-white/70 dark:bg-slate-900/85
  backdrop-blur-xl
  border border-white/30 dark:border-white/10
">
  Adapts to theme
</div>
```

## Combining with Shadows

Layer shadows with glass for depth:

```tsx
<div className="
  glass-premium
  shadow-lg
  hover:shadow-xl
  transition-shadow
">
  Shadow + Glass
</div>

// Premium glow effect
<div className="
  glass-premium
  shadow-[0_8px_32px_rgba(0,91,150,0.2)]
">
  Glass with Brand Glow
</div>
```

## Best Practices

1. **Use sparingly** - Glass effects are premium, not default
2. **Ensure contrast** - Always verify text readability
3. **Test on backgrounds** - Glass looks different on various backgrounds
4. **Add fallbacks** - For older browsers without backdrop-filter
5. **Consider performance** - Limit on mobile/low-power devices
