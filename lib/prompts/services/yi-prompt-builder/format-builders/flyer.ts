/**
 * Flyer Prompt Builder v3.0
 * Generates XML-structured prompts for A4/A5 print flyers
 * Enhanced with logo awareness, brand context, and quality context
 */

import type { FlyerFormData, EnhancedBuildOptions } from '../types'
import { buildLogoContext, buildBrandContext, buildQualityContext } from '../context-helpers'
import { FLYER_EXAMPLES } from '../examples'

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildFlyerPrompt(
  data: FlyerFormData,
  options: EnhancedBuildOptions = {}
): string {
  const contactInfo = [data.contactPhone, data.contactEmail, data.websiteUrl].filter(Boolean)

  // Build context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'flyer')

  // Determine colors - use brand colors if available
  const colorScheme = options.brandContext?.primaryColor
    ? `Brand colors: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}, accent ${options.brandContext.accentColor || 'complementary'}`
    : data.colorScheme || 'Brand-appropriate, professional'

  return `
<task>Generate a professional print-ready promotional flyer</task>

<format>
Type: Promotional Flyer
Size: ${data.size || 'A4'} Portrait
Purpose: Physical/digital distribution, drive action, communicate offer
Usage: Print distribution, digital sharing, marketing material
</format>

${logoContext}

${brandContext}

${qualityContext}

<subject>
A professional marketing flyer for: "${data.flyerTitle}"
Must communicate value proposition and drive specific action.
Designed for both print and digital use.
</subject>

<composition>
Layout: Clear vertical hierarchy with defined zones

Zone Structure:
- HEADER (15%): Organization logo ${options.logoAwareness?.hasLogo ? `in ${options.logoAwareness.logoPosition} (kept clear for overlay)` : 'prominently at top'}
- HEADLINE (25%): "${data.flyerTitle}" - bold, attention-grabbing
- CONTENT (40%): Key information, benefits, details
- ACTION (20%): CTA, contact info, event details

Content Elements:
${data.flyerDescription ? `- Description: "${data.flyerDescription}"` : ''}
${data.eventDate ? `- Date: "${data.eventDate}" with calendar icon` : ''}
${data.eventTime ? `- Time: "${data.eventTime}" with clock icon` : ''}
${data.venue ? `- Venue: "${data.venue}" with location marker` : ''}
${data.price ? `- Price: "${data.price}" - highlighted/emphasized` : ''}
- CTA: "${data.callToAction || 'Contact Us Today'}" - prominent button/banner
${contactInfo.length > 0 ? `- Contact: ${contactInfo.join(' | ')}` : ''}

Background: ${data.backgroundStyle || 'Clean, professional gradient'} suitable for print
${options.brandContext ? `Brand Integration: Use ${options.brandContext.primaryColor} as primary, ${options.brandContext.secondaryColor || 'white'} as secondary` : ''}
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold, impactful, attention-grabbing">${data.flyerTitle}</text>
${data.flyerDescription ? `<text role="body" prominence="medium" style="clear, readable">${data.flyerDescription}</text>` : ''}
${data.eventDate ? `<text role="date" prominence="medium" style="bold with calendar icon">${data.eventDate}</text>` : ''}
${data.eventTime ? `<text role="time" prominence="medium" style="bold with clock icon">${data.eventTime}</text>` : ''}
${data.venue ? `<text role="venue" prominence="medium" style="clear with location icon">${data.venue}</text>` : ''}
${data.price ? `<text role="price" prominence="prominent" style="highlighted, badge or tag format">${data.price}</text>` : ''}
<text role="cta" prominence="prominent" style="button-style, high contrast">${data.callToAction || 'Contact Us Today'}</text>
${contactInfo.length > 0 ? `<text role="contact" prominence="small" style="clean, readable">${contactInfo.join(' | ')}</text>` : ''}
</text_content>

<style>
Visual Style: Professional marketing, print-ready
Color Palette: ${colorScheme}
Mood: Professional, trustworthy, action-driving
Typography: Clear hierarchy, readable at print size
Print Considerations: CMYK-safe colors, high contrast for readability
Icons: Clean, modern iconography for date/time/venue
</style>

${FLYER_EXAMPLES}

<quality_markers>
- PRINT TEST: Would look professional printed at ${data.size || 'A4'}
- SCAN TEST: 5-second scan reveals key info (what, when, where, how to act)
- HIERARCHY TEST: Clear visual flow from top to bottom
- LEGIBILITY TEST: All text readable at print size
- ACTION TEST: Clear CTA drives specific action
${options.logoAwareness?.hasLogo ? '- Logo area clean for overlay' : ''}
${options.brandContext ? '- Brand colors properly applied' : ''}
</quality_markers>

<constraints>
Avoid: Low resolution (not print-ready), web-only RGB colors, cluttered layout, tiny unreadable text, poor hierarchy, too many competing fonts, missing contact info
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>
`.trim()
}

// Export for use elsewhere
export { FLYER_EXAMPLES }
