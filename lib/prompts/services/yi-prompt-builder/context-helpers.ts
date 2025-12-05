/**
 * Context Helper Functions for Yi Prompt Builder v3.0
 * Provides logo awareness, brand context, and quality context injection
 */

import type { LogoAwarenessContext, BrandContextPrompt } from './types'

// ============================================================
// LOGO AWARENESS CONTEXT
// ============================================================

const POSITION_DESCRIPTIONS: Record<string, string> = {
  'top-left': 'top-left corner (approximately 10-15% from top and left edges)',
  'top-right': 'top-right corner (approximately 10-15% from top and right edges)',
  'bottom-left': 'bottom-left corner (approximately 10-15% from bottom and left edges)',
  'bottom-right': 'bottom-right corner (approximately 10-15% from bottom and right edges)',
  'center-top': 'centered at the top (approximately 10% from top edge)',
}

const SIZE_DESCRIPTIONS: Record<string, string> = {
  small: 'small logo area (approximately 8-10% of image width)',
  medium: 'medium logo area (approximately 12-15% of image width)',
  large: 'large logo area (approximately 18-22% of image width)',
}

/**
 * Build logo context section for prompt
 * Instructs AI to keep logo zone(s) clear for overlay
 * Supports both single logo (backward compatible) and multiple logos
 */
export function buildLogoContext(logoAwareness?: LogoAwarenessContext): string {
  if (!logoAwareness?.hasLogo) return ''

  // Determine which logos to process
  const logos = logoAwareness.logos?.length
    ? logoAwareness.logos
    : [{ position: logoAwareness.logoPosition, size: logoAwareness.logoSize }]

  const isMultiLogo = logos.length > 1

  // Build logo positions list
  const logoDescriptions = logos.map((logo, index) => {
    const position = POSITION_DESCRIPTIONS[logo.position] || logo.position
    const size = SIZE_DESCRIPTIONS[logo.size] || logo.size
    return isMultiLogo
      ? `Logo ${index + 1}: ${position}, ${size}`
      : `Logo Position: ${position}\nLogo Size: ${size}`
  }).join('\n')

  // Build clear zone instructions
  const clearZoneAreas = logos.map(logo => logo.position).join(', ')
  const clearZone = logoAwareness.clearZone || `Keep ${clearZoneAreas} area(s) free of important text, faces, or critical visual elements`

  // Build design instructions for each logo position
  const designInstructions = logos.map(logo => {
    return `- ${logo.position} area: solid/simple gradient background, no text/faces, sufficient contrast`
  }).join('\n')

  return `
<logo_context>
IMPORTANT: ${isMultiLogo ? `${logos.length} logos` : 'A logo'} will be overlaid on this image after generation.
${logoDescriptions}
Clear Zone Required: ${clearZone}

Design Instructions for Logo Zones:
${designInstructions}
- Ensure clear breathing room around all logo placement areas
</logo_context>
`.trim()
}

// ============================================================
// BRAND CONTEXT
// ============================================================

/**
 * Build brand context section for prompt
 * Injects organization brand awareness and optionally colors
 * Colors are only applied when useBrandColors flag is true
 */
export function buildBrandContext(brandContext?: BrandContextPrompt): string {
  if (!brandContext) return ''

  const brandName = brandContext.brandName || brandContext.organizationName
  const useBrandColors = brandContext.useBrandColors ?? false

  // Always include brand awareness
  const lines: string[] = ['Brand Context:']
  if (brandName) {
    lines.push(`- Organization: ${brandName}`)
  }

  // Include colors only when useBrandColors is enabled
  if (useBrandColors) {
    lines.push('\nBrand Colors to Apply:')

    if (brandContext.primaryColor) {
      lines.push(`- Primary Color: ${brandContext.primaryColor} (use for main elements, headers)`)
    }

    if (brandContext.secondaryColor) {
      lines.push(`- Secondary Color: ${brandContext.secondaryColor} (use for supporting elements)`)
    }

    if (brandContext.accentColor) {
      lines.push(`- Accent Color: ${brandContext.accentColor} (use for CTAs, highlights)`)
    }

    if (brandContext.fontPreference) {
      lines.push(`- Typography Preference: ${brandContext.fontPreference}`)
    }

    // Color application guidance only when using brand colors
    lines.push(`
Color Application:
- Headlines/Titles: Primary color or high contrast with background
- Backgrounds: Can incorporate brand colors as gradients or accents
- CTAs/Buttons: Accent color for maximum visibility
- Supporting text: Secondary color or neutral`)
  } else {
    // When brand colors are not applied, use professional defaults
    lines.push('\nColor Guidance: Use professional, harmonious colors appropriate for the content')
  }

  return `
<brand_context>
${lines.join('\n')}
</brand_context>
`.trim()
}

