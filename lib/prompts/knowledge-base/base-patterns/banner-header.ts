/**
 * Banner Header Pattern
 * Ultra-wide aspect ratio for Covers, Banners, Headers
 */

import type { BasePattern } from '../types'

export const BANNER_HEADER_PATTERN: BasePattern = {
  id: 'banner_header',
  name: 'Banner/Header',
  aspectRatioRange: 'ultra-wide',

  textElements: [
    {
      id: 'headline',
      role: 'headline',
      emphasis: 'high',
      required: true,
      maxLength: 50,
      typographyHint: 'bold, impactful sans-serif',
      positionHint: 'center or left third',
    },
    {
      id: 'tagline',
      role: 'subheadline',
      emphasis: 'medium',
      required: false,
      maxLength: 80,
      typographyHint: 'clean supporting text',
      positionHint: 'below or beside headline',
    },
  ],

  textHierarchy: ['headline', 'tagline'],

  layout: {
    name: 'banner_wide',
    zones: [
      {
        id: 'left_safe',
        position: 'left',
        widthPercentage: 15,
        contentType: 'reserved',
        reservedFor: 'profile overlap',
      },
      {
        id: 'center',
        position: 'center',
        widthPercentage: 70,
        contentType: 'mixed',
      },
      {
        id: 'right_safe',
        position: 'right',
        widthPercentage: 15,
        contentType: 'reserved',
      },
    ],
    safeAreas: [
      {
        description: 'Left 15%',
        reason: 'Profile picture overlap on most platforms',
      },
      { description: 'Bottom edge', reason: 'Platform UI elements' },
    ],
    compositionStyle: 'wide-centered',
    visualFlow: 'left-to-right',
  },

  typography: {
    primary: 'bold impactful sans-serif',
    secondary: 'clean readable text',
    mood: 'brand-forward, impactful',
  },

  visuals: {
    recommended: [
      'panoramic visuals',
      'gradient backgrounds',
      'brand imagery',
    ],
    backgrounds: [
      'gradient sweeps',
      'professional photos',
      'abstract patterns',
    ],
    avoid: [
      'important content at edges',
      'small text',
      'cluttered layouts',
    ],
  },

  negativePrompts: {
    base: [
      'portrait orientation',
      'important content at edges',
      'mockup',
      'poster on wall',
    ],
    typeSpecific: ['cluttered', 'small text', 'content in corners'],
  },

  promptTemplate: `Create a professional banner/header design with wide aspect ratio.

The headline reads "[headline]" in bold, impactful typography positioned in the center zone.
[tagline_section]

BANNER RULES:
- Keep important content in CENTER 70% of frame
- Avoid left 15% (profile picture overlap area)
- Design for cropping on different devices

[visual_elements]
[color_scheme]

Quality: Banner-optimized, brand-forward, professional`,

  qualityKeywords: [
    'banner-optimized',
    'brand-forward',
    'professional',
    'impactful',
  ],
}
