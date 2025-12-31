/**
 * AI Design Suggestions Service
 *
 * Generates AI-powered suggestions for themes, styles, visual elements,
 * and creative tips based on event context.
 *
 * Uses Claude 3.5 Haiku with optimized prompting:
 * - System/User message split (Claude best practice)
 * - Rich audience context from data files
 * - Event-specific visual elements guidance
 * - Few-shot examples for better output quality
 * - Temperature tuning for creative suggestions
 */

import Anthropic from '@anthropic-ai/sdk'
import { THEMES, POSTER_STYLES } from '@/lib/config/design-constants'
import { getAudienceContext } from '../data/audience-contexts'
import { getVisualElementsPrompt } from '../data/visual-elements-guide'

// ============================================================
// TYPES
// ============================================================

export interface DesignSuggestionsInput {
  eventType?: string
  eventName?: string
  currentTheme?: string
  currentStyle?: string
  hasSpeakerPhoto?: boolean
  guestName?: string
  guestDesignation?: string
  additionalContext?: string
  organizationName?: string
}

export interface DesignSuggestion {
  id: string
  reason: string
}

export interface DesignSuggestionsOutput {
  suggestedThemes: DesignSuggestion[]
  suggestedStyles: DesignSuggestion[]
  visualElements: string[]
  colorMood: string
  creativeTips: string[]
}

// ============================================================
// SYSTEM PROMPT (Claude Best Practice)
// ============================================================

const SYSTEM_PROMPT = `You are a world-class creative director specializing in event poster design for Indian institutions and organizations.

Your expertise:
- Deep understanding of cultural contexts and audience psychology
- Matching visual themes to event purposes and emotional goals
- Creating memorable, impactful poster designs that resonate
- Balancing aesthetics with clear communication

Your approach:
- Think step-by-step before suggesting
- Consider the target audience's expectations and emotions first
- Suggest SPECIFIC, iconic visual elements (not generic ones)
- Provide brief but insightful reasons that connect to audience impact
- Match themes and styles to the EVENT TYPE, not just the name

You understand that each event type has ICONIC visual language that audiences instantly recognize - use that knowledge to guide your suggestions.`

// ============================================================
// FEW-SHOT EXAMPLES
// ============================================================

const FEW_SHOT_EXAMPLES = `
### Example 1: Blood Donation Camp
Event: blood_donation, "Annual Blood Donation Drive", No speaker photo
{
  "suggestedThemes": [
    {"id": "bold", "reason": "Creates urgency that motivates donors to act - life-saving is time-sensitive"},
    {"id": "modern", "reason": "Appeals to young donors aged 18-35 who form the majority donor base"},
    {"id": "warm", "reason": "Conveys the caring, compassionate nature of voluntary donation"}
  ],
  "suggestedStyles": [
    {"id": "flat", "reason": "Clean, medical-appropriate aesthetic that feels trustworthy"},
    {"id": "high-contrast", "reason": "Maximum visibility from distance - important for camp awareness"}
  ],
  "visualElements": [
    "blood donation bag with crimson liquid and clear tubing",
    "diverse group of smiling donors seated comfortably",
    "heart shape merging with blood drop symbol",
    "caring hands reaching out in giving gesture",
    "Red Cross or medical plus symbol"
  ],
  "colorMood": "Deep crimson red as primary for blood/urgency, white for medical cleanliness and trust, touches of warm pink for compassion. Avoid dark or somber colors - keep hopeful and life-affirming.",
  "creativeTips": [
    "Show positive imagery - smiling donors, not needles or medical procedures",
    "Feature date/time prominently - blood drives are time-sensitive, urgency drives action"
  ]
}

### Example 2: Guest Lecture by Industry Expert
Event: guest_lecture, "Leadership in Digital Age", Has speaker photo, Speaker: Dr. Rajan Sharma (CEO, TechCorp)
{
  "suggestedThemes": [
    {"id": "corporate", "reason": "Matches professional stature of CEO speaker and business topic"},
    {"id": "elegant", "reason": "Conveys the prestige of hosting a distinguished industry leader"},
    {"id": "modern", "reason": "Digital Age topic demands contemporary visual treatment"}
  ],
  "suggestedStyles": [
    {"id": "gradient", "reason": "Adds sophistication without distracting from speaker's prominence"},
    {"id": "minimalist", "reason": "Lets the speaker photo and credentials take center stage"}
  ],
  "visualElements": [
    "speaker photo prominently displayed with professional framing",
    "corporate designation badge with company logo",
    "digital network or connection nodes background",
    "podium with microphone suggesting live lecture",
    "university or institution seal for credibility"
  ],
  "colorMood": "Navy blue or deep teal for trust and professionalism, silver or gold accents for prestige, white space for elegance. The speaker photo should be the visual anchor.",
  "creativeTips": [
    "Make speaker credentials (designation, company) highly visible - attendees come for the expert",
    "Use asymmetric layout with speaker on one side to create visual interest"
  ]
}

### Example 3: Tech Fest with Multiple Events
Event: tech_fest, "TechVerse 2024", No speaker photo
{
  "suggestedThemes": [
    {"id": "futuristic", "reason": "Tech fests celebrate innovation - futuristic theme sets the right expectation"},
    {"id": "vibrant", "reason": "Multiple events need energetic, exciting visual treatment"},
    {"id": "bold", "reason": "Competes for attention on campus - needs to stand out"}
  ],
  "suggestedStyles": [
    {"id": "glitch", "reason": "Digital aesthetic that resonates with tech-savvy student audience"},
    {"id": "neon", "reason": "Eye-catching, modern feel that suggests cutting-edge technology"}
  ],
  "visualElements": [
    "robot or mechanical arm in action",
    "circuit board patterns as design elements",
    "VR headset user silhouette",
    "drone or flying tech in motion",
    "coding brackets or terminal aesthetic"
  ],
  "colorMood": "Electric blue and neon cyan for technology, purple accents for innovation, black background for dramatic contrast. Use gradient glows to suggest digital screens.",
  "creativeTips": [
    "Include event categories (Hackathon, Robotics, Gaming) as visual sections",
    "Use tech-inspired typography - monospace or geometric sans-serif fonts"
  ]
}`

