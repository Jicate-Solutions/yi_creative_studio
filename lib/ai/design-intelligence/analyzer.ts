/**
 * AI Design Intelligence Analyzer
 * Uses Claude Haiku to analyze event context and recommend typography styles
 */

import Anthropic from '@anthropic-ai/sdk'
import { type StyleArchetype } from './style-archetypes'
import { getScriptForLanguage } from './language-utils'
import { getFallbackRecommendation, type FallbackRecommendation } from './fallback-rules'
import { generateTypographyFromAnalysis, type TypographyGuidance, type AnalysisResult } from './typography-mapper'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export interface DesignIntelligence {
  analysis: AnalysisResult & {
    confidence: number
    script: string
  }
  typography: TypographyGuidance
  timestamp: number
  source: 'ai' | 'fallback'
}

/**
 * Analyze event context using Claude Haiku and generate typography recommendations
 */
export async function analyzeEventTypography(
  eventData: Record<string, any>,
  languageCode: string = 'en'
): Promise<DesignIntelligence> {
  try {
    // Build analysis prompt
    const prompt = buildAnalysisPrompt(eventData, languageCode)

    // Call Claude Haiku
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 600,
      temperature: 0.3, // Lower temperature for more consistent results
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    // Parse AI response
    const analysisText = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const analysisResult = parseAnalysisResult(analysisText)

    // Validate confidence threshold
    if (analysisResult.confidence < 0.5) {
      console.warn('Low confidence AI analysis, using fallback')
      return generateFallbackIntelligence(eventData, languageCode)
    }

    // Generate typography from analysis
    const typography = generateTypographyFromAnalysis(analysisResult, languageCode)

    return {
      analysis: {
        ...analysisResult,
        script: getScriptForLanguage(languageCode)
      },
      typography,
      timestamp: Date.now(),
      source: 'ai'
    }

  } catch (error) {
    console.error('AI analysis failed:', error)
    // Fallback to rule-based recommendation
    return generateFallbackIntelligence(eventData, languageCode)
  }
}

/**
 * Build analysis prompt for Claude Haiku
 */
function buildAnalysisPrompt(
  eventData: Record<string, any>,
  languageCode: string
): string {
  // Extract key fields
  const {
    eventName,
    eventType,
    vertical,
    venue,
    guestName,
    speakerName,
    tagline,
    description,
    targetAudience,
    recipientName,
    achievement,
    title
  } = eventData

  // Build structured data representation
  const eventDetails = [
    eventName && `Event Name: ${eventName}`,
    title && `Title: ${title}`,
    eventType && `Event Type: ${eventType}`,
    vertical && `Industry/Vertical: ${vertical}`,
    venue && `Venue: ${venue}`,
    guestName && `Guest/Speaker: ${guestName}`,
    speakerName && `Speaker: ${speakerName}`,
    recipientName && `Recipient: ${recipientName}`,
    achievement && `Achievement: ${achievement}`,
    tagline && `Tagline: ${tagline}`,
    description && `Description: ${description}`,
    targetAudience && `Target Audience: ${targetAudience}`
  ].filter(Boolean).join('\n')

  return `You are a typography and design expert analyzing an event/creative to recommend the most appropriate typography style.

EVENT/CONTENT DETAILS:
${eventDetails}

LANGUAGE: ${languageCode.toUpperCase()}

Your task:
1. Analyze the tone, formality, energy level, and target audience
2. Choose the MOST FITTING style archetype from this list:
   - modern-professional: Clean sans-serif for corporate/tech events
   - classic-elegant: Sophisticated serif for formal galas/ceremonies
   - bold-energetic: High-impact display for festivals/sports
   - minimal-clean: Simple sans-serif for workshops/training
   - creative-artistic: Expressive fonts for arts/cultural events
   - formal-traditional: Traditional serif for academic/government
   - youth-vibrant: Playful rounded fonts for kids/youth events
   - balanced-general: Versatile fallback for any event

3. Provide reasoning for your choice
4. Identify which field should be the primary visual emphasis

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "styleArchetype": "one of the archetypes above",
  "confidence": 0.85,
  "reasoning": "Brief 2-3 sentence explanation of why this archetype fits",
  "toneAttributes": {
    "formality": "high",
    "energy": "moderate",
    "creativity": "balanced"
  },
  "audienceProfile": "general",
  "textHierarchy": {
    "primaryEmphasis": "eventName",
    "emphasisLevel": "moderate"
  }
}

Constraints:
- confidence must be between 0.0 and 1.0
- formality: "high" | "medium" | "low"
- energy: "calm" | "moderate" | "high"
- creativity: "conservative" | "balanced" | "expressive"
- audienceProfile: "corporate" | "youth" | "academic" | "general" | "children"
- emphasisLevel: "subtle" | "moderate" | "strong"
- primaryEmphasis should be an actual field name from the event details`
}

