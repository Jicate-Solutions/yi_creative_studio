/**
 * Portrait Story Pattern
 * 9:16 aspect ratio for Stories, Reels, TikTok, WhatsApp Status
 */

import type { BasePattern } from '../types'

export const PORTRAIT_STORY_PATTERN: BasePattern = {
  id: 'portrait_story',
  name: 'Vertical Story/Reel',
  aspectRatioRange: '9:16',

  textElements: [
    {
      id: 'headline',
      role: 'headline',
      emphasis: 'high',
      required: true,
      maxLength: 30,
      typographyHint: 'bold, impactful sans-serif',
      positionHint: 'center safe zone',
      renderingNote: 'Avoid top 15% and bottom 20% for platform UI',
    },
    {
      id: 'cta',
      role: 'cta',
      emphasis: 'high',
      required: false,
      maxLength: 15,
      typographyHint: 'bold with swipe indicator',
      positionHint: 'lower center (above UI)',
    },
  ],

  textHierarchy: ['headline', 'cta'],

  layout: {
    name: 'vertical_story',
    zones: [
      {
        id: 'top_safe',
        position: 'top',
        heightPercentage: 15,
        contentType: 'reserved',
        reservedFor: 'platform UI',
      },
      {
        id: 'main',
        position: 'center',
        heightPercentage: 65,
        contentType: 'mixed',
      },
      {
        id: 'bottom_safe',
        position: 'bottom',
        heightPercentage: 20,
        contentType: 'reserved',
        reservedFor: 'platform UI',
      },
    ],
    safeAreas: [
      { description: 'Top 15%', reason: 'Story bar, profile info' },
      { description: 'Bottom 20%', reason: 'Reply box, navigation' },
    ],
    compositionStyle: 'centered',
    visualFlow: 'top-to-bottom',
  },

  typography: {
    primary: 'bold impact sans-serif',
    secondary: 'clean readable text',
    mood: 'urgent, attention-grabbing',
  },

  visuals: {
    recommended: [
      'full-screen visuals',
      'strong focal point',
      'bright colors',
      'movement suggestion',
    ],
    backgrounds: [
      'gradient backgrounds',
      'lifestyle photos',
      'abstract patterns',
    ],
    avoid: [
      'small text',
      'content in corners',
      'busy backgrounds',
      'horizontal layouts',
    ],
  },

  negativePrompts: {
    base: ['blurry', 'dark', 'muted colors', 'mockup', 'poster on wall'],
    typeSpecific: [
      'small text',
      'horizontal composition',
      'content in UI zones',
      'landscape orientation',
    ],
  },

  promptTemplate: `Create a full-screen vertical story design that grabs attention instantly.

The headline reads "[headline]" in bold, impactful typography centered in the safe zone.
[cta_section]

SAFE ZONE RULES:
- Keep key content in CENTER 65% of frame
- Avoid top 15% (platform UI)
- Avoid bottom 20% (reply/navigation)

[visual_elements]
[color_scheme]

Quality: Story-optimized, thumb-stopping, full-screen impact`,

  qualityKeywords: [
    'thumb-stopping',
    'full-screen',
    'story-optimized',
    'mobile-native',
  ],
}
