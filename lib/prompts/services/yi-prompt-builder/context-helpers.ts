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
    lines.push('Brand Colors to Apply:')

    if (brandContext.primaryColor) {
      lines.push(`- Primary Color: ${brandContext.primaryColor} (use for main elements, headers)`)
    }

    if (brandContext.secondaryColor) {
      lines.push(`- Secondary Color: ${brandContext.secondaryColor} (use for supporting elements)`)
    }

    if (brandContext.accentColor) {
      lines.push(`- Accent Color: ${brandContext.accentColor} (use for CTAs, highlights)`)
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
    lines.push('')
    lines.push('Color Guidance: Use professional, harmonious colors appropriate for the content')
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

  return `
<theme_context>
Design Theme: ${theme || 'professional'}
${style ? `Style Direction: ${style}` : ''}
Visual Character: ${themeDesc}
Apply this theme consistently across all visual elements, typography, and color choices.
</theme_context>
`.trim()
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

  return `
<organization_context>
${lines.join('\n')}
Incorporate organization identity subtly through professional design choices.
Ensure the design feels authentic to this organization's character.
</organization_context>
`.trim()
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

  return `
<layout_zones>
Reserved Zones for Post-Processing:
${zones.join('\n')}
Ensure these zones have simple backgrounds (solid, subtle gradient, or minimal pattern) suitable for overlay elements.
Avoid placing critical design elements, faces, or important text in these zones.
</layout_zones>
`.trim()
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

  return `
<language_context>
Text Language: ${langInfo.name}
Typography Note: ${langInfo.typography}
Ensure all text in this language is rendered clearly and correctly.
</language_context>
`.trim()
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
 * v3.2: Now differentiates between:
 * - hasUserPhoto=true: User has uploaded photo, will be overlaid (keep zone clean)
 * - hasUserPhoto=false: Placeholder only, user will add photo later (create clean placeholder, NO AI face)
 */
export function buildSpeakerPhotoZoneContext(
  config?: SpeakerPhotoConfig
): string {
  if (!config?.enabled) return ''

  const position = config.position || 'left'
  const size = config.size || 'large'
  const shape = config.shape || 'circle'
  const hasUserPhoto = config.hasUserPhoto ?? false

  // Different instructions based on whether user has uploaded their own photo
  const zoneInstructions = hasUserPhoto
    ? `Zone Status: USER PHOTO WILL BE OVERLAID
A speaker photo will be composited onto this zone via post-processing.

Zone Requirements:
- Keep this area CLEAN with simple background (solid color, subtle gradient, or matching design)
- DO NOT generate any faces, people, or human figures in this zone
- DO NOT generate placeholder shapes or frames - the photo will be added automatically
- Ensure good contrast between the photo zone and surrounding design
- Leave breathing room around the zone for the photo to stand out`
    : `Zone Status: PLACEHOLDER ONLY - No photo uploaded yet
The user has enabled speaker photo but has NOT uploaded their photo yet.

CRITICAL INSTRUCTION - AI MUST NOT GENERATE ANY HUMAN FACE OR FIGURE:
- NO illustrated faces, portraits, silhouettes, or human figures
- NO AI-generated people, avatars, or cartoon faces
- NO photorealistic human faces or body parts

Instead, create a CLEAN PLACEHOLDER using ONE of these options:
1. A subtle ${shape} frame outline (use brand accent color at 20-30% opacity)
2. A soft gradient background area that suggests "photo placement zone"
3. A simple geometric shape matching the ${shape} configuration
4. Just clean background that's ready for photo overlay later

The placeholder should look INTENTIONALLY DESIGNED as a reserved space for a photo.`

  return `
<speaker_photo_zone>
Speaker Photo Zone Configuration:
- Position: ${SPEAKER_POSITION_DESCRIPTIONS[position] || position}
- Size: ${SPEAKER_SIZE_DIMENSIONS[size] || size}
- Shape: ${SPEAKER_SHAPE_GUIDANCE[shape] || shape}

${zoneInstructions}
</speaker_photo_zone>
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
  // NEW v3.1 options
  theme?: string
  style?: string
  organizationContext?: OrganizationContext
  layout?: LayoutZoneConfig
  language?: 'en' | 'ta' | 'hi'
  speakerPhotoConfig?: SpeakerPhotoConfig
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

  return parts.join('\n\n')
}