/**
 * Parse and validate AI analysis result
 */
function parseAnalysisResult(analysisText: string): AnalysisResult & { confidence: number } {
  try {
    // Extract JSON from response (handle potential markdown formatting)
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Validate required fields
    if (!parsed.styleArchetype || !parsed.confidence || !parsed.reasoning) {
      throw new Error('Missing required fields in analysis')
    }

    // Validate archetype
    const validArchetypes: StyleArchetype[] = [
      'modern-professional',
      'classic-elegant',
      'bold-energetic',
      'minimal-clean',
      'creative-artistic',
      'formal-traditional',
      'youth-vibrant',
      'balanced-general'
    ]

    if (!validArchetypes.includes(parsed.styleArchetype)) {
      console.warn(`Invalid archetype: ${parsed.styleArchetype}, using balanced-general`)
      parsed.styleArchetype = 'balanced-general'
      parsed.confidence = 0.5
    }

    // Ensure confidence is within bounds
    parsed.confidence = Math.max(0, Math.min(1, parsed.confidence))

    // Provide defaults for optional fields
    return {
      styleArchetype: parsed.styleArchetype,
      confidence: parsed.confidence,
      reasoning: parsed.reasoning,
      toneAttributes: parsed.toneAttributes || {
        formality: 'medium',
        energy: 'moderate',
        creativity: 'balanced'
      },
      audienceProfile: parsed.audienceProfile || 'general',
      textHierarchy: parsed.textHierarchy || {
        primaryEmphasis: 'eventName',
        emphasisLevel: 'moderate'
      }
    }

  } catch (error) {
    console.error('Failed to parse AI analysis:', error)
    throw error
  }
}

/**
 * Generate fallback intelligence using rule-based system
 */
function generateFallbackIntelligence(
  eventData: Record<string, any>,
  languageCode: string
): DesignIntelligence {
  const fallback = getFallbackRecommendation(eventData, languageCode)

  const analysisResult: AnalysisResult & { confidence: number; script: string } = {
    styleArchetype: fallback.styleArchetype,
    confidence: fallback.confidence,
    reasoning: fallback.reasoning + ' (Rule-based recommendation)',
    toneAttributes: fallback.toneAttributes,
    audienceProfile: fallback.audienceProfile,
    textHierarchy: fallback.textHierarchy,
    script: fallback.script
  }

  const typography = generateTypographyFromAnalysis(analysisResult, languageCode)

  return {
    analysis: analysisResult,
    typography,
    timestamp: Date.now(),
    source: 'fallback'
  }
}

/**
 * Quick analysis without full AI call (uses rules only)
 */
export function quickAnalyze(
  eventData: Record<string, any>,
  languageCode: string = 'en'
): DesignIntelligence {
  return generateFallbackIntelligence(eventData, languageCode)
}

/**
 * Check if event data is sufficient for analysis
 */
export function canAnalyzeEvent(
  formatId: string,
  formData: Record<string, any>
): { ready: boolean; missing: string[] } {
  // Define minimum required fields per format
  const requiredFieldsMap: Record<string, string[]> = {
    event_poster: ['eventName', 'eventType'],
    certificate: ['recipientName', 'achievement'],
    instagram_post: ['messageText'],
    youtube_thumbnail: ['videoTitle'],
    flyer: ['eventName'],
    invitation: ['eventName', 'eventType'],
    social_media: ['messageText'],
    // Add more formats as needed
  }

  const requiredFields = requiredFieldsMap[formatId] || ['eventName']
  const missing: string[] = []

  for (const field of requiredFields) {
    if (!formData[field] || (typeof formData[field] === 'string' && formData[field].trim().length === 0)) {
      missing.push(field)
    }
  }

  return {
    ready: missing.length === 0,
    missing
  }
}
