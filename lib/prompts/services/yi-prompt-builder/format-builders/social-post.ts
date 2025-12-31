/**
 * Social Post Prompt Builder v3.0 (Facebook/Twitter)
 * Generates XML-structured prompts for social media post designs
 * Enhanced with logo awareness, brand context, and quality context
 */

import type { SocialPostFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLanguageContext,
  buildLayoutZoneContext,
} from '../context-helpers'
import { INSTAGRAM_POST_EXAMPLES } from '../examples' // Social posts use similar patterns

// v6.0 Phase 2: Color personality system
import { analyzeColorPersonality, generateColorAwareBackground } from '@/lib/prompts/helpers/color-personality'
import type { ResolvedColors } from '@/lib/utils/resolve-color-config'
import type { DesignContextForPrompt } from '../types'

// Import logo zone enforcement helper (v3.4)
import { buildForbiddenZonesSection, buildZoneReminderSection } from '../helpers/logo-zone-enforcement'
import { getSophistication, getIntegratedZoneContext } from '../helpers/sophistication-helper'



// ============================================================
// PLATFORM CONTEXTS (v6.0 Phase 2 & 3: Dynamic Color + Custom Themes)
// ============================================================

interface PlatformContext {
  aspectRatio: string
  viewingContext: string
  style: string
  colors: string
  energy: string
}

/**
 * v6.0 Phase 2 & 3: Build context from Design Intelligence with color injection
 */
function buildSocialPostContextFromDesignIntelligence(
  designContext: DesignContextForPrompt,
  platform: string,
  userColors?: ResolvedColors
): PlatformContext {
  const backgroundSetting = designContext.backgroundSetting
  const designStrategy = designContext.designStrategy

  // Inject color personality into background if user colors exist
  const enhancedBackground = userColors
    ? `${backgroundSetting} (Color direction: ${generateColorAwareBackground('social_post', userColors)})`
    : backgroundSetting

  // v6.0 Phase 3: Use custom theme if generated
  const themeInfo = designContext.customThemeNarrative
    ? `${designContext.customThemeNarrative.themeName} - ${designContext.customThemeNarrative.themeDescription}`
    : designStrategy

  // Platform-specific aspect ratios
  const aspectRatio = platform === 'twitter'
    ? '16:9 (1200x675) or Square 1:1'
    : '1.91:1 (1200x628) or Square 1:1'
  const viewingContext = platform === 'twitter'
    ? 'Twitter/X timeline, fast-scrolling feed, must capture attention quickly'
    : 'Facebook feed on desktop and mobile, competing with friend updates and news'

  return {
    aspectRatio,
    viewingContext,
    style: `${themeInfo} - ${enhancedBackground}`,
    colors: userColors ? `Primary: ${userColors.primaryColor}, Secondary: ${userColors.secondaryColor || userColors.primaryColor}, Accent: ${userColors.accentColor || userColors.primaryColor}` : 'Vibrant, social, engaging',
    energy: designContext.vibeKeywords?.join(', ') || (platform === 'twitter' ? 'Quick, punchy, immediate' : 'Friendly, engaging'),
  }
}

/**
 * v6.0 Phase 2: Build dynamic context based on color personality
 */
function buildDynamicSocialPostColorContext(
  platform: string,
  userColors: ResolvedColors
): PlatformContext {
  const colorPersonality = analyzeColorPersonality(userColors.primaryColor)
  const backgroundSetting = generateColorAwareBackground('social_post', userColors)

  const aspectRatio = platform === 'twitter'
    ? '16:9 (1200x675) or Square 1:1'
    : '1.91:1 (1200x628) or Square 1:1'
  const viewingContext = platform === 'twitter'
    ? 'Twitter/X timeline, fast-scrolling feed, must capture attention quickly'
    : 'Facebook feed on desktop and mobile, competing with friend updates and news'

  return {
    aspectRatio,
    viewingContext,
    style: `${colorPersonality.primaryMood}, ${colorPersonality.secondaryMood}, social media optimized - ${backgroundSetting}`,
    colors: `Primary: ${userColors.primaryColor}, Secondary: ${userColors.secondaryColor || userColors.primaryColor}, Accent: ${userColors.accentColor || userColors.primaryColor}`,
    energy: colorPersonality.energyLevel,
  }
}

/**
 * v6.0: 3-Tier Priority Chain for Social Post Context
 * Priority 1: Design Intelligence → Priority 2: Color Personality → Priority 3: Minimal Fallback
 */
