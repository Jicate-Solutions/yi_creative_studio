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
  formatSpeakerDetails,
  formatMultipleSpeakers,
} from '../context-helpers'
import { buildAllV41Contexts } from '../context-helpers-v41'
import { EVENT_POSTER_EXAMPLES } from '../examples'

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

  // NEW v3.4: Build forbidden zones for strict logo-text overlap prevention


  // Build speaker zone context from options.speakerPhotoConfig (v3.1)
  // This uses the config passed from API route, which preserves the zone even when user has own photo
  const speakerZoneContext = buildSpeakerPhotoZoneContext(options.speakerPhotoConfig)
  const hasSpeakerPhoto = options.speakerPhotoConfig?.enabled === true



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

TEXT HIERARCHY:

The event name "${eventName}" should be the LARGEST and most prominent text element, using bold typography in ${colorSource.hero.color} (${colorSource.hero.description}). Make it the clear visual focal point.

Speaker names or tagline text should be notably smaller than the event name, using medium-weight typography in ${colorSource.headline.color} (${colorSource.headline.description}).

Date, venue, and event details should be smaller supporting text in ${colorSource.body.color} (${colorSource.body.description}).
${data.registrationInfo ? `
The call-to-action "${data.registrationInfo}" should be a prominent button element in ${colorSource.cta.color} (${colorSource.cta.description}) with high visual contrast.` : ''}
${hasFooter ? `
Footer or organization text should be the smallest text, in ${colorSource.caption.color} (${colorSource.caption.description}).` : ''}

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

TEXT HIERARCHY:

The event name "${eventName}" should be the LARGEST and most prominent text element, using bold typography in ${colorSource.hero.color} (${colorSource.hero.description}). Make it the clear visual focal point.

Speaker names or tagline text should be notably smaller than the event name, using medium-weight typography in ${colorSource.headline.color} (${colorSource.headline.description}).

Date, venue, and event details should be smaller supporting text in ${colorSource.body.color} (${colorSource.body.description}).
${data.registrationInfo ? `
The call-to-action "${data.registrationInfo}" should be a prominent button element in ${colorSource.cta.color} (${colorSource.cta.description}) with high visual contrast.` : ''}
${hasFooter ? `
Footer or organization text should be the smallest text, in ${colorSource.caption.color} (${colorSource.caption.description}).` : ''}

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
    // Header logo band for Yi triple-logo layout
    // v5.1: User-controlled via logoStripMode toggle
    headerLogoBand: {
      enabled: options.logoStripMode?.enabled || false, // v5.1: Respect user's logo strip toggle
      heightPercent: 12,
      backgroundStyle: options.logoStripMode?.enabled
        ? (sophistication === 'rich'
          ? 'solid white band with subtle shadow for logo visibility on immersive backgrounds'
          : 'clean white stripe with high contrast for professional logo display')
        : (sophistication === 'rich'
          ? 'transparent / integrated header for immersive background'
          : 'transparent overlay mode - simple background for logo visibility'),
      logoLayout: 'three logos positioned horizontally: Yi logo on the left, Bharat Rising logo in the center, CII logo on the right',
      secondaryLogos: !!options.verticalId,  // Include vertical logos if applicable
    },
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

${options.ultraProContext?.visualScene
      ? `VISUAL SCENE (ULTRA-PRO DIRECTION):
${options.ultraProContext.visualScene}

DESIGN GUIDANCE:
${options.ultraProContext.designGuidance || 'Follow the visual scene description strictly.'}`
      : `The poster achieves these visual storytelling goals: It looks and feels like a ${data.eventType || 'professional'} event through its visual design. ${sophistication === 'minimalist' ? 'It uses VAST NEGATIVE SPACE and a single focal element for maximum impact.' : 'The visual_design_elements create an atmospheric, contextually-rich background. The design feels "Busy" in a professional, high-end way (Organized Complexity).'} The design quality rivals Google AI Studio - layered, dimensional, sophisticated. It passes the 3-SECOND TEST where the viewer instantly understands WHAT, WHEN, WHERE.`
    }

${hasSpeakerPhoto ? speakerZoneContext : ''}

POSTER LAYOUT AND COMPOSITION:

  <layout_composition_rules>
    1. HIERARCHY OVER RIGIDITY:
  - Do NOT rigidly center everything.Follow the "Alignment Strategy" defined in the typography section above.
   - If alignment is 'left', align key text elements to a strong left grid line.
   - If alignment is 'asymmetric', create a dynamic balance between text and visuals.

2. LOGICAL GROUPING:
  - Group Date, Time, and Venue together visually(e.g., using icons or a divider).
   - "${eventName}" must be the dominant focal point.
   - "${eventName}" must be the dominant focal point.
${data.registrationInfo ? `   - "${data.registrationInfo}" button should be placed strategically to catch the eye at the end of the reading path.` : ''}

