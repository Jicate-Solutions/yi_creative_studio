/**
 * Web Banner Prompt Builder v3.1
 * Generates XML-structured prompts for display web banners
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Theme and organization context (v3.1)
 * - Size variations for different banner formats
 */

import type { WebBannerFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLanguageContext,
  buildLayoutZoneContext,
} from '../context-helpers'
import { WEB_BANNER_EXAMPLES } from '../examples'

// v6.0 Phase 2: Color personality system
import { analyzeColorPersonality, generateColorAwareBackground } from '@/lib/prompts/helpers/color-personality'
import type { ResolvedColors } from '@/lib/utils/resolve-color-config'
import type { DesignContextForPrompt } from '../types'

// Import logo zone enforcement helper (v3.4)
import { buildForbiddenZonesSection, buildZoneReminderSection, buildPixelPreciseSpatialConstraints } from '../helpers/logo-zone-enforcement'
import { getSophistication, getIntegratedZoneContext } from '../helpers/sophistication-helper'

// Import decorative elements injector (v4.4)
import { buildDecorativeElementsSection, buildBackgroundSettingSection } from '../helpers/decorative-elements-injector'

// ============================================================
// SIZE VARIATIONS (v6.0 Phase 2 & 3: Dynamic Color + Custom Themes)
// ============================================================

interface BannerSizeContext {
  dimensions: string
  layout: string
  textGuidance: string
  structure: string
  maxWords: number
  visualStyle?: string  // v6.0: Enhanced with design intelligence
  colorAdvice?: string  // v6.0: Enhanced with color personality
}

/**
 * v6.0: Get base size constraints (dimensions, layout structure)
 */
function getBaseSizeConstraints(size?: string): Omit<BannerSizeContext, 'visualStyle' | 'colorAdvice'> {
  const sizeConstraints: Record<string, Omit<BannerSizeContext, 'visualStyle' | 'colorAdvice'>> = {
    leaderboard: {
      dimensions: '728x90 pixels',
      layout: 'Horizontal strip layout - Text left/center, CTA right',
      textGuidance: 'Max 5-7 words headline, ultra-compact',
      structure: 'Logo left 15% → Headline center 55% → CTA right 30%',
      maxWords: 7,
    },
    'medium_rectangle': {
      dimensions: '300x250 pixels',
      layout: 'Compact square layout - Stacked elements',
      textGuidance: 'Headline 3-5 words, room for supporting text',
      structure: 'Logo top 15% → Headline 35% → Value prop 25% → CTA 25%',
      maxWords: 10,
    },
    'wide_skyscraper': {
      dimensions: '160x600 pixels',
      layout: 'Tall vertical layout - Stacked elements, headline at eye level',
      textGuidance: 'Short punchy headline, vertically stacked info',
      structure: 'Logo top 10% → Headline 20% → Value 40% → CTA bottom 30%',
      maxWords: 8,
    },
    billboard: {
      dimensions: '970x250 pixels',
      layout: 'Ultra-wide cinematic layout - Visual left, text right',
      textGuidance: 'Room for longer headline and subtext',
      structure: 'Visual left 40% → Headline+Value center 35% → CTA right 25%',
      maxWords: 12,
    },
    'large_rectangle': {
      dimensions: '336x280 pixels',
      layout: 'Larger square layout - More content space',
      textGuidance: 'Good space for headline and value proposition',
      structure: 'Logo top 12% → Headline 30% → Value 30% → CTA 28%',
      maxWords: 12,
    },
    'half_page': {
      dimensions: '300x600 pixels',
      layout: 'Tall vertical half-page - Rich content space',
      textGuidance: 'Room for detailed messaging and imagery',
      structure: 'Logo top 8% → Visual 25% → Headline 20% → Value 27% → CTA 20%',
      maxWords: 15,
    },
  }
  return sizeConstraints[size?.toLowerCase().replace(/ /g, '_') || 'medium_rectangle'] || sizeConstraints.medium_rectangle
}

