/**
 * Thumbnail Click Pattern
 * 16:9 aspect ratio for YouTube Thumbnails, Video Covers
 */

import type { BasePattern } from '../types'

export const THUMBNAIL_CLICK_PATTERN: BasePattern = {
  id: 'thumbnail_click',
  name: 'Click-Worthy Thumbnail',
  aspectRatioRange: '16:9',

  textElements: [
    {
      id: 'title',
      role: 'headline',
      emphasis: 'high',
      required: true,
      maxLength: 30,
      typographyHint: 'BOLD, thick sans-serif with outline or shadow',
      positionHint: 'prominent position, not obscured',
      renderingNote: '3-5 words MAX. ALL CAPS for impact.',
    },
  ],

  textHierarchy: ['title'],

  layout: {
    name: 'thumbnail_split',
    zones: [
      {
        id: 'face_area',
        position: 'left',
        widthPercentage: 60,
        contentType: 'image',
      },
      {
        id: 'text_area',
        position: 'right',
        widthPercentage: 40,
        contentType: 'text',
      },
      {
        id: 'duration_badge',
        position: 'bottom-right',
        contentType: 'reserved',
        reservedFor: 'YouTube duration',
      },
    ],
    safeAreas: [
      { description: 'Bottom-right corner', reason: 'YouTube duration badge' },
    ],
    compositionStyle: 'split',
    visualFlow: 'left-to-right',
  },

  typography: {
    primary: 'bold impact sans-serif with outline',
    secondary: 'clean contrasting text',
    mood: 'bold, urgent, click-worthy',
  },

  visuals: {
    recommended: [
      'expressive human face',
      'emotion close-up',
      'bright colors',
      'action moment',
    ],
    backgrounds: [
      'bold solid colors',
      'gradient backgrounds',
      'blurred context',
    ],
    avoid: [
      'too many elements',
      'small faces',
      'muted colors',
      'generic imagery',
    ],
  },

  negativePrompts: {
    base: ['blurry', 'dark', 'muted colors', 'generic', 'mockup'],
    typeSpecific: [
      'small text',
      'no face visible',
      'boring composition',
      'too many elements',
      'content in bottom-right',
    ],
  },

  promptTemplate: `Create a click-worthy thumbnail that DEMANDS attention.

Include an EXPRESSIVE human face or compelling subject (fills 50%+ of frame).
The headline reads "[title]" in BOLD typography with outline, readable at small sizes.

[subject_description]

THUMBNAIL RULES:
- Face or subject fills left 60% of frame
- Text positioned for contrast and readability
- Avoid bottom-right corner (duration badge area)

Colors: Bright, saturated, contrasting
Style: YouTube thumbnail style - bold outlines, dramatic lighting

Quality: Click-worthy, scroll-stopping, competitive`,

  qualityKeywords: [
    'click-worthy',
    'scroll-stopping',
    'YouTube-optimized',
    'competitive',
  ],
}