// ============================================================
// QUALITY CONTEXT
// ============================================================

interface ResolutionSpec {
  pixels: string
  dpi: string
  use: string
}

const RESOLUTION_SPECS: Record<string, ResolutionSpec> = {
  '1K': { pixels: '1024px', dpi: '72-150 DPI', use: 'Digital/Web' },
  '2K': { pixels: '2048px', dpi: '150-300 DPI', use: 'Print/High-quality digital' },
  '4K': { pixels: '4096px', dpi: '300+ DPI', use: 'Large format print/Professional' },
}

const FORMAT_QUALITY: Record<string, string> = {
  certificate: 'Print-ready, frame-worthy, crisp text rendering',
  event_poster: 'Print-ready, readable from distance, vibrant colors',
  instagram_post: 'Mobile-optimized, vibrant, scroll-stopping',
  youtube_thumbnail: 'Readable at 160x90px, high contrast, bold',
  business_card: 'Print-ready, precise text, professional',
  presentation: 'Projection-friendly, high contrast, readable from distance',
  presentation_16_9: 'Projection-friendly, high contrast, readable from distance',
  presentation_4_3: 'Projection-friendly, high contrast, readable from distance',
  flyer: 'Print-ready, clear hierarchy, scannable',
  flyer_a4: 'Print-ready, clear hierarchy, scannable',
  flyer_a5: 'Print-ready, clear hierarchy, scannable',
  linkedin_post: 'Professional, polished, business-appropriate',
  story: 'Mobile-first, vertical-optimized, instant comprehension',
  instagram_story: 'Mobile-first, vertical-optimized, instant comprehension',
  whatsapp_status: 'Mobile-first, vertical-optimized, instant comprehension',
  web_banner: 'Web-optimized, attention-grabbing, clear CTA',
  social_post: 'Platform-optimized, engaging, shareable',
}

/**
 * Build quality context section for prompt
 * Specifies resolution and format-specific quality requirements
 */
export function buildQualityContext(resolution?: string, formatId?: string): string {
  const res = resolution || '2K'
  const spec = RESOLUTION_SPECS[res] || RESOLUTION_SPECS['2K']
  const formatQuality = (formatId && FORMAT_QUALITY[formatId]) || 'Professional quality, clear and crisp'

  return `
<quality>
Resolution: ${res} (${spec.pixels} maximum dimension)
DPI Equivalent: ${spec.dpi}
Intended Use: ${spec.use}
Format-Specific Quality: ${formatQuality}

Quality Requirements:
- Sharp, clear edges on all elements
- Legible text at intended viewing size
- No artifacts, blur, or pixelation
- Professional finish suitable for ${spec.use.toLowerCase()}
</quality>
`.trim()
}

// ============================================================
// COMBINED CONTEXT BUILDER
// ============================================================

export interface ContextOptions {
  logoAwareness?: LogoAwarenessContext
  brandContext?: BrandContextPrompt
  resolution?: string
  formatId?: string
}

/**
 * Build all context sections at once
 * Convenience function that combines logo, brand, and quality contexts
 */
export function buildAllContexts(options: ContextOptions): string {
  const parts: string[] = []

  const logoContext = buildLogoContext(options.logoAwareness)
  if (logoContext) parts.push(logoContext)

  const brandContext = buildBrandContext(options.brandContext)
  if (brandContext) parts.push(brandContext)

  const qualityContext = buildQualityContext(options.resolution, options.formatId)
  if (qualityContext) parts.push(qualityContext)

  return parts.join('\n\n')
}
