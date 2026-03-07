/**
 * YouTube Thumbnail Prompt Builder v3.1
 * Generates XML-structured prompts for YouTube thumbnail designs
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Platform-specific scroll-stop patterns for YouTube
 * - Typography hierarchy for hook text
 * - Instruction/content separation for cleaner AI generation
 */

import type { YouTubeThumbnailFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLanguageContext,
  buildLayoutZoneContext,
} from '../context-helpers'
import { YOUTUBE_THUMBNAIL_EXAMPLES } from '../examples'

// Import design architecture for ultra-pro quality
import {
  getScrollStopPromptFragment,
  getTypographyPromptFragment,
} from '../../../knowledge-base/design-architecture'

// Import logo zone enforcement helper (v3.4, v4.0)
import { buildForbiddenZonesSection, buildZoneReminderSection, buildPixelPreciseSpatialConstraints } from '../helpers/logo-zone-enforcement'
import { getSophistication, getIntegratedZoneContext } from '../helpers/sophistication-helper'

// Import decorative elements injector (v4.4)
import { buildDecorativeElementsSection, buildBackgroundSettingSection } from '../helpers/decorative-elements-injector'

// ============================================================
// EXPRESSION HELPERS
// ============================================================

function getExpressionDescription(expression: string = 'excited'): string {
  const descriptions: Record<string, string> = {
    excited: "Big enthusiastic smile, bright wide eyes, possibly thumbs up or pointing, radiating positive energy",
    shocked: "Wide eyes, open mouth in genuine surprise, hands on cheeks or near face, 'I can't believe it' look",
    serious: "Determined focused look, confident expression, slight frown, 'this is important' energy",
    confused: "Furrowed brow, tilted head, questioning puzzled expression, one eyebrow raised",
    curious: "Raised eyebrow, intrigued knowing expression, slight smile, 'wait till you see this' energy",
  }
  return descriptions[expression] || descriptions.excited
}

function getEmotionMood(expression: string = 'excited'): string {
  const moods: Record<string, string> = {
    excited: "Energetic, positive, 'you'll love this'",
    shocked: "Dramatic, surprising, 'you won't believe this'",
    serious: "Important, authoritative, 'pay attention'",
    confused: "Relatable, questioning, 'let me explain'",
    curious: "Intriguing, mysterious, 'want to know more?'",
  }
  return moods[expression] || moods.excited
}

