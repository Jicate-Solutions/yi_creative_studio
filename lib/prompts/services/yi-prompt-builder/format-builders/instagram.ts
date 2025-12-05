/**
 * Instagram Post Prompt Builder v3.0
 * Generates XML-structured prompts for Instagram post designs
 * Enhanced with logo awareness, brand context, and quality context
 */

import type { InstagramFormData, EnhancedBuildOptions } from '../types'
import { buildLogoContext, buildBrandContext, buildQualityContext } from '../context-helpers'
import { INSTAGRAM_POST_EXAMPLES } from '../examples'

// ============================================================
// INSTAGRAM CONTEXTS
// ============================================================

interface InstagramContext {
  layout: string
  background: string
  visualTreatment: string
  style: string
  colors: string
  mood: string
  goal: string
  headlineStyle: string
  ctaStyle: string
  energy: string
}

function getInstagramContext(postType: string = 'announcement'): InstagramContext {
  const contexts: Record<string, InstagramContext> = {
    announcement: {
      layout: 'Centered impact layout with headline as hero',
      background: 'Vibrant gradient (coral to orange, or brand colors)',
      visualTreatment: 'Bold, energetic, celebratory feel',
      style: 'Announcement, exciting, news-worthy',
      colors: 'Vibrant, saturated, high contrast (coral, orange, or brand palette)',
      mood: 'Exciting, important, attention-demanding',
      goal: 'Announce news and generate excitement',
      headlineStyle: 'extra-bold white, high contrast',
      ctaStyle: 'button-style, contrasting accent',
      energy: 'High energy, celebratory',
    },
    quote: {
      layout: 'Quote-centered layout with large quotation marks as design element',
      background: 'Elegant gradient or solid background (deep purple, navy)',
      visualTreatment: 'Sophisticated, thoughtful, inspirational',
      style: 'Inspirational quote, typography-focused',
      colors: 'Elegant, sophisticated (deep colors with light text)',
      mood: 'Thoughtful, inspiring, shareable',
      goal: 'Inspire and encourage sharing',
      headlineStyle: 'elegant serif or clean sans-serif, centered',
      ctaStyle: 'subtle, understated',
      energy: 'Contemplative, inspiring',
    },
    educational: {
      layout: 'Clear hierarchy with numbered or bulleted points if needed',
      background: 'Clean, professional background',
      visualTreatment: 'Organized, clear, informative',
      style: 'Educational, helpful, informative',
      colors: 'Professional, trustworthy (blues, greens)',
      mood: 'Helpful, authoritative, valuable',
      goal: 'Educate and provide value',
      headlineStyle: 'bold sans-serif, professional',
      ctaStyle: 'clear, action-oriented',
      energy: 'Informative, helpful',
    },
    promotional: {
      layout: 'Product/offer focused with clear CTA',
      background: 'Bold, commercial, attention-grabbing',
      visualTreatment: 'Sales-oriented, urgent, compelling',
      style: 'Promotional, sale, marketing',
      colors: 'Bold, contrasting, commercial (red accents for urgency)',
      mood: 'Urgent, valuable, action-driving',
      goal: 'Drive clicks and conversions',
      headlineStyle: 'impact bold, urgency colors',
      ctaStyle: 'prominent button, contrasting',
      energy: 'Urgent, action-driving',
    },
    motivational: {
      layout: 'Inspiring visual with overlaid text',
      background: 'Uplifting gradient or inspiring imagery suggestion',
      visualTreatment: 'Positive, uplifting, empowering',
      style: 'Motivational, inspiring',
      colors: 'Warm, uplifting (sunrise colors, optimistic palette)',
      mood: 'Empowering, positive, shareable',
      goal: 'Motivate and inspire engagement',
      headlineStyle: 'bold inspiring, warm colors',
      ctaStyle: 'encouraging, positive',
      energy: 'Uplifting, empowering',
    },
  }

  return contexts[postType] || contexts.announcement
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildInstagramPrompt(
  data: InstagramFormData,
  options: EnhancedBuildOptions = {}
): string {
  const postContext = getInstagramContext(data.postType)

  // Build context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'instagram_post')

  // Determine colors - use brand colors if available
  const colors = options.brandContext?.primaryColor
    ? `Brand colors: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}`
    : postContext.colors

  return `
<task>Generate a scroll-stopping Instagram post that demands attention in a crowded feed</task>

<format>
Type: Instagram Feed Post
Aspect Ratio: Square 1:1 (1080x1080 equivalent)
Purpose: Stop the scroll, communicate message instantly, drive engagement
Post Type: ${data.postType || 'Announcement'}
Viewing Context: Mobile phone feed, thumbnail size initially, competing with many posts
</format>

${logoContext}

${brandContext}

${qualityContext}

<subject>
An eye-catching social media graphic that will STOP THE SCROLL.
Main Message: "${data.postTitle}"
Goal: ${postContext.goal}
Critical: Must capture attention within 0.5-1 second of viewing in feed.
</subject>

<composition>
Layout: ${postContext.layout}

Structure:
- BACKGROUND: ${postContext.background} ${options.brandContext ? `incorporating brand colors (${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'})` : ''}
- HEADLINE: "${data.postTitle}" - LARGE, BOLD, instantly readable on phone screen
${data.postCaption ? `- SUPPORTING TEXT: "${data.postCaption}" - smaller but still readable on mobile` : ''}
${data.callToAction ? `- CTA: "${data.callToAction}" - button-style or highlighted` : ''}
- LOGO ZONE: ${options.logoAwareness?.hasLogo ? `${options.logoAwareness.logoPosition} kept clear for logo overlay` : 'Small brand element in corner'}
- BREATHING ROOM: Generous white/negative space - NOT cramped

Text Sizing Rule: All text must be readable on a phone screen WITHOUT zooming
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold thick sans-serif, maximum contrast, ${postContext.headlineStyle}">${data.postTitle}</text>
${data.postCaption ? `<text role="supporting" prominence="medium" style="clean sans-serif, readable on mobile">${data.postCaption}</text>` : ''}
${data.callToAction ? `<text role="cta" prominence="prominent" style="button-style or arrow indicator, ${postContext.ctaStyle}">${data.callToAction}</text>` : ''}
</text_content>

<style>
Visual Style: ${postContext.style}
Color Palette: ${colors}
Mood: ${postContext.mood}
Typography:
  - Headlines: BOLD, THICK sans-serif (NOT thin or light weight)
  - Readable on phone without zooming
  - High contrast with background
Energy: ${postContext.energy}
</style>

${INSTAGRAM_POST_EXAMPLES}

<quality_markers>
- SCROLL-STOP TEST: Would this make you stop scrolling in your feed?
- MOBILE TEST: All text readable on phone screen without zooming
- CLARITY TEST: Single clear focal point, not cluttered
- ENGAGEMENT TEST: Design encourages like/comment/share
- BRAND TEST: ${options.brandContext ? 'Brand colors properly integrated' : 'Professional, polished look'}
${options.logoAwareness?.hasLogo ? '- Logo area clean and ready for overlay' : ''}
</quality_markers>

<constraints>
Avoid: Tiny text requiring zoom, cluttered composition with multiple competing elements, low contrast (text hard to read), boring/generic look that blends into feed, thin/light fonts that disappear, too much text (keep headline under 10 words), busy background under text, muted/dull colors that don't pop
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>
`.trim()
}

// Export for use elsewhere
export { INSTAGRAM_POST_EXAMPLES }
