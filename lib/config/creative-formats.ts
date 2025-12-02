/**
 * Creative Format Configuration
 * Canva-style format definitions for Yi CreativeStudio
 *
 * Supports 30+ creative formats across 6 categories
 */

// ============================================================================
// Types
// ============================================================================

export type FormatCategoryId =
  | 'social_media'
  | 'print'
  | 'presentations'
  | 'marketing'
  | 'documents'
  | 'video'

export type CreativeFormatId =
  // Social Media
  | 'instagram_post'
  | 'instagram_story'
  | 'instagram_reel'
  | 'facebook_post'
  | 'facebook_cover'
  | 'facebook_ad'
  | 'linkedin_post'
  | 'linkedin_banner'
  | 'twitter_post'
  | 'twitter_header'
  | 'pinterest_pin'
  | 'tiktok_cover'
  | 'whatsapp_status'
  // Video
  | 'youtube_thumbnail'
  | 'youtube_banner'
  | 'video_cover'
  // Print
  | 'event_poster'
  | 'portrait_poster'
  | 'landscape_poster'
  | 'flyer_a5'
  | 'flyer_a4'
  | 'business_card'
  | 'invitation'
  | 'certificate'
  | 'brochure'
  // Presentations
  | 'presentation_16_9'
  | 'presentation_4_3'
  // Marketing
  | 'web_banner'
  | 'email_header'
  | 'billboard'
  | 'announcement'
  | 'leaderboard_ad'
  | 'square_ad'
  // Documents
  | 'letterhead'
  | 'resume'
  | 'report_cover'
  | 'book_cover'
  // Custom
  | 'custom'

export interface FormatCategory {
  id: FormatCategoryId
  label: string
  icon: string
  description: string
  color: string
}

export interface CreativeFormat {
  id: CreativeFormatId
  label: string
  category: FormatCategoryId
  aspectRatio: string
  width: number
  height: number
  description?: string
  popular?: boolean
  new?: boolean
  useCases?: string[]
}

// ============================================================================
// Format Categories
// ============================================================================

export const FORMAT_CATEGORIES: Record<FormatCategoryId, FormatCategory> = {
  social_media: {
    id: 'social_media',
    label: 'Social Media',
    icon: 'Share2',
    description: 'Posts, stories, and ads for social platforms',
    color: '#E1306C', // Instagram pink
  },
  video: {
    id: 'video',
    label: 'Video',
    icon: 'Video',
    description: 'Thumbnails and covers for video content',
    color: '#FF0000', // YouTube red
  },
  print: {
    id: 'print',
    label: 'Print',
    icon: 'Printer',
    description: 'Posters, flyers, cards, and certificates',
    color: '#1976D2', // Blue
  },
  presentations: {
    id: 'presentations',
    label: 'Presentations',
    icon: 'Presentation',
    description: 'Slides and presentation materials',
    color: '#FF6F00', // Orange
  },
  marketing: {
    id: 'marketing',
    label: 'Marketing',
    icon: 'Megaphone',
    description: 'Banners, ads, and promotional materials',
    color: '#7B1FA2', // Purple
  },
  documents: {
    id: 'documents',
    label: 'Documents',
    icon: 'FileText',
    description: 'Letterheads, resumes, and report covers',
    color: '#388E3C', // Green
  },
}

// Category order for display
export const FORMAT_CATEGORY_ORDER: FormatCategoryId[] = [
  'social_media',
  'video',
  'print',
  'presentations',
  'marketing',
  'documents',
]

// ============================================================================
// Creative Formats (30+ formats)
// ============================================================================

