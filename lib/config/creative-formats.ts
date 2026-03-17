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
  | 'admission'

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
  // Ultra Formats (Flash 3.1 exclusive — new aspect ratios)
  | 'ultra_wide'
  | 'ultra_tall'
  | 'wide_banner'
  | 'tall_banner'
  // Admission Campaign
  | 'admission_direction_board'
  | 'admission_main_gate'
  | 'admission_institution_flex'
  | 'admission_bus_back'
  | 'admission_bus_side'
  | 'admission_standee'
  | 'admission_stall_flex_6x3'
  | 'admission_stall_flex_8x6'
  | 'admission_social_post'
  | 'admission_office_flex'
  | 'admission_achievers_flex'
  | 'admission_photo_booth'
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
  /** Auto-forces this Gemini model when format is selected (e.g., ultra aspect ratios) */
  requiredModel?: string
  /**
   * Controls Yi/CII logo lock behavior for this format.
   * - 'yi_standard' (default): Yi=top-left, CII=top-right locks enforced (Yi chapter creatives)
   * - 'institution': Lock enforcement disabled — institution's own logo can occupy any position
   */
  logoMode?: 'yi_standard' | 'institution'
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
  admission: {
    id: 'admission',
    label: 'Admission Campaign',
    icon: 'GraduationCap',
    description: 'Flex banners, standees, and social posts for college admissions',
    color: '#7B1FA2', // Purple
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
  'admission',
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
    aspectRatio: '16:9',
    width: 1200,
    height: 675,
    description: 'Optimal size for Facebook feed',
    popular: true,
    useCases: ['Feed posts', 'Shared content', 'Link previews'],
  },
  facebook_cover: {
    id: 'facebook_cover',
    label: 'Facebook Cover',
    category: 'social_media',
    aspectRatio: '16:9',
    width: 840,
    height: 473,
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
    aspectRatio: '16:9',
    width: 1200,
    height: 675,
    description: 'Professional post for LinkedIn',
    popular: true,
    useCases: ['Feed posts', 'Articles', 'Company updates'],
  },
  linkedin_banner: {
    id: 'linkedin_banner',
    label: 'LinkedIn Banner',
    category: 'social_media',
    aspectRatio: '16:9',
    width: 1596,
    height: 898,
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
    aspectRatio: '16:9',
    width: 1512,
    height: 851,
    description: 'Profile header for Twitter/X',
    useCases: ['Profile banner', 'Brand header'],
  },
  pinterest_pin: {
    id: 'pinterest_pin',
    label: 'Pinterest Pin',
    category: 'social_media',
    aspectRatio: '3:4',
    width: 1000,
    height: 1333,
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
    aspectRatio: '3:4',
    width: 1080,
    height: 1440,
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
    aspectRatio: '3:4',
    width: 1653,
    height: 2204,
    description: 'A5 sized flyer (148 x 210 mm)',
    useCases: ['Handouts', 'Promotions', 'Menu cards'],
  },
  flyer_a4: {
    id: 'flyer_a4',
    label: 'Flyer (A4)',
    category: 'print',
    aspectRatio: '3:4',
    width: 2339,
    height: 3119,
    description: 'A4 sized flyer (210 x 297 mm)',
    popular: true,
    useCases: ['Posters', 'Notices', 'Information sheets'],
  },
  business_card: {
    id: 'business_card',
    label: 'Business Card',
    category: 'print',
    aspectRatio: '16:9',
    width: 1066,
    height: 600,
    description: 'Standard business card size',
    useCases: ['Contact cards', 'Networking', 'Branding'],
  },
  invitation: {
    id: 'invitation',
    label: 'Invitation',
    category: 'print',
    aspectRatio: '3:4',
    width: 1400,
    height: 1867,
    description: 'Elegant invitation card',
    popular: true,
    useCases: ['Events', 'Weddings', 'Parties', 'Corporate events'],
  },
  certificate: {
    id: 'certificate',
    label: 'Certificate',
    category: 'print',
    aspectRatio: '4:3',
    width: 3720,
    height: 2790,
    description: 'Landscape certificate',
    popular: true,
    useCases: ['Awards', 'Appreciation', 'Completion', 'Recognition'],
  },
  brochure: {
    id: 'brochure',
    label: 'Brochure',
    category: 'print',
    aspectRatio: '3:4',
    width: 2339,
    height: 3119,
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
    aspectRatio: '16:9',
    width: 1260,
    height: 709,
    description: 'Website header banner',
    useCases: ['Website headers', 'Hero sections', 'Promotional banners'],
  },
  email_header: {
    id: 'email_header',
    label: 'Email Header',
    category: 'marketing',
    aspectRatio: '16:9',
    width: 630,
    height: 354,
    description: 'Email newsletter header',
    useCases: ['Email campaigns', 'Newsletters', 'Announcements'],
  },
  billboard: {
    id: 'billboard',
    label: 'Billboard',
    category: 'marketing',
    aspectRatio: '16:9',
    width: 2520,
    height: 1418,
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
    aspectRatio: '16:9',
    width: 756,
    height: 425,
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
    aspectRatio: '3:4',
    width: 2339,
    height: 3119,
    description: 'A4 letterhead design',
    useCases: ['Official letters', 'Company stationery', 'Correspondence'],
  },
  resume: {
    id: 'resume',
    label: 'Resume',
    category: 'documents',
    aspectRatio: '3:4',
    width: 2339,
    height: 3119,
    description: 'Professional resume layout',
    useCases: ['CV', 'Job applications', 'Professional profile'],
  },
  report_cover: {
    id: 'report_cover',
    label: 'Report Cover',
    category: 'documents',
    aspectRatio: '3:4',
    width: 2339,
    height: 3119,
    description: 'Cover page for reports',
    useCases: ['Annual reports', 'Project reports', 'Documentation'],
  },
  book_cover: {
    id: 'book_cover',
    label: 'Book Cover',
    category: 'documents',
    aspectRatio: '3:4',
    width: 1600,
    height: 2133,
    description: 'Book or ebook cover',
    useCases: ['Books', 'Ebooks', 'Guides', 'Manuals'],
  },

  // ---------------------------------------------------------------------------
  // Ultra Formats — Nano Banana 2 (Flash 3.1) Exclusive
  // These aspect ratios (8:1, 1:8, 4:1, 1:4) are only supported by gemini-3.1-flash-image-preview
  // ---------------------------------------------------------------------------
  ultra_wide: {
    id: 'ultra_wide',
    label: 'Ultra Wide Banner',
    category: 'marketing',
    aspectRatio: '8:1',
    width: 3840,
    height: 480,
    description: 'Ultra-wide panoramic billboard or header banner',
    new: true,
    useCases: ['Billboard strips', 'Panoramic banners', 'Website headers'],
    requiredModel: 'gemini-3.1-flash-image-preview',
  },
  ultra_tall: {
    id: 'ultra_tall',
    label: 'Ultra Tall Banner',
    category: 'marketing',
    aspectRatio: '1:8',
    width: 480,
    height: 3840,
    description: 'Ultra-tall tower or pole banner',
    new: true,
    useCases: ['Tower banners', 'Pole displays', 'Vertical strips'],
    requiredModel: 'gemini-3.1-flash-image-preview',
  },
  wide_banner: {
    id: 'wide_banner',
    label: 'Leaderboard Banner',
    category: 'marketing',
    aspectRatio: '4:1',
    width: 1920,
    height: 480,
    description: 'Wide leaderboard ad or website banner',
    new: true,
    useCases: ['Leaderboard ads', 'Web banners', 'Event headers'],
    requiredModel: 'gemini-3.1-flash-image-preview',
  },
  tall_banner: {
    id: 'tall_banner',
    label: 'Roll-Up Banner',
    category: 'marketing',
    aspectRatio: '1:4',
    width: 480,
    height: 1920,
    description: 'Tall roll-up or vertical strip banner',
    new: true,
    useCases: ['Roll-up banners', 'Vertical ads', 'Portrait strips'],
    requiredModel: 'gemini-3.1-flash-image-preview',
  },

  // ---------------------------------------------------------------------------
  // Admission Campaign Formats
  // Physical flex/banner materials and digital posts for college admissions
  // ---------------------------------------------------------------------------
  admission_direction_board: {
    id: 'admission_direction_board',
    label: 'Direction Board',
    category: 'admission',
    aspectRatio: '4:1',
    width: 1920,
    height: 480,
    description: 'Highway direction board for institution wayfinding',
    new: true,
    logoMode: 'institution',
    useCases: ['Highway signage', 'Directional boards', 'Flex printing'],
  },
  admission_main_gate: {
    id: 'admission_main_gate',
    label: 'Main Gate Flex',
    category: 'admission',
    aspectRatio: '3:1',
    width: 1920,
    height: 640,
    description: 'Main gate entrance flex banner',
    new: true,
    logoMode: 'institution',
    useCases: ['Gate banners', 'Entrance flex', 'Admission season'],
  },
  admission_institution_flex: {
    id: 'admission_institution_flex',
    label: 'Institution Flex',
    category: 'admission',
    aspectRatio: '2:1',
    width: 1920,
    height: 960,
    description: 'Large institution-facing flex (e.g., opposite temple/landmark)',
    new: true,
    logoMode: 'institution',
    useCases: ['Outdoor flex', 'Institution branding', 'Admission campaigns'],
  },
  admission_bus_back: {
    id: 'admission_bus_back',
    label: 'Bus Back Panel',
    category: 'admission',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    description: 'Bus backside advertisement panel',
    new: true,
    logoMode: 'institution',
    useCases: ['Bus advertising', 'Transit media', 'Outdoor reach'],
  },
  admission_bus_side: {
    id: 'admission_bus_side',
    label: 'Bus Side Panel (3×4 ft)',
    category: 'admission',
    aspectRatio: '3:4',
    width: 1080,
    height: 1440,
    description: 'Portrait bus side panel advertisement (3×4 ft)',
    new: true,
    logoMode: 'institution',
    useCases: ['Bus side advertising', 'Transit media', 'Portrait outdoor reach'],
  },
  admission_standee: {
    id: 'admission_standee',
    label: 'Admission Standee',
    category: 'admission',
    aspectRatio: '2:5',
    width: 800,
    height: 2000,
    description: 'Tall standee flex for admission stalls and lobbies',
    new: true,
    logoMode: 'institution',
    useCases: ['Standees', 'Roll-up banners', 'Stall displays'],
  },
  admission_stall_flex_6x3: {
    id: 'admission_stall_flex_6x3',
    label: 'Stall Flex (6×3 ft)',
    category: 'admission',
    aspectRatio: '2:1',
    width: 1920,
    height: 960,
    description: '6×3 ft backdrop flex for admission stalls',
    new: true,
    logoMode: 'institution',
    useCases: ['Stall backdrops', 'Exhibition flex', 'Education fairs'],
  },
  admission_stall_flex_8x6: {
    id: 'admission_stall_flex_8x6',
    label: 'Stall Flex (8×6 ft)',
    category: 'admission',
    aspectRatio: '4:3',
    width: 1440,
    height: 1080,
    description: '8×6 ft backdrop flex for larger admission stalls',
    new: true,
    logoMode: 'institution',
    useCases: ['Large stall backdrops', 'Education fairs', 'Campus events'],
  },
  admission_social_post: {
    id: 'admission_social_post',
    label: 'Admission Social Post',
    category: 'admission',
    aspectRatio: '4:5',
    width: 1080,
    height: 1350,
    description: 'Social media post for course/college admission campaigns',
    popular: true,
    new: true,
    logoMode: 'institution',
    useCases: ['Instagram', 'Facebook', 'WhatsApp', 'Admission announcements'],
  },
  admission_office_flex: {
    id: 'admission_office_flex',
    label: 'Office Placement Flex',
    category: 'admission',
    aspectRatio: '3:1',
    width: 1920,
    height: 640,
    description: 'Flex banner for admission office or placement cell',
    new: true,
    logoMode: 'institution',
    useCases: ['Admission office', 'Placement cell', 'Corridor banners'],
  },
  admission_achievers_flex: {
    id: 'admission_achievers_flex',
    label: '100 Years Achievers Flex',
    category: 'admission',
    aspectRatio: '2:3',
    width: 1080,
    height: 1620,
    description: 'Centenary celebration / achievers showcase flex',
    new: true,
    logoMode: 'institution',
    useCases: ['100 years milestone', 'Achievers board', 'Legacy campaigns'],
  },
  admission_photo_booth: {
    id: 'admission_photo_booth',
    label: 'Photo Booth Backdrop',
    category: 'admission',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    description: 'Photo booth backdrop for admission events and stalls',
    new: true,
    logoMode: 'institution',
    useCases: ['Photo booths', 'Event backdrops', 'Campus stalls'],
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
  admission_direction_board:
    'Ultra-wide highway direction board. Maximum 5-6 words. Bold institution name, large arrow or directional cue. Must be readable at 60 km/h from 100m distance. High contrast colors.',
  admission_main_gate:
    'Wide entrance gate banner. Institution name dominant, tagline secondary. Include admission year prominently. Professional and welcoming aesthetic.',
  admission_institution_flex:
    'Large outdoor flex visible from distance. Key programs/courses listed clearly. Institution name and logo prominent. Bold imagery of campus or students.',
  admission_standee:
    'Tall narrow standee (2:5 ratio). Top: Institution branding. Middle: Course highlights and key USPs. Bottom: Contact/admission details. Designed for close-range reading at stalls.',
  admission_social_post:
    'Vertical social post (4:5) for Instagram/Facebook/WhatsApp. Course name prominent, key admission details (deadline, eligibility), strong call-to-action. Vibrant, thumb-stopping design.',
  admission_achievers_flex:
    'Portrait flex celebrating 100 years or achiever milestones. Rich legacy aesthetic with gold/maroon tones. Year milestones, notable alumni faces (placeholder), and institutional pride.',
  admission_photo_booth:
    'Landscape photo booth backdrop. Celebratory, photogenic design. Institution branding subtle at edges. Central area kept clean for subjects to stand in front.',
  admission_bus_side:
    'Portrait bus side panel (3:4 ratio). Eye-catching design readable at traffic stops. Top: institution branding. Middle: course list in bold. Bottom: contact + WhatsApp number. Strong color contrast essential.',
}

/**
 * Get a human-readable label for a creative_type / format ID.
 * Returns the official label from CREATIVE_FORMATS, or title-cases the ID as fallback.
 */
export function getFormatLabel(formatId: string | null | undefined): string {
  if (!formatId) return 'Image'
  const format = CREATIVE_FORMATS[formatId as CreativeFormatId]
  if (format?.label) return format.label
  // Fallback: title-case the snake_case ID (e.g. "instagram_post" → "Instagram Post")
  return formatId
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Get prompt guidelines for a format
 */
export function getFormatGuidelines(formatId: CreativeFormatId): string {
  return FORMAT_GUIDELINES[formatId] || ''
}
