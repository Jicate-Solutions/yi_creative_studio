/**
 * YouTube Thumbnail Prompt Builder v3.1
 * Generates XML-structured prompts for YouTube thumbnail designs
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Platform-specific scroll-stop patterns for YouTube
 * - Typography hierarchy for hook text
 * - Instruction/content separation for cleaner AI generation
 */

import type { YouTubeThumbnailFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
} from '../context-helpers'
import { YOUTUBE_THUMBNAIL_EXAMPLES } from '../examples'

// Import design architecture for ultra-pro quality
import {
  getScrollStopPromptFragment,
  getTypographyPromptFragment,
} from '../../../knowledge-base/design-architecture'

// ============================================================
// EXPRESSION HELPERS
// ============================================================

function getExpressionDescription(expression: string = 'excited'): string {
  const descriptions: Record<string, string> = {
    excited: "Big enthusiastic smile, bright wide eyes, possibly thumbs up or pointing, radiating positive energy",
    shocked: "Wide eyes, open mouth in genuine surprise, hands on cheeks or near face, 'I can't believe it' look",
    serious: "Determined focused look, confident expression, slight frown, 'this is important' energy",
    confused: "Furrowed brow, tilted head, questioning puzzled expression, one eyebrow raised",
    curious: "Raised eyebrow, intrigued knowing expression, slight smile, 'wait till you see this' energy",
  }
  return descriptions[expression] || descriptions.excited
}

function getEmotionMood(expression: string = 'excited'): string {
  const moods: Record<string, string> = {
    excited: "Energetic, positive, 'you'll love this'",
    shocked: "Dramatic, surprising, 'you won't believe this'",
    serious: "Important, authoritative, 'pay attention'",
    confused: "Relatable, questioning, 'let me explain'",
    curious: "Intriguing, mysterious, 'want to know more?'",
  }
  return moods[expression] || moods.excited
}

function extractHook(videoTitle: string): string {
  // Extract 3-5 most impactful words from video title
  const words = videoTitle.split(' ').slice(0, 5)
  return words.join(' ').toUpperCase()
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildYouTubeThumbnailPrompt(
  data: YouTubeThumbnailFormData,
  options: EnhancedBuildOptions = {}
): string {
  const hasFace = data.hasFace !== false

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'youtube_thumbnail')

  // NEW v3.1: Build theme context
  const themeContext = buildThemeContext(options.theme, options.style)

  // Get platform-specific scroll-stop patterns
  const scrollStopPatterns = getScrollStopPromptFragment('youtube_thumbnail')
  const typographyRules = getTypographyPromptFragment('youtube_thumbnail')

  return `
<task>Generate a high-CTR YouTube thumbnail designed to maximize clicks in search and recommendations</task>

<format>
Type: YouTube Video Thumbnail
Aspect Ratio: Landscape 16:9 (1280x720 equivalent)
Viewing Size: Will display as small as 160x90 pixels - MUST be readable at tiny size
Purpose: Compete with 500+ other videos, trigger curiosity, drive clicks
</format>

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

<platform_optimization>
${scrollStopPatterns}
</platform_optimization>

<typography_hierarchy>
${typographyRules}
</typography_hierarchy>

<subject>
A click-worthy thumbnail for video: "${data.videoTitle}"
The thumbnail must communicate video value in 0.05 seconds.
${hasFace
    ? `Feature: Expressive human face with ${data.expression || 'excited'} expression, filling 50-60% of frame (LEFT side for photo overlay zone)`
    : `Feature: Compelling visual subject that draws the eye`}
${hasFace ? 'NOTE: Face zone will have photo overlaid. Generate clean, complementary background for face area.' : ''}
</subject>

<composition>
Layout: Two-zone composition
- LEFT 60%: ${hasFace
    ? `Expressive face - ${getExpressionDescription(data.expression)}, well-lit, looking toward camera, high contrast with background`
    : `Main visual subject - ${data.mainSubject || 'compelling focal point'}`}
- RIGHT 40%: Bold text hook - 3-5 words maximum, readable at tiny sizes
- AVOID: Bottom-right corner (YouTube duration badge overlay)
- AVOID: Bottom 10% (progress bar on hover)
${options.logoAwareness?.hasLogo ? `- LOGO ZONE: ${options.logoAwareness.logoPosition} reserved for brand logo` : ''}

Background: ${data.backgroundColor || 'Bright, saturated color that contrasts with subject'}
Subject Treatment: Well-lit, high contrast, pops from background
</composition>

<text_content>
<text role="hook" prominence="LARGEST" style="BOLD thick sans-serif, ALL CAPS, thick black outline for contrast">${data.hookText || extractHook(data.videoTitle)}</text>
Note: Maximum 5 words. Must be readable when thumbnail is 160 pixels wide.
Text Color: ${data.textColor || 'Bright yellow or white'} with thick black outline
${data.eventNote ? `<text role="note" prominence="small" style="compact footer, bottom corner">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: YouTube thumbnail style - bold, clickable, competitive with top creators
Color Palette: Bright, saturated, high contrast - ${data.accentColor || 'yellow, red, or electric blue'} for text
${options.brandContext ? `Brand Integration: ${options.brandContext.primaryColor} accent where appropriate` : ''}
Mood: ${hasFace ? getEmotionMood(data.expression) : 'Compelling, curiosity-triggering'}
Typography: Impact-style thick sans-serif, ALL CAPS, 3-5px black outline
Lighting: Dramatic lighting on subject, high contrast
</style>

${YOUTUBE_THUMBNAIL_EXAMPLES}

<quality_markers>
- Readable at 160x90 pixels (thumbnail size in search results)
- Stands out among competitor thumbnails
- Triggers curiosity - viewer NEEDS to click
- Professional YouTuber quality
- ${hasFace ? 'Face expression matches video emotion' : 'Clear compelling subject'}
- High contrast throughout
${options.logoAwareness?.hasLogo ? '- Logo area kept clear for overlay' : ''}
</quality_markers>

<constraints>
Avoid: Small text, thin fonts, muted colors, boring expression, cluttered composition, content in corners (especially bottom-right), too many elements, blurry face, generic stock photo feel, text over face, more than 5 words, low contrast, pastel colors
${options.logoAwareness?.hasLogo ? `Avoid: Critical content in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
${hasFace ? `Avoid: Illustrated faces in face zone - keep background clean for photo overlay` : ''}
</constraints>

<render_constraints>
CRITICAL: Only render the hook text. Do NOT render any instruction text.
Only render text inside <text role="hook">...</text> tag.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Platform terminology (CTR, scroll-stop, click-worthy)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID
- Any content from platform_optimization or typography_hierarchy sections
</render_constraints>
`.trim()
}

// Export for use elsewhere
export { YOUTUBE_THUMBNAIL_EXAMPLES }
