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

// Import logo zone enforcement helper (v3.4, v4.0)
import { buildForbiddenZonesSection, buildZoneReminderSection, buildPixelPreciseSpatialConstraints } from '../helpers/logo-zone-enforcement'

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

// v25.1: Import content density analyzer for sparse content background enrichment
import {
  analyzeContentDensity,
  buildContentDensityGuidance,
  getAdjustedElementCount,
  type ContentDensityAnalysis,
} from '@/lib/prompts/helpers/content-density-analyzer'

// v26.0: Import storytelling fusion types
import type { StorytellingOutput } from '../../storytelling-fusion'

// ============================================================
// HEX CODE SANITIZATION (v29.0)
// ============================================================

/**
 * Strip hex color codes from narrative text to prevent Gemini rendering them.
 * Colors are already enforced via <instruction>MANDATORY COLOR PALETTE</instruction>.
 */
function stripHexCodes(text: string): string {
  return text.replace(/#[0-9a-fA-F]{6}\b/g, '').replace(/\s{2,}/g, ' ').trim()
}

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

/**
 * Safely access color values from colorMapping with fallback protection
 * Prevents crashes when AI response is truncated or colorMapping is incomplete
 *
 * v1.0: Added for production stability (fixes truncated hex code crashes)
 */
function getSafeColor(
  colorSource: any,
  role: 'hero' | 'headline' | 'body' | 'cta' | 'caption',
  fallback: string
): { color: string; description: string } {
  // Check if colorSource and role exist
  if (!colorSource?.[role]) {
    console.warn(`[Event Poster] Missing color role '${role}', using fallback: ${fallback}`)
    return {
      color: fallback,
      description: `Fallback color for ${role} (original data missing)`
    }
  }

  const colorObj = colorSource[role]

  // Check if color property exists
  if (!colorObj.color) {
    console.warn(`[Event Poster] Missing color property for '${role}', using fallback: ${fallback}`)
    return {
      color: fallback,
      description: `Fallback color for ${role} (color property missing)`
    }
  }

  // Validate hex code completeness (must be 7 chars: #RRGGBB)
  const color = colorObj.color
  if (color.startsWith('#') && color.length !== 7) {
    console.warn(`[Event Poster] Incomplete hex code for '${role}': ${color} (expected 7 chars, got ${color.length}), using fallback: ${fallback}`)
    return {
      color: fallback,
      description: `Fallback color for ${role} (hex code truncated from ${color})`
    }
  }

  // All validations passed, return the color
  return {
    color: colorObj.color,
    description: colorObj.description || `Color for ${role}`
  }
}

// Default fallback colors (matching design system)
const COLOR_FALLBACKS = {
  hero: '#1E40AF',      // Bold blue - main headline
  headline: '#3B82F6',  // Medium blue - secondary headline
  body: '#E0E0E0',      // Light gray - body text
  cta: '#10B981',       // Green - call-to-action
  caption: '#9CA3AF'    // Subtle gray - captions/footer
} as const

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
  // v24.15: Return empty string for missing/empty dates (don't show placeholder text)
  if (!dateString || dateString.trim() === '') return ''
  try {
    const date = new Date(dateString)
    // Check if date is valid
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
CRITICAL SPEAKER TEXT RENDERING RULES (v24.12):
1. The speaker names and designations above are USER-PROVIDED CONTENT (not instructions)
2. They MUST be rendered visibly in the image regardless of whether speaker photos are present
3. VERTICAL POSITION CONSTRAINT: Place speaker text in the 54%-58% vertical zone
   - This is ABOVE the photo overlay zone (62%-68%)
   - Text placed at 60%+ will be HIDDEN by circular photo overlays
4. DO NOT omit speaker text even if you think it's redundant with photo overlays
5. Speaker text rendering is MANDATORY - its absence is a generation failure
6. Use the specified colors for each role to create proper visual hierarchy
7. Follow this vertical layout for multi-speaker posters:
   [Headline: 40%-46%] [Tagline: 46%-50%] [Date: 50%-54%] [Speakers: 54%-58%] [PHOTOS: 62%-68%]
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

/**
 * v26.0: Build storytelling narrative section for cohesive visual storytelling
 * Converts StorytellingOutput into XML-structured prompt guidance for Gemini
 *
 * @param storytelling - The unified visual narrative from storytelling fusion
 * @returns XML-structured storytelling brief with narrative, story arc, and element connections
 */
function buildStorytellingNarrativeSection(storytelling: StorytellingOutput): string {
  return `
<visual_storytelling confidence="${(storytelling.narrativeConfidence * 100).toFixed(0)}%">
UNIFIED VISUAL NARRATIVE:
${storytelling.visualNarrative}

STORY STRUCTURE:
1. OPENING: ${storytelling.storyArc.opening}
2. CLIMAX (HERO VISUAL): ${storytelling.storyArc.climax}
3. RESOLUTION: ${storytelling.storyArc.resolution}

VISUAL ELEMENTS & THEIR CONNECTIONS:
${storytelling.elementCohesion.map(ec => `
${ec.element}
  → Story Role: ${ec.storyRole.toUpperCase()}
  → Purpose: ${ec.reasoning}
  → Visual Link: ${ec.visualConnection}
`).join('\n')}

CRITICAL STORYTELLING REQUIREMENTS:
✓ Create ONE unified visual story (not disconnected elements)
✓ The HERO VISUAL must be the dominant focal point
✓ Supporting elements enhance the hero without competing
✓ All visuals serve the narrative cohesively
✓ Background atmosphere reinforces the story mood
</visual_storytelling>
`.trim()
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
  const rawEventDescription = data.eventDescription || (rawData.eventTagline as string) || (rawData.tagline as string) || ''
  const eventDescription = rawEventDescription
  const eventNote = data.eventNote || (rawData.additionalDetails as string) || (rawData.additionalInfo as string) || ''
  const organizerCaption = (rawData.eventCaption as string | undefined)?.trim() || null

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
  const footerBarHeight = options.logoStripZoneCoordinates?.footerHeight ?? 0  // v41.4: actual footer bar px

  // v25.1: Analyze content density to determine if background needs enrichment
  const contentDensityAnalysis = analyzeContentDensity({
    eventName,
    eventDescription,
    eventNote,
    venue: data.venue,
    speakers,
    registrationInfo: data.registrationInfo,
    additionalDetails: customFieldsText.join(' '),
  })

  console.log('[Event Poster v25.1] Content Density Analysis:', contentDensityAnalysis.analysis)

  // v25.1: Build content density guidance if background enrichment is needed
  const contentDensityGuidance = buildContentDensityGuidance(contentDensityAnalysis)

  // v24.29: Early detection of speaker photo mode for content zone calculation
  // Must be calculated BEFORE content zones so we can shrink to 40%-60% when speakers enabled
  const hasSpeakerPhotoEarly = options.speakerPhotoConfig?.enabled === true

  // v24.10: PIXEL-BASED UNIFIED ZONE POSITIONING — declared early (v41.4 moved up)
  // Gemini cannot parse XML percentages - use exact pixel coordinates
  const CANVAS_HEIGHT = 1440; // Event poster height
  const CANVAS_WIDTH = 1080;

  // v41.4: ACTUAL-BAR ZONE STRATEGY — content zone derived from real Sharp logo bar heights.
  // Scaffold shows EXACT bar heights → CONTENT_START/END must match or Gemini gets contradictory signals.
  // headerHeight (from logoStripZoneCoordinates) = actual rendered header height in Sharp (e.g. ~350px on 1440h)
  // footerBarHeight = actual rendered footer height in Sharp (e.g. ~259px on 1440h)
  // 10px buffer above/below the bars so text never butts against the bar edge.
  const CONTENT_START = Math.ceil(((headerHeight + 10) / CANVAS_HEIGHT) * 100)   // e.g. (350+10)/1440 = 25%
  const CONTENT_END = footerBarHeight > 0
    ? Math.floor(((CANVAS_HEIGHT - footerBarHeight - 10) / CANVAS_HEIGHT) * 100) // e.g. (1440-259-10)/1440 = 81%
    : (hasSpeakerPhotoEarly ? 65 : 70)   // fallback if no footer bar info
  const CENTER_ZONE_HEIGHT = CONTENT_END - CONTENT_START  // 25% available for text (or 20% with speaker photo)

  // Override calculated header start with center zone start
  const headerStartPercent = CONTENT_START

  console.log('[Event Poster v24.50] DYNAMIC ZONE STRATEGY:', {
    contentStart: `${CONTENT_START}%`,
    contentEnd: `${CONTENT_END}%`,
    centerZoneHeight: `${CENTER_ZONE_HEIGHT}%`,
    headerZone: `0% - ${CONTENT_START}% (FORBIDDEN)`,
    speakerPhotoZone: hasSpeakerPhotoEarly ? '60% - 90% (RESERVED for photo overlays)' : 'N/A',
    footerZone: `${CONTENT_END}% - 100% (FORBIDDEN)`,
    hasSpeakerPhoto: hasSpeakerPhotoEarly,
    reasoning: hasSpeakerPhotoEarly
      ? `v28.0: Content shrunk to ${CONTENT_START}%-60% to reserve 60%-90% for speaker photo overlays`
      : `v28.0: Dynamic ${CONTENT_START}%-${CONTENT_END}% content zone (no speaker photos)`
  })

  // v24.50: Simplified text zones - all within content zone
  // When speaker photos: 40%-60% (20% total) - tighter spacing
  // When no photos: 40%-70% (30% total) - standard spacing
  const speakerZoneHeight = speakers.length > 0 && !hasSpeakerPhotoEarly ?
    (speakers.length > 2 ? 8 : 6) : 0 // No speaker text zone when photo overlay mode

  // v39.0: Distribute text proportionally within 40-65% content zone (25% total)
  // Updated zone order: additionalDetails BEFORE speakers
  const textZones = {
    header: { start: 0, end: CONTENT_START },
    headline: { start: CONTENT_START, end: CONTENT_START + 6 },          // 40-46%
    tagline: { start: CONTENT_START + 7, end: CONTENT_START + 10 },      // 47-50%
    dateVenue: { start: CONTENT_START + 11, end: CONTENT_START + 16 },   // 51-56%
    // v39.0: Additional details tightened (57-62%)
    additionalDetails: hasSpeakerPhotoEarly
      ? { start: CONTENT_START + 17, end: CONTENT_END - 2 }  // 57-58% (compressed when photo overlay)
      : { start: CONTENT_START + 17, end: CONTENT_START + 22 }, // 57-62%
    // Speakers zone (63-65%) — skipped when photo overlay enabled
    speakers: hasSpeakerPhotoEarly
      ? { start: 0, end: 0 }  // Skip - Sharp renders speaker text with photo
      : { start: CONTENT_START + 23, end: CONTENT_START + 24 },    // 63-64%
    buffer: { start: CONTENT_END, end: CONTENT_END },                    // No buffer needed
    footer: { start: CONTENT_END, end: 100 }                             // Dynamic based on CONTENT_END
  }

  console.log('[Event Poster v24.50] Dynamic Text Distribution:', {
    contentZone: `${CONTENT_START}% - ${CONTENT_END}%`,
    headline: `${textZones.headline.start}% - ${textZones.headline.end}%`,
    tagline: `${textZones.tagline.start}% - ${textZones.tagline.end}%`,
    dateVenue: `${textZones.dateVenue.start}% - ${textZones.dateVenue.end}%`,
    additionalDetails: `${textZones.additionalDetails.start}% - ${textZones.additionalDetails.end}%`,
    speakers: hasSpeakerPhotoEarly ? 'SKIPPED (photo overlay mode)' : `${textZones.speakers.start}% - ${textZones.speakers.end}%`,
    footerZone: `${CONTENT_END}% - 100% (FORBIDDEN)`
  })

  // v40.1: Pixel zones aligned with CENTER_ZONE_HEIGHT-based vertical layout
  // Headline gets 35% of content zone, date/venue 20%, details 15%, registration 15%
  const _headlineHeightPx = Math.floor(CANVAS_HEIGHT * CENTER_ZONE_HEIGHT * 0.35 / 100)
  const _taglineHeightPx  = Math.floor(CANVAS_HEIGHT * CENTER_ZONE_HEIGHT * 0.15 / 100)
  const pixelZones = {
    // Header zone (0-40%) - FORBIDDEN
    headerEnd: Math.floor(CANVAS_HEIGHT * (CONTENT_START / 100)),              // 576px (40%)
    // Content zone boundaries (40-70%)
    contentStart: Math.floor(CANVAS_HEIGHT * (CONTENT_START / 100)),           // 576px (40%)
    headlineStart: Math.floor(CANVAS_HEIGHT * (CONTENT_START / 100)),          // 576px (40%)
    headlineEnd:   Math.floor(CANVAS_HEIGHT * (CONTENT_START / 100)) + _headlineHeightPx, // 727px (~50.5%)
    dateVenueStart: Math.floor(CANVAS_HEIGHT * (CONTENT_START / 100)) + _headlineHeightPx + _taglineHeightPx, // 792px (~55%)
    dateVenueEnd:   Math.floor(CANVAS_HEIGHT * (CONTENT_START + CENTER_ZONE_HEIGHT * 0.70) / 100), // 878px (~61%)
    contentEnd: Math.floor(CANVAS_HEIGHT * (CONTENT_END / 100)),               // 1008px (70%)
    // Footer zone (70-100%) - FORBIDDEN
    footerStart: Math.floor(CANVAS_HEIGHT * (CONTENT_END / 100)),              // 1008px (70%)
    footerEnd: CANVAS_HEIGHT
  };

  console.log('[Event Poster v24.10] UNIFIED ZONE PIXEL POSITIONS:', {
    headerZone: `0px - ${pixelZones.headerEnd}px (0-40% FORBIDDEN)`,
    contentZone: `${pixelZones.contentStart}px - ${pixelZones.contentEnd}px (${CONTENT_START}-${CONTENT_END}%)`,
    headlineZone: `${pixelZones.headlineStart}px - ${pixelZones.headlineEnd}px`,
    dateVenueZone: `${pixelZones.dateVenueStart}px - ${pixelZones.dateVenueEnd}px`,
    footerZone: `${pixelZones.footerStart}px - ${pixelZones.footerEnd}px (${CONTENT_END}-100% FORBIDDEN)`,
    canvasHeight: `${CANVAS_HEIGHT}px`
  });

  // v25.2 Fix B: LAYER 1 OVERLAP PREVENTION - Build pixel-precise spatial constraints
  // Use ACTUAL Sharp pixel values (not artificial 40%/70% zone boundaries)
  // Previously passed pixelZones.contentStart (576px, 40%) as headerHeight — WRONG
  // Now passes real Sharp header height (e.g., 290px) so Gemini sees the true boundary
  const _actualHeaderPx = options.logoStripZoneCoordinates?.headerHeight ?? pixelZones.contentStart
  const _actualFooterPx = options.logoStripZoneCoordinates?.footerHeight ?? (CANVAS_HEIGHT - pixelZones.footerStart)
  const _contentEndPx = Math.floor(CANVAS_HEIGHT * CONTENT_END / 100)  // derived from CONTENT_END — consistent with percentage label

  console.log('[Event Poster v25.2] Fix B — Real Sharp pixel values:', {
    actualHeaderPx: `${_actualHeaderPx}px`,
    actualFooterPx: `${_actualFooterPx}px`,
    contentEndPx: `${_contentEndPx}px (was artificial ${pixelZones.footerStart}px)`,
    gainedSpacePx: `${_contentEndPx - pixelZones.contentEnd}px more usable height`,
  })

  const pixelPreciseConstraints = buildPixelPreciseSpatialConstraints(
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
    _actualHeaderPx,    // Real Sharp header height (e.g., 290px) — not artificial 576px
    _actualFooterPx,    // Real Sharp footer height (e.g., 268px)
    CONTENT_START,
    100 - CONTENT_END,
    options.engine,
    _contentEndPx       // v25.2 NEW: explicit pixel where content MUST end (e.g., 1142px)
  )

  console.log('[Event Poster v24.10] LAYER 1:', options.engine === 'yi_craft'
    ? `Pro model STRICT spatial constraints (${CONTENT_START}%-${CONTENT_END}%)`
    : `Flash model spatial constraints (${CONTENT_START}%-${CONTENT_END}%)`
  )

  // NEW v3.4: Build forbidden zones for strict logo-text overlap prevention


  // Build speaker zone context from options.speakerPhotoConfig (v3.1)
  // This uses the config passed from API route, which preserves the zone even when user has own photo

  // v24.29: RE-ENABLED speaker photo composition guidance with 60% text boundary
  // New strategy: Use composition philosophy language to keep ALL text above 60%
  // This reserves 60%-70% for Sharp photo overlays without Gemini drawing placeholders
  const speakerZoneContext = buildSpeakerPhotoCompositionGuidance(options.speakerPhotoConfig)
  // v24.29: Use early detection value for consistency (already calculated above for content zones)
  const hasSpeakerPhoto = hasSpeakerPhotoEarly

  if (hasSpeakerPhoto && speakerZoneContext) {
    console.log('[Event Poster] v24.29: Speaker photo composition guidance ENABLED (60% text boundary)')
  }

  // v24.17: Log speaker text completely skipped from Gemini prompt when photo overlay is enabled
  // Sharp handles ALL speaker rendering (photo + name + designation) as grouped card
  if (hasSpeakerPhoto && speakers.length > 0) {
    console.log('[Event Poster] v24.17: Speaker text FULLY SKIPPED from Gemini prompt (photo overlay mode)')
    console.log('[Event Poster] v24.17: Sharp will render speaker card with:', speakers.map(s => `${s.name}${s.designation ? ` (${s.designation})` : ''}`).join(', '))
  }

  // NEW v4.0: Determine Design Sophistication based on event type and vertical
  // Prioritize explicit data.sophistication if provided by user/frontend (support aliases)
  // NEW v4.0: Determine Design Sophistication using centralized helper
  // This now correctly identifies holidays (Christmas, Diwali) as 'rich'
  const sophistication = getSophistication({ ...options, ...data } as unknown as EnhancedBuildOptions, 'balanced')

  // NEW v3.4: Build forbidden zones (MOVED HERE to depend on Sophistication)
  // v29.0: forbiddenZonesContext/zoneReminderContext intentionally NOT injected into prompt.
  // Their percentages (15-18%) contradict CONTENT_START (35-40%) and would send Gemini
  // conflicting zone signals. Pixel-precise constraints (Layer 1) are authoritative.
  const { forbiddenZonesContext: _forbiddenZonesCtx, zoneReminderContext: _zoneReminderCtx } = getIntegratedZoneContext(options, sophistication)

  // v6.0: Detect user overrides (custom colors or explicit design preferences)
  const hasUserColorOverride = options.brandContext?.colorSource === 'custom'
  const hasUserThemeOverride = options.theme && options.theme !== 'ai'
  const hasUserOverrides = hasUserColorOverride || hasUserThemeOverride

  // NEW v3.2: Build decorative elements section from Design Intelligence context
  // v4.0: Now sophistication-aware
  // v25.1: Content density-aware - more elements for sparse content
  // v24.12.4: Increased base counts for richer backgrounds (3→5, 7→10, 12→15)
  const baseMaxElements = sophistication === 'minimalist' ? 5 : (sophistication === 'rich' ? 15 : 10)
  const adjustedMaxElements = getAdjustedElementCount(baseMaxElements, contentDensityAnalysis)

  if (contentDensityAnalysis.shouldEnrichBackground) {
    console.log('[Event Poster v25.1] Background enrichment active:', {
      baseElements: baseMaxElements,
      adjustedElements: adjustedMaxElements,
      multiplier: contentDensityAnalysis.decorativeMultiplier,
      backgroundComplexity: contentDensityAnalysis.backgroundComplexity
    })
  }

  const decorativeElementsContext = buildDecorativeElementsSection({
    eventType: data.eventType || 'general',
    designContext: options.designContext,
    // v25.1: Use adjusted element count based on content density
    maxElements: adjustedMaxElements,
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

TEXT RENDERING (v42.2 — SHARP HANDLES ALL TEXT):

(DO NOT RENDER any text in the image — no headline, no tagline, no event name, no date, no venue)
Sharp composites ALL text on top of your background after generation.
Your job: generate BACKGROUND SCENE ONLY with a clean, visually rich environment.

COLOR GUIDANCE FOR BACKGROUND (use these as scene/environment colors):
- Primary environment color: ${getSafeColor(colorSource, 'hero', COLOR_FALLBACKS.hero).color}
- Secondary accent in scene: ${getSafeColor(colorSource, 'headline', COLOR_FALLBACKS.headline).color}
- Atmospheric/ambient tone: ${getSafeColor(colorSource, 'body', COLOR_FALLBACKS.body).color}

SEAMLESS BACKGROUND REQUIREMENT (v24.13 - per Gemini documentation):

AVOID these elements in the generated image (negative prompt list style):
horizontal lines, vertical lines, diagonal lines, divider bars, section separators, stripe patterns, band divisions, border lines, ruled lines, gradient bands, visible zone boundaries, segmented backgrounds, horizontal breaks, flow lines, motion streaks, connecting lines, slash marks, underscores, dashes, separator elements, decorative line patterns

CREATE instead:
ONE seamless, continuous background that flows from top to bottom like a single photograph or painting. Use WHITE SPACE, COLOR CONTRAST, and FONT SIZE differences to create hierarchy - the visual background remains unified throughout.

NOTE: Information containers (info cards, detail bars, CTA buttons) are FOREGROUND content elements
that sit ON TOP of the seamless background. They do not break the background continuity.

The poster MUST have ONE continuous visual flow from top to bottom with NO horizontal breaks, lines, or divisions.

SCENE-BASED BACKGROUND (v33.1 - STORYTELLING THROUGH ENVIRONMENT):

The background MUST depict a REAL SCENE or ENVIRONMENT that tells the event's story:

SCENE EXAMPLES — choose LITERAL or CONCEPTUAL based on what creates STRONGER visual impact:

LITERAL (real environment — grounded, documentary):
- Health/Medical → Indian doctor explaining anatomy to students with charts and medical models
- Road Safety → Indian youth in safety vests at a zebra crossing with traffic signs and cones
- Technology → Indian professionals at monitors with code, circuit boards, and tech equipment
- Leadership/Business → Indian speaker at a podium with attendees in a conference hall
- Environmental → Indian volunteers planting saplings with banners and recycling props
- Cultural/Arts → Indian performers on stage with instruments and colorful decorations
- Graduation/Convocation → South Indian graduates in caps and gowns receiving diplomas on stage with proud families watching from the audience; emotional embrace between graduate and parents; group of graduates tossing mortarboards against a radiant sky

CONCEPTUAL (visual metaphor — MORE MEMORABLE and shareable):
- Graduation/Achievement → Indian graduates in caps and gowns bursting through open books into golden sky; mortarboard hats transforming into birds in flight; grand staircase of books ascending toward radiant light
- Business/Leadership → A lone Indian leader silhouette at the apex of a grand staircase against an epic skyline; audience silhouettes forming a rising arrow; bold figure commanding the stage
- Technology/Innovation → Human brain rendered as a glowing AI circuit city illuminated from within; robot and AI elements forming a human silhouette; neural network patterns as a living digital map
- Environmental/Sustainability → Giant hands cradling a miniature Earth while a tree grows upward; Indian volunteers in a lush green natural landscape
- Health/Medical → Medical healing symbols transforming into human figures embracing life and vitality; heartbeat line forming a human running silhouette
- Road Safety → Bold graphic composition with traffic signs and road elements as a striking design system

CONCEPT-AS-DEVICE (most powerful technique — the event's core symbol BECOMES the composition itself):
- Leadership → audience silhouettes FORM the shape of a rising mountain peak or upward arrow
- Graduation → open books UNFOLD into the shape of wings mid-flight
- Technology → circuit board patterns BECOME a human brain or AI face
- Environmental → a tree's root structure IS a map / human figure
- Health → heartbeat waveform FORMS the shape of a running human silhouette

SELECTION PRINCIPLE: Choose whichever treatment — literal or conceptual — creates a MORE STRIKING, MORE MEMORABLE poster for this specific event. Conceptual imagery often produces more shareable, Pinterest-worthy results.

THE SCENE MUST INCLUDE:
✅ A recognizable ENVIRONMENT (classroom, conference hall, workspace, clinic, road crossing, venue)
✅ CONCRETE OBJECTS related to the topic (charts, equipment, tools, props, signage)
✅ Professional DEPTH-OF-FIELD (foreground sharp, background soft)
✅ LIGHTING that matches the setting (classroom daylight, stage spots, outdoor natural light)
✅ When people appear: INDIAN/South Asian appearance, actively DOING the activity (not posing)

THE SCENE MUST NOT INCLUDE:
❌ Abstract waves, flowing lines, dot grids, mesh patterns, atmospheric particles
❌ Generic geometric shapes with no connection to the event topic
❌ Non-Indian or Western-looking faces — if people appear, they MUST look Indian/South Asian
❌ Amorphous gradients with no concrete scene elements

THE STORY TEST: Can a viewer understand what this event is about JUST from the background?
"I see Indian students at a road crossing with safety vests and traffic signs" → Road Safety ✅
"I see a workspace with monitors and circuit boards" → Tech event ✅
"I see abstract pink and teal waves" → Could be anything ❌
${hasSpeakerPhotoEarly ? `
SPEAKER PHOTO ZONE (60%-90%): Keep this area free of AI-generated faces — user's speaker photo will be overlaid here. Scene people should appear in the upper portion only.` : ''}

Speaker names or tagline text MUST be notably smaller than the event name, using medium-weight typography in ${getSafeColor(colorSource, 'headline', COLOR_FALLBACKS.headline).color} (${getSafeColor(colorSource, 'headline', COLOR_FALLBACKS.headline).description}).

Date, venue, and event details MUST be smaller supporting text in ${getSafeColor(colorSource, 'body', COLOR_FALLBACKS.body).color} (${getSafeColor(colorSource, 'body', COLOR_FALLBACKS.body).description}).
${data.registrationInfo ? `
The call-to-action "${data.registrationInfo}" MUST be a prominent button element in ${getSafeColor(colorSource, 'cta', COLOR_FALLBACKS.cta).color} (${getSafeColor(colorSource, 'cta', COLOR_FALLBACKS.cta).description}) with high visual contrast.` : ''}
${hasFooter ? `
Footer or organization text MUST be the smallest text, in ${getSafeColor(colorSource, 'caption', COLOR_FALLBACKS.caption).color} (${getSafeColor(colorSource, 'caption', COLOR_FALLBACKS.caption).description}).` : ''}

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

TEXT RENDERING (v42.2 — SHARP HANDLES ALL TEXT):

(DO NOT RENDER any text in the image — no headline, no tagline, no event name, no date, no venue)
Sharp composites ALL text on top of your background after generation.
Your job: generate BACKGROUND SCENE ONLY with a clean, visually rich environment.

COLOR GUIDANCE FOR BACKGROUND (use these as scene/environment colors):
- Primary environment color: ${getSafeColor(colorSource, 'hero', COLOR_FALLBACKS.hero).color}
- Secondary accent in scene: ${getSafeColor(colorSource, 'headline', COLOR_FALLBACKS.headline).color}
- Atmospheric/ambient tone: ${getSafeColor(colorSource, 'body', COLOR_FALLBACKS.body).color}

SEAMLESS BACKGROUND REQUIREMENT (v24.13 - per Gemini documentation):

AVOID these elements in the generated image (negative prompt list style):
horizontal lines, vertical lines, diagonal lines, divider bars, section separators, stripe patterns, band divisions, border lines, ruled lines, gradient bands, visible zone boundaries, segmented backgrounds, horizontal breaks, flow lines, motion streaks, connecting lines, slash marks, underscores, dashes, separator elements, decorative line patterns

CREATE instead:
ONE seamless, continuous background that flows from top to bottom like a single photograph or painting. Use WHITE SPACE, COLOR CONTRAST, and FONT SIZE differences to create hierarchy - the visual background remains unified throughout.

NOTE: Information containers (info cards, detail bars, CTA buttons) are FOREGROUND content elements
that sit ON TOP of the seamless background. They do not break the background continuity.

The poster MUST have ONE continuous visual flow from top to bottom with NO horizontal breaks, lines, or divisions.

SCENE-BASED BACKGROUND (v33.1 - STORYTELLING THROUGH ENVIRONMENT):

The background MUST depict a REAL SCENE or ENVIRONMENT that tells the event's story:

SCENE EXAMPLES — choose LITERAL or CONCEPTUAL based on what creates STRONGER visual impact:

LITERAL (real environment — grounded, documentary):
- Health/Medical → Indian doctor explaining anatomy to students with charts and medical models
- Road Safety → Indian youth in safety vests at a zebra crossing with traffic signs and cones
- Technology → Indian professionals at monitors with code, circuit boards, and tech equipment
- Leadership/Business → Indian speaker at a podium with attendees in a conference hall
- Environmental → Indian volunteers planting saplings with banners and recycling props
- Cultural/Arts → Indian performers on stage with instruments and colorful decorations
- Graduation/Convocation → South Indian graduates in caps and gowns receiving diplomas on stage with proud families watching from the audience; emotional embrace between graduate and parents; group of graduates tossing mortarboards against a radiant sky

CONCEPTUAL (visual metaphor — MORE MEMORABLE and shareable):
- Graduation/Achievement → Indian graduates in caps and gowns bursting through open books into golden sky; mortarboard hats transforming into birds in flight; grand staircase of books ascending toward radiant light
- Business/Leadership → A lone Indian leader silhouette at the apex of a grand staircase against an epic skyline; audience silhouettes forming a rising arrow; bold figure commanding the stage
- Technology/Innovation → Human brain rendered as a glowing AI circuit city illuminated from within; robot and AI elements forming a human silhouette; neural network patterns as a living digital map
- Environmental/Sustainability → Giant hands cradling a miniature Earth while a tree grows upward; Indian volunteers in a lush green natural landscape
- Health/Medical → Medical healing symbols transforming into human figures embracing life and vitality; heartbeat line forming a human running silhouette
- Road Safety → Bold graphic composition with traffic signs and road elements as a striking design system

CONCEPT-AS-DEVICE (most powerful technique — the event's core symbol BECOMES the composition itself):
- Leadership → audience silhouettes FORM the shape of a rising mountain peak or upward arrow
- Graduation → open books UNFOLD into the shape of wings mid-flight
- Technology → circuit board patterns BECOME a human brain or AI face
- Environmental → a tree's root structure IS a map / human figure
- Health → heartbeat waveform FORMS the shape of a running human silhouette

SELECTION PRINCIPLE: Choose whichever treatment — literal or conceptual — creates a MORE STRIKING, MORE MEMORABLE poster for this specific event. Conceptual imagery often produces more shareable, Pinterest-worthy results.

THE SCENE MUST INCLUDE:
✅ A recognizable ENVIRONMENT (classroom, conference hall, workspace, clinic, road crossing, venue)
✅ CONCRETE OBJECTS related to the topic (charts, equipment, tools, props, signage)
✅ Professional DEPTH-OF-FIELD (foreground sharp, background soft)
✅ LIGHTING that matches the setting (classroom daylight, stage spots, outdoor natural light)
✅ When people appear: INDIAN/South Asian appearance, actively DOING the activity (not posing)

THE SCENE MUST NOT INCLUDE:
❌ Abstract waves, flowing lines, dot grids, mesh patterns, atmospheric particles
❌ Generic geometric shapes with no connection to the event topic
❌ Non-Indian or Western-looking faces — if people appear, they MUST look Indian/South Asian
❌ Amorphous gradients with no concrete scene elements

THE STORY TEST: Can a viewer understand what this event is about JUST from the background?
"I see Indian students at a road crossing with safety vests and traffic signs" → Road Safety ✅
"I see a workspace with monitors and circuit boards" → Tech event ✅
"I see abstract pink and teal waves" → Could be anything ❌
${hasSpeakerPhotoEarly ? `
SPEAKER PHOTO ZONE (60%-90%): Keep this area free of AI-generated faces — user's speaker photo will be overlaid here. Scene people should appear in the upper portion only.` : ''}

Speaker names or tagline text MUST be notably smaller than the event name, using medium-weight typography in ${getSafeColor(colorSource, 'headline', COLOR_FALLBACKS.headline).color} (${getSafeColor(colorSource, 'headline', COLOR_FALLBACKS.headline).description}).

Date, venue, and event details MUST be smaller supporting text in ${getSafeColor(colorSource, 'body', COLOR_FALLBACKS.body).color} (${getSafeColor(colorSource, 'body', COLOR_FALLBACKS.body).description}).
${data.registrationInfo ? `
The call-to-action "${data.registrationInfo}" MUST be a prominent button element in ${getSafeColor(colorSource, 'cta', COLOR_FALLBACKS.cta).color} (${getSafeColor(colorSource, 'cta', COLOR_FALLBACKS.cta).description}) with high visual contrast.` : ''}
${hasFooter ? `
Footer or organization text MUST be the smallest text, in ${getSafeColor(colorSource, 'caption', COLOR_FALLBACKS.caption).color} (${getSafeColor(colorSource, 'caption', COLOR_FALLBACKS.caption).description}).` : ''}

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
    // v24.2: CRITICAL FIX - Removed all descriptions of what logos/badges will appear
    // Gemini interprets descriptions as instructions to CREATE visible elements
    headerLogoBand: (() => {
      const logoStripEnabled = options.logoStripMode?.enabled || false
      // v6.0: Detect dual-stripe mode: Both primary logos AND vertical logos present
      const hasDualStripe = logoStripEnabled && !!options.verticalId

      return {
        enabled: logoStripEnabled,
        heightPercent: hasDualStripe ? 18 : 12,  // v6.0: 18% for dual-stripe, 12% for single-stripe
        dualStripeMode: hasDualStripe,  // v6.0: Flag for context builders
        // v24.2: Simplified background style - no mention of logos
        backgroundStyle: logoStripEnabled
          ? 'clean, simple background only - NO text or visual elements'
          : 'transparent - simple background only',
        // v24.2: REMOVED logoLayout description - was causing AI to generate "Yi Learning" badges
        logoLayout: 'EMPTY - generate only clean background in this zone',
        secondaryLogos: false,  // v24.2: Disabled - was causing unwanted badge generation
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

  // v42.1: Background contrast guidance — tell Gemini what text colors will be composited
  // so it can ensure the background provides adequate contrast with those colors.
  const _rc = options.resolvedColors
  const _bc = options.brandContext
  const _p = _rc?.primaryColor || _bc?.primaryColor || '#005B96'
  const _s = _rc?.secondaryColor || _bc?.secondaryColor || '#FFFFFF'
  const _a = _rc?.accentColor || _bc?.accentColor || '#FFFFFF'
  const _hexLum = (h: string) => {
    const clean = h.replace('#', '').padEnd(6, '0')
    const [r, g, b] = (clean.match(/.{2}/g) ?? ['ff','ff','ff'])
      .map(v => { const c = parseInt(v, 16)/255; return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4) })
    return 0.2126*r + 0.7152*g + 0.0722*b
  }
  // Pick the lightest brand color (what Sharp uses as headline text on dark backgrounds)
  const _overlayText = [_a, _s, _p, '#FFFFFF'].find(c => _hexLum(c) > 0.20) ?? '#FFFFFF'
  const _textIsLight = _hexLum(_overlayText) > 0.40
  const textContrastGuidance = _textIsLight
    ? `BACKGROUND CONTRAST REQUIREMENT (v42.1 — CRITICAL):
    Sharp will composite LIGHT text (${_overlayText}) in the ${CONTENT_START}%–${CONTENT_END}% zone.
    ✅ MANDATORY: Background in ${CONTENT_START}%–${CONTENT_END}% must be NOTICEABLY DARKER — deep shadows, rich dark environment, moody tones.
    ❌ FORBIDDEN: Bright sky, pale walls, high-luminance gradients, or white/cream tones in the content zone.`
    : `BACKGROUND CONTRAST REQUIREMENT (v42.1 — CRITICAL):
    Sharp will composite DARK text (${_overlayText}) in the ${CONTENT_START}%–${CONTENT_END}% zone.
    ✅ MANDATORY: Background in ${CONTENT_START}%–${CONTENT_END}% must be NOTICEABLY LIGHTER — pale sky, soft gradients, bright open environment.
    ❌ FORBIDDEN: Dark walls, deep shadows, or low-luminance tones in the content zone.`

  const contentZoneShadowGuidance = `TEXT READABILITY CARDS (v44.5 — MANDATORY BAKED-IN DESIGN ELEMENTS):
    The content zone (${CONTENT_START}%–${CONTENT_END}%) will have event text composited by Sharp AFTER generation.
    You MUST paint the following design elements DIRECTLY into the scene as part of the artwork:

    1. HEADLINE BACKDROP (${CONTENT_START}%–35% vertical):
       Paint a wide semi-transparent dark frosted-glass panel spanning 80% of canvas width.
       Style: frosted glass / glassmorphism / dark overlay with slight blur effect.
       Opacity: ~50-60% dark overlay so scene shows through but text area is noticeably darker.

    2. INFO CARD PANEL (36%–42% vertical):
       Paint a smaller semi-transparent rounded card/panel (centered, ~60% canvas width).
       Style: frosted glass with rounded corners, subtle border/glow, dark or brand-tinted overlay.
       Opacity: ~55-65% — this holds date, venue, and event details.

    3. SPEAKER STRIP (43%–50% vertical):
       Paint a narrow semi-transparent dark band or subtle card.
       Style: thin frosted strip or soft dark gradient.
       Opacity: ~40-50% — just enough to read speaker names.

    STYLING RULES:
    ✅ These cards should look like NATURAL UI elements integrated into the poster design
    ✅ Use glassmorphism, frosted glass, or dark gradient overlay aesthetic
    ✅ Cards can be tinted with the brand primary color (slight green/brand tint)
    ✅ Rounded corners (8-12px radius feel) on the info card panel
    ✅ The scene/background should be visible THROUGH these cards (they are semi-transparent)
    ✅ Think: modern event poster design with floating frosted info panels over a photographic scene

    ❌ NEVER skip these cards — every poster MUST have them
    ❌ NEVER make them fully opaque (scene must show through)
    ❌ NEVER use flat white rectangles — always dark or brand-tinted frosted glass
    ❌ NEVER make them look like a bug or artifact — they should look intentionally designed`

  return `
<!-- ============================================= -->
<!-- SPATIAL LAYOUT CONSTRAINTS (v24.0 - LAYER 1) -->
<!-- ============================================= -->

<instruction>
${pixelPreciseConstraints}
</instruction>

<!-- ============================================= -->
<!-- MANDATORY COLOR PALETTE (v27.0 - LAYER 2)  -->
<!-- ============================================= -->

${(() => {
  // v27.0: Build mandatory color enforcement block for ALL color sources
  // Previously, strong color enforcement only triggered for colorSource === 'custom'.
  // The ultraProContext.colorPaletteHints were never injected at all.
  const rc = options.resolvedColors
  const bc = options.brandContext
  const primaryHex = rc?.primaryColor || bc?.primaryColor || ''
  const secondaryHex = rc?.secondaryColor || bc?.secondaryColor || ''
  const accentHex = rc?.accentColor || bc?.accentColor || ''
  const ultraProColorHints = options.ultraProContext?.colorPaletteHints || ''

  if (primaryHex) {
    return `<instruction>
MANDATORY COLOR PALETTE — NON-NEGOTIABLE:
PRIMARY: ${primaryHex} — dominant background color, gradients, and shapes
SECONDARY: ${secondaryHex || 'complementary'} — MUST appear on ALL headline text and key visual accents
ACCENT: ${accentHex || 'contrast color'} — body text, atmospheric elements, and small highlights

The secondary color ${secondaryHex} MUST be visibly present in the design. A poster missing this color is REJECTED.
Do NOT substitute these colors with AI default palettes, navy/gold, or earth tones.
${ultraProColorHints ? `\nULTRA-PRO COLOR DIRECTION: ${ultraProColorHints}` : ''}
</instruction>
`
  }
  return ultraProColorHints ? `<instruction>
COLOR DIRECTION (ULTRA-PRO): ${ultraProColorHints}
Follow these color suggestions strictly. Do NOT use generic palettes.
</instruction>
` : ''
})()}
<!-- ============================================= -->
<!-- TYPOGRAPHY (WITHIN PIXEL ZONES)             -->
<!-- ============================================= -->

${hasUserOverrides ? `USER OVERRIDE ACTIVE:
${hasUserColorOverride ? '- User has specified CUSTOM COLORS - These are STRICT requirements and take priority over all AI suggestions' : ''}
${hasUserThemeOverride ? '- User has specified CUSTOM THEME/STYLE - Follow user preferences over AI design recommendations' : ''}
All Design Intelligence suggestions below are SUPPLEMENTAL - prioritize user's explicit choices.

` : ''}TYPOGRAPHY GUIDELINES:
${typographyRules}

<instruction>(DO NOT RENDER — poster context for visual composition only, NOT text to display)
POSTER DESCRIPTION:
A ${sophistication === 'minimalist' ? 'sophisticated, high-impact minimalist' : 'visually rich, immersive'} event poster for a ${(data as any).eventType || 'professional'} event${eventDescription ? ` — themed around "${eventDescription}"` : ''}.Target Audience: ${data.targetAudience || eventContext.defaultAudience}.${eventDescription ? `\nEVENT CONTEXT: The visual design, imagery, and atmosphere must reflect the topic "${eventDescription}". This is the PRIMARY thematic direction for the poster.` : ''}
</instruction>

${initiativeColorContext ? `
${initiativeColorContext}

` : ''}${options.ultraProContext?.visualScene
      ? `<instruction>(DO NOT RENDER — visual scene blueprint for composition only. NEVER convert any phrase here into visible text, label, caption, banner, or annotation on the image. Visualize silently.)
VISUAL SCENE (ULTRA-PRO DIRECTION — DRAW THIS, DO NOT WRITE THIS):
${stripHexCodes(options.ultraProContext.visualScene)}

DESIGN GUIDANCE:
${stripHexCodes(options.ultraProContext.designGuidance || 'Follow the visual scene description strictly.').replace(/(\d{2,3})([–-])(\d{2,3})%/g, (match, low, dash, high) => {
  const l = parseInt(low); const h = parseInt(high);
  const cl = Math.min(l, CONTENT_END); const ch = Math.min(h, CONTENT_END);
  return cl === ch ? `${cl}%` : `${cl}${dash}${ch}%`;
}).replace(/(?:below|above|past|beyond)\s+(\d{2,3})%/gi, `within ${CONTENT_START}-${CONTENT_END}%`)}
⚠️ OVERRIDE: ALL text placement percentages above are CLAMPED to the ${CONTENT_START}-${CONTENT_END}% content zone. Ignore any guidance suggesting text below ${CONTENT_END}%.
</instruction>`
      : `<instruction>(DO NOT RENDER — visual guidance only)
The poster achieves these visual storytelling goals: It looks and feels like a ${data.eventType || 'professional'} event through its visual design. ${sophistication === 'minimalist' ? 'It uses VAST NEGATIVE SPACE and a single focal element for maximum impact.' : 'The visual_design_elements create an atmospheric, contextually-rich background. The design feels "Busy" in a professional, high-end way (Organized Complexity).'} The design quality rivals Google AI Studio - layered, dimensional, sophisticated. It passes the 3-SECOND TEST where the viewer instantly understands WHAT, WHEN, WHERE.
</instruction>`
    }

${hasSpeakerPhoto ? speakerZoneContext : ''}

${options.speakerLayoutContext && !hasSpeakerPhoto ? `
<instruction>
SPEAKER LAYOUT AGENT DECISION (v7.1 - AI-Analyzed, DO NOT RENDER):
${options.speakerLayoutContext}

CRITICAL: The above layout analysis was performed by an AI agent that analyzed the TOTAL number of speakers
vs speakers with photos. Photo sizing is based on TOTAL speakers to prevent oversized photos when only
some speakers have uploaded photos. Follow the layout guidance strictly.

MULTI-SPEAKER TEXT POSITIONING (v24.12 - MANDATORY):
For posters with 2+ speakers, follow this vertical layout to avoid photo overlap:
- 40%-46%: Event headline (largest, most prominent)
- 46%-50%: Event tagline/theme
- 50%-54%: Date, time, venue
- 54%-58%: SPEAKER NAMES AND DESIGNATIONS (must render here, NOT lower)
- 58%-62%: Dress code, entry limits, additional details
- 62%-68%: [RESERVED FOR PHOTO OVERLAYS - DO NOT PLACE TEXT HERE]

⚠️ CRITICAL: Speaker names placed at 60%+ will be completely HIDDEN by circular photo overlays.
</instruction>
` : ''}
${'' /* v24.17: When hasSpeakerPhoto=true, speaker text rendering is handled by Sharp, not Gemini */}

${logoStripZoneContext ? `${logoStripZoneContext}

` : ''}
${logoContext}
<!-- ============================================= -->
<!-- VISUAL CONTEXT (WITHIN SPATIAL ZONES)       -->
<!-- ============================================= -->

<!-- v21.0: Layout percentages removed from prose to prevent rendering as visible text -->
<!-- v22.0: Now using structured XML tags at TOP instead of vague spatial language -->
<!-- v23.0: Reordered sections - spatial constraints now appear FIRST (before typography) -->
<!-- v24.12.1: Wrapped heading in instruction tags to prevent text leak -->

<instruction>(DO NOT RENDER AS TEXT) LAYOUT AND COMPOSITION RULES:</instruction>

  <layout_composition_rules>
    0. CONTENT BOUNDARY ENFORCEMENT (OVERRIDES ALL OTHER RULES):
  - The ABSOLUTE BOTTOM BOUNDARY for any content element is ${_contentEndPx}px from top
  - Pixels ${_contentEndPx}–${CANVAS_HEIGHT} are physically covered by logo overlays and WILL NOT APPEAR
  - If all content does NOT fit above ${_contentEndPx}px: reduce font sizes, tighten spacing, use 2-column layout
  - Priority when space is tight: Headline > Date/Time > Venue > Speaker > Note/Additional
  - NEVER push content downward to make it fit — compress it instead
  - (DO NOT RENDER) Date/venue container must be fully enclosed above ${_contentEndPx}px. Its bottom must not pass ${_contentEndPx - 30}px. It is overlaid ON the scene background within the content zone.

    1. FOLLOW SPATIAL LAYOUT CONSTRAINTS (PRIMARY AUTHORITY - v24.29):
  - CONTENT ZONE: ${CONTENT_START}% to ${CONTENT_END}% of canvas height (${Math.floor(1440 * CONTENT_START / 100)}px to ${Math.floor(1440 * CONTENT_END / 100)}px for 1440px canvas)
  - ALL TEXT MUST FIT within this ${CENTER_ZONE_HEIGHT}% vertical zone (${Math.floor(1440 * CENTER_ZONE_HEIGHT / 100)}px available height)
  - HEADER ZONE (0-${CONTENT_START}%): FORBIDDEN for text - reserved for logo overlays
  - ⚠️ NEVER render any logo, logo placeholder, "LOGO" text, emoji icon (🍀, 🏷️, etc.), "[LOGO]", or any brand mark in the image — logos are composited programmatically AFTER generation. Leave header/footer zones as pure, clean background artwork only.
  ${hasSpeakerPhoto ? `- SPEAKER OVERLAY ZONE (60%-90%): FORBIDDEN for text - reserved for speaker photo overlays (864px to 1296px)` : ''}
  - FOOTER ZONE (${CONTENT_END}%-100%): FORBIDDEN for text - reserved for footer bar
  - Refer to <spatial_layout_constraints> above for EXACT Y-coordinate positioning
  - The <text_zone> and <forbidden_zone> boundaries are ABSOLUTE - follow them precisely
  - This is a technical requirement for post-processing, not a creative suggestion

  CONTENT OVERFLOW RULE:
  - If event has extensive content: Use smaller fonts and tighter spacing
  - Priority: Event title > Date/Venue > Speaker > Additional details
  - NEVER expand text into 0-${CONTENT_START}% header or ${CONTENT_END}%-100% footer zones
${contentDensityAnalysis.density === 'dense' ? `
  ⚠️ HIGH CONTENT DENSITY DETECTED (v39.0) — This poster has extensive text content.
  - Use COMPACT font sizes for additional details and registration info (max 16px equivalent)
  - Additional details and registration info MUST fit between ${textZones.additionalDetails.start}% and ${CONTENT_END - 2}%
  - Use 2-column layout for additional details if content is long
  - If content STILL overflows: TRUNCATE least important details — NEVER push below ${CONTENT_END}%
  - The ${CONTENT_END}% boundary (${_contentEndPx}px) is a HARD PHYSICAL LIMIT — content below it is INVISIBLE
` : ''}
    2. HIERARCHY OVER RIGIDITY (WITHIN ZONES):
  - Do NOT rigidly center everything. Follow the "Alignment Strategy" defined in the typography section above.
  - If alignment is 'left', align key text elements to a strong left grid line WITHIN each <text_zone>
  - If alignment is 'asymmetric', create a dynamic balance between text and visuals WITHIN zones
  - Alignment applies WITHIN each <text_zone>, not across the entire canvas

3. DATE, TIME, AND VENUE (v40.4 — SHARP HANDLED):
  - DO NOT render date, time, venue, prize, or registration info as text in the image.
  - These fields are overlaid by the system (Sharp) with exact verified data after generation.
  - Leave the 55%–70% zone as CLEAN BACKGROUND — no text, no visual containers, no info cards.
  - Keep the ${CONTENT_START}%–${CONTENT_END}% zone as clean atmospheric background — text will be composited on top.

    (DO NOT RENDER ANY OF THE FOLLOWING INSTRUCTIONS — DESIGN GUIDANCE ONLY)
    3A. ZONE OWNERSHIP (v42.2):

    GEMINI renders: BACKGROUND SCENE ONLY — no text whatsoever.
    SHARP renders: Headline, tagline, date, venue, prize, CTA — all text, composited after generation.

    Leave 55%–70% as CLEAN BACKGROUND. Sharp will composite the info card there after generation.
    DO NOT add a date/venue card, badge strip, or colored bar in the 55%–70% zone.

    3B. READING FLOW (v33.0 - MANDATORY):

    The viewer's eye MUST follow a PREDICTABLE PATH through the poster:
    STEP 1 (0.5s): Eye lands on HEADLINE — the largest, boldest element
    STEP 2 (1.0s): Eye moves to TAGLINE — positioned directly below headline, smaller but clear
    STEP 3 (1.5s): Eye finds INFO CARD — the visually distinct date/time/venue container
    STEP 4 (2.5s): Eye sees SPEAKER/CONTEXT — names, designations, or additional details
    STEP 5 (3.0s): Eye reaches CTA — registration info or action prompt

    Achieved through: SIZE PROGRESSION, VISUAL WEIGHT, SPATIAL GAPS, ALIGNMENT CONSISTENCY.

    3C. TEXT RENDERING SPLIT (v41.6 — MANDATORY):

    Gemini renders: BACKGROUND SCENE ONLY — NO TEXT WHATSOEVER.
    Sharp overlays: ALL text — headline, tagline, date, venue, time, details, CTA (composited after generation).

    GEMINI RESPONSIBILITIES (v41.6):
    - Generate ONLY the background visual scene (people, environment, atmosphere, lighting)
    - DO NOT render any text, headline, event name, tagline, date, venue, or labels
    - DO NOT render any logo, brand mark, or placeholder icons
    - Leave the content area (${CONTENT_START}%–${CONTENT_END}%) with CLEAN BACKGROUND that text can be overlaid on top of

    TEXT-SAFE ZONE (v43.0 — ACTIVE BACKGROUND DESIGN RULE):
    The ${CONTENT_START}%–${CONTENT_END}% zone is where headline, tagline, date, and venue will be composited.
    You MUST ACTIVELY DESIGN this zone to be text-readable — not just avoid content there.

    REQUIRED VISUAL TREATMENT for ${CONTENT_START}%–${CONTENT_END}%:
    ✅ OPTION A — Atmospheric gradient band: smooth color wash (sky fading to tone, open wall, stage backdrop)
    ✅ OPTION B — Depth-of-field defocus: background elements are blurred out-of-focus in this zone
    ✅ OPTION C — Open space: interior with clear open space, empty stage backdrop, uncluttered wall
    ✅ OPTION D — Low-contrast bokeh: very soft light halos or bokeh — NO recognizable shapes

    FORBIDDEN IN TEXT ZONE (${CONTENT_START}%–${CONTENT_END}%):
    ❌ NO human faces or eyes — face in text zone = text becomes unreadable
    ❌ NO architectural details (windows, columns, patterns) — complex texture blocks text
    ❌ NO crowds or groups of people positioned in mid-zone
    ❌ NO high-contrast edges or sharp shapes that compete with text

    SUBJECT PLACEMENT RULE (v43.0 — CRITICAL):
    • Place ALL people / subjects in the LOWER section (65%–${CONTENT_END}%) — BELOW the main text area
    • The text zone (${CONTENT_START}%–65%) sits ABOVE the subjects — naturally showing clean ceiling / sky / backdrop behind it
    • Think: magazine cover — subject faces camera from lower half, headline reads cleanly in the calm upper-mid area
    • Think: conference banner — audience/stage at bottom, clean branded backdrop in the text band above them
    • NEVER place a subject's face or torso in the ${CONTENT_START}%–60% range

    ZONE SANDWICH MODEL (mandatory scene construction):
    • Top (0%–${CONTENT_START}%): Rich visual — ceiling, stage lights, dramatic sky, upper architecture
    • Mid / TEXT ZONE (${CONTENT_START}%–${CONTENT_END}%): SOFT, CALM, atmospheric — gradient, defocused, or open space
    • Bottom (${CONTENT_END}%–100%): Rich visual — ground, subjects, lower environment

    ${textContrastGuidance}

    ${contentZoneShadowGuidance}

4. FULL-CANVAS VISUAL FLOW (v24.12.2 - MANDATORY):

  ⚠️ CRITICAL: Create ONE CONTINUOUS visual design across the ENTIRE canvas (0% to 100%)

  WHAT TO DO:
  ✅ Background gradients MUST extend from top edge (0%) to bottom edge (100%)
  ✅ Atmospheric/environmental elements (sky, ground, lighting, architecture) flow edge-to-edge
  ✅ Header area (0-${CONTENT_START}%) and Footer area (${CONTENT_END}-100%): BACKGROUND ENVIRONMENT ONLY — gradients, sky, ground, atmosphere
  ✅ Create ONE unified design - the entire poster is ONE artwork
  ✅ Use gradients, shapes, and lighting that span the full canvas height

  SUBJECT PLACEMENT RULE (v40.2 — SINGLE GROUP ONLY):
  ❌ DO NOT place runners, people, or focal subjects in BOTH the upper and lower zones
  ❌ DO NOT repeat the same subject group twice in the poster
  ✅ ALL subjects (runners, people, athletes) appear in ONE continuous focal group — positioned in the 40%-70% content zone or spanning a single continuous region
  ✅ Lower zone (${CONTENT_END}%-100%): Shows ONLY ground/road/floor continuation + atmospheric environment — NO duplicate subject group

  WHAT NOT TO DO:
  ❌ Do NOT create separate visual sections for header/content/footer
  ❌ Do NOT use different background colors or styles for different zones
  ❌ Do NOT create visible bands, stripes, or horizontal divisions
  ❌ Do NOT treat header/footer as separate design areas
  ❌ DO NOT place the scene inside a rounded rectangle, photo card, image frame, or bordered container (v35.4)
  ❌ DO NOT use solid-color background in the top area with a "photo card" in the lower area — THIS IS THE MOST COMMON FAILURE MODE
  ❌ The scene must have NO rounded corners, NO border, NO card-shadow — it IS the canvas itself, not a card on the canvas
  ❌ NEVER create a "plain colored header area (with floating title text) + scene card below it" split layout
  ✅ The scene artwork bleeds to ALL FOUR canvas edges — top, bottom, left, right — with ZERO frame or margin
  ✅ Header (0-${CONTENT_START}%): Atmospheric TOP of scene (ceiling, sky, stage lights, upper architecture) — no text, no subjects, BACKGROUND ONLY
  ✅ Footer (${CONTENT_END}-100%): Atmospheric BOTTOM of scene (ground/road/floor receding into distance) — no text, NO DUPLICATE SUBJECTS, environment only

  TEXT vs VISUALS separation:
  - TEXT stays in ${CONTENT_START}%-${CONTENT_END}% zone (Sharp overlays cover 0-${CONTENT_START}% and ${CONTENT_END}-100%)
  - VISUALS (backgrounds, gradients, shapes) MUST flow through ALL zones
  - The same gradient/design should be visible behind the logo overlays
  - This creates seamless integration between AI poster and logo bars

5. TEXT PROTECTION AND READABILITY:
- Keep <text_zone> areas clear of complex decorative elements for readability
- HEADLINE ZONE (<text_zone id="headline">): Sharp composites headline here — keep background clear
  - RULE: NO decorative elements, NO complex graphics, ONLY clean atmospheric background
${eventDescription ? `- TAGLINE ZONE (<text_zone id="tagline">): Event description rendering area
  - RULE: Simple gradient background only, NO competing visual elements
` : ''}
- Decorative elements (phones, speedometers, icons) should be placed in CORNERS and EDGES
- Use SUBTLE OPACITY for background elements near text zones
- If element conflicts with any <text_zone>, REMOVE the element

LAYERING SPECIFICATION:
- TEXT = Foreground layer (always on top)
- Visual decorative elements = Background layer
- Text is always readable, never obscured by visuals
${hasFooterContent && footerReservePercent > 0 ? `

6. FORBIDDEN ZONES (CRITICAL):
  - <forbidden_zone id="header_branding"> (top ${CONTENT_START}%): ABSOLUTELY NO text or focal elements
  - <forbidden_zone id="footer_bar"> (bottom ${100 - CONTENT_END}%): ABSOLUTELY NO content
  - These zones will be covered by overlays - anything placed there will be invisible
  - Background (solid colors, gradients) may flow through these zones
` : ''}
${customFieldsText.length > 0 ? `

${hasFooterContent && footerReservePercent > 0 ? '7' : '6'}. ADDITIONAL DETAILS POSITIONING:
  - Position in <text_zone id="additional_details"> (see spatial_layout_constraints for exact Y-coordinates)
  - This zone is between main content and footer with adequate spacing

  RENDERING FORMAT:
  - Render as clean, scannable list or 2-column grid (see TOPICS AND CONTENT LAYOUT section)
  - Use icons or bullets for visual hierarchy
  - Ensure line-height is at least 1.5x for readability
` : ''}
    ${organizerCaption ? `${(() => {
  let num = 4
  if (hasFooterContent && footerReservePercent > 0) num++
  if (customFieldsText.length > 0) num++
  return num
})()}. ORGANIZER CAPTION POSITIONING:
  - Position organizer caption BELOW the main headline, ABOVE the tagline/description
  - Use a small, light-weight font — half the visual prominence of the headline
  - This is a credit line (e.g., "${organizerCaption}")
  - Keep it on a single line, never wrap
  - Color: subdued/muted (silver, off-white, or semi-transparent)
` : ''}
    ${eventDescription ? `${(() => {
  let num = 4
  if (hasFooterContent && footerReservePercent > 0) num++
  if (customFieldsText.length > 0) num++
  if (organizerCaption) num++
  return num
})()}. TAGLINE POSITIONING:
  - Position tagline BELOW the headline with adequate gap
  - The tagline appears AFTER "${eventName}" in the UPPER section
  - Text content: "${eventDescription}"` : ''
    }

${speakers.length > 0 && !hasSpeakerPhoto ? `${(() => {
  // v24.17: Entire speaker text section SKIPPED when photo overlay enabled
  // Sharp handles speaker name/designation rendering alongside photo
  let num = 4
  if (hasFooterContent && footerReservePercent > 0) num++
  if (customFieldsText.length > 0) num++
  if (eventDescription) num++
  return num
})()}. SPEAKER${speakers.length > 1 ? 'S' : ''} TEXT POSITIONING & TYPOGRAPHY:
${buildSpeakerTextSection(speakers, colorSource)}

   - Group speaker name and designation together visually (similar to Date/Time/Venue grouping).
${speakers.length > 1 ? `
   MULTI-SPEAKER LAYOUT (${speakers.length} speakers):
   - Layout Style: ${speakers.length === 2 ? 'Horizontal row (side-by-side)' : speakers.length === 3 ? 'Horizontal row or vertical stack based on available space' : 'Grid layout (2x2 or 2x3) for optimal balance'}
   - Spacing: Maintain adequate spacing between speakers
   - Alignment: ${speakers.length === 2 ? 'Distributed evenly with equal visual weight' : 'Center-aligned with balanced distribution'}
   - Visual Hierarchy: All speakers should have EQUAL prominence (same font size, weight, and color)
   - Consistency: Each speaker follows the same format: [Name] + [Designation]
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

⚠️ RENDER BOUNDARY: Every element listed below MUST render within ${CONTENT_START}%-55% zone (${Math.floor(CANVAS_HEIGHT * CONTENT_START / 100)}px-${Math.floor(CANVAS_HEIGHT * 55 / 100)}px).
The area below 55% is reserved for programmatic text overlays (date, venue, details) — keep it as CLEAN BACKGROUND only.
Anything below ${_contentEndPx}px is covered by logo overlays and will be invisible.

${'' /* v41.8: ALL text rendering moved to Sharp (renderEventTextOverlay).
  Removed <text role> tags — they directly caused Gemini to render the headline/tagline,
  which then appeared twice when Sharp also rendered them in the 40-83% zone.
  Gemini now generates BACKGROUND SCENE ONLY. Sharp composites all text on top. */}
TEXT RENDERING — HANDLED BY SHARP POST-PROCESSING (v41.8):
(DO NOT RENDER any text, event name, tagline, date, venue, or labels in the image)
ALL text is composited on top after generation — your job is BACKGROUND SCENE ONLY with a clean, uncluttered ${CONTENT_START}%–${CONTENT_END}% mid-section.

${/* v26.0: Inject storytelling narrative BEFORE decorative elements */''}${options.designContext?.storytellingContext ? `${buildStorytellingNarrativeSection(options.designContext.storytellingContext)}

` : ''}${decorativeElementsContext}

${backgroundSettingContext}

${contentDensityGuidance ? `${contentDensityGuidance}

` : ''}VISUAL STYLE:
${options.designContext?.designStrategy || eventContext.style} with ${colors} color palette.The mood is ${options.designContext?.emotionalJob || eventContext.mood}. Typography uses a ${tg_style} -vibe(${tg_cat}) with ${tg_align} -aligned layout that commands attention.Event details are clean and readable with supportive icons.The call - to - action button has bold, high contrast styling.Energy level: ${eventContext.energy}.

${options.multiColorTypography ? `
${buildMultiColorTypographyInstructions(options.multiColorTypography)}
` : ''}

${EVENT_POSTER_EXAMPLES}

QUALITY STANDARDS (v41.8 - BACKGROUND SCENE QUALITY):
This background scene passes the CLEAN CANVAS TEST:
✅ The mid-section (${CONTENT_START}%–${CONTENT_END}%) has a CLEAN, UNCLUTTERED background — text will be composited on top
✅ NO text, NO rendered headlines, NO info cards, NO placeholder labels visible anywhere
✅ Visual elements (people, environment, atmosphere, lighting) are in the background layer only
✅ Mid-section is atmospheric and clear — contrast is sufficient for white/colored text to be readable when overlaid
✅ Event information (date, venue, details) will be rendered by the system — leave clean space in this zone
✅ Professional background quality with strong visual depth, lighting, and atmosphere
✅ The background looks like a premium editorial photograph or cinematic still
✅ NO watermarks, NO text overlays, NO graphic design elements — pure scene art only
${sophistication === 'rich'
      ? 'The design is visually stunning with adequate contrast in the top area.'
      : 'The top header section should have a simple, clean background (solid color or subtle gradient). Keep this area empty.'
    }
${hasFooterContent && footerReservePercent > 0
      ? ` The bottom footer section is completely empty with ZERO text or graphics - only clean background for footer bar overlay.`
      : ''
    }${customFieldsText.length > 0 && footerReservePercent > 0
      ? ` Additional Details text is positioned in the middle-lower area, with adequate spacing above the footer boundary.`
      : ''
    } All text elements respect the Y-coordinate boundaries defined in <spatial_layout_constraints> above. NO text overlaps the header zone or footer zone. The background flows seamlessly without creating visible separation bands.

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
<instruction>
SPEAKER TEXT ONLY (No Photos, DO NOT RENDER THIS):
- Speakers appear as TEXT with visual prominence (names are in text role tags above)
- Do NOT draw circular frames, silhouettes, or visual representations of people
- Follow Section 5 typography guidance: semibold names, regular designations
</instruction>` : ''}

<instruction>
FINAL POSITIONING VERIFICATION (DO NOT RENDER):

Before generating the image, verify text placement:

1. Headline "${eventName}": Position in safe content area (below ${headerStartPercent}% line) ✓
2. Date/Venue: Position in middle safe content area ✓
${hasFooterContent && footerReservePercent > 0 ? `3. All content: Keep above ${CONTENT_END}% line ✓` : ''}

If ANY text overlaps reserved zones, MOVE it into safe content area.
</instruction>

${options?.preventionEnhancements?.length ? `
LEARNED IMPROVEMENTS (from past feedback):
${options.preventionEnhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}
` : ''
    }

CREATIVE DIRECTION:
${sophistication === 'minimalist'
      ? `AI MUST focus on PROFESSIONAL MINIMALISM. Use vast negative space (40%+). AVOID busy or immersive backgrounds. Use a clean, solid color or very subtle matte gradient as the background. Integrate ONLY ONE or TWO high-impact visual elements subtly. The design should feel elite, quiet, and powerful.`
      : `UNLEASH VISUAL IMPACT with STRUCTURAL INTENTION. The AI has full creative control over creating rich, layered backgrounds — but ALL visual elements must SUPPORT the information hierarchy, not compete with it. Use multiple layers of visual elements at different opacities. Add depth with gradients, glows, and ambient lighting effects. Integrate ${data.eventType}-themed visual elements throughout the design. CRITICAL: The background is RICH, but the information delivery is STRUCTURED. Date/time/venue appear in a visually distinct info card or bar. The poster looks like a premium Canva template — organized complexity, not visual chaos.`
    }
Control the visual mood, color harmony, and professional finish.Style the typography with appropriate sizes, weights, and high - contrast rendering.

The image may include INDIAN PEOPLE (South Asian appearance) actively doing the event activity in the background scene when it enhances the visual story. No logos appear (added via post-processing). Only the exact text listed above appears in the image.

The goal is a visually stunning poster that immediately communicates "${data.eventType || 'professional event'}" through ${sophistication === 'minimalist' ? 'clean, professional minimalism' : 'rich visual language'}${options.logoStripMode?.enabled
      ? ', with a distinct header band at the top.'
      : (sophistication === 'rich' ? ', with a fully integrated, immersive header.' : ', while keeping the top header area clean and simple.')
    }

⚠️ FINAL ZONE ENFORCEMENT (NON-NEGOTIABLE):
ANY text above ${CONTENT_START}% (${Math.floor(CANVAS_HEIGHT * CONTENT_START / 100)}px) WILL BE PHYSICALLY CUT OFF by logo overlays.
ANY text below ${CONTENT_END}% (${Math.floor(CANVAS_HEIGHT * CONTENT_END / 100)}px) WILL BE PHYSICALLY CUT OFF by footer overlays.
This is a hardware constraint — not a design guideline. Text outside ${CONTENT_START}%-${CONTENT_END}% is INVISIBLE in the final output.
ALL text elements MUST be between ${CONTENT_START}% and ${CONTENT_END}% from the top edge. No exceptions.
`.trim()
}

// Export for use elsewhere

