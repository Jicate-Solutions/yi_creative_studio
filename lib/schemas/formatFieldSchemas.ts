/**
 * Format Field Schemas - Dynamic form field definitions by creative format
 *
 * This file provides per-format field definitions for optimal prompt generation.
 * Each format has its own set of fields tailored to its specific use case.
 *
 * Based on PRD: docs/creative_fields.md
 */

// ============================================================================
// Types
// ============================================================================

export type FieldType = 'text' | 'textarea' | 'date' | 'time' | 'select'

export type FormatCategory =
  | 'social_media'
  | 'video'
  | 'event'
  | 'print'
  | 'marketing'
  | 'document'
  | 'presentation'
  | 'admission'

export interface DynamicField {
  id: string
  label: string
  type: FieldType
  required: boolean
  suggestable: boolean
  maxLength?: number
  rows?: number
  options?: string[]
  placeholder?: string
}

export interface FormatFieldSchema {
  formatId: string
  displayName: string
  category: FormatCategory
  fields: DynamicField[]
  designNotes?: string
  applicableVerticals?: string[]
}

// ============================================================================
// Social Media Format Schemas
// ============================================================================

const instagramPost: FormatFieldSchema = {
  formatId: 'instagram_post',
  displayName: 'Instagram Post',
  category: 'social_media',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'eventName',
      label: 'Event Name',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 180,
      placeholder: 'e.g., Annual Traffic Awareness Campaign',
    },
    {
      id: 'eventTagline',
      label: 'Event Tagline/Subtitle',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 150,
      placeholder: 'e.g., Empowering Tomorrow\'s Leaders',
    },
    {
      id: 'eventDescription',
      label: 'Event Description',
      type: 'textarea',
      required: false,
      suggestable: true,
      maxLength: 450,
      rows: 3,
      placeholder: 'Brief description of the event...',
    },
    {
      id: 'eventDate',
      label: 'Event Date',
      type: 'date',
      required: false,
      suggestable: false,
    },
    {
      id: 'eventTime',
      label: 'Event Time',
      type: 'time',
      required: false,
      suggestable: false,
    },
    {
      id: 'venue',
      label: 'Venue',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 225,
      placeholder: 'e.g., Conference Hall, Mumbai',
    },
    {
      id: 'targetAudience',
      label: 'Target Audience',
      type: 'select',
      required: false,
      suggestable: false,
      options: ['General Public', 'Business Professionals', 'Students', 'Families', 'Youth (18-35)', 'Senior Citizens'],
    },
  ],
}

const instagramStory: FormatFieldSchema = {
  formatId: 'instagram_story',
  displayName: 'Instagram Story',
  category: 'social_media',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'storyHeadline',
      label: 'Story Headline',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 120,
      placeholder: 'Short, impactful headline...',
    },
    {
      id: 'briefDescription',
      label: 'Brief Description',
      type: 'textarea',
      required: false,
      suggestable: true,
      maxLength: 300,
      rows: 2,
      placeholder: 'Supporting message...',
    },
    {
      id: 'callToAction',
      label: 'Call to Action',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 60,
      placeholder: 'e.g., Swipe Up, Tap to Learn',
    },
    {
      id: 'hashtags',
      label: 'Hashtags',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 150,
      placeholder: '#YiIndia #Story',
    },
  ],
}

const facebookPost: FormatFieldSchema = {
  formatId: 'facebook_post',
  displayName: 'Facebook Post',
  category: 'social_media',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'postTitle',
      label: 'Post Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 150,
      placeholder: 'Create an attention-grabbing title...',
    },
    {
      id: 'postDescription',
      label: 'Post Description',
      type: 'textarea',
      required: true,
      suggestable: true,
      maxLength: 525,
      rows: 4,
      placeholder: 'Write your Facebook post content...',
    },
    {
      id: 'callToAction',
      label: 'Call to Action',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 75,
      placeholder: 'e.g., Learn More, Register Now',
    },
    {
      id: 'linkText',
      label: 'Link Text',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 120,
      placeholder: 'e.g., Visit our website',
    },
  ],
}

const linkedinPost: FormatFieldSchema = {
  formatId: 'linkedin_post',
  displayName: 'LinkedIn Post',
  category: 'social_media',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'headline',
      label: 'Headline',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 150,
      placeholder: 'Professional, engaging headline...',
    },
    {
      id: 'professionalMessage',
      label: 'Professional Message',
      type: 'textarea',
      required: true,
      suggestable: true,
      maxLength: 600,
      rows: 4,
      placeholder: 'Share your professional insight or message...',
    },
    {
      id: 'keyInsight',
      label: 'Key Insight',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 225,
      placeholder: 'Main takeaway for your audience...',
    },
    {
      id: 'callToAction',
      label: 'Call to Action',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 75,
      placeholder: 'e.g., Connect with us, Learn more',
    },
  ],
}

const twitterPost: FormatFieldSchema = {
  formatId: 'twitter_post',
  displayName: 'Twitter/X Post',
  category: 'social_media',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'tweetText',
      label: 'Tweet Text',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 150,
      placeholder: 'Short, impactful message...',
    },
    {
      id: 'supportingMessage',
      label: 'Supporting Message',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 120,
      placeholder: 'Additional context...',
    },
    {
      id: 'hashtags',
      label: 'Hashtags',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 90,
      placeholder: '#YiIndia #Trending',
    },
  ],
}

const pinterestPin: FormatFieldSchema = {
  formatId: 'pinterest_pin',
  displayName: 'Pinterest Pin',
  category: 'social_media',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'pinTitle',
      label: 'Pin Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 120,
      placeholder: 'Descriptive, searchable title...',
    },
    {
      id: 'pinDescription',
      label: 'Pin Description',
      type: 'textarea',
      required: false,
      suggestable: true,
      maxLength: 300,
      rows: 2,
      placeholder: 'Describe your pin for discovery...',
    },
    {
      id: 'callToAction',
      label: 'Call to Action',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 60,
      placeholder: 'e.g., Save for later, Click to learn',
    },
  ],
}