function extractHook(videoTitle: string): string {
  // Extract 3-5 most impactful words from video title
  const words = videoTitle.split(' ').slice(0, 5)
  return words.join(' ').toUpperCase()
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildYouTubeThumbnailPrompt(
  data: YouTubeThumbnailFormData,
  options: EnhancedBuildOptions = {}
): string {
  const hasFace = data.hasFace !== false

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'youtube_thumbnail')

  // NEW v3.1: Build theme context
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

  // NEW v4.4: Inject detailed decorative elements and background settings from Design Intelligence/Story Logic
  const decorativeSection = buildDecorativeElementsSection({
    eventType: 'youtube_thumbnail',
    designContext: options.designContext,
    sophistication: sophistication,
    includeIconicImagery: true,
  });

  const backgroundSection = buildBackgroundSettingSection(options.designContext, sophistication);

  // Get platform-specific scroll-stop patterns
  const scrollStopPatterns = getScrollStopPromptFragment('youtube_thumbnail')
  const typographyRules = getTypographyPromptFragment('youtube_thumbnail')

  // v4.0: LAYER 1 OVERLAP PREVENTION - Build pixel-precise spatial constraints
  // YouTube thumbnail dimensions: 1280x720 (16:9)
  const CANVAS_WIDTH = 1280
  const CANVAS_HEIGHT = 720
  const headerPercent = 20 // v33.6: Top 20% reserved (wide landscape = smaller header)
  const footerPercent = 30 // v33.6: Bottom 30% reserved — content ends at 70%
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

  console.log('[YouTube Thumbnail v4.0] LAYER 1: Pixel-precise spatial constraints generated')

  return `
<task>Generate a high-CTR YouTube thumbnail designed to maximize clicks in search and recommendations</task>

<format>
Type: YouTube Video Thumbnail
Aspect Ratio: Landscape 16:9 (1280x720 equivalent)
Viewing Size: Will display as small as 160x90 pixels - MUST be readable at tiny size
Purpose: Compete with 500+ other videos, trigger curiosity, drive clicks
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
A click-worthy thumbnail for video: "${data.videoTitle}"
The thumbnail must communicate video value in 0.05 seconds.
${hasFace
      ? `Feature: Expressive human face with ${data.expression || 'excited'} expression, filling 50-60% of frame (LEFT side with clean background)`
      : `Feature: Compelling visual subject that draws the eye`}
${hasFace ? 'NOTE: Face zone will have photo overlaid. Generate clean, complementary background for face area.' : ''}
</subject>

<composition>
Layout: Two-zone composition
- LEFT 60%: ${hasFace
      ? `Expressive face - ${getExpressionDescription(data.expression)}, well-lit, looking toward camera, high contrast with background`
      : `Main visual subject - ${data.mainSubject || 'compelling focal point'}`}
- RIGHT 40%: Bold text hook - 3-5 words maximum, readable at tiny sizes
- TEXT ZONE (MANDATORY): ALL text MUST be placed between 20-70% of canvas height. Header (0-20%) and footer (70-100%) are for background/logo overlays ONLY — NO text there.
- AVOID: Bottom-right corner (YouTube duration badge area)
${options.logoAwareness?.hasLogo ? `- Keep ${options.logoAwareness.logoPosition} area clean for branding` : ''}

Background: ${options.designContext?.backgroundSetting || data.backgroundColor || 'Bright, saturated color that contrasts with subject'}
Subject Treatment: Well-lit, high contrast, pops from background
</composition>

<text_content>
<text role="hook" prominence="LARGEST" style="BOLD thick sans-serif, ALL CAPS, thick black outline for contrast">${data.hookText || extractHook(data.videoTitle)}</text>
Note: Maximum 5 words. Must be readable when thumbnail is 160 pixels wide.
Text Color: ${data.textColor || 'Bright yellow or white'} with thick black outline
${data.eventNote ? `<text role="note" prominence="small" style="compact footer, bottom corner">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: YouTube thumbnail style - bold, clickable, competitive with top creators
Color Palette: Bright, saturated, high contrast - ${data.accentColor || 'yellow, red, or electric blue'} for text
${options.brandContext ? `Brand Integration: ${options.brandContext.primaryColor} accent where appropriate` : ''}
Mood: ${hasFace ? getEmotionMood(data.expression) : 'Compelling, curiosity-triggering'}
Typography: Impact-style thick sans-serif, ALL CAPS, 3-5px black outline
Lighting: Dramatic lighting on subject, high contrast
</style>

${YOUTUBE_THUMBNAIL_EXAMPLES}

<quality_markers>
- Readable at 160x90 pixels (thumbnail size in search results)
- Stands out among competitor thumbnails
- Triggers curiosity - viewer NEEDS to click
- Professional YouTuber quality
- ${hasFace ? 'Face expression matches video emotion' : 'Clear compelling subject'}
- High contrast throughout
${options.logoAwareness?.hasLogo ? '- Logo area with clean background' : ''}
</quality_markers>

<constraints>
Avoid: Small text, thin fonts, muted colors, boring expression, cluttered composition, content in corners (especially bottom-right), too many elements, blurry face, generic stock photo feel, text over face, more than 5 words, low contrast, pastel colors
${options.logoAwareness?.hasLogo ? `Avoid: Critical content in ${options.logoAwareness.logoPosition} area` : ''}
${hasFace ? `Avoid: Illustrated faces in face area - keep background clean` : ''}
</constraints>

${options?.preventionEnhancements?.length ? `
LEARNED IMPROVEMENTS (from past feedback):
${options.preventionEnhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}
` : ''}

<render_constraints>
CRITICAL: Only render the hook text. Do NOT render any instruction text.
Only render text inside <text role="hook">...</text> tag.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Platform terminology (CTR, scroll-stop, click-worthy)
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
export { YOUTUBE_THUMBNAIL_EXAMPLES }
