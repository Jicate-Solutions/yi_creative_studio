/**
 * Format-Specific Overrides
 *
 * Platform-specific customizations that extend base patterns.
 * These overrides handle unique requirements for specific formats
 * like safe zones, typography adjustments, and quality keywords.
 */

import type { FormatOverride } from '../types'

// ============================================================================
// Format Overrides Registry
// ============================================================================

export const FORMAT_OVERRIDES: Record<string, FormatOverride> = {
  // ---------------------------------------------------------------------------
  // Instagram Story - specific safe zones
  // ---------------------------------------------------------------------------
  instagram_story: {
    formatId: 'instagram_story',
    safeAreas: [
      { description: 'Top 14%', reason: 'Username, story progress bar' },
      { description: 'Bottom 20%', reason: 'Reply box, "Send message"' },
    ],
    qualityKeywords: ['Instagram-optimized', 'story-ready', 'swipe-worthy'],
    promptTemplateAdditions: `
INSTAGRAM STORY RULES:
- Avoid top 14% for username and progress bar
- Avoid bottom 20% for reply box
- Design for tap-through navigation`,
  },

  // ---------------------------------------------------------------------------
  // Instagram Reel - video cover optimizations
  // ---------------------------------------------------------------------------
  instagram_reel: {
    formatId: 'instagram_reel',
    safeAreas: [
      { description: 'Bottom 25%', reason: 'Caption, music, buttons' },
      { description: 'Right edge', reason: 'Like, comment, share buttons' },
    ],
    qualityKeywords: ['Reels-optimized', 'viral-worthy', 'engaging'],
    promptTemplateAdditions: `
INSTAGRAM REEL RULES:
- Avoid bottom 25% for captions and UI
- Avoid right edge for interaction buttons
- Design for vertical video format`,
  },

  // ---------------------------------------------------------------------------
  // TikTok Cover - specific requirements
  // ---------------------------------------------------------------------------
  tiktok_cover: {
    formatId: 'tiktok_cover',
    safeAreas: [
      {
        description: 'Bottom 30%',
        reason: 'TikTok caption, buttons, watermark',
      },
      { description: 'Right 15%', reason: 'Like, comment, share buttons' },
    ],
    qualityKeywords: ['TikTok-ready', 'viral-worthy', 'For You Page optimized'],
    promptTemplateAdditions: `
TIKTOK-SPECIFIC RULES:
- Avoid right edge and bottom third for TikTok UI elements
- Design for sound-on viewing
- Create visual hook in first frame`,
  },

  // ---------------------------------------------------------------------------
  // WhatsApp Status - messaging context
  // ---------------------------------------------------------------------------
  whatsapp_status: {
    formatId: 'whatsapp_status',
    safeAreas: [
      { description: 'Top 10%', reason: 'Status bar' },
      { description: 'Bottom 15%', reason: 'Reply indicator' },
    ],
    qualityKeywords: ['WhatsApp-optimized', 'share-worthy', 'personal'],
    promptTemplateAdditions: `
WHATSAPP STATUS RULES:
- Personal, shareable content
- Works in messaging context
- Clear without caption`,
  },

  // ---------------------------------------------------------------------------
  // Pinterest Pin - long-form content
  // ---------------------------------------------------------------------------
  pinterest_pin: {
    formatId: 'pinterest_pin',
    typography: {
      primary: 'bold serif or elegant sans',
      secondary: 'clean readable text',
      mood: 'inspirational, aspirational',
    },
    visuals: {
      recommended: [
        'step-by-step visuals',
        'lifestyle imagery',
        'infographic elements',
      ],
      backgrounds: ['lifestyle photography', 'clean backgrounds'],
      avoid: ['too much text', 'cluttered layouts', 'low contrast'],
    },
    qualityKeywords: ['Pinterest-optimized', 'save-worthy', 'inspirational'],
    promptTemplateAdditions: `
PINTEREST PIN RULES:
- Vertical format optimized for Pinterest feed
- Include text overlay for search optimization
- Inspirational or educational content`,
  },

  // ---------------------------------------------------------------------------
  // LinkedIn Post - professional tone
  // ---------------------------------------------------------------------------
  linkedin_post: {
    formatId: 'linkedin_post',
    typography: {
      primary: 'professional sans-serif',
      secondary: 'clean body text',
      mood: 'professional, authoritative, thought-leadership',
    },
    visuals: {
      recommended: [
        'data visualizations',
        'professional imagery',
        'clean charts',
      ],
      backgrounds: ['solid professional colors', 'subtle gradients'],
      avoid: ['casual imagery', 'memes', 'overly playful elements'],
    },
    qualityKeywords: ['LinkedIn-optimized', 'professional', 'thought-leadership'],
    promptTemplateAdditions: `
LINKEDIN RULES:
- Professional B2B audience
- Data-driven visuals work well
- Thought-leadership positioning`,
  },

  // ---------------------------------------------------------------------------
  // Certificate - formal requirements
  // ---------------------------------------------------------------------------
  certificate: {
    formatId: 'certificate',
    textElements: [
      {
        id: 'certificate_type',
        role: 'label',
        emphasis: 'medium',
        required: true,
      },
      {
        id: 'recipient_name',
        role: 'headline',
        emphasis: 'high',
        required: true,
        renderingNote: 'The name is the HERO of the certificate',
      },
      { id: 'achievement', role: 'body', emphasis: 'medium', required: true },
      { id: 'date', role: 'label', emphasis: 'low', required: true },
      { id: 'authority', role: 'label', emphasis: 'medium', required: true },
    ],
    textHierarchy: [
      'recipient_name',
      'certificate_type',
      'achievement',
      'authority',
      'date',
    ],
    promptTemplateAdditions: `
CERTIFICATE RULES:
- Leave space for official signatures
- Include seal/badge area
- Frame-worthy elegant design`,
  },

  // ---------------------------------------------------------------------------
  // Business Card - compact format
  // ---------------------------------------------------------------------------
  business_card: {
    formatId: 'business_card',
    textElements: [
      {
        id: 'name',
        role: 'headline',
        emphasis: 'high',
        required: true,
        maxLength: 30,
      },
      {
        id: 'title',
        role: 'subheadline',
        emphasis: 'medium',
        required: true,
        maxLength: 40,
      },
      { id: 'contact', role: 'body', emphasis: 'low', required: true },
    ],
    typography: {
      primary: 'clean modern sans-serif',
      secondary: 'elegant body text',
      mood: 'professional, memorable',
    },
    qualityKeywords: [
      'print-ready',
      'professional',
      'memorable',
      'networking-ready',
    ],
    promptTemplateAdditions: `
BUSINESS CARD RULES:
- Readable at small size (3.5" x 2")
- Contact info clearly visible
- Brand-aligned design`,
  },

  // ---------------------------------------------------------------------------
  // YouTube Thumbnail - specific optimizations
  // ---------------------------------------------------------------------------
  youtube_thumbnail: {
    formatId: 'youtube_thumbnail',
    safeAreas: [
      { description: 'Bottom-right corner', reason: 'YouTube duration badge' },
    ],
    qualityKeywords: [
      'click-worthy',
      'competitive',
      'YouTube-algorithm-optimized',
    ],
    promptTemplateAdditions: `
YOUTUBE-SPECIFIC RULES:
- Face fills 50%+ of frame (expressive emotions)
- Text readable at 120x68px minimum
- High contrast, saturated colors
- Avoid content in bottom-right (duration badge)`,
  },

  // ---------------------------------------------------------------------------
  // Video Cover - general video thumbnail
  // ---------------------------------------------------------------------------
  video_cover: {
    formatId: 'video_cover',
    qualityKeywords: ['click-worthy', 'video-optimized', 'professional'],
    promptTemplateAdditions: `
VIDEO COVER RULES:
- Clear subject or topic indication
- Readable text at small sizes
- Action-oriented imagery`,
  },

  // ---------------------------------------------------------------------------
  // Billboard - large format outdoor
  // ---------------------------------------------------------------------------
  billboard: {
    formatId: 'billboard',
    textElements: [
      {
        id: 'headline',
        role: 'headline',
        emphasis: 'high',
        required: true,
        maxLength: 7,
        renderingNote: '7 words or less - readable in 3 seconds',
      },
      {
        id: 'tagline',
        role: 'subheadline',
        emphasis: 'medium',
        required: false,
        maxLength: 15,
      },
    ],
    typography: {
      primary: 'ultra-bold sans-serif',
      secondary: 'clean supporting text',
      mood: 'impactful, instant recognition',
    },
    visuals: {
      recommended: ['single focal point', 'high contrast', 'simple composition'],
      backgrounds: ['bold solid colors', 'simple gradients'],
      avoid: ['small text', 'complex imagery', 'multiple messages'],
    },
    qualityKeywords: ['billboard-optimized', 'instant-impact', 'outdoor-ready'],
    promptTemplateAdditions: `
BILLBOARD RULES:
- Readable at highway speed (3 seconds)
- 7 words or less
- Single clear message
- High contrast for outdoor viewing`,
  },

  // ---------------------------------------------------------------------------
  // Invitation - event context
  // ---------------------------------------------------------------------------
  invitation: {
    formatId: 'invitation',
    typography: {
      primary: 'elegant script or serif',
      secondary: 'clean formal text',
      mood: 'elegant, celebratory',
    },
    qualityKeywords: ['elegant', 'celebratory', 'memorable'],
    promptTemplateAdditions: `
INVITATION RULES:
- Event-appropriate elegance
- All essential details visible (date, time, venue)
- RSVP information clear`,
  },

  // ---------------------------------------------------------------------------
  // Flyer A4/A5 - promotional print
  // ---------------------------------------------------------------------------
  flyer_a4: {
    formatId: 'flyer_a4',
    qualityKeywords: ['print-ready', 'promotional', '300dpi'],
    promptTemplateAdditions: `
PRINT FLYER RULES:
- 300 DPI print-ready
- Bleed area consideration
- Clear call-to-action`,
  },

  flyer_a5: {
    formatId: 'flyer_a5',
    qualityKeywords: ['print-ready', 'promotional', '300dpi'],
    promptTemplateAdditions: `
PRINT FLYER RULES:
- 300 DPI print-ready
- Compact layout for A5 size
- Essential information prioritized`,
  },

  // ---------------------------------------------------------------------------
  // Presentation slides
  // ---------------------------------------------------------------------------
  presentation_16_9: {
    formatId: 'presentation_16_9',
    qualityKeywords: ['slide-optimized', 'presenter-friendly', 'clean'],
    promptTemplateAdditions: `
PRESENTATION SLIDE RULES:
- Minimal text (presenter speaks)
- High contrast for projection
- Single key message per slide`,
  },

  presentation_4_3: {
    formatId: 'presentation_4_3',
    qualityKeywords: ['slide-optimized', 'presenter-friendly', 'clean'],
    promptTemplateAdditions: `
PRESENTATION SLIDE RULES:
- Traditional 4:3 format for older projectors
- Minimal text approach
- Clear visual hierarchy`,
  },

  // ---------------------------------------------------------------------------
  // Book Cover
  // ---------------------------------------------------------------------------
  book_cover: {
    formatId: 'book_cover',
    typography: {
      primary: 'impactful title font',
      secondary: 'author name font',
      mood: 'genre-appropriate, shelf-ready',
    },
    qualityKeywords: ['shelf-ready', 'genre-appropriate', 'professional'],
    promptTemplateAdditions: `
BOOK COVER RULES:
- Title readable at thumbnail size
- Genre-appropriate styling
- Author name clearly visible
- Spine consideration if needed`,
  },

  // ---------------------------------------------------------------------------
  // Resume
  // ---------------------------------------------------------------------------
  resume: {
    formatId: 'resume',
    typography: {
      primary: 'professional sans-serif',
      secondary: 'clean body text',
      mood: 'professional, scannable',
    },
    qualityKeywords: ['ATS-friendly', 'professional', 'scannable'],
    promptTemplateAdditions: `
RESUME RULES:
- Clean, scannable layout
- Professional color palette
- Clear section hierarchy`,
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get override for a specific format
 */
export function getFormatOverride(formatId: string): FormatOverride | undefined {
  return FORMAT_OVERRIDES[formatId]
}

/**
 * Check if a format has custom overrides
 */
export function hasFormatOverride(formatId: string): boolean {
  return formatId in FORMAT_OVERRIDES
}

/**
 * Get all format IDs that have overrides
 */
export function getOverriddenFormatIds(): string[] {
  return Object.keys(FORMAT_OVERRIDES)
}
