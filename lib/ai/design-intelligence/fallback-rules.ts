/**
 * Fallback Rules for Typography Intelligence
 * Provides rule-based recommendations when AI is unavailable
 */

import { findBestArchetype, STYLE_ARCHETYPES, type StyleArchetype } from './style-archetypes'
import { getScriptForLanguage, type Script } from './language-utils'

export interface FallbackRecommendation {
  styleArchetype: StyleArchetype
  confidence: number
  reasoning: string
  toneAttributes: {
    formality: 'high' | 'medium' | 'low'
    energy: 'calm' | 'moderate' | 'high'
    creativity: 'conservative' | 'balanced' | 'expressive'
  }
  audienceProfile: 'corporate' | 'youth' | 'academic' | 'general' | 'children'
  textHierarchy: {
    primaryEmphasis: string
    emphasisLevel: 'subtle' | 'moderate' | 'strong'
  }
  script: Script
}

/**
 * Event type to archetype mapping
 */
const EVENT_TYPE_MAPPING: Record<string, StyleArchetype> = {
  conference: 'modern-professional',
  summit: 'modern-professional',
  seminar: 'minimal-clean',
  workshop: 'minimal-clean',
  webinar: 'minimal-clean',
  training: 'minimal-clean',
  meetup: 'minimal-clean',

  gala: 'classic-elegant',
  ceremony: 'classic-elegant',
  award: 'classic-elegant',
  reception: 'classic-elegant',
  dinner: 'classic-elegant',

  festival: 'bold-energetic',
  concert: 'bold-energetic',
  party: 'bold-energetic',
  celebration: 'bold-energetic',

  exhibition: 'creative-artistic',
  showcase: 'creative-artistic',
  performance: 'creative-artistic',

  convocation: 'formal-traditional',
  graduation: 'formal-traditional',
  symposium: 'formal-traditional',

  camp: 'youth-vibrant',
  club: 'youth-vibrant'
}

/**
 * Vertical to archetype mapping
 */
const VERTICAL_MAPPING: Record<string, StyleArchetype> = {
  technology: 'modern-professional',
  business: 'modern-professional',
  corporate: 'modern-professional',

  education: 'minimal-clean',
  training: 'minimal-clean',

  arts: 'creative-artistic',
  culture: 'creative-artistic',

  sports: 'bold-energetic',
  entertainment: 'bold-energetic',

  academic: 'formal-traditional',
  research: 'formal-traditional'
}

/**
 * Determine formality level from event type and vertical
 */
function determineFormalityLevel(eventData: Record<string, any>): 'high' | 'medium' | 'low' {
  const eventType = (eventData.eventType || '').toLowerCase()
  const vertical = (eventData.vertical || '').toLowerCase()

  // High formality indicators
  const highFormalityTerms = ['gala', 'ceremony', 'formal', 'convocation', 'graduation', 'award', 'government', 'official']
  if (highFormalityTerms.some(term => eventType.includes(term) || vertical.includes(term))) {
    return 'high'
  }

  // Low formality indicators
  const lowFormalityTerms = ['party', 'festival', 'casual', 'fun', 'kids', 'youth', 'camp']
  if (lowFormalityTerms.some(term => eventType.includes(term) || vertical.includes(term))) {
    return 'low'
  }

  return 'medium'
}

/**
 * Determine energy level from event type
 */
function determineEnergyLevel(eventData: Record<string, any>): 'calm' | 'moderate' | 'high' {
  const eventType = (eventData.eventType || '').toLowerCase()
  const eventName = (eventData.eventName || '').toLowerCase()

  // High energy indicators
  const highEnergyTerms = ['festival', 'concert', 'party', 'sports', 'race', 'championship', 'blast', 'mega']
  if (highEnergyTerms.some(term => eventType.includes(term) || eventName.includes(term))) {
    return 'high'
  }

  // Calm indicators
  const calmTerms = ['meditation', 'yoga', 'wellness', 'retreat', 'lecture', 'reading']
  if (calmTerms.some(term => eventType.includes(term) || eventName.includes(term))) {
    return 'calm'
  }

  return 'moderate'
}

/**
 * Determine audience profile
 */
