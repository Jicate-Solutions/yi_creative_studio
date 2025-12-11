/**
 * Certificate Prompt Builder v3.1
 * Generates XML-structured prompts for certificate designs
 * Enhanced with:
 * - Logo awareness, brand context, and quality context
 * - Professional design architecture (borders, zones, typography)
 * - Instruction/content separation for cleaner AI generation
 */

import type { CertificateFormData, EnhancedBuildOptions, BrandContextPrompt } from '../types'
import {
  buildLogoContext,
  buildBrandContext,
  buildQualityContext,
  buildThemeContext,
  buildOrganizationContext,
  buildLayoutZoneContext,
  buildLanguageContext,
} from '../context-helpers'
import { CERTIFICATE_EXAMPLES } from '../examples'

// Import design architecture for ultra-pro quality
import {
  getBorderStylePromptFragment,
  getCertificateZonePromptFragment,
  getTypographyPromptFragment,
  normalizeStyleId,
} from '../../../knowledge-base/design-architecture'

// ============================================================
// STYLE HELPERS
// ============================================================

function getCertificateBorder(style: string): string {
  const borders: Record<string, string> = {
    classic: 'Ornate decorative gold border with Victorian corner flourishes, nested double lines, intricate scrollwork',
    modern: 'Clean geometric border with subtle gold or silver line accents, minimal corner details',
    corporate: 'Professional double-line border with simple elegant corners, business-appropriate',
    academic: 'Traditional academic border with laurel leaf motifs, scholarly decorations',
  }
  return borders[style] || borders.classic
}

function getCertificateBackground(style: string): string {
  const backgrounds: Record<string, string> = {
    classic: 'Cream/ivory aged parchment paper texture with subtle warmth',
    modern: 'Pure white or very light gray with minimal texture',
    corporate: 'Clean white or light cream, professional and clean',
    academic: 'Warm cream or ivory with subtle paper texture',
  }
  return backgrounds[style] || backgrounds.classic
}

function getCertificateColors(style: string, brandContext?: BrandContextPrompt): string {
  if (brandContext?.primaryColor) {
    return `Primary: ${brandContext.primaryColor}, Secondary: ${brandContext.secondaryColor || 'gold'}, Accent: ${brandContext.accentColor || 'warm gold'} (brand colors applied)`
  }

  const palettes: Record<string, string> = {
    classic: 'Navy blue (#1e3a5f) for text, antique gold (#d4af37) for accents and decorations, cream (#f5f5dc) background',
    modern: 'Charcoal gray (#36454f) for text, silver (#c0c0c0) for accents, white background',
    corporate: 'Corporate blue (#002366) for text, gold (#c9a227) for accents, white background',
    academic: 'Deep burgundy (#722f37) for text, bronze (#cd7f32) for accents, ivory (#fffff0) background',
  }
  return palettes[style] || palettes.classic
}

function getStyleDescription(style: string): string {
  const descriptions: Record<string, string> = {
    classic: 'Classic traditional, Victorian-inspired, timeless elegance',
    modern: 'Contemporary elegant, minimalist formal, clean and sophisticated',
    corporate: 'Professional business, corporate appropriate, trustworthy',
    academic: 'Scholarly traditional, university-inspired, academic prestige',
  }
  return descriptions[style] || descriptions.classic
}

function getDecorativeElements(style: string): string {
  const elements: Record<string, string> = {
    classic: 'Ornate corner flourishes, decorative underlines, embossed-effect seal, gold foil accents, ribbon graphics',
    modern: 'Subtle geometric accents, thin line dividers, minimalist seal icon, clean spacing',
    corporate: 'Professional seal, simple corner accents, clean divider lines, business-appropriate decorations',
    academic: 'Laurel wreaths, academic seal, scholarly motifs, traditional decorative elements',
  }
  return elements[style] || elements.classic
}

// ============================================================
// DATE FORMATTING
// ============================================================