/**
 * v6.0 Phase 2 & 3: Build context from Design Intelligence with color injection
 */
function buildWebBannerContextFromDesignIntelligence(
  baseContext: Omit<BannerSizeContext, 'visualStyle' | 'colorAdvice'>,
  designContext: DesignContextForPrompt,
  userColors?: ResolvedColors
): BannerSizeContext {
  const backgroundSetting = designContext.backgroundSetting
  const designStrategy = designContext.designStrategy

  // Inject color personality into background if user colors exist
  const enhancedBackground = userColors
    ? `${backgroundSetting} (Color direction: ${generateColorAwareBackground('web_banner', userColors)})`
    : backgroundSetting

  // v6.0 Phase 3: Use custom theme if generated
  const themeInfo = designContext.customThemeNarrative
    ? `${designContext.customThemeNarrative.themeName} - ${designContext.customThemeNarrative.themeDescription}`
    : designStrategy

  return {
    ...baseContext,
    visualStyle: `${themeInfo} - ${enhancedBackground} - Conversion-optimized web banner`,
    colorAdvice: userColors ? `Primary: ${userColors.primaryColor}, CTA accent: ${userColors.accentColor || userColors.primaryColor}, high contrast for clicks` : 'Bold contrasting colors for web advertising',
  }
}

/**
 * v6.0 Phase 2: Build dynamic context based on color personality
 */
function buildDynamicWebBannerColorContext(
  baseContext: Omit<BannerSizeContext, 'visualStyle' | 'colorAdvice'>,
  userColors: ResolvedColors
): BannerSizeContext {
  const colorPersonality = analyzeColorPersonality(userColors.primaryColor)
  const backgroundSetting = generateColorAwareBackground('web_banner', userColors)

  return {
    ...baseContext,
    visualStyle: `${backgroundSetting} - ${colorPersonality.visualElements} - Conversion-focused web advertising`,
    colorAdvice: `Primary: ${userColors.primaryColor}, CTA accent: ${userColors.accentColor || userColors.primaryColor}, optimized for clicks`,
  }
}

/**
 * v6.0: 3-Tier Priority Chain for Web Banner Context
 * Priority 1: Design Intelligence → Priority 2: Color Personality → Priority 3: Minimal Fallback
 */
