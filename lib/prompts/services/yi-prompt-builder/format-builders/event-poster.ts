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

  // Get typography hierarchy rules
  const typographyRules = getTypographyPromptFragment('event_poster')

  // Determine colors - use brand colors if available
  const colors = options.brandContext?.primaryColor
    ? `Brand-adapted: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}, ${options.brandContext.accentColor || eventContext.ctaColor}`
    : eventContext.colors

  return `
<task>Generate a VISUALLY STUNNING event poster with rich, atmospheric design that immediately communicates the event type through visual language</task>

<format>
Type: Event Promotional Poster
Aspect Ratio: Portrait 4:5 (optimal for both print and social sharing)
Purpose: Announce upcoming event, attract target audience, drive registrations
Event Type: ${data.eventType || 'Professional event'}
</format>

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${layoutContext}

${langContext}

${speakerZoneContext}

${decorativeElementsContext}

${backgroundSettingContext}

<typography_hierarchy>
${typographyRules}
</typography_hierarchy>

<subject>
A VISUALLY RICH, IMMERSIVE event poster for "${data.eventName}".
Target Audience: ${data.targetAudience || eventContext.defaultAudience}

VISUAL STORYTELLING GOAL:
- The poster must LOOK AND FEEL like a ${data.eventType || 'professional'} event through its visual design
- Use the visual_design_elements to create an atmospheric, contextually-rich background
- The design should rival Google AI Studio quality - layered, dimensional, professional
- Must pass 3-SECOND TEST: viewer understands WHAT, WHEN, WHERE instantly

${hasSpeakerPhoto ? 'NOTE: Speaker photo will be overlaid via post-processing. Keep that zone clean but make the REST of the poster visually rich.' : ''}
</subject>

<composition>
Layout: Clear vertical hierarchy optimized for quick scanning

Structure from top to bottom:
- TOP (5-10%): Clean header area with simple background
- HEADLINE ZONE (25-30%): Main event title as the largest text element
${data.eventDescription ? `- TAGLINE (5-10%): Supporting message below headline` : ''}
- DETAILS ZONE (25-30%): Event information with clear iconography showing date, time, location
${data.speakerName ? `- SPEAKER ZONE (15-20%): Featured speaker section with circular photo area` : ''}
- CTA ZONE (10-15%): Strong call-to-action button
- FOOTER (5%): Additional info area

Background: ${eventContext.background}
${options.brandContext ? `Brand colors: ${options.brandContext.primaryColor} and ${options.brandContext.secondaryColor || 'white'}` : ''}
</composition>

<text_content>
<!-- TEXT TO RENDER: Only the quoted values should appear as text in the image -->
<text role="headline">"${data.eventName}"</text>
${data.eventDescription ? `<text role="tagline">"${data.eventDescription}"</text>` : ''}
<text role="date">"${formatEventDate(data.eventDate)}"</text>
<text role="time">"${data.eventTime || ''}"</text>
<text role="venue">"${data.venue || ''}"</text>
${data.entryFee ? `<text role="price">"${data.entryFee}"</text>` : ''}
${data.speakerName ? `<text role="speaker">"${data.speakerName}${data.speakerDesignation ? ', ' + data.speakerDesignation : ''}"</text>` : ''}
<text role="cta">"${data.registrationInfo || 'REGISTER NOW'}"</text>
${data.eventNote ? `<text role="note" prominence="small" style="footer text, bottom 5-10%">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: ${eventContext.style}
Color Palette: ${colors}
Mood: ${eventContext.mood}
Typography:
  - Headlines: Bold, modern sans-serif that commands attention
  - Details: Clean, readable, with supportive icons
  - CTA: Bold, high contrast, button-style
Icons: Simple, modern iconography for date/time/venue
Energy Level: ${eventContext.energy}
</style>

${EVENT_POSTER_EXAMPLES}

<quality_markers>
- Passes 3-SECOND TEST: What, When, Where are instantly visible
- Event name is dominant and impossible to miss
- Readable from both close-up (phone) and distance (printed poster)
- Professional marketing quality
- Clear visual hierarchy guiding eye from top to bottom
- CTA stands out and drives action
- All text clearly legible
- Clean header area with simple background suitable for branding
</quality_markers>

<constraints>
Avoid: Cluttered layout, tiny unreadable text, poor hierarchy (event name not dominant), generic stock photo feel, unprofessional design, too many competing fonts, competing focal points, low contrast text on busy background, landscape orientation, busy patterns in header area
${hasSpeakerPhoto ? `Avoid: Illustrated faces, people, or human figures in the speaker photo zone - keep it clean for photo overlay` : ''}
</constraints>

<render_constraints>
CRITICAL: Only render text that appears inside <text role="...">content</text> tags.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Design terminology (hierarchy, prominence, focal point)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID
- Any text from typography_hierarchy or design_architecture sections
${hasSpeakerPhoto ? '- Speaker zone instructions - generate clean background only' : ''}
</render_constraints>

<ai_creative_freedom>
AI HAS FULL CREATIVE CONTROL OVER (BE BOLD AND CREATIVE!):
- BACKGROUNDS: Create RICH, LAYERED, ATMOSPHERIC backgrounds - not plain colors!
  * Use multiple layers of visual elements at different opacities
  * Add depth with gradients, glows, ambient lighting effects
  * Integrate event-type elements (neural networks for tech, medical symbols for health) THROUGHOUT the design
  * Make the background TELL THE STORY of what kind of event this is
- Style: Visual mood, color harmony, lighting effects, professional finish
- Composition: Dynamic element positioning, visual flow, dimensional arrangements
- Typography Styling: Font sizes, weights, effects, glow/shadow (NOT font family if specified)
- Visual Elements: ALL items from visual_design_elements should be INTEGRATED into the design

AI STRICT BOUNDARIES (do not cross):
- NO human faces or figures (speaker photos overlaid separately)
- NO logos (added via Sharp post-processing)
- ONLY render text from <text role="..."> tags

The goal is a VISUALLY STUNNING poster that immediately communicates "${data.eventType || 'professional event'}" through rich visual language.
</ai_creative_freedom>
`.trim()
}

// Export for use elsewhere
export { EVENT_POSTER_EXAMPLES }
