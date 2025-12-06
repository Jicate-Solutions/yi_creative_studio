/**
 * Gemini Optimized Prompt Schema
 *
 * JSON-structured schema that Gemini understands best for image generation.
 * This provides precise, measurable specifications instead of vague prose.
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | '3:4' | '2:3' | '21:9'

export type LayoutType =
  | 'centered'
  | 'rule-of-thirds'
  | 'asymmetric'
  | 'golden-ratio'
  | 'diagonal'
  | 'grid'

export type FocalPoint =
  | 'center'
  | 'upper-third'
  | 'lower-third'
  | 'left-third'
  | 'right-third'
  | 'golden-ratio-left'
  | 'golden-ratio-right'

export type TypographySystem =
  | 'geometric-sans'    // Inter, Poppins, Montserrat
  | 'humanist-sans'     // Open Sans, Source Sans
  | 'neo-grotesque'     // Helvetica, Arial, Roboto
  | 'serif-classical'   // Times, Georgia, Garamond
  | 'serif-modern'      // Playfair, Lora
  | 'display'           // Impact, decorative headers
  | 'monospace'         // Fira Code, technical

export type FontWeight = 300 | 400 | 500 | 600 | 700 | 800 | 900

export type LetterSpacing = 'tight' | 'normal' | 'loose' | 'extra-loose'

export type VisualStyle =
  | 'photorealistic'
  | 'illustrated'
  | 'abstract'
  | 'minimalist'
  | 'mixed-media'

export type ProductionStandard =
  | 'web'              // 72 DPI equivalent
  | 'print-standard'   // 150 DPI equivalent
  | 'print-premium'    // 300 DPI equivalent
  | 'large-format'     // Billboards, banners

export type WCAGLevel = 'AA' | 'AAA'

export type ColorPalette =
  | 'complementary'    // Opposite on color wheel
  | 'analogous'        // Adjacent on color wheel
  | 'triadic'          // Three evenly spaced
  | 'split-complementary'
  | 'monochromatic'

// ============================================================================
// TECHNICAL SPECIFICATIONS
// ============================================================================

export interface TechnicalSpecs {
  format: string
  aspectRatio: AspectRatio
  dimensions: {
    width: number
    height: number
  }
  colorSpace?: 'sRGB' | 'P3' | 'CMYK'
  resolution?: '1K' | '2K' | '4K'
}

// ============================================================================
// TEXT CONTENT
// ============================================================================

export interface TextElement {
  text: string
  role: 'hero' | 'headline' | 'subheadline' | 'body' | 'caption' | 'cta' | 'label'
  maxChars: number
  emphasis: 'highest' | 'high' | 'medium' | 'low'
  mustRender: boolean
}

export interface TextContent {
  primary: TextElement
  secondary: TextElement[]
  hierarchy: string[]  // Order of importance: ['headline', 'subheadline', 'body']
}

// ============================================================================
// COMPOSITION RULES
// ============================================================================

export interface ZoneDefinition {
  id: string
  position: string           // e.g., "0-10%", "top-left"
  purpose: string
  contentTypes: string[]
  breathingRoomPercent: number
  keepClear?: boolean        // For overlay zones
}

export interface CompositionRules {
  layout: LayoutType
  focalPoint: FocalPoint
  zones: ZoneDefinition[]
  depthLayers: {
    background: string       // Description of background treatment
    midground: string
    foreground: string
  }
  visualWeight: 'balanced' | 'top-heavy' | 'bottom-anchored' | 'left-weighted' | 'right-weighted'
  movement: 'static' | 'subtle-flow' | 'dynamic'
  eyePath: string            // e.g., "Z-pattern", "F-pattern", "circular"
}

// ============================================================================
// TYPOGRAPHY SPECIFICATIONS
// ============================================================================

export interface TypographyVariant {
  role: 'hero' | 'headline' | 'subheadline' | 'body' | 'caption'
  weight: FontWeight
  sizeRatio: number          // Relative to base (1.0 = base)
  lineHeight: number         // e.g., 1.1, 1.3, 1.5
  letterSpacing: LetterSpacing
  maxChars: number
  contrast: 'highest' | 'high' | 'medium'
}

export interface TypographySpecs {
  system: TypographySystem
  variants: TypographyVariant[]
  wcagLevel: WCAGLevel
  rendering: 'screen-optimized' | 'print-optimized' | 'projection'
  scriptSupport: ('latin' | 'devanagari' | 'tamil' | 'arabic')[]
}

// ============================================================================
// COLOR SPECIFICATIONS
// ============================================================================

export interface ColorDefinition {
  hex: string
  name?: string
  psychology: string[]       // ['trust', 'stability', 'professionalism']
  usage: string              // 'headlines', 'backgrounds', 'accents'
}

export interface ColorSpecs {
  primary: ColorDefinition
  secondary: ColorDefinition
  accent?: ColorDefinition
  neutral?: ColorDefinition
  contrast: {
    wcagLevel: WCAGLevel
    textOnBackground: 'light-on-dark' | 'dark-on-light' | 'adaptive'
    minimumRatio: number     // e.g., 4.5 for AA, 7 for AAA
  }
  paletteTheory: ColorPalette
  mood: string[]             // ['professional', 'energetic', 'calm']
}

// ============================================================================
// VISUAL ELEMENTS
// ============================================================================

export interface VisualSpecs {
  required: string[]         // Must include these elements
  recommended: string[]      // Good to have
  avoid: string[]            // Never include
  style: VisualStyle
  treatments: string[]       // 'gradient overlay', 'vignette', 'blur background'
}

// ============================================================================
// OVERLAY ZONES (for Sharp post-processing)
// ============================================================================

export interface LogoOverlay {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center-bottom'
  sizePercent: number        // 10-22% of width
  safeZonePadding: number    // pixels
  backgroundRequirement: 'solid' | 'subtle-gradient' | 'clean-minimal'
}

export interface SpeakerPhotoOverlay {
  enabled: boolean
  position: 'left' | 'center' | 'right'
  sizePercent: number        // 25-40% of width
  shape: 'circle' | 'rounded-rect' | 'square'
  backgroundRequirement: string  // 'clean solid color, NO faces'
}

export interface OverlaySpecs {
  logo?: LogoOverlay
  speakerPhoto?: SpeakerPhotoOverlay
}

// ============================================================================
// QUALITY MARKERS
// ============================================================================

export interface QualitySpecs {
  legibility: 'readable-at-16px' | 'readable-at-32px' | 'readable-from-distance'
  detailLevel: 'minimal-clean' | 'balanced' | 'rich-detailed'
  productionStandard: ProductionStandard
  finish: 'professional' | 'publication-quality' | 'gallery-quality'
  keywords: string[]         // ['crisp', 'magazine-quality', 'award-winning']
}

// ============================================================================
// EXCLUSIONS (Negative Prompts)
// ============================================================================

export interface ExclusionSpecs {
  visualElements: string[]   // ['logos', 'seals', 'watermarks', 'clipart']
  textPatterns: string[]     // ['instruction text', '[placeholders]', 'lorem ipsum']
  styles: string[]           // ['cartoon', 'grunge', 'retro-80s']
  technicalDefects: string[] // ['blur', 'noise', 'artifacts', 'jpeg compression']
}

// ============================================================================
// MAIN SCHEMA: GeminiOptimizedPrompt
// ============================================================================

export interface GeminiOptimizedPrompt {
  // Metadata
  formatId: string
  version: string

  // Core specifications
  technical: TechnicalSpecs
  textContent: TextContent
  composition: CompositionRules
  typography: TypographySpecs
  color: ColorSpecs
  visuals: VisualSpecs
  overlays: OverlaySpecs
  quality: QualitySpecs
  exclusions: ExclusionSpecs
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates that text content doesn't exceed max characters
 */
