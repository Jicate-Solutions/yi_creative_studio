/**
 * Customization to Natural Language Helpers
 * Converts DesignCustomization objects into descriptive narratives for AI prompts
 *
 * Adapted for Yi CreativeStudio's CustomizationData interface
 */

import type { DesignCustomization } from '../types'

// ============================================================
// TITLE CUSTOMIZATION NARRATIVES
// ============================================================

/**
 * Position descriptions for title placement
 */
const TITLE_POSITIONS: Record<string, string> = {
  top: 'prominently at the top of the design, establishing immediate hierarchy',
  center: 'dramatically centered in the composition, commanding attention',
  bottom: 'anchored at the bottom, allowing visual elements above to breathe',
}

/**
 * Alignment descriptions for title text
 */
const TITLE_ALIGNMENTS: Record<string, string> = {
  left: 'left-aligned for a modern, editorial feel',
  center: 'centered for balanced, formal presentation',
  right: 'right-aligned for distinctive, unconventional impact',
}

/**
 * Font weight descriptions
 */
const FONT_WEIGHTS: Record<string, string> = {
  normal: 'regular weight for understated elegance',
  medium: 'medium weight for confident readability',
  semibold: 'semi-bold weight for strong presence',
  bold: 'bold weight for maximum impact and authority',
}

/**
 * Build narrative for title customization
 */
export function buildTitleNarrative(
  title: DesignCustomization['title']
): string {
  const parts: string[] = []

  // Position and alignment
  parts.push(
    `Position the main headline ${TITLE_POSITIONS[title.position] || TITLE_POSITIONS.top}`
  )
  parts.push(`with text ${TITLE_ALIGNMENTS[title.alignment] || TITLE_ALIGNMENTS.center}`)

  // Font styling
  parts.push(
    `Use ${FONT_WEIGHTS[title.fontWeight] || FONT_WEIGHTS.bold} typography`
  )

  // Font size context
  if (title.fontSize >= 60) {
    parts.push('at an impactful large scale that dominates the composition')
  } else if (title.fontSize >= 40) {
    parts.push('at a substantial size that commands attention without overwhelming')
  } else {
    parts.push('at a refined size that integrates elegantly with other elements')
  }

  // Shadow effect - Yi CreativeStudio uses 'shadow' instead of 'shadowEnabled'
  if (title.shadow) {
    parts.push(
      'Apply subtle text shadows to lift the headline from the background and ensure perfect readability'
    )
  }

  return parts.join('. ') + '.'
}

// ============================================================
// BACKGROUND CUSTOMIZATION NARRATIVES
// ============================================================

/**
 * Background type descriptions
 */
const BACKGROUND_TYPES: Record<string, string> = {
  gradient:
    'Create a rich, flowing gradient background that adds depth and visual movement',
  solid:
    'Use a clean, solid color background that provides maximum focus on content',
  pattern:
    'Incorporate a subtle pattern background that adds texture without distraction',
  image:
    'Feature an atmospheric background that sets the scene and context',
}

/**
 * Build narrative for background customization
 */
export function buildBackgroundNarrative(
  background: DesignCustomization['background']
): string {
  const parts: string[] = []

  // Background type
  parts.push(
    BACKGROUND_TYPES[background.type] || BACKGROUND_TYPES.gradient
  )

  // Gradient colors (if applicable)
  if (background.type === 'gradient') {
    parts.push(
      `transitioning from ${background.primaryColor} to ${background.secondaryColor}, creating visual flow and energy`
    )
  }

  // Overlay effect - Yi CreativeStudio uses 'overlay' instead of 'overlayEnabled'
  if (background.overlay && background.overlayOpacity > 0) {
    const overlayStrength =
      background.overlayOpacity > 60
        ? 'a significant'
        : background.overlayOpacity > 30
          ? 'a moderate'
          : 'a subtle'
    parts.push(
      `Apply ${overlayStrength} color overlay to ensure text remains highly readable against the background`
    )
  }

  // Blur effect - Yi CreativeStudio uses 'blur' instead of 'blurEnabled'
  if (background.blur && background.blurAmount > 0) {
    const blurStrength =
      background.blurAmount > 10 ? 'substantial' : 'gentle'
    parts.push(
      `Add ${blurStrength} background blur to create depth and focus attention on foreground elements`
    )
  }

  return parts.join('. ') + '.'
}

// ============================================================
// SPEAKER PHOTO CUSTOMIZATION NARRATIVES
// ============================================================

/**
 * Photo shape descriptions
 */
const PHOTO_SHAPES: Record<string, string> = {
  circle: 'a circular frame, suggesting approachability and warmth',
  square: 'a square frame, conveying professionalism and structure',
  rounded: 'a softly rounded frame, balancing warmth with modernity',
}

/**
 * Photo position descriptions
 */
const PHOTO_POSITIONS: Record<string, string> = {
  left: 'positioned on the left side, creating natural reading flow toward event details',
  center: 'centered prominently, making the speaker the focal point of the design',
  right: 'positioned on the right side, allowing text content to lead the composition',
}

/**
 * Build narrative for speaker photo customization
 */
