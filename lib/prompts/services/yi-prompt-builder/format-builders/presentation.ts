/**
 * Presentation Slide Prompt Builder v3.0
 * Generates XML-structured prompts for presentation title slides
 * Enhanced with logo awareness, brand context, and quality context
 */

import type { PresentationFormData, EnhancedBuildOptions } from '../types'
import { buildLogoContext, buildBrandContext, buildQualityContext } from '../context-helpers'
import { PRESENTATION_EXAMPLES } from '../examples'

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildPresentationPrompt(
  data: PresentationFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Build context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, `presentation_${data.aspectRatio?.replace(':', '_') || '16_9'}`)

  // Determine colors - use brand colors if available
  const colorScheme = options.brandContext?.primaryColor
    ? `Brand professional: ${options.brandContext.primaryColor} accent, ${options.brandContext.secondaryColor || 'white'} text on dark OR dark text on light`
    : data.colorScheme || 'High contrast professional (dark background, white text OR white background, dark text)'

  return `
<task>Generate a professional presentation title slide</task>

<format>
Type: Presentation Title Slide
Aspect Ratio: ${data.aspectRatio || '16:9'} ${data.aspectRatio === '4:3' ? 'Standard' : 'Widescreen'}
Purpose: Open a presentation, establish topic and presenter, set professional tone
Viewing Context: Projected on large screen, viewed from distance (back of conference room)
</format>

${logoContext}

${brandContext}

${qualityContext}

<subject>
A professional presentation title slide for: "${data.presentationTitle}"
This is the opening slide - it should be clean, impactful, and set the professional tone for the presentation.
Will be projected on large screen and must be readable from back of room.
</subject>

<composition>
Layout: Clean, centered, minimal - designed for projection

Structure:
- TITLE: "${data.presentationTitle}" - dominant central element (LARGEST, readable from 30+ feet)
${data.subtitle ? `- SUBTITLE: "${data.subtitle}" - below title, lighter weight` : ''}
${data.presenterName ? `- PRESENTER: "${data.presenterName}${data.presenterTitle ? ', ' + data.presenterTitle : ''}" - lower section` : ''}
${data.eventName ? `- EVENT: "${data.eventName}${data.presentationDate ? ' | ' + data.presentationDate : ''}" - bottom` : ''}
- LOGO: ${options.logoAwareness?.hasLogo ? `${options.logoAwareness.logoPosition} (kept clear for overlay)` : 'Organization logo in corner'}
- SAFE MARGINS: 5% on all sides (for projector cropping)

Background: ${data.backgroundStyle || 'Professional dark gradient (deep blue, charcoal)'} suitable for projection
Contrast: HIGH - must be readable on various projectors and screens
</composition>

<text_content>
<text role="title" prominence="LARGEST" style="bold professional sans-serif, centered, high contrast, 48pt+ equivalent">${data.presentationTitle}</text>
${data.subtitle ? `<text role="subheadline" prominence="medium" style="lighter weight, below title, 24pt+ equivalent">${data.subtitle}</text>` : ''}
${data.presenterName ? `<text role="speaker" prominence="small" style="professional, lower section">${data.presenterName}${data.presenterTitle ? ', ' + data.presenterTitle : ''}</text>` : ''}
${data.eventName ? `<text role="venue" prominence="small" style="bottom area">${data.eventName}${data.presentationDate ? ' | ' + data.presentationDate : ''}</text>` : ''}
</text_content>

<style>
Visual Style: Professional presentation, corporate or academic appropriate
Color Palette: ${colorScheme}
${options.brandContext ? `Brand Integration: ${options.brandContext.primaryColor} as accent color` : ''}
Mood: Professional, authoritative, engaging
Typography:
  - Title: Large, bold, readable from back of room (48pt+ equivalent)
  - Body: Minimum 24pt equivalent for any text
  - HIGH CONTRAST with background
</style>

${PRESENTATION_EXAMPLES}

<quality_markers>
- DISTANCE TEST: Readable from the back of a large conference room (30+ feet)
- PROJECTION TEST: Works well on various projectors (high contrast)
- PROFESSIONAL TEST: Corporate boardroom appropriate
- CLEAN TEST: Not cluttered, focused on essential info
- TONE TEST: Sets appropriate professional tone for presentation
${options.logoAwareness?.hasLogo ? '- Logo area clean for overlay' : ''}
${options.brandContext ? '- Brand colors properly integrated' : ''}
</quality_markers>

<constraints>
Avoid: Tiny text (under 24pt equivalent), low contrast (gray on gray, etc.), cluttered design, too much information on title slide, busy backgrounds, hard to read from distance, animation suggestions (static image only)
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>
`.trim()
}

// Export for use elsewhere
export { PRESENTATION_EXAMPLES }
