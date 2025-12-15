/**
 * Context Helper Functions for Yi Prompt Builder v3.1
 * Provides logo awareness, brand context, quality context,
 * and NEW: theme, organization, layout zone, and language context injection
 */

import type {
  LogoAwarenessContext,
  BrandContextPrompt,
  OrganizationContext,
  LayoutZoneConfig,
  SpeakerPhotoConfig,
  FooterContactContext,
} from './types'

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
 *
 * NOTE: Logo context is intentionally disabled to prevent logo-related
 * instructions from leaking into AI-generated images. Logos are handled
 * entirely by Sharp post-processing overlay - the AI does not need to
 * know about logos at all.
 *
 * @deprecated Logo awareness is now handled only in post-processing
 */
export function buildLogoContext(logoAwareness?: LogoAwarenessContext): string {
  // Logo overlay is handled by Sharp post-processing
  // DO NOT send any logo-related information to the AI
  return ''
}

// ============================================================
// BRAND CONTEXT
// ============================================================

/**
 * Build brand context section for prompt
 * Injects organization brand awareness and optionally colors
 * Colors are only applied when useBrandColors flag is true
 * Font preference is ALWAYS applied when provided (v3.2 - hybrid approach)
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

  // NEW v3.2: Font preference is ALWAYS applied when provided (independent of color settings)
  // This implements the hybrid approach: font family from org settings, AI controls sizing/effects
  if (brandContext.fontPreference) {
    lines.push('')
    lines.push('Typography Constraint:')
    lines.push(`- Font Family: "${brandContext.fontPreference}" for all text`)
    lines.push('- AI controls: font sizes, weights, effects, and layout')
    lines.push('- DO NOT substitute a different font family')
  }

  // Include colors only when useBrandColors is enabled
  if (useBrandColors) {
    lines.push('')
    // v3.7: Add MANDATORY override to ensure brand colors are used over AI-suggested colors
    lines.push('=== MANDATORY BRAND COLOR REQUIREMENT ===')
    lines.push('You MUST use ONLY these brand colors. IGNORE any other color suggestions in this prompt.')
    lines.push('')

    if (brandContext.primaryColor) {
      lines.push(`- PRIMARY: ${brandContext.primaryColor} - Use for backgrounds, gradients, main visual areas`)
    }

    if (brandContext.secondaryColor) {
      lines.push(`- SECONDARY: ${brandContext.secondaryColor} - Use for accents, highlights, supporting elements`)
    }

    if (brandContext.accentColor) {
      lines.push(`- ACCENT: ${brandContext.accentColor} - Use for CTAs, buttons, call-to-action elements`)
    }

    // Stronger color application guidance
    lines.push(`
STRICT COLOR RULES:
- Background MUST use Primary Color (${brandContext.primaryColor || 'as specified'}) as dominant color
- Headlines MUST be high contrast (white/black) against primary background
- CTAs/Buttons MUST use Accent Color (${brandContext.accentColor || 'as specified'})
- DO NOT use navy, cyan, neon, or any colors not listed above
- These brand colors are NON-NEGOTIABLE - override any AI color suggestions`)
  } else {
    // When brand colors are not applied, use professional defaults
    lines.push('')
    lines.push('Color Guidance: Use professional, harmonious colors appropriate for the content')
  }

  // v3.6: Return as plain text (no XML tags) to survive prompt sanitization
  return lines.join('\n')
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

  // v3.6: Return as plain text (no XML tags) to survive prompt sanitization
  return `QUALITY SPECIFICATIONS:
Resolution: ${res} (${spec.pixels} maximum dimension). DPI Equivalent: ${spec.dpi}. Intended Use: ${spec.use}. Format-Specific Quality: ${formatQuality}. The image has sharp, clear edges on all elements, legible text at intended viewing size, no artifacts, blur, or pixelation, and a professional finish suitable for ${spec.use.toLowerCase()}.`
}

// ============================================================
// THEME CONTEXT (v3.1)
// ============================================================

const THEME_DESCRIPTIONS: Record<string, string> = {
  professional: 'Clean, business-appropriate, trustworthy appearance with refined aesthetics',
  creative: 'Bold, artistic, innovative visual language with unique design choices',
  elegant: 'Sophisticated, refined, premium aesthetic with subtle luxury touches',
  dynamic: 'Energetic, bold, high-impact visuals with movement and excitement',
  cultural: 'Traditional elements thoughtfully integrated with modern interpretation',
  nature: 'Organic, natural, earthy visual elements with environmental harmony',
  academic: 'Scholarly, prestigious, institutional with classic authority',
  minimalist: 'Clean, uncluttered, focused design with intentional whitespace',
  vibrant: 'Colorful, energetic, eye-catching with saturated hues',
  corporate: 'Formal, structured, business-focused with clear hierarchy',
}

/**
 * Build theme context section for prompt
 * Provides visual direction based on user's theme preference
 */
