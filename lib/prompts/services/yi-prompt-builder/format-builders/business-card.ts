/**
 * Business Card Prompt Builder v3.0
 * Generates XML-structured prompts for business card designs
 * Enhanced with logo awareness, brand context, and quality context
 */

import type { BusinessCardFormData, EnhancedBuildOptions } from '../types'
import { buildLogoContext, buildBrandContext, buildQualityContext } from '../context-helpers'
import { BUSINESS_CARD_EXAMPLES } from '../examples'

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildBusinessCardPrompt(
  data: BusinessCardFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Build context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'business_card')

  // Determine colors - use brand colors if available
  const colorScheme = options.brandContext?.primaryColor
    ? `Brand minimal: white/light background, ${options.brandContext.primaryColor} accent, ${options.brandContext.accentColor || 'black'} text`
    : data.colorScheme || 'Professional minimal (black, white, one accent color)'

  return `
<task>Generate a professional business card design</task>

<format>
Type: Business Card
Size: Standard 3.5" x 2" (89mm x 51mm)
Orientation: ${data.orientation || 'Horizontal'}
Purpose: Professional networking, personal branding, contact information exchange
</format>

${logoContext}

${brandContext}

${qualityContext}

<subject>
A professional business card for: ${data.personName}
Title: ${data.jobTitle}
${data.companyName ? `Company: ${data.companyName}` : ''}
The card should reflect professionalism and be memorable but not gimmicky.
</subject>

<composition>
Layout: Clean, balanced ${data.orientation || 'horizontal'} layout

CRITICAL PRINT MARGINS: No text within 3mm of ANY edge (will be trimmed)

Content Hierarchy:
- ${data.personName}: PRIMARY - most prominent, professional font
- ${data.jobTitle}: SECONDARY - below name, slightly smaller
${data.companyName ? `- ${data.companyName}: With company logo` : ''}
${options.logoAwareness?.hasLogo ? `- Logo: ${options.logoAwareness.logoPosition} (area kept clear for overlay)` : ''}

Contact Section (organized, aligned):
  ${data.phoneNumber ? `- Phone: ${data.phoneNumber}` : ''}
  ${data.emailAddress ? `- Email: ${data.emailAddress}` : ''}
  ${data.websiteUrl ? `- Website: ${data.websiteUrl}` : ''}
  ${data.address ? `- Address: ${data.address}` : ''}
  ${data.socialHandle ? `- Social: ${data.socialHandle}` : ''}

Background: ${data.backgroundStyle || 'Clean white or subtle brand color'}
White Space: Balanced, not cramped - professional breathing room
</composition>

<text_content>
<text role="name" prominence="LARGEST" style="professional ${options.brandContext?.fontPreference || 'sans-serif'}, bold">${data.personName}</text>
<text role="title" prominence="medium" style="clean, slightly smaller, ${options.brandContext?.primaryColor ? `${options.brandContext.primaryColor} accent` : 'gray or muted'}">${data.jobTitle}</text>
${data.companyName ? `<text role="company" prominence="medium" style="with logo">${data.companyName}</text>` : ''}
${data.phoneNumber ? `<text role="contact" prominence="small" style="clean, readable, with phone icon">${data.phoneNumber}</text>` : ''}
${data.emailAddress ? `<text role="contact" prominence="small" style="clean, readable, with email icon">${data.emailAddress}</text>` : ''}
${data.websiteUrl ? `<text role="contact" prominence="small" style="clean, readable">${data.websiteUrl}</text>` : ''}
${data.address ? `<text role="contact" prominence="small" style="clean, readable">${data.address}</text>` : ''}
${data.socialHandle ? `<text role="contact" prominence="small" style="clean, readable, with social icon">${data.socialHandle}</text>` : ''}
</text_content>

<style>
Visual Style: ${data.style || 'Professional, clean, memorable'}
Color Palette: ${colorScheme}
Mood: Professional, trustworthy, distinctive
Typography: Elegant, readable at actual card size (text must be legible when printed small)
Decoration: Minimal - subtle accent line or shape at most
</style>

${BUSINESS_CARD_EXAMPLES}

<quality_markers>
- PRINT TEST: 300 DPI, proper 3mm margins, print-ready
- SIZE TEST: All text readable at actual 3.5" x 2" size
- EXECUTIVE TEST: Professional enough for C-suite networking
- MEMORABLE TEST: Distinctive but not gimmicky
- HIERARCHY TEST: Name > Title > Company > Contact
- UTILITY TEST: Easy to find key contact information quickly
${options.logoAwareness?.hasLogo ? '- Logo area clean for overlay' : ''}
${options.brandContext ? '- Brand colors properly applied' : ''}
</quality_markers>

<constraints>
Avoid: Cluttered design, tiny unreadable text (under 7pt), too much information crammed in, unprofessional or playful fonts, busy backgrounds, poor contrast, text too close to edges (will be cut), gimmicky or flashy design
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>
`.trim()
}

// Export for use elsewhere
export { BUSINESS_CARD_EXAMPLES }
