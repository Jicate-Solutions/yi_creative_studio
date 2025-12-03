/**
 * Print Landscape Pattern
 * Landscape aspect ratio for Certificates, Presentations
 */

import type { BasePattern } from '../types'

export const PRINT_LANDSCAPE_PATTERN: BasePattern = {
  id: 'print_landscape',
  name: 'Print Landscape (Certificate/Presentation)',
  aspectRatioRange: 'landscape',

  textElements: [
    {
      id: 'title',
      role: 'label',
      emphasis: 'medium',
      required: true,
      typographyHint: 'elegant serif or script',
      positionHint: 'top center',
    },
    {
      id: 'recipient',
      role: 'headline',
      emphasis: 'high',
      required: true,
      typographyHint: 'elegant script or distinguished serif',
      renderingNote: 'The recipient name is the HERO',
    },
    {
      id: 'description',
      role: 'body',
      emphasis: 'medium',
      required: true,
      typographyHint: 'formal serif body text',
    },
    {
      id: 'details',
      role: 'label',
      emphasis: 'low',
      required: false,
      typographyHint: 'clean formal text',
    },
  ],

  textHierarchy: ['recipient', 'title', 'description', 'details'],

  layout: {
    name: 'landscape_formal',
    zones: [
      { id: 'border', position: 'full', contentType: 'reserved' },
      {
        id: 'header',
        position: 'top',
        heightPercentage: 20,
        contentType: 'text',
      },
      {
        id: 'main',
        position: 'center',
        heightPercentage: 45,
        contentType: 'text',
      },
      {
        id: 'footer',
        position: 'bottom',
        heightPercentage: 35,
        contentType: 'mixed',
      },
    ],
    compositionStyle: 'centered',
    visualFlow: 'top-to-bottom',
  },

  typography: {
    primary: 'elegant script with flourishes',
    secondary: 'formal serif',
    mood: 'prestigious, formal, official',
  },

  visuals: {
    recommended: [
      'decorative border',
      'gold accents',
      'subtle watermark',
      'laurels',
    ],
    backgrounds: [
      'cream/ivory paper texture',
      'subtle pattern',
      'gradient light',
    ],
    avoid: [
      'busy backgrounds',
      'modern casual fonts',
      'bright colors',
      'cartoons',
    ],
  },

  negativePrompts: {
    base: ['informal', 'casual', 'cartoon', 'childish', 'mockup'],
    typeSpecific: [
      'modern sans-serif',
      'bright colors',
      'busy patterns',
      'digital aesthetic',
    ],
  },

  promptTemplate: `Create a formal, prestigious [format_type] design.

[title_section]
The main text "[recipient]" is displayed as the LARGEST, most prominent element.
[description_section]

DESIGN RULES:
- Elegant decorative border (gold, silver, or dark accent)
- Cream/ivory/off-white background with subtle texture
- Include subtle decorative elements: laurels, ribbon corners
- Clear space for signatures and seals

[color_scheme]
Quality: Print-ready, prestigious, frame-worthy`,

  qualityKeywords: [
    'prestigious',
    'frame-worthy',
    'official',
    'elegant',
    'print-ready',
  ],
}
