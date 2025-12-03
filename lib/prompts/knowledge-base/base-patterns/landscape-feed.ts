/**
 * Landscape Feed Pattern
 * ~16:9 aspect ratio for Facebook, LinkedIn, Twitter Posts
 */

import type { BasePattern } from '../types'

export const LANDSCAPE_FEED_PATTERN: BasePattern = {
  id: 'landscape_feed',
  name: 'Landscape Feed Post',
  aspectRatioRange: '16:9',

  textElements: [
    {
      id: 'headline',
      role: 'headline',
      emphasis: 'high',
      required: true,
      maxLength: 80,
      typographyHint: 'bold, professional sans-serif',
      positionHint: 'center or left-aligned',
    },
    {
      id: 'subheadline',
      role: 'subheadline',
      emphasis: 'medium',
      required: false,
      maxLength: 120,
      typographyHint: 'clean supporting text',
      positionHint: 'below headline',
    },
    {
      id: 'cta',
      role: 'cta',
      emphasis: 'high',
      required: false,
      maxLength: 25,
      typographyHint: 'bold button-style text',
      positionHint: 'bottom or alongside headline',
    },
  ],

  textHierarchy: ['headline', 'subheadline', 'cta'],

  layout: {
    name: 'landscape_split',
    zones: [
      {
        id: 'visual',
        position: 'left',
        widthPercentage: 50,
        contentType: 'image',
      },
      {
        id: 'content',
        position: 'right',
        widthPercentage: 50,
        contentType: 'text',
      },
    ],
    compositionStyle: 'split',
    visualFlow: 'left-to-right',
  },

  typography: {
    primary: 'bold professional sans-serif',
    secondary: 'clean geometric sans',
    mood: 'professional, authoritative',
  },

  visuals: {
    recommended: [
      'professional imagery',
      'data visualizations',
      'lifestyle photography',
    ],
    backgrounds: [
      'gradient backgrounds',
      'solid colors',
      'professional photos',
    ],
    avoid: [
      'cluttered composition',
      'too much text',
      'unprofessional imagery',
    ],
  },

  negativePrompts: {
    base: [
      'blurry',
      'pixelated',
      'low quality',
      'watermarks',
      'mockup',
      'poster on wall',
    ],
    typeSpecific: [
      'portrait orientation',
      'cluttered',
      'unprofessional',
      'casual',
    ],
  },

  promptTemplate: `Create a professional landscape post optimized for feed engagement.

The headline reads "[headline]" in bold, professional typography.
[subheadline_section]
[cta_section]

[visual_elements]

Design should be professional, clear, and optimized for desktop and mobile viewing.
Balance visual impact with clear messaging.

[color_scheme]
[style_treatment]

Quality: Feed-optimized, professional, engaging`,

  qualityKeywords: [
    'feed-optimized',
    'professional',
    'engaging',
    'authoritative',
  ],
}
