/**
 * Dynamic Field Generation Prompt
 * System and user prompts for AI-powered form field generation
 *
 * Uses Gemini to analyze creative format and context,
 * then generates the most relevant form fields
 */

import { CreativeFormatId, CREATIVE_FORMATS, getFormatById } from '@/lib/config/creative-formats'

// ============================================================================
// Types
// ============================================================================

export type DynamicFieldType = 'text' | 'textarea' | 'date' | 'time' | 'select'

export interface DynamicSchemaField {
  id: string
  label: string
  type: DynamicFieldType
  required: boolean
  placeholder: string
  maxLength?: number
  rows?: number
  options?: string[]
  suggestable: boolean
}

export interface GeneratedSchema {
  fields: DynamicSchemaField[]
  schemaType: string
  confidence: number
}

export interface GenerateFieldsInput {
  formatId: CreativeFormatId | string
  verticalSlug: string
  verticalName: string
  verticalDescription?: string
  organizationType?: string
}

// ============================================================================
// Vertical Context Data
// ============================================================================

export const VERTICAL_CONTEXTS: Record<string, {
  name: string
  description: string
  keywords: string[]
  eventTypes: string[]
  defaultFields?: string[]
}> = {
  'masoom': {
    name: 'Masoom (Child Safety)',
    description: 'Child protection, safety awareness, and education initiatives',
    keywords: ['child safety', 'protection', 'education', 'awareness', 'parents', 'schools'],
    eventTypes: ['awareness workshop', 'safety training', 'parent session', 'school program'],
    defaultFields: ['targetAudience', 'ageGroup'],
  },
  'road-safety': {
    name: 'Road Safety',
    description: 'Traffic awareness, safe driving, and road accident prevention',
    keywords: ['traffic', 'driving', 'helmet', 'seatbelt', 'pedestrian', 'accident prevention'],
    eventTypes: ['awareness drive', 'safety pledge', 'helmet distribution', 'traffic workshop'],
    defaultFields: ['statistics', 'safetyPledge'],
  },
  'climate-change': {
    name: 'Climate Action',
    description: 'Environmental sustainability, green initiatives, and climate awareness',
    keywords: ['environment', 'sustainability', 'green', 'carbon', 'plantation', 'recycling'],
    eventTypes: ['tree plantation', 'clean drive', 'sustainability workshop', 'eco campaign'],
    defaultFields: ['environmentalImpact', 'greenPledge'],
  },
  'yuva': {
    name: 'Yuva (Youth)',
    description: 'Youth empowerment, skill development, and career guidance',
    keywords: ['youth', 'career', 'skills', 'entrepreneurship', 'education', 'employment'],
    eventTypes: ['career fair', 'skill workshop', 'mentorship session', 'startup pitch'],
    defaultFields: ['skillFocus', 'targetAge'],
  },
  'thalir': {
    name: 'Thalir (Culture)',
    description: 'Cultural preservation, arts, heritage, and traditional values',
    keywords: ['culture', 'heritage', 'arts', 'tradition', 'festival', 'music', 'dance'],
    eventTypes: ['cultural fest', 'art exhibition', 'heritage walk', 'traditional workshop'],
    defaultFields: ['artForm', 'culturalSignificance'],
  },
  'health': {
    name: 'Health & Wellness',
    description: 'Health awareness, medical camps, and wellness initiatives',
    keywords: ['health', 'medical', 'wellness', 'fitness', 'mental health', 'nutrition'],
    eventTypes: ['health camp', 'blood donation', 'wellness workshop', 'fitness challenge'],
    defaultFields: ['healthFocus', 'medicalPartner'],
  },
  'innovation': {
    name: 'Innovation & Technology',
    description: 'Technology adoption, digital literacy, and innovation showcases',
    keywords: ['technology', 'digital', 'innovation', 'startup', 'AI', 'coding'],
    eventTypes: ['tech workshop', 'hackathon', 'innovation summit', 'digital literacy camp'],
    defaultFields: ['technologyFocus', 'techPartner'],
  },
  'events': {
    name: 'General Events',
    description: 'General organizational events, meetings, and celebrations',
    keywords: ['event', 'meeting', 'celebration', 'conference', 'seminar', 'workshop'],
    eventTypes: ['conference', 'seminar', 'workshop', 'meeting', 'celebration'],
  },
}