export function buildThemeContext(
  theme?: string,
  style?: string
): string {
  if (!theme && !style) return ''

  const themeDesc = THEME_DESCRIPTIONS[theme || 'professional'] || THEME_DESCRIPTIONS.professional

  // v3.6: Return as plain text (no XML tags) to survive prompt sanitization
  return `DESIGN THEME: ${theme || 'professional'}${style ? `. Style Direction: ${style}` : ''}. Visual Character: ${themeDesc}. Apply this theme consistently across all visual elements, typography, and color choices.`
}

// ============================================================
// ORGANIZATION CONTEXT (v3.1)
// ============================================================

/**
 * Build organization context section for prompt
 * Provides branding and identity context beyond just colors
 */
export function buildOrganizationContext(
  org?: OrganizationContext
): string {
  if (!org?.name) return ''

  const lines: string[] = []
  lines.push(`Organization: ${org.name}`)

  if (org.tagline) {
    lines.push(`Tagline: "${org.tagline}"`)
  }

  if (org.industry) {
    lines.push(`Industry/Vertical: ${org.industry}`)
  }

  // v3.6: Return as plain text (no XML tags) to survive prompt sanitization
  return `ORGANIZATION CONTEXT: ${lines.join('. ')}. Incorporate organization identity subtly through professional design choices. The design feels authentic to this organization's character.`
}

// ============================================================
// LAYOUT ZONE CONTEXT (v3.1)
// ============================================================

/**
 * Build layout zone context for reserved header/footer areas
 * Instructs AI to keep these zones simple for post-processing overlays
 */
export function buildLayoutZoneContext(
  layout?: LayoutZoneConfig
): string {
  if (!layout?.headerHeight && !layout?.footerHeight) return ''

  const zones: string[] = []

  if (layout.headerHeight && layout.headerHeight > 0) {
    zones.push(`- HEADER ZONE (top ${layout.headerHeight}%): Reserved for logo/branding overlay - use simple, uncluttered background`)
  }

  if (layout.footerHeight && layout.footerHeight > 0) {
    zones.push(`- FOOTER ZONE (bottom ${layout.footerHeight}%): Reserved for footer elements - use simple, uncluttered background`)
  }

  // v3.6: Return as plain text (no XML tags) to survive prompt sanitization
  return `RESERVED LAYOUT ZONES: ${zones.join('. ')}. These zones have simple backgrounds (solid, subtle gradient, or minimal pattern) suitable for overlay elements. No critical design elements, faces, or important text in these zones.`
}

// ============================================================
// LANGUAGE CONTEXT (v3.1)
// ============================================================

const LANGUAGE_GUIDANCE: Record<string, { name: string; typography: string }> = {
  en: { name: 'English', typography: 'Standard Latin typography' },
  ta: {
    name: 'Tamil',
    typography: 'Tamil script - ensure proper rendering, adequate line height (1.6-1.8) for complex characters and ligatures',
  },
  hi: {
    name: 'Hindi/Devanagari',
    typography: 'Hindi script - ensure proper rendering, adequate spacing for conjuncts and matras',
  },
}

/**
 * Build language context for non-English content
 * Provides typography and rendering guidance for different scripts
 */
export function buildLanguageContext(
  language?: 'en' | 'ta' | 'hi'
): string {
  if (!language || language === 'en') return ''

  const langInfo = LANGUAGE_GUIDANCE[language]
  if (!langInfo) return ''

  // v3.6: Return as plain text (no XML tags) to survive prompt sanitization
  return `TEXT LANGUAGE: ${langInfo.name}. Typography Note: ${langInfo.typography}. All text in this language is rendered clearly and correctly.`
}

// ============================================================
// SPEAKER PHOTO ZONE CONTEXT (v3.1)
// ============================================================

const SPEAKER_POSITION_DESCRIPTIONS: Record<string, string> = {
  left: 'LEFT 35-40% of the design',
  right: 'RIGHT 35-40% of the design',
  center: 'CENTER of the design (circular overlay area)',
}

const SPEAKER_SIZE_DIMENSIONS: Record<string, string> = {
  small: '20-25% of design width',
  medium: '30-35% of design width',
  large: '40-45% of design width',
}

const SPEAKER_SHAPE_GUIDANCE: Record<string, string> = {
  circle: 'circular photo frame area - keep background suitable for round cutout',
  rounded: 'rounded rectangle photo frame - keep background suitable for rounded corners',
  square: 'square photo frame - keep background suitable for rectangular cutout',
}

/**
 * Build speaker photo zone context
 * Reserves area for speaker photo overlay in event posters
 *
 * v3.6: CRITICAL FIX - Only generate context when user has ACTUALLY uploaded a photo
 * When hasUserPhoto=false, we now return NOTHING to prevent AI from creating placeholder frames
 * The placeholder frame issue was caused by instructions telling AI to create visible frames
 */
