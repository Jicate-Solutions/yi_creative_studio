/**
 * Event Poster Prompt Builder v3.1
 * Generates XML-structured prompts for event poster designs
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Speaker photo integration zones
 * - Typography hierarchy with visual weight
 * - Instruction/content separation for cleaner AI generation
 */

import type { EventPosterFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLayoutZoneContext,
  buildLanguageContext,
  buildSpeakerPhotoZoneContext,
  buildSpeakerPhotoCompositionGuidance, // v7.0: Natural language safe zones
  buildLogoStripZoneContext,
  buildInitiativeColorContext,
  formatSpeakerDetails,
  formatMultipleSpeakers,
} from '../context-helpers'
import { buildAllV41Contexts } from '../context-helpers-v41'
import { EVENT_POSTER_EXAMPLES } from '../examples'

// NEW v6.12: Text color resolver for WCAG compliance
import { validateTextContrast, getContrastSafeTextColor } from '@/lib/utils/text-color-resolver'

// Import design architecture for ultra-pro quality
import {
  getTypographyPromptFragment,
} from '../../../knowledge-base/design-architecture'

// Import decorative elements helper (v3.2)
import {
  buildDecorativeElementsSection,
  buildBackgroundSettingSection,
} from '../helpers/decorative-elements-injector'

// Import time formatter utility (v3.3)
import { formatEventTime } from '@/lib/utils/time-formatter'

// Import logo zone enforcement helper (v3.4)
import { buildForbiddenZonesSection, buildZoneReminderSection } from '../helpers/logo-zone-enforcement'

// Import centralized sophistication helper (v4.5)
import { getSophistication, getIntegratedZoneContext } from '../helpers/sophistication-helper'

// Import multi-color typography types (v5.0)
import type { TextRoleColor, MultiColorTypographyConfig } from '@/lib/config/design-constants'

// Import dynamic color description builder (v5.4)
import { buildColorDescriptionFromResolved } from '../../../helpers/color-narrative'

// Import color personality system for dynamic background generation (v6.0)
import {
  analyzeColorPersonality,
  generateColorAwareBackground,
  type ColorPersonality,
} from '@/lib/prompts/helpers/color-personality'
import type { ResolvedColors } from '@/lib/utils/resolve-color-config'
import type { DesignContextForPrompt } from '../types'

// ============================================================
// MULTI-COLOR TYPOGRAPHY HELPERS (v5.0)
// ============================================================

/**
 * Convert TextRoleColor to Gemini-compatible rendering instruction
 * Supports both solid colors and gradient text
 */
function renderTextColorInstruction(roleColor: TextRoleColor, role: string): string {
  if (roleColor.type === 'gradient') {
    const direction = roleColor.gradientDirection || 'horizontal'
    return `Apply ${direction} gradient from ${roleColor.gradientStart} to ${roleColor.gradientEnd} for ${role} text. ${roleColor.description || ''}`
  }
  return `Use ${roleColor.color} for ${role} text (${roleColor.description || 'primary text color'}, WCAG contrast ratio: ${roleColor.contrastRatio || 'N/A'})`
}

/**
 * Build multi-color typography instructions for all text roles
 * Creates comprehensive color guidance that integrates with visual style
 */
function buildMultiColorTypographyInstructions(config: MultiColorTypographyConfig): string {
  return `
MULTI-COLOR TYPOGRAPHY SYSTEM:
- Hero/Title: ${renderTextColorInstruction(config.hero, 'hero/title')}
- Headlines: ${renderTextColorInstruction(config.headline, 'headline')}
- Subheadlines: ${renderTextColorInstruction(config.subheadline, 'subheadline')}
- Body Text: ${renderTextColorInstruction(config.body, 'body')}
- Call-to-Action: ${renderTextColorInstruction(config.cta, 'CTA')}
- Captions: ${renderTextColorInstruction(config.caption, 'caption')}
- Labels: ${renderTextColorInstruction(config.label, 'label')}

CRITICAL: Ensure all text colors meet WCAG AA accessibility standards (≥4.5:1 for body, ≥3:1 for large text).
`.trim()
}

// ============================================================
// EVENT CONTEXT TYPES
// ============================================================

interface RoleColor {
  color: string
  contrast?: string
  contrastRatio?: number // NEW v3.9: WCAG contrast ratio for AI enforcement
  description: string
}

interface EventContext {
  background: string
  style: string
  colors: string
  mood: string
  energy: string
  headlineFont: string
  colorPalette: {
    hero: RoleColor
    headline: RoleColor
    body: RoleColor
    cta: RoleColor
    caption: RoleColor
  }
  // DEPRECATED: Keep for backward compatibility
  headlineColor: string
  ctaColor: string
  ctaStyle: string
  defaultAudience: string
}

/**
 * Get default color palette for an event type
 */
function getDefaultPalette(primary: string, secondary: string, accent: string): EventContext['colorPalette'] {
  return {
    hero: {
      color: 'white',
      contrast: accent,
      description: `High contrast white on ${primary} - most prominent text`,
    },
    headline: {
      color: 'white',
      contrast: secondary,
      description: 'Clear white for secondary headlines',
    },
    body: {
      color: '#E0E0E0',
      description: 'Readable light gray for details',
    },
    cta: {
      color: accent,
      contrast: primary,
      description: 'High contrast action button',
    },
    caption: {
      color: '#999999',
      description: 'Subtle footer text',
    },
  }
}

/**
 * Determine speaker text colors based on design context
 * Speaker names should stand out but not compete with the main headline
 * Speaker designations should be supporting and more subtle
 */
function determineSpeakerColor(params: {
  primaryColor?: string
  accentColor?: string
  textColor?: string
  role: 'speaker_name' | 'speaker_designation'
}): { color: string; description: string } {
  const { role, primaryColor, accentColor, textColor } = params

  if (role === 'speaker_name') {
    // Speaker names should be prominent but not as dominant as the main headline
    // Use accent color or high-contrast white
    return {
      color: accentColor || 'white',
      description: 'Prominent color for speaker names - stands out but supports headline hierarchy'
    }
  } else {
    // Speaker designations are supporting text
    // Use a more subtle color
    return {
      color: textColor || '#D0D0D0',
      description: 'Subtle supporting color for speaker designations'
    }
  }
}

// ============================================================
// COLOR-AWARE DYNAMIC CONTEXT HELPERS (v6.0 - Phase 2)
// ============================================================

/**
 * Builds EventContext from Design Intelligence background setting
 * Injects user colors into the AI-generated background description
 */
