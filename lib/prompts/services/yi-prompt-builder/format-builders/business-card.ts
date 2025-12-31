/**
 * Business Card Prompt Builder v3.1
 * Generates XML-structured prompts for business card designs
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Theme and organization context (v3.1)
 * - Professional styling variations
 */

import type { BusinessCardFormData, EnhancedBuildOptions } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLanguageContext,
  buildLayoutZoneContext,
} from '../context-helpers'
import { BUSINESS_CARD_EXAMPLES } from '../examples'

// Import logo zone enforcement helper (v3.4)
import { buildForbiddenZonesSection, buildZoneReminderSection } from '../helpers/logo-zone-enforcement'
import { getSophistication, getIntegratedZoneContext } from '../helpers/sophistication-helper'

// Import decorative elements injector (v4.4)
import { buildDecorativeElementsSection, buildBackgroundSettingSection } from '../helpers/decorative-elements-injector'

// ============================================================
// STYLE VARIATIONS (v3.1)
// ============================================================

interface BusinessCardStyleContext {
  visualStyle: string
  background: string
  typography: string
  decoration: string
}

function getBusinessCardStyleContext(style?: string): BusinessCardStyleContext {
  const styleContexts: Record<string, BusinessCardStyleContext> = {
    minimal: {
      visualStyle: 'Ultra-minimal, clean white space, essential info only',
      background: 'Pure white or soft off-white',
      typography: 'Clean sans-serif, generous spacing, light weights',
      decoration: 'None or single thin accent line',
    },
    modern: {
      visualStyle: 'Contemporary, bold accents, professional edge',
      background: 'White with bold color accent zones',
      typography: 'Modern sans-serif, bold name, clean hierarchy',
      decoration: 'Geometric accent shapes, bold color blocks',
    },
    classic: {
      visualStyle: 'Traditional, timeless, executive appropriate',
      background: 'Cream or ivory with subtle texture',
      typography: 'Elegant serif for name, clean sans for contact',
      decoration: 'Subtle border, classic underlines',
    },
    creative: {
      visualStyle: 'Distinctive, memorable, creative industry',
      background: 'Bold color or unique gradient',
      typography: 'Mix of weights and styles, artistic hierarchy',
      decoration: 'Creative elements, unique layout',
    },
    corporate: {
      visualStyle: 'Corporate professional, boardroom appropriate',
      background: 'Clean white or light gray',
      typography: 'Professional sans-serif, consistent weights',
      decoration: 'Minimal, brand-compliant accents only',
    },
  }
  return styleContexts[style || 'minimal'] || styleContexts.minimal
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildBusinessCardPrompt(
  data: BusinessCardFormData,
  options: EnhancedBuildOptions = {}
): string {
  // Get style context (v3.1)
  const styleContext = getBusinessCardStyleContext(data.style || options.style)

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'business_card')

  // NEW v3.1: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const langContext = buildLanguageContext(options.language)
  const layoutContext = buildLayoutZoneContext(options.layout)

  // NEW v4.1: Sophistication Logic
  const sophistication = getSophistication(options, 'balanced')

  // NEW v3.4: Build forbidden zones (Sophistication-Aware)
  const { forbiddenZonesContext, zoneReminderContext } = getIntegratedZoneContext(options, sophistication)

  // NEW v3.4: Build AI-enhanced typography and decorative sections
  const aiTypographySection = options.designContext?.typographyGuidance
    ? `
<ai_typography_guidance>
Headline Style: ${options.designContext.typographyGuidance.headlineStyle}
Body Style: ${options.designContext.typographyGuidance.bodyStyle}
Hierarchy: ${options.designContext.typographyGuidance.hierarchy}
</ai_typography_guidance>
`
    : ''

  // NEW v4.4: Inject detailed decorative elements and background settings from Design Intelligence/Story Logic
  const decorativeSection = buildDecorativeElementsSection({
    eventType: 'business_card',
    designContext: options.designContext,
    sophistication: sophistication,
    includeIconicImagery: false, // Keep business cards cleaner
  });

  const backgroundSection = buildBackgroundSettingSection(options.designContext, sophistication);

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
Style Variant: ${data.style || 'minimal'}
</format>

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${langContext}

${layoutContext}

${forbiddenZonesContext}

${aiTypographySection}

${decorativeSection}

${backgroundSection}

<subject>
A professional business card for: ${data.personName}
Title: ${data.jobTitle}
${data.companyName ? `Company: ${data.companyName}` : ''}
${options.organizationContext?.name ? `Organization: ${options.organizationContext.name}` : ''}
The card should reflect professionalism and be memorable but not gimmicky.
</subject>

<composition>
Layout: Clean, balanced ${data.orientation || 'horizontal'} layout
Visual Style: ${styleContext.visualStyle}

CRITICAL PRINT MARGINS: No text within 3mm of ANY edge (will be trimmed)

Content Hierarchy:
- ${data.personName}: PRIMARY - most prominent, professional font
- ${data.jobTitle}: SECONDARY - below name, slightly smaller
${data.companyName ? `- ${data.companyName}: With company logo` : ''}
${options.logoAwareness?.hasLogo ? `- Logo area: ${options.logoAwareness.logoPosition} (clean background)` : ''}

Contact Section (organized, aligned):
  ${data.phoneNumber ? `- Phone: ${data.phoneNumber}` : ''}
  ${data.emailAddress ? `- Email: ${data.emailAddress}` : ''}
  ${data.websiteUrl ? `- Website: ${data.websiteUrl}` : ''}
  ${data.address ? `- Address: ${data.address}` : ''}
  ${data.socialHandle ? `- Social: ${data.socialHandle}` : ''}

Background: ${options.designContext?.backgroundSetting || styleContext.background}
Decoration: ${styleContext.decoration}
White Space: Balanced, not cramped - professional breathing room
</composition>

<text_content>
<text role="name" prominence="LARGEST" style="${styleContext.typography}, bold">${data.personName}</text>
<text role="title" prominence="medium" style="clean, slightly smaller, ${options.brandContext?.primaryColor ? `${options.brandContext.primaryColor} accent` : 'gray or muted'}">${data.jobTitle}</text>
${data.companyName ? `<text role="company" prominence="medium" style="with logo">${data.companyName}</text>` : ''}
${data.phoneNumber ? `<text role="contact" prominence="small" style="clean, readable, with phone icon">${data.phoneNumber}</text>` : ''}
${data.emailAddress ? `<text role="contact" prominence="small" style="clean, readable, with email icon">${data.emailAddress}</text>` : ''}
${data.websiteUrl ? `<text role="contact" prominence="small" style="clean, readable">${data.websiteUrl}</text>` : ''}
${data.address ? `<text role="contact" prominence="small" style="clean, readable">${data.address}</text>` : ''}
${data.socialHandle ? `<text role="contact" prominence="small" style="clean, readable, with social icon">${data.socialHandle}</text>` : ''}
${data.eventNote ? `<text role="note" prominence="small" style="footer text, edge area">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: ${styleContext.visualStyle}
Color Palette: ${colorScheme}
Mood: Professional, trustworthy, distinctive
Typography: ${styleContext.typography}, readable at actual card size (text must be legible when printed small)
Decoration: ${styleContext.decoration}
</style>

${BUSINESS_CARD_EXAMPLES}

<quality_markers>
- PRINT TEST: 300 DPI, proper 3mm margins, print-ready
- SIZE TEST: All text readable at actual 3.5" x 2" size
- EXECUTIVE TEST: Professional enough for C-suite networking
- MEMORABLE TEST: Distinctive but not gimmicky
- HIERARCHY TEST: Name > Title > Company > Contact
- UTILITY TEST: Easy to find key contact information quickly
${options.logoAwareness?.hasLogo ? '- Logo area with clean background' : ''}
${options.brandContext ? '- Brand colors properly applied' : ''}
</quality_markers>

<constraints>
Avoid: Cluttered design, tiny unreadable text (under 7pt), too much information crammed in, unprofessional or playful fonts, busy backgrounds, poor contrast, text too close to edges (will be cut), gimmicky or flashy design
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} area` : ''}
</constraints>

${options?.preventionEnhancements?.length ? `
LEARNED IMPROVEMENTS (from past feedback):
${options.preventionEnhancements.map((e, i) => `${i + 1}. ${e}`).join('\n')}
` : ''}

<render_constraints>
CRITICAL: Only render text that appears inside <text role="...">content</text> tags.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Print terminology (DPI, margins, bleed)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID

STRICT CTA PROHIBITION:
- DO NOT invent or add any Call-to-Action buttons, links, or text unless explicitly provided in <text role="cta">
- If NO <text role="cta"> tag exists above, the design MUST NOT contain ANY CTA elements
- BLACKLISTED CTA PHRASES (never render unless explicitly in user data):
  "Learn More", "Shop Now", "Sign Up", "Get Started", "Buy Now", "Click Here",
  "Subscribe", "Join Now", "Register", "Download", "Contact Us", "Read More",
  "Book Now", "Order Now", "Try Free", "Start Free", "Explore", "Discover"
</render_constraints>

${zoneReminderContext}
`.trim()
}

// Export for use elsewhere
export { BUSINESS_CARD_EXAMPLES }
