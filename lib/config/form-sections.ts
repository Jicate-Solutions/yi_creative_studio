/**
 * Form Section Configuration
 * YiCreatives Studio
 *
 * Defines collapsible sections for progressive disclosure in the creative form.
 * Each format has specific sections and fields per section.
 */

import type { FieldCategory } from './field-registry'

// ============================================================================
// Types
// ============================================================================

export interface FormSection {
  id: string
  title: string
  /** Lucide icon name */
  icon: string
  category: FieldCategory
  /** Whether section is expanded by default */
  defaultExpanded: boolean
  /** Description shown in collapsed state */
  description?: string
  /** Priority for ordering (lower = higher priority) */
  priority: number
}

// ============================================================================
// Section Definitions
// ============================================================================

export const FORM_SECTIONS: Record<string, FormSection> = {
  core: {
    id: 'core',
    title: 'Event Details',
    icon: 'FileText',
    category: 'core',
    defaultExpanded: true,
    description: 'Required information for your creative',
    priority: 1,
  },
  content: {
    id: 'content',
    title: 'Content',
    icon: 'Type',
    category: 'content',
    defaultExpanded: true,
    description: 'Main content and descriptions',
    priority: 2,
  },
  speaker: {
    id: 'speaker',
    title: 'Speaker Details',
    icon: 'Mic2',
    category: 'speaker',
    defaultExpanded: false,
    description: 'Add speaker or presenter information',
    priority: 3,
  },
  contact: {
    id: 'contact',
    title: 'Contact & Registration',
    icon: 'Phone',
    category: 'contact',
    defaultExpanded: false,
    description: 'Contact details and registration info',
    priority: 4,
  },
  signatory: {
    id: 'signatory',
    title: 'Signatories',
    icon: 'PenTool',
    category: 'signatory',
    defaultExpanded: false,
    description: 'Certificate signers',
    priority: 5,
  },
  social: {
    id: 'social',
    title: 'Social Media',
    icon: 'Hash',
    category: 'social',
    defaultExpanded: false,
    description: 'Hashtags and call-to-action',
    priority: 6,
  },
  branding: {
    id: 'branding',
    title: 'Branding',
    icon: 'Building2',
    category: 'branding',
    defaultExpanded: false,
    description: 'Organization details',
    priority: 7,
  },
  media: {
    id: 'media',
    title: 'Video & Channel',
    icon: 'Video',
    category: 'media',
    defaultExpanded: false,
    description: 'Video and channel settings',
    priority: 8,
  },
  advanced: {
    id: 'advanced',
    title: 'Advanced Options',
    icon: 'Settings',
    category: 'advanced',
    defaultExpanded: false,
    description: 'Additional customization',
    priority: 99,
  },
}

// ============================================================================
// Format Section Mappings
// ============================================================================

/**
 * Defines which sections are shown for each format
 */