const whatsappStatus: FormatFieldSchema = {
  formatId: 'whatsapp_status',
  displayName: 'WhatsApp Status',
  category: 'social_media',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'statusMessage',
      label: 'Status Message',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 150,
      placeholder: 'Your status message...',
    },
    {
      id: 'supportingText',
      label: 'Supporting Text',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 120,
      placeholder: 'Additional details...',
    },
    {
      id: 'callToAction',
      label: 'Call to Action',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 60,
      placeholder: 'e.g., Contact us, Reply to join',
    },
  ],
}

// ============================================================================
// Video Format Schemas
// ============================================================================

const youtubeThumbnail: FormatFieldSchema = {
  formatId: 'youtube_thumbnail',
  displayName: 'YouTube Thumbnail',
  category: 'video',
  designNotes: 'Text must be readable at small sizes (mobile). 1-3 words maximum for overlay text. Face/expression should be prominent if applicable.',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'videoTitle',
      label: 'Video Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 90,
      placeholder: 'Bold, attention-grabbing title (3-5 words)',
    },
    {
      id: 'hookText',
      label: 'Hook/Teaser Text',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 60,
      placeholder: "e.g., You Won't Believe This!",
    },
    {
      id: 'channelName',
      label: 'Channel Name',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 75,
      placeholder: 'For branding reference',
    },
  ],
}

const youtubeBanner: FormatFieldSchema = {
  formatId: 'youtube_banner',
  displayName: 'YouTube Banner',
  category: 'video',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'channelName',
      label: 'Channel Name',
      type: 'text',
      required: true,
      suggestable: false,
      maxLength: 90,
      placeholder: 'Your channel name',
    },
    {
      id: 'tagline',
      label: 'Tagline',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 120,
      placeholder: 'Your channel tagline or mission',
    },
    {
      id: 'uploadSchedule',
      label: 'Upload Schedule',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 75,
      placeholder: 'e.g., New videos every Friday',
    },
  ],
}

const videoCover: FormatFieldSchema = {
  formatId: 'video_cover',
  displayName: 'Video Cover',
  category: 'video',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'videoTitle',
      label: 'Video Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 120,
      placeholder: 'Title of your video',
    },
    {
      id: 'subtitle',
      label: 'Subtitle',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 90,
      placeholder: 'Supporting subtitle...',
    },
    {
      id: 'hostName',
      label: 'Host Name',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 75,
      placeholder: 'e.g., Presented by Jane Doe',
    },
    {
      id: 'episodeNumber',
      label: 'Episode Number',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 30,
      placeholder: 'e.g., Episode 12',
    },
  ],
}

// ============================================================================
// Event Format Schemas
// ============================================================================

const eventPoster: FormatFieldSchema = {
  formatId: 'event_poster',
  displayName: 'Event Poster',
  category: 'event',
  designNotes: 'Date should include day of week (e.g., "Friday, March 23"). Speaker photo can be included if provided.',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'eventName',
      label: 'Event Name',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 180,
      placeholder: 'e.g., Annual Traffic Awareness Campaign',
    },
    {
      id: 'eventTagline',
      label: 'Event Tagline/Subtitle',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 150,
      placeholder: 'e.g., Empowering Tomorrow\'s Leaders',
    },
    {
      id: 'eventDescription',
      label: 'Event Description',
      type: 'textarea',
      required: false,
      suggestable: true,
      maxLength: 450,
      rows: 3,
      placeholder: 'Brief description of the event...',
    },
    {
      id: 'eventDate',
      label: 'Event Date',
      type: 'date',
      required: false,
      suggestable: false,
    },
    {
      id: 'eventTime',
      label: 'Event Time',
      type: 'time',
      required: false,
      suggestable: false,
    },
    {
      id: 'venue',
      label: 'Venue',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 225,
      placeholder: 'e.g., Conference Hall, Mumbai',
    },
    {
      id: 'speakerName',
      label: 'Speaker Name',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 150,
      placeholder: 'e.g., Dr. John Smith',
    },
    {
      id: 'speakerDesignation',
      label: 'Speaker Designation',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 150,
      placeholder: 'e.g., Director, Road Safety Board',
    },
    {
      id: 'entryFee',
      label: 'Entry Fee',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., Free Entry, Rs. 500',
    },
    {
      id: 'targetAudience',
      label: 'Target Audience',
      type: 'select',
      required: false,
      suggestable: false,
      options: ['General Public', 'Business Professionals', 'Students', 'Families', 'Youth (18-35)', 'Senior Citizens'],
    },
    {
      id: 'registrationInfo',
      label: 'Registration Info',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 180,
      placeholder: 'e.g., Register at yi.org or call 1800-XXX',
    },
    {
      id: 'contactNumber',
      label: 'Contact Number',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 45,
      placeholder: 'e.g., +91 98765 43210',
    },
    {
      id: 'websiteUrl',
      label: 'Website/Link',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 225,
      placeholder: 'e.g., yi.org/event',
    },
  ],
}

const portraitPoster: FormatFieldSchema = {
  formatId: 'portrait_poster',
  displayName: 'Portrait Poster',
  category: 'event',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'eventName',
      label: 'Poster Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 120,
      placeholder: 'Main title for the poster...',
    },
    {
      id: 'subtitle',
      label: 'Subtitle',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 150,
      placeholder: 'Supporting subtitle...',
    },
    {
      id: 'eventDate',
      label: 'Event Date',
      type: 'date',
      required: false,
      suggestable: false,
    },
    {
      id: 'eventTime',
      label: 'Event Time',
      type: 'time',
      required: false,
      suggestable: false,
    },
    {
      id: 'venue',
      label: 'Venue',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 150,
      placeholder: 'Event location...',
    },
    {
      id: 'contactInfo',
      label: 'Contact Info',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 120,
      placeholder: 'e.g., Call 1800-XXX or visit yi.org',
    },
  ],
}

const announcement: FormatFieldSchema = {
  formatId: 'announcement',
  displayName: 'Announcement',
  category: 'event',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'eventName',
      label: 'Announcement Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 120,
      placeholder: 'e.g., New Chapter Launch!',
    },
    {
      id: 'announcementMessage',
      label: 'Announcement Message',
      type: 'textarea',
      required: true,
      suggestable: true,
      maxLength: 375,
      rows: 3,
      placeholder: 'Key details of the announcement...',
    },
    {
      id: 'importantDate',
      label: 'Important Date',
      type: 'date',
      required: false,
      suggestable: false,
    },
    {
      id: 'actionRequired',
      label: 'Action Required',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 90,
      placeholder: 'What should the audience do?',
    },
  ],
}

