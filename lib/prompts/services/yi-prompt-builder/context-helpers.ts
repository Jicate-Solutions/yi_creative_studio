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
  DesignContextForPrompt,
} from './types'
import { buildColorReference } from '@/lib/utils/color-names'

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
 * v3.10: Now always includes colors when provided, with enforcement levels based on source
 * - Brand colors: Strict enforcement (MANDATORY)
 * - Preset/Custom colors: Flexible guidance
 * - Fallback: Generic professional guidance
 * Font preference is ALWAYS applied when provided (v3.2 - hybrid approach)
 * v4.0: Now supports format-aware typography modes for different creative types
 * v4.2: Story-driven typography enhancement - leverages Design Intelligence context
 */
export function buildBrandContext(
  brandContext?: BrandContextPrompt,
  formatId?: string,  // Format ID for format-aware typography modes
  designContext?: DesignContextForPrompt  // NEW v4.2: Design Intelligence story context
): string {
  if (!brandContext) return ''

  const lines: string[] = []
  const useBrandColors = brandContext.useBrandColors ?? false
  const colorSource = brandContext.colorSource || 'unknown'

  lines.push('=== BRAND CONTEXT ===')
  if (brandContext.organizationName) {
    lines.push(`Organization: ${brandContext.organizationName}`)
  }

  // Font preference (conditionally applied based on useBrandFont toggle)
  const useBrandFont = brandContext.useBrandFont ?? true  // Default true for backward compatibility
  if (brandContext.fontPreference && useBrandFont) {
    const isStandardSans = ['Inter', 'Arial', 'Helvetica', 'Roboto', 'Sans-serif'].some(f =>
      brandContext.fontPreference?.toLowerCase().includes(f.toLowerCase())
    )

    lines.push('')
    lines.push('Typography Constraint:')
    lines.push(`Primary Font Family: "${brandContext.fontPreference}" for all body and details text`)

    if (isStandardSans) {
      lines.push(`Headline Flex: If the design mood suggests Serif, Script, or Display styles, use high-quality alternatives for headlines only while keeping "${brandContext.fontPreference}" for everything else.`)
    } else {
      lines.push(`Font Alignment: Use "${brandContext.fontPreference}" as your primary visual identity font.`)
    }

    lines.push('AI controls: font sizes, weights, effects, and layout')
  } else if (brandContext.fontPreference && !useBrandFont) {
    // Font toggle is OFF - FORMAT-AWARE typography modes

    // Define format categories
    const formalFormats = ['certificate', 'business_card', 'letterhead', 'resume', 'invitation']
    const mobileFormats = ['instagram_post', 'instagram_story', 'facebook_post', 'linkedin_post', 'twitter_post', 'whatsapp_status', 'pinterest_pin', 'tiktok_cover']
    const moderateFormats = ['web_banner', 'email_header', 'billboard', 'leaderboard_ad', 'square_ad', 'presentation_16_9', 'presentation_4_3', 'brochure', 'report_cover']

    const isFormalFormat = formatId && formalFormats.includes(formatId)
    const isMobileFormat = formatId && mobileFormats.includes(formatId)
    const isModerateFormat = formatId && moderateFormats.includes(formatId)

    if (isFormalFormat) {
      // FORMAL MODE for certificates, business cards, letterheads
      lines.push('')
      lines.push('=== TYPOGRAPHY FREEDOM: FORMAL MODE ===')
      lines.push('Select elegant, traditional fonts appropriate for formal documents')
      lines.push('')
      lines.push('FONT SELECTION STRATEGY:')
      lines.push('- Primary: Elegant serif fonts (Playfair Display, Merriweather, Crimson Text)')
      lines.push('- Accent: Classic script/calligraphy for names (Great Vibes, Dancing Script)')
      lines.push('- Body: Clean readable serif (Lora, Source Serif Pro)')
      lines.push('- Avoid: Ultra-bold display fonts, modern sans-serif, decorative fonts')
      lines.push('')
      lines.push('COLOR STRATEGY:')
      lines.push('- Use professional, traditional color schemes (navy, gold, burgundy, black)')
      lines.push('- Single-color or subtle dual-color schemes (NOT multi-color word-by-word)')
      lines.push('- Maintain formal, prestigious appearance')
      lines.push('')
      lines.push('TEXT EFFECTS:')
      lines.push('- Minimal effects - subtle embossing or letterpress effect only')
      lines.push('- NO shadows, glows, gradients, or 3D effects')
      lines.push('- Maintain elegant, timeless aesthetic')

    } else if (isMobileFormat) {
      // MOBILE-OPTIMIZED MODE for social media
      lines.push('')
      lines.push('=== TYPOGRAPHY FREEDOM: MOBILE-OPTIMIZED MODE ===')
      lines.push('No brand font constraints - CREATE BOLD, SCROLL-STOPPING TYPOGRAPHY for mobile viewing')
      lines.push('')
      lines.push('MOBILE-FIRST SIZING:')
      lines.push('- Main headline: LARGE but mobile-readable (60-90px equivalent)')
      lines.push('- Supporting text: MEDIUM (36-48px equivalent)')
      lines.push('- Details: STANDARD (24-32px equivalent)')
      lines.push('- All text MUST be readable on phone screen WITHOUT zooming')
      lines.push('')
      lines.push('MULTI-COLOR HEADLINE TECHNIQUE:')
      lines.push('- Split headline into WORDS and color each word DIFFERENTLY using brand colors')
      lines.push('- Example: "BIG" (Orange) "NEWS" (Blue) for high contrast')
      lines.push('- Create visual rhythm through color contrast')
      lines.push('')
      lines.push('FONT SELECTION:')
      lines.push('- Headlines: BOLD, THICK fonts (Montserrat Bold, Poppins Bold, Roboto Black)')
      lines.push('- Avoid thin/light weights that disappear on mobile screens')
      lines.push('- Prioritize readability over decorative effects')
      lines.push('')
      lines.push('TEXT EFFECTS:')
      lines.push('- Subtle drop shadows for legibility (2-3px offset)')
      lines.push('- High contrast with background')
      lines.push('- Avoid complex effects that blur on small screens')

    } else if (isModerateFormat) {
      // PROFESSIONAL-CREATIVE MODE for marketing materials
      lines.push('')
      lines.push('=== TYPOGRAPHY FREEDOM: PROFESSIONAL-CREATIVE MODE ===')
      lines.push('Balance creativity with professional restraint')
      lines.push('')
      lines.push('FONT SELECTION STRATEGY:')
      lines.push('- Headlines: Bold, modern sans-serif (Montserrat SemiBold, Poppins SemiBold, Nunito Bold)')
      lines.push('- Subheadings: Medium-weight modern sans (Poppins Medium, Raleway Medium)')
      lines.push('- Body: Clean readable sans (Inter, Open Sans, Lato)')
      lines.push('- Avoid ultra-bold impact fonts - prefer semi-bold for professional look')
      lines.push('')
      lines.push('TEXT SIZING HIERARCHY:')
      lines.push('- Main headline: LARGE (80-120px equivalent) - commanding but professional')
      lines.push('- Secondary headline: MEDIUM (50-70px equivalent)')
      lines.push('- Body text: STANDARD (28-36px equivalent)')
      lines.push('')
      lines.push('MULTI-COLOR STRATEGY:')
      lines.push('- Multi-color acceptable but SUBTLE (2-3 colors max, not every word)')
      lines.push('- Use color strategically for emphasis, not decoration')
      lines.push('- Maintain professional, polished appearance')
      lines.push('')
      lines.push('TEXT EFFECTS:')
      lines.push('- Subtle shadows for depth (2-3px offset, 15% opacity)')
      lines.push('- Optional: soft outer glow on key text (subtle, 4-6px blur)')
      lines.push('- Avoid excessive 3D effects or gradients')

    } else {
      // ULTRA-CREATIVE MODE for event posters, flyers, announcements (DEFAULT)
      lines.push('')
      lines.push('=== TYPOGRAPHY FREEDOM: ULTRA-CREATIVE MODE ===')
      lines.push('No brand font constraints - CREATE DRAMATIC, HIGH-IMPACT TYPOGRAPHY')
      lines.push('')
      lines.push('MULTI-COLOR HEADLINE TECHNIQUE (MANDATORY for main headlines):')
      lines.push('- Split headline into WORDS and color each word DIFFERENTLY using brand colors')
      lines.push('- Example: "YOUNG" (Orange #FF6B35) "INDIANS" (Blue #005B96) "PARLIAMENT" (Green #00A86B)')
      lines.push('- Example: "FUTURE" (White) "5.0" (Accent color with glow effect)')
      lines.push('- Create visual rhythm through color contrast between words')
      lines.push('- Use PRIMARY color for power words, SECONDARY for action words, ACCENT for highlights')
      lines.push('')
      lines.push('FONT SELECTION STRATEGY:')
      lines.push('- Headlines: Ultra-bold, oversized display fonts (Montserrat Black, Bebas Neue, Impact, Anton)')
      lines.push('- Subheadings: Medium-weight modern sans (Poppins SemiBold, Raleway Medium)')
      lines.push('- Body text: Clean, readable sans-serif (Inter, Open Sans, Lato)')
      lines.push('- Accent text: Stylized or script fonts for emotional words (optional)')
      lines.push('')
      lines.push('TEXT SIZING HIERARCHY:')
      lines.push('- Main headline: EXTRA LARGE (100-180px equivalent) - dominate the design')
      lines.push('- Secondary headline: LARGE (60-90px equivalent)')
      lines.push('- Subheadings: MEDIUM (40-55px equivalent)')
      lines.push('- Body text: STANDARD (28-36px equivalent)')
      lines.push('- Details/fine print: SMALL (20-24px equivalent)')
      lines.push('')
      lines.push('TEXT EFFECTS & STYLING:')
      lines.push('- Headlines: Add subtle drop shadows (2-4px offset, 20% opacity black)')
      lines.push('- Power words: Use stroke/outline (2-3px white or contrasting color)')
      lines.push('- Glowing effect: Add soft outer glow on accent-colored text (brand accent color, 8-12px blur)')
      lines.push('- Gradient text: Apply subtle linear gradients within single words for depth')
      lines.push('- 3D effect: Layer text with offset shadows for dimensional look (optional for modern themes)')
      lines.push('')
      lines.push('BACKGROUND INTEGRATION:')
      lines.push('- Place headlines on colored bars/strips (solid brand colors, 60-80% opacity)')
      lines.push('- Use rounded rectangles behind text blocks for emphasis')
      lines.push('- Create layered composition: text over semi-transparent shapes')
      lines.push('- Ensure high contrast: dark text on light backgrounds, light text on dark backgrounds')
      lines.push('')
      lines.push('TYPOGRAPHY LAYOUT:')
      lines.push('- ALL CAPS for main headlines and power words')
      lines.push('- Sentence case for subheadings and descriptions')
      lines.push('- Strategic letter spacing: tight for impact (-2 to 0), loose for elegance (2-4)')
      lines.push('- Line height: 1.0-1.2 for headlines (tight), 1.4-1.6 for body text (readable)')
      lines.push('- Text alignment: Center for headlines, Left for body (or center if short)')
      lines.push('')
      lines.push('CREATIVE EMPHASIS TECHNIQUES:')
      lines.push('- Highlight key numbers/dates with ACCENT color + larger size')
      lines.push('- Use separators between words: | pipes, • bullets, — dashes (in brand colors)')
      lines.push('- Mix font weights within sentences: BOLD for keywords, regular for connecting words')
      lines.push('- Italics for quotes or emotional statements (sparingly)')
      lines.push('')
      lines.push('AVOID:')
      lines.push('- Generic, flat, single-color typography')
      lines.push('- Small, timid font sizes')
      lines.push('- Low-contrast text placement')
      lines.push('- Overuse of effects (keep it balanced, not cluttered)')
    }

    // === v4.2: STORY-DRIVEN TYPOGRAPHY ENHANCEMENT ===
    // If Design Intelligence has analyzed the story/vibe/mood, use those insights
    if (designContext?.typographyStrategy || designContext?.vibeAndMood || designContext?.storyAnalysis) {
      lines.push('')
      lines.push('=== STORY-DRIVEN TYPOGRAPHY ENHANCEMENT (v4.2) ===')

      // Story context
      if (designContext.storyAnalysis?.narrative) {
        lines.push('')
        lines.push(`Story Context: ${designContext.storyAnalysis.narrative}`)

        if (designContext.vibeAndMood?.vibeKeywords) {
          lines.push(`Vibe: ${designContext.vibeAndMood.vibeKeywords.join(', ')}`)
        }

        if (designContext.storyAnalysis.themes?.length) {
          lines.push(`Themes: ${designContext.storyAnalysis.themes.join(' + ')}`)
        }
      }

      // AI-driven typography recommendations
      if (designContext.typographyStrategy) {
        const typo = designContext.typographyStrategy

        lines.push('')
        lines.push('TYPOGRAPHY PERSONALITY (AI-Analyzed):')
        lines.push(`- ${typo.headlinePersonality}`)

        if (typo.fontRecommendations) {
          lines.push('')
          lines.push('RECOMMENDED FONTS (Story-Driven):')
          lines.push(`- Headline: ${typo.fontRecommendations.headline}`)
          lines.push(`- Subheading: ${typo.fontRecommendations.subheading}`)
          lines.push(`- Body: ${typo.fontRecommendations.body}`)
        }

        if (typo.sizingStrategy) {
          lines.push('')
          lines.push(`SIZING STRATEGY: ${typo.sizingStrategy}`)
        }

        if (typo.hierarchyFlow) {
          lines.push('')
          lines.push('HIERARCHY FLOW (Eye Travel):')
          lines.push(`- ${typo.hierarchyFlow}`)
        }

        // Multi-color word strategy from AI story analysis
        if (typo.multiColorStrategy?.words && typo.multiColorStrategy.words.length > 0) {
          lines.push('')
          lines.push('MULTI-COLOR WORD STRATEGY (AI Story Analysis):')
          lines.push('The AI has analyzed the event narrative and recommends coloring specific words:')
          lines.push('')

          typo.multiColorStrategy.words.forEach(({ word, color, reasoning }) => {
            lines.push(`- "${word}": ${color}`)
            lines.push(`  Reasoning: ${reasoning}`)
          })

          lines.push('')
          lines.push(`Color Rhythm: ${typo.multiColorStrategy.colorRhythm || 'emphasis-based'}`)
          lines.push('')
          lines.push('CRITICAL: Apply these specific word colors to tell the story visually')
          lines.push('These colors were chosen to convey the event\'s emotional narrative')
        }
      }

      // Vibe-driven mood atmosphere
      if (designContext.vibeAndMood?.moodAtmosphere) {
        lines.push('')
        lines.push('MOOD ATMOSPHERE:')
        lines.push(`- ${designContext.vibeAndMood.moodAtmosphere}`)
        lines.push(`- Emotional Temperature: ${designContext.vibeAndMood.emotionalTemperature}`)
        lines.push(`- Energy Dynamics: ${designContext.vibeAndMood.energyDynamics}`)

        if (designContext.vibeAndMood.audienceResonance) {
          lines.push('')
          lines.push('AUDIENCE RESONANCE:')
          lines.push(`- ${designContext.vibeAndMood.audienceResonance}`)
        }
      }

      // Overall design strategy
      if (designContext.overallDesignStrategy) {
        lines.push('')
        lines.push('OVERALL DESIGN STRATEGY:')
        lines.push(`${designContext.overallDesignStrategy}`)
      }
    }
  }

  // NEW v3.10: Always include colors when provided (regardless of source)
  if (brandContext.primaryColor && brandContext.secondaryColor) {
    // NEW v3.10: Validation - warn if colors look suspicious
    if (brandContext.primaryColor === brandContext.secondaryColor) {
      console.warn('[Brand Context] WARNING: Primary and secondary colors are identical:', brandContext.primaryColor)
    }

    lines.push('')
    lines.push('=== COLOR PALETTE SPECIFICATION ===')

    // Add source context for better AI understanding
    const sourceLabel = ({
      brand: 'ORGANIZATION BRAND COLORS (MANDATORY)',
      preset: 'SELECTED COLOR PALETTE',
      custom: 'USER CUSTOM COLORS',
      fallback: 'DEFAULT COLORS',
      unknown: 'COLOR PALETTE',
    } as any)[colorSource] || 'COLOR PALETTE'

    lines.push(`${sourceLabel}:`)
    lines.push('')

    // Color descriptions with visual references
    lines.push(buildColorReference(brandContext.primaryColor, 'PRIMARY'))
    lines.push('- Primary usage: backgrounds, gradients, main visual areas, dominant design elements')
    lines.push('')

    lines.push(buildColorReference(brandContext.secondaryColor, 'SECONDARY'))
    lines.push('- Secondary usage: accents, highlights, supporting elements, complementary areas')
    lines.push('')

    if (brandContext.accentColor) {
      lines.push(buildColorReference(brandContext.accentColor, 'ACCENT'))
      lines.push('- Accent usage: CTAs, buttons, call-to-action elements, attention-grabbing highlights')
      lines.push('')
    }

    // v5.5: Strict enforcement for brand, custom, AND preset colors (user selections)
    // Only fallback colors get flexible guidance
    if (colorSource === 'brand' || colorSource === 'custom' || colorSource === 'preset') {
      const colorTypeLabel = {
        brand: 'organization brand',
        custom: 'user-selected custom',
        preset: 'user-selected preset',
      }[colorSource] || colorSource

      lines.push(`STRICT COLOR COMPLIANCE REQUIRED:`)
      lines.push(`- Background MUST use Primary Color (${brandContext.primaryColor}) as dominant color - match the EXACT tone`)
      lines.push(`- DO NOT use generic interpretations - use the EXACT hex values provided above`)
      lines.push(`- Headlines MUST have high contrast against the background (7:1 ratio minimum)`)
      lines.push(`- CTAs/Buttons MUST use Accent Color (${brandContext.accentColor || brandContext.secondaryColor}) for maximum visibility`)
      lines.push(`- These ${colorTypeLabel} colors are NON-NEGOTIABLE - override any other color suggestions in this prompt`)
      lines.push(`- DO NOT substitute with theme-based colors, AI-generated palettes, or event-contextual colors`)
    } else {
      // Only 'fallback' source gets flexible guidance
      lines.push(`COLOR PALETTE GUIDANCE:`)
      lines.push(`- Use these colors as the foundation for the design color scheme`)
      lines.push(`- Primary Color (${brandContext.primaryColor}) for main elements and backgrounds`)
      lines.push(`- Secondary Color (${brandContext.secondaryColor}) for accents and highlights`)
      lines.push(`- Maintain visual harmony while ensuring proper contrast for readability`)
    }
  }

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

// v6.8: Removed visual shape language to prevent Gemini from drawing zone indicators
// Strategy: Describe the area as "atmospheric continuation" not "photo frame zone"
const SPEAKER_SHAPE_GUIDANCE: Record<string, string> = {
  circle: 'atmospheric gradient area blending with overall design - maintain visual flow',
  rounded: 'atmospheric gradient area blending with overall design - maintain visual flow',
  square: 'atmospheric gradient area blending with overall design - maintain visual flow',
}

/**
 * Build speaker photo zone context
 * Reserves area for speaker photo overlay in event posters
 *
 * v3.6: CRITICAL FIX - Only generate context when user has ACTUALLY uploaded a photo
 * When hasUserPhoto=false, we now return NOTHING to prevent AI from creating placeholder frames
 * The placeholder frame issue was caused by instructions telling AI to create visible frames
 *
 * v3.5: Multi-speaker support - handles both single and multiple speaker photos
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
  const speakerCount = config.speakerCount || 1
  const isSingleSpeaker = config.isSingleSpeaker !== false

  // v3.5: Multi-speaker handling
  // v3.7: Avoid "ZONE", "overlay", "composited" language that Gemini renders literally
  if (!isSingleSpeaker && speakerCount > 1) {
    return `BACKGROUND AREAS: The ${SPEAKER_POSITION_DESCRIPTIONS[position] || position} area needs ${speakerCount} clean background sections (${SPEAKER_SIZE_DIMENSIONS[size] || size} each, ${SPEAKER_SHAPE_GUIDANCE[shape] || shape}). Keep these areas clean with simple backgrounds (solid color, subtle gradient, or matching design). Do not draw faces, people, human figures, shapes, frames, or text in these areas - just clean background.`
  }

  // v3.7: Single speaker - avoid trigger words
  return `BACKGROUND AREA: The ${SPEAKER_POSITION_DESCRIPTIONS[position] || position} area (${SPEAKER_SIZE_DIMENSIONS[size] || size}, ${SPEAKER_SHAPE_GUIDANCE[shape] || shape}) needs a clean background. Keep this area clean with a simple background (solid color, subtle gradient, or matching design). Do not draw faces, people, human figures, shapes, frames, or text - just clean background.`
}

// ============================================================
// SPEAKER DETAILS FORMATTING (v3.5)
// ============================================================

/**
 * Format speaker details with structured layout
 * Similar to event details formatting for consistency
 */
export function formatSpeakerDetails(speaker: { name: string; designation?: string }): string {
  const parts: string[] = []

  if (speaker.name) {
    parts.push(`"${speaker.name}"`)  // No "Name:" label - per CLAUDE.md, labels render as visible text
  }

  if (speaker.designation) {
    parts.push(`"${speaker.designation}"`)  // No "Designation:" label
  }

  return parts.join(', ')  // Comma-separated instead of newlines for cleaner rendering
}

/**
 * Format multiple speakers with structured layout
 */
export function formatMultipleSpeakers(speakers: Array<{ name: string; designation?: string }>): string {
  if (speakers.length === 0) return ''

  if (speakers.length === 1) {
    return formatSpeakerDetails(speakers[0])
  }

  return speakers.map((speaker, index) => {
    const speakerNum = index + 1
    return `Speaker ${speakerNum}:\n   ${formatSpeakerDetails(speaker).replace(/\n   /g, '\n     ')}`
  }).join('\n   ')
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

// ============================================================
// DESIGN INTELLIGENCE HELPERS
// ============================================================

import type { BriefAnalysisInput, DesignContext } from './types'

/**
 * v4.9: Event-aware fallback context presets
 * When Design Intelligence fails, we use intelligent pattern matching to provide
 * event-appropriate styling instead of a generic fallback
 */
/**
 * v5.4: ENHANCED celebration presets with RICH, EXPLICIT festive elements
 * These presets use sophisticationLevel: 'rich' to ensure immersive, visually abundant designs
 * instead of minimal/balanced approaches. Each preset includes specific, detailed elements
 * that AI image generators can render accurately.
 */
const CELEBRATION_PRESETS: Record<string, Partial<DesignContext> & { sophisticationLevel?: string }> = {
  'new year': {
    corePurpose: "Create a SPECTACULAR, visually rich New Year celebration with abundant festive imagery",
    visualElements: [
      "Brilliant fireworks exploding across the midnight sky in gold, silver, and purple",
      "Elegant champagne glasses with golden bubbles and fizz",
      "Ornate countdown clock showing midnight with gold roman numerals",
      "Cascading confetti and streamers in metallic gold, silver, and black",
      "Sparkling stars and glitter particle effects throughout",
      "Metallic balloons in gold, silver, black, and rose gold clusters",
      "City skyline silhouette with celebration lights",
      "Sparklers creating light trails and magical glow"
    ],
    backgroundSetting: "Majestic midnight sky with spectacular multi-colored fireworks display, glittering city skyline silhouette below, dense starfield with twinkling stars, atmospheric purple-to-navy gradient with golden light bursts and luxurious bokeh effects creating depth and magic",
    iconicImagery: [
      "Grand fireworks display with multiple explosion types",
      "Elegant champagne toast with clinking glasses",
      "Ornate clock striking midnight with radiating light",
      "Golden confetti rain falling gracefully",
      "Twinkling stars and sparklers with light trails",
      "Party streamers in metallic colors"
    ],
    colorMood: "Luxurious and spectacular - deep midnight navy, rich purple, brilliant gold, shimmering silver, champagne, warm white glow",
    designStrategy: "IMMERSIVE RICHNESS - Create a spectacular, visually abundant celebration scene with multiple layers of festive elements at different depths. Fireworks should dominate the sky, confetti should fill the space, and every corner should feel celebratory.",
    decorativeElements: {
      corners: "Ornate gold sparkle bursts with confetti trails and ribbon swirls",
      patterns: "Dense starfield with scattered confetti, multiple firework trails",
      accents: "Gold and silver metallic shimmer, glowing light rays, sparkle effects"
    },
    creativeTwist: "Elegant display serif typography with gold gradient, shimmer effect, and subtle confetti overlay",
    emotionalJob: "Feel the magical excitement of new beginnings and spectacular celebration",
    sophisticationLevel: 'rich'
  },
  'christmas': {
    corePurpose: "Create a RICHLY DECORATED, immersive Christmas celebration with abundant magical festive imagery",
    visualElements: [
      "Majestic decorated Christmas tree with twinkling multicolor lights, red and gold ornaments, and shining star topper",
      "Santa Claus silhouette with flying reindeer and sleigh across moonlit sky",
      "Piles of beautifully wrapped gift boxes with satin ribbons and bows in red, gold, and silver",
      "Gentle snowfall with detailed snowflakes drifting down",
      "Holly branches with glossy red berries and pine needle accents",
      "Red and white striped candy canes with festive bows",
      "Golden bells with red ribbons and pine garland",
      "Warm glowing fireplace with Christmas stockings",
      "Snow-covered pine branches with icicles",
      "Gingerbread house and cookie decorations"
    ],
    backgroundSetting: "Immersive winter wonderland scene - rich gradient from deep midnight blue at top transitioning to warm crimson red and forest green, featuring gently falling snow with visible snowflakes, magical bokeh Christmas lights in warm white and multicolor, soft atmospheric mist, starlit night sky with twinkling stars, creating a sense of cozy magical winter evening",
    iconicImagery: [
      "Grand decorated Christmas tree as majestic focal point with ornaments and lights",
      "Santa Claus with sleigh and reindeer silhouette flying across moon",
      "Scattered wrapped presents with elegant festive ribbons in various sizes",
      "Glowing golden stars and shimmering ornaments hanging",
      "Snow-covered pine branches with realistic frost",
      "Red and gold baubles with reflective surfaces",
      "Candy canes and gingerbread accents",
      "Holly wreaths with red berry clusters"
    ],
    colorMood: "Rich and luxurious festive palette - deep crimson red, forest green, royal gold metallic, warm glowing white, midnight blue accents, silver shimmer, snow white",
    designStrategy: "IMMERSIVE RICHNESS - Create a visually abundant, magical Christmas scene that feels warm, joyful and spectacular. Multiple layers of festive elements at different depths - background snow and stars, midground trees and decorations, foreground presents and ornaments. Every space should feel festively decorated.",
    decorativeElements: {
      corners: "Ornate corner flourishes with holly branches, pine needles, golden ornaments, and ribbon swirls",
      patterns: "Scattered detailed snowflakes of varying sizes, subtle Christmas light bokeh, ornament silhouettes",
      accents: "Golden ribbons with bows, twinkling star effects, warm glowing light trails, frost and ice sparkles"
    },
    creativeTwist: "Elegant serif typography with golden shimmer effect, subtle snow dust particle overlay, warm Christmas light glow behind text",
    emotionalJob: "Feel the magical wonder, heartwarming joy, and enchanting spirit of Christmas celebration",
    sophisticationLevel: 'rich'
  },
  'diwali': {
    corePurpose: "Create a VIBRANT, LUMINOUS Diwali celebration with abundant glowing festive imagery",
    visualElements: [
      "Multiple ornate diyas (oil lamps) with dancing golden flames arranged in decorative patterns",
      "Intricate colorful rangoli patterns with geometric and floral designs in vibrant colors",
      "Brilliant fireworks bursting across the night sky in multiple colors",
      "Ornate hanging lanterns (kandils) in various shapes glowing warmly",
      "Lotus flowers floating on water with candle reflections",
      "Mango leaf and marigold flower garlands (toran) draped across",
      "Traditional brass bells and decorative kalash",
      "Sparklers creating light trails and magical effects",
      "Colorful paper lanterns and string lights",
      "Golden sweets and mithai arrangements"
    ],
    backgroundSetting: "Luminous jewel-toned gradient from deep royal purple at top through rich burgundy to warm gold, featuring multiple glowing diya flames creating warm pools of light, sparkling firework trails, atmospheric golden particles and light rays emanating outward, creating a sense of divine illumination and prosperity",
    iconicImagery: [
      "Rows of lit diyas creating patterns of light",
      "Large elaborate rangoli as central design element",
      "Brilliant colorful fireworks display",
      "Ornate traditional lanterns glowing warmly",
      "Lotus flowers with flames reflecting on water",
      "Marigold garlands and flower decorations",
      "Traditional motifs like peacocks and elephants"
    ],
    colorMood: "Vibrant and luminous - brilliant gold, rich orange, deep red, royal purple, hot pink, emerald green, warm white glow from flames",
    designStrategy: "IMMERSIVE RICHNESS - Create a luminous, visually abundant celebration of light. Multiple glowing elements at different depths - background fireworks, midground lanterns and rangoli, foreground diyas. The design should radiate warmth and light from every element.",
    decorativeElements: {
      corners: "Elaborate rangoli-inspired geometric patterns with diya accents and golden borders",
      patterns: "Intricate mandala and paisley motifs, swirling light particle effects",
      accents: "Golden light rays emanating outward, sparkle effects, flame glow halos"
    },
    creativeTwist: "Elegant typography with golden gradient, warm light glow behind text, subtle light burst radiating effects",
    emotionalJob: "Feel illuminated, prosperous, spiritually uplifted, and surrounded by divine light",
    sophisticationLevel: 'rich'
  },
  'birthday': {
    corePurpose: "Create a JOYFUL, COLORFUL birthday celebration with abundant party elements",
    visualElements: [
      "Clusters of colorful helium balloons in various sizes - red, blue, yellow, pink, gold",
      "Cascading confetti in rainbow colors falling throughout the design",
      "Elegant birthday cake with lit candles, frosting, and decorations",
      "Colorful streamers and party ribbons swirling dynamically",
      "Wrapped gift boxes with decorative bows and ribbons stacked",
      "Party hats and celebration crackers",
      "Glittering stars and sparkle effects scattered throughout",
      "Banner bunting in festive colors",
      "Cupcakes with colorful frosting and sprinkles",
      "Party poppers exploding with confetti"
    ],
    backgroundSetting: "Bright, cheerful gradient from warm pink through coral to golden yellow, featuring floating balloons at various depths, cascading confetti creating movement, subtle sparkle and glitter particle effects, soft bokeh lights in party colors creating a festive atmosphere",
    iconicImagery: [
      "Large colorful balloon clusters floating upward",
      "Rainbow confetti shower filling the space",
      "Decorated birthday cake centerpiece with candles",
      "Wrapped presents with elaborate bows",
      "Party streamers in dynamic swirling patterns",
      "Glittering stars and sparkles everywhere"
    ],
    colorMood: "Bright, cheerful, and vibrant - hot pink, sunshine yellow, sky blue, coral, gold accents, rainbow spectrum",
    designStrategy: "IMMERSIVE RICHNESS - Create a fun, visually abundant party scene bursting with celebration. Balloons everywhere, confetti filling the air, streamers adding movement. Every corner should feel like a joyous party.",
    decorativeElements: {
      corners: "Balloon clusters with trailing ribbons, confetti bursts, streamer swirls",
      patterns: "Scattered confetti dots, star patterns, polka dots",
      accents: "Sparkle and glitter effects, rainbow gradients, metallic gold highlights"
    },
    creativeTwist: "Playful bold typography with multi-color gradient, confetti texture overlay, sparkle effects on letters",
    emotionalJob: "Feel celebrated, special, happy, and surrounded by joyful party energy",
    sophisticationLevel: 'rich'
  },
  'congratulations': {
    corePurpose: "Create an ELEGANT, CELEBRATORY congratulations with sophisticated festive elements",
    visualElements: [
      "Elegant gold and silver ribbons flowing gracefully",
      "Cascading golden confetti and metallic streamers",
      "Champagne glasses with sparkling bubbles",
      "Ornate laurel wreaths and victory symbols",
      "Twinkling stars and sparkle effects",
      "Trophy or medal silhouettes for achievement",
      "Elegant floral arrangements with roses",
      "Fireworks or light burst effects"
    ],
    backgroundSetting: "Sophisticated gradient from deep navy blue to champagne gold with elegant light rays, scattered golden confetti, subtle sparkle particles, luxurious bokeh effects creating depth and celebration",
    iconicImagery: [
      "Flowing gold and silver ribbons",
      "Golden laurel wreath of achievement",
      "Champagne toast with elegant glasses",
      "Cascading confetti in metallic colors",
      "Twinkling stars and sparklers",
      "Victory trophy or medal symbols"
    ],
    colorMood: "Sophisticated celebration - royal navy, champagne gold, silver, white, burgundy accents",
    designStrategy: "ELEGANT RICHNESS - Create a refined yet abundant celebration scene. Elements should feel premium and sophisticated while still being visually generous with celebratory details.",
    decorativeElements: {
      corners: "Elegant laurel branch accents with golden ribbons and subtle confetti",
      patterns: "Scattered gold confetti, subtle star patterns, flowing ribbon trails",
      accents: "Gold foil shimmer effects, champagne sparkle, elegant light rays"
    },
    creativeTwist: "Elegant serif typography with gold gradient, sophisticated shimmer, subtle confetti texture",
    emotionalJob: "Feel proud, accomplished, honored, and elegantly celebrated",
    sophisticationLevel: 'rich'
  }
}

/**
 * v5.5: EVENT CONTEXT PRESETS - Rich visual context for ALL event types
 * These presets provide event-specific visual elements, backgrounds, and design strategies
 * for workshops, seminars, conferences, hackathons, etc.
 *
 * Organized by category:
 * - ACADEMIC: seminar, workshop, conference, webinar, training, etc.
 * - COMPETITION: hackathon, quiz, debate, sports, etc.
 * - CORPORATE: meetup, exhibition, product_launch, award_ceremony, etc.
 * - COMMUNITY: blood_donation, health_camp, charity, etc.
 * - NATIONAL: independence_day, republic_day, teachers_day, etc.
 */
const EVENT_CONTEXT_PRESETS: Record<string, Partial<DesignContext> & { sophisticationLevel?: string }> = {
  // ============================================================
  // ACADEMIC EVENTS
  // ============================================================
  seminar: {
    corePurpose: "Create a professional, knowledge-focused seminar announcement that attracts intellectually curious attendees",
    visualElements: [
      "Elegant podium with microphone under professional spotlight",
      "Distinguished speaker silhouette at lectern",
      "Modern auditorium or conference room setting",
      "Presentation screen with abstract infographic elements",
      "Thought-provoking lightbulb or brain imagery",
      "Professional audience silhouettes engaged in learning"
    ],
    backgroundSetting: "Sophisticated gradient from deep navy blue to teal with subtle geometric patterns, professional lighting effects, and a modern academic atmosphere suggesting intellectual discourse",
    iconicImagery: [
      "Speaker at podium with microphone",
      "Lightbulb representing ideas",
      "Abstract knowledge network patterns",
      "Professional venue silhouette"
    ],
    colorMood: "Professional and authoritative - deep navy, teal, gold accents, crisp white",
    designStrategy: "PROFESSIONAL SOPHISTICATION - Clean, authoritative design with clear hierarchy. Knowledge and expertise should be visually apparent.",
    decorativeElements: {
      corners: "Subtle geometric accent patterns",
      patterns: "Abstract network or circuit-like connections",
      accents: "Gold or brass metallic highlights"
    },
    sophisticationLevel: 'balanced'
  },
  workshop: {
    corePurpose: "Create an energetic, hands-on workshop announcement that emphasizes practical learning and skill-building",
    visualElements: [
      "Hands-on demonstration with tools or equipment",
      "Collaborative group working together at tables",
      "Step-by-step process visualization",
      "Interactive whiteboard with diagrams and notes",
      "Practical tools and materials spread out",
      "Participants actively engaged in learning"
    ],
    backgroundSetting: "Warm, inviting gradient from orange to coral transitioning to professional blue, with dynamic geometric shapes suggesting activity and collaboration",
    iconicImagery: [
      "Hands working on a project",
      "Tools and equipment icons",
      "Collaborative team imagery",
      "Progress or learning path visualization"
    ],
    colorMood: "Warm and energetic - vibrant orange, coral, blue accents, warm white",
    designStrategy: "DYNAMIC ENGAGEMENT - Active, hands-on feel with visual elements that suggest movement and participation. Should feel approachable and exciting.",
    decorativeElements: {
      corners: "Dynamic tool or gear icons",
      patterns: "Blueprint or schematic-style grids",
      accents: "Bright highlight colors for emphasis"
    },
    sophisticationLevel: 'balanced'
  },
  conference: {
    corePurpose: "Create a prestigious, large-scale conference announcement that conveys industry leadership and networking opportunity",
    visualElements: [
      "Grand auditorium with impressive stage lighting",
      "Multiple speakers on elevated panel stage",
      "Networking crowd with professional badges",
      "Conference banner backdrop with event branding",
      "Multiple breakout session visuals",
      "Global connectivity and reach imagery"
    ],
    backgroundSetting: "Premium dark gradient from midnight blue to purple with subtle spotlight effects, golden accent lighting, and a sense of grandeur and prestige",
    iconicImagery: [
      "Grand stage with multiple speakers",
      "Global network connections",
      "Professional crowd networking",
      "Conference badges and lanyards"
    ],
    colorMood: "Prestigious and global - deep blue, purple, gold, white highlights",
    designStrategy: "GRAND PRESTIGE - Large-scale, impressive design that conveys industry importance. Multiple visual layers suggesting scale and networking opportunity.",
    decorativeElements: {
      corners: "Elegant geometric frames",
      patterns: "Abstract global network patterns",
      accents: "Gold foil and metallic highlights"
    },
    sophisticationLevel: 'rich'
  },
  webinar: {
    corePurpose: "Create a modern, digital-first webinar announcement that emphasizes accessibility and virtual connection",
    visualElements: [
      "Laptop screen showing live presenter interface",
      "Video conference grid with participant tiles",
      "Digital connection globe with network lines",
      "Modern headset with microphone",
      "Play button and streaming indicators",
      "Chat and engagement icons floating"
    ],
    backgroundSetting: "Modern tech gradient from electric blue to purple with digital particles, soft glow effects, and a clean virtual environment aesthetic",
    iconicImagery: [
      "Video call interface mockup",
      "Digital globe with connections",
      "Streaming and play icons",
      "Virtual attendee avatars"
    ],
    colorMood: "Digital and accessible - electric blue, purple, teal, white",
    designStrategy: "DIGITAL MODERN - Clean, tech-forward design emphasizing virtual accessibility. Should feel innovative and easy to join.",
    decorativeElements: {
      corners: "Digital circuit or pixel patterns",
      patterns: "Network connection lines and nodes",
      accents: "Glowing digital elements"
    },
    sophisticationLevel: 'balanced'
  },
  training: {
    corePurpose: "Create a skill-focused training program announcement that emphasizes professional development and certification",
    visualElements: [
      "Instructor demonstrating technique or concept",
      "Certification badge or credential symbol",
      "Progress chart showing skill improvement",
      "Training manual with highlighted sections",
      "Participants taking notes and practicing",
      "Skill progression pathway visualization"
    ],
    backgroundSetting: "Professional gradient from blue to green symbolizing growth and development, with ascending visual elements and a sense of progression",
    iconicImagery: [
      "Certification badge",
      "Growth chart ascending",
      "Professional development icons",
      "Learning path steps"
    ],
    colorMood: "Growth and development - professional blue, growth green, achievement gold",
    designStrategy: "PROFESSIONAL GROWTH - Design that emphasizes skill building and career advancement. Clear progression and achievement imagery.",
    decorativeElements: {
      corners: "Achievement badge corners",
      patterns: "Ascending steps or growth charts",
      accents: "Certificate seal elements"
    },
    sophisticationLevel: 'balanced'
  },

  // ============================================================
  // COMPETITION EVENTS
  // ============================================================
  hackathon: {
    corePurpose: "Create an exciting, high-energy hackathon announcement that attracts innovative developers and problem-solvers",
    visualElements: [
      "Developers coding intensely on multiple screens",
      "Whiteboard covered with ideas, diagrams, and sticky notes",
      "Countdown timer display showing time pressure",
      "Team huddles discussing solutions",
      "Multiple laptop screens with colorful code",
      "Energy drinks, snacks, and late-night atmosphere",
      "Binary code or matrix-style backgrounds"
    ],
    backgroundSetting: "High-energy dark gradient with neon accents (cyan, magenta, green), code fragments floating in background, matrix-style digital rain effects, and glowing terminal-like elements creating an intense coding atmosphere",
    iconicImagery: [
      "Code on glowing screens",
      "Countdown timer",
      "Team collaboration",
      "Trophy for winners",
      "Keyboard and mouse action"
    ],
    colorMood: "High-tech and intense - dark background, neon cyan, magenta, electric green, white",
    designStrategy: "HIGH-ENERGY TECH - Intense, code-driven aesthetic with high contrast. Should feel like an exciting challenge with time pressure.",
    decorativeElements: {
      corners: "Code brackets { } and syntax elements",
      patterns: "Matrix-style code rain, binary patterns",
      accents: "Neon glow effects, terminal cursors"
    },
    sophisticationLevel: 'rich'
  },
  competition: {
    corePurpose: "Create a thrilling competition announcement that inspires participants to compete and win",
    visualElements: [
      "Gleaming trophy cup under dramatic spotlight",
      "Gold medal with ribbon on podium",
      "Participants in competitive action",
      "Scoreboard showing rankings",
      "Victory celebration moment",
      "Referee or judge making decision"
    ],
    backgroundSetting: "Dynamic gradient with bold reds, golds, and deep blues, spotlight effects highlighting the prize, and an atmosphere of competitive energy",
    iconicImagery: [
      "Trophy cup centerpiece",
      "Podium with 1st, 2nd, 3rd places",
      "Medal with ribbon",
      "Victory fist pump"
    ],
    colorMood: "Competitive and victorious - bold red, gold, deep blue, silver",
    designStrategy: "VICTORY FOCUS - Bold, competitive design centered on winning. Clear emphasis on prizes and achievement.",
    decorativeElements: {
      corners: "Laurel wreath or victory symbols",
      patterns: "Dynamic action lines and rays",
      accents: "Metallic gold and silver highlights"
    },
    sophisticationLevel: 'rich'
  },
  quiz: {
    corePurpose: "Create an engaging quiz competition announcement that emphasizes knowledge and quick thinking",
    visualElements: [
      "Buzzer buttons glowing on desks",
      "Quiz master with question cards",
      "Participant with hand raised to answer",
      "Digital scoreboard with team standings",
      "Large question mark symbols",
      "Spotlight on answering contestant"
    ],
    backgroundSetting: "Fun, vibrant gradient with purple, blue, and yellow, featuring question mark patterns, brain icons, and a game show atmosphere",
    iconicImagery: [
      "Giant question mark",
      "Buzzer button",
      "Brain with lightbulb",
      "Scoreboard display"
    ],
    colorMood: "Fun and intellectual - vibrant purple, electric blue, yellow, white",
    designStrategy: "GAME SHOW FUN - Exciting, quiz-show aesthetic with emphasis on knowledge testing. Should feel fun yet competitive.",
    decorativeElements: {
      corners: "Question mark patterns",
      patterns: "Brain and lightbulb icons",
      accents: "Glowing buzzer effects"
    },
    sophisticationLevel: 'balanced'
  },
  sports_event: {
    corePurpose: "Create a dynamic sports event announcement that captures athletic energy and excitement",
    visualElements: [
      "Athlete in peak action moment - running, jumping, or playing",
      "Stadium or arena panoramic view with lights",
      "Sports equipment - balls, rackets, goals",
      "Cheering crowd with banners and team colors",
      "Starting line or finish tape",
      "Scoreboard with match status"
    ],
    backgroundSetting: "Dynamic gradient with stadium lighting effects, lens flares, and action blur, capturing the energy and excitement of live sports",
    iconicImagery: [
      "Athlete in motion",
      "Sports equipment icons",
      "Stadium lights",
      "Victory pose"
    ],
    colorMood: "Athletic and energetic - bold team colors, grass green, stadium white, action red",
    designStrategy: "ATHLETIC ENERGY - Dynamic, action-packed design with motion and excitement. Capture the thrill of sports.",
    decorativeElements: {
      corners: "Action speed lines",
      patterns: "Sports field or court lines",
      accents: "Stadium light flares"
    },
    sophisticationLevel: 'rich'
  },

  // ============================================================
  // CORPORATE EVENTS
  // ============================================================
  product_launch: {
    corePurpose: "Create a sleek, exciting product launch announcement that builds anticipation and showcases innovation",
    visualElements: [
      "Product silhouette with dramatic unveiling lighting",
      "Curtain reveal moment with spotlight",
      "CEO or founder presenting with confidence",
      "Product close-up highlighting premium features",
      "Audience capturing moment on phones",
      "Launch countdown display"
    ],
    backgroundSetting: "Sleek, premium dark gradient with spotlight effects, subtle tech patterns, and a stage-like atmosphere suggesting a major reveal",
    iconicImagery: [
      "Product under spotlight",
      "Unveiling curtain",
      "Innovation spark symbols",
      "Excited audience silhouettes"
    ],
    colorMood: "Premium and innovative - sleek black, spotlight white, brand accent color, metallic",
    designStrategy: "PREMIUM REVEAL - Sleek, Apple-style product focus with dramatic lighting. Build anticipation for the reveal.",
    decorativeElements: {
      corners: "Minimal geometric accents",
      patterns: "Subtle tech grid or circuit patterns",
      accents: "Spotlight and lens flare effects"
    },
    sophisticationLevel: 'rich'
  },
  award_ceremony: {
    corePurpose: "Create an elegant, prestigious award ceremony announcement that celebrates excellence and achievement",
    visualElements: [
      "Winner receiving trophy on glamorous stage",
      "Red carpet entrance with velvet ropes",
      "Crystal trophy or golden statuette gleaming",
      "Spotlight illuminating the stage",
      "Nominees seated in formal attire",
      "Standing ovation moment"
    ],
    backgroundSetting: "Luxurious gradient from deep burgundy to gold, with velvet texture effects, soft spotlight bokeh, and a prestigious gala atmosphere",
    iconicImagery: [
      "Gleaming trophy centerpiece",
      "Red carpet",
      "Spotlight on winner",
      "Elegant stage setup"
    ],
    colorMood: "Glamorous and prestigious - deep burgundy, rich gold, crystal clear, black tie elegance",
    designStrategy: "ELEGANT PRESTIGE - Glamorous, award-show aesthetic with luxury touches. Should feel like a prestigious celebration of excellence.",
    decorativeElements: {
      corners: "Elegant laurel wreath frames",
      patterns: "Art deco or geometric elegance",
      accents: "Gold foil and crystal sparkle"
    },
    sophisticationLevel: 'rich'
  },
  meetup: {
    corePurpose: "Create a welcoming, approachable meetup announcement that encourages community connection",
    visualElements: [
      "Professionals networking with coffee in hand",
      "Name badge stickers on friendly attendees",
      "Casual discussion circles in comfortable space",
      "Community banner or logo prominently displayed",
      "Informal presentation or lightning talk",
      "Diverse group of attendees mingling"
    ],
    backgroundSetting: "Warm, inviting gradient with coffee shop or co-working space vibes, friendly lighting, and a sense of community gathering",
    iconicImagery: [
      "People connecting",
      "Coffee cups",
      "Community logo",
      "Conversation bubbles"
    ],
    colorMood: "Warm and welcoming - warm orange, friendly blue, coffee brown, cream",
    designStrategy: "COMMUNITY WARMTH - Approachable, friendly design that emphasizes connection. Should feel welcoming and low-pressure.",
    decorativeElements: {
      corners: "Friendly rounded shapes",
      patterns: "Connection dots and lines",
      accents: "Warm highlight accents"
    },
    sophisticationLevel: 'balanced'
  },
  networking: {
    corePurpose: "Create a professional networking event announcement that emphasizes valuable connections and opportunities",
    visualElements: [
      "Business card exchange handshake",
      "Professionals in engaged conversation groups",
      "Elegant name tags and lanyards",
      "Cocktail reception or rooftop setting",
      "LinkedIn or contact sharing visual",
      "Sophisticated venue atmosphere"
    ],
    backgroundSetting: "Sophisticated evening gradient with city lights bokeh, elegant venue lighting, and an upscale networking atmosphere",
    iconicImagery: [
      "Handshake connection",
      "Business cards",
      "City skyline",
      "Professional silhouettes"
    ],
    colorMood: "Sophisticated professional - navy, silver, city lights, champagne",
    designStrategy: "PROFESSIONAL ELEGANCE - Upscale, business-focused design emphasizing valuable connections. Should feel like an opportunity.",
    decorativeElements: {
      corners: "Elegant geometric frames",
      patterns: "Network connection lines",
      accents: "City light bokeh effects"
    },
    sophisticationLevel: 'balanced'
  },

  // ============================================================
  // COMMUNITY EVENTS
  // ============================================================
  blood_donation: {
    corePurpose: "Create a compassionate, life-saving blood donation campaign that inspires donors to help save lives",
    visualElements: [
      "Blood donation bag with crimson liquid",
      "Caring hands reaching out to help",
      "Heart symbol with blood drop",
      "Comfortable donation chair in clean setting",
      "Smiling donor with bandaged arm showing courage",
      "Red cross or medical symbol of trust"
    ],
    backgroundSetting: "Warm, caring gradient from red to soft pink with clean medical aesthetic, gentle heart rhythms, and an atmosphere of compassion and life-saving",
    iconicImagery: [
      "Blood drop in heart shape",
      "Helping hands",
      "Red cross symbol",
      "Life-saving heartbeat line"
    ],
    colorMood: "Compassionate and vital - life-saving red, caring pink, clean white, trust blue",
    designStrategy: "LIFE-SAVING COMPASSION - Warm, encouraging design that emphasizes the impact of donation. Should inspire action through empathy.",
    decorativeElements: {
      corners: "Gentle heart or drop shapes",
      patterns: "Heartbeat ECG lines",
      accents: "Soft red glow accents"
    },
    sophisticationLevel: 'balanced'
  },
  health_camp: {
    corePurpose: "Create a caring, accessible health camp announcement that encourages community wellness participation",
    visualElements: [
      "Doctor consulting patient with care",
      "Health screening stations with equipment",
      "Blood pressure monitor and stethoscope",
      "Medical team in professional attire",
      "Health awareness informational banners",
      "Diverse community members getting checkups"
    ],
    backgroundSetting: "Clean, fresh gradient from green to light blue symbolizing health and vitality, with gentle medical iconography and a welcoming healthcare atmosphere",
    iconicImagery: [
      "Stethoscope",
      "Health checkmark in heart",
      "Medical cross",
      "Caring doctor"
    ],
    colorMood: "Healthy and caring - fresh green, clean blue, medical white, caring pink",
    designStrategy: "WELLNESS CARE - Clean, professional medical design that feels accessible and caring. Emphasize free/community aspect.",
    decorativeElements: {
      corners: "Medical cross or health symbols",
      patterns: "Subtle health-related icons",
      accents: "Fresh green highlights"
    },
    sophisticationLevel: 'balanced'
  },
  charity_event: {
    corePurpose: "Create a heartfelt charity event announcement that inspires generosity and community support",
    visualElements: [
      "Donation hands coming together",
      "Beneficiaries receiving support with gratitude",
      "Elegant charity gala dinner setup",
      "Auction items beautifully displayed",
      "Volunteer team in branded shirts",
      "Impact statistics showing difference made"
    ],
    backgroundSetting: "Elegant, heartfelt gradient from deep purple to warm gold, with soft lighting, generosity symbols, and an atmosphere of giving and community",
    iconicImagery: [
      "Giving hands with heart",
      "Charity ribbon",
      "Community together",
      "Impact numbers"
    ],
    colorMood: "Generous and elegant - deep purple, warm gold, compassion pink, hope white",
    designStrategy: "GENEROUS ELEGANCE - Heartfelt yet sophisticated design that inspires giving. Balance emotion with impact data.",
    decorativeElements: {
      corners: "Heart and giving hand symbols",
      patterns: "Gentle wave or flow patterns",
      accents: "Golden generosity highlights"
    },
    sophisticationLevel: 'balanced'
  },

  // ============================================================
  // NATIONAL EVENTS
  // ============================================================
  independence_day: {
    corePurpose: "Create a patriotic Independence Day celebration that honors national pride and freedom",
    visualElements: [
      "National flag hoisting ceremony with pride",
      "Tricolor balloons and decorations everywhere",
      "Patriotic parade with marching",
      "Freedom fighter silhouettes paying tribute",
      "August 15 date prominently displayed",
      "National emblem and symbols"
    ],
    backgroundSetting: "Patriotic tricolor gradient (saffron, white, green) with subtle flag wave effects, golden sunrise representing freedom's dawn, and national pride atmosphere",
    iconicImagery: [
      "National flag waving",
      "Ashoka Chakra",
      "Dove of peace",
      "Sunrise of freedom"
    ],
    colorMood: "Patriotic and proud - saffron, white, green, gold, navy",
    designStrategy: "NATIONAL PRIDE - Bold, patriotic design with national colors and symbols. Should inspire pride and honor sacrifice.",
    decorativeElements: {
      corners: "Tricolor ribbon corners",
      patterns: "Flag wave patterns",
      accents: "Golden national emblem highlights"
    },
    sophisticationLevel: 'rich'
  },
  republic_day: {
    corePurpose: "Create a dignified Republic Day celebration that honors the constitution and national values",
    visualElements: [
      "Ceremonial parade with impressive floats",
      "Constitution book illustration with reverence",
      "National flag unfurling majestically",
      "Armed forces march past with precision",
      "January 26 date prominently featured",
      "Indian national emblem"
    ],
    backgroundSetting: "Dignified tricolor gradient with constitutional elements, parade ground atmosphere, and morning light suggesting the dawn of the republic",
    iconicImagery: [
      "Constitution book",
      "National emblem",
      "Parade march",
      "Flag unfurling"
    ],
    colorMood: "Dignified and constitutional - saffron, white, green, navy, constitutional gold",
    designStrategy: "CONSTITUTIONAL DIGNITY - Formal, respectful design honoring the republic. Balance pride with solemnity.",
    decorativeElements: {
      corners: "Ashoka pillar elements",
      patterns: "Parade precision lines",
      accents: "Constitutional gold accents"
    },
    sophisticationLevel: 'rich'
  },
  teachers_day: {
    corePurpose: "Create a heartfelt Teachers Day celebration that honors educators and expresses gratitude",
    visualElements: [
      "Apple on teacher's desk - classic symbol",
      "Blackboard with heartfelt thank you message",
      "Student presenting flowers to beloved teacher",
      "Warm classroom teaching moment",
      "September 5 date with significance",
      "Books, graduation cap, and learning symbols"
    ],
    backgroundSetting: "Warm, grateful gradient from chalkboard green to warm amber, with classroom elements, books, and an atmosphere of appreciation and respect",
    iconicImagery: [
      "Apple for teacher",
      "Chalkboard with message",
      "Books and learning",
      "Grateful student"
    ],
    colorMood: "Warm and grateful - chalkboard green, warm amber, apple red, wisdom brown",
    designStrategy: "GRATEFUL WARMTH - Heartfelt, appreciative design honoring teachers. Should feel personal and thankful.",
    decorativeElements: {
      corners: "Book and apple accents",
      patterns: "Chalkboard or writing elements",
      accents: "Warm gratitude highlights"
    },
    sophisticationLevel: 'balanced'
  }
}

/**
 * Detect the celebration type from title/description
 */
function detectCelebrationType(title?: string, description?: string): string | null {
  const combined = `${title || ''} ${description || ''}`.toLowerCase()

  if (combined.includes('new year') || combined.includes('happy year')) return 'new year'
  if (combined.includes('christmas') || combined.includes('xmas') || combined.includes('merry')) return 'christmas'
  if (combined.includes('diwali') || combined.includes('deepavali')) return 'diwali'
  if (combined.includes('birthday') || combined.includes('bday')) return 'birthday'
  if (combined.includes('congratulation') || combined.includes('congrats')) return 'congratulations'

  return null
}

/**
 * v5.5: Detect event type from title/description
 * Returns the event type key that matches EVENT_CONTEXT_PRESETS
 */
function detectEventType(title?: string, description?: string, eventType?: string): string | null {
  // If eventType is explicitly provided and we have a preset for it, use it
  if (eventType && EVENT_CONTEXT_PRESETS[eventType]) {
    return eventType
  }

  const combined = `${title || ''} ${description || ''}`.toLowerCase()

  // Academic events
  if (combined.includes('workshop') || combined.includes('hands-on') || combined.includes('bootcamp')) return 'workshop'
  if (combined.includes('seminar') || combined.includes('lecture') || combined.includes('talk')) return 'seminar'
  if (combined.includes('conference') || combined.includes('summit') || combined.includes('convention')) return 'conference'
  if (combined.includes('webinar') || combined.includes('online session') || combined.includes('virtual')) return 'webinar'
  if (combined.includes('training') || combined.includes('certification') || combined.includes('skill')) return 'training'

  // Competition events
  if (combined.includes('hackathon') || combined.includes('code sprint') || combined.includes('coding')) return 'hackathon'
  if (combined.includes('quiz') || combined.includes('trivia') || combined.includes('knowledge')) return 'quiz'
  if (combined.includes('competition') || combined.includes('contest') || combined.includes('challenge')) return 'competition'
  if (combined.includes('sports') || combined.includes('match') || combined.includes('tournament') || combined.includes('marathon')) return 'sports_event'

  // Corporate events
  if (combined.includes('launch') || combined.includes('unveil') || combined.includes('release')) return 'product_launch'
  if (combined.includes('award') || combined.includes('recognition') || combined.includes('excellence')) return 'award_ceremony'
  if (combined.includes('meetup') || combined.includes('meet-up') || combined.includes('community')) return 'meetup'
  if (combined.includes('networking') || combined.includes('connect') || combined.includes('mixer')) return 'networking'

  // Community events
  if (combined.includes('blood') || combined.includes('donation') || combined.includes('donate')) return 'blood_donation'
  if (combined.includes('health') || combined.includes('medical') || combined.includes('checkup') || combined.includes('wellness')) return 'health_camp'
  if (combined.includes('charity') || combined.includes('fundrais') || combined.includes('ngo')) return 'charity_event'

  // National events
  if (combined.includes('independence') || combined.includes('august 15') || combined.includes('freedom')) return 'independence_day'
  if (combined.includes('republic') || combined.includes('january 26') || combined.includes('constitution')) return 'republic_day'
  if (combined.includes('teacher') || combined.includes('september 5') || combined.includes('educator')) return 'teachers_day'

  return null
}

/**
 * Generate a safe fallback context when Design Intelligence fails
 * v4.9: Now event-aware - uses intelligent pattern matching to provide
 * appropriate styling based on event type instead of generic fallback
 * v5.4: Enhanced with sophisticationLevel from presets for rich festive designs
 */
export function generateFallbackContext(input: BriefAnalysisInput): DesignContext {
  // v4.9: Try to detect celebration type and use appropriate preset
  const celebrationType = detectCelebrationType(input.title, input.description)
  const celebrationPreset = celebrationType ? CELEBRATION_PRESETS[celebrationType] : null

  // v5.5: Also check for event type if no celebration type found
  const eventType = !celebrationType ? detectEventType(input.title, input.description, input.additionalContext) : null
  const eventPreset = eventType ? EVENT_CONTEXT_PRESETS[eventType] : null

  // Use celebration preset first, then event preset, then null
  const preset = celebrationPreset || eventPreset
  const detectedType = celebrationType || eventType

  // v5.5: Get sophistication level from preset
  // - Celebrations default to 'rich'
  // - Events use their preset's sophistication (mostly 'balanced', some 'rich')
  // - Fallback to 'balanced' if no type detected
  const sophisticationLevel = preset?.sophisticationLevel || (celebrationType ? 'rich' : 'balanced')

  // v5.5: Enhanced vibe keywords for celebrations AND events
  const getVibeKeywords = (): string[] => {
    // Celebration types first
    switch (celebrationType) {
      case 'christmas':
        return ["Magical", "Festive", "Warm", "Joyful", "Cozy", "Enchanting", "Abundant"]
      case 'new year':
        return ["Spectacular", "Celebratory", "Exciting", "Hopeful", "Luxurious", "Brilliant"]
      case 'diwali':
        return ["Luminous", "Vibrant", "Radiant", "Prosperous", "Divine", "Glowing"]
      case 'birthday':
        return ["Joyful", "Colorful", "Playful", "Celebratory", "Fun", "Exciting"]
      case 'congratulations':
        return ["Elegant", "Proud", "Accomplished", "Refined", "Celebratory"]
    }
    // v5.5: Event types
    switch (eventType) {
      // Academic events
      case 'seminar':
        return ["Professional", "Authoritative", "Intellectual", "Engaging", "Insightful"]
      case 'workshop':
        return ["Energetic", "Hands-on", "Interactive", "Practical", "Collaborative"]
      case 'conference':
        return ["Prestigious", "Grand", "Global", "Networking", "Innovative"]
      case 'webinar':
        return ["Digital", "Modern", "Accessible", "Connected", "Interactive"]
      case 'training':
        return ["Professional", "Skill-building", "Progressive", "Certified", "Expert"]
      // Competition events
      case 'hackathon':
        return ["High-energy", "Innovative", "Intense", "Code-driven", "Competitive"]
      case 'competition':
        return ["Competitive", "Exciting", "Victorious", "Challenging", "Thrilling"]
      case 'quiz':
        return ["Exciting", "Challenging", "Knowledge", "Competitive", "Quick-thinking"]
      case 'sports_event':
        return ["Athletic", "Energetic", "Dynamic", "Competitive", "Exciting"]
      // Corporate events
      case 'product_launch':
        return ["Innovative", "Exciting", "Revolutionary", "Premium", "Modern"]
      case 'award_ceremony':
        return ["Prestigious", "Elegant", "Celebratory", "Honored", "Accomplished"]
      case 'meetup':
        return ["Community", "Friendly", "Connected", "Networking", "Casual"]
      case 'networking':
        return ["Professional", "Connected", "Opportunity", "Growth", "Collaborative"]
      // Community events
      case 'blood_donation':
        return ["Life-saving", "Compassionate", "Heroic", "Community", "Caring"]
      case 'health_camp':
        return ["Healthy", "Caring", "Wellness", "Professional", "Community"]
      case 'charity_event':
        return ["Generous", "Caring", "Community", "Impactful", "Hopeful"]
      // National events
      case 'independence_day':
        return ["Patriotic", "Proud", "Historic", "United", "Celebratory"]
      case 'republic_day':
        return ["Patriotic", "Constitutional", "Proud", "Solemn", "Unified"]
      case 'teachers_day':
        return ["Grateful", "Respectful", "Honoring", "Appreciative", "Warm"]
      default:
        return ["Professional", "Clean", "Clear"]
    }
  }

  // v5.5: THEME OVERRIDE LOGIC
  // If user provided a specific theme (e.g. "ai", "cyberpunk"), override generic presets
  let themeOverrideContext: Partial<DesignContext> = {}
  if (input.theme) {
    const t = input.theme.toLowerCase()
    if (t.includes('ai') || t.includes('tech') || t.includes('future') || t.includes('cyber')) {
      themeOverrideContext = {
        corePurpose: "Create a futuristic, high-tech design symbolizing innovation and the future",
        visualElements: ["Neural network connections", "Digital particles", "Glowing circuit patterns", "Abstract data visualization"],
        backgroundSetting: "Deep cyber-blue and violet gradient with technological texture and glowing nodes",
        colorMood: "Futuristic and High-Tech (Neon Blue, Purple, Cyan)",
        designStrategy: "Modern tech aesthetic with sleek lines and glowing elements"
      }
    } else if (t.includes('creative') || t.includes('art')) {
      themeOverrideContext = {
        corePurpose: "Create an expressive, artistic design that stands out",
        visualElements: ["Abstract brush strokes", "Fluid shapes", "Dynamic composition", "Artistic textures"],
        backgroundSetting: "Vibrant artistic background with rich texture and depth",
        colorMood: "bold and expressive",
        designStrategy: "Creative and unconventional layout"
      }
    } else if (t.includes('royal') || t.includes('luxury') || t.includes('gold')) {
      themeOverrideContext = {
        corePurpose: "Create a prestigious, high-end luxury design",
        visualElements: ["Golden accents", "Elegant serif typography", "Subtle damask patterns", "Premium texture"],
        backgroundSetting: "Deep royal color (navy, maroon, or black) with gold foil accents",
        colorMood: "Luxurious and Premium (Gold, Black, Navy)",
        designStrategy: "Elegant, symmetrical, and prestigious"
      }
    }
  }

  // Base context (generic professional)
  const baseContext: DesignContext = {
    corePurpose: themeOverrideContext.corePurpose || preset?.corePurpose || "Create a professional and engaging design",
    desiredAction: "Engage and connect",
    emotionalJob: preset?.emotionalJob || "Feel informed and welcomed",
    visualElements: themeOverrideContext.visualElements || preset?.visualElements || ["Clean layout", "Professional typography", "Relevant imagery"],
    backgroundSetting: themeOverrideContext.backgroundSetting || preset?.backgroundSetting || "Modern professional gradient background",
    iconicImagery: preset?.iconicImagery || [],
    colorMood: themeOverrideContext.colorMood || preset?.colorMood || "Professional and clean",
    designStrategy: themeOverrideContext.designStrategy || preset?.designStrategy || "Standard professional layout with clear hierarchy",
    successMetric: "Emotional connection and engagement",
    layoutGuidance: "Balanced layout with clear visual hierarchy",
    decorativeElements: preset?.decorativeElements || {
      corners: "Clean",
      patterns: "Subtle geometric",
      accents: "Minimal"
    },
    creativeTwist: preset?.creativeTwist || "Clean modern typography",
    // v5.5: Enhanced story analysis for both celebrations AND events
    storyAnalysis: {
      narrative: detectedType
        ? `${detectedType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} ${celebrationType ? 'celebration' : 'event'}`
        : "Professional announcement",
      emotionalArc: celebrationType ? "Anticipation -> Joy -> Connection"
        : eventType ? "Interest -> Engagement -> Action"
          : "Clear -> Informative",
      themes: celebrationType ? ["Celebration", "Joy", "Connection"]
        : eventType ? ["Learning", "Engagement", "Growth"]
          : ["Professional", "Clear"],
      transformation: celebrationType ? "Everyday -> Celebratory"
        : eventType ? "Curious -> Informed -> Inspired"
          : "Uninformed -> Informed",
      context: {
        formality: celebrationType ? "casual" : "professional",
        energyLevel: celebrationType ? "high" : eventType ? "moderate" : "moderate",
        timeHorizon: "present",
        scope: "community"
      }
    },
    vibeAndMood: {
      vibeKeywords: getVibeKeywords(),
      moodAtmosphere: detectedType
        ? `${preset?.designStrategy || 'Engaging and professional'} ${celebrationType ? 'celebration' : 'event'} atmosphere`
        : "Professional atmosphere",
      emotionalTemperature: celebrationType ? "warm" : eventType ? "warm" : "neutral",
      energyDynamics: celebrationType ? "pulsing" : eventType ? "flowing" : "static",
      audienceResonance: celebrationType ? "Joy and celebration"
        : eventType ? "Interest and engagement"
          : "Clarity and professionalism"
    },
    typographyStrategy: {
      headlinePersonality: celebrationType ? "Elegant Display Serif"
        : eventType ? "Bold Modern Sans"
          : "Clear Sans-Serif",
      fontRecommendations: {
        headline: celebrationType ? "Playfair Display or Cormorant Garamond"
          : eventType ? "Montserrat or Raleway"
            : "Inter or Roboto",
        subheading: celebrationType ? "Lato or Open Sans"
          : eventType ? "Open Sans or Source Sans Pro"
            : "Inter or Roboto",
        body: "Inter or Roboto"
      },
      multiColorStrategy: {
        words: [],
        colorRhythm: "emphasis-based"
      },
      hierarchyFlow: "Center-dominant",
      sizingStrategy: celebrationType ? "dominant"
        : eventType ? "balanced"
          : "balanced"
    },
    colorStorytelling: {
      dominantHues: celebrationType ? [
        { color: "#FFD700", role: "Celebration/achievement", usage: "Primary headlines" },
        { color: "#800080", role: "Elegance/prestige", usage: "Accents" },
        { color: "#000080", role: "Trust/stability", usage: "Supporting text" }
      ] : [],
      colorPsychology: preset?.colorMood || "Professional standard"
    },
    decorativeStrategy: {
      thematicSymbols: preset?.iconicImagery || [],
      placementReasoning: celebrationType
        ? "Multi-layered festive elements at varying depths - background, midground, foreground"
        : eventType
          ? "Event-specific visual elements integrated into the design"
          : "Standard",
      opacityStrategy: celebrationType
        ? "Rich opacity for abundant decorative elements - 80%+ for focal elements, 40-60% for background accents"
        : eventType
          ? "Balanced opacity for professional yet engaging visuals - 60-80% for key elements"
          : "Low opacity for background"
    },
    layoutNarrative: {
      visualHierarchy: ["Headline", "Supporting Message", "Branding"],
      contentAreaStyle: celebrationType ? "Centered celebration"
        : eventType ? "Professional event layout"
          : "Standard professional",
      logoStripTreatment: "modern",
      spatialDensity: celebrationType ? "rich"
        : eventType && sophisticationLevel === 'rich' ? "rich"
          : "balanced"
    },
    // v5.5: Enhanced decorativeElementsContext for both celebrations and events
    decorativeElementsContext: {
      thematicElements: (preset?.iconicImagery || []).map((element, index) => ({
        element: element as string,
        placement: index === 0 ? 'center-background' : index < 3 ? 'scattered-midground' : 'corner-accents',
        opacity: index === 0 ? 0.9 : index < 3 ? 0.7 : 0.5,
        reasoning: `Key ${detectedType?.replace(/_/g, ' ') || 'professional'} imagery to enhance the ${celebrationType ? 'festive' : 'event'} atmosphere`
      })),
      sophisticationLevel: sophisticationLevel === 'minimalist' ? 'refined'
        : sophisticationLevel === 'rich' ? 'playful'
          : 'balanced',
      placementStrategy: sophisticationLevel === 'rich'
        ? celebrationType
          ? 'Multi-layered immersive placement with abundant festive elements at varying depths - background stars/sky, midground decorations/trees, foreground ornaments/details'
          : 'Multi-layered event-specific placement with thematic elements creating depth and visual interest'
        : 'Standard balanced placement'
    }
  }

  // Log which preset was used
  if (celebrationType) {
    console.log(`[Fallback Context] v5.5: Using celebration preset: ${celebrationType} with sophistication: ${sophisticationLevel}`)
  } else if (eventType) {
    console.log(`[Fallback Context] v5.5: Using event preset: ${eventType} with sophistication: ${sophisticationLevel}`)
  } else {
    console.log(`[Fallback Context] v5.5: No preset detected, using generic professional context`)
  }

  return baseContext
}

/**
 * Validate that the design context has required fields
 */
export function validateDesignContext(context: any): boolean {
  if (!context || typeof context !== 'object') return false
  return !!(context.corePurpose && context.visualElements)
}

// ============================================================
// COLOR PRIORITY RESOLUTION (v6.0)
// ============================================================

/**
 * Resolve color priority with strict user-first enforcement
 * Priority Order: Custom > Brand > Design Intelligence > Event Default
 *
 * @param options - Color sources from different contexts
 * @returns Resolved colors with source and enforcement level
 */
export function resolveColorPriority(options: {
  customColors?: { primary: string; secondary?: string; accent?: string }
  brandContext?: BrandContextPrompt
  designIntelligenceColors?: { primary: string; secondary?: string; accent?: string }
  eventContextColors?: { primary: string; secondary?: string; accent?: string }
}): {
  colors: { primary: string; secondary: string; accent: string }
  source: 'custom' | 'brand' | 'ai' | 'event'
  enforcement: 'strict' | 'flexible'
} {
  // PRIORITY 1: User custom colors (STRICT enforcement)
  if (options.customColors?.primary) {
    return {
      colors: {
        primary: options.customColors.primary,
        secondary: options.customColors.secondary || '#FFFFFF',
        accent: options.customColors.accent || '#000000'
      },
      source: 'custom',
      enforcement: 'strict'
    }
  }

  // PRIORITY 2: Brand colors (STRICT enforcement)
  if (options.brandContext?.useBrandColors && options.brandContext.primaryColor) {
    return {
      colors: {
        primary: options.brandContext.primaryColor,
        secondary: options.brandContext.secondaryColor || '#FFFFFF',
        accent: options.brandContext.accentColor || '#000000'
      },
      source: 'brand',
      enforcement: 'strict'
    }
  }

  // PRIORITY 3: AI Design Intelligence (FLEXIBLE guidance)
  if (options.designIntelligenceColors?.primary) {
    return {
      colors: {
        primary: options.designIntelligenceColors.primary,
        secondary: options.designIntelligenceColors.secondary || '#FFFFFF',
        accent: options.designIntelligenceColors.accent || '#000000'
      },
      source: 'ai',
      enforcement: 'flexible'
    }
  }

  // PRIORITY 4: Event defaults (FLEXIBLE)
  return {
    colors: {
      primary: options.eventContextColors?.primary || '#005B96',
      secondary: options.eventContextColors?.secondary || '#FFFFFF',
      accent: options.eventContextColors?.accent || '#FF6B35'
    },
    source: 'event',
    enforcement: 'flexible'
  }
}