export const FORMAT_SECTIONS: Record<string, string[]> = {
  // Event Formats
  event_poster: ['core', 'speaker', 'contact', 'branding', 'advanced'],
  portrait_poster: ['core', 'speaker', 'contact', 'advanced'],
  landscape_poster: ['core', 'speaker', 'contact', 'advanced'],
  announcement: ['core', 'content', 'contact', 'advanced'],
  invitation: ['core', 'speaker', 'contact', 'advanced'],

  // Social Media Formats
  instagram_post: ['core', 'social', 'advanced'],
  instagram_story: ['core', 'social', 'advanced'],
  instagram_reel: ['core', 'social', 'advanced'],
  facebook_post: ['core', 'social', 'advanced'],
  facebook_cover: ['core', 'social', 'advanced'],
  facebook_ad: ['core', 'social', 'advanced'],
  linkedin_post: ['core', 'social', 'advanced'],
  linkedin_banner: ['core', 'social', 'advanced'],
  twitter_post: ['core', 'social', 'advanced'],
  twitter_header: ['core', 'social', 'advanced'],
  pinterest_pin: ['core', 'social', 'advanced'],
  tiktok_cover: ['core', 'social', 'advanced'],
  whatsapp_status: ['core', 'social', 'advanced'],

  // Video Formats
  youtube_thumbnail: ['core', 'media', 'advanced'],
  youtube_banner: ['core', 'media', 'advanced'],
  video_cover: ['core', 'media', 'speaker', 'advanced'],

  // Print Formats
  certificate: ['core', 'signatory', 'advanced'],
  flyer_a4: ['core', 'content', 'speaker', 'contact', 'advanced'],
  flyer_a5: ['core', 'content', 'speaker', 'contact', 'advanced'],
  brochure: ['core', 'content', 'contact', 'advanced'],
  business_card: ['core', 'contact', 'branding', 'advanced'],

  // Marketing Formats
  web_banner: ['core', 'content', 'social', 'advanced'],
  email_header: ['core', 'advanced'],
  billboard: ['core', 'social', 'contact', 'advanced'],
  leaderboard_ad: ['core', 'social', 'advanced'],
  square_ad: ['core', 'social', 'advanced'],

  // Document Formats
  letterhead: ['core', 'branding', 'contact', 'advanced'],
  resume: ['core', 'content', 'contact', 'advanced'],
  report_cover: ['core', 'branding', 'advanced'],
  book_cover: ['core', 'content', 'advanced'],

  // Presentation Formats
  presentation_16_9: ['core', 'speaker', 'advanced'],
  presentation_4_3: ['core', 'speaker', 'advanced'],
}

// ============================================================================
// Format Field Mappings (Fields per Section per Format)
// ============================================================================

/**
 * Defines which fields appear in each section for each format
 * Uses canonical field IDs from field-registry.ts
 */