const invitation: FormatFieldSchema = {
  formatId: 'invitation',
  displayName: 'Invitation',
  category: 'event',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'eventName',
      label: 'Event Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 120,
      placeholder: 'e.g., Annual Gala Dinner',
    },
    {
      id: 'hostName',
      label: 'Host Name',
      type: 'text',
      required: true,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., Yi Mumbai Chapter',
    },
    {
      id: 'eventDate',
      label: 'Event Date',
      type: 'date',
      required: false,
      suggestable: false,
    },
    {
      id: 'eventTime',
      label: 'Event Time',
      type: 'time',
      required: false,
      suggestable: false,
    },
    {
      id: 'venue',
      label: 'Venue',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 180,
      placeholder: 'e.g., The Grand Ballroom, Hotel Taj',
    },
    {
      id: 'dressCode',
      label: 'Dress Code',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 60,
      placeholder: 'e.g., Formal, Business Casual',
    },
    {
      id: 'rsvpInfo',
      label: 'RSVP Information',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 120,
      placeholder: 'e.g., RSVP by Dec 15 to events@yi.org',
    },
    {
      id: 'specialInstructions',
      label: 'Special Instructions',
      type: 'textarea',
      required: false,
      suggestable: true,
      maxLength: 225,
      rows: 2,
      placeholder: 'Any special instructions for guests...',
    },
  ],
}

// ============================================================================
// Print Format Schemas
// ============================================================================

const flyerA4: FormatFieldSchema = {
  formatId: 'flyer_a4',
  displayName: 'Flyer (A4)',
  category: 'print',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'eventName',
      label: 'Flyer Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 120,
      placeholder: 'Main title for the flyer...',
    },
    {
      id: 'flyerDescription',
      label: 'Flyer Description',
      type: 'textarea',
      required: true,
      suggestable: true,
      maxLength: 450,
      rows: 3,
      placeholder: 'Key details and information...',
    },
    {
      id: 'eventDate',
      label: 'Event Date',
      type: 'date',
      required: false,
      suggestable: false,
    },
    {
      id: 'eventTime',
      label: 'Event Time',
      type: 'time',
      required: false,
      suggestable: false,
    },
    {
      id: 'venue',
      label: 'Venue',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 150,
      placeholder: 'Event location...',
    },
    {
      id: 'contactPhone',
      label: 'Contact Phone',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 30,
      placeholder: 'e.g., +91 98765 43210',
    },
    {
      id: 'contactEmail',
      label: 'Contact Email',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 75,
      placeholder: 'e.g., info@yi.org',
    },
    {
      id: 'websiteUrl',
      label: 'Website',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 120,
      placeholder: 'e.g., www.yi.org',
    },
    {
      id: 'callToAction',
      label: 'Call to Action',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 75,
      placeholder: 'e.g., Register Now, Join Us',
    },
  ],
}

const flyerA5: FormatFieldSchema = {
  ...flyerA4,
  formatId: 'flyer_a5',
  displayName: 'Flyer (A5)',
}

const businessCard: FormatFieldSchema = {
  formatId: 'business_card',
  displayName: 'Business Card',
  category: 'print',
  applicableVerticals: [],
  fields: [
    {
      id: 'personName',
      label: 'Full Name',
      type: 'text',
      required: true,
      suggestable: false,
      maxLength: 75,
      placeholder: 'e.g., John Doe',
    },
    {
      id: 'jobTitle',
      label: 'Job Title',
      type: 'text',
      required: true,
      suggestable: false,
      maxLength: 75,
      placeholder: 'e.g., Marketing Director',
    },
    {
      id: 'companyName',
      label: 'Company/Organization',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., Yi Mumbai',
    },
    {
      id: 'phoneNumber',
      label: 'Phone Number',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 30,
      placeholder: 'e.g., +91 98765 43210',
    },
    {
      id: 'emailAddress',
      label: 'Email Address',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 75,
      placeholder: 'e.g., john@yi.org',
    },
    {
      id: 'websiteUrl',
      label: 'Website',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., www.yi.org',
    },
    {
      id: 'socialHandle',
      label: 'Social Handle',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 60,
      placeholder: 'e.g., @yimumbai',
    },
  ],
}

const certificate: FormatFieldSchema = {
  formatId: 'certificate',
  displayName: 'Certificate',
  category: 'print',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'certificateTitle',
      label: 'Certificate Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 90,
      placeholder: 'e.g., Certificate of Achievement',
    },
    {
      id: 'recipientName',
      label: 'Recipient Name',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., Jane Smith',
    },
    {
      id: 'achievementDescription',
      label: 'Achievement Description',
      type: 'textarea',
      required: true,
      suggestable: true,
      maxLength: 300,
      rows: 2,
      placeholder: 'For outstanding contribution to...',
    },
    {
      id: 'style',
      label: 'Certificate Style',
      type: 'select',
      required: false,
      suggestable: false,
      options: ['Classic', 'Modern', 'Corporate', 'Academic'],
      placeholder: 'Select a style',
    },
    {
      id: 'dateIssued',
      label: 'Date Issued',
      type: 'date',
      required: true,
      suggestable: false,
    },
    {
      id: 'issuingAuthority',
      label: 'Issuing Authority',
      type: 'text',
      required: true,
      suggestable: false,
      maxLength: 120,
      placeholder: 'e.g., Yi National Office',
    },
    {
      id: 'signatoryName',
      label: 'Signatory Name',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., Dr. John Smith, Director',
    },
    {
      id: 'signatoryDesignation',
      label: 'Signatory Designation',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., National Chair',
    },
    {
      id: 'signatoryName2',
      label: 'Second Signatory Name',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., Jane Doe, Co-Chair',
    },
    {
      id: 'signatoryDesignation2',
      label: 'Second Signatory Designation',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., Regional Director',
    },
    {
      id: 'certificateNumber',
      label: 'Certificate Number',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 45,
      placeholder: 'e.g., CERT-2025-001',
    },
  ],
}

