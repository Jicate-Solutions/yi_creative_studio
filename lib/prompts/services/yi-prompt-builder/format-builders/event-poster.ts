/**
 * Event Poster Prompt Builder v3.0
 * Generates XML-structured prompts for event poster designs
 * Enhanced with logo awareness, brand context, and quality context
 */

import type { EventPosterFormData, EnhancedBuildOptions } from '../types'
import { buildLogoContext, buildBrandContext, buildQualityContext } from '../context-helpers'
import { EVENT_POSTER_EXAMPLES } from '../examples'

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

  // Build context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'event_poster')

  // Determine colors - use brand colors if available
  const colors = options.brandContext?.primaryColor
    ? `Brand-adapted: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}, ${options.brandContext.accentColor || eventContext.ctaColor}`
    : eventContext.colors

  return `
<task>Generate a professional event poster that captures attention and communicates essential details</task>

<format>
Type: Event Promotional Poster
Aspect Ratio: Portrait 4:5 (optimal for both print and social sharing)
Purpose: Announce upcoming event, attract target audience, drive registrations
Event Type: ${data.eventType || 'Professional event'}
</format>

${logoContext}

${brandContext}

${qualityContext}

<subject>
A dynamic, eye-catching event poster for "${data.eventName}".
Target Audience: ${data.targetAudience || eventContext.defaultAudience}
The poster must pass the 3-SECOND TEST: viewer immediately understands WHAT (event name), WHEN (date/time), WHERE (venue).
This will be used for: print posters, social media sharing, digital displays.
</subject>

<composition>
Layout: Clear vertical hierarchy optimized for quick scanning

Structure from top to bottom:
- TOP (5-10%): Organization logo ${options.logoAwareness?.logoPosition === 'top-left' ? 'in TOP-LEFT (keep area clear for overlay)' : options.logoAwareness?.logoPosition === 'top-right' ? 'in TOP-RIGHT (keep area clear for overlay)' : 'positioned appropriately'}
- HEADLINE ZONE (25-30%): Event name "${data.eventName}" - DOMINANT, LARGEST, MOST IMPACTFUL
${data.eventDescription ? `- TAGLINE (5-10%): "${data.eventDescription}" - supporting message below headline` : ''}
- DETAILS ZONE (25-30%): Event information with clear iconography
  - Date: "${formatEventDate(data.eventDate)}"
  - Time: "${data.eventTime || 'Time TBA'}"
  - Venue: "${data.venue || 'Venue TBA'}"
  ${data.entryFee ? `- Entry: "${data.entryFee}"` : ''}
${data.speakerName ? `- SPEAKER ZONE (15-20%): Featured speaker "${data.speakerName}${data.speakerDesignation ? ', ' + data.speakerDesignation : ''}" with circular photo placeholder area` : ''}
- CTA ZONE (10-15%): Strong call-to-action "${data.registrationInfo || 'Register Now'}" button
- FOOTER (5%): Additional info, sponsor logos if any

Background: ${eventContext.background}
${options.brandContext ? `Brand Integration: Incorporate ${options.brandContext.primaryColor} and ${options.brandContext.secondaryColor || 'white'} into design` : ''}
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold impactful ${eventContext.headlineFont}, ${eventContext.headlineColor}">${data.eventName}</text>
${data.eventDescription ? `<text role="tagline" prominence="prominent" style="clean sans-serif, lighter weight">${data.eventDescription}</text>` : ''}
<text role="date" prominence="medium" style="bold with calendar icon, high visibility">${formatEventDate(data.eventDate)}</text>
<text role="time" prominence="medium" style="bold with clock icon, high visibility">${data.eventTime || 'Time TBA'}</text>
<text role="venue" prominence="medium" style="clear with location icon">${data.venue || 'Venue TBA'}</text>
${data.entryFee ? `<text role="price" prominence="medium" style="highlighted, possibly in badge or tag format">${data.entryFee}</text>` : ''}
${data.speakerName ? `<text role="speaker" prominence="medium" style="featured section">Featuring: ${data.speakerName}${data.speakerDesignation ? ', ' + data.speakerDesignation : ''}</text>` : ''}
<text role="cta" prominence="prominent" style="bold button-style, ${eventContext.ctaStyle}">${data.registrationInfo || 'REGISTER NOW'}</text>
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
${options.logoAwareness?.hasLogo ? '- Logo area kept clear with appropriate background' : ''}
</quality_markers>

<constraints>
Avoid: Cluttered layout, tiny unreadable text, poor hierarchy (event name not dominant), generic stock photo feel, unprofessional design, too many competing fonts, competing focal points, low contrast text on busy background, landscape orientation
${options.logoAwareness?.hasLogo ? `Avoid: Busy patterns or critical content in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>
`.trim()
}

// Export for use elsewhere
export { EVENT_POSTER_EXAMPLES }
