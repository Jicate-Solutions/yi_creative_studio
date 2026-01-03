/**
 * Context Helper Functions for Yi Prompt Builder v4.1
 * New helpers for text alignment, shadows, header bands, footer styling, and event cards
 * v4.2: Story-driven enhancements for dynamic styling based on vibe/mood
 */

import type {
  TextAlignmentMap,
  TextShadowConfig,
  HeaderLogoBandConfig,
  FooterStyleConfig,
  EventDetailsCardConfig,
} from './types/layout-styling'

import type { FooterContactContext, DesignContextForPrompt } from './types'

// NEW v6.12: Text color resolver for WCAG compliance
import { getContrastSafeTextColor } from '@/lib/utils/text-color-resolver'

// ============================================================
// TEXT ALIGNMENT CONTEXT (v4.1)
// ============================================================

/**
 * Build text alignment context for headlines vs details differentiation
 * v4.1 - Adds center-aligned headlines, left-aligned details
 */
export function buildTextAlignmentContext(alignmentMap?: TextAlignmentMap): string {
  if (!alignmentMap) return ''

  const lines: string[] = ['Text Alignment Guidance:']

  if (alignmentMap.headlines) {
    const guidance = alignmentMap.headlines === 'center'
      ? 'centered horizontally for maximum impact and visual balance'
      : `${alignmentMap.headlines}-aligned for structured presentation`
    lines.push(`- Headlines and event titles should be ${guidance}`)
  }

  if (alignmentMap.details) {
    const guidance = alignmentMap.details === 'left'
      ? 'left-aligned within their container for structured readability'
      : `${alignmentMap.details}-aligned for clarity`
    lines.push(`- Event details (date, time, venue) should be ${guidance}`)
  }

  if (alignmentMap.footer) {
    lines.push(`- Footer content should be ${alignmentMap.footer}-aligned for professional appearance`)
  }

  return lines.join('\n')
}

// ============================================================
// TEXT SHADOW CONTEXT (v4.1)
// ============================================================

/**
 * Build text shadow context for white text legibility
 * v4.1 - Adds shadow guidance for text on photos/gradients
 */
export function buildTextShadowContext(shadowConfig?: TextShadowConfig): string {
  if (!shadowConfig?.enabled) return ''

  const roles = shadowConfig.roles || ['headline', 'subheadline']
  const intensity = shadowConfig.intensity || 'subtle'

  const intensityDesc = {
    subtle: 'subtle dark shadow for enhanced legibility',
    medium: 'moderate shadow for clear separation from background',
    strong: 'prominent shadow or outline for maximum readability'
  }

  const lines: string[] = ['Text Legibility Enhancement:']
  lines.push(`- ${roles.join(', ')} text should have ${intensityDesc[intensity]}`)
  lines.push('- This ensures white text remains readable on complex backgrounds, photos, or gradients')

  return lines.join('\n')
}

// ============================================================
// HEADER LOGO BAND CONTEXT (v4.1)
// ============================================================

/**
 * Build header logo band context for Yi triple-logo layout
 * v4.1 - Creates white rounded rectangle header with 3 logos
 */
export function buildHeaderLogoBandContext(bandConfig?: HeaderLogoBandConfig): string {
  if (!bandConfig?.enabled) return ''

  const heightPercent = bandConfig.heightPercent || 12
  const backgroundStyle = bandConfig.backgroundStyle || 'solid white or solid light-color rounded rectangle container'
  const logoLayout = bandConfig.logoLayout || 'three logos positioned horizontally: Yi logo on the left, Bharat Rising logo in the center, CII logo on the right'

  const lines: string[] = []
  lines.push(`HEADER LOGO BAND (top ${heightPercent}% of design):`)
  lines.push(`Create a ${backgroundStyle} spanning the full width at the top of the design.`)
  lines.push(`This header band contains ${logoLayout}.`)

  // Only enforce strict clean background if the style explicitly asks for it or defaults to it
  if (!backgroundStyle.toLowerCase().includes('transparent') && !backgroundStyle.toLowerCase().includes('integrated')) {
    lines.push(`The band MUST have a clean, solid background color (preferably white or very light) to ensure logo visibility.`)
    lines.push(`CRITICAL: This is a STRICT PROTECTED ZONE. Absolutely NO complex patterns, photos, textures, or ambient lighting effects should spill into this area.`)
    lines.push(`Keep this zone simple and distinct from the main background content.`)
  } else {
    lines.push(`Ensure logos remain visible against the background (use white logos if background is dark).`)
  }

  lines.push(`This zone is reserved for branding elements that will be overlaid during post-processing.`)

  if (bandConfig.secondaryLogos) {
    lines.push(`Below the main header band, there may be additional vertical or campaign logos in small white badge containers. These must also sit on clean, non-busy background areas.`)
  }

  return lines.join(' ')
}

// ============================================================
// FOOTER STYLE CONTEXT (v4.1)
// ============================================================