const brochure: FormatFieldSchema = {
  formatId: 'brochure',
  displayName: 'Brochure',
  category: 'print',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'eventName',
      label: 'Brochure Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 120,
      placeholder: 'Main title for the brochure...',
    },
    {
      id: 'mainMessage',
      label: 'Main Message',
      type: 'textarea',
      required: true,
      suggestable: true,
      maxLength: 525,
      rows: 4,
      placeholder: 'Key message and content...',
    },
    {
      id: 'keyPoints',
      label: 'Key Points',
      type: 'textarea',
      required: false,
      suggestable: true,
      maxLength: 450,
      rows: 3,
      placeholder: 'Bullet points or key highlights...',
    },
    {
      id: 'contactInfo',
      label: 'Contact Information',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 150,
      placeholder: 'e.g., Call 1800-XXX or visit yi.org',
    },
    {
      id: 'callToAction',
      label: 'Call to Action',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 90,
      placeholder: 'e.g., Join the Movement',
    },
  ],
}

// ============================================================================
// Marketing Format Schemas
// ============================================================================

const webBanner: FormatFieldSchema = {
  formatId: 'web_banner',
  displayName: 'Web Banner',
  category: 'marketing',
  designNotes: '5-10 words maximum total. CTA button is most important element. Logo should cover 10-15% of ad.',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'headline',
      label: 'Headline',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 75,
      placeholder: 'Short, impactful headline...',
    },
    {
      id: 'valueProposition',
      label: 'Value Proposition',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 90,
      placeholder: 'What makes this special?',
    },
    {
      id: 'callToAction',
      label: 'Call to Action',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 38,
      placeholder: 'e.g., Learn More, Join Now',
    },
    {
      id: 'offerDetails',
      label: 'Offer Details',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 60,
      placeholder: 'e.g., 50% off, Free Entry',
    },
  ],
}

const emailHeader: FormatFieldSchema = {
  formatId: 'email_header',
  displayName: 'Email Header',
  category: 'marketing',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'headerTitle',
      label: 'Header Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 75,
      placeholder: 'Email header title...',
    },
    {
      id: 'tagline',
      label: 'Tagline',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 90,
      placeholder: 'Supporting tagline...',
    },
  ],
}

const billboard: FormatFieldSchema = {
  formatId: 'billboard',
  displayName: 'Billboard',
  category: 'marketing',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'headline',
      label: 'Headline',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 60,
      placeholder: 'Bold, readable headline...',
    },
    {
      id: 'subheadline',
      label: 'Subheadline',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 75,
      placeholder: 'Supporting message...',
    },
    {
      id: 'callToAction',
      label: 'Call to Action',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 30,
      placeholder: 'e.g., Visit yi.org',
    },
    {
      id: 'contactInfo',
      label: 'Contact Info',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 60,
      placeholder: 'e.g., Call 1800-XXX',
    },
  ],
}

const leaderboardAd: FormatFieldSchema = {
  formatId: 'leaderboard_ad',
  displayName: 'Leaderboard Ad',
  category: 'marketing',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'adHeadline',
      label: 'Ad Headline',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 60,
      placeholder: 'Attention-grabbing headline...',
    },
    {
      id: 'callToAction',
      label: 'Call to Action',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 30,
      placeholder: 'e.g., Click Here, Learn More',
    },
    {
      id: 'offerText',
      label: 'Offer Text',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 45,
      placeholder: 'e.g., Limited Time Offer',
    },
  ],
}

const squareAd: FormatFieldSchema = {
  formatId: 'square_ad',
  displayName: 'Square Ad',
  category: 'marketing',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'headline',
      label: 'Headline',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 60,
      placeholder: 'Short, impactful headline...',
    },
    {
      id: 'valueProposition',
      label: 'Value Proposition',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 75,
      placeholder: 'Why should they care?',
    },
    {
      id: 'callToAction',
      label: 'Call to Action',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 30,
      placeholder: 'e.g., Shop Now, Join Us',
    },
  ],
}

// ============================================================================
// Document Format Schemas
// ============================================================================

const letterhead: FormatFieldSchema = {
  formatId: 'letterhead',
  displayName: 'Letterhead',
  category: 'document',
  applicableVerticals: [],
  fields: [
    {
      id: 'companyName',
      label: 'Company/Organization Name',
      type: 'text',
      required: true,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., Yi Mumbai Chapter',
    },
    {
      id: 'companyAddress',
      label: 'Address',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 180,
      placeholder: 'Full address...',
    },
    {
      id: 'phoneNumber',
      label: 'Phone Number',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 30,
      placeholder: 'e.g., +91 22 1234 5678',
    },
    {
      id: 'emailAddress',
      label: 'Email Address',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 75,
      placeholder: 'e.g., info@yi.org',
    },
    {
      id: 'websiteUrl',
      label: 'Website',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., www.yi.org',
    },
    {
      id: 'tagline',
      label: 'Tagline',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 90,
      placeholder: 'Company tagline or motto...',
    },
  ],
}

const resume: FormatFieldSchema = {
  formatId: 'resume',
  displayName: 'Resume',
  category: 'document',
  applicableVerticals: [],
  fields: [
    {
      id: 'personName',
      label: 'Full Name',
      type: 'text',
      required: true,
      suggestable: false,
      maxLength: 75,
      placeholder: 'e.g., Jane Smith',
    },
    {
      id: 'jobTitle',
      label: 'Job Title',
      type: 'text',
      required: true,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., Senior Software Engineer',
    },
    {
      id: 'contactEmail',
      label: 'Email',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 75,
      placeholder: 'e.g., jane@email.com',
    },
    {
      id: 'contactPhone',
      label: 'Phone',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 30,
      placeholder: 'e.g., +91 98765 43210',
    },
    {
      id: 'linkedinUrl',
      label: 'LinkedIn URL',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 120,
      placeholder: 'e.g., linkedin.com/in/janesmith',
    },
    {
      id: 'professionalSummary',
      label: 'Professional Summary',
      type: 'textarea',
      required: false,
      suggestable: true,
      maxLength: 450,
      rows: 3,
      placeholder: 'Brief professional summary...',
    },
  ],
}

