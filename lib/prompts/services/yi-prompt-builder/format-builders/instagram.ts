/**
 * Instagram Post Prompt Builder v3.1
 * Generates XML-structured prompts for Instagram post designs
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Platform-specific scroll-stop patterns for Instagram
 * - Typography hierarchy with visual weight
 * - Instruction/content separation for cleaner AI generation
 */

import type { InstagramFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLanguageContext,
  buildLayoutZoneContext,
} from '../context-helpers'
import { INSTAGRAM_POST_EXAMPLES } from '../examples'

// v6.0 Phase 2: Color personality system
import { analyzeColorPersonality, generateColorAwareBackground } from '@/lib/prompts/helpers/color-personality'
import type { ResolvedColors } from '@/lib/utils/resolve-color-config'
import type { DesignContextForPrompt } from '../types'

// Import design architecture for ultra-pro quality
import {
  getScrollStopPromptFragment,
  getTypographyPromptFragment,
  getPlatformAntiPatterns,
} from '../../../knowledge-base/design-architecture'

// Import logo zone enforcement helper (v3.4, v4.0)
import { buildForbiddenZonesSection, buildZoneReminderSection, buildPixelPreciseSpatialConstraints } from '../helpers/logo-zone-enforcement'

// Import enhanced typography enforcer (v4.0) - NEW
import { buildEnhancedTypographyPrompt } from '../../../helpers/enhanced-typography-enforcer'

// Import decorative elements injector (v4.4)
import { buildDecorativeElementsSection, buildBackgroundSettingSection } from '../helpers/decorative-elements-injector'

// ============================================================
// INSTAGRAM CONTEXTS (v6.0 Phase 2 & 3: Dynamic Color + Custom Themes)
// ============================================================

interface InstagramContext {
  layout: string
  background: string
  visualTreatment: string
  style: string
  colors: string
  mood: string
  goal: string
  headlineStyle: string
  ctaStyle: string
  energy: string
}

/**
 * v6.0 Phase 2 & 3: Build context from Design Intelligence with color injection
 */
function buildInstagramContextFromDesignIntelligence(
  designContext: DesignContextForPrompt,
  userColors?: ResolvedColors
): InstagramContext {
  const backgroundSetting = designContext.backgroundSetting || 'Eye-catching, vibrant background'
  const designStrategy = designContext.designStrategy

  // Inject color personality into background if user colors exist
  const enhancedBackground = userColors
    ? `${backgroundSetting} (Color direction: ${generateColorAwareBackground('instagram_post', userColors)})`
    : backgroundSetting

  // v6.0 Phase 3: Use custom theme if generated
  const themeInfo = designContext.customThemeNarrative
    ? `${designContext.customThemeNarrative.themeName} - ${designContext.customThemeNarrative.themeDescription}`
    : designStrategy

  return {
    layout: 'Square 1:1 scroll-stop layout optimized for mobile feed',
    background: enhancedBackground,
    visualTreatment: designContext.visualElements?.join(', ') || 'Eye-catching, scroll-stopping, engaging',
    style: themeInfo,
    colors: userColors ? `Primary: ${userColors.primaryColor}, Secondary: ${userColors.secondaryColor || userColors.primaryColor}, Accent: ${userColors.accentColor || userColors.primaryColor}` : 'Vibrant, saturated, high contrast for mobile feed',
    mood: designContext.moodDirection || 'Engaging, scroll-stopping, shareable',
    goal: 'Stop the scroll and drive engagement',
    headlineStyle: designContext.typographyGuidance?.headlineStyle || 'extra-bold sans-serif, high contrast',
    ctaStyle: 'button-style or highlighted, mobile-optimized',
    energy: designContext.vibeKeywords?.join(', ') || 'High energy, attention-grabbing',
  }
}

/**
 * v6.0 Phase 2: Build dynamic context based on color personality
 */
function buildDynamicInstagramColorContext(
  postType: string,
  userColors: ResolvedColors
): InstagramContext {
  const colorPersonality = analyzeColorPersonality(userColors.primaryColor)
  const backgroundSetting = generateColorAwareBackground(postType, userColors)

  return {
    layout: 'Square 1:1 scroll-stop layout optimized for mobile feed',
    background: backgroundSetting,
    visualTreatment: `${colorPersonality.visualElements}, mobile-optimized, scroll-stopping`,
    style: `${colorPersonality.primaryMood}, ${colorPersonality.secondaryMood}, social media optimized`,
    colors: `Primary: ${userColors.primaryColor}, Secondary: ${userColors.secondaryColor || userColors.primaryColor}, Accent: ${userColors.accentColor || userColors.primaryColor}`,
    mood: `${colorPersonality.primaryMood}, engaging, shareable`,
    goal: 'Stop the scroll and drive engagement',
    headlineStyle: 'extra-bold sans-serif, high contrast for mobile',
    ctaStyle: 'button-style, mobile-friendly',
    energy: colorPersonality.energyLevel,
  }
}

/**
 * v6.0: 3-Tier Priority Chain for Instagram Context
 * Priority 1: Design Intelligence → Priority 2: Color Personality → Priority 3: Minimal Fallback
 */