export function buildSpeakerPhotoZoneContext(
  config?: SpeakerPhotoConfig
): string {
  // v3.6: Only generate speaker zone context when:
  // 1. Config exists AND enabled
  // 2. User has ACTUALLY uploaded a photo (hasUserPhoto=true)
  // If no photo uploaded, don't send any speaker zone instructions - this prevents AI from drawing placeholder frames
  if (!config?.enabled || !config.hasUserPhoto) return ''

  const position = config.position || 'left'
  const size = config.size || 'large'
  const shape = config.shape || 'circle'

  // v3.6: Only one mode now - photo will be overlaid, keep zone clean
  // v3.6: Return as plain text (no XML tags) to survive prompt sanitization
  return `SPEAKER PHOTO ZONE: A speaker photo will be composited onto the ${SPEAKER_POSITION_DESCRIPTIONS[position] || position} area (${SPEAKER_SIZE_DIMENSIONS[size] || size}, ${SPEAKER_SHAPE_GUIDANCE[shape] || shape}) via post-processing. Keep this area clean with a simple background (solid color, subtle gradient, or matching design). No faces, people, human figures, placeholder shapes, or frames in this zone - the real photo will be added automatically.`
}

// ============================================================
// FOOTER CONTACT CONTEXT (v3.4)
// ============================================================

/**
 * Build footer contact context for creative footers
 * Formats contact information for display in the footer zone
 */
export function buildFooterContactContext(footerContext?: FooterContactContext): string {
  if (!footerContext) return ''

  const contactLines: string[] = []

  if (footerContext.website) {
    contactLines.push(`Website: "${footerContext.website}"`)
  }
  if (footerContext.phone) {
    contactLines.push(`Phone: "${footerContext.phone}"`)
  }
  if (footerContext.email) {
    contactLines.push(`Email: "${footerContext.email}"`)
  }
  if (footerContext.address) {
    contactLines.push(`Address: "${footerContext.address}"`)
  }
  if (footerContext.social) {
    const socialParts: string[] = []
    if (footerContext.social.instagram) socialParts.push(`IG: ${footerContext.social.instagram}`)
    if (footerContext.social.linkedin) socialParts.push(`LinkedIn: ${footerContext.social.linkedin}`)
    if (footerContext.social.facebook) socialParts.push(`FB: ${footerContext.social.facebook}`)
    if (footerContext.social.twitter) socialParts.push(`X: ${footerContext.social.twitter}`)
    if (socialParts.length > 0) {
      contactLines.push(`Social: ${socialParts.join(' | ')}`)
    }
  }

  if (contactLines.length === 0) return ''

  return `FOOTER CONTACT INFO (display in footer zone): ${contactLines.join('. ')}.`
}

// ============================================================
// COMBINED CONTEXT BUILDER
// ============================================================

export interface ContextOptions {
  logoAwareness?: LogoAwarenessContext
  brandContext?: BrandContextPrompt
  resolution?: string
  formatId?: string
  // NEW v3.1 options
  theme?: string
  style?: string
  organizationContext?: OrganizationContext
  layout?: LayoutZoneConfig
  language?: 'en' | 'ta' | 'hi'
  speakerPhotoConfig?: SpeakerPhotoConfig
  // NEW v3.4 options
  footerContext?: FooterContactContext
}

/**
 * Build all context sections at once
 * Convenience function that combines all context types
 * v3.1: Now includes theme, organization, layout, language, and speaker photo contexts
 */
export function buildAllContexts(options: ContextOptions): string {
  const parts: string[] = []

  // Core contexts (v3.0)
  const logoContext = buildLogoContext(options.logoAwareness)
  if (logoContext) parts.push(logoContext)

  const brandContext = buildBrandContext(options.brandContext)
  if (brandContext) parts.push(brandContext)

  const qualityContext = buildQualityContext(options.resolution, options.formatId)
  if (qualityContext) parts.push(qualityContext)

  // NEW v3.1 contexts
  const themeContext = buildThemeContext(options.theme, options.style)
  if (themeContext) parts.push(themeContext)

  const orgContext = buildOrganizationContext(options.organizationContext)
  if (orgContext) parts.push(orgContext)

  const layoutContext = buildLayoutZoneContext(options.layout)
  if (layoutContext) parts.push(layoutContext)

  const langContext = buildLanguageContext(options.language)
  if (langContext) parts.push(langContext)

  const speakerContext = buildSpeakerPhotoZoneContext(options.speakerPhotoConfig)
  if (speakerContext) parts.push(speakerContext)

  // NEW v3.4: Footer contact context
  const footerContactCtx = buildFooterContactContext(options.footerContext)
  if (footerContactCtx) parts.push(footerContactCtx)

  return parts.join('\n\n')
}