// ============================================================================
// Format Category Context
// ============================================================================

const FORMAT_CATEGORY_CONTEXT: Record<string, {
  description: string
  fieldFocus: string[]
  avoidFields: string[]
}> = {
  'social-media': {
    description: 'Social media content for platforms like Instagram, Facebook, LinkedIn, Twitter',
    fieldFocus: ['headline', 'caption', 'callToAction', 'hashtags', 'targetAudience'],
    avoidFields: ['venue', 'registrationInfo', 'certificateNumber'],
  },
  'video': {
    description: 'Video thumbnails and covers for YouTube, TikTok, etc.',
    fieldFocus: ['title', 'subtitle', 'viewerHook', 'callToAction'],
    avoidFields: ['venue', 'time', 'registrationInfo'],
  },
  'print': {
    description: 'Print materials like posters, flyers, certificates, invitations',
    fieldFocus: ['title', 'description', 'date', 'time', 'venue', 'speaker'],
    avoidFields: ['hashtags', 'viewerHook'],
  },
  'presentations': {
    description: 'Presentation slides and covers',
    fieldFocus: ['title', 'subtitle', 'presenterName', 'topic'],
    avoidFields: ['hashtags', 'registrationInfo'],
  },
  'marketing': {
    description: 'Marketing materials like banners, ads, billboards',
    fieldFocus: ['headline', 'message', 'callToAction', 'offerDetails'],
    avoidFields: ['venue', 'speaker', 'certificateNumber'],
  },
  'documents': {
    description: 'Document covers, letterheads, resumes',
    fieldFocus: ['title', 'subtitle', 'authorName', 'date'],
    avoidFields: ['hashtags', 'callToAction', 'venue'],
  },
}

// ============================================================================
// System Prompt (Cached for cost savings)
// ============================================================================

