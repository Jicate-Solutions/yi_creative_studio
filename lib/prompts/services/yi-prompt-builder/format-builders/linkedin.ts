/**
 * LinkedIn Post Prompt Builder v3.0
 * Generates XML-structured prompts for LinkedIn professional graphics
 * Enhanced with logo awareness, brand context, and quality context
 */

import type { LinkedInFormData, EnhancedBuildOptions } from '../types'
import { buildLogoContext, buildBrandContext, buildQualityContext } from '../context-helpers'
import { LINKEDIN_POST_EXAMPLES } from '../examples'

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildLinkedInPrompt(
  data: LinkedInFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Build context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'linkedin_post')

  // Determine colors - use brand colors if available
  const colorScheme = options.brandContext?.primaryColor
    ? `Brand professional: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}, ${options.brandContext.accentColor || 'subtle gold accent'}`
    : data.colorScheme || 'Professional blues (#0077b5, #004182), grays, white, subtle gold accent'

  return `
<task>Generate a professional LinkedIn post graphic that builds credibility and encourages engagement</task>

<format>
Type: LinkedIn Feed Post
Aspect Ratio: Landscape 1.91:1 (1200x628) or Square 1:1 (1080x1080)
Purpose: Establish thought leadership, drive professional engagement, build credibility
Audience: Business professionals, B2B context
</format>

${logoContext}

${brandContext}

${qualityContext}

<subject>
A sophisticated professional graphic for: "${data.headline}"
Content Type: ${data.contentType || 'Thought Leadership'}
This should look like it comes from a respected industry leader, not a marketing department.
</subject>

<composition>
Layout: Clean, sophisticated, minimal

Structure:
- Background: Professional ${data.backgroundStyle || 'gradient (navy to dark blue)'} with subtle geometric or abstract accents
- Headline: "${data.headline}" - prominent but not shouting
${data.keyInsight ? `- Key insight/statistic: "${data.keyInsight}" - highlighted/emphasized` : ''}
${data.professionalMessage ? `- Supporting message: "${data.professionalMessage}"` : ''}
- LOGO ZONE: ${options.logoAwareness?.hasLogo ? `${options.logoAwareness.logoPosition} kept clear for logo overlay` : 'Subtle brand element in corner'}
- WHITE SPACE: Generous - not crowded, professional breathing room

Visual Treatment: Sophisticated, understated, credible
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="professional sans-serif, bold but elegant, not aggressive">${data.headline}</text>
${data.keyInsight ? `<text role="insight" prominence="prominent" style="highlighted, possibly larger number or statistic">${data.keyInsight}</text>` : ''}
${data.professionalMessage ? `<text role="body" prominence="medium" style="clean sans-serif, lighter weight">${data.professionalMessage}</text>` : ''}
</text_content>

<style>
Visual Style: Professional, sophisticated, B2B-appropriate
Color Palette: ${colorScheme}
Mood: Authoritative yet approachable, credible, thought-provoking
Typography: Clean professional fonts (not playful or casual)
Decoration: Minimal - subtle geometric shapes, lines, or icons only
</style>

${LINKEDIN_POST_EXAMPLES}

<quality_markers>
- FORTUNE 500 TEST: Would not look out of place on a major company's LinkedIn
- CREDIBILITY TEST: Builds trust and professional respect
- ENGAGEMENT TEST: Encourages thoughtful comments and shares
- BRAND TEST: ${options.brandContext ? 'Brand colors properly integrated' : 'Professional, polished look'}
- Clean, sophisticated execution
${options.logoAwareness?.hasLogo ? '- Logo area clean and ready for overlay' : ''}
</quality_markers>

<constraints>
Avoid: Flashy, salesy, clickbait, unprofessional, too colorful, playful fonts, meme-style, casual aesthetic, aggressive marketing look, corporate cliches, stock photo handshake imagery
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>
`.trim()
}

// Export for use elsewhere
export { LINKEDIN_POST_EXAMPLES }