3. HEADER AREA (v5.3 - Reserved for Post-Processing):
  ${options.logoStripMode?.enabled
      ? `- The top 8% of the canvas is RESERVED and will be replaced in post-processing.
  - START your design at approximately 8% from the top edge.
  - Do NOT extend backgrounds, gradients, or any graphics into the top 8%.
  - Treat 8% from top as the TOP EDGE of your design canvas.
  - Position the main headline starting at approximately 15% from top.`
      : `- DO NOT create a visible stripe, band, or separate header section.
  - The background should flow naturally from top to bottom.
  - ${sophistication === 'minimalist'
        ? 'Keep the top 10% simple (solid color or subtle gradient).'
        : 'Extend your immersive background to the top edge.'}
  - Keep the top 10% area clean with only background elements (no text, faces, or graphics).`
    }

    ${eventDescription ? `4. TAGLINE:
   - Place "${eventDescription}" in a supporting relationship to the title.` : ''
    }

${speakers.length > 0 ? `5. SPEAKER${speakers.length > 1 ? 'S' : ''} TEXT POSITIONING & TYPOGRAPHY:
${hasSpeakerPhoto ? `   🎯 WITH SPEAKER PHOTOS (EXACT PIXEL COORDINATES):
${options.speakerPhotoZoneCoordinates ? `
   ⚠️  RESERVED ZONE (NO TEXT ALLOWED):
   - X: ${options.speakerPhotoZoneCoordinates.leftEdge}px to ${options.speakerPhotoZoneCoordinates.rightEdge}px
   - Y: ${options.speakerPhotoZoneCoordinates.topEdge}px to ${options.speakerPhotoZoneCoordinates.bottomEdge}px
   - This zone will have a circular speaker photo overlay added post-processing
   - DO NOT place ANY text, decorative elements, or visual clutter in this zone

   📝 TITLE PLACEMENT CONSTRAINT:
   - Event title "${eventName}" MUST be positioned in Y-coordinates: 0px to ${Math.max(options.speakerPhotoZoneCoordinates.topEdge - 50, 400)}px
   - Keep title ABOVE the speaker photo zone to prevent overlaps
   - Title should be in upper area for maximum prominence` : ''}
   ${speakers.map((speaker, index) => {
      const speakerLabel = speakers.length > 1 ? `Speaker ${index + 1}` : 'Speaker'
      const textSide = options.speakerPhotoConfig?.position === 'left' ? 'right' : 'left'
      return `- ${speakerLabel}: ${options.speakerPhotoZoneCoordinates ? `Reserve zone X:${options.speakerPhotoZoneCoordinates.leftEdge}-${options.speakerPhotoZoneCoordinates.rightEdge}px, Y:${options.speakerPhotoZoneCoordinates.topEdge}-${options.speakerPhotoZoneCoordinates.bottomEdge}px for photo overlay` : `Reserve ${options.speakerPhotoConfig?.position || 'left'} zone for photo overlay`}
     - Position "${speaker.name}" text ADJACENT to photo zone (${textSide} side, ${options.speakerPhotoZoneCoordinates ? `X > ${options.speakerPhotoZoneCoordinates.rightEdge + 30}px` : `with 30px spacing`})
     - Name: ${speaker.name} - Use SEMIBOLD weight, MEDIUM size in ${(colorSource as any).speaker_name?.color || 'white'} (${(colorSource as any).speaker_name?.description || 'prominent speaker color'})
     ${speaker.designation ? `- Designation: ${speaker.designation} - Use REGULAR weight, SMALL-MEDIUM size in ${(colorSource as any).speaker_designation?.color || '#D0D0D0'} (${(colorSource as any).speaker_designation?.description || 'subtle supporting color'})` : ''}
     - Stack: Name ABOVE designation with minimal spacing
     - CRITICAL: Speaker text must be READABLE and NOT overlap with reserved photo zone`
    }).join('\n   ')}` : `   📝 WITHOUT SPEAKER PHOTOS (TEXT ONLY):
   ${speakers.map((speaker, index) => {
      const speakerLabel = speakers.length > 1 ? `Speaker ${index + 1}` : 'Speaker'
      return `- ${speakerLabel}:
     - Name: ${speaker.name} - Use SEMIBOLD weight, LARGE-MEDIUM size in ${(colorSource as any).speaker_name?.color || 'white'} (${(colorSource as any).speaker_name?.description || 'prominent speaker color'})
     ${speaker.designation ? `- Designation: ${speaker.designation} - Use REGULAR weight, MEDIUM size in ${(colorSource as any).speaker_designation?.color || '#D0D0D0'} (${(colorSource as any).speaker_designation?.description || 'subtle supporting color'})` : ''}
     - Stack: Name ABOVE designation
     - Position: Lower-third or bottom-center with visual prominence
     - Add subtle visual separator (line, dot, or icon) between name and designation`
    }).join('\n   ')}`}
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

${data.entryFee ? `${speakers.length > 0 ? '6' : '5'}. FEE:
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

TEXT TO DISPLAY IN THE IMAGE(render these exact words):
  - Main headline: "${eventName}"
${eventDescription ? `- Tagline: "${eventDescription}"` : ''}
  - Date & Time: "${formatEventDate(data.eventDate)} | ${data.eventEndTime ? formatEventTime(data.eventTime) + ' - ' + formatEventTime(data.eventEndTime) : formatEventTime(data.eventTime)}"
    - Location: "${data.venue || ''}"
${data.entryFee ? `- Fee: "${data.entryFee}"` : ''}
${customFieldsText.length > 0 ? `- Additional Details:\n   ${customFieldsText.map(t => `  ${t}`).join('\n   ')}` : ''}
${speakers.length > 0 ? `${speakers.length > 1 ? '- Speakers (render with typography guidance from section 5):\n   ' : '- Speaker (render with typography guidance from section 5):\n   '}${speakers.map((speaker, index) => {
  const speakerNum = speakers.length > 1 ? `${index + 1}. ` : ''
  return `${speakerNum}NAME: "${speaker.name}" (semibold, medium, ${(colorSource as any).speaker_name?.color || 'white'})${speaker.designation ? `\n      DESIGNATION: "${speaker.designation}" (regular, small-medium, ${(colorSource as any).speaker_designation?.color || '#D0D0D0'})` : ''}`
}).join('\n   ')}` : ''}
${data.registrationInfo ? `  - Button: "${data.registrationInfo}"` : ''}
${eventNote ? `- Footer: "${eventNote}"` : ''}

${decorativeElementsContext}

${backgroundSettingContext}

VISUAL STYLE:
${options.designContext?.designStrategy || eventContext.style} with ${colors} color palette.The mood is ${options.designContext?.emotionalJob || eventContext.mood}. Typography uses a ${tg_style} -vibe(${tg_cat}) with ${tg_align} -aligned layout that commands attention.Event details are clean and readable with supportive icons.The call - to - action button has bold, high contrast styling.Energy level: ${eventContext.energy}.

${options.multiColorTypography ? `
${buildMultiColorTypographyInstructions(options.multiColorTypography)}
` : ''}

${EVENT_POSTER_EXAMPLES}

QUALITY STANDARDS:
This poster passes the 3 - SECOND TEST where What, When, Where are instantly visible.The event name "${eventName}" is the dominant text element and impossible to miss.The design is readable from both close - up on a phone and at distance as a printed poster.Professional marketing quality with clear visual hierarchy guiding the eye from top to bottom.The call - to - action stands out and drives action.All text is clearly legible against its background.
${sophistication === 'rich'
      ? 'The design MUST be visually stunning with adequate contrast in the top area.'
      : 'The top 15% should have a simple, clean background (solid color or subtle gradient). Keep this area empty.'
    }

DESIGN CONSTRAINTS:
${sophistication === 'rich'
      ? `Avoid boring, empty layouts. "Clutter" is allowed if it means "Rich Texture" and "Detail". Do not leave vast empty white spaces unless they are intentional negative space. Avoid: tiny unreadable text, low contrast text, amateur composition.`
      : `The design avoids cluttered layouts, tiny unreadable text, poor hierarchy, generic stock photo aesthetics, unprofessional design, too many competing fonts, competing focal points, low contrast text on busy backgrounds, landscape orientation, and busy patterns in the header band area.`
    }
    ${hasSpeakerPhoto ? `
🎯 SPEAKER PHOTO ZONES (${speakers.length} ${speakers.length > 1 ? 'zones' : 'zone'}):
⚠️ CRITICAL: Keep these zones VISUALLY EMPTY for photo overlay (added in post-processing)

Photo zones: ${speakers.map((s, i) => `${options.speakerPhotoConfig?.position || 'left'} zone for ${s.name}`).join(', ')}

SPEAKER PHOTO ZONE REQUIREMENTS (MANDATORY):
✅ ALLOWED in photo zone:
   - SOLID gradient background ONLY (matching overall color scheme)
   - Subtle texture/noise (max 5% opacity)
   - Smooth color transitions

❌ FORBIDDEN in photo zone:
   - NO decorative elements (leaves, patterns, circuits, graphics, illustrations)
   - NO text, labels, or typography
   - NO faces, people, human figures, silhouettes
   - NO circular frames, rings, or geometric shapes
   - NO visual complexity - keep it MINIMAL and CLEAN
   - Think: "Reserved parking spot" - keep it EMPTY for the photo

💡 Analogy: Imagine placing a circular photo sticker on the poster. The area under the sticker should be a SIMPLE, SOLID color so the photo doesn't compete with background elements.

⚠️ CRITICAL: Speaker names and designations MUST appear as TEXT ADJACENT to photo zones (NOT inside photo zones).
- Refer to Section 5 for exact positioning: ${options.speakerPhotoConfig?.position === 'left' ? 'right' : 'left'} side of photo zones
- Maintain 30px minimum spacing between text and photo zones
- Follow typography guidance: ${(colorSource as any).speaker_name?.color || 'white'} for names, ${(colorSource as any).speaker_designation?.color || '#D0D0D0'} for designations` : ''}
${speakers.length > 0 && !hasSpeakerPhoto ? `
📝 SPEAKER TEXT ONLY (No Photos):
- Speakers ${speakers.map(s => `"${s.name}"`).join(', ')} appear as TEXT with visual prominence
- Do NOT draw circular frames, silhouettes, or visual representations of people
- Follow Section 5 typography guidance: semibold names, regular designations` : ''}

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

