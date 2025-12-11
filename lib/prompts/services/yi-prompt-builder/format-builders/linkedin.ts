/**
 * LinkedIn Post Prompt Builder v3.1
 * Generates XML-structured prompts for LinkedIn professional graphics
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Theme and organization context (v3.1)
 * - ContentType variations for different LinkedIn post types
 */

import type { LinkedInFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLanguageContext,
} from '../context-helpers'
import { LINKEDIN_POST_EXAMPLES } from '../examples'

// ============================================================
// CONTENT TYPE CONTEXTS (v3.1)
// ============================================================

interface LinkedInContentContext {
  layout: string
  mood: string
  visualStyle: string
  structure: string
}

function getLinkedInContextByType(contentType?: string): LinkedInContentContext {
  const contexts: Record<string, LinkedInContentContext> = {
    article: {
      layout: 'Editorial layout with strong headline, article preview feel',
      mood: 'Thought-leadership, insightful, authoritative',
      visualStyle: 'Clean, magazine-style, professional photography or abstract',
      structure: 'Headline prominent, supporting insight below, clean composition',
    },
    announcement: {
      layout: 'Celebration layout with prominent headline, visual emphasis',
      mood: 'Exciting, milestone, achievement-focused',
      visualStyle: 'Bold typography, celebratory elements, brand-forward',
      structure: 'Big announcement text, supporting details, celebratory accents',
    },
    job: {
      layout: 'Recruitment-focused with company branding, role highlight',
      mood: 'Opportunity, growth, career advancement',
      visualStyle: 'Professional, aspirational, team imagery or workplace',
      structure: 'Role title prominent, company branding, opportunity highlights',
    },
    event: {
      layout: 'Event promotion with date/time prominent, speaker highlights',
      mood: 'Networking, learning, professional development',
      visualStyle: 'Event photography, speaker headshots, conference feel',
      structure: 'Event name prominent, date/time visible, speaker zone if applicable',
    },
    insight: {
      layout: 'Data-forward with chart or statistic highlight',
      mood: 'Analytical, research-backed, industry expertise',
      visualStyle: 'Clean data visualization, infographic elements',
      structure: 'Big number/statistic prominent, context text, source credibility',
    },
    thought_leadership: {
      layout: 'Quote or insight-focused, personal brand emphasis',
      mood: 'Authoritative, expert perspective, meaningful',
      visualStyle: 'Clean typography, subtle personal branding',
      structure: 'Key insight prominent, author attribution, professional aesthetic',
    },
  }
  return contexts[contentType || 'article'] || contexts.article
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildLinkedInPrompt(
  data: LinkedInFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Get content type context (v3.1)
  const contentContext = getLinkedInContextByType(options.contentType || data.contentType)

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'linkedin_post')

  // NEW v3.1: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const langContext = buildLanguageContext(options.language)

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
Content Type: ${options.contentType || data.contentType || 'Thought Leadership'}
Audience: Business professionals, B2B context
</format>

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${langContext}

<subject>
A sophisticated professional graphic for: "${data.headline}"
Content Type: ${options.contentType || data.contentType || 'Thought Leadership'}
Content Context: ${contentContext.mood}
This should look like it comes from a respected industry leader, not a marketing department.
</subject>

<composition>
Layout: ${contentContext.layout}

Structure:
${contentContext.structure}

Visual Elements:
- Background: Professional ${data.backgroundStyle || 'gradient (navy to dark blue)'} with subtle geometric or abstract accents
- Headline: "${data.headline}" - prominent but not shouting
${data.keyInsight ? `- Key insight/statistic: "${data.keyInsight}" - highlighted/emphasized` : ''}
${data.professionalMessage ? `- Supporting message: "${data.professionalMessage}"` : ''}
- LOGO ZONE: ${options.logoAwareness?.hasLogo ? `${options.logoAwareness.logoPosition} kept clear for logo overlay` : 'Subtle brand element in corner'}
- WHITE SPACE: Generous - not crowded, professional breathing room

Visual Treatment: ${contentContext.visualStyle}
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="professional sans-serif, bold but elegant, not aggressive">${data.headline}</text>
${data.keyInsight ? `<text role="insight" prominence="prominent" style="highlighted, possibly larger number or statistic">${data.keyInsight}</text>` : ''}
${data.professionalMessage ? `<text role="body" prominence="medium" style="clean sans-serif, lighter weight">${data.professionalMessage}</text>` : ''}
${data.eventNote ? `<text role="note" prominence="small" style="footer text, bottom 5-10%">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: ${contentContext.visualStyle}
Color Palette: ${colorScheme}
Mood: ${contentContext.mood}
Typography: Clean professional fonts (not playful or casual)
Decoration: Minimal - subtle geometric shapes, lines, or icons only
</style>

${LINKEDIN_POST_EXAMPLES}

<quality_markers>
- FORTUNE 500 TEST: Would not look out of place on a major company's LinkedIn
- CREDIBILITY TEST: Builds trust and professional respect
- ENGAGEMENT TEST: Encourages thoughtful comments and shares
- CONTENT TYPE FIT: Appropriate for ${options.contentType || data.contentType || 'thought leadership'} post
- BRAND TEST: ${options.brandContext ? 'Brand colors properly integrated' : 'Professional, polished look'}
- Clean, sophisticated execution
${options.logoAwareness?.hasLogo ? '- Logo area clean and ready for overlay' : ''}
</quality_markers>

<constraints>
Avoid: Flashy, salesy, clickbait, unprofessional, too colorful, playful fonts, meme-style, casual aesthetic, aggressive marketing look, corporate cliches, stock photo handshake imagery
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>

<render_constraints>
CRITICAL: Only render text that appears inside <text role="...">content</text> tags.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Platform terminology (B2B, thought leadership, credibility)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID
</render_constraints>
`.trim()
}

// Export for use elsewhere
export { LINKEDIN_POST_EXAMPLES }
