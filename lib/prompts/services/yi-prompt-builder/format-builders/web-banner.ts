/**
 * Web Banner Prompt Builder v3.0
 * Generates XML-structured prompts for display web banners
 * Enhanced with logo awareness, brand context, and quality context
 */

import type { WebBannerFormData, EnhancedBuildOptions } from '../types'
import { buildLogoContext, buildBrandContext, buildQualityContext } from '../context-helpers'
import { WEB_BANNER_EXAMPLES } from '../examples'

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildWebBannerPrompt(
  data: WebBannerFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Build context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'web_banner')

  // Determine colors - use brand colors if available
  const colorScheme = options.brandContext?.primaryColor
    ? `Brand advertising: ${options.brandContext.primaryColor} primary, ${options.brandContext.accentColor || 'contrasting'} for CTA`
    : data.colorScheme || 'Bold, contrasting (CTA should pop against background)'

  return `
<task>Generate a high-converting web banner advertisement</task>

<format>
Type: Display Web Banner
Size: ${data.size || '728x90 Leaderboard'}
Purpose: Drive clicks, communicate value proposition, convert viewers
Context: Will appear on websites alongside other content - must stand out
</format>

${logoContext}

${brandContext}

${qualityContext}

<subject>
A click-driving banner ad with message: "${data.headline}"
Goal: Capture attention in 1-2 seconds and drive clicks to landing page.
Must work as a standalone ad unit on various website backgrounds.
</subject>

<composition>
Layout: Compact, efficient use of space for ${data.size || 'leaderboard'} format

Flow: Left-to-right (for LTR audiences)
- LOGO: ${options.logoAwareness?.hasLogo ? `${options.logoAwareness.logoPosition} (kept clear for overlay)` : 'Small brand element, left side'}
- HEADLINE: "${data.headline}" - primary message, immediately visible
${data.valueProposition ? `- VALUE: "${data.valueProposition}" - supporting message` : ''}
${data.offerDetails ? `- OFFER: "${data.offerDetails}" - highlighted special offer` : ''}
- CTA: "${data.callToAction || 'Learn More'}" - OBVIOUS, contrasting button, clearly clickable

Background: ${data.backgroundStyle || 'Bold gradient that stands out from typical website backgrounds'}
${options.brandContext ? `Brand Integration: Use ${options.brandContext.primaryColor} as primary, ${options.brandContext.accentColor || 'contrasting color'} for CTA button` : ''}
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold, attention-grabbing, high contrast">${data.headline}</text>
${data.valueProposition ? `<text role="value" prominence="medium" style="supporting, clean">${data.valueProposition}</text>` : ''}
${data.offerDetails ? `<text role="offer" prominence="prominent" style="highlighted, badge or special treatment">${data.offerDetails}</text>` : ''}
<text role="cta" prominence="prominent" style="BUTTON style, contrasting color, obviously clickable, hover-inviting">${data.callToAction || 'Learn More'}</text>
</text_content>

<style>
Visual Style: Digital advertising, conversion-focused
Color Palette: ${colorScheme}
Mood: Urgent (but not desperate), valuable, action-driving
Typography: Bold, readable at small banner sizes, clear hierarchy
CTA Treatment: Button-style, high contrast with background, clearly clickable
</style>

${WEB_BANNER_EXAMPLES}

<quality_markers>
- ATTENTION TEST: Captures attention within 1-2 seconds
- CLICK TEST: CTA is obviously a clickable button
- MESSAGE TEST: Single clear message (not competing messages)
- STANDOUT TEST: Stands out on various website backgrounds
- QUALITY TEST: Professional digital advertising quality
${options.logoAwareness?.hasLogo ? '- Logo area clean for overlay' : ''}
${options.brandContext ? '- Brand colors properly applied' : ''}
</quality_markers>

<constraints>
Avoid: Cluttered layout, too much text for banner size, no clear CTA, low contrast, competing messages, tiny unreadable fonts, looks like content not an ad, too subtle to notice
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>
`.trim()
}

// Export for use elsewhere
export { WEB_BANNER_EXAMPLES }
