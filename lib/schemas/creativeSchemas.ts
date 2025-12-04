/**
 * Creative Schemas - Dynamic form field definitions by creative type
 * Maps format IDs to appropriate form schemas for Step 4 (Details)
 */

import { CreativeFormatId } from '@/lib/config/creative-formats'

// ============================================================================
// Types
// ============================================================================

export type CreativeSchemaType =
  | 'certificate'
  | 'socialMediaPost'
  | 'emailHeader'
  | 'blogPost'
  | 'marketingMaterial'
  | 'eventPoster'
  // New format-specific schemas
  | 'youtubeThumbnail'
  | 'invitation'
  | 'presentation'
  | 'businessCard'
  | 'flyer'
  | 'instagramStory'
  | 'linkedinPost'
  | 'announcement'

export type FieldType = 'text' | 'textarea' | 'date' | 'select' | 'time'

export interface SchemaField {
  id: string
  label: string
  type: FieldType
  required: boolean
  placeholder?: string
  maxLength?: number
  rows?: number
  options?: string[]
  suggestable?: boolean // Can receive AI suggestions
}

export interface CreativeSchema {
  type: CreativeSchemaType
  displayName: string
  description: string
  fields: SchemaField[]
}

// ============================================================================
// Schema Definitions
// ============================================================================

