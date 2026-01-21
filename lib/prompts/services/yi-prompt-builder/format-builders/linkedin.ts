/**
 * LinkedIn Post Prompt Builder v3.1
 * Generates XML-structured prompts for LinkedIn professional graphics
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Theme and organization context (v3.1)
 * - ContentType variations for different LinkedIn post types
 */

import type { LinkedInFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLanguageContext,
  buildLayoutZoneContext,
} from '../context-helpers'
import { LINKEDIN_POST_EXAMPLES } from '../examples'

// v6.0 Phase 2: Color personality system
import { analyzeColorPersonality, generateColorAwareBackground } from '@/lib/prompts/helpers/color-personality'
import type { ResolvedColors } from '@/lib/utils/resolve-color-config'
import type { DesignContextForPrompt } from '../types'

// Import logo zone enforcement helper (v3.4, v4.0)
import { buildForbiddenZonesSection, buildZoneReminderSection, buildPixelPreciseSpatialConstraints } from '../helpers/logo-zone-enforcement'
import { getSophistication, getIntegratedZoneContext } from '../helpers/sophistication-helper'

// Import decorative elements injector (v4.4)
import { buildDecorativeElementsSection, buildBackgroundSettingSection } from '../helpers/decorative-elements-injector'

// ============================================================
// CONTENT TYPE CONTEXTS (v6.0 Phase 2 & 3: Dynamic Color + Custom Themes)
// ============================================================

interface LinkedInContentContext {
  layout: string
  mood: string
  visualStyle: string
  structure: string
}

/**
 * v6.0 Phase 2 & 3: Build context from Design Intelligence with color injection
 */
function buildLinkedInContextFromDesignIntelligence(
  designContext: DesignContextForPrompt,
  userColors?: ResolvedColors
): LinkedInContentContext {
  const backgroundSetting = designContext.backgroundSetting
  const designStrategy = designContext.designStrategy

  // Inject color personality into background if user colors exist
  const enhancedBackground = userColors
    ? `${backgroundSetting} (Color direction: ${generateColorAwareBackground('linkedin_professional', userColors)})`
    : backgroundSetting

  // v6.0 Phase 3: Use custom theme if generated
  const themeInfo = designContext.customThemeNarrative
    ? `${designContext.customThemeNarrative.themeName} - ${designContext.customThemeNarrative.themeDescription}`
    : designStrategy

  return {
    layout: 'Professional LinkedIn layout optimized for B2B engagement',
    mood: designContext.moodDirection || 'Professional, credible, thought-leadership',
    visualStyle: `${themeInfo} - ${enhancedBackground} - Professional B2B aesthetic`,
    structure: designContext.layoutSuggestion || 'Headline prominent, supporting content clean, professional composition',
  }
}

/**
 * v6.0 Phase 2: Build dynamic context based on color personality
 */
function buildDynamicLinkedInColorContext(
  contentType: string,
  userColors: ResolvedColors
): LinkedInContentContext {
  const colorPersonality = analyzeColorPersonality(userColors.primaryColor)
  const backgroundSetting = generateColorAwareBackground('linkedin_professional', userColors)

  return {
    layout: 'Professional LinkedIn layout optimized for B2B engagement',
    mood: `${colorPersonality.primaryMood}, ${colorPersonality.secondaryMood}, professional`,
    visualStyle: `${backgroundSetting} - ${colorPersonality.visualElements} - B2B optimized`,
    structure: 'Headline prominent, clean professional composition, credible aesthetic',
  }
}

/**
 * v6.0: 3-Tier Priority Chain for LinkedIn Context
 * Priority 1: Design Intelligence → Priority 2: Color Personality → Priority 3: Minimal Fallback
 */
