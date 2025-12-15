# UI/UX Design Patterns Reference

## Yi Brand Identity

### Core Values
- **Professional**: Clean, modern, trustworthy
- **Innovative**: Forward-thinking, tech-savvy
- **Community**: Welcoming, inclusive, collaborative
- **Premium**: High-quality, attention to detail

### Brand Colors

| Color | Hex | Usage |
|-------|-----|-------|
| Yi Blue | #005B96 | Primary actions, headers, links |
| Yi Orange | #FF6B35 | CTAs, highlights, alerts |
| Yi Green | #00A86B | Success states, accents |
| Yi Teal | #1B998B | Dark mode accents, gradients |
| Yi Gold | #D4AF37 | Premium features, badges |
| Yi Navy | #1a2332 | Dark backgrounds |

### Typography Scale

```css
/* Headings */
.text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }

/* Body */
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
```

### Font Weights

| Weight | Class | Usage |
|--------|-------|-------|
| 400 | `font-normal` | Body text |
| 500 | `font-medium` | Labels, captions |
| 600 | `font-semibold` | Buttons, headers |
| 700 | `font-bold` | Primary headings |

## Layout Patterns

### Container

```tsx
<div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
  Content
</div>
```

### Grid Systems

```tsx
// 2-column responsive
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

// 3-column responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">

// 4-column responsive
<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
```

### Section Spacing

```tsx
// Hero section
<section className="py-12 md:py-20 lg:py-24">

// Content section
<section className="py-8 md:py-12 lg:py-16">

// Compact section
<section className="py-6 md:py-8">
```

## Component Patterns

### Card Anatomy

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content
  </CardContent>
  <CardFooter>
    Actions
  </CardFooter>
</Card>
```

### Form Layout

```tsx
<form className="space-y-6">
  <div className="space-y-2">
    <Label htmlFor="field">Label</Label>
    <Input id="field" placeholder="Placeholder" />
    <p className="text-sm text-muted-foreground">Helper text</p>
  </div>

  <div className="flex gap-4">
    <Button type="submit">Submit</Button>
    <Button type="button" variant="outline">Cancel</Button>
  </div>
</form>
```

### Modal/Dialog Pattern

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    Content
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

## Visual Hierarchy

### Emphasis Levels

1. **Primary**: Largest, boldest, most colorful
2. **Secondary**: Smaller, less bold, muted colors
3. **Tertiary**: Smallest, lightest weight, subtle

```tsx
// Primary heading
<h1 className="text-4xl font-bold text-slate-900 dark:text-white">
  Primary
</h1>

// Secondary heading
<h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
  Secondary
</h2>

// Tertiary text
<p className="text-sm text-muted-foreground">
  Tertiary
</p>
```

### Focus States

```tsx
// Default focus ring
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

// Brand focus ring
className="focus-visible:ring-[#005B96] focus-visible:ring-offset-2"
```

## Responsive Breakpoints

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `sm:` | 640px | Large phones |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Laptops |
| `xl:` | 1280px | Desktops |
| `2xl:` | 1536px | Large screens |

### Mobile-First Pattern

```tsx
// Start with mobile, enhance for larger screens
<div className="
  px-4        // Mobile: 16px padding
  md:px-6     // Tablet: 24px padding
  lg:px-8     // Desktop: 32px padding
">
```

## Dark Mode Patterns

### Background Colors

```tsx
// Page background
bg-[#F5FAFD] dark:bg-[#0C1825]

// Card background
bg-white dark:bg-slate-800

// Glass background
bg-white/70 dark:bg-slate-900/85
```

### Text Colors

```tsx
// Primary text
text-slate-900 dark:text-white

// Secondary text
text-slate-700 dark:text-slate-300

// Muted text
text-slate-500 dark:text-slate-400
```

### Border Colors

```tsx
// Default border
border-slate-200 dark:border-slate-700

// Glass border
border-white/30 dark:border-white/10

// Subtle border
border-slate-100 dark:border-slate-800
```

## Accessibility Patterns

### Touch Targets

Minimum 44x44px for touch devices:

```tsx
<button className="min-h-[44px] min-w-[44px] px-4">
  Touch-friendly
</button>
```

### Color Contrast

- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum

### Screen Reader Text

```tsx
// Visually hidden but accessible
<span className="sr-only">Screen reader only</span>

// Skip link
<a href="#main" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Keyboard Navigation

```tsx
// Focusable element
tabIndex={0}
onKeyDown={(e) => e.key === 'Enter' && handleAction()}

// Focus trap in modals
// (handled by Radix Dialog)
```

## Animation Guidelines

### Duration Guide

| Duration | Use Case |
|----------|----------|
| 75-100ms | Micro-interactions (button states) |
| 150-200ms | Standard transitions (hover, focus) |
| 200-300ms | Component animations (cards, modals) |
| 300-500ms | Page transitions |

### Performance Tips

1. Only animate `transform` and `opacity`
2. Use `will-change` sparingly
3. Avoid animating `width`, `height`, `margin`
4. Respect `prefers-reduced-motion`

```tsx
// GPU-accelerated animation
className="transform hover:-translate-y-1 hover:scale-105 transition-transform"

// Avoid (triggers layout)
className="hover:w-full hover:h-full"
```