const reportCover: FormatFieldSchema = {
  formatId: 'report_cover',
  displayName: 'Report Cover',
  category: 'document',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'reportTitle',
      label: 'Report Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 150,
      placeholder: 'e.g., Annual Impact Report 2025',
    },
    {
      id: 'subtitle',
      label: 'Subtitle',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 120,
      placeholder: 'Supporting subtitle...',
    },
    {
      id: 'authorName',
      label: 'Author Name',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., Research Team',
    },
    {
      id: 'organizationName',
      label: 'Organization Name',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., Yi National',
    },
    {
      id: 'publicationDate',
      label: 'Publication Date',
      type: 'date',
      required: false,
      suggestable: false,
    },
    {
      id: 'reportPeriod',
      label: 'Report Period',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 60,
      placeholder: 'e.g., FY 2024-2025',
    },
  ],
}

const bookCover: FormatFieldSchema = {
  formatId: 'book_cover',
  displayName: 'Book Cover',
  category: 'document',
  applicableVerticals: [],
  fields: [
    {
      id: 'bookTitle',
      label: 'Book Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 120,
      placeholder: 'The title of your book...',
    },
    {
      id: 'subtitle',
      label: 'Subtitle',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 150,
      placeholder: 'Book subtitle...',
    },
    {
      id: 'authorName',
      label: 'Author Name',
      type: 'text',
      required: true,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., By John Doe',
    },
    {
      id: 'tagline',
      label: 'Tagline',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 120,
      placeholder: 'A compelling tagline...',
    },
  ],
}

// ============================================================================
// Presentation Format Schemas
// ============================================================================

const presentation16x9: FormatFieldSchema = {
  formatId: 'presentation_16_9',
  displayName: 'Presentation (16:9)',
  category: 'presentation',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'presentationTitle',
      label: 'Presentation Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 120,
      placeholder: 'e.g., Q4 Business Review',
    },
    {
      id: 'subtitle',
      label: 'Subtitle',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 150,
      placeholder: 'Supporting subtitle...',
    },
    {
      id: 'presenterName',
      label: 'Presenter Name',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., John Doe, CEO',
    },
    {
      id: 'presenterTitle',
      label: 'Presenter Title',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., Chief Executive Officer',
    },
    {
      id: 'eventName',
      label: 'Event Name',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 120,
      placeholder: 'e.g., Annual General Meeting',
    },
    {
      id: 'presentationDate',
      label: 'Presentation Date',
      type: 'date',
      required: false,
      suggestable: false,
    },
  ],
}

const presentation4x3: FormatFieldSchema = {
  ...presentation16x9,
  formatId: 'presentation_4_3',
  displayName: 'Presentation (4:3)',
}

// ============================================================================
// Additional Format Schemas (for complete coverage)
// ============================================================================

const instagramReel: FormatFieldSchema = {
  ...instagramStory,
  formatId: 'instagram_reel',
  displayName: 'Instagram Reel Cover',
}

const facebookCover: FormatFieldSchema = {
  formatId: 'facebook_cover',
  displayName: 'Facebook Cover',
  category: 'social_media',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'coverTitle',
      label: 'Cover Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 90,
      placeholder: 'Main title for your cover...',
    },
    {
      id: 'tagline',
      label: 'Tagline',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 120,
      placeholder: 'Supporting tagline...',
    },
    {
      id: 'callToAction',
      label: 'Call to Action',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 60,
      placeholder: 'e.g., Join Us Today',
    },
  ],
}

const facebookAd: FormatFieldSchema = {
  ...squareAd,
  formatId: 'facebook_ad',
  displayName: 'Facebook Ad',
}

const linkedinBanner: FormatFieldSchema = {
  formatId: 'linkedin_banner',
  displayName: 'LinkedIn Banner',
  category: 'social_media',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'bannerTitle',
      label: 'Banner Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 90,
      placeholder: 'Professional headline...',
    },
    {
      id: 'tagline',
      label: 'Tagline',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 120,
      placeholder: 'Company or personal tagline...',
    },
  ],
}

const twitterHeader: FormatFieldSchema = {
  formatId: 'twitter_header',
  displayName: 'Twitter/X Header',
  category: 'social_media',
  applicableVerticals: ['masoom', 'road_safety', 'health', 'yuva', 'climate_change', 'innovation', 'thalir', 'chapter_events'],
  fields: [
    {
      id: 'headerTitle',
      label: 'Header Title',
      type: 'text',
      required: true,
      suggestable: true,
      maxLength: 75,
      placeholder: 'Profile header title...',
    },
    {
      id: 'tagline',
      label: 'Tagline',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 90,
      placeholder: 'Your tagline or mission...',
    },
  ],
}

const tiktokCover: FormatFieldSchema = {
  ...instagramStory,
  formatId: 'tiktok_cover',
  displayName: 'TikTok Cover',
}

const landscapePoster: FormatFieldSchema = {
  ...portraitPoster,
  formatId: 'landscape_poster',
  displayName: 'Landscape Poster',
}

// ============================================================================
// Admission Campaign Format Schemas
// ============================================================================

// Shared base fields for all admission formats
const admissionBaseFields: DynamicField[] = [
  {
    id: 'institutionName',
    label: 'Institution Name',
    type: 'text',
    required: true,
    suggestable: false,
    maxLength: 120,
    placeholder: 'e.g., Sri Ramakrishna College of Arts & Science',
  },
  {
    id: 'courseName',
    label: 'Course / Program',
    type: 'select',
    required: true,
    suggestable: false,
    options: [
      'B.Sc', 'B.Com', 'B.A', 'B.Tech', 'B.E',
      'M.Sc', 'M.Com', 'M.A', 'M.Tech', 'MBA',
      'BCA', 'MCA', 'BBA', 'Polytechnic', 'ITI',
      'All UG Programs', 'All PG Programs', 'All Programs',
    ],
  },
  {
    id: 'collegeName',
    label: 'College / Campus Name',
    type: 'text',
    required: false,
    suggestable: false,
    maxLength: 120,
    placeholder: 'e.g., Main Campus, Coimbatore',
  },
  {
    id: 'tagline',
    label: 'Tagline / Slogan',
    type: 'text',
    required: false,
    suggestable: true,
    maxLength: 120,
    placeholder: 'e.g., Shape Your Future Here',
  },
  {
    id: 'admissionYear',
    label: 'Admission Year',
    type: 'text',
    required: false,
    suggestable: false,
    maxLength: 20,
    placeholder: 'e.g., 2025–26',
  },
  {
    id: 'contactInfo',
    label: 'Contact Info',
    type: 'text',
    required: false,
    suggestable: false,
    maxLength: 120,
    placeholder: 'e.g., +91 98765 43210 | admissions@college.edu',
  },
  {
    id: 'websiteUrl',
    label: 'Website',
    type: 'text',
    required: false,
    suggestable: false,
    maxLength: 90,
    placeholder: 'e.g., www.college.edu',
  },
  {
    id: 'note',
    label: 'Additional Note',
    type: 'text',
    required: false,
    suggestable: true,
    maxLength: 120,
    placeholder: 'e.g., Scholarships available, NAAC A++ Accredited',
  },
]