function getLinkedInContextByType(
  contentType?: string,
  userColors?: ResolvedColors,
  designContext?: DesignContextForPrompt
): LinkedInContentContext {
  // Priority 1: Use AI Design Intelligence if available
  if (designContext?.backgroundSetting) {
    console.log(`[LinkedIn Context] Using Design Intelligence for ${contentType}`)
    return buildLinkedInContextFromDesignIntelligence(designContext, userColors)
  }

  // Priority 2: Dynamic color-driven generation
  if (userColors && userColors.source !== 'fallback') {
    console.log(`[LinkedIn Context] Using Color Personality (${userColors.source}) for ${contentType}`)
    return buildDynamicLinkedInColorContext(contentType || 'article', userColors)
  }

  // Priority 3: Minimal generic fallback (NO hardcoded content-type visuals)
  console.log(`[LinkedIn Context] Using minimal fallback for ${contentType}`)
  return {
    layout: 'Professional LinkedIn layout optimized for B2B engagement',
    mood: 'Professional, credible, thought-leadership',
    visualStyle: 'Clean professional B2B design with balanced composition',
    structure: 'Headline prominent, supporting content clear, professional aesthetic',
  }
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildLinkedInPrompt(
  data: LinkedInFormData,
  options: EnhancedBuildOptions = {}
): string {
  // v6.0 Phase 2 & 3: Pass resolvedColors and designContext to enable dynamic color-driven backgrounds and custom themes
  const contentContext = getLinkedInContextByType(
    options.contentType || data.contentType,
    options.resolvedColors,
    options.designContext
  )

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext, 'linkedin_post')
  const qualityContext = buildQualityContext(options.resolution, 'linkedin_post')

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
    eventType: options.contentType || data.contentType || 'professional',
    designContext: options.designContext,
    sophistication: sophistication,
    includeIconicImagery: true,
  });

  const backgroundSection = buildBackgroundSettingSection(options.designContext, sophistication);

  // Determine colors - use brand colors if available
  const colorScheme = options.brandContext?.primaryColor
    ? `Brand professional: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}, ${options.brandContext.accentColor || 'subtle gold accent'}`
    : data.colorScheme || 'Professional blues (#0077b5, #004182), grays, white, subtle gold accent'

  // v4.0: LAYER 1 OVERLAP PREVENTION - Build pixel-precise spatial constraints
  // LinkedIn dimensions: 1200x628 (landscape, recommended) or 1080x1080 (square)
  const CANVAS_WIDTH = 1200
  const CANVAS_HEIGHT = 628
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

  console.log('[LinkedIn v4.0] LAYER 1: Pixel-precise spatial constraints generated')

  return `
<task>Generate a professional LinkedIn post graphic that builds credibility and encourages engagement</task>

<format>
Type: LinkedIn Feed Post
Aspect Ratio: Landscape 1.91:1 (1200x628) or Square 1:1 (1080x1080)
Purpose: Establish thought leadership, drive professional engagement, build credibility
Content Type: ${options.contentType || data.contentType || 'Thought Leadership'}
Audience: Business professionals, B2B context
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
A sophisticated professional graphic for: "${data.headline}"
Content Type: ${options.contentType || data.contentType || 'Thought Leadership'}
Content Context: ${contentContext.mood}
This should look like it comes from a respected industry leader, not a marketing department.
</subject>

<composition>
Layout: ${options.designContext?.layoutSuggestion || contentContext.layout}

Structure:
${contentContext.structure}

Visual Elements:
- Background: ${options.designContext?.backgroundSetting || data.backgroundStyle || 'Professional gradient (navy to dark blue)'} with subtle geometric or abstract accents
- Headline: "${data.headline}" - prominent but not shouting
${data.keyInsight ? `- Key insight/statistic: "${data.keyInsight}" - highlighted/emphasized` : ''}
${data.professionalMessage ? `- Supporting message: "${data.professionalMessage}"` : ''}
- CLEAN AREA: ${options.logoAwareness?.hasLogo ? `${options.logoAwareness.logoPosition} kept clear with simple background` : 'Subtle brand element in corner'}
- WHITE SPACE: Generous - not crowded, professional breathing room

Visual Treatment: ${contentContext.visualStyle}
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="professional sans-serif, bold but elegant, not aggressive">${data.headline}</text>
${data.keyInsight ? `<text role="insight" prominence="prominent" style="highlighted, possibly larger number or statistic">${data.keyInsight}</text>` : ''}
${data.professionalMessage ? `<text role="body" prominence="medium" style="clean sans-serif, lighter weight">${data.professionalMessage}</text>` : ''}
${data.eventNote ? `<text role="note" prominence="small" style="footer text, bottom 5-10%">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: ${contentContext.visualStyle}
Color Palette: ${colorScheme}
Mood: ${contentContext.mood}
Typography: Clean professional fonts (not playful or casual)
Decoration: Minimal - subtle geometric shapes, lines, or icons only
</style>

${LINKEDIN_POST_EXAMPLES}

<quality_markers>
- FORTUNE 500 TEST: Would not look out of place on a major company's LinkedIn
- CREDIBILITY TEST: Builds trust and professional respect
- ENGAGEMENT TEST: Encourages thoughtful comments and shares
- CONTENT TYPE FIT: Appropriate for ${options.contentType || data.contentType || 'thought leadership'} post
- BRAND TEST: ${options.brandContext ? 'Brand colors properly integrated' : 'Professional, polished look'}
- Clean, sophisticated execution
${options.logoAwareness?.hasLogo ? '- Logo area with clean background' : ''}
</quality_markers>

<constraints>
Avoid: Flashy, salesy, clickbait, unprofessional, too colorful, playful fonts, meme-style, casual aesthetic, aggressive marketing look, corporate cliches, stock photo handshake imagery
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
- Platform terminology (B2B, thought leadership, credibility)
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
export { LINKEDIN_POST_EXAMPLES }
