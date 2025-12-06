/**
 * Flyer Prompt Builder v3.1
 * Generates XML-structured prompts for A4/A5 print flyers
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Theme and organization context (v3.1)
 * - Size variations for A4/A5 formats
 */

import type { FlyerFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLayoutZoneContext,
  buildLanguageContext,
} from '../context-helpers'
import { FLYER_EXAMPLES } from '../examples'

// ============================================================
// SIZE VARIATIONS (v3.1)
// ============================================================

interface FlyerSizeContext {
  dimensions: string
  margins: string
  textGuidance: string
  layoutAdvice: string
}

function getFlyerLayoutForSize(size?: string): FlyerSizeContext {
  const sizeContexts: Record<string, FlyerSizeContext> = {
    A4: {
      dimensions: '210mm × 297mm (8.27" × 11.69")',
      margins: 'generous margins (15mm minimum)',
      textGuidance: 'Multiple content zones allowed, detailed information acceptable',
      layoutAdvice: 'Full page - generous margins (15mm), multiple content zones, detailed information allowed',
    },
    A5: {
      dimensions: '148mm × 210mm (5.83" × 8.27")',
      margins: 'tighter margins (10mm)',
      textGuidance: 'Focused content, larger text for quick scanning',
      layoutAdvice: 'Half page - tighter margins (10mm), focused content, larger text for quick scanning',
    },
  }
  return sizeContexts[size || 'A4'] || sizeContexts.A4
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildFlyerPrompt(
  data: FlyerFormData,
  options: EnhancedBuildOptions = {}
): string {
  const contactInfo = [data.contactPhone, data.contactEmail, data.websiteUrl].filter(Boolean)

  // Get size context (v3.1)
  const flyerSize = options.formatSize || data.size || 'A4'
  const sizeContext = getFlyerLayoutForSize(flyerSize)

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'flyer')

  // NEW v3.1: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const layoutContext = buildLayoutZoneContext(options.layout)
  const langContext = buildLanguageContext(options.language)

  // Determine colors - use brand colors if available
  const colorScheme = options.brandContext?.primaryColor
    ? `Brand colors: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}, accent ${options.brandContext.accentColor || 'complementary'}`
    : data.colorScheme || 'Brand-appropriate, professional'

  return `
<task>Generate a professional print-ready promotional flyer</task>

<format>
Type: Promotional Flyer
Size: ${flyerSize} Portrait (${sizeContext.dimensions})
Purpose: Physical/digital distribution, drive action, communicate offer
Usage: Print distribution, digital sharing, marketing material
Layout Approach: ${sizeContext.layoutAdvice}
</format>

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${layoutContext}

${langContext}

<subject>
A professional marketing flyer for: "${data.flyerTitle}"
Print Size: ${flyerSize} - ${sizeContext.textGuidance}
Must communicate value proposition and drive specific action.
Designed for both print and digital use.
</subject>

<composition>
Layout: Clear vertical hierarchy with defined zones
Size-Specific: ${sizeContext.layoutAdvice}

Zone Structure (optimized for ${flyerSize}):
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
Margins: ${sizeContext.margins}
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
Typography: Clear hierarchy, readable at ${flyerSize} print size
Print Considerations: CMYK-safe colors, high contrast for readability
Icons: Clean, modern iconography for date/time/venue
</style>

${FLYER_EXAMPLES}

<quality_markers>
- PRINT TEST: Would look professional printed at ${flyerSize}
- SCAN TEST: 5-second scan reveals key info (what, when, where, how to act)
- HIERARCHY TEST: Clear visual flow from top to bottom
- LEGIBILITY TEST: All text readable at ${flyerSize} print size
- ACTION TEST: Clear CTA drives specific action
${options.logoAwareness?.hasLogo ? '- Logo area clean for overlay' : ''}
${options.brandContext ? '- Brand colors properly applied' : ''}
</quality_markers>

<constraints>
Avoid: Low resolution (not print-ready), web-only RGB colors, cluttered layout, tiny unreadable text, poor hierarchy, too many competing fonts, missing contact info
${flyerSize === 'A5' ? 'For A5: Avoid too much text - focus on essentials only' : ''}
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>

<render_constraints>
CRITICAL: Only render text that appears inside <text role="...">content</text> tags.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Print terminology (CMYK, margins, bleed)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID
</render_constraints>
`.trim()
}

// Export for use elsewhere
export { FLYER_EXAMPLES }
