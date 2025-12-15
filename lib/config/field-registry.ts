/**
 * Canonical Field Registry
 * YiCreatives Studio
 *
 * Single source of truth for all form field definitions.
 * Eliminates duplicate field IDs (eventTitle vs eventName vs title) with canonical IDs.
 * Provides aliases for backward compatibility with legacy field IDs.
 */

// ============================================================================
// Types
// ============================================================================

export type FieldType = 'text' | 'textarea' | 'date' | 'time' | 'select'

export type FieldCategory =
  | 'core'        // Required event details (name, date, venue)
  | 'speaker'     // Speaker/presenter information
  | 'contact'     // Contact and registration details
  | 'signatory'   // Certificate signatories
  | 'social'      // Social media fields (hashtags, CTA)
  | 'branding'    // Organization/company branding
  | 'content'     // Content-specific fields (descriptions, messages)
  | 'media'       // Video/channel specific fields
  | 'advanced'    // Additional details and notes

export interface CanonicalField {
  id: string
  label: string
  type: FieldType
  category: FieldCategory
  required?: boolean
  maxLength?: number
  suggestable?: boolean
  placeholder?: string
  rows?: number
  options?: string[]
  /** Legacy field IDs that map to this canonical field */
  aliases?: string[]
  /** Help text shown below the field */
  helpText?: string
}

// ============================================================================
// Canonical Field Registry
// ============================================================================