export const FIELD_GENERATION_SYSTEM_PROMPT = `You are an expert creative design assistant specializing in form field generation. Your task is to analyze a creative format and context, then generate the most relevant form fields for that specific creative.

## Your Role
- Analyze the creative format (poster, social media, certificate, etc.)
- Consider the vertical/initiative context (road safety, youth, health, etc.)
- Generate 4-8 highly relevant form fields that capture essential information
- Prioritize fields that will make the creative more impactful

## Field Types Available
- text: Single line input (use for titles, names, short text - max 150 chars)
- textarea: Multi-line input (use for descriptions, messages - 2-4 rows)
- date: Date picker (use only for event dates, publication dates)
- time: Time input (use only for event times)
- select: Dropdown with options (use when there are predefined choices)

## Critical Guidelines

### Field Count & Priority
1. Generate exactly 4-8 fields (not more, not less)
2. First field MUST be a title/headline (text, required)
3. Include date/time ONLY for event-type creatives (posters, invitations)
4. Avoid date/time for social media, marketing materials, video covers

### Field ID Conventions
- Use camelCase (e.g., eventTitle, speakerName, callToAction)
- Be descriptive but concise
- Don't use generic IDs like field1, field2

### Field Type Rules
- Use "text" for short single-line inputs (titles, names, etc.)
- Use "textarea" for long multi-line content (descriptions, messages)
- Use "date" for date fields (eventDate, publishDate, etc.)
- Use "time" for time fields (eventTime, startTime, etc.) - NEVER use "text" for time
- Use "select" for dropdown choices with predefined options

### Required vs Optional
- Title/headline: Always required
- Date: Required for events, optional otherwise
- Description/message: Usually required
- Contact info, hashtags: Usually optional

### Suggestable Fields
Set suggestable=true for fields where AI can generate good content:
- Titles, headlines, descriptions, captions
- Call to actions, hashtags
- NOT for: dates, times, names, contact info, specific data

### Format-Specific Rules
- Social Media: Focus on headline, caption, CTA, hashtags (NO venue, NO registration)
- Certificates: Focus on recipient, achievement, authority, date (NO hashtags)
- Event Posters: Include date, time, venue, speaker (NO hashtags)
- Marketing: Focus on headline, message, offer, CTA (NO venue details)
- Video Covers: Focus on title, hook, CTA (NO event details)

## Output Format
Return ONLY valid JSON with no additional text. Use this exact structure:

{
  "fields": [
    {
      "id": "fieldId",
      "label": "Human Readable Label",
      "type": "text",
      "required": true,
      "placeholder": "Helpful placeholder text...",
      "maxLength": 100,
      "suggestable": true
    }
  ],
  "schemaType": "descriptive-schema-name",
  "confidence": 0.85
}

## Examples

### Instagram Post for Road Safety
{
  "fields": [
    {"id": "headline", "label": "Post Headline", "type": "text", "required": true, "placeholder": "Create an attention-grabbing headline...", "maxLength": 80, "suggestable": true},
    {"id": "caption", "label": "Post Caption", "type": "textarea", "required": true, "placeholder": "Write an engaging caption...", "rows": 3, "suggestable": true},
    {"id": "keyMessage", "label": "Key Safety Message", "type": "text", "required": true, "placeholder": "e.g., Always wear your helmet", "maxLength": 100, "suggestable": true},
    {"id": "callToAction", "label": "Call to Action", "type": "text", "required": false, "placeholder": "e.g., Take the safety pledge today", "maxLength": 50, "suggestable": true},
    {"id": "hashtags", "label": "Hashtags", "type": "text", "required": false, "placeholder": "e.g., #RoadSafety #WearHelmet #SafetyFirst", "maxLength": 150, "suggestable": true}
  ],
  "schemaType": "social-media-road-safety",
  "confidence": 0.9
}

### Event Poster for Health Camp
{
  "fields": [
    {"id": "eventTitle", "label": "Event Title", "type": "text", "required": true, "placeholder": "e.g., Free Health Check-up Camp", "maxLength": 80, "suggestable": true},
    {"id": "eventDescription", "label": "Event Description", "type": "textarea", "required": false, "placeholder": "Describe the health services offered...", "rows": 3, "suggestable": true},
    {"id": "eventDate", "label": "Event Date", "type": "date", "required": true, "placeholder": "", "suggestable": false},
    {"id": "eventTime", "label": "Event Time", "type": "time", "required": false, "suggestable": false},
    {"id": "venue", "label": "Venue", "type": "text", "required": true, "placeholder": "e.g., Community Hall, Main Street", "maxLength": 100, "suggestable": false},
    {"id": "healthServices", "label": "Health Services", "type": "textarea", "required": false, "placeholder": "e.g., Blood pressure, Diabetes screening, Eye check-up", "rows": 2, "suggestable": true},
    {"id": "registrationInfo", "label": "Registration / Contact", "type": "text", "required": false, "placeholder": "e.g., Call 1800-XXX-XXXX or visit yi.org", "maxLength": 100, "suggestable": false}
  ],
  "schemaType": "event-poster-health",
  "confidence": 0.92
}

### Certificate for Youth Achievement
{
  "fields": [
    {"id": "certificateTitle", "label": "Certificate Title", "type": "text", "required": true, "placeholder": "e.g., Certificate of Excellence", "maxLength": 80, "suggestable": true},
    {"id": "recipientName", "label": "Recipient Name", "type": "text", "required": true, "placeholder": "Full name of the recipient", "maxLength": 100, "suggestable": false},
    {"id": "achievementDescription", "label": "Achievement / Recognition For", "type": "textarea", "required": true, "placeholder": "Describe the achievement being recognized...", "rows": 3, "suggestable": true},
    {"id": "dateIssued", "label": "Date Issued", "type": "date", "required": true, "placeholder": "", "suggestable": false},
    {"id": "issuingAuthority", "label": "Issuing Authority", "type": "text", "required": true, "placeholder": "e.g., Yi Organization, Erode Chapter", "maxLength": 100, "suggestable": false},
    {"id": "signatoryName", "label": "Signatory Name & Title", "type": "text", "required": false, "placeholder": "e.g., Mr. John Doe, Chapter Chair", "maxLength": 100, "suggestable": false}
  ],
  "schemaType": "certificate-youth",
  "confidence": 0.88
}

Remember: Generate fields that will result in IMPACTFUL creatives. The fields should capture the ESSENTIAL information needed for that specific format and context.`

