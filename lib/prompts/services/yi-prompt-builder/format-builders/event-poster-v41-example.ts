/**
 * Event Poster Prompt Builder v4.1 EXAMPLE
 *
 * This is a reference implementation showing how to integrate v4.1 text styling
 * and layout helpers into the event poster builder.
 *
 * TO USE:
 * 1. Copy the import statement (line 25) to event-poster.ts
 * 2. Copy the v4.1 context building section (lines 86-138) to event-poster.ts around line 258
 * 3. Copy the v4.1 context injection (lines 162-168) to event-poster.ts around line 343
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
// ✅ STEP 1: ADD THIS IMPORT to event-poster.ts after line 21
import { buildAllV41Contexts } from '../context-helpers-v41'

export function buildEventPosterPromptV41(
  data: EventPosterFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Normalize field names (same as v3.1)
  const rawData = data as unknown as Record<string, unknown>
  const eventName = data.eventName || (rawData.eventTitle as string) || (rawData.title as string) || 'Event'
  const speakerName = data.speakerName || (rawData.speaker as string) || (rawData.guestName as string) || ''
  const speakerDesignation = data.speakerDesignation || (rawData.designation as string) || (rawData.guestDesignation as string) || ''
  const eventDescription = data.eventDescription || (rawData.eventTagline as string) || (rawData.tagline as string) || ''
  const eventNote = data.eventNote || (rawData.additionalDetails as string) || (rawData.additionalInfo as string) || ''

  // Build existing v3.x context sections (unchanged)
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'event_poster')
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const layoutContext = buildLayoutZoneContext(options.layout)
  const langContext = buildLanguageContext(options.language)
  const speakerZoneContext = buildSpeakerPhotoZoneContext(options.speakerPhotoConfig)
  const hasSpeakerPhoto = options.speakerPhotoConfig?.enabled === true

  // ============================================================
  // ✅ STEP 2: ADD THIS SECTION to event-poster.ts around line 258
  // NEW v4.1: Build text styling and layout contexts
  // ============================================================

  const v41Contexts = buildAllV41Contexts({
    // Text alignment: center headlines, left-aligned details
    textAlignment: {
      headlines: 'center',
      subtitles: 'center',
      details: 'left',
      footer: 'center',
    },

    // Text shadow for white text legibility on photos/gradients
    textShadow: {
      enabled: true,
      roles: ['headline', 'subheadline'],
      intensity: 'subtle',
    },

    // Header logo band for Yi triple-logo layout
    headerLogoBand: {
      enabled: true,
      heightPercent: 12,
      backgroundStyle: 'white rounded rectangle container',
      logoLayout: 'three logos positioned horizontally: Yi logo on the left, Bharat Rising logo in the center, CII logo on the right',
      secondaryLogos: !!options.verticalId,  // Include vertical logos if applicable
    },

    // Footer with Yi chapter branding
    footerStyle: {
      enabled: true,
      heightPercent: 10,
      leftSection: 'standard_yi',
      rightSection: 'partner_logo',
      chapterDetails: {
        chapterName: options.organizationContext?.name || 'Kanniyakumari',
        // Hashtag and social handle auto-generated from chapter name
        // e.g., chapterName "Kanniyakumari" → hashtag "#YIKANNIYAKUMARI" → social "@yi.kanniyakumari"
      },
      partnerInfo: {
        partnerLabel: 'Digital Partner',
      },
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

  // ============================================================
  // PROMPT ASSEMBLY
  // ============================================================

  return `
A VISUALLY STUNNING event poster with rich, atmospheric design that immediately communicates the event type through visual language.

FORMAT: Event Promotional Poster in Portrait 4:5 aspect ratio (optimal for both print and social sharing). Purpose is to announce the upcoming event, attract the target audience, and drive registrations. Event Type: ${data.eventType || 'Professional event'}.

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${layoutContext}

${langContext}

${speakerZoneContext}

${
  // ✅ STEP 3: ADD THIS LINE to event-poster.ts around line 343
  // Inject all v4.1 contexts (header band, text alignment, shadow, footer, event card)
  v41Contexts
}

TYPOGRAPHY GUIDELINES:
Modern, professional typography with clear hierarchy.

POSTER DESCRIPTION:
A visually rich, immersive event poster for "${eventName}". Target Audience: ${data.targetAudience || 'Professional audience'}.

The poster achieves these visual storytelling goals: It looks and feels like a ${data.eventType || 'professional'} event through its visual design. The design quality rivals Google AI Studio - layered, dimensional, professional. It passes the 3-SECOND TEST where the viewer instantly understands WHAT, WHEN, WHERE.

${hasSpeakerPhoto ? 'Speaker photo will be overlaid via post-processing. Keep that zone clean but make the REST of the poster visually rich.' : ''}

POSTER LAYOUT AND COMPOSITION:

This poster uses a clear vertical hierarchy optimized for quick scanning. The layout divides into distinct zones from top to bottom.

The main event title "${eventName}" appears as the largest, most prominent text, centered horizontally for maximum impact.

${eventDescription ? `The tagline "${eventDescription}" appears below the main title in a supporting role.` : ''}

The middle section contains event details with clear iconography.

${speakerName ? `The speaker section features "${speakerName}${speakerDesignation ? ', ' + speakerDesignation : ''}"${hasSpeakerPhoto ? ' with space for a photo' : ' as TEXT ONLY (no photo placeholder)'}.` : ''}

${data.entryFee ? `Registration fee: "${data.entryFee}"` : ''}

The call-to-action button reads "${data.registrationInfo || 'REGISTER NOW'}" and stands out with high contrast.

${eventNote ? `Footer note: "${eventNote}"` : ''}

TEXT TO DISPLAY IN THE IMAGE (render these exact words):
- Main headline: "${eventName}"
${eventDescription ? `- Tagline: "${eventDescription}"` : ''}
- Date & Time: "${data.eventDate || 'TBA'} | ${data.eventTime || 'TBA'}"
- Location: "${data.venue || ''}"
${data.entryFee ? `- Fee: "${data.entryFee}"` : ''}
${speakerName ? `- Speaker: "${speakerName}${speakerDesignation ? ', ' + speakerDesignation : ''}"` : ''}
- Button: "${data.registrationInfo || 'REGISTER NOW'}"
${eventNote ? `- Footer: "${eventNote}"` : ''}

VISUAL STYLE:
Professional design with harmonious color palette. The mood is inspiring and engaging. Headlines use bold, modern sans-serif typography that commands attention. Event details are clean and readable with supportive icons. The call-to-action button has bold, high contrast styling.

QUALITY STANDARDS:
This poster passes the 3-SECOND TEST where What, When, Where are instantly visible. The event name "${eventName}" is the dominant text element and impossible to miss. The design is readable from both close-up on a phone and at distance as a printed poster. Professional marketing quality with clear visual hierarchy guiding the eye from top to bottom. The call-to-action stands out and drives action. All text is clearly legible against its background.

DESIGN CONSTRAINTS:
The design avoids cluttered layouts, tiny unreadable text, poor hierarchy, generic stock photo aesthetics, unprofessional design, too many competing fonts, competing focal points, low contrast text on busy backgrounds, and landscape orientation.
${hasSpeakerPhoto ? `The speaker photo zone has a clean background without illustrated faces, people, or human figures - real photos will be overlaid separately.` : ''}
${speakerName && !hasSpeakerPhoto ? `IMPORTANT - NO SPEAKER PLACEHOLDER: The speaker "${speakerName}" appears as TEXT ONLY. DO NOT create any circular frames, photo placeholders, person silhouettes, or visual representation of a person. The speaker information is purely textual - render only the name and designation as text, no photo frame needed.` : ''}

CREATIVE DIRECTION:
The AI has full creative control over creating rich, layered, atmospheric backgrounds (not plain colors). Use multiple layers of visual elements at different opacities. Add depth with gradients, glows, and ambient lighting effects. Integrate ${data.eventType || 'professional event'}-themed visual elements throughout the design to tell the story of what kind of event this is. Control the visual mood, color harmony, lighting effects, and professional finish. Style the typography with appropriate sizes, weights, effects, and glow/shadow.

The image contains no human faces or figures (photos added separately) and no logos (added via post-processing). Only the exact text listed above appears in the image.

The goal is a visually stunning poster that immediately communicates "${data.eventType || 'professional event'}" through rich visual language.
`.trim()
}

// ============================================================
// EXAMPLE v4.1 PROMPT OUTPUT
// ============================================================
/*

With v4.1 integration, the generated prompt will include these new sections:

HEADER LOGO BAND (top 12% of design):
Create a white rounded rectangle container spanning the full width at the top of the design. This header band contains three logos positioned horizontally: Yi logo on the left, Bharat Rising logo in the center, CII logo on the right. The band has gentle rounded corners and a clean, professional appearance. Keep this header area simple with a solid background color (white or light) - NO complex patterns, photos, or text in this zone. This zone is reserved for branding elements that will be overlaid during post-processing.

Text Alignment Guidance:
- Headlines and event titles should be centered horizontally for maximum impact and visual balance
- Event details (date, time, venue) should be left-aligned within their container for structured readability
- Footer content should be center-aligned for professional appearance

Text Legibility Enhancement:
- headline, subheadline text should have subtle dark shadow for enhanced legibility
- This ensures white text remains readable on complex backgrounds, photos, or gradients

FOOTER ZONE (bottom 10% of design):
Create a white rounded rectangle container spanning the full width at the bottom of the design. The footer has gentle rounded corners matching the header style. LEFT SECTION of footer: Include a city skyline silhouette, then display these contact details: - Hashtag: #YIKANNIYAKUMARI (prominent, green color) - Website: www.youngindians.net - Social handle: @yi.kanniyakumari RIGHT SECTION of footer: Display "Digital Partner" label with space reserved for partner logo (will be overlaid in post-processing). Footer text should be small, clean, and professional. Use adequate spacing between elements.

EVENT DETAILS CARD:
Create a white rounded rectangle card positioned at bottom-center of the main content zone. Inside the card, display event details with icons: - Calendar icon followed by: [event date] - Clock icon followed by: [event time] - Location pin icon followed by: [venue] The card should have adequate padding and clean typography. Text inside the card should be left-aligned for structured readability.

*/
