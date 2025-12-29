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

// ============================================================
// EVENT CONTEXTS
// ============================================================

function getEventContext(eventType: string = 'general'): EventContext {
  const contexts: Record<string, EventContext> = {
    conference: {
      background: 'Sleek corporate background with abstract blue geometric shapes, subtle light effects, professional atmosphere',
      style: 'Corporate professional, modern business event',
      colors: 'Deep blue (#003366), white, gold accent for CTA',
      mood: 'Professional, authoritative, networking-focused',
      energy: 'Professional, polished',
      headlineFont: 'sans-serif',
      colorPalette: {
        hero: {
          color: 'white',
          contrast: 'gold',
          description: 'High contrast white for maximum impact on dark blue background - must stand out as the most prominent text',
        },
        headline: {
          color: 'white',
          contrast: 'light blue (#4A90E2)',
          description: 'Crisp white for professional clarity - slightly less prominent than hero but still highly visible',
        },
        body: {
          color: 'light gray (#E0E0E0)',
          contrast: 'white',
          description: 'Softer light gray for supportive information - readable but not competing with headlines',
        },
        cta: {
          color: 'gold (#D4AF37)',
          contrast: 'navy (#003366)',
          description: 'Bold gold button with navy text for action - highest contrast element after hero, demands attention',
        },
        caption: {
          color: 'muted gray (#999999)',
          contrast: 'white',
          description: 'Subtle gray for organizational footer - visible but understated',
        },
      },
      headlineColor: 'white on dark blue',
      ctaColor: 'gold/yellow',
      ctaStyle: 'contrasting yellow/gold button',
      defaultAudience: 'Business professionals, industry experts',
    },
    workshop: {
      background: 'Warm, inviting gradient background (orange to coral or brand colors) suggesting collaboration and learning',
      style: 'Friendly professional, educational, approachable',
      colors: 'Blue (#0066cc), orange (#ff6600), white',
      mood: 'Educational, interactive, welcoming, hands-on',
      energy: 'Warm, inviting',
      headlineFont: 'sans-serif',
      colorPalette: getDefaultPalette('blue', 'white', 'orange'),
      headlineColor: 'dark on light OR white on vibrant',
      ctaColor: 'contrasting accent',
      ctaStyle: 'prominent contrasting button',
      defaultAudience: 'Learners, professionals seeking skills',
    },
    health_camp: {
      background: 'Fresh, clean gradient with soft green and white, soft medical wellness symbols',
      style: 'Healthcare appropriate, clean, trustworthy',
      colors: 'Fresh green (#28a745), white, soft blue accent',
      mood: 'Caring, professional, health-focused, welcoming',
      energy: 'Calm, reassuring',
      headlineFont: 'sans-serif',
      colorPalette: getDefaultPalette('green', 'white', 'blue'),
      headlineColor: 'dark green on white OR white on green',
      ctaColor: 'blue or green',
      ctaStyle: 'clear, trustworthy button',
      defaultAudience: 'Community members, health-conscious individuals',
    },
    concert: {
      background: 'Dynamic background with stage lights, energetic concert atmosphere',
      style: 'Entertainment, high-energy, exciting',
      colors: 'Purple (#8b00ff), electric blue (#00d4ff), pink, neon accents',
      mood: 'Exciting, energetic, entertainment',
      energy: 'High energy, electric',
      headlineFont: 'bold display sans-serif',
      colorPalette: getDefaultPalette('purple', 'pink', 'neon cyan'),
      headlineColor: 'bright/neon on dark',
      ctaColor: 'neon accent',
      ctaStyle: 'bold neon button',
      defaultAudience: 'Music lovers, entertainment seekers',
    },
    community: {
      background: 'Warm welcoming background, warm earth tones, inclusive atmosphere',
      style: 'Warm, inclusive, community-focused',
      colors: 'Warm orange (#ff8c00), yellow (#ffd700), earth tones',
      mood: 'Welcoming, inclusive, community spirit',
      energy: 'Warm, inviting',
      headlineFont: 'friendly sans-serif',
      colorPalette: getDefaultPalette('orange', 'yellow', 'dark brown'),
      headlineColor: 'dark on warm',
      ctaColor: 'warm accent',
      ctaStyle: 'friendly, welcoming button',
      defaultAudience: 'Community members, families, neighbors',
    },
    tech: {
      background: 'Futuristic background with circuit patterns, modern tech aesthetic',
      style: 'Modern tech, innovative, cutting-edge',
      colors: 'Electric blue (#00d4ff), purple (#7b68ee), dark background',
      mood: 'Innovative, technical, forward-thinking, exciting',
      energy: 'Dynamic, innovative',
      headlineFont: 'modern sans-serif',
      colorPalette: getDefaultPalette('dark blue', 'purple', 'neon cyan'),
      headlineColor: 'bright on dark',
      ctaColor: 'electric accent',
      ctaStyle: 'tech-styled button',
      defaultAudience: 'Tech professionals, developers, innovators',
    },
    sports: {
      background: 'Dynamic energetic background with motion blur effects, athletic energy',
      style: 'Dynamic, athletic, high-energy',
      colors: 'Bold red (#dc3545), black, white, energetic accents',
      mood: 'Competitive, energetic, athletic',
      energy: 'High energy, athletic',
      headlineFont: 'bold impact sans-serif',
      colorPalette: getDefaultPalette('black', 'white', 'red'),
      headlineColor: 'white or bold on dynamic',
      ctaColor: 'red or high-energy',
      ctaStyle: 'bold action button',
      defaultAudience: 'Athletes, sports enthusiasts, competitors',
    },
    children: {
      background: 'Playful colorful background, bright and cheerful',
      style: 'Playful, safe, family-friendly',
      colors: 'Primary colors (red, blue, yellow), pastels',
      mood: 'Fun, safe, engaging for families',
      energy: 'Playful, joyful',
      headlineFont: 'friendly rounded sans-serif',
      colorPalette: getDefaultPalette('white', 'pastels', 'bright blue'),
      headlineColor: 'colorful on light',
      ctaColor: 'bright primary',
      ctaStyle: 'fun, friendly button',
      defaultAudience: 'Families, parents, children',
    },
    seminar: {
      background: 'Professional academic setting with subtle geometric patterns',
      style: 'Academic professional, intellectual',
      colors: 'Navy blue (#1e3a5f), burgundy (#722f37), white, gold accent',
      mood: 'Intellectual, prestigious, knowledge-focused',
      energy: 'Focused, professional',
      headlineFont: 'sans-serif',
      colorPalette: getDefaultPalette('navy', 'white', 'gold'),
      headlineColor: 'dark on light',
      ctaColor: 'blue or burgundy',
      ctaStyle: 'professional button',
      defaultAudience: 'Academics, professionals, thought leaders',
    },
    cultural: {
      background: 'Rich cultural patterns, traditional motifs, vibrant heritage elements',
      style: 'Cultural celebration, traditional modern fusion',
      colors: 'Rich red, gold, orange, traditional palette',
      mood: 'Celebratory, cultural pride, heritage',
      energy: 'Festive, celebratory',
      headlineFont: 'decorative or bold sans-serif',
      colorPalette: getDefaultPalette('rich red', 'gold', 'orange'),
      headlineColor: 'gold on rich colors',
      ctaColor: 'gold or contrasting',
      ctaStyle: 'festive button',
      defaultAudience: 'Culture enthusiasts, community members',
    },
  }

  return contexts[eventType] || {
    background: 'Modern gradient background, professional and engaging',
    style: 'Professional, modern, attention-grabbing',
    colors: 'Vibrant, professional, brand-appropriate',
    mood: 'Professional, engaging, promotional',
    energy: 'Balanced, professional',
    headlineFont: 'sans-serif',
    colorPalette: getDefaultPalette('blue', 'white', 'orange'),
    headlineColor: 'high contrast',
    ctaColor: 'accent',
    ctaStyle: 'prominent button',
    defaultAudience: 'General audience',
  }
}

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

  const eventContext = getEventContext(data.eventType)

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

  // NEW v3.2: Build decorative elements section from Design Intelligence context
  // v4.0: Now sophistication-aware
  const decorativeElementsContext = buildDecorativeElementsSection({
    eventType: data.eventType || 'general',
    designContext: options.designContext,
    // FIX: Significantly increased limits for rich designs to fix "limited decorative elements" issue
    maxElements: sophistication === 'minimalist' ? 3 : (sophistication === 'rich' ? 8 : 5),
    includeIconicImagery: true,
    sophistication,
  })
  const backgroundSettingContext = buildBackgroundSettingSection(options.designContext, sophistication)

  // NEW v3.4: Build AI-enhanced typography and decorative sections
  // NEW v3.9: Color-aware typography with role-based color specifications
  let aiTypographySection = ''
  {
    if (options.brandContext?.useBrandFont !== false) {
      aiTypographySection = '' // Skip

      // NEW v3.9: Determine color source
      // PRIORITY 1: Brand Colors (if enforced)
      // PRIORITY 2: Design Intelligence AI-generated colors
      // PRIORITY 3: Hardcoded Event Context defaults
      let colorSource: any

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

      // DEFAULT TO BRAND COLORS IF AVAILABLE (Highest Priority)
      if (options.brandContext?.useBrandColors && options.brandContext.primaryColor) {
        // Manual override using Brand Colors
        colorSource = {
          hero: { color: options.brandContext.primaryColor, description: 'Brand Primary Color (Mandatory)' },
          headline: { color: options.brandContext.secondaryColor || 'white', description: 'Brand Secondary Color' },
          body: { color: 'white', description: 'High contrast white for readability' },
          cta: { color: options.brandContext.accentColor || options.brandContext.secondaryColor || 'white', description: 'Brand Accent Color' },
          caption: { color: '#E0E0E0', description: 'Light gray for footer details' }
        }
      }
      // EXTENDED LOGIC: If design context provided color mapping, use it (unless overridden by brand colors above)
      else if (options.designContext?.typographyGuidance?.colorMapping) {
        colorSource = options.designContext.typographyGuidance.colorMapping
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

          colorSource = {
            hero: {
              color: 'white',
              description: 'Crisp White for maximum contrast against the rich background',
              contrastRatio: 7
            },
            headline: {
              color: 'white', // Safer default for rich backgrounds
              description: 'White or very light tint matching the background',
              contrastRatio: 4.5
            },
            body: {
              color: '#F0F0F0',
              description: 'Off-white for readability'
            },
            cta: {
              color: 'contrast accent', // AI will interpret this based on mood
              description: `High contrast accent color derived from: ${moodDescription}`,
              contrastRatio: 7
            },
            caption: {
              color: '#CCCCCC',
              description: 'Subtle light gray'
            }
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

TEXT HIERARCHY WITH EXPLICIT COLOR INSTRUCTIONS:

HERO TEXT (Event Name "${eventName}"):
  Size: 3.5x base (LARGEST element on the poster)
  Weight: Bold
  Color: ${colorSource.hero.color}
  Description: ${colorSource.hero.description}
  Contrast Required: ${(colorSource.hero as any).contrastRatio || 7}:1 WCAG compliance

HEADLINE TEXT (Speaker/Tagline):
  Size: 2x base
  Weight: Semibold
  Color: ${colorSource.headline.color}
  Description: ${colorSource.headline.description}
  Contrast Required: ${(colorSource.headline as any).contrastRatio || 7}:1 WCAG compliance

BODY TEXT (Date/Venue/Details):
  Size: 1.5x base
  Weight: Medium
  Color: ${colorSource.body.color}
  Description: ${colorSource.body.description}
  Contrast Required: ${(colorSource.body as any).contrastRatio || 4.5}:1 WCAG compliance

${data.registrationInfo ? `
CTA TEXT (Button "${data.registrationInfo}"):
  Size: 1.5x base
  Weight: Bold
  Color: ${colorSource.cta.color}
  Description: ${colorSource.cta.description}
  Contrast Required: ${(colorSource.cta as any).contrastRatio || 7}:1 WCAG compliance
  Treatment: HIGH CONTRAST button with contrasting background` : ''}
${hasFooter ? `
CAPTION TEXT (Organization/Footer):
  Size: 1x base
  Weight: Regular
  Color: ${colorSource.caption.color}
  Description: ${colorSource.caption.description}
  Contrast Required: ${(colorSource.caption as any).contrastRatio || 4.5}:1 WCAG compliance` : ''}

MULTI-COLOR TYPOGRAPHY RULES:
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

TEXT HIERARCHY WITH EXPLICIT COLOR INSTRUCTIONS:

HERO TEXT (Event Name "${eventName}"):
  Size: 3.5x base (LARGEST element on the poster)
  Weight: Bold
  Color: ${colorSource.hero.color}
  Description: ${colorSource.hero.description}
  Contrast Required: ${(colorSource.hero as any).contrastRatio || 7}:1 WCAG compliance

HEADLINE TEXT (Speaker/Tagline):
  Size: 2x base
  Weight: Semibold
  Color: ${colorSource.headline.color}
  Description: ${colorSource.headline.description}
  Contrast Required: ${(colorSource.headline as any).contrastRatio || 7}:1 WCAG compliance

BODY TEXT (Date/Venue/Details):
  Size: 1.5x base
  Weight: Medium
  Color: ${colorSource.body.color}
  Description: ${colorSource.body.description}
  Contrast Required: ${(colorSource.body as any).contrastRatio || 4.5}:1 WCAG compliance

${data.registrationInfo ? `
CTA TEXT (Button "${data.registrationInfo}"):
  Size: 1.5x base
  Weight: Bold
  Color: ${colorSource.cta.color}
  Description: ${colorSource.cta.description}
  Contrast Required: ${(colorSource.cta as any).contrastRatio || 7}:1 WCAG compliance
  Treatment: HIGH CONTRAST button with contrasting background` : ''}


${hasFooter ? `
CAPTION TEXT (Organization/Footer):
  Size: 1x base
  Weight: Regular
  Color: ${colorSource.caption.color}
  Description: ${colorSource.caption.description}
  Contrast Required: ${(colorSource.caption as any).contrastRatio || 4.5}:1 WCAG compliance` : ''}

MULTI-COLOR TYPOGRAPHY RULES:
- Each text role has a DIFFERENT color for visual hierarchy and readability
- Use EXACT colors specified above - do not substitute or approximate
- Maintain minimum contrast ratios for accessibility
- Color differentiation helps guide viewer's eye from hero → headline → body → CTA → caption
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
    // v5.0: DISABLED - Logos now overlay directly on background for modern, seamless look
    headerLogoBand: {
      enabled: false, // CHANGED: Logos overlay directly on background (no visible stripe)
      heightPercent: 12,
      backgroundStyle: sophistication === 'rich'
        ? 'transparent / integrated header for immersive background'
        : 'transparent overlay mode - simple background for logo visibility',
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
  const colors = eventContext.colors;
  const tg = options.designContext?.typographyGuidance;
  const tg_style = tg?.typographyStyle || 'modern';
  const tg_cat = tg?.typographyStyle || eventContext.headlineFont || 'sans-serif';
  const tg_align = (tg?.alignment as any) || 'center';

  return `
TYPOGRAPHY GUIDELINES:
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

${hasSpeakerPhoto ? 'Speaker photo will be overlaid via post-processing. Keep that zone clean but make the REST of the poster visually rich.' : ''}

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

3. HEADER INTEGRATION (v5.0 - Overlay Mode):
  - The top 15% is reserved for logo overlays. Ensure the background provides good contrast for white logos.
  - DO NOT create a visible stripe, band, or separate header section. The background should flow naturally from top to bottom.
  - ${sophistication === 'minimalist'
      ? 'Keep this area simple (solid color or subtle gradient) for professional logo visibility.'
      : 'Extend your immersive background to the top edge while maintaining contrast for logo readability.'}
  - Logos will be overlaid on this area post-generation, so avoid busy patterns in the top 15%.

    ${eventDescription ? `4. TAGLINE:
   - Place "${eventDescription}" in a supporting relationship to the title.` : ''
    }

${speakers.length > 0 && !hasSpeakerPhoto ? `5. SPEAKER${speakers.length > 1 ? 'S' : ''}:
   ${speakers.map((speaker, index) => {
     const speakerLabel = speakers.length > 1 ? `Speaker ${index + 1}` : 'Speaker'
     const designation = speaker.designation ? ` (${speaker.designation})` : ''
     return `- Feature "${speakerLabel}: ${speaker.name}${designation}" as structured text with clear hierarchy between name and title.`
   }).join('\n   ')}
   - Group speaker name and designation together visually (similar to Date/Time/Venue grouping).` : ''
    }

${data.entryFee ? `6. FEE:
   - "Registration fee: ${data.entryFee}" can be a subtle detail or a badge.` : ''
    }
  </layout_composition_rules>

TOPICS AND CONTENT LAYOUT:
If topics are provided in Additional Details, do NOT render them as a single paragraph.Render them as a clean, scannable list or a 2 - column grid.Use micro - icons or glowing nodes as bullets to guide the eye.Ensure line - height is at least 1.5x for readability.

    ${options.brandContext ? `Color scheme: ${options.brandContext.primaryColor} as primary with ${options.brandContext.secondaryColor || 'white'} as secondary` : ''}

TEXT TO DISPLAY IN THE IMAGE(render these exact words):
  - Main headline: "${eventName}"
${eventDescription ? `- Tagline: "${eventDescription}"` : ''}
  - Date & Time: "${formatEventDate(data.eventDate)} | ${data.eventEndTime ? formatEventTime(data.eventTime) + ' - ' + formatEventTime(data.eventEndTime) : formatEventTime(data.eventTime)}"
    - Location: "${data.venue || ''}"
${data.entryFee ? `- Fee: "${data.entryFee}"` : ''}
${speakers.length > 0 && !hasSpeakerPhoto ? `${speakers.length > 1 ? '- Speakers:\n   ' : '- Speaker:\n   '}${formatMultipleSpeakers(speakers)}` : ''}
${data.registrationInfo ? `  - Button: "${data.registrationInfo}"` : ''}
${eventNote ? `- Footer: "${eventNote}"` : ''}

VISUAL STYLE:
${options.designContext?.designStrategy || eventContext.style} with ${colors} color palette.The mood is ${options.designContext?.emotionalJob || eventContext.mood}. Typography uses a ${tg_style} -vibe(${tg_cat}) with ${tg_align} -aligned layout that commands attention.Event details are clean and readable with supportive icons.The call - to - action button has bold, high contrast styling.Energy level: ${eventContext.energy}.

${options.multiColorTypography ? `
${buildMultiColorTypographyInstructions(options.multiColorTypography)}
` : ''}

${EVENT_POSTER_EXAMPLES}

QUALITY STANDARDS:
This poster passes the 3 - SECOND TEST where What, When, Where are instantly visible.The event name "${eventName}" is the dominant text element and impossible to miss.The design is readable from both close - up on a phone and at distance as a printed poster.Professional marketing quality with clear visual hierarchy guiding the eye from top to bottom.The call - to - action stands out and drives action.All text is clearly legible against its background.
${sophistication === 'rich'
      ? 'The design MUST be visually stunning. Logos will overlay on the top area, so ensure adequate contrast.'
      : 'The top 15% should have a simple, clean background suitable for white logo overlays (solid color or subtle gradient).'
    }

DESIGN CONSTRAINTS:
${sophistication === 'rich'
      ? `Avoid boring, empty layouts. "Clutter" is allowed if it means "Rich Texture" and "Detail". Do not leave vast empty white spaces unless they are intentional negative space. Avoid: tiny unreadable text, low contrast text, amateur composition.`
      : `The design avoids cluttered layouts, tiny unreadable text, poor hierarchy, generic stock photo aesthetics, unprofessional design, too many competing fonts, competing focal points, low contrast text on busy backgrounds, landscape orientation, and busy patterns in the header band area.`
    }
    ${hasSpeakerPhoto ? `The speaker photo zone${speakers.length > 1 ? 's have' : ' has a'} clean background${speakers.length > 1 ? 's' : ''} without illustrated faces, people, or human figures - real photos will be overlaid separately.` : ''}
${speakers.length > 0 && !hasSpeakerPhoto ? `IMPORTANT - NO SPEAKER PLACEHOLDER${speakers.length > 1 ? 'S' : ''}: The speaker${speakers.length > 1 ? 's' : ''} ${speakers.map(s => `"${s.name}"`).join(', ')} appear${speakers.length === 1 ? 's' : ''} as TEXT ONLY. DO NOT create any circular frames, photo placeholders, person silhouettes, or visual representation of${speakers.length > 1 ? ' people' : ' a person'}.` : ''}

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

The goal is a visually stunning poster that immediately communicates "${data.eventType || 'professional event'}" through ${sophistication === 'minimalist' ? 'clean, professional minimalism' : 'rich visual language'}${sophistication === 'rich' ? ', with a fully integrated, immersive header.' : ', while keeping the top header band clean for branding.'}
`.trim()
}

// Export for use elsewhere