// ============================================================================
// User Prompt Builder
// ============================================================================

export function buildFieldGenerationPrompt(input: GenerateFieldsInput): string {
  const format = getFormatById(input.formatId as CreativeFormatId)
  const verticalContext = VERTICAL_CONTEXTS[input.verticalSlug] || VERTICAL_CONTEXTS['events']
  const categoryContext = FORMAT_CATEGORY_CONTEXT[format?.category || 'print']

  return `Generate form fields for the following creative:

## Creative Format
- Format ID: ${input.formatId}
- Format Name: ${format?.label || input.formatId}
- Category: ${format?.category || 'Unknown'}
- Dimensions: ${format?.width || 1080}x${format?.height || 1080}
- Use Cases: ${format?.useCases?.join(', ') || 'General creative'}

## Category Context
${categoryContext?.description || 'General creative material'}
- Recommended field focus: ${categoryContext?.fieldFocus?.join(', ') || 'title, description'}
- Avoid these fields: ${categoryContext?.avoidFields?.join(', ') || 'none'}

## Vertical / Initiative
- Vertical: ${input.verticalSlug}
- Name: ${verticalContext.name}
- Description: ${verticalContext.description}
- Common event types: ${verticalContext.eventTypes.join(', ')}
- Keywords: ${verticalContext.keywords.join(', ')}

## Organization Context
${input.organizationType ? `- Organization Type: ${input.organizationType}` : ''}

## Task
Generate 4-8 highly relevant form fields for this specific combination of format and vertical. The fields should:
1. Capture essential information for creating an impactful ${format?.label || 'creative'}
2. Be contextually relevant to the ${verticalContext.name} initiative
3. Follow the guidelines from the system prompt

Return ONLY the JSON response with no additional text.`
}

// ============================================================================
// Validation
// ============================================================================

export function validateGeneratedSchema(data: unknown): GeneratedSchema | null {
  if (!data || typeof data !== 'object') return null

  const schema = data as Record<string, unknown>

  // Check required fields
  if (!Array.isArray(schema.fields) || schema.fields.length === 0) {
    return null
  }

  // Validate each field
  const validFields: DynamicSchemaField[] = []
  for (const field of schema.fields) {
    if (!field || typeof field !== 'object') continue

    const f = field as Record<string, unknown>

    // Required field properties
    if (
      typeof f.id !== 'string' ||
      typeof f.label !== 'string' ||
      typeof f.type !== 'string' ||
      typeof f.required !== 'boolean'
    ) {
      continue
    }

    // Validate type
    const validTypes: DynamicFieldType[] = ['text', 'textarea', 'date', 'time', 'select']
    if (!validTypes.includes(f.type as DynamicFieldType)) {
      continue
    }

    validFields.push({
      id: f.id,
      label: f.label,
      type: f.type as DynamicFieldType,
      required: f.required,
      placeholder: typeof f.placeholder === 'string' ? f.placeholder : '',
      maxLength: typeof f.maxLength === 'number' ? f.maxLength : undefined,
      rows: typeof f.rows === 'number' ? f.rows : undefined,
      options: Array.isArray(f.options) ? f.options.filter((o) => typeof o === 'string') : undefined,
      suggestable: typeof f.suggestable === 'boolean' ? f.suggestable : false,
    })
  }

  if (validFields.length < 3) {
    return null // Not enough valid fields
  }

  return {
    fields: validFields,
    schemaType: typeof schema.schemaType === 'string' ? schema.schemaType : 'generated',
    confidence: typeof schema.confidence === 'number' ? schema.confidence : 0.5,
  }
}

