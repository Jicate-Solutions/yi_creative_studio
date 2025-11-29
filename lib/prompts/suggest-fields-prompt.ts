/**
 * AI Prompt Templates for Form Field Suggestions
 * Used with Google Gemini to generate contextual event form suggestions
 */

export const FIELD_SUGGESTION_SYSTEM_PROMPT = `You are an AI assistant for Yi CreativeStudio, a platform used by Young Indians (Yi) chapters and affiliated organizations to create event posters.

Your task is to suggest contextually appropriate values for event form fields based on the event title and context provided.

CONTEXT ABOUT YI (Young Indians):
- Yi is a movement by CII (Confederation of Indian Industry)
- Focus areas: Education, Healthcare, Livelihood, Sustainability
- Common verticals: Yi-NET (networking), Yi-Aspire (mentorship), Yi-Run (fitness), Yi-Yuva (youth)
- Events are typically professional, community-focused, and impactful
- Yi chapters are located across India

GUIDELINES:
1. Date: Suggest realistic near-future dates (within next 3 months). Prefer weekends for community events, weekdays for corporate/professional events. Consider Indian national holidays if contextually relevant.
2. Time: Professional event times. Evening events: "6:00 PM onwards" or "7:00 PM - 10:00 PM". Morning events: "9:00 AM - 12:00 PM" or "10:00 AM - 1:00 PM".
3. Venue: Suggest venue TYPES with placeholder city, not specific venue names (e.g., "Hotel Conference Hall, Chennai" or "Community Center, [City]")
4. Speaker: Only suggest if event type clearly implies a speaker/guest (workshops, talks, seminars). For networking events or activities, leave empty or use "N/A".
5. Description: Professional, inspiring tone aligned with Yi values. Keep under 150 characters. Focus on the event's purpose and impact.

RESPONSE FORMAT:
You MUST respond with valid JSON only. No markdown, no explanation outside JSON.
Do not include any text before or after the JSON object.`

export interface PromptParams {
  title: string
  verticalName: string
  verticalDescription: string
  organizationType: string
  organizationName?: string
  existingFields?: Record<string, string>
}

/**
 * Build the user prompt for field suggestions
 */
export function buildFieldSuggestionPrompt(params: PromptParams): string {
  const {
    title,
    verticalName,
    verticalDescription,
    organizationType,
    organizationName,
    existingFields,
  } = params

  let prompt = `Generate suggestions for an event with the following context:

EVENT TITLE: "${title}"
VERTICAL: ${verticalName}${verticalDescription ? ` - ${verticalDescription}` : ''}
ORGANIZATION TYPE: ${formatOrgType(organizationType)}
${organizationName ? `ORGANIZATION: ${organizationName}` : ''}`

  if (existingFields && Object.keys(existingFields).length > 0) {
    const filledFields = Object.entries(existingFields)
      .filter(([, value]) => value && value.trim())
      .map(([key, value]) => `- ${key}: ${value}`)
      .join('\n')

    if (filledFields) {
      prompt += `

ALREADY FILLED FIELDS (use these for context, do NOT re-suggest these):
${filledFields}`
    }
  }

  prompt += `

Respond with JSON in this exact format:
{
  "suggestions": {
    "date": { "value": "March 15, 2025", "confidence": 0.7, "reasoning": "Weekend suitable for community event" },
    "time": { "value": "6:00 PM onwards", "confidence": 0.8, "reasoning": "Evening networking time" },
    "venue": { "value": "Hotel Conference Hall, Chennai", "confidence": 0.6, "reasoning": "Professional venue for corporate event" },
    "speaker": { "value": "", "confidence": 0.0, "reasoning": "Not a speaker-focused event" },
    "description": { "value": "Join us for an evening of professional networking and collaboration.", "confidence": 0.75, "reasoning": "Professional tone aligned with Yi values" }
  }
}

Rules:
- confidence: 0.0-1.0 (higher = more confident in the suggestion)
- If unsure about a field, set confidence < 0.5 and value to empty string ""
- Keep description under 150 characters
- Use natural, human-friendly date/time formats
- Do NOT suggest values for fields already filled by user
- For speaker field, set empty string if event type doesn't need a speaker`

  return prompt
}

/**
 * Vertical-specific context to enhance AI suggestions
 */
export const VERTICAL_CONTEXTS: Record<
  string,
  {
    eventTypes: string[]
    typicalTimes: string[]
    venueTypes: string[]
    speakerLikelihood: 'high' | 'medium' | 'low'
    themeKeywords: string[]
  }
