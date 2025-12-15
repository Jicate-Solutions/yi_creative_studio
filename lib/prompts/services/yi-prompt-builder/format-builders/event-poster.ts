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
} from '../context-helpers'
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

// ============================================================
// EVENT CONTEXT TYPES
// ============================================================

interface EventContext {
  background: string
  style: string
  colors: string
  mood: string
  energy: string
  headlineFont: string
  headlineColor: string
  ctaColor: string
  ctaStyle: string
  defaultAudience: string
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
      headlineColor: 'dark on light OR white on vibrant',
      ctaColor: 'contrasting accent',
      ctaStyle: 'prominent contrasting button',
      defaultAudience: 'Learners, professionals seeking skills',
    },
    health_camp: {
      background: 'Fresh, clean gradient with soft green and white, subtle medical wellness symbols, clean and trustworthy',
      style: 'Healthcare appropriate, clean, trustworthy',
      colors: 'Fresh green (#28a745), white, soft blue accent',
      mood: 'Caring, professional, health-focused, welcoming',
      energy: 'Calm, reassuring',
      headlineFont: 'sans-serif',
      headlineColor: 'dark green on white OR white on green',
      ctaColor: 'blue or green',
      ctaStyle: 'clear, trustworthy button',
      defaultAudience: 'Community members, health-conscious individuals',
    },
    concert: {
      background: 'Dynamic background with stage lights, light rays, crowd silhouettes, energetic concert atmosphere',
      style: 'Entertainment, high-energy, exciting',
      colors: 'Purple (#8b00ff), electric blue (#00d4ff), pink, neon accents',
      mood: 'Exciting, energetic, entertainment, can\'t-miss',
      energy: 'High energy, electric',
      headlineFont: 'bold display sans-serif',
      headlineColor: 'bright/neon on dark',
      ctaColor: 'neon accent',
      ctaStyle: 'bold neon button',
      defaultAudience: 'Music lovers, entertainment seekers',
    },
    community: {
      background: 'Warm welcoming background with community gathering feel, warm earth tones, inclusive atmosphere',
      style: 'Warm, inclusive, community-focused',
      colors: 'Warm orange (#ff8c00), yellow (#ffd700), earth tones',
      mood: 'Welcoming, inclusive, community spirit, belonging',
      energy: 'Warm, inviting',
      headlineFont: 'friendly sans-serif',
      headlineColor: 'dark on warm',
      ctaColor: 'warm accent',
      ctaStyle: 'friendly, welcoming button',
      defaultAudience: 'Community members, families, neighbors',
    },
    tech: {
      background: 'Futuristic background with circuit patterns, digital elements, subtle code motifs, modern tech aesthetic',
      style: 'Modern tech, innovative, cutting-edge',
      colors: 'Electric blue (#00d4ff), purple (#7b68ee), dark background',
      mood: 'Innovative, technical, forward-thinking, exciting',
      energy: 'Dynamic, innovative',
      headlineFont: 'modern sans-serif',
      headlineColor: 'bright on dark',
      ctaColor: 'electric accent',
      ctaStyle: 'tech-styled button',
      defaultAudience: 'Tech professionals, developers, innovators',
    },
    sports: {
      background: 'Dynamic energetic background with motion blur effects, athletic energy, competition feel',
      style: 'Dynamic, athletic, high-energy',
      colors: 'Bold red (#dc3545), black, white, energetic accents',
      mood: 'Competitive, energetic, athletic, pumped',
      energy: 'High energy, athletic',
      headlineFont: 'bold impact sans-serif',
      headlineColor: 'white or bold on dynamic',
      ctaColor: 'red or high-energy',
      ctaStyle: 'bold action button',
      defaultAudience: 'Athletes, sports enthusiasts, competitors',
    },
    children: {
      background: 'Playful colorful background with child-friendly elements, safe and fun atmosphere, bright and cheerful',
      style: 'Playful, safe, family-friendly',
      colors: 'Primary colors (red, blue, yellow), pastels, bright and cheerful',
      mood: 'Fun, safe, engaging for families, child-appropriate',
      energy: 'Playful, joyful',
      headlineFont: 'friendly rounded sans-serif',
      headlineColor: 'colorful on light',
      ctaColor: 'bright primary',
      ctaStyle: 'fun, friendly button',
      defaultAudience: 'Families, parents, children',
    },
    seminar: {
      background: 'Professional academic setting with subtle geometric patterns, clean lines',
      style: 'Academic professional, intellectual',
      colors: 'Navy blue (#1e3a5f), burgundy (#722f37), white, gold accent',
      mood: 'Intellectual, prestigious, knowledge-focused',
      energy: 'Focused, professional',
      headlineFont: 'sans-serif',
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
  const speakerName = data.speakerName || (rawData.speaker as string) || (rawData.guestName as string) || ''
  const speakerDesignation = data.speakerDesignation || (rawData.designation as string) || (rawData.guestDesignation as string) || ''

  // v3.6: Normalize tagline and additionalDetails field names
  const eventDescription = data.eventDescription || (rawData.eventTagline as string) || (rawData.tagline as string) || ''
  const eventNote = data.eventNote || (rawData.additionalDetails as string) || (rawData.additionalInfo as string) || ''

  const eventContext = getEventContext(data.eventType)

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'event_poster')

  // NEW v3.1: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const layoutContext = buildLayoutZoneContext(options.layout)
  const langContext = buildLanguageContext(options.language)

  // NEW v3.4: Build forbidden zones for strict logo-text overlap prevention
  const forbiddenZonesContext = buildForbiddenZonesSection(options.logoAwareness)
  const zoneReminderContext = buildZoneReminderSection(options.logoAwareness)

  // Build speaker zone context from options.speakerPhotoConfig (v3.1)
  // This uses the config passed from API route, which preserves the zone even when user has own photo
  const speakerZoneContext = buildSpeakerPhotoZoneContext(options.speakerPhotoConfig)
  const hasSpeakerPhoto = options.speakerPhotoConfig?.enabled === true

  // NEW v3.2: Build decorative elements section from Design Intelligence context
  // This ensures event-type specific visual elements (neural networks for tech, etc.) reach the AI
  const decorativeElementsContext = buildDecorativeElementsSection({
    eventType: data.eventType,
    designContext: options.designContext,
    maxElements: 4,
    includeIconicImagery: true,
  })
  const backgroundSettingContext = buildBackgroundSettingSection(options.designContext)

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

  // Get typography hierarchy rules
  const typographyRules = getTypographyPromptFragment('event_poster')

  // Determine colors - priority: user brand colors > AI-generated colors > hardcoded fallback
  const colors = options.brandContext?.primaryColor
    ? `Brand-adapted: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}, ${options.brandContext.accentColor || eventContext.ctaColor}`
    : options.designContext?.colorMood
      ? `AI-suggested: ${options.designContext.colorMood}`
      : eventContext.colors

  return `
A VISUALLY STUNNING event poster with rich, atmospheric design that immediately communicates the event type through visual language.

FORMAT: Event Promotional Poster in Portrait 4:5 aspect ratio (optimal for both print and social sharing). Purpose is to announce the upcoming event, attract the target audience, and drive registrations. Event Type: ${data.eventType || 'Professional event'}.

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${layoutContext}

${forbiddenZonesContext}

${langContext}

${speakerZoneContext}

${decorativeElementsContext}

${backgroundSettingContext}

${aiTypographySection}

${aiDecorativeSection}

${creativeTwistSection}

TYPOGRAPHY GUIDELINES:
${typographyRules}

POSTER DESCRIPTION:
A visually rich, immersive event poster for "${eventName}". Target Audience: ${data.targetAudience || eventContext.defaultAudience}.

The poster achieves these visual storytelling goals: It looks and feels like a ${data.eventType || 'professional'} event through its visual design. The visual_design_elements create an atmospheric, contextually-rich background. The design quality rivals Google AI Studio - layered, dimensional, professional. It passes the 3-SECOND TEST where the viewer instantly understands WHAT, WHEN, WHERE.

${hasSpeakerPhoto ? 'Speaker photo will be overlaid via post-processing. Keep that zone clean but make the REST of the poster visually rich.' : ''}

POSTER LAYOUT AND COMPOSITION:

This poster uses a clear vertical hierarchy optimized for quick scanning. The layout divides into distinct zones from top to bottom:

The top 15% of the poster is a clean header band with only simple background colors or gradients - no text in this area. This header band has clean corners for branding elements.

Below the header band (starting at 15-20% from top), the main event title "${eventName}" appears as the largest, most prominent text. The title is centered horizontally in the middle portion of the poster width, not extending into the corner areas.

${eventDescription ? `The tagline "${eventDescription}" appears below the main title in a supporting role.` : ''}

The middle section contains event details with clear iconography: the date and time "${formatEventDate(data.eventDate)} | ${formatEventTime(data.eventTime)}", and venue "${data.venue || ''}".

${speakerName ? `The speaker section features "${speakerName}${speakerDesignation ? ', ' + speakerDesignation : ''}"${hasSpeakerPhoto ? ' with space for a photo' : ' as TEXT ONLY (no photo placeholder)'}.` : ''}

${data.entryFee ? `Registration fee: "${data.entryFee}"` : ''}

The call-to-action button reads "${data.registrationInfo || 'REGISTER NOW'}" and stands out with high contrast.

${eventNote ? `Footer note: "${eventNote}"` : ''}

${options.brandContext ? `Color scheme: ${options.brandContext.primaryColor} as primary with ${options.brandContext.secondaryColor || 'white'} as secondary` : ''}

TEXT TO DISPLAY IN THE IMAGE (render these exact words):
- Main headline: "${eventName}"
${eventDescription ? `- Tagline: "${eventDescription}"` : ''}
- Date & Time: "${formatEventDate(data.eventDate)} | ${formatEventTime(data.eventTime)}"
- Location: "${data.venue || ''}"
${data.entryFee ? `- Fee: "${data.entryFee}"` : ''}
${speakerName ? `- Speaker: "${speakerName}${speakerDesignation ? ', ' + speakerDesignation : ''}"` : ''}
- Button: "${data.registrationInfo || 'REGISTER NOW'}"
${eventNote ? `- Footer: "${eventNote}"` : ''}

VISUAL STYLE:
${options.designContext?.designStrategy || eventContext.style} with ${colors} color palette. The mood is ${options.designContext?.emotionalJob || eventContext.mood}. Headlines use bold, modern sans-serif typography that commands attention. Event details are clean and readable with supportive icons. The call-to-action button has bold, high contrast styling. Energy level: ${eventContext.energy}.

${EVENT_POSTER_EXAMPLES}

QUALITY STANDARDS:
This poster passes the 3-SECOND TEST where What, When, Where are instantly visible. The event name "${eventName}" is the dominant text element and impossible to miss. The design is readable from both close-up on a phone and at distance as a printed poster. Professional marketing quality with clear visual hierarchy guiding the eye from top to bottom. The call-to-action stands out and drives action. All text is clearly legible against its background. The header band (top 15%) has a simple, clean background suitable for branding elements.

DESIGN CONSTRAINTS:
The design avoids cluttered layouts, tiny unreadable text, poor hierarchy, generic stock photo aesthetics, unprofessional design, too many competing fonts, competing focal points, low contrast text on busy backgrounds, landscape orientation, and busy patterns in the header band area.
${hasSpeakerPhoto ? `The speaker photo zone has a clean background without illustrated faces, people, or human figures - real photos will be overlaid separately.` : ''}
${speakerName && !hasSpeakerPhoto ? `IMPORTANT - NO SPEAKER PLACEHOLDER: The speaker "${speakerName}" appears as TEXT ONLY. DO NOT create any circular frames, photo placeholders, person silhouettes, or visual representation of a person. The speaker information is purely textual - render only the name and designation as text, no photo frame needed.` : ''}

${zoneReminderContext}

${options?.preventionEnhancements?.length ? `
LEARNED IMPROVEMENTS (from past feedback):
${options.preventionEnhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}
` : ''}

CREATIVE DIRECTION:
The AI has full creative control over creating rich, layered, atmospheric backgrounds (not plain colors). Use multiple layers of visual elements at different opacities. Add depth with gradients, glows, and ambient lighting effects. Integrate ${data.eventType || 'professional event'}-themed visual elements throughout the design to tell the story of what kind of event this is. Control the visual mood, color harmony, lighting effects, and professional finish. Style the typography with appropriate sizes, weights, effects, and glow/shadow.

The image contains no human faces or figures (photos added separately) and no logos (added via post-processing). Only the exact text listed above appears in the image.

The goal is a visually stunning poster that immediately communicates "${data.eventType || 'professional event'}" through rich visual language, while keeping the top header band clean for branding.
`.trim()
}

// Export for use elsewhere
export { EVENT_POSTER_EXAMPLES }
