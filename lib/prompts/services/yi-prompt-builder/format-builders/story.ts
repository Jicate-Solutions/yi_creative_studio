/**
 * Story Format Prompt Builder v3.0 (Instagram/WhatsApp)
 * Generates XML-structured prompts for vertical story designs
 * Enhanced with logo awareness, brand context, and quality context
 */

import type { StoryFormData, EnhancedBuildOptions } from '../types'
import { buildLogoContext, buildBrandContext, buildQualityContext } from '../context-helpers'
import { STORY_EXAMPLES } from '../examples'

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildStoryPrompt(
  data: StoryFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Build context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'story')

  // Determine colors - use brand colors if available
  const colorScheme = options.brandContext?.primaryColor
    ? `Brand gradient: ${options.brandContext.primaryColor} to ${options.brandContext.secondaryColor || 'white'}`
    : data.colorScheme || 'Vibrant, bold, high contrast'

  return `
<task>Generate a full-screen vertical story design optimized for mobile viewing</task>

<format>
Type: ${data.platform || 'Instagram'} Story
Aspect Ratio: Portrait 9:16 (1080x1920 equivalent)
Purpose: Capture attention in Stories feed, encourage swipe/tap action
Viewing Context: Full-screen mobile, brief viewing time (3-5 seconds)
</format>

${logoContext}

${brandContext}

${qualityContext}

<subject>
A thumb-stopping story graphic for: "${data.storyHeadline}"
Must capture attention and communicate message within 3 seconds.
Full-screen immersive experience.
Platform: ${data.platform || 'Instagram'} Stories
</subject>

<composition>
Layout: Full-bleed vertical design with safe zones

CRITICAL SAFE ZONE RULES:
- TOP 15%: AVOID - platform UI covers this area (story bar, profile info)
- CENTER 65%: SAFE ZONE - all important content goes here
- BOTTOM 20%: AVOID - reply box, navigation covers this area

Content Placement:
- Main headline centered in safe zone (middle 65%)
${data.callToAction ? '- Swipe/tap indicator in lower portion of safe zone (NOT bottom 20%)' : ''}
- Keep all critical content in middle 65%
${options.logoAwareness?.hasLogo ? `- Logo in ${options.logoAwareness.logoPosition} within safe zone` : ''}

Background: ${data.backgroundStyle || 'Bold vibrant gradient'} filling entire frame
Visual Treatment: Full-bleed, immersive, mobile-native
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold impact sans-serif, centered in safe zone, high contrast">${data.storyHeadline}</text>
${data.callToAction ? `<text role="cta" prominence="prominent" style="swipe-up indicator style, near bottom of safe zone (NOT in bottom 20%)">${data.callToAction}</text>` : ''}
</text_content>

<style>
Visual Style: Mobile-native, immersive, story-optimized
Color Palette: ${colorScheme}
${options.brandContext ? `Brand Integration: Gradient uses ${options.brandContext.primaryColor} and ${options.brandContext.secondaryColor || 'complementary color'}` : ''}
Mood: Immediate, attention-grabbing, action-driving
Typography: Large, bold, easily readable at a glance
</style>

${STORY_EXAMPLES}

<quality_markers>
- Full-screen impact
- Content clearly in safe zones (not hidden by UI)
- Readable at a glance
- Thumb-stopping in Stories feed
- Encourages interaction (swipe, tap, reply)
${options.logoAwareness?.hasLogo ? '- Logo area positioned correctly within safe zone' : ''}
${options.brandContext ? '- Brand colors properly integrated into gradient' : ''}
</quality_markers>

<constraints>
Avoid: Content at top 15% or bottom 20% (UI zones), tiny text, horizontal composition, boring/static design, cluttered layout, hard to read quickly, important content outside safe zone
${options.logoAwareness?.hasLogo ? `Avoid: Logo placement in UI zones (top 15% or bottom 20%)` : ''}
</constraints>
`.trim()
}

// Export for use elsewhere
export { STORY_EXAMPLES }