const admissionDirectionBoard: FormatFieldSchema = {
  formatId: 'admission_direction_board',
  displayName: 'Direction Board',
  category: 'admission',
  designNotes: 'Ultra-wide 4:1 highway board. Maximum 5-6 words. Must be readable at 60 km/h.',
  fields: [
    {
      id: 'institutionName',
      label: 'Institution Name',
      type: 'text',
      required: true,
      suggestable: false,
      maxLength: 60,
      placeholder: 'e.g., Sri Ramakrishna College',
    },
    {
      id: 'directionText',
      label: 'Direction / Distance',
      type: 'text',
      required: true,
      suggestable: false,
      maxLength: 40,
      placeholder: 'e.g., 2 km Ahead, Turn Right',
    },
    {
      id: 'tagline',
      label: 'Tagline',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 60,
      placeholder: 'e.g., Admissions Open 2025',
    },
    {
      id: 'contactInfo',
      label: 'Contact / Website',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 60,
      placeholder: 'e.g., www.college.edu',
    },
  ],
}

const admissionMainGate: FormatFieldSchema = {
  formatId: 'admission_main_gate',
  displayName: 'Main Gate Flex',
  category: 'admission',
  designNotes: 'Wide 3:1 gate banner. Institution name dominant, admission year prominent.',
  fields: admissionBaseFields,
}

const admissionInstitutionFlex: FormatFieldSchema = {
  formatId: 'admission_institution_flex',
  displayName: 'Institution Flex',
  category: 'admission',
  designNotes: '2:1 outdoor flex for high-visibility locations. Bold imagery and key programs.',
  fields: [
    ...admissionBaseFields,
    {
      id: 'keyPrograms',
      label: 'Key Programs to Highlight',
      type: 'textarea',
      required: false,
      suggestable: true,
      maxLength: 300,
      rows: 2,
      placeholder: 'e.g., B.Tech CS, MBA, B.Com CA — Top ranked programs',
    },
  ],
}

const admissionBusBack: FormatFieldSchema = {
  formatId: 'admission_bus_back',
  displayName: 'Bus Back Panel',
  category: 'admission',
  designNotes: '16:9 transit ad. Eye-catching at traffic stops. 3-4 key messages maximum.',
  fields: admissionBaseFields,
}

const admissionBusSide: FormatFieldSchema = {
  formatId: 'admission_bus_side',
  displayName: 'Bus Side Panel (3×4 ft)',
  category: 'admission',
  designNotes: '3:4 portrait bus side panel. Bold course list with pill badges. Student imagery right half. Contact prominent at bottom.',
  fields: [
    ...admissionBaseFields,
    {
      id: 'keyPrograms',
      label: 'Key Programs / Colleges',
      type: 'textarea',
      required: false,
      suggestable: true,
      maxLength: 400,
      rows: 3,
      placeholder: 'e.g., Dental | Nursing | Pharmacy | Engineering & Technology',
    },
    {
      id: 'streamType',
      label: 'Stream Focus',
      type: 'select',
      required: false,
      suggestable: false,
      options: ['Technical / Engineering', 'Medical / Paramedical', 'Arts & Science', 'All Streams'],
    },
  ],
}

const admissionStandee: FormatFieldSchema = {
  formatId: 'admission_standee',
  displayName: 'Admission Standee',
  category: 'admission',
  designNotes: 'Tall 2:5 standee. Top: branding. Middle: courses + USPs. Bottom: contact.',
  fields: [
    ...admissionBaseFields,
    {
      id: 'streamType',
      label: 'Stream Type',
      type: 'select',
      required: false,
      suggestable: false,
      options: ['Technical / Engineering', 'Medical / Paramedical', 'Arts & Science', 'Commerce', 'Management', 'All Streams'],
    },
  ],
}

const admissionStallFlex6x3: FormatFieldSchema = {
  formatId: 'admission_stall_flex_6x3',
  displayName: 'Stall Flex (6×3 ft)',
  category: 'admission',
  designNotes: '6×3 ft stall backdrop. 2:1 ratio. Education fair or campus stall use.',
  fields: [
    ...admissionBaseFields,
    {
      id: 'keyPrograms',
      label: 'Key Programs',
      type: 'textarea',
      required: false,
      suggestable: true,
      maxLength: 300,
      rows: 2,
      placeholder: 'e.g., B.Sc CS, BCA, M.Sc Data Science',
    },
  ],
}

const admissionStallFlex8x6: FormatFieldSchema = {
  formatId: 'admission_stall_flex_8x6',
  displayName: 'Stall Flex (8×6 ft)',
  category: 'admission',
  designNotes: '8×6 ft larger stall backdrop. 4:3 ratio. More content area for multiple courses.',
  fields: [
    ...admissionBaseFields,
    {
      id: 'keyPrograms',
      label: 'Key Programs',
      type: 'textarea',
      required: false,
      suggestable: true,
      maxLength: 450,
      rows: 3,
      placeholder: 'e.g., B.Tech, MBA, B.Sc, M.Sc, BCA, MCA',
    },
  ],
}

const admissionSocialPost: FormatFieldSchema = {
  formatId: 'admission_social_post',
  displayName: 'Admission Social Post',
  category: 'admission',
  designNotes: '4:5 vertical post for Instagram/Facebook/WhatsApp. Thumb-stopping design.',
  fields: [
    ...admissionBaseFields,
    {
      id: 'platform',
      label: 'Platform',
      type: 'select',
      required: false,
      suggestable: false,
      options: ['Instagram', 'Facebook', 'WhatsApp', 'LinkedIn', 'All Platforms'],
    },
    {
      id: 'courseHighlights',
      label: 'Course Highlights',
      type: 'textarea',
      required: false,
      suggestable: true,
      maxLength: 300,
      rows: 2,
      placeholder: 'e.g., 100% Placement | Industry Mentors | Scholarship Available',
    },
  ],
}

