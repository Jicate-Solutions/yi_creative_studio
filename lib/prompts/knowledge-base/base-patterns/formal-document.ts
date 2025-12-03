/**
 * Formal Document Pattern
 * Portrait aspect ratio for Letterhead, Resume, Book Cover
 */

import type { BasePattern } from '../types'

export const FORMAL_DOCUMENT_PATTERN: BasePattern = {
  id: 'formal_document',
  name: 'Formal Document',
  aspectRatioRange: 'portrait',

  textElements: [
    {
      id: 'title',
      role: 'headline',
      emphasis: 'high',
      required: true,
      maxLength: 80,
      typographyHint: 'elegant serif or professional sans',
      positionHint: 'prominent position',
    },
    {
      id: 'subtitle',
      role: 'subheadline',
      emphasis: 'medium',
      required: false,
      maxLength: 120,
      typographyHint: 'clean secondary font',
      positionHint: 'below title',
    },
    {
      id: 'author',
      role: 'label',
      emphasis: 'medium',
      required: false,
      typographyHint: 'clean professional text',
      positionHint: 'below subtitle or bottom',
    },
  ],

  textHierarchy: ['title', 'subtitle', 'author'],

  layout: {
    name: 'formal_document_standard',
    zones: [
      {
        id: 'header',
        position: 'top',
        heightPercentage: 15,
        contentType: 'text',
      },
      {
        id: 'main',
        position: 'center',
        heightPercentage: 70,
        contentType: 'mixed',
      },
      {
        id: 'footer',
        position: 'bottom',
        heightPercentage: 15,
        contentType: 'text',
      },
    ],
    compositionStyle: 'formal-centered',
    visualFlow: 'top-to-bottom',
  },

  typography: {
    primary: 'elegant serif or professional sans-serif',
    secondary: 'clean formal text',
    mood: 'professional, authoritative, refined',
  },

  visuals: {
    recommended: [
      'subtle backgrounds',
      'professional imagery',
      'elegant graphics',
    ],
    backgrounds: [
      'subtle textures',
      'gradient accents',
      'solid professional colors',
    ],
    avoid: [
      'casual imagery',
      'bright playful colors',
      'cluttered layouts',
    ],
  },

  negativePrompts: {
    base: ['casual', 'playful', 'cartoon', 'mockup', 'poster on wall'],
    typeSpecific: ['unprofessional', 'cluttered', 'low quality'],
  },

  promptTemplate: `Create a professional, formal document design.

The title reads "[title]" in elegant, professional typography as the focal point.
[subtitle_section]
[author_section]

[visual_elements]

FORMAL DOCUMENT RULES:
- Clean, uncluttered layout
- Professional color palette
- Elegant typography hierarchy
- Refined, authoritative appearance

[color_scheme]
Quality: Professional, refined, authoritative`,

  qualityKeywords: ['professional', 'refined', 'authoritative', 'elegant'],
}
