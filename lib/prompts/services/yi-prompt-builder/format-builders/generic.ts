/**
 * Generic Prompt Builder v3.0
 * Fallback for unknown or custom formats
 * Enhanced with logo awareness, brand context, and quality context
 */

import type { EnhancedBuildOptions } from '../types'
import { buildLogoContext, buildBrandContext, buildQualityContext } from '../context-helpers'

// ============================================================
// MAIN BUILDER
// ============================================================

export function buildGenericPrompt(
  formatId: string,
  formData: Record<string, unknown>,
  options: EnhancedBuildOptions = {}
): string {
  // Extract common fields with defaults
  const title = (formData.title || formData.headline || formData.name || formatId) as string
  const description = (formData.description || formData.caption || formData.body || '') as string
  const style = (formData.style || 'modern professional') as string
  const colorScheme = (formData.colorScheme || 'brand-appropriate colors') as string

  // Build context sections
  const logoContext = buildLogoContext(options.logoAwareness)
  const brandContext = buildBrandContext(options.brandContext)
  const qualityContext = buildQualityContext(options.resolution, formatId)

  // Determine aspect ratio from format ID
  let aspectRatio = '1:1 Square'
  if (formatId.includes('story') || formatId.includes('vertical')) {
    aspectRatio = '9:16 Portrait'
  } else if (formatId.includes('banner') || formatId.includes('cover') || formatId.includes('thumbnail')) {
    aspectRatio = '16:9 Landscape'
  } else if (formatId.includes('a4') || formatId.includes('a5') || formatId.includes('poster')) {
    aspectRatio = '4:5 Portrait'
  } else if (formatId.includes('certificate')) {
    aspectRatio = '1.41:1 Landscape'
  }

  // Format the ID for display
  const formattedFormat = formatId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  // Determine colors - use brand colors if available
  const finalColorScheme = options.brandContext?.primaryColor
    ? `Brand colors: ${options.brandContext.primaryColor}, ${options.brandContext.secondaryColor || 'white'}, ${options.brandContext.accentColor || 'accent'}`
    : colorScheme

  return `
<task>Generate a professional ${formattedFormat} design</task>

<format>
Type: ${formattedFormat}
Aspect Ratio: ${aspectRatio}
Purpose: Professional marketing/communication material
</format>

${logoContext}

${brandContext}

${qualityContext}

<subject>
A professional graphic for: "${title}"
${description ? `Details: ${description}` : ''}
The design should be visually appealing, clear, and effective for its purpose.
</subject>

<composition>
Layout: Clean, organized layout with clear visual hierarchy
- Main title/headline as the most prominent element
- Supporting content appropriately sized
- Brand elements positioned properly
${options.logoAwareness?.hasLogo ? `- Logo zone: ${options.logoAwareness.logoPosition} kept clear for overlay` : '- Logo space in corner'}
- Adequate spacing and margins
- Balanced composition

Background: ${style} background ${options.brandContext ? `using brand colors (${options.brandContext.primaryColor})` : 'appropriate for the format'}
Visual Treatment: Professional, clean, purposeful
</composition>

<text_content>
<text role="headline" prominence="LARGEST" style="bold, clear, high contrast">${title}</text>
${description ? `<text role="body" prominence="medium" style="clean, readable">${description}</text>` : ''}
</text_content>

<style>
Visual Style: ${style}
Color Palette: ${finalColorScheme}
Mood: Professional, appropriate, effective
Typography: Clear hierarchy, readable fonts
</style>

<quality_markers>
- Professional quality output
- Clear visual hierarchy
- All text clearly legible
- Appropriate for intended use
- Clean, polished design
${options.logoAwareness?.hasLogo ? '- Logo area clean for overlay' : ''}
${options.brandContext ? '- Brand colors properly applied' : ''}
</quality_markers>

<constraints>
Avoid: Cluttered layout, poor hierarchy, illegible text, unprofessional design, mismatched elements, inconsistent styling
${options.logoAwareness?.hasLogo ? `Avoid: Complex elements in ${options.logoAwareness.logoPosition} (logo zone)` : ''}
</constraints>
`.trim()
}
