/**
 * Story Format Prompt Builder v3.1 (Instagram/WhatsApp)
 * Generates XML-structured prompts for vertical story designs
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Theme and organization context (v3.1)
 * - Platform-specific optimizations
 */

import type { StoryFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLanguageContext,
  buildLayoutZoneContext,
} from '../context-helpers'
import { STORY_EXAMPLES } from '../examples'

// v6.0 Phase 2: Color personality system
import { analyzeColorPersonality, generateColorAwareBackground } from '@/lib/prompts/helpers/color-personality'
import type { ResolvedColors } from '@/lib/utils/resolve-color-config'
import type { DesignContextForPrompt} from '../types'

// Import logo zone enforcement helper (v3.4)
// Import logo zone enforcement helper (v3.4)
import { buildForbiddenZonesSection, buildZoneReminderSection } from '../helpers/logo-zone-enforcement'
import { getSophistication, getIntegratedZoneContext } from '../helpers/sophistication-helper'

// Import decorative elements injector (v4.4)
import { buildDecorativeElementsSection, buildBackgroundSettingSection } from '../helpers/decorative-elements-injector'

// ============================================================
// PLATFORM VARIATIONS (v3.1)
// ============================================================

interface StoryPlatformContext {
  topSafeZone: string
  bottomSafeZone: string
  uiElements: string
  interactionStyle: string
}

function getStoryPlatformContext(platform?: string): StoryPlatformContext {
  const platformContexts: Record<string, StoryPlatformContext> = {
    instagram: {
      topSafeZone: 'Top 15% covered by profile picture, username, story progress bar',
      bottomSafeZone: 'Bottom 20% covered by reply box, send message, share icons',
      uiElements: 'Story progress bars at top, reply box at bottom',
      interactionStyle: 'Tap to advance, swipe up for links, reply box for messages',
    },
    whatsapp: {
      topSafeZone: 'Top 12% covered by contact name, timestamp',
      bottomSafeZone: 'Bottom 15% covered by reply bar, navigation',
      uiElements: 'Contact name top, reply bar bottom',
      interactionStyle: 'Tap to advance, reply at bottom',
    },
    facebook: {
      topSafeZone: 'Top 15% covered by profile info, close button',
      bottomSafeZone: 'Bottom 18% covered by reactions, reply, share',
      uiElements: 'Profile top, reaction bar bottom',
      interactionStyle: 'Tap to advance, reactions and sharing',
    },
    linkedin: {
      topSafeZone: 'Top 12% covered by profile, company info',
      bottomSafeZone: 'Bottom 15% covered by engagement options',
      uiElements: 'Professional header, engagement footer',
      interactionStyle: 'Professional B2B story viewing',
    },
  }
  return platformContexts[platform?.toLowerCase() || 'instagram'] || platformContexts.instagram
}

// ============================================================
// STORY TYPE CONTEXTS (v6.0 Phase 2 & 3: Dynamic Color + Custom Themes)
// ============================================================

interface StoryTypeContext {
  mood: string
  visualStyle: string
  textTreatment: string
}

/**
 * v6.0 Phase 2 & 3: Build context from Design Intelligence with color injection
 */
function buildStoryContextFromDesignIntelligence(
  designContext: DesignContextForPrompt,
  userColors?: ResolvedColors
): StoryTypeContext {
  const backgroundSetting = designContext.backgroundSetting
  const designStrategy = designContext.designStrategy

  // Inject color personality into background if user colors exist
  const enhancedBackground = userColors
    ? `${backgroundSetting} (Color direction: ${generateColorAwareBackground('story', userColors)})`
    : backgroundSetting

  // v6.0 Phase 3: Use custom theme if generated
  const themeInfo = designContext.customThemeNarrative
    ? `${designContext.customThemeNarrative.themeName} - ${designContext.customThemeNarrative.themeDescription}`
    : designStrategy

  return {
    mood: designContext.moodDirection || 'Engaging, immersive, thumb-stopping',
    visualStyle: `${themeInfo} - ${enhancedBackground} - Full-screen vertical story optimized`,
    textTreatment: designContext.typographyGuidance?.headlineStyle || 'Large impactful headline centered in safe zone, high contrast',
  }
}

/**
 * v6.0 Phase 2: Build dynamic context based on color personality
 */
function buildDynamicStoryColorContext(
  storyType: string,
  userColors: ResolvedColors
): StoryTypeContext {
  const colorPersonality = analyzeColorPersonality(userColors.primaryColor)
  const backgroundSetting = generateColorAwareBackground(storyType, userColors)

  return {
    mood: `${colorPersonality.primaryMood}, ${colorPersonality.secondaryMood}, immersive`,
    visualStyle: `${backgroundSetting} - ${colorPersonality.visualElements} - Full-screen vertical story`,
    textTreatment: 'Large bold headline centered in safe zone, high contrast for mobile',
  }
}

/**
 * v6.0: 3-Tier Priority Chain for Story Context
 * Priority 1: Design Intelligence → Priority 2: Color Personality → Priority 3: Minimal Fallback
 */
