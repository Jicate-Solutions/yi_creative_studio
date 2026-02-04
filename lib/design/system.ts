/**
 * Yi CreativeStudio Design System
 *
 * Centralized design tokens for consistent UI/UX across the application.
 * Based on Modern Minimal aesthetic with spacious layout.
 */

// ========================================
// SPACING SCALE (Spacious - 24-32px gaps)
// ========================================
export const spacing = {
  // Component spacing
  xs: '0.5rem',    // 8px - tight inline gaps
  sm: '0.75rem',   // 12px - small component padding
  md: '1rem',      // 16px - standard component padding
  lg: '1.5rem',    // 24px - section gaps (recommended default)
  xl: '2rem',      // 32px - large section gaps
  '2xl': '2.5rem', // 40px - major section dividers
  '3xl': '3rem',   // 48px - page section gaps

  // Layout spacing
  page: {
    padding: '2rem',      // 32px - default page padding
    paddingMobile: '1rem', // 16px - mobile page padding
    gutter: '1.5rem',     // 24px - grid gutter
  },

  // Card spacing
  card: {
    padding: '1.5rem',       // 24px - card internal padding
    gap: '1.5rem',           // 24px - gap between cards
    compactPadding: '1rem',  // 16px - compact card padding
  },

  // Form spacing
  form: {
    fieldGap: '1.5rem',    // 24px - gap between form fields
    sectionGap: '2rem',    // 32px - gap between form sections
    labelGap: '0.5rem',    // 8px - gap between label and input
  },
} as const

// ========================================
// ELEVATION SYSTEM (Shadows)
// ========================================
export const elevation = {
  none: 'shadow-none',
  xs: 'shadow-sm',                                                      // Subtle depth
  sm: 'shadow-md',                                                      // Light elevation
  md: 'shadow-lg shadow-black/5',                                       // Standard cards
  lg: 'shadow-xl shadow-black/10',                                      // Raised elements
  xl: 'shadow-2xl shadow-black/15',                                     // Floating items

  // Interactive shadows (hover states)
  hover: {
    sm: 'hover:shadow-lg hover:shadow-black/8 transition-shadow',
    md: 'hover:shadow-xl hover:shadow-black/12 transition-shadow',
    lg: 'hover:shadow-2xl hover:shadow-black/15 transition-shadow',
  },

  // Brand-colored shadows
  primary: 'shadow-lg shadow-primary/20',
  secondary: 'shadow-lg shadow-secondary/20',
} as const

// ========================================
// TYPOGRAPHY SCALE
// ========================================
export const typography = {
  // Display (Hero headlines)
  display: {
    1: 'text-6xl font-bold tracking-tight leading-none',       // 60px
    2: 'text-5xl font-bold tracking-tight leading-tight',      // 48px
    3: 'text-4xl font-bold tracking-tight leading-tight',      // 36px
  },

  // Headings
  h1: 'text-3xl font-bold tracking-tight',                     // 30px - Page title
  h2: 'text-2xl font-semibold tracking-tight',                 // 24px - Section title
  h3: 'text-xl font-semibold',                                 // 20px - Subsection title
  h4: 'text-lg font-semibold',                                 // 18px - Card title
  h5: 'text-base font-semibold',                               // 16px - Small heading
  h6: 'text-sm font-semibold',                                 // 14px - Smallest heading

  // Body text
  body: {
    lg: 'text-lg leading-relaxed',                             // 18px - Large body
    md: 'text-base leading-relaxed',                           // 16px - Standard body
    sm: 'text-sm leading-relaxed',                             // 14px - Small body
    xs: 'text-xs leading-relaxed',                             // 12px - Caption
  },

  // Special
  label: 'text-sm font-medium',                                // Form labels
  caption: 'text-xs text-muted-foreground',                    // Helper text
  code: 'font-mono text-sm',                                   // Code blocks
} as const

// ========================================
// ANIMATION & TRANSITIONS
// ========================================
export const animation = {
  // Transition durations
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
    slower: '500ms',
  },

  // Easing functions
  easing: {
    default: 'ease-in-out',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    outExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Pre-built transitions
  transitions: {
    base: 'transition-all duration-200 ease-in-out',
    fast: 'transition-all duration-150 ease-in-out',
    slow: 'transition-all duration-300 ease-in-out',
    colors: 'transition-colors duration-200',
    transform: 'transition-transform duration-200 ease-out',
  },

  // Hover effects
  hover: {
    lift: 'hover:-translate-y-1 transition-transform duration-200',
    scale: 'hover:scale-105 transition-transform duration-200',
    glow: 'hover:shadow-lg hover:shadow-primary/30 transition-shadow duration-200',
  },

  // Loading states
  loading: {
    spin: 'animate-spin',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
  },
} as const

