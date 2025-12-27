/**
 * Typography Suggestions Types
 * AI-powered typography recommendations for Yi CreativeStudio
 */

/**
 * Font suggestion with reasoning
 */
export interface FontSuggestion {
  /** Font ID (e.g., 'inter', 'playfair-display') */
  value: string
  /** Display name (e.g., 'Inter', 'Playfair Display') */
  label: string
  /** Font category */
  category: 'sans' | 'serif' | 'display' | 'handwriting'
  /** AI reasoning for why this font was recommended (1-2 sentences) */
  reason: string
}

/**
 * Complete typography suggestion from AI
 */
export interface TypographySuggestion {
  /** Recommended heading font */
  headingFont: FontSuggestion
  /** Recommended body font */
  bodyFont: FontSuggestion
  /** Font scale multiplier (0.8-1.5) */
  scale: number
  /** Typography system category (e.g., 'Geometric-Sans', 'Serif-Classical') */
  typographySystem: string
  /** AI confidence score (0.0-1.0) */
  confidence: number
  /** Optional pro tips for the user */
  tips?: string[]
}

/**
 * Context data for generating typography suggestions
 */
export interface TypographyContext {
  /** Event type/title (e.g., 'Blood Donation Camp', 'Tech Conference') */
  eventType: string
  /** Yi vertical slug (healthcare, education, livelihood, sustainability) */
  verticalSlug: string
  /** Creative format ID (event_poster, certificate, instagram_story, etc.) */
  formatId: string
  /** Target audience description (optional) */
  audience?: string
  /** Brand colors for mood matching (optional) */
  brandColors?: string[]
  /** Whether the creative has a speaker photo (influences layout) */
  hasSpeakerPhoto?: boolean
  /** Additional form data for context (optional) */
  formData?: Record<string, any>
}

/**
 * Typography suggestion API response
 */
export interface TypographySuggestionResponse {
  success: boolean
  data?: TypographySuggestion
  error?: string
  cached?: boolean
}

/**
 * Typography suggestion request payload
 */
export interface TypographySuggestionRequest {
  context: TypographyContext
  targetLevel?: 'AA' | 'AAA' // Optional WCAG level for accessibility
}