const admissionOfficeFlex: FormatFieldSchema = {
  formatId: 'admission_office_flex',
  displayName: 'Office Placement Flex',
  category: 'admission',
  designNotes: '3:1 flex for admission office or placement cell corridor.',
  fields: admissionBaseFields,
}

const admissionAchieversFlex: FormatFieldSchema = {
  formatId: 'admission_achievers_flex',
  displayName: '100 Years Achievers Flex',
  category: 'admission',
  designNotes: '2:3 portrait flex for centenary or achievers showcase. Rich legacy aesthetic.',
  fields: [
    ...admissionBaseFields,
    {
      id: 'yearMilestone',
      label: 'Year Milestone',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 40,
      placeholder: 'e.g., 100 Years of Excellence (1925–2025)',
    },
    {
      id: 'achieversList',
      label: 'Notable Achievers / Alumni',
      type: 'textarea',
      required: false,
      suggestable: true,
      maxLength: 450,
      rows: 3,
      placeholder: 'Names or accomplishments of notable alumni...',
    },
  ],
}

const admissionPhotoBooth: FormatFieldSchema = {
  formatId: 'admission_photo_booth',
  displayName: 'Photo Booth Backdrop',
  category: 'admission',
  designNotes: '16:9 landscape backdrop. Central area clean for subjects. Branding at edges.',
  fields: [
    {
      id: 'institutionName',
      label: 'Institution Name',
      type: 'text',
      required: true,
      suggestable: false,
      maxLength: 120,
      placeholder: 'e.g., Sri Ramakrishna College',
    },
    {
      id: 'themeName',
      label: 'Event / Theme Name',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 90,
      placeholder: 'e.g., Admissions Open Day 2025',
    },
    {
      id: 'eventDate',
      label: 'Event Date',
      type: 'date',
      required: false,
      suggestable: false,
    },
    {
      id: 'tagline',
      label: 'Tagline',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 90,
      placeholder: 'e.g., Your Journey Begins Here',
    },
    {
      id: 'websiteUrl',
      label: 'Website',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 90,
      placeholder: 'e.g., www.college.edu',
    },
  ],
}

// ============================================================================
// Format Field Schemas Registry
// ============================================================================

export const FORMAT_FIELD_SCHEMAS: Record<string, FormatFieldSchema> = {
  // Social Media
  instagram_post: instagramPost,
  instagram_story: instagramStory,
  instagram_reel: instagramReel,
  facebook_post: facebookPost,
  facebook_cover: facebookCover,
  facebook_ad: facebookAd,
  linkedin_post: linkedinPost,
  linkedin_banner: linkedinBanner,
  twitter_post: twitterPost,
  twitter_header: twitterHeader,
  pinterest_pin: pinterestPin,
  tiktok_cover: tiktokCover,
  whatsapp_status: whatsappStatus,

  // Video
  youtube_thumbnail: youtubeThumbnail,
  youtube_banner: youtubeBanner,
  video_cover: videoCover,

  // Events
  event_poster: eventPoster,
  portrait_poster: portraitPoster,
  landscape_poster: landscapePoster,
  announcement: announcement,
  invitation: invitation,

  // Print
  flyer_a4: flyerA4,
  flyer_a5: flyerA5,
  business_card: businessCard,
  certificate: certificate,
  brochure: brochure,

  // Marketing
  web_banner: webBanner,
  email_header: emailHeader,
  billboard: billboard,
  leaderboard_ad: leaderboardAd,
  square_ad: squareAd,

  // Documents
  letterhead: letterhead,
  resume: resume,
  report_cover: reportCover,
  book_cover: bookCover,

  // Presentations
  presentation_16_9: presentation16x9,
  presentation_4_3: presentation4x3,

  // Admission Campaign
  admission_direction_board: admissionDirectionBoard,
  admission_main_gate: admissionMainGate,
  admission_institution_flex: admissionInstitutionFlex,
  admission_bus_back: admissionBusBack,
  admission_bus_side: admissionBusSide,
  admission_standee: admissionStandee,
  admission_stall_flex_6x3: admissionStallFlex6x3,
  admission_stall_flex_8x6: admissionStallFlex8x6,
  admission_social_post: admissionSocialPost,
  admission_office_flex: admissionOfficeFlex,
  admission_achievers_flex: admissionAchieversFlex,
  admission_photo_booth: admissionPhotoBooth,
}

// ============================================================================
// Vertical Override Fields
// ============================================================================