/**
 * Build footer style context combining visual styling + contact content
 * v4.1 - Creates standardized Yi footer with skyline, contact info, partner logo
 */
export function buildFooterStyleContext(
  footerStyle?: FooterStyleConfig,
  footerContact?: FooterContactContext
): string {
  if (!footerStyle?.enabled) return ''

  const heightPercent = footerStyle.heightPercent || 10
  const lines: string[] = []

  lines.push(`FOOTER ZONE (bottom ${heightPercent}% of design):`)
  lines.push(`Create a white rounded rectangle container spanning the full width at the bottom of the design.`)
  lines.push(`The footer has gentle rounded corners matching the header style.`)

  // Standard Yi footer structure
  if (footerStyle.leftSection === 'standard_yi' && footerStyle.chapterDetails) {
    const chapter = footerStyle.chapterDetails
    const hashtag = chapter.hashtag || `#YI${chapter.chapterName.toUpperCase().replace(/\s/g, '')}`
    const website = chapter.website || 'www.youngindians.net'
    const social = chapter.socialHandle || `@yi.${chapter.chapterName.toLowerCase().replace(/\s/g, '')}`

    lines.push(`LEFT SECTION of footer: Include a city skyline silhouette, then display these contact details:`)
    lines.push(`- Hashtag: ${hashtag} (prominent, green color)`)
    lines.push(`- Website: ${website}`)
    lines.push(`- Social handle: ${social}`)

    // Add optional contact info from FooterContactContext
    if (footerContact?.phone) {
      lines.push(`- Phone: ${footerContact.phone}`)
    }
    if (footerContact?.email) {
      lines.push(`- Email: ${footerContact.email}`)
    }
  }

  // Partner logo section
  if (footerStyle.rightSection === 'partner_logo') {
    const partnerLabel = footerStyle.partnerInfo?.partnerLabel || 'Digital Partner'
    lines.push(`RIGHT SECTION of footer: Display "${partnerLabel}" label with space reserved for partner logo (will be overlaid in post-processing).`)
  }

  lines.push(`Footer text should be small, clean, and professional. Use adequate spacing between elements.`)

  return lines.join(' ')
}

/**
 * Convenience wrapper for standard Yi chapter footer
 * v4.1 - Simplified helper for common Yi footer pattern
 */
export function buildStandardYiFooter(params: {
  chapterName: string
  hashtag?: string
  website?: string
  socialHandle?: string
  partnerName?: string
  contactInfo?: FooterContactContext
}): string {
  return buildFooterStyleContext(
    {
      enabled: true,
      heightPercent: 10,
      leftSection: 'standard_yi',
      rightSection: 'partner_logo',
      chapterDetails: {
        chapterName: params.chapterName,
        hashtag: params.hashtag,
        website: params.website,
        socialHandle: params.socialHandle,
      },
      partnerInfo: {
        partnerLabel: 'Digital Partner',
        partnerName: params.partnerName,
      },
    },
    params.contactInfo
  )
}

// ============================================================
// EVENT DETAILS CARD CONTEXT (v4.1 → v4.2 Story-Driven)
// ============================================================

/**
 * Build event details card context for date/time/venue
 * v4.1 - Creates white rounded rectangle card with icons + structured info
 * v4.2 - Story-driven dynamic styling based on vibe/mood from Design Intelligence
 */
