/**
 * Print Portrait Pattern
 * Portrait aspect ratio for Flyers, Brochures, Invitations
 */

import type { BasePattern } from '../types'

export const PRINT_PORTRAIT_PATTERN: BasePattern = {
  id: 'print_portrait',
  name: 'Print Portrait (Flyer/Brochure)',
  aspectRatioRange: 'portrait',

  textElements: [
    {
      id: 'headline',
      role: 'headline',
      emphasis: 'high',
      required: true,
      maxLength: 60,
      typographyHint: 'bold, attention-grabbing sans-serif',
      positionHint: 'top third',
    },
    {
      id: 'subheadline',
      role: 'subheadline',
      emphasis: 'medium',
      required: false,
      maxLength: 100,
      typographyHint: 'clean supporting text',
      positionHint: 'below headline',
    },
    {
      id: 'body',
      role: 'body',
      emphasis: 'low',
      required: false,
      typographyHint: 'readable body text',
      positionHint: 'middle section',
    },
    {
      id: 'cta',
      role: 'cta',
      emphasis: 'high',
      required: false,
      maxLength: 30,
      typographyHint: 'bold call-to-action',
      positionHint: 'bottom third',
    },
  ],

  textHierarchy: ['headline', 'subheadline', 'body', 'cta'],

  layout: {
    name: 'print_portrait_standard',
    zones: [
      {
        id: 'header',
        position: 'top',
        heightPercentage: 30,
        contentType: 'mixed',
      },
      {
        id: 'body',
        position: 'center',
        heightPercentage: 50,
        contentType: 'mixed',
      },
      {
        id: 'footer',
        position: 'bottom',
        heightPercentage: 20,
        contentType: 'mixed',
      },
    ],
    compositionStyle: 'vertical',
    visualFlow: 'top-to-bottom',
  },

  typography: {
    primary: 'bold attention-grabbing sans-serif',
    secondary: 'clean readable body font',
    mood: 'promotional, informative',
  },

  visuals: {
    recommended: [
      'high-quality photography',
      'clean graphics',
      'visual hierarchy',
    ],
    backgrounds: ['gradient backgrounds', 'solid colors', 'subtle textures'],
    avoid: [
      'low resolution images',
      'cluttered layouts',
      'too many fonts',
    ],
  },

  negativePrompts: {
    base: ['blurry', 'pixelated', 'low quality', 'mockup', 'poster on wall'],
    typeSpecific: [
      'landscape orientation',
      'too many elements',
      'hard-to-read text',
    ],
  },

  promptTemplate: `Create a professional print-ready portrait design.

The headline reads "[headline]" in bold, attention-grabbing typography at the top.
[subheadline_section]
[body_section]
[cta_section]

[visual_elements]

PRINT RULES:
- High resolution, print-quality imagery
- Clear visual hierarchy with distinct sections
- Balanced white space
- Bleed-safe margins

[color_scheme]
Quality: Print-ready, professional, promotional`,

  qualityKeywords: [
    'print-ready',
    'promotional',
    'professional',
    'high-quality',
  ],
}
