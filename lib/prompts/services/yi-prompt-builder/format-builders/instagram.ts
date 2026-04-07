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

// Import color name helper for hex-free color descriptions
import { describeColor } from '@/lib/utils/color-names'

// v38.0: Import time formatter for human-readable time display
import { formatEventTime } from '@/lib/utils/time-formatter'

/**
 * v38.0: Format date string to human-readable format (matches event-poster.ts)
 * "2026-03-26" → "Wed, 26 Mar, 2026"
 */
function formatEventDate(dateString: string | undefined): string {
  if (!dateString || dateString.trim() === '') return ''
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return ''
    return date.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return dateString
  }
}

/**
 * Strip hex color codes from text to prevent Gemini from rendering them as visible text.
 * Same as event-poster.ts — colors are already enforced via <instruction>MANDATORY COLOR PALETTE</instruction>.
 */
function stripHexCodes(text: string): string {
  return text.replace(/#[0-9a-fA-F]{6}\b/g, '').replace(/\s{2,}/g, ' ').trim()
}

/** Convert hex to descriptive color name (no raw hex in prompt) */
function colorName(hex: string): string {
  return describeColor(hex).name
}

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
    colors: userColors ? `Primary: ${colorName(userColors.primaryColor)}, Secondary: ${colorName(userColors.secondaryColor || userColors.primaryColor)}, Accent: ${colorName(userColors.accentColor || userColors.primaryColor)}` : 'Vibrant, saturated, high contrast for mobile feed',
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
    colors: `Primary: ${colorName(userColors.primaryColor)}, Secondary: ${colorName(userColors.secondaryColor || userColors.primaryColor)}, Accent: ${colorName(userColors.accentColor || userColors.primaryColor)}`,
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
  // Resolve headline: eventName is the canonical field (v33.0+), postTitle kept for backwards compat.
  // Ultra-Pro primaryText is the AI-enhanced fallback when neither field has a value.
  const resolvedTitle = data.eventName
    || data.postTitle
    || (options as any).ultraProContext?.primaryText
    || 'Announcement'

  // Resolve event details: eventDescription, date, time, venue (v33.0+)
  const resolvedCaption = data.eventDescription || data.postCaption || ''
  // v38.0: Flag long descriptions so Gemini uses smaller font to fit all text accurately
  const isLongCaption = resolvedCaption.length > 120
  // v38.0: Format dates for human readability (was passing raw ISO "2026-03-26 | 19:00:00")
  const resolvedDate = data.eventDate ? formatEventDate(data.eventDate) : ''
  const resolvedTime = data.eventTime ? formatEventTime(data.eventTime) : ''
  const resolvedVenue = data.venue || ''

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
LOGO PROHIBITION (CRITICAL):
- NEVER render any logo, logo placeholder, "LOGO" text, "[LOGO]", emoji icon, or any brand mark anywhere in the image.
- Logos are composited programmatically AFTER generation as a separate overlay.
- Leave header and footer zones as pure, clean background artwork only.
- The background art must extend fully to all edges with NO logo placeholders or empty boxes.`

    forbiddenZonesContext = forbiddenZonesContext.replace(/clean/gi, 'integrated')
  }

  // NEW v3.4: Build AI-enhanced typography and decorative sections
  // v33.3: Enhanced with font category, alignment, and event-context-aware mood matching
  const tg = options.designContext?.typographyGuidance
  const aiTypographySection = tg
    ? `
<ai_typography_guidance>
FONT STYLE (EVENT-CONTEXT-AWARE):
- Font Category: ${tg.typographyStyle || 'sans'} (use high-quality ${tg.typographyStyle || 'sans-serif'} fonts that match the event mood)
- Headline Style: ${tg.headlineStyle}
- Body Style: ${tg.bodyStyle}
- Hierarchy: ${tg.hierarchy}
- Alignment: ${tg.alignment || 'center'}

IMPORTANT: The font style MUST reflect the event's personality. Do NOT default to generic sans-serif if the event calls for a different typographic approach. Match the typography to the event's mood and formality.
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

  // v33.4: Creative twist — unique visual signature (same pattern as event poster)
  const creativeTwistSection = options.designContext?.creativeTwist
    ? `
<creative_twist>
UNIQUE VISUAL SIGNATURE (MANDATORY): ${options.designContext.creativeTwist}
This ONE element should make this design immediately recognizable and memorable.
Integrate this creative twist prominently into the background scene.
</creative_twist>
`
    : ''

  // v33.5b: Scene narrative — direct from venue/audience mapping (bypasses Design Intelligence)
  const sceneNarrativeSection = options.sceneNarrative && options.sceneNarrative.length > 30
    ? `
<environment_context>
INDIAN ENVIRONMENT (MANDATORY — from venue/audience mapping):
${options.sceneNarrative}
The background scene MUST show these specific architectural and environmental elements.
</environment_context>
`
    : ''

  // v33.4: Storytelling narrative — cinematic scene from storytelling fusion
  const storytellingSection = options.designContext?.storytellingContext
    ? `
<visual_storytelling>
CINEMATIC SCENE NARRATIVE:
${options.designContext.storytellingContext.visualNarrative}

STORY STRUCTURE:
1. OPENING: ${options.designContext.storytellingContext.storyArc.opening}
2. CLIMAX (HERO VISUAL): ${options.designContext.storytellingContext.storyArc.climax}
3. RESOLUTION: ${options.designContext.storytellingContext.storyArc.resolution}

HERO ELEMENT: ${options.designContext.storytellingContext.cohesiveElements.primaryElement}
ATMOSPHERE: ${options.designContext.storytellingContext.cohesiveElements.atmosphericElements.join(', ')}

Create ONE unified visual story — not disconnected clip-art elements. The background scene must tell the event's story cinematically.
</visual_storytelling>
`
    : ''

  // Get platform-specific scroll-stop patterns and typography
  const scrollStopPatterns = getScrollStopPromptFragment('instagram')
  // Enhanced typography enforcement (v4.0) - combines original rules with strict enforcement
  const typographyRules = buildEnhancedTypographyPrompt('instagram_post', 1080)
  const antiPatterns = getPlatformAntiPatterns('instagram')

  // Determine colors - use brand colors if available (NO hex codes — Gemini renders them as visible text)
  const colors = options.brandContext?.primaryColor
    ? `Brand colors: ${colorName(options.brandContext.primaryColor)}, ${colorName(options.brandContext.secondaryColor || '#ffffff')}`
    : postContext.colors

  // v33.3: Event-context-aware body text style (used in text_content and style sections)
  const bodyStyleAttr = options.designContext?.typographyGuidance?.bodyStyle || 'clean sans-serif'

  // v4.0: LAYER 1 OVERLAP PREVENTION - Build pixel-precise spatial constraints
  // Instagram dimensions: 1080x1080 (square)
  const CANVAS_WIDTH = 1080
  const CANVAS_HEIGHT = 1080
  const headerPercent = 40 // Top 40% reserved (matches event poster safety zone)
  const footerPercent = 30 // Bottom 30% reserved (matches event poster, content zone 40-70%)
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

${creativeTwistSection}

${sceneNarrativeSection}

${storytellingSection}

<platform_optimization>
${scrollStopPatterns}
</platform_optimization>

<typography_hierarchy>
${typographyRules}
</typography_hierarchy>

<instruction>(DO NOT RENDER — scene composition guidance only, NOT text to display on poster)
<subject>
${options.designContext?.storytellingContext?.visualNarrative
  ? `A CINEMATIC, story-driven social media graphic: ${options.designContext.storytellingContext.visualNarrative}`
  : 'An eye-catching social media graphic that will STOP THE SCROLL.'}
Goal: ${postContext.goal}
${options.designContext?.emotionalJob ? `Emotional Impact: ${options.designContext.emotionalJob}` : ''}
Must capture attention within 0.5-1 second of viewing in feed.
This is a mobile-first platform - design for thumb-scrolling users.
The background scene must be a RICH, IMMERSIVE visual that tells the event's story — NOT a generic gradient or plain color.
</subject>
</instruction>

<instruction>(DO NOT RENDER — layout composition guidance only, NOT text to display)
<composition>
Layout: ${options.designContext?.layoutSuggestion || postContext.layout}

Structure:
- BACKGROUND: ${stripHexCodes((options.designContext?.backgroundSetting || postContext.background) as string)} ${options.brandContext?.primaryColor ? `incorporating brand colors (${colorName(options.brandContext.primaryColor)}, ${colorName(options.brandContext.secondaryColor || '#ffffff')})` : ''}
- VISUALS: ${options.designContext?.visualElements?.join(', ') || postContext.visualTreatment}
- TEXT ZONE: ALL text MUST be placed in the CENTER BAND of the canvas (40%-70%). Upper and lower portions are background/imagery only.
- TEXT GROUPING: ALL text elements must be GROUPED TOGETHER as a single unified text block in the center. Stack all text vertically in one compact cluster.
- HEADLINE STYLING: LARGE, BOLD, instantly readable on phone screen. Overlaid DIRECTLY on the background scene with strong drop shadow or dark semi-transparent gradient for contrast. No white box or opaque rectangle.
${(resolvedDate || resolvedVenue) ? `- EVENT DETAILS STYLING: Date, time, and venue rendered DIRECTLY BELOW the headline as a compact group. Styled to integrate with background scene — no solid white rectangles.` : ''}
- BREATHING ROOM: Generous spacing between text elements - NOT cramped
- All text must be readable on a phone screen WITHOUT zooming
</composition>
</instruction>

<text_content>
(ALL text elements below must be vertically GROUPED TOGETHER as a single compact cluster in the CENTER BAND of the canvas. Stack headline, tagline, date, and venue close together — do NOT spread them across the full canvas height. The upper and lower portions are reserved for background imagery only — no text allowed there.)
<text role="headline" prominence="LARGEST" style="${postContext.headlineStyle}, maximum contrast, bold weight">${resolvedTitle}</text>
${resolvedCaption ? `<text role="supporting" prominence="${isLongCaption ? 'small' : 'medium'}" style="${bodyStyleAttr}, ${isLongCaption ? 'small font size, tight line spacing, compact paragraph' : 'readable on mobile'}">${resolvedCaption}</text>` : ''}
${(resolvedDate || resolvedVenue) ? `\n(MANDATORY — render these event details as visible text in the poster:)` : ''}
${resolvedDate ? `<text role="date" prominence="medium" style="${bodyStyleAttr}, readable on mobile">${resolvedDate}${resolvedTime ? ` | ${resolvedTime}` : ''}</text>` : ''}
${resolvedVenue ? `<text role="venue" prominence="small" style="${bodyStyleAttr}, readable on mobile">${resolvedVenue}</text>` : ''}
${data.callToAction ? `<text role="cta" prominence="prominent" style="button-style or arrow indicator, ${postContext.ctaStyle}">${data.callToAction}</text>` : ''}
${data.eventNote ? `<text role="note" prominence="small" style="compact, below venue text, part of the grouped text cluster">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: ${postContext.style}
Color Palette: ${colors}
Mood: ${postContext.mood}
Typography:
  - Headlines: ${postContext.headlineStyle} (bold weight, NOT thin or light)
  - Body: ${bodyStyleAttr}, readable on mobile
  - High contrast with background
  - Font must match the event's personality and mood
Energy: ${postContext.energy}
</style>

${INSTAGRAM_POST_EXAMPLES}

<quality_markers>
- SCROLL-STOP TEST: Would this make you stop scrolling in your feed?
- MOBILE TEST: All text readable on phone screen without zooming
- CLARITY TEST: Single clear focal point, not cluttered
- ENGAGEMENT TEST: Design encourages like/comment/share
- BRAND TEST: ${options.brandContext ? 'Brand colors properly integrated' : 'Professional, polished look'}
</quality_markers>

<constraints>
Avoid: Tiny text requiring zoom, cluttered composition with multiple competing elements, low contrast (text hard to read), boring/generic look that blends into feed, thin/light fonts that disappear, too much text (keep headline under 10 words), busy background under text, muted/dull colors that don't pop
Platform Anti-Patterns: ${antiPatterns.slice(0, 5).join(', ')}
</constraints>

${options?.preventionEnhancements?.length ? `
<learned_improvements>
${options.preventionEnhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}
</learned_improvements>
` : ''}

<render_constraints>
MUST RENDER as visible text: ALL quoted content after role markers like (headline) "Content", (date) "Content", (venue) "Content", (cta) "Content", (supporting) "Content". These are REQUIRED poster elements — do not skip them.

CRITICAL: Only render text that appears in quotes after (role) markers.
The parenthetical part (role, color, size) is styling metadata — NEVER render it as text.

DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Platform terminology (scroll-stop, engagement, mobile-first)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID
- Any content from platform_optimization or typography_hierarchy sections
- Any content wrapped in instruction tags

STRICT CTA PROHIBITION:
- DO NOT invent or add any Call-to-Action buttons, links, or text unless explicitly provided as (cta) "..."
- If NO (cta) role marker exists above, the design MUST NOT contain ANY CTA elements
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