> = {
  masoom: {
    eventTypes: ['awareness campaign', 'child safety workshop', 'education drive', 'community outreach'],
    typicalTimes: ['10:00 AM - 1:00 PM', '2:00 PM - 5:00 PM'],
    venueTypes: ['School Auditorium', 'Community Center', 'Public Park', 'Child Welfare Center'],
    speakerLikelihood: 'medium',
    themeKeywords: ['child safety', 'education', 'awareness', 'protection', 'welfare'],
  },
  'road-safety': {
    eventTypes: ['traffic awareness', 'road safety campaign', 'helmet distribution', 'safe driving workshop'],
    typicalTimes: ['8:00 AM - 11:00 AM', '9:00 AM - 12:00 PM'],
    venueTypes: ['Traffic Park', 'Public Square', 'Highway Plaza', 'City Ground'],
    speakerLikelihood: 'low',
    themeKeywords: ['traffic', 'road safety', 'awareness', 'driving', 'helmet'],
  },
  'climate-change': {
    eventTypes: ['tree plantation', 'sustainability summit', 'green initiative', 'eco awareness'],
    typicalTimes: ['7:00 AM - 10:00 AM', '6:00 AM - 9:00 AM'],
    venueTypes: ['Public Park', 'Forest Reserve', 'Eco Center', 'Green Campus'],
    speakerLikelihood: 'medium',
    themeKeywords: ['environment', 'sustainability', 'green', 'climate', 'eco-friendly'],
  },
  yuva: {
    eventTypes: ['youth summit', 'skill workshop', 'career guidance', 'leadership talk', 'hackathon'],
    typicalTimes: ['9:00 AM - 5:00 PM', '10:00 AM - 4:00 PM'],
    venueTypes: ['University Campus', 'Innovation Hub', 'Co-working Space', 'College Auditorium'],
    speakerLikelihood: 'high',
    themeKeywords: ['youth', 'leadership', 'skills', 'career', 'innovation'],
  },
  thalir: {
    eventTypes: ['cultural program', 'art workshop', 'creative session', 'talent show'],
    typicalTimes: ['10:00 AM - 1:00 PM', '4:00 PM - 7:00 PM'],
    venueTypes: ['Cultural Center', 'Art Gallery', 'School Hall', 'Community Space'],
    speakerLikelihood: 'low',
    themeKeywords: ['culture', 'art', 'creativity', 'talent', 'expression'],
  },
  health: {
    eventTypes: ['health camp', 'blood donation', 'wellness workshop', 'medical checkup', 'fitness event'],
    typicalTimes: ['8:00 AM - 12:00 PM', '9:00 AM - 1:00 PM'],
    venueTypes: ['Hospital Campus', 'Health Center', 'Community Hall', 'Medical College'],
    speakerLikelihood: 'medium',
    themeKeywords: ['health', 'wellness', 'medical', 'fitness', 'care'],
  },
  innovation: {
    eventTypes: ['startup pitch', 'tech talk', 'innovation summit', 'entrepreneurship workshop'],
    typicalTimes: ['9:00 AM - 5:00 PM', '10:00 AM - 6:00 PM'],
    venueTypes: ['Tech Park', 'Innovation Hub', 'Startup Incubator', 'Conference Center'],
    speakerLikelihood: 'high',
    themeKeywords: ['startup', 'technology', 'innovation', 'entrepreneurship', 'digital'],
  },
  events: {
    eventTypes: ['networking meet', 'business mixer', 'annual gathering', 'industry connect'],
    typicalTimes: ['6:00 PM onwards', '7:00 PM - 10:00 PM'],
    venueTypes: ['Hotel Ballroom', 'Club House', 'Convention Center', 'Rooftop Venue'],
    speakerLikelihood: 'low',
    themeKeywords: ['networking', 'business', 'professional', 'connect', 'industry'],
  },
}

/**
 * Get vertical-specific context for enhanced prompts
 */
export function getVerticalContext(slug: string) {
  const normalizedSlug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '')
  return VERTICAL_CONTEXTS[normalizedSlug] || VERTICAL_CONTEXTS['events']
}

/**
 * Format organization type for display
 */
function formatOrgType(type: string): string {
  const typeMap: Record<string, string> = {
    yi_chapter: 'Yi Chapter (Young Indians)',
    educational: 'Educational Institution',
    corporate: 'Corporate Organization',
    ngo: 'Non-Governmental Organization',
  }
  return typeMap[type] || type
}
