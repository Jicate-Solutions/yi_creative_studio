/**
 * Social Post Prompt Builder v3.0 (Facebook/Twitter)
 * Generates XML-structured prompts for social media post designs
 * Enhanced with logo awareness, brand context, and quality context
 */

import type { SocialPostFormData, EnhancedBuildOptions } from '../types'
import { buildLogoContext, buildBrandContext, buildQualityContext } from '../context-helpers'
import { INSTAGRAM_POST_EXAMPLES } from '../examples' // Social posts use similar patterns

// ============================================================
// PLATFORM CONTEXTS
// ============================================================

interface PlatformContext {
  aspectRatio: string
  viewingContext: string
  style: string
  colors: string
  energy: string
}

function getPlatformContext(platform: string = 'facebook'): PlatformContext {
  const contexts: Record<string, PlatformContext> = {
    facebook: {
      aspectRatio: '1.91:1 (1200x628) or Square 1:1',
      viewingContext: 'Facebook feed on desktop and mobile, competing with friend updates and news',
      style: 'Social, shareable, engaging',
      colors: 'Vibrant, social, brand-appropriate',
      energy: 'Friendly, engaging',
    },
    twitter: {
      aspectRatio: '16:9 (1200x675) or Square 1:1',
      viewingContext: 'Twitter/X timeline, fast-scrolling feed, must capture attention quickly',
      style: 'Punchy, concise, impactful',
      colors: 'Bold, contrasty, attention-grabbing',
      energy: 'Quick, punchy, immediate',
    },
  }

  return contexts[platform] || contexts.facebook
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildSocialPostPrompt(
  data: SocialPostFormData,
  formatId?: string,
  options: EnhancedBuildOptions = {}
): string {
  const platform = data.platform || (formatId?.includes('twitter') ? 'twitter' : 'facebook')
  const platformContext = getPlatformContext(platform)
  const platformName = platform === 'twitter' ? 'Twitter/X' : 'Facebook'

  // Build context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'social_post')

  // Determine colors - use brand colors if available
  const colors = options.brandContext?.primaryColor
    ? `Brand social: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}`
    : platformContext.colors

  return `
<task>Generate a scroll-stopping ${platformName} post that demands attention and drives engagement</task>

<format>
Type: ${platformName} Post
Aspect Ratio: ${platformContext.aspectRatio}
Purpose: Stop the scroll, communicate message instantly, drive engagement and sharing
Platform: ${platformName}
Viewing Context: ${platformContext.viewingContext}
</format>

${logoContext}

${brandContext}

${qualityContext}

<subject>
An attention-grabbing social media graphic for: "${data.postTitle}"
Post Type: ${data.postType || 'Announcement'}
Platform: ${platformName}
Must capture attention within 0.5-1 second of viewing in a busy feed.
</subject>

<composition>
Layout: Bold, uncluttered design with clear focal point

Structure:
- BACKGROUND: ${platformContext.style} background ${options.brandContext ? `incorporating brand colors (${options.brandContext.primaryColor})` : 'that stands out in feed'}
- HEADLINE: "${data.postTitle}" - primary message, dominant element
${data.postCaption ? `- SUPPORTING: "${data.postCaption}" - smaller supporting text` : ''}
${data.callToAction ? `- CTA: "${data.callToAction}" - button-style or highlighted` : ''}
- LOGO: ${options.logoAwareness?.hasLogo ? `${options.logoAwareness.logoPosition} kept clear for overlay` : 'Subtle brand element in corner'}
- BREATHING ROOM: Generous space around all elements

Text Sizing: All text must be readable on mobile phone without zooming
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold thick sans-serif, maximum contrast">${data.postTitle}</text>
${data.postCaption ? `<text role="supporting" prominence="medium" style="clean sans-serif, readable on mobile">${data.postCaption}</text>` : ''}
${data.callToAction ? `<text role="cta" prominence="prominent" style="button-style, contrasting accent color">${data.callToAction}</text>` : ''}
</text_content>

<style>
Visual Style: ${platformContext.style}
Color Palette: ${colors}
Mood: Engaging, shareable, social
Typography: Bold, thick fonts that work on mobile; avoid thin or delicate fonts
Energy: ${platformContext.energy}
</style>

${INSTAGRAM_POST_EXAMPLES}

<quality_markers>
- SCROLL-STOP TEST: Would this make you stop scrolling in your feed?
- MOBILE TEST: All text readable on phone screen without zooming
- SHARE TEST: Would someone share this with friends?
- ENGAGEMENT TEST: Design encourages likes, shares, comments
- BRAND TEST: ${options.brandContext ? 'Brand colors properly integrated' : 'Professional social media quality'}
${options.logoAwareness?.hasLogo ? '- Logo area clean for overlay' : ''}
</quality_markers>

<constraints>
Avoid: Tiny text, cluttered composition, low contrast, boring/generic look that blends into feed, too much text (keep concise), thin fonts, busy background under text, hard to read on small screen, muted colors
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>
`.trim()
}

// Export for use elsewhere
export { INSTAGRAM_POST_EXAMPLES as SOCIAL_POST_EXAMPLES }
