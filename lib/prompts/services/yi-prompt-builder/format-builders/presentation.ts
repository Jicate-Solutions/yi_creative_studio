/**
 * Presentation Slide Prompt Builder v3.1
 * Generates XML-structured prompts for presentation title slides
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Theme and organization context (v3.1)
 * - Aspect ratio variations and presentation type contexts
 */

import type { PresentationFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLayoutZoneContext,
  buildLanguageContext,
} from '../context-helpers'
import { PRESENTATION_EXAMPLES } from '../examples'

// Import logo zone enforcement helper (v3.4)
import { buildForbiddenZonesSection, buildZoneReminderSection } from '../helpers/logo-zone-enforcement'
import { getSophistication, getIntegratedZoneContext } from '../helpers/sophistication-helper'

// Import decorative elements injector (v4.4)
import { buildDecorativeElementsSection, buildBackgroundSettingSection } from '../helpers/decorative-elements-injector'

// ============================================================
// ASPECT RATIO CONTEXTS (v3.1)
// ============================================================

interface AspectRatioContext {
  name: string
  dimensions: string
  usage: string
  layoutAdvice: string
}

function getAspectRatioContext(aspectRatio?: string): AspectRatioContext {
  const aspectContexts: Record<string, AspectRatioContext> = {
    '16:9': {
      name: 'Widescreen',
      dimensions: '1920x1080 equivalent',
      usage: 'Modern projectors, HD displays, online presentations',
      layoutAdvice: 'Wide layout, content can extend horizontally, cinematic feel',
    },
    '4:3': {
      name: 'Standard',
      dimensions: '1024x768 equivalent',
      usage: 'Older projectors, some conference systems',
      layoutAdvice: 'More vertical space, content should be centered, classic feel',
    },
    '16:10': {
      name: 'Widescreen (macOS)',
      dimensions: '1920x1200 equivalent',
      usage: 'Mac displays, some business laptops',
      layoutAdvice: 'Slightly taller than 16:9, more vertical content space',
    },
  }
  return aspectContexts[aspectRatio || '16:9'] || aspectContexts['16:9']
}

// ============================================================
// PRESENTATION TYPE CONTEXTS (v3.1)
// ============================================================

interface PresentationTypeContext {
  mood: string
  visualStyle: string
  colorAdvice: string
  typographyAdvice: string
}

