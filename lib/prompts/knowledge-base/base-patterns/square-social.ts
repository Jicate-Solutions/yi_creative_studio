/**
 * Square Social Pattern
 * 1:1 aspect ratio for Instagram Post, Facebook Ad, Square Ad
 */

import type { BasePattern } from '../types'

export const SQUARE_SOCIAL_PATTERN: BasePattern = {
  id: 'square_social',
  name: 'Square Social Media',
  aspectRatioRange: '1:1',

  textElements: [
    {
      id: 'headline',
      role: 'headline',
      emphasis: 'high',
      required: true,
      maxLength: 40,
      typographyHint: 'bold, eye-catching sans-serif',
      positionHint: 'center or top third',
      renderingNote: 'Must be readable while scrolling',
    },
    {
      id: 'subheadline',
      role: 'subheadline',
      emphasis: 'medium',
      required: false,
      maxLength: 60,
      typographyHint: 'clean supporting text',
      positionHint: 'below headline',
    },
    {
      id: 'cta',
      role: 'cta',
      emphasis: 'high',
      required: false,
      maxLength: 20,
      typographyHint: 'bold, action-oriented',
      positionHint: 'bottom third',
      renderingNote: 'Contrasting color for visibility',
    },
  ],

  textHierarchy: ['headline', 'cta', 'subheadline'],

  layout: {
    name: 'square_centered',
    zones: [{ id: 'main', position: 'center', contentType: 'mixed' }],
    compositionStyle: 'centered',
    visualFlow: 'radial',
  },

  typography: {
    primary: 'bold modern sans-serif',
    secondary: 'clean geometric sans',
    mood: 'engaging, scroll-stopping',
  },

  visuals: {
    recommended: [
      'vibrant colors',
      'strong contrast',
      'clean composition',
      'lifestyle imagery',
    ],
    backgrounds: [
      'solid bold colors',
      'gradient backgrounds',
      'lifestyle photography',
    ],
    avoid: [
      'too much text',
      'cluttered composition',
      'dark/hard to read',
      'small fonts',
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
      // Label exclusions - prevent field labels from appearing in images
      'field labels with colons',
      'data labels',
      'form field names',
      'placeholder text',
      'instruction text',
    ],
    typeSpecific: [
      'too much text',
      'small fonts',
      'cluttered',
      'corporate boring',
      'stock photo feel',
      // Specific labels that should never appear
      'text containing Title colon',
      'text containing Date colon',
      'text containing Type colon',
    ],
  },

  promptTemplate: `Create an eye-catching square social media post that stops the scroll.

The headline reads "[headline]" in bold, eye-catching typography.
[subheadline_section]
[cta_section]

[visual_elements]

Design should be bold, vibrant, and optimized for mobile viewing.
Text must be large enough to read on a phone screen.

[color_scheme]
[style_treatment]

Quality: Social-media-worthy, engagement-optimized, mobile-first`,

  qualityKeywords: [
    'scroll-stopping',
    'engagement-optimized',
    'mobile-first',
    'vibrant',
  ],
}
