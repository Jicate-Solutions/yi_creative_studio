/**
 * Certificate Prompt Builder v3.0
 * Generates XML-structured prompts for certificate designs
 * Enhanced with logo awareness, brand context, and quality context
 */

import type { CertificateFormData, EnhancedBuildOptions, BrandContextPrompt } from '../types'
import { buildLogoContext, buildBrandContext, buildQualityContext } from '../context-helpers'
import { CERTIFICATE_EXAMPLES } from '../examples'

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

  // Build context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, 'certificate')

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

<subject>
A formal certificate of ${data.certificateTitle || 'achievement'}${data.issuingAuthority ? ` issued by ${data.issuingAuthority}` : ''}.
This is an official document representing institutional authority and prestige.
The recipient should feel honored and proud to display this document.
</subject>

<composition>
Layout: Centered, symmetrical, formal arrangement

Structure:
- BORDER: ${getCertificateBorder(style)} framing entire document
- TOP LEFT: Space reserved for organization logo overlay ${options.logoAwareness?.logoPosition === 'top-left' ? '(PRIMARY LOGO ZONE - keep simple background)' : ''}
- TOP RIGHT: Official seal or emblem ${options.logoAwareness?.logoPosition === 'top-right' ? '(may have logo overlay - ensure compatibility)' : ''}
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
${options.logoAwareness?.hasLogo ? '- Logo area kept clear with simple background for overlay' : ''}
${options.brandContext ? '- Brand colors subtly integrated' : ''}
</quality_markers>

<constraints>
Avoid: Blurry or pixelated elements, clipart, cartoon graphics, casual or playful fonts (Comic Sans, etc.), neon or overly bright colors, busy patterns, crowded layout, poor text hierarchy, stock photo elements, modern casual aesthetic (unless modern style selected), low resolution output
${options.logoAwareness?.hasLogo ? `Avoid: Complex patterns or important content in ${options.logoAwareness.logoPosition} area (logo overlay zone)` : ''}
</constraints>
`.trim()
}

// Re-export for backward compatibility
export { CERTIFICATE_EXAMPLES }