export function validateTextLength(prompt: GeminiOptimizedPrompt): string[] {
  const errors: string[] = []

  const { primary, secondary } = prompt.textContent

  if (primary.text.length > primary.maxChars) {
    errors.push(`Primary text exceeds ${primary.maxChars} chars (got ${primary.text.length})`)
  }

  secondary.forEach((el, i) => {
    if (el.text.length > el.maxChars) {
      errors.push(`Secondary[${i}] "${el.role}" exceeds ${el.maxChars} chars (got ${el.text.length})`)
    }
  })

  return errors
}

/**
 * Validates color contrast meets WCAG requirements
 */
export function validateColorContrast(prompt: GeminiOptimizedPrompt): boolean {
  const { minimumRatio } = prompt.color.contrast
  const wcagLevel = prompt.color.contrast.wcagLevel

  // WCAG AA requires 4.5:1, AAA requires 7:1
  const requiredRatio = wcagLevel === 'AAA' ? 7 : 4.5

  return minimumRatio >= requiredRatio
}

/**
 * Validates overlay zones don't overlap with content zones
 */
export function validateOverlayZones(prompt: GeminiOptimizedPrompt): string[] {
  const errors: string[] = []

  // Check logo zone is marked as keepClear in composition
  if (prompt.overlays.logo) {
    const hasLogoZone = prompt.composition.zones.some(
      z => z.id === 'footer' || z.id === 'logo-zone'
    )
    if (!hasLogoZone) {
      errors.push('Logo overlay specified but no logo zone defined in composition')
    }
  }

  // Check speaker photo zone
  if (prompt.overlays.speakerPhoto?.enabled) {
    const hasSpeakerZone = prompt.composition.zones.some(
      z => z.id === 'speaker-zone' || z.purpose.includes('speaker')
    )
    if (!hasSpeakerZone) {
      errors.push('Speaker photo enabled but no speaker zone defined in composition')
    }
  }

  return errors
}

