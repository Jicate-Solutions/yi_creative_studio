/**
 * Web Banner Prompt Builder v3.1
 * Generates XML-structured prompts for display web banners
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Theme and organization context (v3.1)
 * - Size variations for different banner formats
 */

import type { WebBannerFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLanguageContext,
} from '../context-helpers'
import { WEB_BANNER_EXAMPLES } from '../examples'

// ============================================================
// SIZE VARIATIONS (v3.1)
// ============================================================

interface BannerSizeContext {
  dimensions: string
  layout: string
  textGuidance: string
  structure: string
  maxWords: number
}

function getBannerLayoutForSize(size?: string): BannerSizeContext {
  const sizeContexts: Record<string, BannerSizeContext> = {
    leaderboard: {
      dimensions: '728x90 pixels',
      layout: 'Horizontal strip layout - Text left/center, CTA right',
      textGuidance: 'Max 5-7 words headline, ultra-compact',
      structure: 'Logo left 15% → Headline center 55% → CTA right 30%',
      maxWords: 7,
    },
    'medium_rectangle': {
      dimensions: '300x250 pixels',
      layout: 'Compact square layout - Stacked elements',
      textGuidance: 'Headline 3-5 words, room for supporting text',
      structure: 'Logo top 15% → Headline 35% → Value prop 25% → CTA 25%',
      maxWords: 10,
    },
    'wide_skyscraper': {
      dimensions: '160x600 pixels',
      layout: 'Tall vertical layout - Stacked elements, headline at eye level',
      textGuidance: 'Short punchy headline, vertically stacked info',
      structure: 'Logo top 10% → Headline 20% → Value 40% → CTA bottom 30%',
      maxWords: 8,
    },
    billboard: {
      dimensions: '970x250 pixels',
      layout: 'Ultra-wide cinematic layout - Visual left, text right',
      textGuidance: 'Room for longer headline and subtext',
      structure: 'Visual left 40% → Headline+Value center 35% → CTA right 25%',
      maxWords: 12,
    },
    'large_rectangle': {
      dimensions: '336x280 pixels',
      layout: 'Larger square layout - More content space',
      textGuidance: 'Good space for headline and value proposition',
      structure: 'Logo top 12% → Headline 30% → Value 30% → CTA 28%',
      maxWords: 12,
    },
    'half_page': {
      dimensions: '300x600 pixels',
      layout: 'Tall vertical half-page - Rich content space',
      textGuidance: 'Room for detailed messaging and imagery',
      structure: 'Logo top 8% → Visual 25% → Headline 20% → Value 27% → CTA 20%',
      maxWords: 15,
    },
  }
  return sizeContexts[size?.toLowerCase().replace(/ /g, '_') || 'medium_rectangle'] || sizeContexts.medium_rectangle
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildWebBannerPrompt(
  data: WebBannerFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Get size context (v3.1)
  const bannerSize = options.formatSize || data.size || 'medium_rectangle'
  const sizeContext = getBannerLayoutForSize(bannerSize)

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'web_banner')

  // NEW v3.1: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const langContext = buildLanguageContext(options.language)

  // Determine colors - use brand colors if available
  const colorScheme = options.brandContext?.primaryColor
    ? `Brand advertising: ${options.brandContext.primaryColor} primary, ${options.brandContext.accentColor || 'contrasting'} for CTA`
    : data.colorScheme || 'Bold, contrasting (CTA should pop against background)'

  return `
<task>Generate a high-converting web banner advertisement</task>

<format>
Type: Display Web Banner
Size: ${bannerSize} (${sizeContext.dimensions})
Purpose: Drive clicks, communicate value proposition, convert viewers
Context: Will appear on websites alongside other content - must stand out
Layout Strategy: ${sizeContext.layout}
</format>

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${langContext}

<subject>
A click-driving banner ad with message: "${data.headline}"
Goal: Capture attention in 1-2 seconds and drive clicks to landing page.
Must work as a standalone ad unit on various website backgrounds.
Size-specific: ${sizeContext.textGuidance}
</subject>

<composition>
Layout: ${sizeContext.layout}
Size-Specific Structure: ${sizeContext.structure}

Flow: Left-to-right (for LTR audiences)
- LOGO: ${options.logoAwareness?.hasLogo ? `${options.logoAwareness.logoPosition} (kept clear for overlay)` : 'Small brand element, left side'}
- HEADLINE: "${data.headline}" - primary message, immediately visible (max ${sizeContext.maxWords} words for this size)
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
Typography: Bold, readable at ${bannerSize} size, clear hierarchy
CTA Treatment: Button-style, high contrast with background, clearly clickable
</style>

${WEB_BANNER_EXAMPLES}

<quality_markers>
- ATTENTION TEST: Captures attention within 1-2 seconds
- CLICK TEST: CTA is obviously a clickable button
- MESSAGE TEST: Single clear message (not competing messages)
- STANDOUT TEST: Stands out on various website backgrounds
- SIZE TEST: Layout optimized for ${bannerSize} dimensions
- QUALITY TEST: Professional digital advertising quality
${options.logoAwareness?.hasLogo ? '- Logo area clean for overlay' : ''}
${options.brandContext ? '- Brand colors properly applied' : ''}
</quality_markers>

<constraints>
Avoid: Cluttered layout, too much text for banner size, no clear CTA, low contrast, competing messages, tiny unreadable fonts, looks like content not an ad, too subtle to notice
${bannerSize === 'leaderboard' ? 'For Leaderboard: Keep text extremely minimal (5 words max), horizontal flow only' : ''}
${bannerSize === 'wide_skyscraper' ? 'For Skyscraper: Stack elements vertically, avoid horizontal layouts' : ''}
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>

<render_constraints>
CRITICAL: Only render text that appears inside <text role="...">content</text> tags.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Advertising terminology (CTA, conversion, click-driving)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID
</render_constraints>
`.trim()
}

// Export for use elsewhere
export { WEB_BANNER_EXAMPLES }