function formatDate(dateString: string | undefined): string {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildCertificatePrompt(
  data: CertificateFormData,
  options: EnhancedBuildOptions = {}
): string {
  const style = data.style || 'classic'
  const isModern = style === 'modern'

  // Build core context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'certificate')

  // NEW v3.1: Build additional context sections
  const themeContext = buildThemeContext(options.theme, options.style)
  const orgContext = buildOrganizationContext(options.organizationContext)
  const layoutContext = buildLayoutZoneContext(options.layout)
  const langContext = buildLanguageContext(options.language)

  // Get enhanced design architecture
  const normalizedStyle = normalizeStyleId(style)
  const borderArchitecture = getBorderStylePromptFragment(normalizedStyle)
  const zoneArchitecture = getCertificateZonePromptFragment()
  const typographyRules = getTypographyPromptFragment('certificate')

  return `
<task>Generate a prestigious, professional certificate design</task>

<format>
Type: Formal Certificate
Aspect Ratio: Landscape (1.41:1, A4 proportions)
Purpose: Official recognition document that will be printed, framed, and displayed
Style Variant: ${style.charAt(0).toUpperCase() + style.slice(1)}
</format>

${logoContext}

${brandContext}

${qualityContext}

${themeContext}

${orgContext}

${layoutContext}

${langContext}

<design_architecture>
${borderArchitecture}

${zoneArchitecture}

${typographyRules}
</design_architecture>

<subject>
A formal certificate of ${data.certificateTitle || 'achievement'}${data.issuingAuthority ? ` issued by ${data.issuingAuthority}` : ''}.
This is an official document representing institutional authority and prestige.
The recipient should feel honored and proud to display this document.
</subject>

<composition>
Layout: Centered, symmetrical, formal arrangement

Structure:
- BORDER: ${getCertificateBorder(style)} framing entire document
- TOP LEFT: Clean header area with simple background
- TOP RIGHT: Official seal or emblem area
- TOP CENTER: Certificate title ("${data.certificateTitle || 'CERTIFICATE OF ACHIEVEMENT'}")
- CENTER: "This is to certify that" lead-in text (small, elegant)
- CENTER PROMINENT: Recipient name "${data.recipientName}" - THIS IS THE LARGEST TEXT ELEMENT
- BELOW CENTER: Achievement description "${data.achievementDescription || 'has successfully completed the program'}"
- BOTTOM SECTION: Two signature lines, equally spaced
  ${data.signatoryName ? `- Left signature: "${data.signatoryName}${data.signatoryDesignation ? ', ' + data.signatoryDesignation : ''}"` : ''}
  ${data.signatoryName2 ? `- Right signature: "${data.signatoryName2}${data.signatoryDesignation2 ? ', ' + data.signatoryDesignation2 : ''}"` : ''}
- BOTTOM: Date "${data.dateIssued ? formatDate(data.dateIssued) : ''}" and certificate number "${data.certificateNumber || ''}"

Background: ${getCertificateBackground(style)}
</composition>

<text_content>
<text role="title" prominence="prominent" style="elegant serif, ${isModern ? 'charcoal gray' : 'navy blue'}, centered with decorative underline">${data.certificateTitle || 'CERTIFICATE OF ACHIEVEMENT'}</text>
<text role="preface" prominence="small" style="refined serif italic, dark gray">This is to certify that</text>
<text role="recipient_name" prominence="LARGEST" style="${isModern ? 'bold elegant modern serif' : 'flowing calligraphy script'}, ${isModern ? 'black' : 'gold or deep navy'}, with decorative flourishes above and below">${data.recipientName}</text>
<text role="achievement" prominence="medium" style="clean readable serif, dark gray">${data.achievementDescription || 'has successfully completed the program'}</text>
${data.issuingAuthority ? `<text role="authority" prominence="small" style="clean serif">Issued by: ${data.issuingAuthority}</text>` : ''}
${data.signatoryName ? `<text role="signatory1" prominence="small" style="signature line with printed name below">${data.signatoryName}${data.signatoryDesignation ? ', ' + data.signatoryDesignation : ''}</text>` : ''}
${data.signatoryName2 ? `<text role="signatory2" prominence="small" style="signature line with printed name below">${data.signatoryName2}${data.signatoryDesignation2 ? ', ' + data.signatoryDesignation2 : ''}</text>` : ''}
<text role="date" prominence="small" style="small caps, bottom of document">${data.dateIssued ? formatDate(data.dateIssued) : 'Date'}</text>
${data.certificateNumber ? `<text role="reference" prominence="small" style="small monospace or serif">Certificate No: ${data.certificateNumber}</text>` : ''}
${data.eventNote ? `<text role="note" prominence="small" style="footer text, bottom 5%">"${data.eventNote}"</text>` : ''}
</text_content>

<style>
Visual Style: ${getStyleDescription(style)}
Color Palette: ${getCertificateColors(style, options.brandContext)}
Mood: Prestigious, authoritative, celebratory, worthy of framing
Typography:
  - Title: Elegant ${isModern ? 'modern serif or clean sans-serif' : 'traditional serif'}, bold
  - Recipient Name: ${isModern ? 'Bold elegant serif' : 'Flowing calligraphy or script'} - LARGEST
  - Body: Clean readable serif
  - Signatures: Handwriting-style line with printed text below
Decorative Elements: ${getDecorativeElements(style)}
</style>

${CERTIFICATE_EXAMPLES}

<quality_markers>
- Print-ready, high-resolution output
- Frame-worthy presentation
- Professional enough for corporate or academic display
- Clear visual hierarchy with recipient name MOST PROMINENT
- All text clearly legible (especially recipient name and achievement)
- Balanced, symmetrical composition
- Clean header areas with simple background suitable for branding
${options.brandContext ? '- Brand colors subtly integrated' : ''}
</quality_markers>

<constraints>
Avoid: Blurry or pixelated elements, clipart, cartoon graphics, casual or playful fonts (Comic Sans, etc.), neon or overly bright colors, busy patterns, crowded layout, poor text hierarchy, stock photo elements, modern casual aesthetic (unless modern style selected), low resolution output, complex patterns in header areas
</constraints>

<render_constraints>
CRITICAL: Only render text that appears inside <text role="...">content</text> tags.
DO NOT render as visible text:
- XML tag names (task, format, composition, style, constraints)
- Instruction phrases (Generate, Create, Include, Apply)
- Design terminology (hierarchy, prominence, focal point)
- Words: IMPORTANT, CRITICAL, NOTE, AVOID
- Any text from design_architecture or quality_markers sections
</render_constraints>
`.trim()
}

// Re-export for backward compatibility
export { CERTIFICATE_EXAMPLES }