export const CREATIVE_FORMATS: Record<CreativeFormatId, CreativeFormat> = {
  // ---------------------------------------------------------------------------
  // Social Media Formats
  // ---------------------------------------------------------------------------
  instagram_post: {
    id: 'instagram_post',
    label: 'Instagram Post',
    category: 'social_media',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    description: 'Square post for Instagram feed',
    popular: true,
    useCases: ['Feed posts', 'Carousel', 'Product showcase'],
  },
  instagram_story: {
    id: 'instagram_story',
    label: 'Instagram Story',
    category: 'social_media',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    description: 'Full-screen vertical story',
    popular: true,
    useCases: ['Stories', 'Highlights', 'Behind the scenes'],
  },
  instagram_reel: {
    id: 'instagram_reel',
    label: 'Instagram Reel Cover',
    category: 'social_media',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    description: 'Cover image for Reels',
    useCases: ['Reel covers', 'Video thumbnails'],
  },
  facebook_post: {
    id: 'facebook_post',
    label: 'Facebook Post',
    category: 'social_media',
    aspectRatio: '1.91:1',
    width: 1200,
    height: 630,
    description: 'Optimal size for Facebook feed',
    popular: true,
    useCases: ['Feed posts', 'Shared content', 'Link previews'],
  },
  facebook_cover: {
    id: 'facebook_cover',
    label: 'Facebook Cover',
    category: 'social_media',
    aspectRatio: '2.7:1',
    width: 820,
    height: 312,
    description: 'Cover photo for Facebook page',
    useCases: ['Page cover', 'Event cover', 'Group cover'],
  },
  facebook_ad: {
    id: 'facebook_ad',
    label: 'Facebook Ad',
    category: 'social_media',
    aspectRatio: '1:1',
    width: 1080,
    height: 1080,
    description: 'Square ad format for Facebook',
    useCases: ['Sponsored posts', 'Carousel ads', 'Collection ads'],
  },
  linkedin_post: {
    id: 'linkedin_post',
    label: 'LinkedIn Post',
    category: 'social_media',
    aspectRatio: '1.91:1',
    width: 1200,
    height: 627,
    description: 'Professional post for LinkedIn',
    popular: true,
    useCases: ['Feed posts', 'Articles', 'Company updates'],
  },
  linkedin_banner: {
    id: 'linkedin_banner',
    label: 'LinkedIn Banner',
    category: 'social_media',
    aspectRatio: '4:1',
    width: 1584,
    height: 396,
    description: 'Profile or company page banner',
    useCases: ['Profile banner', 'Company page', 'Personal branding'],
  },
  twitter_post: {
    id: 'twitter_post',
    label: 'Twitter/X Post',
    category: 'social_media',
    aspectRatio: '16:9',
    width: 1600,
    height: 900,
    description: 'Image post for Twitter/X',
    popular: true,
    useCases: ['Tweet images', 'Thread headers', 'Announcements'],
  },
  twitter_header: {
    id: 'twitter_header',
    label: 'Twitter/X Header',
    category: 'social_media',
    aspectRatio: '3:1',
    width: 1500,
    height: 500,
    description: 'Profile header for Twitter/X',
    useCases: ['Profile banner', 'Brand header'],
  },
  pinterest_pin: {
    id: 'pinterest_pin',
    label: 'Pinterest Pin',
    category: 'social_media',
    aspectRatio: '2:3',
    width: 1000,
    height: 1500,
    description: 'Vertical pin for Pinterest',
    popular: true,
    useCases: ['Pins', 'Idea pins', 'Infographics'],
  },
  tiktok_cover: {
    id: 'tiktok_cover',
    label: 'TikTok Cover',
    category: 'social_media',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    description: 'Video cover for TikTok',
    useCases: ['Video covers', 'Profile highlights'],
  },
  whatsapp_status: {
    id: 'whatsapp_status',
    label: 'WhatsApp Status',
    category: 'social_media',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    description: 'Full-screen status image',
    popular: true,
    useCases: ['Status updates', 'Announcements', 'Promotions'],
  },

  // ---------------------------------------------------------------------------
  // Video Formats
  // ---------------------------------------------------------------------------
  youtube_thumbnail: {
    id: 'youtube_thumbnail',
    label: 'YouTube Thumbnail',
    category: 'video',
    aspectRatio: '16:9',
    width: 1280,
    height: 720,
    description: 'Eye-catching video thumbnail',
    popular: true,
    useCases: ['Video thumbnails', 'Custom previews'],
  },
  youtube_banner: {
    id: 'youtube_banner',
    label: 'YouTube Banner',
    category: 'video',
    aspectRatio: '16:9',
    width: 2560,
    height: 1440,
    description: 'Channel banner for YouTube',
    useCases: ['Channel art', 'Brand banner'],
  },
  video_cover: {
    id: 'video_cover',
    label: 'Video Cover',
    category: 'video',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    description: 'Generic video cover image',
    useCases: ['Video covers', 'Podcast covers', 'Webinar banners'],
  },

  // ---------------------------------------------------------------------------
  // Print Formats
  // ---------------------------------------------------------------------------
  event_poster: {
    id: 'event_poster',
    label: 'Event Poster',
    category: 'print',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    description: 'Professional event poster',
    popular: true,
    useCases: ['Events', 'Seminars', 'Workshops', 'Conferences'],
  },
  portrait_poster: {
    id: 'portrait_poster',
    label: 'Portrait Poster',
    category: 'print',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    description: 'Tall vertical poster',
    popular: true,
    useCases: ['Standees', 'Roll-ups', 'Display posters'],
  },
  landscape_poster: {
    id: 'landscape_poster',
    label: 'Landscape Poster',
    category: 'print',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    description: 'Wide horizontal poster',
    useCases: ['Banners', 'Displays', 'Presentations'],
  },
  flyer_a5: {
    id: 'flyer_a5',
    label: 'Flyer (A5)',
    category: 'print',
    aspectRatio: '1:1.41',
    width: 1748,
    height: 2480,
    description: 'A5 sized flyer (148 x 210 mm)',
    useCases: ['Handouts', 'Promotions', 'Menu cards'],
  },
  flyer_a4: {
    id: 'flyer_a4',
    label: 'Flyer (A4)',
    category: 'print',
    aspectRatio: '1:1.41',
    width: 2480,
    height: 3508,
    description: 'A4 sized flyer (210 x 297 mm)',
    popular: true,
    useCases: ['Posters', 'Notices', 'Information sheets'],
  },
  business_card: {
    id: 'business_card',
    label: 'Business Card',
    category: 'print',
    aspectRatio: '1.75:1',
    width: 1050,
    height: 600,
    description: 'Standard business card size',
    useCases: ['Contact cards', 'Networking', 'Branding'],
  },
  invitation: {
    id: 'invitation',
    label: 'Invitation',
    category: 'print',
    aspectRatio: '5:7',
    width: 1500,
    height: 2100,
    description: 'Elegant invitation card',
    popular: true,
    useCases: ['Events', 'Weddings', 'Parties', 'Corporate events'],
  },
  certificate: {
    id: 'certificate',
    label: 'Certificate',
    category: 'print',
    aspectRatio: '1.41:1',
    width: 3508,
    height: 2480,
    description: 'Landscape certificate',
    popular: true,
    useCases: ['Awards', 'Appreciation', 'Completion', 'Recognition'],
  },
  brochure: {
    id: 'brochure',
    label: 'Brochure',
    category: 'print',
    aspectRatio: '1:1.41',
    width: 2480,
    height: 3508,
    description: 'A4 brochure page',
    useCases: ['Product brochures', 'Company profiles', 'Catalogs'],
  },

  // ---------------------------------------------------------------------------
  // Presentation Formats
  // ---------------------------------------------------------------------------
  presentation_16_9: {
    id: 'presentation_16_9',
    label: 'Presentation (16:9)',
    category: 'presentations',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    description: 'Widescreen presentation slide',
    popular: true,
    useCases: ['Slides', 'Keynotes', 'Webinars', 'Pitches'],
  },
  presentation_4_3: {
    id: 'presentation_4_3',
    label: 'Presentation (4:3)',
    category: 'presentations',
    aspectRatio: '4:3',
    width: 1024,
    height: 768,
    description: 'Standard presentation slide',
    useCases: ['Traditional slides', 'Projector presentations'],
  },

  // ---------------------------------------------------------------------------
  // Marketing Formats
  // ---------------------------------------------------------------------------
  web_banner: {
    id: 'web_banner',
    label: 'Web Banner',
    category: 'marketing',
    aspectRatio: '4:1',
    width: 1200,
    height: 300,
    description: 'Website header banner',
    useCases: ['Website headers', 'Hero sections', 'Promotional banners'],
  },
  email_header: {
    id: 'email_header',
    label: 'Email Header',
    category: 'marketing',
    aspectRatio: '3:1',
    width: 600,
    height: 200,
    description: 'Email newsletter header',
    useCases: ['Email campaigns', 'Newsletters', 'Announcements'],
  },
  billboard: {
    id: 'billboard',
    label: 'Billboard',
    category: 'marketing',
    aspectRatio: '2:1',
    width: 2400,
    height: 1200,
    description: 'Large outdoor billboard',
    useCases: ['Outdoor advertising', 'Display ads', 'Signage'],
  },
  announcement: {
    id: 'announcement',
    label: 'Announcement',
    category: 'marketing',
    aspectRatio: '4:3',
    width: 1080,
    height: 810,
    description: 'General announcement graphic',
    popular: true,
    useCases: ['News', 'Updates', 'Important notices'],
  },
  leaderboard_ad: {
    id: 'leaderboard_ad',
    label: 'Leaderboard Ad',
    category: 'marketing',
    aspectRatio: '8:1',
    width: 728,
    height: 90,
    description: 'Standard leaderboard display ad',
    useCases: ['Display ads', 'Banner ads', 'Web advertising'],
  },
  square_ad: {
    id: 'square_ad',
    label: 'Square Ad',
    category: 'marketing',
    aspectRatio: '1:1',
    width: 300,
    height: 300,
    description: 'Square display advertisement',
    useCases: ['Sidebar ads', 'Display network', 'Social ads'],
  },

  // ---------------------------------------------------------------------------
  // Document Formats
  // ---------------------------------------------------------------------------
  letterhead: {
    id: 'letterhead',
    label: 'Letterhead',
    category: 'documents',
    aspectRatio: '1:1.41',
    width: 2480,
    height: 3508,
    description: 'A4 letterhead design',
    useCases: ['Official letters', 'Company stationery', 'Correspondence'],
  },
  resume: {
    id: 'resume',
    label: 'Resume',
    category: 'documents',
    aspectRatio: '1:1.41',
    width: 2480,
    height: 3508,
    description: 'Professional resume layout',
    useCases: ['CV', 'Job applications', 'Professional profile'],
  },
  report_cover: {
    id: 'report_cover',
    label: 'Report Cover',
    category: 'documents',
    aspectRatio: '1:1.41',
    width: 2480,
    height: 3508,
    description: 'Cover page for reports',
    useCases: ['Annual reports', 'Project reports', 'Documentation'],
  },
  book_cover: {
    id: 'book_cover',
    label: 'Book Cover',
    category: 'documents',
    aspectRatio: '2:3',
    width: 1600,
    height: 2400,
    description: 'Book or ebook cover',
    useCases: ['Books', 'Ebooks', 'Guides', 'Manuals'],
  },

  // ---------------------------------------------------------------------------
  // Custom Format
  // ---------------------------------------------------------------------------
  custom: {
    id: 'custom',
    label: 'Custom Size',
    category: 'marketing',
    aspectRatio: 'custom',
    width: 1080,
    height: 1080,
    description: 'Create with custom dimensions',
    useCases: ['Any custom size requirement'],
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get all formats as an array
 */
export function getAllFormats(): CreativeFormat[] {
  return Object.values(CREATIVE_FORMATS)
}

/**
 * Get formats by category
 */
export function getFormatsByCategory(categoryId: FormatCategoryId): CreativeFormat[] {
  return getAllFormats().filter((format) => format.category === categoryId)
}

/**
 * Get popular formats
 */
export function getPopularFormats(): CreativeFormat[] {
  return getAllFormats().filter((format) => format.popular)
}

/**
 * Get new formats
 */
export function getNewFormats(): CreativeFormat[] {
  return getAllFormats().filter((format) => format.new)
}

/**
 * Get format by ID
 */
export function getFormatById(formatId: CreativeFormatId): CreativeFormat | undefined {
  return CREATIVE_FORMATS[formatId]
}

/**
 * Search formats by query
 */
export function searchFormats(query: string): CreativeFormat[] {
  const lowerQuery = query.toLowerCase().trim()
  if (!lowerQuery) return getAllFormats()

  return getAllFormats().filter((format) => {
    const searchableText = [
      format.label,
      format.description,
      format.category,
      ...(format.useCases || []),
    ]
      .join(' ')
      .toLowerCase()

    return searchableText.includes(lowerQuery)
  })
}

/**
 * Get formats grouped by category
 */
export function getFormatsGroupedByCategory(): Record<FormatCategoryId, CreativeFormat[]> {
  const grouped = {} as Record<FormatCategoryId, CreativeFormat[]>

  for (const categoryId of FORMAT_CATEGORY_ORDER) {
    grouped[categoryId] = getFormatsByCategory(categoryId)
  }

  return grouped
}

/**
 * Get aspect ratio as CSS value
 */
export function getAspectRatioCss(format: CreativeFormat): string {
  if (format.aspectRatio === 'custom') {
    return `${format.width}/${format.height}`
  }

  const [w, h] = format.aspectRatio.split(':').map(Number)
  return `${w}/${h}`
}

/**
 * Get format dimensions as string
 */
export function getFormatDimensionsLabel(format: CreativeFormat): string {
  return `${format.width} x ${format.height} px`
}

/**
 * Check if format matches an aspect ratio
 */
export function formatMatchesAspectRatio(
  format: CreativeFormat,
  aspectRatio: string
): boolean {
  if (format.aspectRatio === aspectRatio) return true

  // Also check reverse (e.g., 16:9 matches 9:16 rotated)
  const [w1, h1] = format.aspectRatio.split(':').map(Number)
  const [w2, h2] = aspectRatio.split(':').map(Number)

  // Exact match
  if (w1 / h1 === w2 / h2) return true

  // Close match (within 5%)
  const ratio1 = w1 / h1
  const ratio2 = w2 / h2
  const tolerance = 0.05
  return Math.abs(ratio1 - ratio2) / ratio1 <= tolerance
}

/**
 * Get format category info
 */
export function getFormatCategory(categoryId: FormatCategoryId): FormatCategory {
  return FORMAT_CATEGORIES[categoryId]
}

/**
 * Get all categories as array
 */
export function getAllCategories(): FormatCategory[] {
  return FORMAT_CATEGORY_ORDER.map((id) => FORMAT_CATEGORIES[id])
}

// ============================================================================
// Format-specific prompt guidelines
// ============================================================================

export const FORMAT_GUIDELINES: Partial<Record<CreativeFormatId, string>> = {
  instagram_post:
    'Design for Instagram feed. Use eye-catching visuals with minimal text. Consider grid appearance and color harmony.',
  instagram_story:
    'Full-screen vertical design. Keep key content in safe zone (avoid top 15%, bottom 20%). Use bold visuals and clear CTAs.',
  youtube_thumbnail:
    'Attention-grabbing thumbnail. Use contrasting colors, large readable text, expressive imagery. Faces and emotions perform well.',
  event_poster:
    'Professional event poster with clear visual hierarchy: title/event name prominently displayed, date and time clearly visible, venue information, and any key speakers or features.',
  portrait_poster:
    'Tall vertical design for standees and roll-ups. Ensure text is readable from distance. Use strong visual focal point.',
  certificate:
    'Formal, elegant design with professional typography. Include space for recipient name, achievement, date, and signatures. Use decorative borders appropriately.',
  linkedin_post:
    'Professional audience. Clean, corporate aesthetic while remaining visually engaging. Data visualization and insights work well.',
  pinterest_pin:
    'Vertical format optimized for Pinterest feed. Use text overlays, step-by-step visuals, or infographic style. Rich, inspiring imagery.',
  presentation_16_9:
    'Clean slide design with clear visual hierarchy. Limit text, use high-quality images. Consider presentation flow and readability.',
  announcement:
    'Clear, attention-grabbing announcement. Emphasize the key message prominently. Use contrasting colors for important information.',
  invitation:
    'Elegant, event-appropriate design. Include all essential details: event name, date, time, venue, RSVP. Match the event tone (formal/casual).',
  facebook_post:
    'Engaging visual for Facebook feed. Balance text and imagery. Consider how it appears in mobile feeds.',
  twitter_post:
    'Bold, attention-grabbing image. Works well with strong headlines, quotes, or data visualizations. Consider Twitter\'s fast-scrolling nature.',
  whatsapp_status:
    'Full-screen vertical image. Bold, clear messaging. Consider how it looks on mobile screens. Engaging visuals that prompt action.',
}

/**
 * Get prompt guidelines for a format
 */
export function getFormatGuidelines(formatId: CreativeFormatId): string {
  return FORMAT_GUIDELINES[formatId] || ''
}