export const VERTICAL_FIELD_OVERRIDES: Record<string, DynamicField[]> = {
  masoom: [
    {
      id: 'targetAgeGroup',
      label: 'Target Age Group',
      type: 'select',
      required: false,
      suggestable: false,
      options: ['Children (5-10)', 'Tweens (11-14)', 'Parents', 'Teachers'],
    },
    {
      id: 'safetyMessage',
      label: 'Safety Message',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 80,
      placeholder: 'Key child safety message...',
    },
    {
      id: 'parentGuidance',
      label: 'Parent Guidance',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 100,
      placeholder: 'Guidance message for parents...',
    },
  ],

  road_safety: [
    {
      id: 'safetyStatistic',
      label: 'Safety Statistic',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 60,
      placeholder: 'e.g., 1 life every 4 minutes...',
    },
    {
      id: 'safetyPledge',
      label: 'Safety Pledge',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 80,
      placeholder: 'e.g., I pledge to wear my helmet...',
    },
    {
      id: 'targetAudience',
      label: 'Target Audience',
      type: 'select',
      required: false,
      suggestable: false,
      options: ['Drivers', 'Pedestrians', 'Students', 'General Public'],
    },
  ],

  health: [
    {
      id: 'healthTopic',
      label: 'Health Topic',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 60,
      placeholder: 'e.g., Blood Donation, Diabetes Awareness',
    },
    {
      id: 'medicalPartner',
      label: 'Medical Partner',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 60,
      placeholder: 'e.g., Apollo Hospitals',
    },
    {
      id: 'healthBenefit',
      label: 'Health Benefit',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 80,
      placeholder: 'Key health benefit or outcome...',
    },
  ],

  yuva: [
    {
      id: 'skillFocus',
      label: 'Skill Focus',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 60,
      placeholder: 'e.g., Leadership, Entrepreneurship',
    },
    {
      id: 'careerBenefit',
      label: 'Career Benefit',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 80,
      placeholder: 'Career advantage or outcome...',
    },
    {
      id: 'targetAge',
      label: 'Target Age',
      type: 'select',
      required: false,
      suggestable: false,
      options: ['18-22', '23-28', '29-35'],
    },
  ],

  climate_change: [
    {
      id: 'environmentalImpact',
      label: 'Environmental Impact',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 80,
      placeholder: 'e.g., Save 100 trees this year',
    },
    {
      id: 'greenPledge',
      label: 'Green Pledge',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 60,
      placeholder: 'Sustainability commitment...',
    },
    {
      id: 'sustainabilityGoal',
      label: 'Sustainability Goal',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 80,
      placeholder: 'e.g., Carbon neutral by 2030',
    },
  ],

  innovation: [
    {
      id: 'technologyFocus',
      label: 'Technology Focus',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 60,
      placeholder: 'e.g., AI, Blockchain, IoT',
    },
    {
      id: 'innovationTheme',
      label: 'Innovation Theme',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 80,
      placeholder: 'Theme or focus area...',
    },
    {
      id: 'techPartner',
      label: 'Technology Partner',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 60,
      placeholder: 'e.g., Microsoft, Google',
    },
  ],

  thalir: [
    {
      id: 'culturalTheme',
      label: 'Cultural Theme',
      type: 'text',
      required: false,
      suggestable: true,
      maxLength: 60,
      placeholder: 'e.g., Traditional Art, Heritage',
    },
    {
      id: 'festivalName',
      label: 'Festival/Event Name',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 60,
      placeholder: 'e.g., Pongal, Diwali',
    },
  ],

  chapter_events: [
    {
      id: 'chapterName',
      label: 'Chapter Name',
      type: 'text',
      required: false,
      suggestable: false,
      maxLength: 60,
      placeholder: 'e.g., Yi Mumbai',
    },
    {
      id: 'eventCategory',
      label: 'Event Category',
      type: 'select',
      required: false,
      suggestable: false,
      options: ['General Meeting', 'Conference', 'Celebration', 'Training', 'Networking'],
    },
  ],
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Normalize formatId for lookup
 * Handles: dashes to underscores, stripping vertical suffixes
 * e.g., "square-ad-innovation-technology" -> "square_ad"
 */
function normalizeFormatId(formatId: string): string {
  // Convert dashes to underscores
  const normalized = formatId.replace(/-/g, '_')

  // Try direct match first
  if (FORMAT_FIELD_SCHEMAS[normalized]) {
    return normalized
  }

  // Strip known vertical suffixes and try again
  const verticalSuffixes = [
    '_masoom', '_road_safety', '_health', '_yuva',
    '_climate_change', '_innovation', '_thalir', '_chapter_events',
    '_innovation_technology', '_technology',
    '_rural_events', '_rural_initiatives'
  ]

  for (const suffix of verticalSuffixes) {
    if (normalized.endsWith(suffix)) {
      const stripped = normalized.slice(0, -suffix.length)
      if (FORMAT_FIELD_SCHEMAS[stripped]) {
        return stripped
      }
    }
  }

  return normalized
}

/**
 * Get fields for a specific format with optional vertical overrides
 */
export function getFormatFields(
  formatId: string,
  verticalId?: string
): DynamicField[] {
  const normalizedId = normalizeFormatId(formatId)
  const schema = FORMAT_FIELD_SCHEMAS[normalizedId]
  if (!schema) {
    return []
  }

  const baseFields = schema.fields

  // Check if this format supports vertical overrides
  if (verticalId && schema.applicableVerticals?.includes(verticalId)) {
    const verticalFields = VERTICAL_FIELD_OVERRIDES[verticalId] || []

    // Deduplicate: vertical fields OVERRIDE base fields with same ID
    const verticalFieldIds = new Set(verticalFields.map((f) => f.id))
    const uniqueBaseFields = baseFields.filter((f) => !verticalFieldIds.has(f.id))

    return [...uniqueBaseFields, ...verticalFields]
  }

  return baseFields
}

/**
 * Get the schema for a specific format
 */
export function getFormatSchema(formatId: string): FormatFieldSchema | null {
  const normalizedId = normalizeFormatId(formatId)
  return FORMAT_FIELD_SCHEMAS[normalizedId] || null
}

/**
 * Get all format IDs
 */
export function getAllFormatIds(): string[] {
  return Object.keys(FORMAT_FIELD_SCHEMAS)
}

/**
 * Get formats by category
 */
export function getFormatsByCategory(category: FormatCategory): FormatFieldSchema[] {
  return Object.values(FORMAT_FIELD_SCHEMAS).filter(
    (schema) => schema.category === category
  )
}

/**
 * Get all suggestable field IDs for a format
 */
export function getSuggestableFieldIds(formatId: string, verticalId?: string): string[] {
  const fields = getFormatFields(formatId, verticalId)
  return fields.filter((f) => f.suggestable).map((f) => f.id)
}

/**
 * Get all required field IDs for a format
 */
export function getRequiredFieldIds(formatId: string, verticalId?: string): string[] {
  const fields = getFormatFields(formatId, verticalId)
  return fields.filter((f) => f.required).map((f) => f.id)
}

/**
 * Validate form data against format schema
 */
export function validateFormatFormData(
  formatId: string,
  formData: Record<string, unknown>,
  verticalId?: string
): { valid: boolean; errors: Record<string, string> } {
  const fields = getFormatFields(formatId, verticalId)
  const errors: Record<string, string> = {}

  fields.forEach((field) => {
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
 * Get initial form data with empty values
 */
export function getInitialFormatFormData(
  formatId: string,
  verticalId?: string
): Record<string, string> {
  const fields = getFormatFields(formatId, verticalId)
  const initial: Record<string, string> = {}

  fields.forEach((field) => {
    initial[field.id] = ''
  })

  return initial
}