/**
 * Comprehensive validation of entire prompt schema
 */
export function validatePrompt(prompt: GeminiOptimizedPrompt): {
  valid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Text validation
  errors.push(...validateTextLength(prompt))

  // Color validation
  if (!validateColorContrast(prompt)) {
    errors.push(`Color contrast ${prompt.color.contrast.minimumRatio} doesn't meet ${prompt.color.contrast.wcagLevel} requirements`)
  }

  // Overlay validation
  errors.push(...validateOverlayZones(prompt))

  // Warnings for missing optional fields
  if (!prompt.color.accent) {
    warnings.push('No accent color defined - consider adding for visual interest')
  }

  if (prompt.quality.keywords.length < 3) {
    warnings.push('Few quality keywords - consider adding more for better results')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}

// ============================================================================
// JSON SERIALIZATION
// ============================================================================

/**
 * Converts prompt to clean JSON for Gemini
 */
export function toGeminiJSON(prompt: GeminiOptimizedPrompt): string {
  return JSON.stringify(prompt, null, 2)
}

/**
 * Creates a minimal prompt JSON for smaller token usage
 */
export function toMinimalGeminiJSON(prompt: GeminiOptimizedPrompt): string {
  const minimal = {
    format: prompt.technical.format,
    size: prompt.technical.dimensions,
    text: {
      main: prompt.textContent.primary.text,
      secondary: prompt.textContent.secondary.map(s => s.text)
    },
    layout: prompt.composition.layout,
    focal: prompt.composition.focalPoint,
    typography: prompt.typography.system,
    colors: {
      primary: prompt.color.primary.hex,
      secondary: prompt.color.secondary.hex,
      mood: prompt.color.mood
    },
    style: prompt.visuals.style,
    avoid: prompt.exclusions.visualElements,
    quality: prompt.quality.keywords
  }

  return JSON.stringify(minimal)
}
