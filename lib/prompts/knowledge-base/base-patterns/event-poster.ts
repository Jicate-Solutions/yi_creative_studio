/**
 * Event Poster Pattern (PROVEN from Prompt.md)
 * 4:5 aspect ratio for Event Posters, Announcements
 *
 * This pattern is based on the proven Ideogram prompt template
 * from doc/Prompt.md that produces high-quality results.
 */

import type { BasePattern } from '../types'

export const EVENT_POSTER_PATTERN: BasePattern = {
  id: 'event_poster',
  name: 'Event Poster',
  aspectRatioRange: '4:5',

  textElements: [
    {
      id: 'organization_name',
      role: 'label',
      emphasis: 'medium',
      required: true,
      typographyHint: 'clean sans-serif, medium weight',
      positionHint: 'top-center',
    },
    {
      id: 'event_name',
      role: 'headline',
      emphasis: 'high',
      required: true,
      maxLength: 60,
      typographyHint: 'bold, clean sans-serif typeface',
      positionHint: 'centered, largest text',
    },
    {
      id: 'guest_info',
      role: 'subheadline',
      emphasis: 'medium',
      required: false,
      typographyHint: 'medium weight sans-serif',
      positionHint: 'below event name',
    },
    {
      id: 'date_time',
      role: 'body',
      emphasis: 'medium',
      required: true,
      typographyHint: 'clear, single line format',
      renderingNote: 'Format as "Date | Time"',
    },
    {
      id: 'venue',
      role: 'body',
      emphasis: 'low',
      required: false,
      typographyHint: 'readable body text',
      positionHint: 'below date/time',
    },
  ],

  textHierarchy: [
    'event_name',
    'guest_info',
    'date_time',
    'venue',
    'organization_name',
  ],

  layout: {
    name: 'event_poster_standard',
    zones: [
      {
        id: 'header',
        position: 'top',
        heightPercentage: 10,
        contentType: 'text',
      },
      {
        id: 'hero',
        position: 'center',
        heightPercentage: 50,
        contentType: 'mixed',
      },
      {
        id: 'details',
        position: 'center',
        heightPercentage: 25,
        contentType: 'text',
      },
      {
        id: 'footer',
        position: 'bottom',
        heightPercentage: 15,
        contentType: 'reserved',
        reservedFor: 'logo overlay',
      },
    ],
    compositionStyle: 'centered',
    visualFlow: 'top-to-bottom',
  },

  typography: {
    primary: 'bold, clean sans-serif',
    secondary: 'medium weight geometric sans',
    mood: 'professional and modern',
  },

  visuals: {
    recommended: [
      'podium with microphone',
      'engaged audience',
      'presentation screen',
      'professional lighting',
    ],
    backgrounds: [
      'gradient blending brand colors',
      'professional venue setting',
      'abstract geometric',
    ],
    avoid: [
      'clipart',
      'cartoon style',
      'unprofessional imagery',
      'cluttered layouts',
    ],
  },

  negativePrompts: {
    base: [
      'logos',
      'emblems',
      'seals',
      'social media icons',
      'cartoon style',
      'clutter',
      'mockup',
      'poster on wall',
      // Label exclusions - prevent field labels from appearing in images
      'field labels with colons',
      'data labels',
      'form field names',
      'placeholder text',
      'instruction text',
      'metadata text',
    ],
    typeSpecific: [
      'hard-to-read text',
      'irrelevant imagery',
      'non-specified colors',
      'unprofessional fonts',
      // Specific labels that should never appear
      'text containing Event Name colon',
      'text containing Date colon',
      'text containing Time colon',
      'text containing Venue colon',
    ],
  },

  promptTemplate: `Create a professional, modern event banner for "[event_name]" hosted by "[organization_name]".
The banner should feature [color_description], with [background_color] text backgrounds where needed for readability.

Prominently display the following text in a bold, clean sans-serif typeface:
1. "[organization_name]" at the top center
2. "[event_name]" as the largest text, centered
3. "[date_time]" in a clear, single line format
4. "[venue]" in a single line

[guest_info_section]
[visual_elements]

Ensure a balanced layout with clear text hierarchy. All text should be easily readable.
Leave the bottom 15% of the banner blank for social media details.

Theme: [theme]
Style: Professional and modern`,

  qualityKeywords: [
    'award-winning',
    'professional',
    'magazine-quality',
    'crisp',
    'legible',
  ],
}