export function buildEventDetailsCardContext(
  cardConfig?: EventDetailsCardConfig,
  eventData?: { date?: string; time?: string; venue?: string },
  designContext?: DesignContextForPrompt, // NEW v4.2: Design Intelligence context
  colorSource?: any // NEW v6.12: For text color validation
): string {
  if (!cardConfig?.enabled || !eventData) return ''

  const position = cardConfig.position || 'bottom-center'
  const includeIcons = cardConfig.includeIcons !== false  // Default true

  // === v4.2: STORY-DRIVEN STYLING ===
  // Extract vibe, sophistication, and energy from Design Intelligence
  const vibe = designContext?.vibeAndMood?.vibeKeywords?.[0] || 'balanced'
  const sophisticationLevel = designContext?.decorativeElementsContext?.sophisticationLevel || 'balanced'
  const energyLevel = designContext?.vibeAndMood?.energyDynamics || 'static'
  const emotionalTemp = designContext?.vibeAndMood?.emotionalTemperature || 'neutral'
  const storyContext = designContext?.storyAnalysis?.narrative

  // Dynamic border-radius based on sophistication
  const borderRadiusValue =
    sophisticationLevel === 'refined' ? 16 :
      sophisticationLevel === 'playful' ? 24 :
        12

  const borderRadiusDesc =
    sophisticationLevel === 'refined' ? 'elegantly rounded corners (16px radius)' :
      sophisticationLevel === 'playful' ? 'playfully rounded corners (24px radius)' :
        'moderately rounded corners (12px radius)'

  // Dynamic shadow based on energy level
  const shadowIntensity =
    energyLevel === 'explosive' || energyLevel === 'pulsing' ? 'prominent' :
      energyLevel === 'flowing' ? 'medium' :
        'subtle'

  const shadowDesc =
    shadowIntensity === 'prominent' ? 'prominent drop shadow for high energy and visual lift' :
      shadowIntensity === 'medium' ? 'moderate shadow for balanced depth' :
        'subtle shadow for refined, understated elegance'

  // Dynamic background color based on emotional temperature
  const bgColorValue =
    cardConfig.backgroundColor ||
    (emotionalTemp === 'warm' ? 'warm white (#FFF8F0)' :
      emotionalTemp === 'cool' ? 'cool white (#F8FBFF)' :
        'pure white (#FFFFFF)')

  // NEW v6.12: Calculate WCAG-compliant text color for card content
  // Extract hex from background description
  const bgHex = bgColorValue.match(/#[A-Fa-f0-9]{6}/)?.[0] || '#FFFFFF'

  // Get contrast-safe text color (prefer existing body color if valid)
  const cardTextColor = getContrastSafeTextColor(
    bgHex,
    colorSource?.body?.color,
    {
      targetLevel: 'AA',
      isLargeText: false,  // Venue text is normal size
      preserveHue: false   // Prioritize contrast over hue
    }
  )

  // Build the context
  const lines: string[] = []

  // Add story context if available
  if (storyContext) {
    lines.push(`EVENT DETAILS CARD (Story-Driven Styling):`)
    lines.push(`Story Context: ${storyContext}`)
    lines.push(`Vibe: ${vibe} | Sophistication: ${sophisticationLevel} | Energy: ${energyLevel}`)
  } else {
    lines.push(`EVENT DETAILS CARD:`)
  }

  lines.push(`Create a ${bgColorValue} rounded rectangle card positioned at ${position} of the main content zone.`)
  lines.push(`STYLING (AI-Analyzed): ${borderRadiusDesc}, ${shadowDesc}.`)
  lines.push(`This styling was chosen to match the event's ${vibe} vibe and ${sophisticationLevel} sophistication level.`)

  if (includeIcons) {
    lines.push(`Inside the card, display event details with icons:`)
    if (eventData.date) {
      lines.push(`- Calendar icon followed by: ${eventData.date}`)
    }
    if (eventData.time) {
      lines.push(`- Clock icon followed by: ${eventData.time}`)
    }
    if (eventData.venue) {
      lines.push(`- Location pin icon followed by: ${eventData.venue}`)
    }
  } else {
    lines.push(`Inside the card, display event details in a clean, left-aligned format:`)
    if (eventData.date) lines.push(`- ${eventData.date}`)
    if (eventData.time) lines.push(`- ${eventData.time}`)
    if (eventData.venue) lines.push(`- ${eventData.venue}`)
  }

  lines.push(`The card should have adequate padding (16-24px) and clean typography. Text inside the card should be left-aligned for structured readability.`)

  // NEW v6.12: Inject WCAG-compliant text color specification
  lines.push(`CRITICAL TEXT COLOR SPECIFICATION: All text inside this card MUST use ${cardTextColor} for WCAG AA compliance with ${bgHex} background (verified contrast).`)
  lines.push(`DO NOT substitute or approximate this text color - accessibility requirement.`)

  return lines.join(' ')
}

// ============================================================
// COMBINED v4.1 CONTEXT BUILDER (v4.2 Story-Driven Enhanced)
// ============================================================

/**
 * Build all v4.1 contexts together
 * Convenience function for format builders
 * v4.2 - Added designContext for story-driven event details card styling
 */
export function buildAllV41Contexts(options: {
  textAlignment?: TextAlignmentMap
  textShadow?: TextShadowConfig
  headerLogoBand?: HeaderLogoBandConfig
  footerStyle?: FooterStyleConfig
  footerContext?: FooterContactContext
  eventDetailsCard?: EventDetailsCardConfig
  eventData?: { date?: string; time?: string; venue?: string }
  designContext?: DesignContextForPrompt // NEW v4.2: Story-driven design context
  colorSource?: any // NEW v6.12: For text color validation
}): string {
  const contexts: string[] = []

  const alignmentContext = buildTextAlignmentContext(options.textAlignment)
  if (alignmentContext) contexts.push(alignmentContext)

  const shadowContext = buildTextShadowContext(options.textShadow)
  if (shadowContext) contexts.push(shadowContext)

  const headerBandContext = buildHeaderLogoBandContext(options.headerLogoBand)
  if (headerBandContext) contexts.push(headerBandContext)

  const footerStyleContext = buildFooterStyleContext(options.footerStyle, options.footerContext)
  if (footerStyleContext) contexts.push(footerStyleContext)

  // v4.2: Pass designContext for story-driven styling
  // v6.12: Pass colorSource for WCAG text color validation
  const eventCardContext = buildEventDetailsCardContext(
    options.eventDetailsCard,
    options.eventData,
    options.designContext,
    options.colorSource
  )
  if (eventCardContext) contexts.push(eventCardContext)

  return contexts.join('\n\n')
}