function getPlatformContext(
  platform: string = 'facebook',
  userColors?: ResolvedColors,
  designContext?: DesignContextForPrompt
): PlatformContext {
  // Priority 1: Use AI Design Intelligence if available
  if (designContext?.backgroundSetting) {
    console.log(`[Social Post Context] Using Design Intelligence for ${platform}`)
    return buildSocialPostContextFromDesignIntelligence(designContext, platform, userColors)
  }

  // Priority 2: Dynamic color-driven generation
  if (userColors && userColors.source !== 'fallback') {
    console.log(`[Social Post Context] Using Color Personality (${userColors.source}) for ${platform}`)
    return buildDynamicSocialPostColorContext(platform, userColors)
  }

  // Priority 3: Minimal generic fallback (NO hardcoded platform-type visuals)
  console.log(`[Social Post Context] Using minimal fallback for ${platform}`)
  const aspectRatio = platform === 'twitter'
    ? '16:9 (1200x675) or Square 1:1'
    : '1.91:1 (1200x628) or Square 1:1'
  const viewingContext = platform === 'twitter'
    ? 'Twitter/X timeline, fast-scrolling feed, must capture attention quickly'
    : 'Facebook feed on desktop and mobile, competing with friend updates and news'

  return {
    aspectRatio,
    viewingContext,
    style: 'Professional social media design, shareable, engaging',
    colors: 'Professional balanced palette optimized for social feeds',
    energy: 'Balanced, professional, engaging',
  }
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildSocialPostPrompt(
  data: SocialPostFormData,
  formatId?: string,
  options: EnhancedBuildOptions = {}
): string {
  const platform = data.platform || (formatId?.includes('twitter') ? 'twitter' : 'facebook')
  // v6.0 Phase 2 & 3: Pass resolvedColors and designContext to enable dynamic color-driven backgrounds and custom themes
  const platformContext = getPlatformContext(
    platform,
    options.resolvedColors,
    options.designContext
  )
  const platformName = platform === 'twitter' ? 'Twitter/X' : 'Facebook'

  // Build context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'social_post')

  // NEW v3.4: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const langContext = buildLanguageContext(options.language)
  const layoutContext = buildLayoutZoneContext(options.layout)

  // NEW v4.1: Sophistication Logic
  const sophistication = getSophistication(options, 'rich')

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

  const aiDecorativeSection = options.designContext?.decorativeElements
    ? `
<ai_decorative_elements>
Corner Treatment: ${options.designContext.decorativeElements.corners}
Pattern Overlay: ${options.designContext.decorativeElements.patterns}
Accent Elements: ${options.designContext.decorativeElements.accents}
</ai_decorative_elements>
`
    : ''

  // Determine colors - use brand colors if available
  const colors = options.brandContext?.primaryColor
    ? `Brand social: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}`
    : platformContext.colors

  return `
<task>Generate a scroll-stopping ${platformName} post that demands attention and drives engagement</task>

<format>
Type: ${platformName} Post
Aspect Ratio: ${platformContext.aspectRatio}
Purpose: Stop the scroll, communicate message instantly, drive engagement and sharing
Platform: ${platformName}
Viewing Context: ${platformContext.viewingContext}
</format>

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${langContext}

${layoutContext}

${forbiddenZonesContext}

${aiTypographySection}

${aiDecorativeSection}

<subject>
An attention-grabbing social media graphic for: "${data.postTitle}"
Post Type: ${data.postType || 'Announcement'}
Platform: ${platformName}
Must capture attention within 0.5-1 second of viewing in a busy feed.
</subject>

<composition>
Layout: ${options.designContext?.layoutSuggestion || 'Bold, uncluttered design with clear focal point'}

Structure:
- BACKGROUND: ${options.designContext?.backgroundSetting || platformContext.style} ${options.brandContext ? `incorporating brand colors (${options.brandContext.primaryColor})` : 'that stands out in feed'}
- VISUALS: ${options.designContext?.visualElements?.join(', ') || 'Impactful imagery'}
- HEADLINE: "${data.postTitle}" - primary message, dominant element
${data.postCaption ? `- SUPPORTING: "${data.postCaption}" - smaller supporting text` : ''}
${data.callToAction ? `- CTA: "${data.callToAction}" - button-style or highlighted` : ''}
- LOGO: ${options.logoAwareness?.hasLogo ? `${options.logoAwareness.logoPosition} with clean background` : 'Subtle brand element in corner'}
- BREATHING ROOM: Generous space around all elements

Text Sizing: All text must be readable on mobile phone without zooming
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold thick sans-serif, maximum contrast">${data.postTitle}</text>
${data.postCaption ? `<text role="supporting" prominence="medium" style="clean sans-serif, readable on mobile">${data.postCaption}</text>` : ''}
${data.callToAction ? `<text role="cta" prominence="prominent" style="button-style, contrasting accent color">${data.callToAction}</text>` : ''}
${data.eventNote ? `<text role="note" prominence="small" style="footer text, bottom 5-10%">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: ${platformContext.style}
Color Palette: ${colors}
Mood: Engaging, shareable, social
Typography: Bold, thick fonts that work on mobile; avoid thin or delicate fonts
Energy: ${platformContext.energy}
</style>

${INSTAGRAM_POST_EXAMPLES}

<quality_markers>
- SCROLL-STOP TEST: Would this make you stop scrolling in your feed?
- MOBILE TEST: All text readable on phone screen without zooming
- SHARE TEST: Would someone share this with friends?
- ENGAGEMENT TEST: Design encourages likes, shares, comments
- BRAND TEST: ${options.brandContext ? 'Brand colors properly integrated' : 'Professional social media quality'}
${options.logoAwareness?.hasLogo ? '- Logo area with clean background' : ''}
</quality_markers>

<constraints>
Avoid: Tiny text, cluttered composition, low contrast, boring/generic look that blends into feed, too much text (keep concise), thin fonts, busy background under text, hard to read on small screen, muted colors
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
- Platform terminology (scroll-stop, engagement, mobile-first)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID

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
export { INSTAGRAM_POST_EXAMPLES as SOCIAL_POST_EXAMPLES }