function getPresentationTypeContext(presentationType?: string): PresentationTypeContext {
  const typeContexts: Record<string, PresentationTypeContext> = {
    corporate: {
      mood: 'Professional, trustworthy, business-appropriate',
      visualStyle: 'Clean, minimal, corporate polish',
      colorAdvice: 'Brand colors, navy blues, professional palette',
      typographyAdvice: 'Clean sans-serif, professional weights',
    },
    keynote: {
      mood: 'Inspiring, visionary, executive presence',
      visualStyle: 'Bold, impactful, memorable',
      colorAdvice: 'High contrast, dramatic darks with bright accents',
      typographyAdvice: 'Large bold titles, cinematic feel',
    },
    academic: {
      mood: 'Scholarly, credible, research-focused',
      visualStyle: 'Clean, organized, data-friendly',
      colorAdvice: 'Traditional academic colors, muted professional tones',
      typographyAdvice: 'Clear hierarchy, readable at distance',
    },
    workshop: {
      mood: 'Engaging, interactive, practical',
      visualStyle: 'Friendly, approachable, not intimidating',
      colorAdvice: 'Warm, inviting colors with good contrast',
      typographyAdvice: 'Friendly but professional fonts',
    },
    pitch: {
      mood: 'Confident, compelling, investment-worthy',
      visualStyle: 'Modern, startup aesthetic, clean',
      colorAdvice: 'Bold accent on dark or white, startup-appropriate',
      typographyAdvice: 'Modern sans-serif, confident weights',
    },
  }
  return typeContexts[presentationType || 'corporate'] || typeContexts.corporate
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildPresentationPrompt(
  data: PresentationFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Get aspect ratio and type contexts (v3.1)
  const aspectContext = getAspectRatioContext(data.aspectRatio)
  const typeContext = getPresentationTypeContext(options.contentType)

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, `presentation_${data.aspectRatio?.replace(':', '_') || '16_9'}`)

  // NEW v3.1: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const layoutContext = buildLayoutZoneContext(options.layout)
  const langContext = buildLanguageContext(options.language)

  // NEW v4.1: Sophistication Logic
  const sophistication = getSophistication(options, 'balanced')

  // NEW v3.4: Build forbidden zones (Sophistication-Aware)
  const { forbiddenZonesContext, zoneReminderContext } = getIntegratedZoneContext(options, sophistication)

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

  // NEW v4.4: Inject detailed decorative elements and background settings from Design Intelligence/Story Logic
  const decorativeSection = buildDecorativeElementsSection({
    eventType: 'presentation_slide',
    designContext: options.designContext,
    sophistication: sophistication,
    includeIconicImagery: true,
  });

  const backgroundSection = buildBackgroundSettingSection(options.designContext, sophistication);

  // Determine colors - use brand colors if available
  const colorScheme = options.brandContext?.primaryColor
    ? `Brand professional: ${options.brandContext.primaryColor} accent, ${options.brandContext.secondaryColor || 'white'} text on dark OR dark text on light`
    : typeContext.colorAdvice

  return `
<task>Generate a professional presentation title slide</task>

<format>
Type: Presentation Title Slide
Aspect Ratio: ${data.aspectRatio || '16:9'} ${aspectContext.name} (${aspectContext.dimensions})
Purpose: Open a presentation, establish topic and presenter, set professional tone
Viewing Context: Projected on large screen, viewed from distance (back of conference room)
Presentation Type: ${options.contentType || 'corporate'}
</format>

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${layoutContext}

${langContext}

${forbiddenZonesContext}

${aiTypographySection}

${decorativeSection}

${backgroundSection}

<subject>
A professional presentation title slide for: "${data.presentationTitle}"
${options.organizationContext?.name ? `Organization: ${options.organizationContext.name}` : ''}
This is the opening slide - it should be clean, impactful, and set the professional tone for the presentation.
Will be projected on large screen and must be readable from back of room.
Presentation Style: ${typeContext.mood}
</subject>

<composition>
Layout: ${options.designContext?.layoutSuggestion || 'Clean, centered, minimal - designed for projection'}
Aspect Ratio Note: ${aspectContext.layoutAdvice}

Structure:
- TITLE: "${data.presentationTitle}" - dominant central element (LARGEST, readable from 30+ feet)
${data.subtitle ? `- SUBTITLE: "${data.subtitle}" - below title, lighter weight` : ''}
${data.presenterName ? `- PRESENTER: "${data.presenterName}${data.presenterTitle ? ', ' + data.presenterTitle : ''}" - lower section${options.speakerPhotoConfig?.enabled ? ' (with photo zone)' : ' (TEXT ONLY)'}` : ''}
${data.eventName ? `- EVENT: "${data.eventName}${data.presentationDate ? ' | ' + data.presentationDate : ''}" - bottom` : ''}
- LOGO: ${options.logoAwareness?.hasLogo ? `${options.logoAwareness.logoPosition} (kept clear for overlay)` : 'Organization logo in corner'}
- SAFE MARGINS: 5% on all sides (for projector cropping)

Background: ${options.designContext?.backgroundSetting || data.backgroundStyle || 'Professional dark gradient (deep blue, charcoal)'} suitable for projection
Visual Style: ${typeContext.visualStyle}
Contrast: HIGH - must be readable on various projectors and screens
</composition>

<text_content>
<text role="title" prominence="LARGEST" style="${typeContext.typographyAdvice}, centered, high contrast, 48pt+ equivalent">${data.presentationTitle}</text>
${data.subtitle ? `<text role="subheadline" prominence="medium" style="lighter weight, below title, 24pt+ equivalent">${data.subtitle}</text>` : ''}
${data.presenterName ? `<text role="speaker" prominence="small" style="professional, lower section">${data.presenterName}${data.presenterTitle ? ', ' + data.presenterTitle : ''}</text>` : ''}
${data.eventName ? `<text role="venue" prominence="small" style="bottom area">${data.eventName}${data.presentationDate ? ' | ' + data.presentationDate : ''}</text>` : ''}
${data.eventNote ? `<text role="note" prominence="small" style="footer text, bottom margin">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: ${typeContext.visualStyle}
Color Palette: ${colorScheme}
${options.brandContext ? `Brand Integration: ${options.brandContext.primaryColor} as accent color` : ''}
Mood: ${typeContext.mood}
Typography:
  - Title: Large, bold, readable from back of room (48pt+ equivalent)
  - ${typeContext.typographyAdvice}
  - Body: Minimum 24pt equivalent for any text
  - HIGH CONTRAST with background
</style>

${PRESENTATION_EXAMPLES}

<quality_markers>
- DISTANCE TEST: Readable from the back of a large conference room (30+ feet)
- PROJECTION TEST: Works well on various projectors (high contrast)
- PROFESSIONAL TEST: ${options.contentType || 'Corporate'} appropriate
- CLEAN TEST: Not cluttered, focused on essential info
- TONE TEST: Sets appropriate ${typeContext.mood.toLowerCase()} tone for presentation
- ASPECT TEST: Optimized for ${data.aspectRatio || '16:9'} ${aspectContext.name} format
${options.logoAwareness?.hasLogo ? '- Logo area clean for overlay' : ''}
${options.brandContext ? '- Brand colors properly integrated' : ''}
</quality_markers>

<constraints>
Avoid: Tiny text (under 24pt equivalent), low contrast (gray on gray, etc.), cluttered design, too much information on title slide, busy backgrounds, hard to read from distance, animation suggestions (static image only)
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
${data.presenterName && !options.speakerPhotoConfig?.enabled ? `IMPORTANT - NO PRESENTER PLACEHOLDER: The presenter "${data.presenterName}" appears as TEXT ONLY. DO NOT create any circular frames, photo placeholders, person silhouettes, or visual representation of a person. Render only the name and title as text.` : ''}
</constraints>

${options?.preventionEnhancements?.length ? `
LEARNED IMPROVEMENTS (from past feedback):
${options.preventionEnhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}
` : ''}

<render_constraints>
CRITICAL: Only render text that appears inside <text role="...">content</text> tags.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Presentation terminology (projection, aspect ratio, distance)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID

STRICT CTA PROHIBITION:
- DO NOT invent or add any Call-to-Action buttons, links, or text unless explicitly provided in <text role="cta">
- If NO <text role="cta"> tag exists above, the design MUST NOT contain ANY CTA elements
- BLACKLISTED CTA PHRASES (never render unless explicitly in user data):
  "Learn More", "Shop Now", "Sign Up", "Get Started", "Buy Now", "Click Here",
  "Subscribe", "Join Now", "Register", "Download", "Contact Us", "Read More",
  "Book Now", "Order Now", "Try Free", "Start Free", "Explore", "Discover"
</render_constraints>

${zoneReminderContext}
`.trim()
}

// Export for use elsewhere
export { PRESENTATION_EXAMPLES }