// ========================================
// BORDER RADIUS
// ========================================
export const radius = {
  none: 'rounded-none',
  sm: 'rounded-sm',       // 2px
  md: 'rounded-md',       // 6px - Default
  lg: 'rounded-lg',       // 8px - Cards
  xl: 'rounded-xl',       // 12px - Large cards
  '2xl': 'rounded-2xl',   // 16px - Prominent elements
  '3xl': 'rounded-3xl',   // 24px - Hero elements
  full: 'rounded-full',   // Pills, avatars
} as const

// ========================================
// COMPONENT STYLES
// ========================================
export const components = {
  // Button styles (Solid with subtle shadow)
  button: {
    base: `
      inline-flex items-center justify-center gap-2
      font-semibold transition-all duration-200
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:pointer-events-none
    `,

    variants: {
      primary: `
        bg-primary text-white
        shadow-md shadow-primary/20
        hover:shadow-lg hover:shadow-primary/30
        hover:scale-[1.02] active:scale-[0.98]
      `,
      secondary: `
        bg-secondary text-white
        shadow-md shadow-secondary/20
        hover:shadow-lg hover:shadow-secondary/30
        hover:scale-[1.02] active:scale-[0.98]
      `,
      outline: `
        border-2 border-border
        hover:bg-muted/50 hover:border-primary/50
        transition-colors
      `,
      ghost: `
        hover:bg-muted/50
        transition-colors
      `,
      destructive: `
        bg-destructive text-destructive-foreground
        shadow-md shadow-destructive/20
        hover:shadow-lg hover:shadow-destructive/30
      `,
    },

    sizes: {
      sm: 'h-9 px-4 text-sm rounded-lg',
      md: 'h-10 px-6 text-base rounded-lg',
      lg: 'h-12 px-8 text-base rounded-xl',
      xl: 'h-14 px-10 text-lg rounded-xl',
      icon: 'h-10 w-10 rounded-lg',
    },
  },

  // Card styles
  card: {
    base: `
      bg-card rounded-xl border border-border/50
      shadow-md shadow-black/5
      transition-all duration-200
    `,
    interactive: `
      hover:shadow-lg hover:shadow-black/10
      hover:border-primary/30
      hover:-translate-y-1
      cursor-pointer
    `,
    glass: `
      bg-white/60 dark:bg-black/20
      backdrop-blur-xl border border-white/20
      shadow-xl
    `,
  },

  // Input styles
  input: {
    base: `
      flex h-10 w-full rounded-lg border border-input
      bg-background px-3 py-2 text-sm
      transition-colors duration-200
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20
      focus-visible:border-primary
      disabled:cursor-not-allowed disabled:opacity-50
    `,
    // Validation states
    valid: `
      border-green-500 focus-visible:ring-green-500/20
    `,
    invalid: `
      border-destructive focus-visible:ring-destructive/20
    `,
  },

  // Page header
  pageHeader: `
    flex flex-col gap-2 mb-8
  `,

  pageTitle: `
    text-3xl font-bold tracking-tight
  `,

  pageDescription: `
    text-muted-foreground text-base
  `,
} as const

// ========================================
// LAYOUT PATTERNS
// ========================================
export const layout = {
  // Container widths
  container: {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-7xl',
    full: 'max-w-full',
  },

  // Grid patterns
  grid: {
    auto: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    cards: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
    dashboard: 'grid grid-cols-12 gap-6',
  },

  // Flex patterns
  flex: {
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
    start: 'flex items-start',
    col: 'flex flex-col',
    colCenter: 'flex flex-col items-center justify-center',
  },
} as const

// ========================================
// BRAND COLORS (Yi CreativeStudio)
// ========================================
export const brandColors = {
  primary: {
    DEFAULT: '#005B96',    // Yi Blue
    light: '#0077C2',
    dark: '#003D64',
    contrast: '#ffffff',
  },
  secondary: {
    DEFAULT: '#FF6B35',    // Yi Orange
    light: '#FF8559',
    dark: '#CC5529',
    contrast: '#ffffff',
  },
  accent: {
    DEFAULT: '#00A86B',    // Yi Green
    light: '#00C17C',
    dark: '#008556',
    contrast: '#ffffff',
  },
} as const

// ========================================
// UTILITY CLASSES
// ========================================
export const utils = {
  // Focus states
  focus: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',

  // Truncation
  truncate: 'truncate',
  lineClamp: (lines: number) => `line-clamp-${lines}`,

  // Scroll
  scrollSmooth: 'scroll-smooth',
  scrollHidden: 'scrollbar-hide',

  // Backdrop blur
  blur: {
    sm: 'backdrop-blur-sm',
    md: 'backdrop-blur-md',
    lg: 'backdrop-blur-lg',
    xl: 'backdrop-blur-xl',
  },
} as const

/**
 * Helper function to combine design system classes
 */
export function cx(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}