export const CREATIVE_SCHEMAS: Record<CreativeSchemaType, CreativeSchema> = {
  certificate: {
    type: 'certificate',
    displayName: 'Certificate',
    description: 'Award, recognition, or completion certificate',
    fields: [
      {
        id: 'certificateTitle',
        label: 'Certificate Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Certificate of Achievement',
        maxLength: 100,
        suggestable: true,
      },
      {
        id: 'recipientName',
        label: 'Recipient Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., John Doe',
        maxLength: 100,
      },
      {
        id: 'achievementDescription',
        label: 'Achievement / Recognition For',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the achievement or reason for the certificate...',
        rows: 3,
        suggestable: true,
      },
      {
        id: 'dateIssued',
        label: 'Date Issued',
        type: 'date',
        required: true,
      },
      {
        id: 'issuingAuthority',
        label: 'Issuing Authority / Organization',
        type: 'text',
        required: true,
        placeholder: 'e.g., Yi Organization',
        maxLength: 100,
      },
      {
        id: 'certificateNumber',
        label: 'Certificate Number (Optional)',
        type: 'text',
        required: false,
        placeholder: 'e.g., CERT-2025-001',
        maxLength: 50,
      },
      {
        id: 'signatoryName',
        label: 'Signatory Name (Optional)',
        type: 'text',
        required: false,
        placeholder: 'e.g., Jane Smith, Director',
        maxLength: 100,
      },
    ],
  },

  socialMediaPost: {
    type: 'socialMediaPost',
    displayName: 'Social Media Post',
    description: 'Content for Instagram, Facebook, LinkedIn, Twitter, etc.',
    fields: [
      {
        id: 'postTitle',
        label: 'Post Title / Headline',
        type: 'text',
        required: true,
        placeholder: 'Create an engaging headline...',
        maxLength: 100,
        suggestable: true,
      },
      {
        id: 'postDescription',
        label: 'Post Description / Caption',
        type: 'textarea',
        required: true,
        placeholder: 'Write your post content...',
        rows: 4,
        suggestable: true,
      },
      {
        id: 'callToAction',
        label: 'Call-to-Action',
        type: 'text',
        required: false,
        placeholder: 'e.g., Learn More, Sign Up, Join Us',
        maxLength: 50,
        suggestable: true,
      },
      {
        id: 'targetAudience',
        label: 'Target Audience',
        type: 'text',
        required: false,
        placeholder: 'e.g., Students, Professionals, Parents',
        maxLength: 100,
      },
      {
        id: 'hashtags',
        label: 'Hashtags (Optional)',
        type: 'text',
        required: false,
        placeholder: 'e.g., #YiOrg #Safety #Awareness',
        maxLength: 200,
        suggestable: true,
      },
    ],
  },

  emailHeader: {
    type: 'emailHeader',
    displayName: 'Email Header',
    description: 'Header graphic for email newsletters and campaigns',
    fields: [
      {
        id: 'subjectLine',
        label: 'Email Subject Line',
        type: 'text',
        required: true,
        placeholder: 'Make it compelling...',
        maxLength: 60,
        suggestable: true,
      },
      {
        id: 'previewText',
        label: 'Preview Text',
        type: 'text',
        required: false,
        placeholder: 'Text shown in email preview...',
        maxLength: 100,
        suggestable: true,
      },
      {
        id: 'brandMessage',
        label: 'Main Message / Announcement',
        type: 'textarea',
        required: true,
        placeholder: 'The key message you want to communicate...',
        rows: 4,
        suggestable: true,
      },
      {
        id: 'primaryCTA',
        label: 'Primary CTA Button Text',
        type: 'text',
        required: true,
        placeholder: 'e.g., Register Now, Learn More',
        maxLength: 30,
      },
    ],
  },

  blogPost: {
    type: 'blogPost',
    displayName: 'Blog / Article',
    description: 'Cover image for blog posts, articles, and reports',
    fields: [
      {
        id: 'articleTitle',
        label: 'Article Title',
        type: 'text',
        required: true,
        placeholder: 'Enter the title of your article...',
        maxLength: 150,
        suggestable: true,
      },
      {
        id: 'articleSummary',
        label: 'Article Summary / Subtitle',
        type: 'textarea',
        required: false,
        placeholder: 'Brief summary or teaser...',
        rows: 3,
        suggestable: true,
      },
      {
        id: 'authorName',
        label: 'Author Name',
        type: 'text',
        required: false,
        placeholder: 'e.g., By Jane Doe',
        maxLength: 100,
      },
      {
        id: 'category',
        label: 'Category / Topic',
        type: 'text',
        required: false,
        placeholder: 'e.g., Road Safety, Health Tips',
        maxLength: 50,
      },
      {
        id: 'publicationDate',
        label: 'Publication Date',
        type: 'date',
        required: false,
      },
    ],
  },

  marketingMaterial: {
    type: 'marketingMaterial',
    displayName: 'Marketing Material',
    description: 'Flyers, brochures, billboards, and promotional content',
    fields: [
      {
        id: 'campaignName',
        label: 'Campaign / Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Road Safety Week 2025',
        maxLength: 100,
        suggestable: true,
      },
      {
        id: 'campaignMessage',
        label: 'Main Message',
        type: 'textarea',
        required: true,
        placeholder: 'The key message you want to convey...',
        rows: 4,
        suggestable: true,
      },
      {
        id: 'callToAction',
        label: 'Call-to-Action',
        type: 'text',
        required: true,
        placeholder: 'e.g., Join the Movement, Act Now',
        maxLength: 50,
        suggestable: true,
      },
      {
        id: 'offerDetails',
        label: 'Offer / Promotion Details (Optional)',
        type: 'textarea',
        required: false,
        placeholder: 'Any special offers, discounts, or promotions...',
        rows: 2,
      },
      {
        id: 'contactInfo',
        label: 'Contact Information (Optional)',
        type: 'text',
        required: false,
        placeholder: 'e.g., Visit yi.org or call 1800-XXX-XXXX',
        maxLength: 150,
      },
    ],
  },

  eventPoster: {
    type: 'eventPoster',
    displayName: 'Event Poster',
    description: 'Posters for events, seminars, workshops, and presentations',
    fields: [
      {
        id: 'title',
        label: 'Event Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Annual Traffic Awareness Campaign',
        maxLength: 100,
        suggestable: true,
      },
      {
        id: 'description',
        label: 'Event Description',
        type: 'textarea',
        required: false,
        placeholder: 'Brief description of the event...',
        rows: 3,
        suggestable: true,
      },
      {
        id: 'date',
        label: 'Event Date',
        type: 'date',
        required: true,
        suggestable: true,
      },
      {
        id: 'time',
        label: 'Event Time',
        type: 'text',
        required: false,
        placeholder: 'e.g., 6:00 PM onwards',
        maxLength: 50,
        suggestable: true,
      },
      {
        id: 'venue',
        label: 'Venue',
        type: 'text',
        required: false,
        placeholder: 'e.g., Conference Hall, Mumbai',
        maxLength: 150,
        suggestable: true,
      },
      {
        id: 'speaker',
        label: 'Speaker / Chief Guest',
        type: 'text',
        required: false,
        placeholder: 'e.g., Dr. John Smith, Director',
        maxLength: 100,
        suggestable: true,
      },
      {
        id: 'registrationInfo',
        label: 'Registration / Contact Info',
        type: 'text',
        required: false,
        placeholder: 'e.g., Register at yi.org or call 1800-XXX',
        maxLength: 150,
      },
    ],
  },

  // =========================================================================
  // NEW FORMAT-SPECIFIC SCHEMAS
  // =========================================================================

  youtubeThumbnail: {
    type: 'youtubeThumbnail',
    displayName: 'YouTube Thumbnail',
    description: 'Eye-catching video thumbnail',
    fields: [
      {
        id: 'videoTitle',
        label: 'Video Title',
        type: 'text',
        required: true,
        placeholder: 'Bold, attention-grabbing title (3-5 words)',
        maxLength: 60,
        suggestable: true,
      },
      {
        id: 'hookText',
        label: 'Hook/Teaser Text',
        type: 'text',
        required: false,
        placeholder: "e.g., You Won't Believe This!",
        maxLength: 30,
        suggestable: true,
      },
      {
        id: 'emotionHint',
        label: 'Emotion/Expression',
        type: 'select',
        required: false,
        options: ['Excited', 'Shocked', 'Happy', 'Curious', 'Serious', 'Funny'],
      },
      {
        id: 'channelName',
        label: 'Channel Name',
        type: 'text',
        required: false,
        placeholder: 'For branding reference',
        maxLength: 50,
      },
    ],
  },

  invitation: {
    type: 'invitation',
    displayName: 'Invitation',
    description: 'Event invitation card',
    fields: [
      {
        id: 'eventName',
        label: 'Event Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., Annual Gala Dinner',
        maxLength: 100,
        suggestable: true,
      },
      {
        id: 'hostName',
        label: 'Host/Organizer',
        type: 'text',
        required: false,
        placeholder: 'e.g., Yi Mumbai Chapter',
        maxLength: 100,
      },
      {
        id: 'date',
        label: 'Event Date',
        type: 'date',
        required: true,
      },
      {
        id: 'time',
        label: 'Event Time',
        type: 'text',
        required: true,
        placeholder: 'e.g., 7:00 PM onwards',
        maxLength: 50,
      },
      {
        id: 'venue',
        label: 'Venue',
        type: 'text',
        required: true,
        placeholder: 'e.g., The Grand Ballroom, Hotel Taj',
        maxLength: 150,
        suggestable: true,
      },
      {
        id: 'rsvpDetails',
        label: 'RSVP Information',
        type: 'text',
        required: false,
        placeholder: 'e.g., RSVP by Dec 15 to events@yi.org',
        maxLength: 150,
      },
      {
        id: 'dressCode',
        label: 'Dress Code',
        type: 'select',
        required: false,
        options: ['Formal', 'Semi-Formal', 'Business Casual', 'Casual', 'Traditional', 'Theme-based'],
      },
    ],
  },

  presentation: {
    type: 'presentation',
    displayName: 'Presentation Slide',
    description: 'Presentation or slide design',
    fields: [
      {
        id: 'slideTitle',
        label: 'Slide Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., Q4 Performance Review',
        maxLength: 80,
        suggestable: true,
      },
      {
        id: 'topic',
        label: 'Topic/Subject',
        type: 'text',
        required: false,
        placeholder: 'e.g., Business Strategy, Annual Report',
        maxLength: 100,
        suggestable: true,
      },
      {
        id: 'presenterName',
        label: 'Presenter Name',
        type: 'text',
        required: false,
        placeholder: 'e.g., John Doe, CEO',
        maxLength: 100,
      },
      {
        id: 'keyPoints',
        label: 'Key Points (Optional)',
        type: 'textarea',
        required: false,
        rows: 3,
        placeholder: 'Bullet points to include...',
        suggestable: true,
      },
    ],
  },

  businessCard: {
    type: 'businessCard',
    displayName: 'Business Card',
    description: 'Professional contact card',
    fields: [
      {
        id: 'fullName',
        label: 'Full Name',
        type: 'text',
        required: true,
        placeholder: 'e.g., John Doe',
        maxLength: 50,
      },
      {
        id: 'jobTitle',
        label: 'Job Title/Designation',
        type: 'text',
        required: true,
        placeholder: 'e.g., Marketing Director',
        maxLength: 50,
      },
      {
        id: 'companyName',
        label: 'Company/Organization',
        type: 'text',
        required: false,
        placeholder: 'e.g., Yi Mumbai',
        maxLength: 80,
      },
      {
        id: 'phoneNumber',
        label: 'Phone Number',
        type: 'text',
        required: false,
        placeholder: 'e.g., +91 98765 43210',
        maxLength: 20,
      },
      {
        id: 'emailAddress',
        label: 'Email Address',
        type: 'text',
        required: false,
        placeholder: 'e.g., john@yi.org',
        maxLength: 50,
      },
      {
        id: 'website',
        label: 'Website',
        type: 'text',
        required: false,
        placeholder: 'e.g., www.yi.org',
        maxLength: 50,
      },
      {
        id: 'tagline',
        label: 'Tagline (Optional)',
        type: 'text',
        required: false,
        placeholder: 'e.g., Building Tomorrow\'s Leaders',
        maxLength: 60,
        suggestable: true,
      },
    ],
  },

  flyer: {
    type: 'flyer',
    displayName: 'Promotional Flyer',
    description: 'Flyer with offer/discount details',
    fields: [
      {
        id: 'headline',
        label: 'Headline',
        type: 'text',
        required: true,
        placeholder: 'e.g., Road Safety Week 2025',
        maxLength: 60,
        suggestable: true,
      },
      {
        id: 'subheadline',
        label: 'Subheadline',
        type: 'text',
        required: false,
        placeholder: 'Supporting message...',
        maxLength: 80,
        suggestable: true,
      },
      {
        id: 'offerDetails',
        label: 'Offer/Discount',
        type: 'text',
        required: false,
        placeholder: 'e.g., 50% OFF, Free Entry, Early Bird',
        maxLength: 50,
      },
      {
        id: 'validityPeriod',
        label: 'Validity/Dates',
        type: 'text',
        required: false,
        placeholder: 'e.g., Valid till Dec 31, 2025',
        maxLength: 50,
      },
      {
        id: 'callToAction',
        label: 'Call-to-Action',
        type: 'text',
        required: true,
        placeholder: 'e.g., Register Now, Join Us',
        maxLength: 30,
        suggestable: true,
      },
      {
        id: 'contactInfo',
        label: 'Contact Information',
        type: 'text',
        required: false,
        placeholder: 'e.g., Call 1800-XXX or visit yi.org',
        maxLength: 150,
      },
    ],
  },

  instagramStory: {
    type: 'instagramStory',
    displayName: 'Instagram Story',
    description: 'Vertical full-screen story',
    fields: [
      {
        id: 'headline',
        label: 'Main Text/Headline',
        type: 'text',
        required: true,
        placeholder: 'Short, impactful message...',
        maxLength: 50,
        suggestable: true,
      },
      {
        id: 'swipeUpText',
        label: 'Swipe Up/CTA Text',
        type: 'text',
        required: false,
        placeholder: 'e.g., Swipe Up to Register!',
        maxLength: 30,
      },
      {
        id: 'storyType',
        label: 'Story Type',
        type: 'select',
        required: false,
        options: ['Announcement', 'Behind the Scenes', 'Countdown', 'Poll/Question', 'Quote', 'Promotion'],
      },
      {
        id: 'hashtags',
        label: 'Hashtags',
        type: 'text',
        required: false,
        placeholder: 'e.g., #YiIndia #RoadSafety',
        maxLength: 100,
        suggestable: true,
      },
    ],
  },

  linkedinPost: {
    type: 'linkedinPost',
    displayName: 'LinkedIn Post',
    description: 'Professional LinkedIn content',
    fields: [
      {
        id: 'headline',
        label: 'Post Headline',
        type: 'text',
        required: true,
        placeholder: 'Professional, engaging headline...',
        maxLength: 100,
        suggestable: true,
      },
      {
        id: 'keyInsight',
        label: 'Key Insight/Message',
        type: 'textarea',
        required: true,
        rows: 3,
        placeholder: 'The main professional insight or message...',
        suggestable: true,
      },
      {
        id: 'callToAction',
        label: 'Call-to-Action',
        type: 'text',
        required: false,
        placeholder: 'e.g., Connect with us, Learn more',
        maxLength: 50,
        suggestable: true,
      },
      {
        id: 'authorCredentials',
        label: 'Author/Source',
        type: 'text',
        required: false,
        placeholder: 'e.g., Yi National Chair',
        maxLength: 80,
      },
      {
        id: 'hashtags',
        label: 'Professional Hashtags',
        type: 'text',
        required: false,
        placeholder: 'e.g., #Leadership #YiIndia #CSR',
        maxLength: 100,
        suggestable: true,
      },
    ],
  },

  announcement: {
    type: 'announcement',
    displayName: 'Announcement',
    description: 'News or update announcement',
    fields: [
      {
        id: 'headline',
        label: 'Announcement Title',
        type: 'text',
        required: true,
        placeholder: 'e.g., New Chapter Launch!',
        maxLength: 80,
        suggestable: true,
      },
      {
        id: 'details',
        label: 'Details',
        type: 'textarea',
        required: true,
        rows: 3,
        placeholder: 'Key details of the announcement...',
        suggestable: true,
      },
      {
        id: 'effectiveDate',
        label: 'Effective Date (Optional)',
        type: 'date',
        required: false,
      },
      {
        id: 'source',
        label: 'Source/Authority',
        type: 'text',
        required: false,
        placeholder: 'e.g., Yi National Office',
        maxLength: 80,
      },
      {
        id: 'callToAction',
        label: 'What to Do Next',
        type: 'text',
        required: false,
        placeholder: 'e.g., Visit our website for details',
        maxLength: 50,
        suggestable: true,
      },
    ],
  },
}