export const FIELD_REGISTRY: Record<string, CanonicalField> = {
  // ---------------------------------------------------------------------------
  // CORE CONTENT FIELDS
  // ---------------------------------------------------------------------------

  eventName: {
    id: 'eventName',
    label: 'Event Name',
    type: 'text',
    category: 'core',
    required: true,
    maxLength: 180,
    suggestable: true,
    placeholder: 'e.g., Innovation Summit 2025',
    aliases: ['eventTitle', 'title', 'posterTitle', 'announcementTitle', 'flyerTitle', 'brochureTitle'],
  },

  eventTagline: {
    id: 'eventTagline',
    label: 'Tagline / Subtitle',
    type: 'text',
    category: 'core',
    maxLength: 150,
    suggestable: true,
    placeholder: 'Optional catchy subtitle',
    aliases: ['subtitle', 'tagline', 'subheadline'],
  },

  eventDescription: {
    id: 'eventDescription',
    label: 'Description',
    type: 'textarea',
    category: 'content',
    maxLength: 450,
    rows: 3,
    suggestable: true,
    placeholder: 'Brief description of the event...',
    aliases: ['description', 'flyerDescription', 'mainMessage'],
  },

  eventDate: {
    id: 'eventDate',
    label: 'Event Date',
    type: 'date',
    category: 'core',
    required: true,
    aliases: ['date', 'certificateDate', 'postDate', 'importantDate', 'presentationDate', 'publicationDate', 'dateIssued'],
  },

  eventTime: {
    id: 'eventTime',
    label: 'Event Time',
    type: 'time',
    category: 'core',
    aliases: ['time', 'startTime'],
  },

  venue: {
    id: 'venue',
    label: 'Venue',
    type: 'text',
    category: 'core',
    required: true,
    maxLength: 225,
    placeholder: 'e.g., JKKN Convention Center, Coimbatore',
    aliases: ['eventVenue', 'location'],
  },

  // ---------------------------------------------------------------------------
  // SPEAKER FIELDS
  // ---------------------------------------------------------------------------

  speakerName: {
    id: 'speakerName',
    label: 'Speaker Name',
    type: 'text',
    category: 'speaker',
    maxLength: 150,
    placeholder: 'e.g., Dr. Jane Smith',
    aliases: ['speaker', 'guestSpeaker', 'presenterName', 'hostName'],
  },

  speakerDesignation: {
    id: 'speakerDesignation',
    label: 'Designation / Title',
    type: 'text',
    category: 'speaker',
    maxLength: 150,
    placeholder: 'e.g., CEO, TechCorp',
    aliases: ['presenterTitle'],
  },

  // ---------------------------------------------------------------------------
  // CONTACT FIELDS
  // ---------------------------------------------------------------------------

  contactNumber: {
    id: 'contactNumber',
    label: 'Contact Number',
    type: 'text',
    category: 'contact',
    maxLength: 45,
    placeholder: 'e.g., +91 98765 43210',
    aliases: ['phoneNumber', 'contactPhone'],
  },

  contactEmail: {
    id: 'contactEmail',
    label: 'Email Address',
    type: 'text',
    category: 'contact',
    maxLength: 75,
    placeholder: 'e.g., info@yi.org',
    aliases: ['emailAddress', 'email'],
  },

  registrationInfo: {
    id: 'registrationInfo',
    label: 'Registration Info',
    type: 'text',
    category: 'contact',
    maxLength: 180,
    suggestable: true,
    placeholder: 'e.g., Register at yi.org/events',
    aliases: ['rsvpInfo'],
  },

  websiteUrl: {
    id: 'websiteUrl',
    label: 'Website / Link',
    type: 'text',
    category: 'contact',
    maxLength: 225,
    placeholder: 'e.g., yi.org/event',
    aliases: ['website', 'linkText', 'linkedinUrl'],
  },

  contactInfo: {
    id: 'contactInfo',
    label: 'Contact Information',
    type: 'text',
    category: 'contact',
    maxLength: 150,
    placeholder: 'e.g., Call 1800-XXX or visit yi.org',
  },

  // ---------------------------------------------------------------------------
  // CERTIFICATE & SIGNATORY FIELDS
  // ---------------------------------------------------------------------------

  recipientName: {
    id: 'recipientName',
    label: 'Recipient Name',
    type: 'text',
    category: 'core',
    required: true,
    maxLength: 90,
    placeholder: 'e.g., Jane Smith',
    aliases: ['recipient'],
  },

  certificateTitle: {
    id: 'certificateTitle',
    label: 'Certificate Title',
    type: 'text',
    category: 'core',
    required: true,
    maxLength: 90,
    suggestable: true,
    placeholder: 'e.g., Certificate of Achievement',
  },

  achievementDescription: {
    id: 'achievementDescription',
    label: 'Achievement Description',
    type: 'textarea',
    category: 'content',
    required: true,
    maxLength: 300,
    rows: 2,
    suggestable: true,
    placeholder: 'For outstanding contribution to...',
  },

  certificateStyle: {
    id: 'certificateStyle',
    label: 'Certificate Style',
    type: 'select',
    category: 'advanced',
    options: ['Classic', 'Modern', 'Corporate', 'Academic'],
    aliases: ['style'],
  },

  issuingAuthority: {
    id: 'issuingAuthority',
    label: 'Issuing Authority',
    type: 'text',
    category: 'signatory',
    required: true,
    maxLength: 120,
    placeholder: 'e.g., Yi National Office',
  },

  signatoryName: {
    id: 'signatoryName',
    label: 'Signatory Name',
    type: 'text',
    category: 'signatory',
    maxLength: 90,
    placeholder: 'e.g., Dr. John Smith',
  },

  signatoryDesignation: {
    id: 'signatoryDesignation',
    label: 'Signatory Title',
    type: 'text',
    category: 'signatory',
    maxLength: 90,
    placeholder: 'e.g., National Chair',
  },

  signatoryName2: {
    id: 'signatoryName2',
    label: 'Second Signatory Name',
    type: 'text',
    category: 'signatory',
    maxLength: 90,
    placeholder: 'e.g., Jane Doe',
  },

  signatoryDesignation2: {
    id: 'signatoryDesignation2',
    label: 'Second Signatory Title',
    type: 'text',
    category: 'signatory',
    maxLength: 90,
    placeholder: 'e.g., Regional Director',
  },

  certificateNumber: {
    id: 'certificateNumber',
    label: 'Certificate Number',
    type: 'text',
    category: 'advanced',
    maxLength: 45,
    placeholder: 'e.g., CERT-2025-001',
  },

  // ---------------------------------------------------------------------------
  // SOCIAL MEDIA FIELDS
  // ---------------------------------------------------------------------------

  postCaption: {
    id: 'postCaption',
    label: 'Caption',
    type: 'textarea',
    category: 'core',
    required: true,
    maxLength: 450,
    rows: 3,
    suggestable: true,
    placeholder: 'Write your caption here...',
    aliases: ['postDescription', 'professionalMessage', 'tweetText', 'statusMessage', 'announcementMessage'],
  },

  postTitle: {
    id: 'postTitle',
    label: 'Post Title',
    type: 'text',
    category: 'core',
    required: true,
    maxLength: 150,
    suggestable: true,
    placeholder: 'Create an engaging headline...',
    aliases: ['headline', 'storyHeadline', 'pinTitle', 'coverTitle', 'bannerTitle', 'headerTitle', 'adHeadline'],
  },

  hashtags: {
    id: 'hashtags',
    label: 'Hashtags',
    type: 'text',
    category: 'social',
    maxLength: 225,
    suggestable: true,
    placeholder: '#YiIndia #Innovation',
  },

  callToAction: {
    id: 'callToAction',
    label: 'Call to Action',
    type: 'text',
    category: 'social',
    maxLength: 75,
    suggestable: true,
    placeholder: 'e.g., Register Now!, Learn More',
    aliases: ['actionRequired'],
  },

  supportingText: {
    id: 'supportingText',
    label: 'Supporting Text',
    type: 'text',
    category: 'content',
    maxLength: 120,
    suggestable: true,
    placeholder: 'Additional context...',
    aliases: ['supportingMessage', 'briefDescription', 'keyInsight'],
  },

  // ---------------------------------------------------------------------------
  // BRANDING FIELDS
  // ---------------------------------------------------------------------------

  organizationName: {
    id: 'organizationName',
    label: 'Organization Name',
    type: 'text',
    category: 'branding',
    maxLength: 90,
    placeholder: 'e.g., Yi Mumbai Chapter',
    aliases: ['companyName', 'organizedBy', 'chapterName'],
  },

  companyAddress: {
    id: 'companyAddress',
    label: 'Address',
    type: 'text',
    category: 'branding',
    maxLength: 180,
    placeholder: 'Full address...',
  },

  socialHandle: {
    id: 'socialHandle',
    label: 'Social Handle',
    type: 'text',
    category: 'social',
    maxLength: 60,
    placeholder: 'e.g., @yimumbai',
  },

  // ---------------------------------------------------------------------------
  // MEDIA / VIDEO FIELDS
  // ---------------------------------------------------------------------------

  videoTitle: {
    id: 'videoTitle',
    label: 'Video Title',
    type: 'text',
    category: 'core',
    required: true,
    maxLength: 120,
    suggestable: true,
    placeholder: 'Bold, attention-grabbing title (3-5 words)',
  },

  hookText: {
    id: 'hookText',
    label: 'Hook/Teaser Text',
    type: 'text',
    category: 'content',
    maxLength: 60,
    suggestable: true,
    placeholder: "e.g., You Won't Believe This!",
  },

  channelName: {
    id: 'channelName',
    label: 'Channel Name',
    type: 'text',
    category: 'media',
    maxLength: 90,
    placeholder: 'Your channel name',
  },

  uploadSchedule: {
    id: 'uploadSchedule',
    label: 'Upload Schedule',
    type: 'text',
    category: 'media',
    maxLength: 75,
    placeholder: 'e.g., New videos every Friday',
  },

  episodeNumber: {
    id: 'episodeNumber',
    label: 'Episode Number',
    type: 'text',
    category: 'media',
    maxLength: 30,
    placeholder: 'e.g., Episode 12',
  },

  // ---------------------------------------------------------------------------
  // MARKETING FIELDS
  // ---------------------------------------------------------------------------

  valueProposition: {
    id: 'valueProposition',
    label: 'Value Proposition',
    type: 'text',
    category: 'content',
    maxLength: 90,
    suggestable: true,
    placeholder: 'What makes this special?',
  },

  offerDetails: {
    id: 'offerDetails',
    label: 'Offer Details',
    type: 'text',
    category: 'content',
    maxLength: 60,
    suggestable: true,
    placeholder: 'e.g., 50% off, Free Entry',
    aliases: ['offerText', 'entryFee'],
  },

  keyPoints: {
    id: 'keyPoints',
    label: 'Key Points',
    type: 'textarea',
    category: 'content',
    maxLength: 450,
    rows: 3,
    suggestable: true,
    placeholder: 'Bullet points or key highlights...',
  },

  // ---------------------------------------------------------------------------
  // EVENT-SPECIFIC FIELDS
  // ---------------------------------------------------------------------------

  targetAudience: {
    id: 'targetAudience',
    label: 'Target Audience',
    type: 'select',
    category: 'advanced',
    options: ['General Public', 'Business Professionals', 'Students', 'Families', 'Youth (18-35)', 'Senior Citizens'],
  },

  dressCode: {
    id: 'dressCode',
    label: 'Dress Code',
    type: 'text',
    category: 'advanced',
    maxLength: 60,
    placeholder: 'e.g., Formal, Business Casual',
  },

  specialInstructions: {
    id: 'specialInstructions',
    label: 'Special Instructions',
    type: 'textarea',
    category: 'advanced',
    maxLength: 225,
    rows: 2,
    suggestable: true,
    placeholder: 'Any special instructions for guests...',
  },

  // ---------------------------------------------------------------------------
  // DOCUMENT FIELDS
  // ---------------------------------------------------------------------------

  personName: {
    id: 'personName',
    label: 'Full Name',
    type: 'text',
    category: 'core',
    required: true,
    maxLength: 75,
    placeholder: 'e.g., John Doe',
  },

  jobTitle: {
    id: 'jobTitle',
    label: 'Job Title',
    type: 'text',
    category: 'core',
    maxLength: 90,
    placeholder: 'e.g., Marketing Director',
  },

  professionalSummary: {
    id: 'professionalSummary',
    label: 'Professional Summary',
    type: 'textarea',
    category: 'content',
    maxLength: 450,
    rows: 3,
    suggestable: true,
    placeholder: 'Brief professional summary...',
  },

  reportTitle: {
    id: 'reportTitle',
    label: 'Report Title',
    type: 'text',
    category: 'core',
    required: true,
    maxLength: 150,
    suggestable: true,
    placeholder: 'e.g., Annual Impact Report 2025',
  },

  authorName: {
    id: 'authorName',
    label: 'Author Name',
    type: 'text',
    category: 'core',
    maxLength: 90,
    placeholder: 'e.g., Research Team',
  },

  reportPeriod: {
    id: 'reportPeriod',
    label: 'Report Period',
    type: 'text',
    category: 'advanced',
    maxLength: 60,
    placeholder: 'e.g., FY 2024-2025',
  },

  bookTitle: {
    id: 'bookTitle',
    label: 'Book Title',
    type: 'text',
    category: 'core',
    required: true,
    maxLength: 120,
    suggestable: true,
    placeholder: 'The title of your book...',
  },

  presentationTitle: {
    id: 'presentationTitle',
    label: 'Presentation Title',
    type: 'text',
    category: 'core',
    required: true,
    maxLength: 120,
    suggestable: true,
    placeholder: 'e.g., Q4 Business Review',
  },

  // ---------------------------------------------------------------------------
  // ADVANCED / GLOBAL FIELDS
  // ---------------------------------------------------------------------------

  additionalDetails: {
    id: 'additionalDetails',
    label: 'Additional Details',
    type: 'textarea',
    category: 'advanced',
    maxLength: 500,
    rows: 3,
    suggestable: true,
    placeholder: 'Any extra information to include...',
    aliases: ['eventNote', 'additionalNote', 'notes'],
    helpText: 'Optional: Add announcements, registration info, or extra details to display',
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build a map of all legacy field IDs to their canonical IDs
 */
const aliasMap: Map<string, string> = new Map()

for (const [canonicalId, field] of Object.entries(FIELD_REGISTRY)) {
  // Map the canonical ID to itself
  aliasMap.set(canonicalId, canonicalId)

  // Map all aliases to the canonical ID
  if (field.aliases) {
    for (const alias of field.aliases) {
      aliasMap.set(alias, canonicalId)
    }
  }
}

/**
 * Resolve a legacy field ID to its canonical ID
 * Returns the original fieldId if no mapping exists
 */
export function resolveFieldId(fieldId: string): string {
  return aliasMap.get(fieldId) || fieldId
}

/**
 * Get a canonical field by ID (supports aliases)
 */
export function getField(fieldId: string): CanonicalField | undefined {
  const canonicalId = resolveFieldId(fieldId)
  return FIELD_REGISTRY[canonicalId]
}

/**
 * Get all fields for a specific category
 */
export function getFieldsByCategory(category: FieldCategory): CanonicalField[] {
  return Object.values(FIELD_REGISTRY).filter((field) => field.category === category)
}

/**
 * Get all suggestable field IDs
 */
export function getSuggestableFieldIds(): string[] {
  return Object.values(FIELD_REGISTRY)
    .filter((field) => field.suggestable)
    .map((field) => field.id)
}

/**
 * Get all required field IDs
 */
export function getRequiredFieldIds(): string[] {
  return Object.values(FIELD_REGISTRY)
    .filter((field) => field.required)
    .map((field) => field.id)
}

/**
 * Create a field instance from the registry with optional overrides
 */
export function createField(
  fieldId: string,
  overrides?: Partial<CanonicalField>
): CanonicalField | undefined {
  const baseField = getField(fieldId)
  if (!baseField) return undefined

  return {
    ...baseField,
    ...overrides,
  }
}

/**
 * Get multiple fields by their IDs
 */
export function getFields(fieldIds: string[]): CanonicalField[] {
  return fieldIds
    .map((id) => getField(id))
    .filter((field): field is CanonicalField => field !== undefined)
}

/**
 * Get all canonical field IDs
 */
export function getAllFieldIds(): string[] {
  return Object.keys(FIELD_REGISTRY)
}

/**
 * Check if a field ID is a known alias
 */
export function isAlias(fieldId: string): boolean {
  const canonicalId = aliasMap.get(fieldId)
  return canonicalId !== undefined && canonicalId !== fieldId
}

/**
 * Get all aliases for a canonical field
 */
export function getAliases(canonicalId: string): string[] {
  const field = FIELD_REGISTRY[canonicalId]
  return field?.aliases || []
}