// ============================================================
// USER PROMPT TEMPLATE
// ============================================================

const USER_PROMPT_TEMPLATE = `## Event Analysis Task

### Event Context
- **Type:** {eventType}
- **Name:** {eventName}
- **Has Speaker Photo:** {hasSpeakerPhoto}
- **Speaker/Guest:** {guestInfo}
- **Currently Selected Theme:** {currentTheme}
- **Currently Selected Style:** {currentStyle}
- **Additional Context:** {additionalContext}

### Target Audience Understanding
{audienceContext}

### Visual Elements That BELONG With This Event Type
{visualElementsGuide}

---

## Your Task

Based on the event context and audience understanding above, suggest the BEST design choices.

### Available Themes (ONLY pick IDs from this list):
{availableThemes}

### Available Styles (ONLY pick IDs from this list):
{availableStyles}

---

## Few-Shot Examples (Follow this format and quality level)
${FEW_SHOT_EXAMPLES}

---

## Output Requirements

Respond with ONLY valid JSON. No markdown code blocks, no explanation text - just the JSON object:

{
  "suggestedThemes": [
    {"id": "theme_id_from_list", "reason": "1 sentence connecting to audience emotional response"},
    {"id": "theme_id_from_list", "reason": "1 sentence explaining fit"},
    {"id": "theme_id_from_list", "reason": "1 sentence on visual appropriateness"}
  ],
  "suggestedStyles": [
    {"id": "style_id_from_list", "reason": "1 sentence on why this treatment works for audience"},
    {"id": "style_id_from_list", "reason": "1 sentence on visual impact"}
  ],
  "visualElements": [
    "SPECIFIC element with descriptive detail (e.g., 'graduation cap tossed in the air' not just 'celebration')",
    "another SPECIFIC iconic element for this event type",
    "visual element that audiences EXPECT to see",
    "culturally appropriate imagery for Indian context",
    "fifth specific element with detail"
  ],
  "colorMood": "2-3 sentences on color psychology for THIS specific event - what emotions, what primary/secondary/accent usage, what to avoid",
  "creativeTips": [
    "Specific actionable design insight for this event type",
    "Another concrete tip that improves the poster's effectiveness"
  ]
}`

// ============================================================
// SERVICE FUNCTION
// ============================================================

/**
 * Generate AI design suggestions based on event context
 */