function getStoryTypeContext(
  storyType?: string,
  userColors?: ResolvedColors,
  designContext?: DesignContextForPrompt
): StoryTypeContext {
  // Priority 1: Use AI Design Intelligence if available
  if (designContext?.backgroundSetting) {
    console.log(`[Story Context] Using Design Intelligence for ${storyType}`)
    return buildStoryContextFromDesignIntelligence(designContext, userColors)
  }

  // Priority 2: Dynamic color-driven generation
  if (userColors && userColors.source !== 'fallback') {
    console.log(`[Story Context] Using Color Personality (${userColors.source}) for ${storyType}`)
    return buildDynamicStoryColorContext(storyType || 'announcement', userColors)
  }

  // Priority 3: Minimal generic fallback (NO hardcoded story-type visuals)
  console.log(`[Story Context] Using minimal fallback for ${storyType}`)
  return {
    mood: 'Professional, engaging, thumb-stopping',
    visualStyle: 'Clean professional vertical story design - full-screen immersive',
    textTreatment: 'Large headline centered in safe zone, high contrast, mobile-optimized',
  }
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildStoryPrompt(
  data: StoryFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Get platform and type contexts (v3.1)
  const platformContext = getStoryPlatformContext(data.platform)
  // v6.0 Phase 2 & 3: Pass resolvedColors and designContext to enable dynamic color-driven backgrounds and custom themes
  const typeContext = getStoryTypeContext(
    options.contentType,
    options.resolvedColors,
    options.designContext
  )

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'story')

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
    eventType: options.contentType || 'story',
    designContext: options.designContext,
    sophistication: sophistication,
    includeIconicImagery: true,
  });

  const backgroundSection = buildBackgroundSettingSection(options.designContext, sophistication);

  // Determine colors - use brand colors if available
  const colorScheme = options.brandContext?.primaryColor
    ? `Brand gradient: ${options.brandContext.primaryColor} to ${options.brandContext.secondaryColor || 'white'}`
    : data.colorScheme || 'Vibrant, bold, high contrast'

  return `
<task>Generate a full-screen vertical story design optimized for mobile viewing</task>

<format>
Type: ${data.platform || 'Instagram'} Story
Aspect Ratio: Portrait 9:16 (1080x1920 equivalent)
Purpose: Capture attention in Stories feed, encourage swipe/tap action
Viewing Context: Full-screen mobile, brief viewing time (3-5 seconds)
Story Type: ${options.contentType || 'announcement'}
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

${decorativeSection}

${backgroundSection}

<subject>
A thumb-stopping story graphic for: "${data.storyHeadline}"
Must capture attention and communicate message within 3 seconds.
Full-screen immersive experience.
Platform: ${data.platform || 'Instagram'} Stories
Story Type: ${options.contentType || 'announcement'} - ${typeContext.mood}
</subject>

<composition>
Layout: Full-bleed vertical design with safe zones

CRITICAL SAFE ZONE RULES:
- TOP: ${platformContext.topSafeZone}
- CENTER 65%: SAFE ZONE - all important content goes here
- BOTTOM: ${platformContext.bottomSafeZone}

Platform UI: ${platformContext.uiElements}
Interaction: ${platformContext.interactionStyle}

Content Placement:
- Main headline centered in safe zone (middle 65%)
${data.callToAction ? '- Swipe/tap indicator in lower portion of safe zone (NOT in bottom UI zone)' : ''}
- Keep all critical content in middle 65%
${options.logoAwareness?.hasLogo ? `- Logo in ${options.logoAwareness.logoPosition} within safe zone` : ''}

Background: ${options.designContext?.backgroundSetting || data.backgroundStyle || 'Bold vibrant gradient'} filling entire frame
Visual Treatment: ${options.designContext?.visualElements?.join(', ') || typeContext.visualStyle}
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="${typeContext.textTreatment}, centered in safe zone, high contrast">${data.storyHeadline}</text>
${data.callToAction ? `<text role="cta" prominence="prominent" style="swipe-up indicator style, near bottom of safe zone (NOT in bottom UI zone)">${data.callToAction}</text>` : ''}
${data.eventNote ? `<text role="note" prominence="small" style="footer text, above bottom UI zone">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: Mobile-native, immersive, story-optimized
Color Palette: ${colorScheme}
${options.brandContext ? `Brand Integration: Gradient uses ${options.brandContext.primaryColor} and ${options.brandContext.secondaryColor || 'complementary color'}` : ''}
Mood: ${typeContext.mood}
Typography: Large, bold, easily readable at a glance
</style>

${STORY_EXAMPLES}

<quality_markers>
- Full-screen impact
- Content clearly in safe zones (not hidden by ${data.platform || 'Instagram'} UI)
- Readable at a glance
- Thumb-stopping in Stories feed
- Encourages interaction (swipe, tap, reply)
- Matches ${options.contentType || 'announcement'} story type expectations
${options.logoAwareness?.hasLogo ? '- Logo area positioned correctly within safe zone' : ''}
${options.brandContext ? '- Brand colors properly integrated into gradient' : ''}
</quality_markers>

<constraints>
Avoid: Content in UI zones (${platformContext.topSafeZone.split(' ')[0]} or ${platformContext.bottomSafeZone.split(' ')[0]}), tiny text, horizontal composition, boring/static design, cluttered layout, hard to read quickly, important content outside safe zone
${options.logoAwareness?.hasLogo ? `Avoid: Logo placement in UI zones` : ''}
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
- Platform terminology (safe zone, swipe-up, UI elements)
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
export { STORY_EXAMPLES }