function getBannerLayoutForSize(
  size?: string,
  userColors?: ResolvedColors,
  designContext?: DesignContextForPrompt
): BannerSizeContext {
  const baseContext = getBaseSizeConstraints(size)

  // Priority 1: Use AI Design Intelligence if available
  if (designContext?.backgroundSetting) {
    console.log(`[Web Banner Context] Using Design Intelligence for ${size}`)
    return buildWebBannerContextFromDesignIntelligence(baseContext, designContext, userColors)
  }

  // Priority 2: Dynamic color-driven generation
  if (userColors && userColors.source !== 'fallback') {
    console.log(`[Web Banner Context] Using Color Personality (${userColors.source}) for ${size}`)
    return buildDynamicWebBannerColorContext(baseContext, userColors)
  }

  // Priority 3: Minimal generic fallback (NO hardcoded size-specific visuals beyond constraints)
  console.log(`[Web Banner Context] Using minimal fallback for ${size}`)
  return {
    ...baseContext,
    visualStyle: 'Professional web advertising design - conversion-optimized',
    colorAdvice: 'Professional palette with high-contrast CTA button for clicks',
  }
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildWebBannerPrompt(
  data: WebBannerFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Get size context (v3.1)
  const bannerSize = options.formatSize || data.size || 'medium_rectangle'
  // v6.0 Phase 2 & 3: Pass resolvedColors and designContext to enable dynamic color-driven backgrounds and custom themes
  const sizeContext = getBannerLayoutForSize(
    bannerSize,
    options.resolvedColors,
    options.designContext
  )

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'web_banner')

  // NEW v3.1: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const langContext = buildLanguageContext(options.language)
  const layoutContext = buildLayoutZoneContext(options.layout)

  // NEW v4.1: Sophistication Logic
  const sophistication = getSophistication(options, 'balanced')

  // NEW v3.4: Build forbidden zones (Sophistication-Aware)
  const { forbiddenZonesContext, zoneReminderContext } = getIntegratedZoneContext(options, sophistication)

  // NEW v3.4: Build AI-enhanced typography and decorative sections
  const aiTypographySection = options.designContext?.typographyGuidance
    ? `
<ai_typography_guidance>
Headline Style: ${options.designContext.typographyGuidance.headlineStyle}
Body Style: ${options.designContext.typographyGuidance.bodyStyle}
Hierarchy: ${options.designContext.typographyGuidance.hierarchy}
</ai_typography_guidance>
`
    : ''

  // NEW v4.4: Inject detailed decorative elements and background settings from Design Intelligence/Story Logic
  const decorativeSection = buildDecorativeElementsSection({
    eventType: 'web_banner',
    designContext: options.designContext,
    sophistication: sophistication,
    includeIconicImagery: true,
  });

  const backgroundSection = buildBackgroundSettingSection(options.designContext, sophistication);

  // Determine colors - use brand colors if available
  const colorScheme = options.brandContext?.primaryColor
    ? `Brand advertising: ${options.brandContext.primaryColor} primary, ${options.brandContext.accentColor || 'contrasting'} for CTA`
    : data.colorScheme || 'Bold, contrasting (CTA should pop against background)'

  // v33.6: LAYER 1 OVERLAP PREVENTION - Build pixel-precise spatial constraints
  // Web banner dimensions vary by size, use sizeContext
  const bannerDims = sizeContext.dimensions.split('x').map(Number)
  const CANVAS_WIDTH_BNR = bannerDims[0] || 728
  const CANVAS_HEIGHT_BNR = bannerDims[1] || 90
  const headerPercentBnr = 10 // Top 10% reserved (very horizontal format = small header)
  const footerPercentBnr = 30 // Bottom 30% reserved
  const headerHeightBnr = Math.floor(CANVAS_HEIGHT_BNR * (headerPercentBnr / 100))
  const footerHeightBnr = Math.floor(CANVAS_HEIGHT_BNR * (footerPercentBnr / 100))

  const pixelPreciseConstraints = buildPixelPreciseSpatialConstraints(
    CANVAS_WIDTH_BNR, CANVAS_HEIGHT_BNR, headerHeightBnr, footerHeightBnr, headerPercentBnr, footerPercentBnr
  )

  console.log('[WebBanner v33.6] LAYER 1: Pixel-precise spatial constraints generated')

  return `
<task>Generate a high-converting web banner advertisement</task>

<format>
Type: Display Web Banner
Size: ${bannerSize} (${sizeContext.dimensions})
Purpose: Drive clicks, communicate value proposition, convert viewers
Context: Will appear on websites alongside other content - must stand out
Layout Strategy: ${sizeContext.layout}
</format>

<spatial_layout_constraints>
${pixelPreciseConstraints}
</spatial_layout_constraints>

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${langContext}

${layoutContext}

${forbiddenZonesContext}

${aiTypographySection}

${decorativeSection}

${backgroundSection}

<subject>
A click-driving banner ad with message: "${data.headline}"
Goal: Capture attention in 1-2 seconds and drive clicks to landing page.
Must work as a standalone ad unit on various website backgrounds.
Size-specific: ${sizeContext.textGuidance}
</subject>

<composition>
Layout: ${sizeContext.layout}
Size-Specific Structure: ${sizeContext.structure}
- TEXT ZONE (MANDATORY): ALL text MUST be placed between 10-70% of canvas height. Header (0-10%) and footer (70-100%) are for background/logo overlays ONLY.

Flow: Left-to-right (for LTR audiences)
- LOGO: ${options.logoAwareness?.hasLogo ? `${options.logoAwareness.logoPosition} (clean background)` : 'Small brand element, left side'}
- HEADLINE: "${data.headline}" - primary message, immediately visible (max ${sizeContext.maxWords} words for this size)
${data.valueProposition ? `- VALUE: "${data.valueProposition}" - supporting message` : ''}
${data.offerDetails ? `- OFFER: "${data.offerDetails}" - highlighted special offer` : ''}
- CTA: "${data.callToAction || 'Learn More'}" - OBVIOUS, contrasting button, clearly clickable

Background: ${options.designContext?.backgroundSetting || data.backgroundStyle || 'Bold gradient that stands out from typical website backgrounds'}
${options.brandContext ? `Brand Integration: Use ${options.brandContext.primaryColor} as primary, ${options.brandContext.accentColor || 'contrasting color'} for CTA button` : ''}
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold, attention-grabbing, high contrast">${data.headline}</text>
${data.valueProposition ? `<text role="value" prominence="medium" style="supporting, clean">${data.valueProposition}</text>` : ''}
${data.offerDetails ? `<text role="offer" prominence="prominent" style="highlighted, badge or special treatment">${data.offerDetails}</text>` : ''}
<text role="cta" prominence="prominent" style="BUTTON style, contrasting color, obviously clickable, hover-inviting">${data.callToAction || 'Learn More'}</text>
${data.eventNote ? `<text role="note" prominence="small" style="compact, near other text elements">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: Digital advertising, conversion-focused
Color Palette: ${colorScheme}
Mood: Urgent (but not desperate), valuable, action-driving
Typography: Bold, readable at ${bannerSize} size, clear hierarchy
CTA Treatment: Button-style, high contrast with background, clearly clickable
</style>

${WEB_BANNER_EXAMPLES}

<quality_markers>
- ATTENTION TEST: Captures attention within 1-2 seconds
- CLICK TEST: CTA is obviously a clickable button
- MESSAGE TEST: Single clear message (not competing messages)
- STANDOUT TEST: Stands out on various website backgrounds
- SIZE TEST: Layout optimized for ${bannerSize} dimensions
- QUALITY TEST: Professional digital advertising quality
${options.logoAwareness?.hasLogo ? '- Logo area with clean background' : ''}
${options.brandContext ? '- Brand colors properly applied' : ''}
</quality_markers>

<constraints>
Avoid: Cluttered layout, too much text for banner size, no clear CTA, low contrast, competing messages, tiny unreadable fonts, looks like content not an ad, too subtle to notice
${bannerSize === 'leaderboard' ? 'For Leaderboard: Keep text extremely minimal (5 words max), horizontal flow only' : ''}
${bannerSize === 'wide_skyscraper' ? 'For Skyscraper: Stack elements vertically, avoid horizontal layouts' : ''}
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} area` : ''}
</constraints>

${options?.preventionEnhancements?.length ? `
LEARNED IMPROVEMENTS (from past feedback):
${options.preventionEnhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}
` : ''}

<render_constraints>
CRITICAL: Only render text that appears inside <text role="...">content</text> tags.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Advertising terminology (CTA, conversion, click-driving)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID

STRICT CTA PROHIBITION:
- Only render the CTA text that appears in <text role="cta">...</text> above
- DO NOT add additional CTAs beyond what is specified
- If a default CTA was used, render ONLY that exact text, not variations
- BLACKLISTED CTA PHRASES (never render unless explicitly in <text role="cta">):
  "Shop Now", "Sign Up", "Get Started", "Buy Now", "Click Here",
  "Subscribe", "Join Now", "Register", "Download", "Read More",
  "Book Now", "Order Now", "Try Free", "Start Free", "Explore", "Discover"
</render_constraints>

${zoneReminderContext}
`.trim()
}

// Export for use elsewhere
export { WEB_BANNER_EXAMPLES }