// ============================================================================
// Default Schema Fallback
// ============================================================================

export function getDefaultSchemaForFormat(formatId: string): GeneratedSchema {
  const format = getFormatById(formatId as CreativeFormatId)
  const category = format?.category || 'print'

  // Default fields based on category
  const categoryDefaults: Record<string, DynamicSchemaField[]> = {
    'social-media': [
      { id: 'headline', label: 'Post Headline', type: 'text', required: true, placeholder: 'Enter an engaging headline...', maxLength: 80, suggestable: true },
      { id: 'caption', label: 'Caption', type: 'textarea', required: true, placeholder: 'Write your post caption...', rows: 3, suggestable: true },
      { id: 'callToAction', label: 'Call to Action', type: 'text', required: false, placeholder: 'e.g., Learn More, Sign Up', maxLength: 50, suggestable: true },
      { id: 'hashtags', label: 'Hashtags', type: 'text', required: false, placeholder: '#YourHashtags', maxLength: 150, suggestable: true },
    ],
    'video': [
      { id: 'title', label: 'Video Title', type: 'text', required: true, placeholder: 'Enter video title...', maxLength: 100, suggestable: true },
      { id: 'subtitle', label: 'Subtitle', type: 'text', required: false, placeholder: 'Add a subtitle...', maxLength: 80, suggestable: true },
      { id: 'hook', label: 'Viewer Hook', type: 'textarea', required: false, placeholder: 'What will grab viewer attention?', rows: 2, suggestable: true },
    ],
    'print': [
      { id: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Enter title...', maxLength: 100, suggestable: true },
      { id: 'description', label: 'Description', type: 'textarea', required: false, placeholder: 'Add a description...', rows: 3, suggestable: true },
      { id: 'date', label: 'Date', type: 'date', required: false, placeholder: '', suggestable: false },
      { id: 'venue', label: 'Venue', type: 'text', required: false, placeholder: 'Enter venue...', maxLength: 100, suggestable: false },
    ],
    'presentations': [
      { id: 'title', label: 'Presentation Title', type: 'text', required: true, placeholder: 'Enter presentation title...', maxLength: 100, suggestable: true },
      { id: 'subtitle', label: 'Subtitle', type: 'text', required: false, placeholder: 'Add a subtitle...', maxLength: 80, suggestable: true },
      { id: 'presenterName', label: 'Presenter', type: 'text', required: false, placeholder: 'Presenter name...', maxLength: 80, suggestable: false },
    ],
    'marketing': [
      { id: 'headline', label: 'Headline', type: 'text', required: true, placeholder: 'Enter headline...', maxLength: 80, suggestable: true },
      { id: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Your marketing message...', rows: 3, suggestable: true },
      { id: 'callToAction', label: 'Call to Action', type: 'text', required: true, placeholder: 'e.g., Act Now, Join Us', maxLength: 50, suggestable: true },
      { id: 'offerDetails', label: 'Offer Details', type: 'text', required: false, placeholder: 'Any special offer?', maxLength: 100, suggestable: true },
    ],
    'documents': [
      { id: 'title', label: 'Document Title', type: 'text', required: true, placeholder: 'Enter document title...', maxLength: 100, suggestable: true },
      { id: 'subtitle', label: 'Subtitle', type: 'text', required: false, placeholder: 'Add a subtitle...', maxLength: 80, suggestable: true },
      { id: 'authorName', label: 'Author', type: 'text', required: false, placeholder: 'Author name...', maxLength: 80, suggestable: false },
      { id: 'date', label: 'Date', type: 'date', required: false, placeholder: '', suggestable: false },
    ],
  }

  return {
    fields: categoryDefaults[category] || categoryDefaults['print'],
    schemaType: `default-${category}`,
    confidence: 0.5,
  }
}