function determineAudienceProfile(eventData: Record<string, any>): 'corporate' | 'youth' | 'academic' | 'general' | 'children' {
  const allText = Object.values(eventData).join(' ').toLowerCase()

  if (allText.includes('kids') || allText.includes('children')) return 'children'
  if (allText.includes('youth') || allText.includes('teen') || allText.includes('junior')) return 'youth'
  if (allText.includes('corporate') || allText.includes('business') || allText.includes('executive')) return 'corporate'
  if (allText.includes('academic') || allText.includes('research') || allText.includes('scholar')) return 'academic'

  return 'general'
}

/**
 * Determine primary emphasis field
 */
function determinePrimaryEmphasis(eventData: Record<string, any>): string {
  // Priority order for emphasis
  if (eventData.guestName || eventData.speakerName) return 'guestName'
  if (eventData.eventName) return 'eventName'
  if (eventData.title) return 'title'
  if (eventData.recipientName) return 'recipientName'

  // Fallback to first non-empty field
  for (const [key, value] of Object.entries(eventData)) {
    if (value && typeof value === 'string' && value.trim().length > 0) {
      return key
    }
  }

  return 'eventName'
}

/**
 * Generate fallback recommendation using rule-based logic
 */
export function getFallbackRecommendation(
  eventData: Record<string, any>,
  languageCode: string = 'en'
): FallbackRecommendation {
  // Try keyword-based archetype matching first
  const keywordMatch = findBestArchetype(eventData)

  // Try event type mapping
  const eventType = (eventData.eventType || '').toLowerCase()
  const eventTypeArchetype = EVENT_TYPE_MAPPING[eventType]

  // Try vertical mapping
  const vertical = (eventData.vertical || '').toLowerCase()
  const verticalArchetype = VERTICAL_MAPPING[vertical]

  // Choose best archetype (priority: keyword > event type > vertical > fallback)
  let styleArchetype: StyleArchetype = 'balanced-general'
  let confidence = 0.5
  let reasoning = 'Using balanced typography suitable for general events'

  if (keywordMatch.confidence > 0.6) {
    styleArchetype = keywordMatch.archetype
    confidence = keywordMatch.confidence
    reasoning = `Selected ${STYLE_ARCHETYPES[styleArchetype].description.toLowerCase()} based on event context`
  } else if (eventTypeArchetype) {
    styleArchetype = eventTypeArchetype
    confidence = 0.7
    reasoning = `Selected ${STYLE_ARCHETYPES[styleArchetype].description.toLowerCase()} based on event type: ${eventType}`
  } else if (verticalArchetype) {
    styleArchetype = verticalArchetype
    confidence = 0.65
    reasoning = `Selected ${STYLE_ARCHETYPES[styleArchetype].description.toLowerCase()} based on industry vertical: ${vertical}`
  }

  // Determine tone attributes
  const formality = determineFormalityLevel(eventData)
  const energy = determineEnergyLevel(eventData)
  const creativity: 'conservative' | 'balanced' | 'expressive' =
    styleArchetype === 'creative-artistic' || styleArchetype === 'youth-vibrant' ? 'expressive' :
    styleArchetype === 'formal-traditional' ? 'conservative' : 'balanced'

  // Determine audience
  const audienceProfile = determineAudienceProfile(eventData)

  // Determine emphasis
  const primaryEmphasis = determinePrimaryEmphasis(eventData)
  const emphasisLevel: 'subtle' | 'moderate' | 'strong' =
    energy === 'high' ? 'strong' :
    energy === 'calm' ? 'subtle' : 'moderate'

  // Get script
  const script = getScriptForLanguage(languageCode)

  return {
    styleArchetype,
    confidence,
    reasoning,
    toneAttributes: {
      formality,
      energy,
      creativity
    },
    audienceProfile,
    textHierarchy: {
      primaryEmphasis,
      emphasisLevel
    },
    script
  }
}

/**
 * Get quick archetype recommendation without detailed analysis
 */
export function getQuickArchetype(eventType?: string, vertical?: string): StyleArchetype {
  const type = (eventType || '').toLowerCase()
  const vert = (vertical || '').toLowerCase()

  return EVENT_TYPE_MAPPING[type] || VERTICAL_MAPPING[vert] || 'balanced-general'
}