function getInstagramContext(
  postType: string = 'announcement',
  userColors?: ResolvedColors,
  designContext?: DesignContextForPrompt
): InstagramContext {
  // Priority 1: Use AI Design Intelligence if available
  if (designContext?.backgroundSetting) {
    console.log(`[Instagram Context] Using Design Intelligence for ${postType}`)
    return buildInstagramContextFromDesignIntelligence(designContext, userColors)
  }

  // Priority 2: Dynamic color-driven generation
  if (userColors && userColors.source !== 'fallback') {
    console.log(`[Instagram Context] Using Color Personality (${userColors.source}) for ${postType}`)
    return buildDynamicInstagramColorContext(postType, userColors)
  }

  // Priority 3: Minimal generic fallback (NO hardcoded post-type visuals)
  console.log(`[Instagram Context] Using minimal fallback for ${postType}`)
  return {
    layout: 'Square 1:1 scroll-stop layout optimized for mobile feed',
    background: 'Clean professional design environment with balanced composition - mobile-optimized for Instagram feed',
    visualTreatment: 'Professional, engaging, scroll-stopping',
    style: 'Professional social media design, versatile, modern',
    colors: 'Professional balanced palette optimized for mobile screens',
    mood: 'Professional, engaging, shareable',
    goal: 'Stop the scroll and communicate message clearly',
    headlineStyle: 'bold sans-serif, high contrast for mobile readability',
    ctaStyle: 'clear, action-oriented, mobile-friendly',
    energy: 'Balanced, professional, engaging',
  }
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildInstagramPrompt(
  data: InstagramFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Resolve headline: postTitle is the canonical field but older form versions send postHeadline.
  // Ultra-Pro primaryText is the AI-enhanced fallback when neither field has a value.
  const resolvedTitle = data.postTitle
    || (data as any).postHeadline
    || (options as any).ultraProContext?.primaryText
    || 'Announcement'

  // v6.0 Phase 2 & 3: Pass resolvedColors and designContext to enable dynamic color-driven backgrounds and custom themes
  const postContext = getInstagramContext(
    data.postType,
    options.resolvedColors,
    options.designContext
  )

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext, 'instagram_post')
  const qualityContext = buildQualityContext(options.resolution, 'instagram_post')

  // NEW v3.1: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const langContext = buildLanguageContext(options.language)
  const layoutContext = buildLayoutZoneContext(options.layout)

  // NEW v4.1: Sophistication Logic (Shared with Event Posters)
  // Determines if we should go "Rich/Immersive" or "Minimalist"
  const sophistication = (() => {
    // If Design Intelligence suggests "High-Fidelity" or "Rich", use that
    if (options.designContext?.designStrategy?.includes('Rich') ||
      options.designContext?.designStrategy?.includes('Immersive')) return 'rich' as const;

    // Default Instagram vibe is usually "Balanced" or "Rich" for engagement
    return 'rich' as const; // Default to Rich for Instagram to avoid boring templates
  })()

  // NEW v3.4: Build forbidden zones (Sophistication-Aware)
  let forbiddenZonesContext = buildForbiddenZonesSection(options.logoAwareness)
  let zoneReminderContext = buildZoneReminderSection(options.logoAwareness)

  if (sophistication === 'rich') {
    // Override strict "Keep Clean" instructions with "Integration" instructions
    zoneReminderContext = `
LOGO INTEGRATION GUIDANCE:
- Logos in ${options.logoAwareness?.logoPosition || 'corners'} must be integrated into the background art.
- Do NOT draw white boxes behind logos.
- Ensure the background extends fully to the edges.
- Use a subtle gradient or shadow if needed for logo contrast, but NO rigid bars.`

    forbiddenZonesContext = forbiddenZonesContext.replace(/clean/gi, 'integrated')
  }

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
  // This replaces legacy manual construction to ensure "Ideogram-like" context understanding
  const decorativeSection = buildDecorativeElementsSection({
    eventType: data.postType, // Fallback type
    designContext: options.designContext,
    sophistication: sophistication,
    includeIconicImagery: true,
  });

  const backgroundSection = buildBackgroundSettingSection(options.designContext, sophistication);

  // Get platform-specific scroll-stop patterns and typography
  const scrollStopPatterns = getScrollStopPromptFragment('instagram')
  // Enhanced typography enforcement (v4.0) - combines original rules with strict enforcement
  const typographyRules = buildEnhancedTypographyPrompt('instagram_post', 1080)
  const antiPatterns = getPlatformAntiPatterns('instagram')

  // Determine colors - use brand colors if available
  const colors = options.brandContext?.primaryColor
    ? `Brand colors: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}`
    : postContext.colors

  // v4.0: LAYER 1 OVERLAP PREVENTION - Build pixel-precise spatial constraints
  // Instagram dimensions: 1080x1080 (square)
  const CANVAS_WIDTH = 1080
  const CANVAS_HEIGHT = 1080
  const headerPercent = 12 // Top 12% reserved for logos
  const footerPercent = 12 // Bottom 12% reserved for branding
  const headerHeight = Math.floor(CANVAS_HEIGHT * (headerPercent / 100))
  const footerHeight = Math.floor(CANVAS_HEIGHT * (footerPercent / 100))

  const pixelPreciseConstraints = buildPixelPreciseSpatialConstraints(
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    headerHeight,
    footerHeight,
    headerPercent,
    footerPercent
  )

  console.log('[Instagram v4.0] LAYER 1: Pixel-precise spatial constraints generated')

  return `
<task>Generate a scroll-stopping Instagram post that demands attention in a crowded feed</task>

<format>
Type: Instagram Feed Post
Aspect Ratio: Square 1:1 (1080x1080 equivalent)
Purpose: Stop the scroll, communicate message instantly, drive engagement
Post Type: ${data.postType || 'Announcement'}
Viewing Context: Mobile phone feed, thumbnail size initially, competing with many posts
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

<platform_optimization>
${scrollStopPatterns}
</platform_optimization>

<typography_hierarchy>
${typographyRules}
</typography_hierarchy>

<subject>
An eye-catching social media graphic that will STOP THE SCROLL.
Main Message: "${resolvedTitle}"
Goal: ${postContext.goal}
Critical: Must capture attention within 0.5-1 second of viewing in feed.
This is a mobile-first platform - design for thumb-scrolling users.
</subject>

<composition>
Layout: ${options.designContext?.layoutSuggestion || postContext.layout}

Structure:
- BACKGROUND: ${options.designContext?.backgroundSetting || postContext.background} ${options.brandContext ? `incorporating brand colors (${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'})` : ''}
- VISUALS: ${options.designContext?.visualElements?.join(', ') || postContext.visualTreatment}
- HEADLINE: "${resolvedTitle}" - LARGE, BOLD, instantly readable on phone screen
${data.postCaption ? `- SUPPORTING TEXT: "${data.postCaption}" - smaller but still readable on mobile` : ''}
${data.callToAction ? `- CTA: "${data.callToAction}" - button-style or highlighted` : ''}
- LOGO AREA: ${options.logoAwareness?.hasLogo ? `${options.logoAwareness.logoPosition} with clean background` : 'Small brand element'}
- BREATHING ROOM: Generous white/negative space - NOT cramped

Text Sizing Rule: All text must be readable on a phone screen WITHOUT zooming
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold thick sans-serif, maximum contrast, ${postContext.headlineStyle}">${resolvedTitle}</text>
${data.postCaption ? `<text role="supporting" prominence="medium" style="clean sans-serif, readable on mobile">${data.postCaption}</text>` : ''}
${data.callToAction ? `<text role="cta" prominence="prominent" style="button-style or arrow indicator, ${postContext.ctaStyle}">${data.callToAction}</text>` : ''}
${data.eventNote ? `<text role="note" prominence="small" style="footer text, bottom 5-10%">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: ${postContext.style}
Color Palette: ${colors}
Mood: ${postContext.mood}
Typography:
  - Headlines: BOLD, THICK sans-serif (NOT thin or light weight)
  - Readable on phone without zooming
  - High contrast with background
Energy: ${postContext.energy}
</style>

${INSTAGRAM_POST_EXAMPLES}

<quality_markers>
- SCROLL-STOP TEST: Would this make you stop scrolling in your feed?
- MOBILE TEST: All text readable on phone screen without zooming
- CLARITY TEST: Single clear focal point, not cluttered
- ENGAGEMENT TEST: Design encourages like/comment/share
- BRAND TEST: ${options.brandContext ? 'Brand colors properly integrated' : 'Professional, polished look'}
${options.logoAwareness?.hasLogo ? '- Logo area with clean background' : ''}
</quality_markers>

<constraints>
Avoid: Tiny text requiring zoom, cluttered composition with multiple competing elements, low contrast (text hard to read), boring/generic look that blends into feed, thin/light fonts that disappear, too much text (keep headline under 10 words), busy background under text, muted/dull colors that don't pop
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} area` : ''}
Platform Anti-Patterns: ${antiPatterns.slice(0, 5).join(', ')}
</constraints>

${options?.preventionEnhancements?.length ? `
<learned_improvements>
${options.preventionEnhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}
</learned_improvements>
` : ''}

<render_constraints>
CRITICAL: Only render text that appears inside <text role="...">content</text> tags.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Platform terminology (scroll-stop, engagement, mobile-first)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID
- Any content from platform_optimization or typography_hierarchy sections

STRICT CTA PROHIBITION:
- DO NOT invent or add any Call-to-Action buttons, links, or text unless explicitly provided in <text role="cta">
- If NO <text role="cta"> tag exists above, the design MUST NOT contain ANY CTA elements
- BLACKLISTED CTA PHRASES (never render unless explicitly in user data):
  "Learn More", "Shop Now", "Sign Up", "Get Started", "Buy Now", "Click Here",
  "Subscribe", "Join Now", "Register", "Download", "Contact Us", "Read More",
  "Book Now", "Order Now", "Try Free", "Start Free", "Explore", "Discover"
</render_constraints>

${zoneReminderContext}
`.trim()
}

// Export for use elsewhere
export { INSTAGRAM_POST_EXAMPLES }