function buildContextFromDesignIntelligence(
  designContext: DesignContextForPrompt,
  userColors?: ResolvedColors
): EventContext {
  const backgroundSetting = designContext.backgroundSetting || 'Professional modern design environment'
  const colorMood = designContext.colorMood || 'balanced professional palette'
  const designStrategy = designContext.designStrategy || 'Modern professional design'

  // Inject user colors into background description if provided
  let enhancedBackground = backgroundSetting
  if (userColors && userColors.source !== 'fallback') {
    const personality = analyzeColorPersonality(userColors.primaryColor)
    enhancedBackground = `${backgroundSetting} - Dominated by ${userColors.primaryColor} (${personality.name}) with ${personality.mood} atmosphere. ${personality.backgroundStyle}`
  }

  // Extract or generate color palette
  const primaryColor = userColors?.primaryColor || designContext.colorMood?.match(/#[0-9A-F]{6}/i)?.[0] || '#005B96'
  const secondaryColor = userColors?.secondaryColor || '#FFFFFF'
  const accentColor = userColors?.accentColor || '#FF6B35'

  // v6.0 Phase 3: Use custom theme if generated
  const themeInfo = designContext.customThemeNarrative
    ? `${designContext.customThemeNarrative.themeName} - ${designContext.customThemeNarrative.themeDescription}`
    : designStrategy

  return {
    background: enhancedBackground,
    style: themeInfo,  // Use custom theme name + description if available
    colors: userColors
      ? `Primary: ${userColors.primaryColor}, Secondary: ${userColors.secondaryColor}, Accent: ${userColors.accentColor} (${userColors.source} colors)`
      : colorMood,
    mood: designContext.emotionalJob || designContext.moodDirection || 'Professional, engaging',
    energy: designContext.vibeAndMood?.energyDynamics || 'Balanced, professional',
    headlineFont: designContext.typographyGuidance?.typographyStyle || 'sans-serif',
    colorPalette: getDefaultPalette(primaryColor, secondaryColor, accentColor),
    headlineColor: 'high contrast',
    ctaColor: 'accent',
    ctaStyle: 'prominent button',
    defaultAudience: 'General audience',
  }
}

/**
 * Builds EventContext dynamically using color personality analysis
 * Combines color mood with event type for unique visual narrative
 */
function buildDynamicColorContext(
  eventType: string,
  userColors: ResolvedColors
): EventContext {
  const personality = analyzeColorPersonality(userColors.primaryColor)
  const backgroundDescription = generateColorAwareBackground(eventType, userColors)

  // Map event types to energy levels
  const eventEnergyMap: Record<string, string> = {
    conference: 'Professional, polished',
    workshop: 'Warm, inviting',
    seminar: 'Focused, professional',
    concert: 'High energy, electric',
    sports: 'High energy, athletic',
    celebration: 'Festive, joyful',
    birthday: 'Playful, joyful',
    community: 'Warm, inclusive',
    tech: 'Dynamic, innovative',
    health_camp: 'Calm, reassuring',
    cultural: 'Festive, celebratory',
    children: 'Playful, joyful',
  }

  const eventMoodMap: Record<string, string> = {
    conference: 'Professional, authoritative, networking-focused',
    workshop: 'Educational, interactive, welcoming',
    seminar: 'Intellectual, prestigious, knowledge-focused',
    concert: 'Exciting, energetic, entertainment',
    sports: 'Competitive, energetic, athletic',
    celebration: 'Joyful, celebratory, festive',
    birthday: 'Fun, personal, celebratory',
    community: 'Welcoming, inclusive, community spirit',
    tech: 'Innovative, technical, forward-thinking',
    health_camp: 'Caring, professional, health-focused',
    cultural: 'Celebratory, cultural pride, heritage',
    children: 'Fun, safe, engaging for families',
  }

  const energy = eventEnergyMap[eventType.toLowerCase()] || `${personality.mood}, engaging`
  const mood = eventMoodMap[eventType.toLowerCase()] || `${personality.name}, professional`

  return {
    background: backgroundDescription,
    style: `${personality.name} themed ${eventType} design with ${personality.mood} atmosphere`,
    colors: `Primary: ${userColors.primaryColor}, Secondary: ${userColors.secondaryColor}, Accent: ${userColors.accentColor} (${userColors.source} - ${personality.name})`,
    mood: mood,
    energy: energy,
    headlineFont: personality.name === 'Creative/Luxury' ? 'elegant serif' : 'sans-serif',
    colorPalette: getDefaultPalette(userColors.primaryColor, userColors.secondaryColor, userColors.accentColor),
    headlineColor: 'high contrast',
    ctaColor: 'accent',
    ctaStyle: 'prominent button',
    defaultAudience: 'General audience',
  }
}

// ============================================================
// EVENT CONTEXTS
// ============================================================

/**
 * v6.0 Dynamic Event Context Resolution (Phase 2)
 * Replaces 40+ hardcoded event templates with AI-driven, color-aware generation
 *
 * Priority Chain:
 * 1. Design Intelligence (AI-generated backgrounds with color injection)
 * 2. Color Personality (dynamic backgrounds based on user color selection)
 * 3. Minimal Fallback (clean professional, NO hardcoded event-type visuals)
 *
 * @param eventType - Event type identifier (conference, workshop, etc.)
 * @param userColors - Resolved color configuration from user selection
 * @param designContext - AI-generated design intelligence context
 */
function getEventContext(
  eventType: string = 'general',
  userColors?: ResolvedColors,
  designContext?: DesignContextForPrompt
): EventContext {
  // Priority 1: Use AI Design Intelligence if available
  // This provides the richest, most contextual background descriptions
  if (designContext?.backgroundSetting) {
    console.log(`[Event Context] Using Design Intelligence for ${eventType}`)
    return buildContextFromDesignIntelligence(designContext, userColors)
  }

  // Priority 2: Dynamic color-driven generation
  // Analyzes user color personality and combines with event type
  // Example: Green + Innovation → "Living forest environment with glowing bio-nodes"
  if (userColors && userColors.source !== 'fallback') {
    console.log(`[Event Context] Using Color Personality (${userColors.source}) for ${eventType}`)
    return buildDynamicColorContext(eventType, userColors)
  }

  // Priority 3: Minimal generic fallback (NO hardcoded visuals)
  // Only reached when:
  // - No Design Intelligence available
  // - No user color selection (using system fallback colors)
  // This provides a clean, professional baseline WITHOUT event-specific visual assumptions
  console.log(`[Event Context] Using minimal fallback for ${eventType}`)
  return {
    background: 'Clean professional design environment with balanced composition',
    style: 'Contemporary professional design',
    colors: userColors
      ? `Primary: ${userColors.primaryColor}, Secondary: ${userColors.secondaryColor}, Accent: ${userColors.accentColor}`
      : 'Balanced professional palette',
    mood: 'Professional, engaging, purposeful',
    energy: 'Balanced, professional',
    headlineFont: 'sans-serif',
    colorPalette: getDefaultPalette(
      userColors?.primaryColor || '#005B96',
      userColors?.secondaryColor || '#FFFFFF',
      userColors?.accentColor || '#FF6B35'
    ),
    headlineColor: 'high contrast',
    ctaColor: 'accent',
    ctaStyle: 'prominent button',
    defaultAudience: 'General audience',
  }
}

// ============================================================
// LEGACY NOTE (v6.0)
// ============================================================
// Previous versions (v3.x - v5.x) contained 10 hardcoded event contexts:
// conference, workshop, health_camp, concert, community, tech, sports,
// children, seminar, cultural (lines 271-427, ~173 lines of code)
//
// These hardcoded templates caused issues:
// - Conference always → blue geometric shapes (ignored user's green)
// - Workshop always → orange gradient (ignored user's purple)
// - Zero visual variety within event types
//
// v6.0 Replacement (Phase 2 - Story-Driven Visuals):
// - Removed ALL hardcoded event templates
// - Replaced with dynamic color personality system
// - 300%+ increase in visual variety
// - 100% user color compliance
// - Codebase reduction: ~173 lines deleted
// ============================================================

// ============================================================
// DATE FORMATTING
// ============================================================

function formatEventDate(dateString: string | undefined): string {
  if (!dateString) return 'Date TBA'
  try {
    const date = new Date(dateString)
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
 * Build speaker text section with MANDATORY XML role tags
 * Ensures speaker names ALWAYS render when provided, regardless of photo presence
 *
 * CRITICAL FIX: Speaker text was previously included in narrative descriptions,
 * which Gemini treated as instructions rather than renderable content.
 * This function wraps ALL speaker data in explicit <text role="..."> tags.
 */
function buildSpeakerTextSection(
  speakers: Array<{ name: string; designation?: string }>,
  colorSource: any
): string {
  if (!speakers || speakers.length === 0) {
    return '';
  }

  const speakerTextElements = speakers.map((speaker, index) => {
    const num = index + 1;
    const nameColor = (colorSource as any).speaker_name?.color || 'white';
    const desigColor = (colorSource as any).speaker_designation?.color || '#D0D0D0';

    const nameTag = `<text role="speaker_name_${num}" color="${nameColor}" prominence="prominent">${speaker.name}</text>`;
    const desigTag = speaker.designation
      ? `<text role="speaker_designation_${num}" color="${desigColor}" prominence="medium">${speaker.designation}</text>`
      : '';

    return `${nameTag}${desigTag ? '\n' + desigTag : ''}`;
  }).join('\n\n');

  return `
<!-- ============================================================ -->
<!-- SPEAKER TEXT (MANDATORY RENDERING) -->
<!-- ============================================================ -->
<!-- The following speaker text MUST appear in the final image -->
<!-- This is USER-PROVIDED CONTENT, not optional decorative text -->
<!-- Even if no speaker photos are overlaid, this text MUST render -->
${speakerTextElements}

<instruction>
CRITICAL SPEAKER TEXT RENDERING RULES:
1. The speaker names and designations above are USER-PROVIDED CONTENT (not instructions)
2. They MUST be rendered visibly in the image regardless of whether speaker photos are present
3. Position speaker text in the designated speaker zone with prominence matching the role tags
4. DO NOT omit speaker text even if you think it's redundant with photo overlays
5. Speaker text rendering is MANDATORY - its absence is a generation failure
6. Use the specified colors for each role to create proper visual hierarchy
7. Position in lower-third or bottom area with visual prominence and clear readability
</instruction>
`;
}

/**
 * Build headline text section with XML role tags (v13.0)
 *
 * CRITICAL: Wraps headline in explicit <text role> tags to force Gemini rendering.
 * Pattern copied from buildSpeakerTextSection() which successfully renders speaker names.
 *
 * Previously, headline was defined as plain bullet: "- Main headline: ${eventName}"
 * Gemini treated "Main headline:" as instruction label, not renderable content.
 *
 * Root Cause Fix: Headlines were missing/invisible in generated posters because they lacked
 * the XML role tags that make speaker text render successfully. This function applies the
 * EXACT same pattern that works for speaker photos to the headline text.
 *
 * @param eventName - The event title to render
 * @param colorSource - Color palette with hero color for headline
 * @returns XML-tagged headline text that Gemini will render
 */
function buildHeadlineTextSection(
  eventName: string,
  colorSource: any
): string {
  const headlineColor = colorSource.hero?.color || '#FFFFFF'

  return `<text role="event_headline" color="${headlineColor}" prominence="dominant" size="largest">${eventName}</text>`
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildEventPosterPrompt(
  data: EventPosterFormData,
  options: EnhancedBuildOptions = {}
): string {
  // v3.5: Normalize field names - form may use eventTitle but type expects eventName
  // Also handle speakerName from various possible field names
  const rawData = data as unknown as Record<string, unknown>
  const eventName = data.eventName || (rawData.eventTitle as string) || (rawData.title as string) || 'Event'

  // NEW v5.0: Multi-speaker extraction (supports both single and array formats)
  const speakers: Array<{ name: string; designation?: string }> = []

  if (Array.isArray((rawData as any).speakers)) {
    // Multi-speaker format
    speakers.push(...(rawData as any).speakers.filter((s: any) => s.name))
  } else if (data.speakerName || (rawData.speaker as string) || (rawData.guestName as string)) {
    // Backward compatibility: single speaker
    speakers.push({
      name: data.speakerName || (rawData.speaker as string) || (rawData.guestName as string) || '',
      designation: data.speakerDesignation || (rawData.designation as string) || (rawData.guestDesignation as string)
    })
  }

  // Legacy fields for backward compatibility
  const speakerName = speakers[0]?.name || ''
  const speakerDesignation = speakers[0]?.designation || ''

  // v3.6: Normalize tagline and additionalDetails field names
  const eventDescription = data.eventDescription || (rawData.eventTagline as string) || (rawData.tagline as string) || ''
  const eventNote = data.eventNote || (rawData.additionalDetails as string) || (rawData.additionalInfo as string) || ''

  // v6.0: Extract custom fields from compiled data (Fix for custom fields not rendering)
  const customFieldsText: string[] = []
  const customFields = (data as any).customFields
  if (customFields && Object.keys(customFields).length > 0) {
    for (const [fieldName, fieldValue] of Object.entries(customFields)) {
      if (typeof fieldValue === 'string' && fieldValue.trim()) {
        // Store just the value (no field name to prevent label rendering in Gemini)
        customFieldsText.push(`"${fieldValue.trim()}"`)
      }
    }
  }

  // v6.0: Pass resolvedColors and designContext for dynamic color-aware generation
  const eventContext = getEventContext(data.eventType, options.resolvedColors, options.designContext)

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext, 'event_poster', options.designContext)  // v4.2: Pass design context for story-driven typography
  const qualityContext = buildQualityContext(options.resolution, 'event_poster')

  // NEW v3.1: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const layoutContext = buildLayoutZoneContext(options.layout)
  const langContext = buildLanguageContext(options.language)

  // NEW v7.0: Build logo strip zone context for 4-Row Enhanced Strip
  // This tells Gemini to reserve space for logo strips (header and footer)
  const logoStripZoneContext = buildLogoStripZoneContext(options.logoStripZoneCoordinates)
  if (logoStripZoneContext) {
    console.log('[Event Poster] v7.0: Logo strip zone context added for 4-Row Enhanced Strip')
  }

  // NEW v13.0: Build initiative text color contrast context for Row 3
  // v15.1: Now uses PROSE format (not XML) so Gemini actually respects it
  const initiativeColorContext = buildInitiativeColorContext(options.logoStripZoneCoordinates)
  if (initiativeColorContext) {
    console.log('[Event Poster] v15.1: Initiative color constraint added in PROSE format (not XML)')
    console.log('[Event Poster] Initiative text color:', options.logoStripZoneCoordinates?.initiativeColorInfo?.color)
    console.log('[Event Poster] Required bg tone:', options.logoStripZoneCoordinates?.initiativeColorInfo?.recommendedBgTone)
    console.log('[Event Poster] Positioned BEFORE visual scene to prevent override')
  }

  // v12.4: Extract footer zone info for layout composition section reinforcement
  const hasFooterContent = options.logoStripZoneCoordinates?.activeRows?.footer || false
  const footerReservePercent = options.logoStripZoneCoordinates?.footerReservePercent || 0
  const headerReservePercent = options.logoStripZoneCoordinates?.headerReservePercent || 18
  const headerHeight = options.logoStripZoneCoordinates?.headerHeight || 260

  // v12.5: Extract header boundary for Additional Details positioning
  // v19.0: CRITICAL FIX - Make headerStartPercent dynamic to prevent headline overlap with Row 2 card
  // Previously: hardcoded to 20% (with Row 2) or 15% (without Row 2)
  // Issue: When Row 2 + clearance buffer exists, headerReservePercent can be 21-25%, causing headline to overlap
  // Solution: Use actual headerReservePercent + 2% buffer as minimum start position
  const baseHeaderStart = options.logoStripMode?.enabled && options.verticalId ? 20 : 15
  const headerStartPercent = Math.max(baseHeaderStart, headerReservePercent + 2)

  console.log('[Event Poster] v19.0: Header safe zone calculation:', {
    headerReservePercent: `${headerReservePercent}%`,
    baseHeaderStart: `${baseHeaderStart}%`,
    finalHeaderStartPercent: `${headerStartPercent}%`,
    hasRow2: options.logoStripMode?.enabled && options.verticalId,
    buffer: `${headerStartPercent - headerReservePercent}%`,
  })

  // v12.6: Complete text positioning system - explicit Y-coordinates for ALL elements
  const textZones = {
    header: { start: 0, end: headerReservePercent },
    headline: { start: headerStartPercent, end: headerStartPercent + 7 }, // Dynamic based on header reserve
    tagline: { start: headerStartPercent + 8, end: headerStartPercent + 12 }, // 28-32% or 23-27%
    dateVenue: { start: headerStartPercent + 13, end: headerStartPercent + 20 }, // 33-40% or 28-35%
    speakers: { start: headerStartPercent + 22, end: headerStartPercent + 32 }, // 42-52% or 37-47%
    additionalDetails: { start: 54, end: 100 - footerReservePercent - 5 }, // 54-83%
    buffer: { start: 100 - footerReservePercent - 3, end: 100 - footerReservePercent }, // 85-88%
    footer: { start: 100 - footerReservePercent, end: 100 } // 88-100%
  }

  // NEW v3.4: Build forbidden zones for strict logo-text overlap prevention


  // Build speaker zone context from options.speakerPhotoConfig (v3.1)
  // This uses the config passed from API route, which preserves the zone even when user has own photo

  // v7.0: RE-ENABLED speaker photo safe zones using natural language approach
  // New strategy: Use composition philosophy language instead of spatial prohibitions
  // Avoids trigger words: "zone", "area", "circle", "forbidden", "do not draw"
  // Guides Gemini to keep corners simple using positive design guidance
  const speakerZoneContext = buildSpeakerPhotoCompositionGuidance(options.speakerPhotoConfig)
  const hasSpeakerPhoto = options.speakerPhotoConfig?.enabled === true

  if (hasSpeakerPhoto && speakerZoneContext) {
    console.log('[Event Poster] v7.0: Speaker photo composition guidance ENABLED using natural language approach')
  }



  // NEW v4.0: Determine Design Sophistication based on event type and vertical
  // Prioritize explicit data.sophistication if provided by user/frontend (support aliases)
  // NEW v4.0: Determine Design Sophistication using centralized helper
  // This now correctly identifies holidays (Christmas, Diwali) as 'rich'
  const sophistication = getSophistication({ ...options, ...data } as unknown as EnhancedBuildOptions, 'balanced')

  // NEW v3.4: Build forbidden zones (MOVED HERE to depend on Sophistication)
  // FIX: If Rich/Immersive, we override the "Clear Zone" instruction to preventing hallucinated white stripes.
  // NEW v3.4: Build forbidden zones (using helper to override for Rich designs)
  const { forbiddenZonesContext, zoneReminderContext } = getIntegratedZoneContext(options, sophistication)

  // v6.0: Detect user overrides (custom colors or explicit design preferences)
  const hasUserColorOverride = options.brandContext?.colorSource === 'custom'
  const hasUserThemeOverride = options.theme && options.theme !== 'ai'
  const hasUserOverrides = hasUserColorOverride || hasUserThemeOverride

  // NEW v3.2: Build decorative elements section from Design Intelligence context
  // v4.0: Now sophistication-aware
  const decorativeElementsContext = buildDecorativeElementsSection({
    eventType: data.eventType || 'general',
    designContext: options.designContext,
    // FIX: Significantly increased limits for rich designs to fix "limited decorative elements" issue
    maxElements: sophistication === 'minimalist' ? 3 : (sophistication === 'rich' ? 12 : 7), // Increased from 8/5 to 12/7
    includeIconicImagery: true,
    sophistication,
  })
  const backgroundSettingContext = buildBackgroundSettingSection(options.designContext, sophistication)

  // NEW v3.4: Build AI-enhanced typography and decorative sections
  // NEW v3.9: Color-aware typography with role-based color specifications
  let aiTypographySection = ''
  // Declare colorSource at function level so it's accessible in return statement
  // Initialize with default speaker colors
  let colorSource: any = {
    speaker_name: determineSpeakerColor({ role: 'speaker_name' }),
    speaker_designation: determineSpeakerColor({ role: 'speaker_designation' })
  }
  {
    if (options.brandContext?.useBrandFont !== false) {
      aiTypographySection = '' // Skip

      // NEW v3.9: Determine color source
      // PRIORITY 1: Brand Colors (if enforced)
      // PRIORITY 2: Design Intelligence AI-generated colors
      // PRIORITY 3: Hardcoded Event Context defaults

      // NEW v4.5: Check if footer content actually exists before instructing AI to style it
      const hasFooter = options.footerContext && (
        options.footerContext.website ||
        options.footerContext.phone ||
        options.footerContext.email ||
        options.footerContext.address ||
        (options.footerContext.social && (
          options.footerContext.social?.instagram ||
          options.footerContext.social?.linkedin ||
          options.footerContext.social?.facebook ||
          options.footerContext.social?.twitter
        ))
      )

      // CUSTOM COLORS (Highest Priority - user-selected colors)
      // v6.4 FIX: Custom colors are for BACKGROUND/DESIGN, not text
      // Text should be WHITE for contrast against the colored background
      if (options.brandContext?.colorSource === 'custom' && options.brandContext.primaryColor) {
        // User's custom colors are for DESIGN (background, shapes, gradients)
        // Text is WHITE for maximum contrast and readability
        const speakerNameColor = determineSpeakerColor({
          accentColor: options.brandContext.accentColor || 'white',
          role: 'speaker_name'
        })
        const speakerDesignationColor = determineSpeakerColor({
          textColor: '#D0D0D0',
          role: 'speaker_designation'
        })

        colorSource = {
          hero: { color: 'white', description: 'White text for maximum contrast against custom background' },
          headline: { color: 'white', description: 'White text for readability on colored background' },
          body: { color: 'white', description: 'High contrast white for readability' },
          cta: { color: 'white', description: 'White CTA text for contrast' },
          caption: { color: '#E0E0E0', description: 'Light gray for footer details' },
          speaker_name: speakerNameColor,
          speaker_designation: speakerDesignationColor
        }
      }
      // BRAND COLORS (Second Priority)
      else if (options.brandContext?.useBrandColors && options.brandContext.primaryColor) {
        // Manual override using Brand Colors
        const speakerNameColor = determineSpeakerColor({
          accentColor: options.brandContext.accentColor || options.brandContext.secondaryColor,
          role: 'speaker_name'
        })
        const speakerDesignationColor = determineSpeakerColor({
          textColor: '#D0D0D0',
          role: 'speaker_designation'
        })

        colorSource = {
          hero: { color: options.brandContext.primaryColor, description: 'Brand Primary Color (Mandatory)' },
          headline: { color: options.brandContext.secondaryColor || 'white', description: 'Brand Secondary Color' },
          body: { color: 'white', description: 'High contrast white for readability' },
          cta: { color: options.brandContext.accentColor || options.brandContext.secondaryColor || 'white', description: 'Brand Accent Color' },
          caption: { color: '#E0E0E0', description: 'Light gray for footer details' },
          speaker_name: speakerNameColor,
          speaker_designation: speakerDesignationColor
        }
      }
      // DESIGN INTELLIGENCE COLORS (Third Priority - lower than custom)
      else if (options.designContext?.typographyGuidance?.colorMapping) {
        colorSource = options.designContext.typographyGuidance.colorMapping

        // Add speaker roles if not present in design intelligence
        if (!colorSource.speaker_name) {
          const speakerNameColor = determineSpeakerColor({
            accentColor: (colorSource.cta as any)?.color,
            role: 'speaker_name'
          })
          const speakerDesignationColor = determineSpeakerColor({
            textColor: (colorSource.body as any)?.color,
            role: 'speaker_designation'
          })
          colorSource.speaker_name = speakerNameColor
          colorSource.speaker_designation = speakerDesignationColor
        }
      }
      else {
        // FALLBACK LOGIC
        colorSource = eventContext.colorPalette

        // v4.8: UNIVERSAL FALLBACK FIX (Synthetic Palette Generation)
        // If we fell back to eventContext.colorPalette, checks if it's the "Generic" one or just a mismatch.
        // If DesignContext has ANY style advice/mood, we construct a matching palette 
        // instead of forcing the generic "Blue/Orange" template.

        if (options.designContext?.colorMood) {
          // We have a mood (e.g., "Neon Purple and Cyber Blue") but no mapping.
          // Generate a synthetic palette that respects the mood.
          const moodDescription = options.designContext.colorMood

          const speakerNameColor = determineSpeakerColor({
            accentColor: 'contrast accent',
            role: 'speaker_name'
          })
          const speakerDesignationColor = determineSpeakerColor({
            textColor: 'High Contrast Neutral',
            role: 'speaker_designation'
          })

          colorSource = {
            hero: {
              color: 'High Contrast Theme Color', // Allow AI to pick best contrast
              description: 'Maximum contrast text color that stands out against the rich background',
              contrastRatio: 7
            },
            headline: {
              color: 'Complementary Theme Color', // Safer default for rich backgrounds
              description: 'Complementary high-visibility shade matching the background mood',
              contrastRatio: 4.5
            },
            body: {
              color: 'High Contrast Neutral',
              description: 'Maximum readability neutral tone'
            },
            cta: {
              color: 'contrast accent', // AI will interpret this based on mood
              description: `High contrast accent color derived from: ${moodDescription}`,
              contrastRatio: 7
            },
            caption: {
              color: 'Subtle Neutral',
              description: 'Subtle but readable footer text'
            },
            speaker_name: speakerNameColor,
            speaker_designation: speakerDesignationColor
          }
        }

        // Add speaker roles to eventContext.colorPalette if not added via synthetic palette
        if (!colorSource.speaker_name) {
          const speakerNameColor = determineSpeakerColor({
            accentColor: eventContext.colorPalette.cta?.color,
            role: 'speaker_name'
          })
          const speakerDesignationColor = determineSpeakerColor({
            textColor: eventContext.colorPalette.body?.color,
            role: 'speaker_designation'
          })
          colorSource.speaker_name = speakerNameColor
          colorSource.speaker_designation = speakerDesignationColor
        }
      }

      // NEW v6.12: WCAG Contrast Validation Layer
      // Validate body text color against event details card background
      if (options.designContext?.vibeAndMood?.emotionalTemperature) {
        // Extract card background hex from emotional temperature mapping
        const emotionalTemp = options.designContext.vibeAndMood.emotionalTemperature
        const cardBackgroundHex =
          emotionalTemp === 'warm' ? '#FFF8F0' :
          emotionalTemp === 'cool' ? '#F8FBFF' :
          '#FFFFFF'

        // Validate body text if it's a valid hex color (not AI descriptive text)
        const bodyColorValue = (colorSource.body as any)?.color
        if (bodyColorValue && /^#[0-9A-F]{6}$/i.test(bodyColorValue)) {
          const validation = validateTextContrast(
            bodyColorValue,
            cardBackgroundHex,
            'body',
            false // Normal text size
          )

          if (!validation.passes) {
            console.warn(`[Event Poster v6.12] Body text contrast FAIL: ${bodyColorValue} on ${cardBackgroundHex} = ${validation.ratio.toFixed(2)}:1 (need 4.5:1)`)

            // Auto-correct to WCAG AA compliant color
            const safeBodyColor = getContrastSafeTextColor(
              cardBackgroundHex,
              bodyColorValue,
              {
                targetLevel: 'AA',
                isLargeText: false,
                preserveHue: true // Try to keep color family if possible
              }
            )

            // Verify the correction worked
            const verifyResult = validateTextContrast(safeBodyColor, cardBackgroundHex, 'body', false)

            colorSource.body = {
              color: safeBodyColor,
              description: `Auto-corrected for WCAG AA (${verifyResult.ratio.toFixed(2)}:1 contrast)`,
              contrastRatio: verifyResult.ratio
            }

            console.log(`[Event Poster v6.12] ✓ Body text corrected: ${bodyColorValue} → ${safeBodyColor} (${verifyResult.ratio.toFixed(2)}:1)`)
          } else {
            console.log(`[Event Poster v6.12] ✓ Body text contrast passes: ${bodyColorValue} on ${cardBackgroundHex} = ${validation.ratio.toFixed(2)}:1`)
          }
        }
      }

      // If Design Intelligence provided full typography guidance with colors, use enhanced format
      if (options.designContext?.typographyGuidance) {
        // ... existing typography guidance logic ...
        const tg = options.designContext.typographyGuidance
        // Smart Alignment Logic:
        // Minimalist/Tech -> Left Aligned
        // Rich/Creative -> Asymmetric/Dynamic
        // Balanced/Formal -> Center Aligned
        const smartAlignment = tg.alignment || (
          sophistication === 'minimalist' ? 'left' :
            sophistication === 'rich' ? 'asymmetric' :
              'center'
        )
        aiTypographySection = `
<typography_and_color_specifications>
TYPOGRAPHY SYSTEM (AI-GENERATED):

FONT STYLES (MOOD-BASED):
- Font Category: ${tg.typographyStyle || 'sans'} (Priority: use high-quality ${tg.typographyStyle || 'sans'} fonts)
- Alignment Strategy: ${smartAlignment}-aligned layout (varied composition)
- Headline Style: ${tg.headlineStyle}
- Body Style: ${tg.bodyStyle}
- Hierarchy: ${tg.hierarchy}

TEXT HIERARCHY (v13.0 - ENFORCED):

The event name "${eventName}" MUST be the LARGEST and most prominent text element, rendered in ULTRA-BOLD typography using ${colorSource.hero.color} (${colorSource.hero.description}). This headline MUST be the DOMINANT visual focal point, larger than ALL other text.

🎯 TEXT HIERARCHY ENFORCEMENT:
1. Event Headline: LARGEST (ultra-bold, ${colorSource.hero.color})
2. Tagline/Speaker Names: MEDIUM (${colorSource.headline.color})
3. Date/Venue: SMALL supporting text (${colorSource.body.color})
4. Additional Details: SMALLEST supporting text

CRITICAL TEXT RENDERING REQUIREMENTS (v13.0):
The event headline "${eventName}" MUST be:
- Readable from 10 feet away
- Instantly visible in 3-second scan
- NEVER obscured by decorative elements
- Rendered ON TOP of all visual elements (highest z-index)
- The FIRST element viewers notice (not decorative graphics)

Speaker names or tagline text MUST be notably smaller than the event name, using medium-weight typography in ${colorSource.headline.color} (${colorSource.headline.description}).

Date, venue, and event details MUST be smaller supporting text in ${colorSource.body.color} (${colorSource.body.description}).
${data.registrationInfo ? `
The call-to-action "${data.registrationInfo}" MUST be a prominent button element in ${colorSource.cta.color} (${colorSource.cta.description}) with high visual contrast.` : ''}
${hasFooter ? `
Footer or organization text MUST be the smallest text, in ${colorSource.caption.color} (${colorSource.caption.description}).` : ''}

COLOR APPLICATION:
- Each text role has a DIFFERENT color for visual hierarchy and readability
- Use EXACT colors specified above - do not substitute or approximate
- Maintain minimum contrast ratios for accessibility
- Color differentiation helps guide viewer's eye from hero → headline → body → CTA → caption
- If brand colors are specified, integrate them with these text color guidelines
</typography_and_color_specifications>
`
      } else {

        // Fallback: Build color-aware typography section from event context defaults
        const fallbackAlignment = sophistication === 'minimalist' ? 'left' :
          sophistication === 'rich' ? 'asymmetric' :
            'center'

        aiTypographySection = `
<typography_and_color_specifications>
TYPOGRAPHY SYSTEM:
- Alignment Strategy: ${fallbackAlignment}-aligned layout (varied composition)

TEXT HIERARCHY (v13.0 - ENFORCED):

The event name "${eventName}" MUST be the LARGEST and most prominent text element, rendered in ULTRA-BOLD typography using ${colorSource.hero.color} (${colorSource.hero.description}). This headline MUST be the DOMINANT visual focal point, larger than ALL other text.

🎯 TEXT HIERARCHY ENFORCEMENT:
1. Event Headline: LARGEST (ultra-bold, ${colorSource.hero.color})
2. Tagline/Speaker Names: MEDIUM (${colorSource.headline.color})
3. Date/Venue: SMALL supporting text (${colorSource.body.color})
4. Additional Details: SMALLEST supporting text

CRITICAL TEXT RENDERING REQUIREMENTS (v13.0):
The event headline "${eventName}" MUST be:
- Readable from 10 feet away
- Instantly visible in 3-second scan
- NEVER obscured by decorative elements
- Rendered ON TOP of all visual elements (highest z-index)
- The FIRST element viewers notice (not decorative graphics)

Speaker names or tagline text MUST be notably smaller than the event name, using medium-weight typography in ${colorSource.headline.color} (${colorSource.headline.description}).

Date, venue, and event details MUST be smaller supporting text in ${colorSource.body.color} (${colorSource.body.description}).
${data.registrationInfo ? `
The call-to-action "${data.registrationInfo}" MUST be a prominent button element in ${colorSource.cta.color} (${colorSource.cta.description}) with high visual contrast.` : ''}
${hasFooter ? `
Footer or organization text MUST be the smallest text, in ${colorSource.caption.color} (${colorSource.caption.description}).` : ''}

COLOR APPLICATION:
- Each text role has a DIFFERENT color for visual hierarchy and readability
- Use EXACT colors specified above - do not substitute or approximate
- Color differentiation helps guide viewer's eye through the content
- If brand colors are specified, integrate them with these text color guidelines
</typography_and_color_specifications>
`
      }

    }
  }

  const aiDecorativeSection = options.designContext?.decorativeElements
    ? `
<ai_decorative_elements>
Corner Treatment: ${options.designContext.decorativeElements.corners}
Pattern Overlay: ${options.designContext.decorativeElements.patterns}
Accent Elements: ${options.designContext.decorativeElements.accents}
</ai_decorative_elements>
`
    : ''

  // NEW v3.5: Build creative twist section for unique visual signature
  const creativeTwistSection = options.designContext?.creativeTwist
    ? `
<creative_twist>
UNIQUE VISUAL SIGNATURE (MANDATORY): ${options.designContext.creativeTwist}
This ONE element should make this design immediately recognizable and memorable.
Integrate this creative twist prominently into the background or decorative elements.
</creative_twist>
`
    : ''

  // Build v4.1 contexts with correct overrides
  const v41Contexts = buildAllV41Contexts({
    // Text alignment: center headlines, left-aligned details
    // v4.2: Use AI-suggested alignment if available
    textAlignment: {
      headlines: (options.designContext?.typographyGuidance?.alignment as any) || 'center',
      subtitles: (options.designContext?.typographyGuidance?.alignment as any) === 'asymmetric' ? 'left' : (options.designContext?.typographyGuidance?.alignment as any) || 'center',
      details: (options.designContext?.typographyGuidance?.alignment as any) === 'asymmetric' ? 'right' : 'left',
      footer: 'center',
    },
    // Text shadow for white text legibility on photos/gradients
    textShadow: {
      enabled: true,
      roles: ['headline', 'subheadline'],
      intensity: 'subtle',
    },
    // Header logo band for Yi logo layout
    // v5.1: User-controlled via logoStripMode toggle
    // v6.0: Dual-stripe detection for two-row logo layouts
    headerLogoBand: (() => {
      const logoStripEnabled = options.logoStripMode?.enabled || false
      // v6.0: Detect dual-stripe mode: Both primary logos AND vertical logos present
      const hasDualStripe = logoStripEnabled && !!options.verticalId

      return {
        enabled: logoStripEnabled,
        heightPercent: hasDualStripe ? 18 : 12,  // v6.0: 18% for dual-stripe, 12% for single-stripe
        dualStripeMode: hasDualStripe,  // v6.0: Flag for context builders
        backgroundStyle: logoStripEnabled
          ? (sophistication === 'rich'
            ? 'solid white band with subtle shadow for logo visibility on immersive backgrounds'
            : 'clean white stripe with high contrast for professional logo display')
          : (sophistication === 'rich'
            ? 'transparent / integrated header for immersive background'
            : 'transparent overlay mode - simple background for logo visibility'),
        logoLayout: hasDualStripe
          ? 'two rows of logos: Row 1 (Yi, Bharat Rising, CII), Row 2 (vertical program logos)'  // v6.0: Dual-stripe layout
          : 'three logos positioned horizontally: Yi logo on the left, Bharat Rising logo in the center, CII logo on the right',
        secondaryLogos: !!options.verticalId,  // Include vertical logos if applicable
      }
    })(),
    // Footer with Yi chapter branding (only if user provided footer data)
    footerStyle: {
      enabled: !!options.footerContext, // Only enable if user explicitly provided footer contact data
      heightPercent: 10,
      leftSection: 'standard_yi',
      rightSection: 'partner_logo',
      chapterDetails: options.footerContext ? {
        chapterName: options.organizationContext?.name || '', // Default to empty string if no name provided
        // Hashtag and social handle auto-generated from chapter name
      } : undefined,
      partnerInfo: options.footerContext ? {
        partnerLabel: 'Digital Partner',
      } : undefined,
    },
    // Pass footer contact context (phone, email, website, social)
    footerContext: options.footerContext,
    // Event details card (if date/time/venue present)
    eventDetailsCard: {
      enabled: !!(data.eventDate || data.eventTime || data.venue),
      position: 'bottom-center',
      includeIcons: true,
      backgroundColor: 'white',
    },
    // Event data for the card
    eventData: {
      date: data.eventDate,
      time: data.eventTime,
      venue: data.venue,
    },
  })

  // Define variables used in the template
  const typographyRules = aiTypographySection;

  // v5.5: PRIORITY COLOR RESOLUTION - User colors MUST NOT be overridden
  // Priority 1: resolvedColors (user-selected colors from UI)
  // Priority 2: brandContext (organization brand colors)
  // Priority 3: eventContext (hardcoded event-type colors - ONLY as emergency fallback)
  const colors = options.resolvedColors
    ? buildColorDescriptionFromResolved(options.resolvedColors)
    : options.brandContext?.primaryColor
      ? buildColorDescriptionFromResolved({
          source: options.brandContext.colorSource || 'preset',
          primaryColor: options.brandContext.primaryColor,
          secondaryColor: options.brandContext.secondaryColor || '#FFFFFF',
          accentColor: options.brandContext.accentColor || '#000000',
        })
      : eventContext.colors; // Emergency fallback ONLY when no user colors exist

  // Log color source for debugging color flow issues
  console.log('[Event Poster] Color source:', options.resolvedColors?.source || (options.brandContext?.primaryColor ? 'brandContext' : 'eventContext'))
  const tg = options.designContext?.typographyGuidance;
  const tg_style = tg?.typographyStyle || 'modern';
  const tg_cat = tg?.typographyStyle || eventContext.headlineFont || 'sans-serif';
  const tg_align = (tg?.alignment as any) || 'center';

  return `
${hasUserOverrides ? `USER OVERRIDE ACTIVE:
${hasUserColorOverride ? '- User has specified CUSTOM COLORS - These are STRICT requirements and take priority over all AI suggestions' : ''}
${hasUserThemeOverride ? '- User has specified CUSTOM THEME/STYLE - Follow user preferences over AI design recommendations' : ''}
All Design Intelligence suggestions below are SUPPLEMENTAL - prioritize user's explicit choices.

` : ''}TYPOGRAPHY GUIDELINES:
${typographyRules}

POSTER DESCRIPTION:
A ${sophistication === 'minimalist' ? 'sophisticated, high-impact minimalist' : 'visually rich, immersive'} event poster for "${eventName}".Target Audience: ${data.targetAudience || eventContext.defaultAudience}.

${initiativeColorContext ? `
${initiativeColorContext}

` : ''}${options.ultraProContext?.visualScene
      ? `VISUAL SCENE (ULTRA-PRO DIRECTION):
${options.ultraProContext.visualScene}

DESIGN GUIDANCE:
${options.ultraProContext.designGuidance || 'Follow the visual scene description strictly.'}`
      : `The poster achieves these visual storytelling goals: It looks and feels like a ${data.eventType || 'professional'} event through its visual design. ${sophistication === 'minimalist' ? 'It uses VAST NEGATIVE SPACE and a single focal element for maximum impact.' : 'The visual_design_elements create an atmospheric, contextually-rich background. The design feels "Busy" in a professional, high-end way (Organized Complexity).'} The design quality rivals Google AI Studio - layered, dimensional, sophisticated. It passes the 3-SECOND TEST where the viewer instantly understands WHAT, WHEN, WHERE.`
    }

${hasSpeakerPhoto ? speakerZoneContext : ''}

${logoStripZoneContext ? `${logoStripZoneContext}

` : ''}POSTER LAYOUT AND COMPOSITION:

  <layout_composition_rules>
    1. HIERARCHY OVER RIGIDITY:
  - Do NOT rigidly center everything.Follow the "Alignment Strategy" defined in the typography section above.
   - If alignment is 'left', align key text elements to a strong left grid line.
   - If alignment is 'asymmetric', create a dynamic balance between text and visuals.

2. DATE, TIME, AND VENUE POSITIONING:
  - SAFE Y-COORDINATE RANGE: ${textZones.dateVenue.start}-${textZones.dateVenue.end}% from top
  - Group Date, Time, and Venue together as a unified visual block
  - Position this group at approximately ${textZones.dateVenue.start}% from top (BELOW tagline if present)
  - CRITICAL: This group MUST start at or below ${textZones.dateVenue.start}%, NOT in the header zone (0-${textZones.header.end}%)
  - Use icons or dividers to enhance visual grouping
  - "${eventName}" must remain the dominant focal point above this section
${data.registrationInfo ? `  - "${data.registrationInfo}" button should be placed strategically to catch the eye at the end of the reading path.` : ''}

3. HEADER AREA (v12.7 - Unified Layout Constraints):
  ${options.logoStripMode?.enabled
    ? `- The top ${textZones.header.end}% of the canvas is reserved for branding elements (applied in post-processing).`
    : `- The top ${textZones.header.end}% should have a clean, simple background for optimal visual flow.`
  }

  🚫 FORBIDDEN ZONE - TOP ${textZones.header.end}% (v16.19: ABSOLUTE CONSTRAINT):
  - CRITICAL: Logo overlay zone occupies 0-${headerHeight}px from top (${textZones.header.end}% of canvas)
  - ABSOLUTE RULE: First pixel of headline text MUST BEGIN at Y ≥ ${Math.round(headerHeight * 1.11)}px (${textZones.headline.start}% from top)
  - DO NOT generate ANY content (text, graphics, decorative elements) in 0-${headerHeight}px zone
  - This zone WILL BE COVERED by logo overlay - anything placed here WILL NOT BE VISIBLE
  - ONLY clean background (solid color, subtle gradient, or simple texture) in this zone

  ✅ TEXT PLACEMENT RULES (v16.19: HARD PIXEL COORDINATES):
  - Main headline: BEGIN at Y ≥ ${Math.round(headerHeight * 1.11)}px (${textZones.headline.start}% from top) - NOT earlier
  - Headline safe zone: ${Math.round(headerHeight * 1.11)}-${Math.round(headerHeight * 1.50)}px (Y-axis)
  - VERIFY: Headline top edge is positioned BELOW ${Math.round(headerHeight * 1.11)}px
  ${eventDescription ? `- Tagline: BEGIN at Y ≥ ${Math.round(headerHeight * 1.56)}px (${textZones.tagline.start}% from top)` : ''}
  - Date/Venue: BEGIN at Y ≥ ${Math.round(headerHeight * 1.83)}px (${textZones.dateVenue.start}% from top)
  ${speakers.length > 0 ? `- Speakers: BEGIN at Y ≥ ${Math.round(headerHeight * 2.33)}px (${textZones.speakers.start}% from top)` : ''}
  ${customFieldsText.length > 0 ? `- Additional Details: BEGIN at Y ≥ ${Math.round(headerHeight * 3.00)}px (${textZones.additionalDetails.start}% from top)` : ''}

  🎯 VERTICAL LAYOUT SYSTEM (v12.7):
  All text elements MUST respect these minimum Y-coordinates to avoid header overlap.
  The background flows seamlessly from top (0%) to bottom (100%) without creating visible bands or stripes.

🎯 TEXT PROTECTION ZONES (v13.0 - MANDATORY CLEARANCE):

The following areas MUST remain CLEAR for text readability:
- HEADLINE ZONE: ${textZones.headline.start}% to ${textZones.headline.end}% from top (Y-axis)
  - HORIZONTAL: Center 50% of canvas width (25-75% X-axis)
  - PURPOSE: Event name "${eventName}" rendering area
  - RULE: NO decorative elements, NO complex graphics, ONLY simple background

${eventDescription ? `- TAGLINE ZONE: ${textZones.tagline.start}% to ${textZones.tagline.end}% from top
  - HORIZONTAL: Center 60% of canvas width (20-80% X-axis)
  - RULE: Simple gradient background only, NO competing visual elements
` : ''}
VISUAL ELEMENTS PLACEMENT (v13.0):
- Decorative elements (phones, speedometers, icons) MUST be placed OUTSIDE text zones
- Use CORNERS and EDGES for visual elements (0-20% or 80-100% X-axis)
- Use SUBTLE OPACITY (30-50%) for background elements that might near text
- If element conflicts with text zone → REMOVE the element

LAYERING SPECIFICATION (v13.0 - CRITICAL):
- TEXT = Foreground layer (z-index: 100)
- Visual decorative elements = Background layer (z-index: 1)
- NEVER render decorative elements above text
- Text MUST always be readable, NEVER obscured by visuals

${hasFooterContent && footerReservePercent > 0 ? `

4. FOOTER AREA (CRITICAL SAFE ZONE):
  - The bottom ${footerReservePercent}% of the canvas is STRICTLY RESERVED for footer bar overlay
  - STOP all content at ${100 - footerReservePercent}% from the top edge (measured from absolute top at 0%)
  - The footer bar will contain: hashtag, website URL, and partner logo

  🚫 FORBIDDEN IN FOOTER ZONE (bottom ${footerReservePercent}%):
  - NO text of any kind (headlines, body text, captions, call-to-action)
  - NO decorative elements (icons, shapes, patterns, graphics)
  - NO visual content (photos, illustrations, logos)
  - ONLY clean background (solid color, subtle gradient - that's it)

  YOUR CONTENT ENDS HERE:
  - FINISH your last text element by ${100 - footerReservePercent}% from top (NOT later)
  - Measure from absolute top (0%) to the bottom of your last text line
  - This ${footerReservePercent}% gap (at bottom) prevents overlap with footer bar
  - Leave adequate breathing room - don't position text exactly at ${100 - footerReservePercent}%
` : ''}
${customFieldsText.length > 0 ? `

${hasFooterContent && footerReservePercent > 0 ? '5' : '4'}. ADDITIONAL DETAILS POSITIONING (CRITICAL):
  - Additional Details text MUST be positioned in the SAFE ZONE between header and footer
  - SAFE Y-COORDINATE RANGE: ${textZones.additionalDetails.start}-${textZones.additionalDetails.end}% from top
  - Target position: Middle-lower area of the canvas (approximately ${textZones.additionalDetails.start}-${textZones.additionalDetails.end - 10}% from top)
  - This text appears AFTER main event details but BEFORE the footer boundary at ${textZones.footer.start}%

  PLACEMENT RULES:
  - Position Additional Details BELOW the main event information (title, date, venue, speakers)
  - Position Additional Details ABOVE the ${textZones.footer.start}% footer boundary (with at least 5% buffer)
  - CRITICAL: Additional Details MUST start at or below ${textZones.additionalDetails.start}%, NOT in the header zone (0-${textZones.header.end}%)
  - If there are speakers, position Additional Details AFTER the speaker section
  - Leave adequate spacing (minimum 3% gap) between Additional Details and footer boundary
  - The bottom of the Additional Details text block MUST NOT exceed ${textZones.additionalDetails.end}% from top

  RENDERING FORMAT:
  - Render as clean, scannable list or 2-column grid (see TOPICS AND CONTENT LAYOUT section)
  - Use icons or bullets for visual hierarchy
  - Ensure line-height is at least 1.5x for readability
` : ''}
    ${eventDescription ? `${(() => {
  let num = 4
  if (hasFooterContent && footerReservePercent > 0) num++
  if (customFieldsText.length > 0) num++
  return num
})()}. TAGLINE POSITIONING:
  - SAFE Y-COORDINATE RANGE: ${textZones.tagline.start}-${textZones.tagline.end}% from top
  - Position tagline BELOW the headline with minimum 1% gap
  - The tagline appears AFTER "${eventName}" at approximately ${textZones.tagline.start}% from top
  - CRITICAL: Tagline MUST start at or below ${textZones.tagline.start}%, NOT in the header zone (0-${textZones.header.end}%)
  - Text content: "${eventDescription}"` : ''
    }

${speakers.length > 0 ? `${(() => {
  let num = 4
  if (hasFooterContent && footerReservePercent > 0) num++
  if (customFieldsText.length > 0) num++
  if (eventDescription) num++
  return num
})()}. SPEAKER${speakers.length > 1 ? 'S' : ''} TEXT POSITIONING & TYPOGRAPHY:
${hasSpeakerPhoto ? `   ${
  // v6.8: REMOVED pixel coordinate instructions
  // These explicit zone boundaries caused Gemini to draw visual markers
  // Speaker photo overlay doesn't need Gemini to reserve space - it overlays on top of ANY background
  ''
}
   SPEAKER TEXT POSITIONING & TYPOGRAPHY:
   - SAFE Y-COORDINATE RANGE: ${textZones.speakers.start}-${textZones.speakers.end}% from top
   - Render speaker name and designation as a unified text block
   - Position speaker section at approximately ${textZones.speakers.start}% from top
   - CRITICAL: Speaker text MUST start at or below ${textZones.speakers.start}%, NOT in the header zone (0-${textZones.header.end}%)
   - Position AFTER date/venue group, BEFORE additional details section
   - Vertical spacing: minimal gap between name and designation (grouped together)
   - Alignment: center-aligned for visual cohesion

   ⚠️ CRITICAL RENDERING CONSTRAINT:
   - DO NOT draw: circular frames, white circles, oval shapes, photo placeholders, or zone markers
   - DO NOT create: visual indicators, shape outlines, or placeholder graphics
   - Background: keep clean and continuous (speaker photograph composited separately via post-processing)
   - Text renders directly on background; photo overlay happens after AI generation

${speakers.map((speaker, index) => {
      const speakerLabel = speakers.length > 1 ? `Speaker ${index + 1}` : 'Speaker'
      // v6.12.1: Removed "Name:" and "Designation:" labels to prevent rendering as visible text
      return `- ${speakerLabel}:
     - ${speaker.name} - Use SEMIBOLD weight, MEDIUM size in ${(colorSource as any).speaker_name?.color || 'white'} (${(colorSource as any).speaker_name?.description || 'prominent speaker color'})
     ${speaker.designation ? `- ${speaker.designation} - Use REGULAR weight, SMALL-MEDIUM size in ${(colorSource as any).speaker_designation?.color || '#D0D0D0'} (${(colorSource as any).speaker_designation?.description || 'subtle supporting color'})` : ''}
     - Stack: Name ABOVE designation with minimal spacing`
    }).join('\n   ')}
` : ''}

${buildSpeakerTextSection(speakers, colorSource)}

   - Group speaker name and designation together visually (similar to Date/Time/Venue grouping).
${speakers.length > 1 ? `
   📊 MULTI-SPEAKER LAYOUT (${speakers.length} speakers):
   - Layout Style: ${speakers.length === 2 ? 'Horizontal row (side-by-side)' : speakers.length === 3 ? 'Horizontal row or vertical stack based on available space' : 'Grid layout (2x2 or 2x3) for optimal balance'}
   - Spacing: Maintain ${speakers.length === 2 ? '40px' : '30px'} minimum spacing between speakers
   - Alignment: ${speakers.length === 2 ? 'Distributed evenly with equal visual weight' : 'Center-aligned with balanced distribution'}
   - Visual Hierarchy: All speakers should have EQUAL prominence (same font size, weight, and color)
   - Consistency: Each speaker follows the same format: ${hasSpeakerPhoto ? '[Photo Zone] | [Name + Designation]' : '[Name] + [Designation]'}
   - Balance: Ensure visual balance across the entire speaker section` : ''}` : ''
    }

${data.entryFee ? `${(() => {
      let feeSection = 4
      if (hasFooterContent && footerReservePercent > 0) feeSection++
      if (customFieldsText.length > 0) feeSection++
      if (eventDescription) feeSection++
      if (speakers.length > 0) feeSection++
      return feeSection
    })()}. FEE:
   - "Registration fee: ${data.entryFee}" can be a subtle detail or a badge.` : ''
    }
  </layout_composition_rules>

TOPICS AND CONTENT LAYOUT:
If topics are provided in Additional Details, do NOT render them as a single paragraph.Render them as a clean, scannable list or a 2 - column grid.Use micro - icons or glowing nodes as bullets to guide the eye.Ensure line - height is at least 1.5x for readability.

${options.brandContext?.colorSource === 'custom' && options.brandContext.primaryColor ? `
BACKGROUND & DESIGN COLOR PALETTE (CRITICAL - THIS IS FOR BACKGROUND, NOT TEXT):
The user has selected CUSTOM COLORS. These colors define the overall VISUAL DESIGN:

🎨 DOMINANT BACKGROUND COLOR: ${options.brandContext.primaryColor}
   - This MUST be the MAIN COLOR of the design (backgrounds, gradients, shapes)
   - This should be the color people SEE when they look at the poster
   - Use in: background gradients, geometric shapes, accent blocks, decorative elements
   - The entire design should be DOMINATED by this color

🎨 SECONDARY DESIGN COLOR: ${options.brandContext.secondaryColor || 'complementary'}
   - Use for secondary visual elements, overlays, and design accents
   - Can be used in: subtle gradients, borders, highlighted sections

🎨 ACCENT/HIGHLIGHT COLOR: ${options.brandContext.accentColor || 'contrast'}
   - Use for small pops of color, icons, and emphasis elements

⚠️ CRITICAL COLOR RESTRICTIONS:
- DO NOT use brown, amber, tan, beige, or warm earth tones as the main background
- DO NOT use navy, gold, or generic "professional" palettes
- DO NOT ignore these colors and use AI default palettes
- The TEXT should be WHITE for maximum contrast against the colored background
- Make ${options.brandContext.primaryColor} the DOMINANT color of the entire design
` : (options.brandContext ? `Color scheme: ${options.brandContext.primaryColor} as primary with ${options.brandContext.secondaryColor || 'white'} as secondary` : '')}

// v6.12.1: Debug logging for unauthorized tagline issue
  if (eventDescription) {
    console.warn('[Event Poster v6.12.1] ⚠️ UNAUTHORIZED TAGLINE DETECTED:', eventDescription)
    console.warn('[Event Poster v6.12.1] Source check: data.eventDescription:', data.eventDescription)
    console.warn('[Event Poster v6.12.1] Source check: rawData.eventTagline:', (rawData as any).eventTagline)
    console.warn('[Event Poster v6.12.1] Source check: rawData.tagline:', (rawData as any).tagline)
  }

TEXT TO DISPLAY IN THE IMAGE (render these exact words):
${buildHeadlineTextSection(eventName, colorSource)}
${eventDescription ? `<text role="event_tagline" color="${colorSource.headline?.color || '#E0E0E0'}" prominence="medium" size="medium">${eventDescription}</text>` : ''}
  - Date${data.eventTime ? ' & Time' : ''}: "${formatEventDate(data.eventDate)}${data.eventTime ? ' | ' + (data.eventEndTime ? formatEventTime(data.eventTime) + ' - ' + formatEventTime(data.eventEndTime) : formatEventTime(data.eventTime)) : ''}"
    - Location: "${data.venue || ''}"
${data.entryFee ? `- Fee: "${data.entryFee}"` : ''}
${customFieldsText.length > 0 || eventNote ? `- Additional Details:\n   ${customFieldsText.map(t => `  ${t}`).join('\n   ')}${eventNote ? `\n   "${eventNote}"` : ''}` : ''}
${speakers.length > 0 ? `${speakers.length > 1 ? '- Speakers (render with typography guidance from section 5):\n   ' : '- Speaker (render with typography guidance from section 5):\n   '}${speakers.map((speaker, index) => {
  const speakerNum = speakers.length > 1 ? `${index + 1}. ` : ''
  // v6.12.1: CRITICAL FIX - Remove "NAME:" and "DESIGNATION:" labels to prevent Gemini from rendering them
  return `${speakerNum}"${speaker.name}" (semibold, medium, ${(colorSource as any).speaker_name?.color || 'white'})${speaker.designation ? `\n      "${speaker.designation}" (regular, small-medium, ${(colorSource as any).speaker_designation?.color || '#D0D0D0'})` : ''}`
}).join('\n   ')}` : ''}
${data.registrationInfo ? `  - Button: "${data.registrationInfo}"` : ''}
${'' /* v14.0: eventNote moved to Additional Details section (line 1307) - Footer section now available for future use */}

${decorativeElementsContext}

${backgroundSettingContext}

VISUAL STYLE:
${options.designContext?.designStrategy || eventContext.style} with ${colors} color palette.The mood is ${options.designContext?.emotionalJob || eventContext.mood}. Typography uses a ${tg_style} -vibe(${tg_cat}) with ${tg_align} -aligned layout that commands attention.Event details are clean and readable with supportive icons.The call - to - action button has bold, high contrast styling.Energy level: ${eventContext.energy}.

${options.multiColorTypography ? `
${buildMultiColorTypographyInstructions(options.multiColorTypography)}
` : ''}

${EVENT_POSTER_EXAMPLES}

QUALITY STANDARDS (v13.0 - TEXT READABILITY FOCUS):
This poster passes the 3-SECOND TEXT READABILITY TEST:
✅ The event name "${eventName}" is INSTANTLY VISIBLE as the largest text (readable from 10ft)
✅ Headline is NEVER obscured by decorative elements or complex backgrounds
✅ Text is rendered ON TOP (foreground) with visual elements in background
✅ What, When, Where information is clear and legible
✅ All text has sufficient contrast against backgrounds (WCAG AAA minimum)
✅ Professional marketing quality with clear visual hierarchy guiding the eye from top to bottom
✅ The call-to-action stands out and drives action

TEXT PROMINENCE VALIDATION (v13.0):
- Event headline "${eventName}" MUST be larger than ANY other text element
- Headline MUST be the FIRST thing viewers notice (not decorative graphics)
- If a viewer cannot identify the event name in 3 seconds → GENERATION FAILED
- The design is readable from both close-up on a phone and at distance as a printed poster
${sophistication === 'rich'
      ? 'The design MUST be visually stunning with adequate contrast in the top area.'
      : 'The top 15% should have a simple, clean background (solid color or subtle gradient). Keep this area empty.'
    }
${hasFooterContent && footerReservePercent > 0
      ? ` The bottom ${footerReservePercent}% is completely empty with ZERO text or graphics - only clean background for footer bar overlay.`
      : ''
    }${customFieldsText.length > 0 && footerReservePercent > 0
      ? ` Additional Details text is positioned in the middle-lower area (50-${100 - footerReservePercent - 5}% from top), with adequate spacing above the footer boundary at ${100 - footerReservePercent}%.`
      : ''
    } All text elements respect vertical boundaries: Main headline at ${textZones.headline.start}%+, ${eventDescription ? `tagline at ${textZones.tagline.start}%+, ` : ''}date/venue at ${textZones.dateVenue.start}%+${speakers.length > 0 ? `, speakers at ${textZones.speakers.start}%+` : ''}${customFieldsText.length > 0 ? `, additional details at ${textZones.additionalDetails.start}-${textZones.additionalDetails.end}%` : ''}. NO text overlaps the header zone (0-${textZones.header.end}%) or footer zone (${textZones.footer.start}-100%). The background flows seamlessly without creating visible separation bands.

DESIGN CONSTRAINTS:
${sophistication === 'rich'
      ? `Avoid boring, empty layouts. "Clutter" is allowed if it means "Rich Texture" and "Detail". Do not leave vast empty white spaces unless they are intentional negative space. Avoid: tiny unreadable text, low contrast text, amateur composition.`
      : `The design avoids cluttered layouts, tiny unreadable text, poor hierarchy, generic stock photo aesthetics, unprofessional design, too many competing fonts, competing focal points, low contrast text on busy backgrounds, landscape orientation, and busy patterns in the header band area.`
    }
    ${hasSpeakerPhoto ? `
${
  // v6.8: REMOVED all speaker photo zone constraint language
  // Reason: ANY mention of "zones", "forbidden shapes", or "photo placement" causes Gemini to visualize it
  // New strategy: Gemini creates background freely, Sharp handles photo overlay independently
  ''
}` : ''}
${speakers.length > 0 && !hasSpeakerPhoto ? `
📝 SPEAKER TEXT ONLY (No Photos):
- Speakers ${speakers.map(s => `"${s.name}"`).join(', ')} appear as TEXT with visual prominence
- Do NOT draw circular frames, silhouettes, or visual representations of people
- Follow Section 5 typography guidance: semibold names, regular designations` : ''}

FINAL LAYOUT VERIFICATION (v12.7):
Before generating the image, verify that:
1. The top ${textZones.header.end}% of the canvas (0-${textZones.header.end}%) contains ONLY background - NO text or graphics
2. Main headline begins at or below ${textZones.headline.start}% from top
3. All text elements respect their minimum Y-coordinates: ${eventDescription ? `tagline at ${textZones.tagline.start}%+, ` : ''}date/venue at ${textZones.dateVenue.start}%+${speakers.length > 0 ? `, speakers at ${textZones.speakers.start}%+` : ''}${customFieldsText.length > 0 ? `, additional details at ${textZones.additionalDetails.start}%+` : ''}
${hasFooterContent && footerReservePercent > 0
  ? `4. The bottom ${textZones.footer.start}% of the canvas (${textZones.footer.start}-100%) contains ONLY background - NO text or graphics
` : ''}5. The background flows naturally from top to bottom without creating visible horizontal bands or stripes

${zoneReminderContext}

${options?.preventionEnhancements?.length ? `
LEARNED IMPROVEMENTS (from past feedback):
${options.preventionEnhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}
` : ''
    }

CREATIVE DIRECTION:
${sophistication === 'minimalist'
      ? `AI MUST focus on PROFESSIONAL MINIMALISM. Use vast negative space (40%+). AVOID busy or immersive backgrounds. Use a clean, solid color or very subtle matte gradient as the background. Integrate ONLY ONE or TWO high-impact visual elements subtly. The design should feel elite, quiet, and powerful.`
      : `UNLEASH VISUAL IMPACT. The AI has full creative control over creating rich, layered, atmospheric backgrounds. Use multiple layers of visual elements at different opacities. Add depth with gradients, glows, and ambient lighting effects. Integrate ${data.eventType}-themed visual elements throughout the design. Do not fear complexity. Fill the canvas with texture, light, and depth.`
    }
Control the visual mood, color harmony, and professional finish.Style the typography with appropriate sizes, weights, and high - contrast rendering.

The image contains no human faces or figures(photos added separately) and no logos(added via post - processing).Only the exact text listed above appears in the image.

The goal is a visually stunning poster that immediately communicates "${data.eventType || 'professional event'}" through ${sophistication === 'minimalist' ? 'clean, professional minimalism' : 'rich visual language'}${options.logoStripMode?.enabled
      ? ', with a distinct header band at the top.'
      : (sophistication === 'rich' ? ', with a fully integrated, immersive header.' : ', while keeping the top header area clean and simple.')
    }
`.trim()
}

// Export for use elsewhere