// ============================================================================
// Format to Schema Type Mapping
// ============================================================================

const FORMAT_TO_SCHEMA_MAP: Partial<Record<CreativeFormatId, CreativeSchemaType>> = {
  // Certificate schema
  certificate: 'certificate',

  // Social Media - Platform-specific schemas
  instagram_post: 'socialMediaPost',
  instagram_story: 'instagramStory',      // Vertical story format
  instagram_reel: 'instagramStory',       // Vertical story format
  facebook_post: 'socialMediaPost',
  facebook_cover: 'socialMediaPost',
  facebook_ad: 'marketingMaterial',       // Ads need offer/CTA fields
  linkedin_post: 'linkedinPost',          // Professional post format
  linkedin_banner: 'linkedinPost',        // Professional format
  twitter_post: 'socialMediaPost',
  twitter_header: 'socialMediaPost',
  pinterest_pin: 'socialMediaPost',
  tiktok_cover: 'instagramStory',         // Vertical story format
  whatsapp_status: 'instagramStory',      // Vertical story format

  // Video thumbnails
  youtube_thumbnail: 'youtubeThumbnail',  // Video thumbnail format
  youtube_banner: 'socialMediaPost',
  video_cover: 'youtubeThumbnail',        // Video thumbnail format

  // Email schema
  email_header: 'emailHeader',

  // Blog/Document schema
  letterhead: 'blogPost',
  resume: 'blogPost',
  report_cover: 'blogPost',
  book_cover: 'blogPost',

  // Print formats
  event_poster: 'eventPoster',
  portrait_poster: 'eventPoster',
  landscape_poster: 'eventPoster',
  flyer_a5: 'flyer',                      // Promotional flyer format
  flyer_a4: 'flyer',                      // Promotional flyer format
  business_card: 'businessCard',          // Contact card format
  invitation: 'invitation',               // Invitation format
  brochure: 'marketingMaterial',

  // Presentations
  presentation_16_9: 'presentation',      // Presentation slide format
  presentation_4_3: 'presentation',       // Presentation slide format

  // Marketing & Ads
  web_banner: 'marketingMaterial',
  billboard: 'marketingMaterial',
  announcement: 'announcement',           // Announcement format
  leaderboard_ad: 'marketingMaterial',
  square_ad: 'marketingMaterial',
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the schema type for a given format ID
 */
export function getSchemaTypeForFormat(formatId: CreativeFormatId | string | null): CreativeSchemaType {
  if (!formatId) return 'eventPoster'
  return FORMAT_TO_SCHEMA_MAP[formatId as CreativeFormatId] || 'eventPoster'
}

/**
 * Get the full schema for a given format ID
 */
export function getCreativeSchema(formatId: CreativeFormatId | string | null): CreativeSchema {
  const schemaType = getSchemaTypeForFormat(formatId)
  return CREATIVE_SCHEMAS[schemaType]
}

/**
 * Get schema by type directly
 */
export function getSchemaByType(schemaType: CreativeSchemaType): CreativeSchema {
  return CREATIVE_SCHEMAS[schemaType]
}

/**
 * Get all suggestable field IDs for a schema
 */
export function getSuggestableFields(schema: CreativeSchema): string[] {
  return schema.fields.filter((f) => f.suggestable).map((f) => f.id)
}

/**
 * Get required field IDs for a schema
 */
export function getRequiredFields(schema: CreativeSchema): string[] {
  return schema.fields.filter((f) => f.required).map((f) => f.id)
}

/**
 * Validate form data against schema
 */
export function validateFormData(
  schema: CreativeSchema,
  formData: Record<string, unknown>
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  schema.fields.forEach((field) => {
    const value = formData[field.id]

    // Check required fields
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors[field.id] = `${field.label} is required`
      return
    }

    // Check max length
    if (field.maxLength && typeof value === 'string' && value.length > field.maxLength) {
      errors[field.id] = `${field.label} must be ${field.maxLength} characters or less`
    }
  })

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Get initial form data with default values
 */
export function getInitialFormData(schema: CreativeSchema): Record<string, string> {
  const initial: Record<string, string> = {}
  schema.fields.forEach((field) => {
    initial[field.id] = ''
  })
  return initial
}

/**
 * Map old form data to new schema (for schema changes)
 */
export function mapFormDataToSchema(
  oldData: Record<string, unknown>,
  newSchema: CreativeSchema
): Record<string, unknown> {
  const mapped: Record<string, unknown> = {}

  // Common field mappings for backwards compatibility
  const fieldMappings: Record<string, string[]> = {
    title: ['title', 'postTitle', 'articleTitle', 'campaignName', 'certificateTitle', 'subjectLine', 'videoTitle', 'eventName', 'slideTitle', 'headline'],
    description: ['description', 'postDescription', 'articleSummary', 'campaignMessage', 'achievementDescription', 'brandMessage', 'details', 'keyInsight', 'keyPoints'],
    date: ['date', 'dateIssued', 'publicationDate', 'effectiveDate'],
    name: ['fullName', 'recipientName', 'presenterName', 'authorCredentials', 'hostName'],
    cta: ['callToAction', 'primaryCTA', 'swipeUpText'],
    contact: ['contactInfo', 'registrationInfo', 'rsvpDetails'],
  }

  newSchema.fields.forEach((field) => {
    // Direct match
    if (oldData[field.id] !== undefined) {
      mapped[field.id] = oldData[field.id]
      return
    }

    // Try to find a mapping
    for (const [commonKey, aliases] of Object.entries(fieldMappings)) {
      if (aliases.includes(field.id) && oldData[commonKey] !== undefined) {
        mapped[field.id] = oldData[commonKey]
        return
      }
    }

    // Default to empty
    mapped[field.id] = ''
  })

  return mapped
}
