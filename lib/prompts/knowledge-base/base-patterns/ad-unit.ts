/**
 * Ad Unit Pattern
 * Variable aspect ratio for Display Ads, Leaderboard, Business Card
 */

import type { BasePattern } from '../types'

export const AD_UNIT_PATTERN: BasePattern = {
  id: 'ad_unit',
  name: 'Display Ad Unit',
  aspectRatioRange: 'variable',

  textElements: [
    {
      id: 'headline',
      role: 'headline',
      emphasis: 'high',
      required: true,
      maxLength: 25,
      typographyHint: 'BOLD, high-contrast sans-serif',
      positionHint: 'prominent position',
      renderingNote: 'Must grab attention in 1-2 seconds',
    },
    {
      id: 'cta',
      role: 'cta',
      emphasis: 'high',
      required: true,
      maxLength: 15,
      typographyHint: 'bold button-style text',
      positionHint: 'clear call-to-action area',
      renderingNote: 'High contrast, clearly clickable',
    },
  ],

  textHierarchy: ['headline', 'cta'],

  layout: {
    name: 'ad_unit_compact',
    zones: [
      { id: 'visual', position: 'dynamic', contentType: 'image' },
      { id: 'message', position: 'dynamic', contentType: 'text' },
      { id: 'cta_zone', position: 'bottom', contentType: 'text' },
    ],
    compositionStyle: 'compact',
    visualFlow: 'variable',
  },

  typography: {
    primary: 'bold high-contrast sans-serif',
    secondary: 'clean supporting text',
    mood: 'urgent, compelling, action-oriented',
  },

  visuals: {
    recommended: ['single focal point', 'high contrast', 'brand colors'],
    backgrounds: ['solid bold colors', 'gradient backgrounds'],
    avoid: ['cluttered composition', 'small text', 'multiple messages'],
  },

  negativePrompts: {
    base: [
      'cluttered',
      'multiple messages',
      'low contrast',
      'mockup',
      'poster on wall',
    ],
    typeSpecific: ['small text', 'unclear cta', 'busy background'],
  },

  promptTemplate: `Create a high-impact display ad that drives clicks.

The headline reads "[headline]" in BOLD, attention-grabbing typography.
The call-to-action reads "[cta]" in a clearly clickable button style.

[visual_elements]

AD RULES:
- Single clear message
- High contrast for readability
- Obvious call-to-action
- Attention-grabbing in 1-2 seconds

[color_scheme]
Quality: Click-driving, high-impact, conversion-optimized`,

  qualityKeywords: [
    'high-impact',
    'click-driving',
    'conversion-optimized',
    'attention-grabbing',
  ],
}