export async function generateDesignSuggestions(
  input: DesignSuggestionsInput
): Promise<DesignSuggestionsOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured')
  }

  const client = new Anthropic({ apiKey })

  // Build available themes list with IDs and descriptions
  const availableThemes = THEMES.map(
    (t) => `- ${t.value}: ${t.label} - ${t.description} (mood: ${t.mood})`
  ).join('\n')

  // Build available styles list with IDs and descriptions
  const availableStyles = POSTER_STYLES.map(
    (s) => `- ${s.value}: ${s.label} - ${s.description}`
  ).join('\n')

  // Build guest info
  const guestInfo = input.guestName
    ? input.guestDesignation
      ? `${input.guestName} (${input.guestDesignation})`
      : input.guestName
    : 'None specified'

  // Get rich audience context from data file
  const audienceCtx = getAudienceContext(
    input.eventType || '',
    input.organizationName || 'the organization'
  )
  const audienceContext = `**Primary Audience:** ${audienceCtx.primaryAudience}
**Their Occasion:** ${audienceCtx.occasion}
**Desired Emotional Response:** ${audienceCtx.emotionalResponse}`

  // Get visual elements guidance from data file
  const visualElementsGuide = getVisualElementsPrompt(input.eventType || '')

  // Build the user prompt
  const userPrompt = USER_PROMPT_TEMPLATE
    .replace('{eventType}', input.eventType || 'general event')
    .replace('{eventName}', input.eventName || 'Event')
    .replace('{currentTheme}', input.currentTheme || 'none selected')
    .replace('{currentStyle}', input.currentStyle || 'none selected')
    .replace('{hasSpeakerPhoto}', input.hasSpeakerPhoto ? 'Yes - speaker photo will be featured' : 'No')
    .replace('{guestInfo}', guestInfo)
    .replace('{additionalContext}', input.additionalContext || 'none')
    .replace('{audienceContext}', audienceContext)
    .replace('{visualElementsGuide}', visualElementsGuide)
    .replace('{availableThemes}', availableThemes)
    .replace('{availableStyles}', availableStyles)

  console.log('[Design Suggestions] Calling Claude Haiku with optimized prompt...')
  console.log('[Design Suggestions] Event:', input.eventType, '-', input.eventName)
  const startTime = Date.now()

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1500,  // Increased for detailed responses
      temperature: 0.7,  // Slight creativity boost for better suggestions
      system: SYSTEM_PROMPT,  // Claude best practice: separate system message
      messages: [{ role: 'user', content: userPrompt }],
    })

    const duration = Date.now() - startTime
    console.log(`[Design Suggestions] Response received in ${duration}ms`)

    // Extract text from response
    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Parse JSON from response (handle potential markdown wrapping)
    let jsonText = textBlock.text.trim()

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    }

    const jsonMatch = jsonText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('[Design Suggestions] Failed to parse JSON:', textBlock.text)
      throw new Error('Failed to parse suggestions from AI response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as DesignSuggestionsOutput

    // Validate the parsed response
    if (
      !Array.isArray(parsed.suggestedThemes) ||
      !Array.isArray(parsed.suggestedStyles) ||
      !Array.isArray(parsed.visualElements)
    ) {
      throw new Error('Invalid response structure from AI')
    }

    // Filter themes and styles to only include valid IDs
    const validThemeIds = new Set(THEMES.map((t) => t.value))
    const validStyleIds = new Set(POSTER_STYLES.map((s) => s.value))

    parsed.suggestedThemes = parsed.suggestedThemes.filter((t) =>
      validThemeIds.has(t.id)
    )
    parsed.suggestedStyles = parsed.suggestedStyles.filter((s) =>
      validStyleIds.has(s.id)
    )

    console.log('[Design Suggestions] Parsed suggestions:', {
      themes: parsed.suggestedThemes.map(t => t.id),
      styles: parsed.suggestedStyles.map(s => s.id),
      elements: parsed.visualElements.length,
      tips: parsed.creativeTips?.length || 0,
    })

    return parsed
  } catch (error) {
    console.error('[Design Suggestions] Error:', error)
    throw error
  }
}

/**
 * Default/fallback suggestions when AI is unavailable
 */
export function getDefaultSuggestions(eventType?: string): DesignSuggestionsOutput {
  // Provide reasonable defaults based on common patterns
  const defaultThemes: DesignSuggestion[] = [
    { id: 'modern', reason: 'Clean and contemporary look suitable for most events' },
    { id: 'corporate', reason: 'Professional appearance for formal events' },
    { id: 'minimalist', reason: 'Simple design that emphasizes key information' },
  ]

  const defaultStyles: DesignSuggestion[] = [
    { id: 'gradient', reason: 'Adds depth and visual interest' },
    { id: 'flat', reason: 'Clean and modern aesthetic' },
  ]

  return {
    suggestedThemes: defaultThemes,
    suggestedStyles: defaultStyles,
    visualElements: [
      'Bold headline text',
      'Date and time prominently displayed',
      'Venue information clearly visible',
      'Decorative elements matching the theme',
      'Call to action',
    ],
    colorMood: 'Use contrasting colors for readability with accent colors for emphasis',
    creativeTips: [
      'Ensure all text is highly legible with good contrast',
      'Create a clear visual hierarchy from headline to details',
    ],
  }
}