export const FORMAT_SECTION_FIELDS: Record<string, Record<string, string[]>> = {
  // ---------------------------------------------------------------------------
  // EVENT FORMATS
  // ---------------------------------------------------------------------------

  event_poster: {
    core: ['eventName', 'eventTagline', 'eventDate', 'eventTime', 'venue'],
    speaker: ['speakerName', 'speakerDesignation'],
    contact: ['registrationInfo', 'contactNumber', 'websiteUrl'],
    branding: ['organizationName'],
    advanced: ['targetAudience', 'additionalDetails'],
  },

  portrait_poster: {
    core: ['eventName', 'eventTagline', 'eventDate', 'eventTime', 'venue'],
    speaker: ['speakerName', 'speakerDesignation'],
    contact: ['contactInfo'],
    advanced: ['additionalDetails'],
  },

  landscape_poster: {
    core: ['eventName', 'eventTagline', 'eventDate', 'eventTime', 'venue'],
    speaker: ['speakerName', 'speakerDesignation'],
    contact: ['contactInfo'],
    advanced: ['additionalDetails'],
  },

  announcement: {
    core: ['eventName', 'eventDate'],
    content: ['postCaption'],
    contact: ['registrationInfo'],
    advanced: ['callToAction', 'additionalDetails'],
  },

  invitation: {
    core: ['eventName', 'eventDate', 'eventTime', 'venue'],
    speaker: ['speakerName', 'speakerDesignation'],
    contact: ['registrationInfo', 'dressCode'],
    advanced: ['specialInstructions', 'additionalDetails'],
  },

  // ---------------------------------------------------------------------------
  // SOCIAL MEDIA FORMATS
  // ---------------------------------------------------------------------------

  instagram_post: {
    core: ['postTitle', 'postCaption'],
    social: ['callToAction', 'hashtags'],
    advanced: ['additionalDetails'],
  },

  instagram_story: {
    core: ['postTitle', 'supportingText'],
    social: ['callToAction', 'hashtags'],
    advanced: ['additionalDetails'],
  },

  instagram_reel: {
    core: ['postTitle', 'supportingText'],
    social: ['callToAction', 'hashtags'],
    advanced: ['additionalDetails'],
  },

  facebook_post: {
    core: ['postTitle', 'postCaption'],
    social: ['callToAction', 'websiteUrl'],
    advanced: ['additionalDetails'],
  },

  facebook_cover: {
    core: ['postTitle', 'eventTagline'],
    social: ['callToAction'],
    advanced: ['additionalDetails'],
  },

  facebook_ad: {
    core: ['postTitle', 'valueProposition'],
    social: ['callToAction'],
    advanced: ['additionalDetails'],
  },

  linkedin_post: {
    core: ['postTitle', 'postCaption'],
    social: ['callToAction', 'supportingText'],
    advanced: ['additionalDetails'],
  },

  linkedin_banner: {
    core: ['postTitle', 'eventTagline'],
    social: [],
    advanced: ['additionalDetails'],
  },

  twitter_post: {
    core: ['postTitle', 'supportingText'],
    social: ['hashtags'],
    advanced: ['additionalDetails'],
  },

  twitter_header: {
    core: ['postTitle', 'eventTagline'],
    social: [],
    advanced: ['additionalDetails'],
  },

  pinterest_pin: {
    core: ['postTitle', 'postCaption'],
    social: ['callToAction'],
    advanced: ['additionalDetails'],
  },

  tiktok_cover: {
    core: ['postTitle', 'supportingText'],
    social: ['callToAction', 'hashtags'],
    advanced: ['additionalDetails'],
  },

  whatsapp_status: {
    core: ['postTitle', 'supportingText'],
    social: ['callToAction'],
    advanced: ['additionalDetails'],
  },

  // ---------------------------------------------------------------------------
  // VIDEO FORMATS
  // ---------------------------------------------------------------------------

  youtube_thumbnail: {
    core: ['videoTitle', 'hookText'],
    media: ['channelName'],
    advanced: ['additionalDetails'],
  },

  youtube_banner: {
    core: ['eventTagline'],
    media: ['channelName', 'uploadSchedule'],
    advanced: ['additionalDetails'],
  },

  video_cover: {
    core: ['videoTitle', 'eventTagline'],
    media: ['episodeNumber'],
    speaker: ['speakerName', 'speakerDesignation'],
    advanced: ['additionalDetails'],
  },

  // ---------------------------------------------------------------------------
  // PRINT FORMATS
  // ---------------------------------------------------------------------------

  certificate: {
    core: ['certificateTitle', 'recipientName', 'achievementDescription', 'eventDate'],
    signatory: ['issuingAuthority', 'signatoryName', 'signatoryDesignation', 'signatoryName2', 'signatoryDesignation2'],
    advanced: ['certificateStyle', 'certificateNumber', 'additionalDetails'],
  },

  flyer_a4: {
    core: ['eventName', 'eventDate', 'eventTime', 'venue'],
    content: ['eventDescription'],
    speaker: ['speakerName', 'speakerDesignation'],
    contact: ['contactNumber', 'contactEmail', 'websiteUrl'],
    advanced: ['callToAction', 'additionalDetails'],
  },

  flyer_a5: {
    core: ['eventName', 'eventDate', 'eventTime', 'venue'],
    content: ['eventDescription'],
    speaker: ['speakerName', 'speakerDesignation'],
    contact: ['contactNumber', 'contactEmail', 'websiteUrl'],
    advanced: ['callToAction', 'additionalDetails'],
  },

  brochure: {
    core: ['eventName'],
    content: ['eventDescription', 'keyPoints'],
    contact: ['contactInfo'],
    advanced: ['callToAction', 'additionalDetails'],
  },

  business_card: {
    core: ['personName', 'jobTitle'],
    contact: ['contactNumber', 'contactEmail', 'websiteUrl'],
    branding: ['organizationName', 'socialHandle'],
    advanced: ['additionalDetails'],
  },

  // ---------------------------------------------------------------------------
  // MARKETING FORMATS
  // ---------------------------------------------------------------------------

  web_banner: {
    core: ['postTitle', 'valueProposition'],
    content: ['offerDetails'],
    social: ['callToAction'],
    advanced: ['additionalDetails'],
  },

  email_header: {
    core: ['postTitle', 'eventTagline'],
    advanced: ['additionalDetails'],
  },

  billboard: {
    core: ['postTitle', 'eventTagline'],
    social: ['callToAction'],
    contact: ['contactInfo'],
    advanced: ['additionalDetails'],
  },

  leaderboard_ad: {
    core: ['postTitle'],
    social: ['callToAction'],
    advanced: ['offerDetails', 'additionalDetails'],
  },

  square_ad: {
    core: ['postTitle', 'valueProposition'],
    social: ['callToAction'],
    advanced: ['additionalDetails'],
  },

  // ---------------------------------------------------------------------------
  // DOCUMENT FORMATS
  // ---------------------------------------------------------------------------

  letterhead: {
    core: ['organizationName'],
    branding: ['companyAddress', 'eventTagline'],
    contact: ['contactNumber', 'contactEmail', 'websiteUrl'],
    advanced: ['additionalDetails'],
  },

  resume: {
    core: ['personName', 'jobTitle'],
    content: ['professionalSummary'],
    contact: ['contactEmail', 'contactNumber', 'websiteUrl'],
    advanced: ['additionalDetails'],
  },

  report_cover: {
    core: ['reportTitle', 'eventTagline', 'eventDate'],
    branding: ['authorName', 'organizationName'],
    advanced: ['reportPeriod', 'additionalDetails'],
  },

  book_cover: {
    core: ['bookTitle', 'eventTagline'],
    content: ['authorName'],
    advanced: ['additionalDetails'],
  },

  // ---------------------------------------------------------------------------
  // PRESENTATION FORMATS
  // ---------------------------------------------------------------------------

  presentation_16_9: {
    core: ['presentationTitle', 'eventTagline', 'eventDate'],
    speaker: ['speakerName', 'speakerDesignation'],
    advanced: ['organizationName', 'additionalDetails'],
  },

  presentation_4_3: {
    core: ['presentationTitle', 'eventTagline', 'eventDate'],
    speaker: ['speakerName', 'speakerDesignation'],
    advanced: ['organizationName', 'additionalDetails'],
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get sections for a specific format
 */
export function getFormatSections(formatId: string): FormSection[] {
  const sectionIds = FORMAT_SECTIONS[formatId] || ['core', 'advanced']
  return sectionIds
    .map((id) => FORM_SECTIONS[id])
    .filter(Boolean)
    .sort((a, b) => a.priority - b.priority)
}

/**
 * Get fields for a specific section in a format
 */
export function getSectionFields(formatId: string, sectionId: string): string[] {
  const formatFields = FORMAT_SECTION_FIELDS[formatId]
  if (!formatFields) return []
  return formatFields[sectionId] || []
}

/**
 * Get all fields for a format, organized by section
 */
export function getFormatFieldsBySection(
  formatId: string
): { section: FormSection; fieldIds: string[] }[] {
  const sections = getFormatSections(formatId)
  const formatFields = FORMAT_SECTION_FIELDS[formatId] || {}

  return sections.map((section) => ({
    section,
    fieldIds: formatFields[section.id] || [],
  }))
}

/**
 * Check if a format has a specific section
 */
export function formatHasSection(formatId: string, sectionId: string): boolean {
  const sectionIds = FORMAT_SECTIONS[formatId] || []
  return sectionIds.includes(sectionId)
}

/**
 * Get the default expanded sections for a format
 */
export function getDefaultExpandedSections(formatId: string): string[] {
  const sections = getFormatSections(formatId)
  return sections.filter((s) => s.defaultExpanded).map((s) => s.id)
}

/**
 * Get all field IDs for a format (flattened across all sections)
 */
export function getAllFormatFieldIds(formatId: string): string[] {
  const formatFields = FORMAT_SECTION_FIELDS[formatId] || {}
  const allFieldIds: string[] = []

  for (const sectionFields of Object.values(formatFields)) {
    allFieldIds.push(...sectionFields)
  }

  return allFieldIds
}