export function buildSpeakerPhotoNarrative(
  speakerPhoto: DesignCustomization['speakerPhoto']
): string {
  if (!speakerPhoto.enabled) {
    return 'Focus on typography and graphical elements without featuring a speaker photograph.'
  }

  const parts: string[] = []

  // Include speaker photo prominently
  parts.push(
    'Feature a professional speaker portrait as a key visual element'
  )

  // Shape and framing
  parts.push(
    `presented in ${PHOTO_SHAPES[speakerPhoto.shape] || PHOTO_SHAPES.circle}`
  )

  // Size context
  if (speakerPhoto.size >= 300) {
    parts.push('at a large, commanding size that makes the speaker unmistakable')
  } else if (speakerPhoto.size >= 200) {
    parts.push('at a substantial size that balances with other design elements')
  } else {
    parts.push('at a refined size that complements rather than dominates')
  }

  // Position
  parts.push(PHOTO_POSITIONS[speakerPhoto.position] || PHOTO_POSITIONS.center)

  // Border - Yi CreativeStudio uses nested border object
  if (speakerPhoto.border && speakerPhoto.border.width > 0) {
    const borderWeight =
      speakerPhoto.border.width > 5 ? 'prominent' : 'elegant'
    parts.push(
      `Add a ${borderWeight} border in ${speakerPhoto.border.color} to frame and distinguish the portrait`
    )
  }

  // Shadow - Yi CreativeStudio uses 'shadow' instead of 'shadowEnabled'
  if (speakerPhoto.shadow) {
    parts.push(
      'Apply a subtle drop shadow to lift the portrait from the background, adding depth'
    )
  }

  return parts.join('. ') + '.'
}

// ============================================================
// FOOTER CUSTOMIZATION NARRATIVES
// ============================================================

/**
 * Footer style descriptions
 */
const FOOTER_STYLES: Record<string, string> = {
  minimal:
    'Design a clean, minimal footer with only essential contact information',
  full: 'Create a comprehensive footer that includes all relevant contact details and branding',
  branded:
    'Incorporate a strongly branded footer that reinforces organizational identity',
}

/**
 * Build narrative for footer customization
 */
export function buildFooterNarrative(
  footer: DesignCustomization['footer']
): string {
  const parts: string[] = []

  // Footer style
  parts.push(FOOTER_STYLES[footer.style] || FOOTER_STYLES.minimal)

  // Elements to include
  const elements: string[] = []
  if (footer.useBrandWebsite || footer.customWebsite) elements.push('website URL')
  if (footer.useBrandPhone || footer.customPhone) elements.push('phone number')
  if (footer.useBrandEmail || footer.customEmail) elements.push('email address')
  if (footer.useBrandSocial) elements.push('social media handles')

  if (elements.length > 0) {
    parts.push(`Include ${elements.join(', ')} for easy contact and follow-up`)
  }

  // Background color context
  if (footer.backgroundColor && footer.backgroundColor !== 'transparent') {
    parts.push(
      `Use ${footer.backgroundColor} as the footer background to clearly separate it from the main content`
    )
  }

  return parts.join('. ') + '.'
}

// ============================================================
// COMPLETE CUSTOMIZATION NARRATIVE
// ============================================================

/**
 * Build complete design customization narrative
 * Combines all customization sections into a cohesive instruction set
 */
export function buildCustomizationNarrative(
  customization: DesignCustomization | undefined
): string {
  if (!customization) {
    return ''
  }

  const sections: string[] = []

  // Title section
  sections.push('TITLE DESIGN:\n' + buildTitleNarrative(customization.title))

  // Background section
  sections.push(
    'BACKGROUND:\n' + buildBackgroundNarrative(customization.background)
  )

  // Speaker photo section (only if relevant)
  const speakerNarrative = buildSpeakerPhotoNarrative(
    customization.speakerPhoto
  )
  sections.push('SPEAKER VISUAL:\n' + speakerNarrative)

  // Footer section
  sections.push('FOOTER:\n' + buildFooterNarrative(customization.footer))

  return sections.join('\n\n')
}

/**
 * Build short customization summary for Ideogram (concise prompts)
 */
export function buildCustomizationSummaryShort(
  customization: DesignCustomization | undefined
): string {
  if (!customization) {
    return ''
  }

  const points: string[] = []

  // Title positioning
  points.push(`${customization.title.fontWeight} title ${customization.title.position}`)

  // Background type
  points.push(`${customization.background.type} background`)

  // Speaker photo
  if (customization.speakerPhoto.enabled) {
    points.push(`${customization.speakerPhoto.shape} speaker portrait ${customization.speakerPhoto.position}`)
  }

  // Footer style
  points.push(`${customization.footer.style} footer`)

  return points.join(', ')
}

/**
 * Get customization-specific negative prompt additions
 * Returns things to avoid based on customization
 */
export function getCustomizationNegativePrompts(
  customization: DesignCustomization | undefined
): string[] {
  if (!customization) {
    return []
  }

  const negatives: string[] = []

  // If no speaker photo, avoid faces
  if (!customization.speakerPhoto.enabled) {
    negatives.push('human faces', 'portraits', 'photographs of people')
  }

  // If minimal footer, avoid cluttered bottoms
  if (customization.footer.style === 'minimal') {
    negatives.push('cluttered footer', 'too many text elements at bottom')
  }

  // If solid background, avoid complex patterns
  if (customization.background.type === 'solid') {
    negatives.push('busy backgrounds', 'complex patterns', 'distracting textures')
  }

  return negatives
}
