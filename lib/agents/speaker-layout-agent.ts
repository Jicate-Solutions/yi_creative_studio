/**
 * Speaker Layout Agent
 * YiCreatives Studio
 *
 * AI-powered pre-generation analysis for speaker photo layouts.
 * Analyzes speaker details vs photos and makes intelligent layout decisions.
 *
 * Key Insight: Layout sizing should be based on TOTAL speakers (details),
 * not just speakers with photos. This prevents oversized photos when
 * only some speakers have uploaded photos.
 *
 * Architecture:
 * 1. Receives speaker configuration with details and photos
 * 2. Calls Claude Haiku for intelligent layout analysis
 * 3. Returns layout strategy, sizing, and prompt context
 * 4. Logs usage to api_usage table
 */

import Anthropic from '@anthropic-ai/sdk'
import { trackApiUsage, type ApiUsageRecord } from '@/lib/services/api-usage'
import { calculateTokenCost } from '@/lib/config/ai-pricing'
import { getSpeakerCount, getSpeakerCountWithPhotos } from '@/lib/utils/speaker-migration'
import type { SpeakerPhotoCustomization } from '@/lib/config/design-constants'

// ============================================================================
// Types
// ============================================================================

export interface SpeakerAnalysisInput {
  /** Speaker photo configuration from form */
  speakerConfig: SpeakerPhotoCustomization
  /** Format ID (e.g., 'event_poster') */
  formatId: string
  /** Canvas dimensions */
  canvasWidth: number
  canvasHeight: number
  /** Aspect ratio string (e.g., '4:5', '16:9') */
  aspectRatio: string
  /** Event type for context (e.g., 'conference', 'workshop') */
  eventType?: string
  /** Organization and user IDs for tracking */
  organizationId: string
  userId: string
  /** Creative ID if available */
  creativeId?: string
}

export interface SpeakerLayoutDecision {
  /** Layout strategy: single, side-by-side, stacked, or grid */
  layoutStrategy: 'single' | 'side-by-side' | 'stacked' | 'grid' | 'text-only'
  /** Photo size as percentage of canvas width (based on TOTAL speakers) */
  photoSizePercent: number
  /** Speaker text zone Y-percentages */
  speakerTextZone: {
    start: number
    end: number
  }
  /** Photo zones for speakers with photos */
  photoZones: Array<{
    speakerIndex: number
    xPercent: number
    yPercent: number
    sizePercent: number
  }>
  /** Text-only zones for speakers without photos */
  textOnlyZones: Array<{
    speakerIndex: number
    xPercent: number
    yPercent: number
  }>
  /** Natural language context for Gemini prompt */
  promptContext: string
  /** Styling for text-only speakers */
  textOnlySpeakerStyle: 'enhanced_text' | 'clean_layout' | 'initials_avatar' | 'decorative_frame'
  /** Metadata */
  totalSpeakers: number
  speakersWithPhotos: number
  /** AI's decision explanation */
  reasoning: string
}

export interface SpeakerLayoutResult {
  decision: SpeakerLayoutDecision
  /** Whether AI was used or fallback logic */
  source: 'ai' | 'fallback'
  /** Duration in ms */
  durationMs: number
}

// ============================================================================
// Constants
// ============================================================================

const CLAUDE_MODEL = 'claude-haiku-4-5'

const SYSTEM_PROMPT = `You are a layout analysis agent for event poster generation.
Your job is to analyze speaker configurations and determine optimal layout decisions.

KEY PRINCIPLE: Layout sizing should be based on TOTAL SPEAKERS (details provided),
not just speakers with photos. This ensures proper spacing even when only some speakers have photos.

For each analysis, consider:
1. Total number of speakers (from details)
2. Number of speakers with photos
3. Aspect ratio and canvas dimensions
4. Event type context

Return your analysis as valid JSON matching this schema:
{
  "layoutStrategy": "single" | "side-by-side" | "stacked" | "grid" | "text-only",
  "photoSizePercent": number (5-40),
  "speakerTextZone": { "start": number, "end": number },
  "photoZones": [{ "speakerIndex": number, "xPercent": number, "yPercent": number, "sizePercent": number }],
  "textOnlyZones": [{ "speakerIndex": number, "xPercent": number, "yPercent": number }],
  "textOnlySpeakerStyle": "enhanced_text" | "clean_layout" | "initials_avatar" | "decorative_frame",
  "reasoning": "Brief explanation of your decision"
}

Layout Guidelines:
- 1 speaker: "single" layout, 30-35% photo size
- 2 speakers: "side-by-side" layout, 22-28% photo size
- 3 speakers: "side-by-side" or "stacked", 16-22% photo size
- 4+ speakers: "grid" layout, 12-18% photo size
- 0 photos: "text-only" layout with enhanced text styling

Text-Only Speaker Styling:
- Professional events: "clean_layout" (just name/designation)
- Creative events: "enhanced_text" (larger typography)
- Formal events: "initials_avatar" (subtle placeholder)
- Mixed (some have photos): "clean_layout" to match photo speakers`

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyzes speaker configuration and returns layout decisions.
 * Uses Claude Haiku for intelligent analysis with fallback logic.
 *
 * @param input - Speaker configuration and context
 * @returns Layout decision with prompt context for Gemini
 */
export async function analyzeSpeakerLayout(
  input: SpeakerAnalysisInput
): Promise<SpeakerLayoutResult> {
  const startTime = Date.now()

  // Extract counts
  const totalSpeakers = getSpeakerCount(input.speakerConfig)
  const speakersWithPhotos = getSpeakerCountWithPhotos(input.speakerConfig)

  // If no speakers, return early
  if (totalSpeakers === 0) {
    return {
      decision: createEmptyDecision(),
      source: 'fallback',
      durationMs: Date.now() - startTime,
    }
  }

  // Build speaker details for AI
  const speakers = input.speakerConfig.speakers || []
  const speakerDetails = speakers.map((s, i) => ({
    index: i,
    name: s.name || `Speaker ${i + 1}`,
    designation: s.designation || '',
    hasPhoto: !!(s.photoUrl && s.photoUrl.trim()),
  }))

  // Handle legacy single speaker format
  if (speakerDetails.length === 0 && input.speakerConfig.photoUrl) {
    speakerDetails.push({
      index: 0,
      name: 'Speaker',
      designation: '',
      hasPhoto: true,
    })
  }

  try {
    // Call Claude Haiku for analysis
    const anthropic = new Anthropic()

    const userPrompt = `Analyze this speaker configuration for an event poster:

Total Speakers: ${totalSpeakers}
Speakers with Photos: ${speakersWithPhotos}
Format: ${input.formatId}
Aspect Ratio: ${input.aspectRatio}
Canvas: ${input.canvasWidth}x${input.canvasHeight}px
Event Type: ${input.eventType || 'general'}

Speaker Details:
${speakerDetails.map((s, i) => `${i + 1}. ${s.name}${s.designation ? ` (${s.designation})` : ''} - ${s.hasPhoto ? 'HAS PHOTO' : 'NO PHOTO'}`).join('\n')}

Determine the optimal layout strategy, photo sizing, and zone allocations.
Remember: Size photos based on TOTAL speakers (${totalSpeakers}), not just photos (${speakersWithPhotos}).

Return your analysis as JSON.`

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const durationMs = Date.now() - startTime

    // Parse response
    const textContent = response.content.find(c => c.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude')
    }

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = textContent.text
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    const parsed = JSON.parse(jsonStr.trim())

    // Build the decision
    const decision: SpeakerLayoutDecision = {
      layoutStrategy: parsed.layoutStrategy || calculateFallbackLayout(totalSpeakers, speakersWithPhotos),
      photoSizePercent: parsed.photoSizePercent || calculateFallbackPhotoSize(totalSpeakers, input.aspectRatio),
      speakerTextZone: parsed.speakerTextZone || { start: 55, end: 75 },
      photoZones: parsed.photoZones || [],
      textOnlyZones: parsed.textOnlyZones || [],
      textOnlySpeakerStyle: parsed.textOnlySpeakerStyle || 'clean_layout',
      totalSpeakers,
      speakersWithPhotos,
      reasoning: parsed.reasoning || 'AI analysis completed',
      promptContext: '', // Will be generated below
    }

    // Generate prompt context
    decision.promptContext = generatePromptContext(decision, speakerDetails)

    // Log usage to api_usage table
    await trackSpeakerLayoutUsage({
      organizationId: input.organizationId,
      userId: input.userId,
      creativeId: input.creativeId,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      durationMs,
      totalSpeakers,
      speakersWithPhotos,
      layoutStrategy: decision.layoutStrategy,
      reasoning: decision.reasoning,
    })

    console.log(
      `[Speaker Layout Agent] AI decision: ${decision.layoutStrategy} layout for ` +
      `${totalSpeakers} speakers (${speakersWithPhotos} with photos) | ` +
      `Photo size: ${decision.photoSizePercent}% | ${durationMs}ms`
    )

    return {
      decision,
      source: 'ai',
      durationMs,
    }
  } catch (error) {
    console.warn('[Speaker Layout Agent] AI analysis failed, using fallback:', error)

    // Fallback to rule-based logic
    const decision = calculateFallbackDecision(
      totalSpeakers,
      speakersWithPhotos,
      speakerDetails,
      input.aspectRatio,
      input.eventType
    )

    return {
      decision,
      source: 'fallback',
      durationMs: Date.now() - startTime,
    }
  }
}

// ============================================================================
// Fallback Logic (Rule-Based)
// ============================================================================

function calculateFallbackLayout(
  totalSpeakers: number,
  speakersWithPhotos: number
): SpeakerLayoutDecision['layoutStrategy'] {
  if (speakersWithPhotos === 0) return 'text-only'
  if (totalSpeakers === 1) return 'single'
  if (totalSpeakers === 2) return 'side-by-side'
  if (totalSpeakers === 3) return 'side-by-side'
  return 'grid'
}

function calculateFallbackPhotoSize(totalSpeakers: number, aspectRatio: string): number {
  // Base sizes by speaker count
  const baseSizes: Record<number, number> = {
    1: 32,
    2: 25,
    3: 18,
    4: 15,
  }
  const baseSize = baseSizes[totalSpeakers] || 12

  // Adjust for aspect ratio
  const isPortrait = aspectRatio.includes('4:5') || aspectRatio.includes('3:4') || aspectRatio.includes('9:16')
  const isLandscape = aspectRatio.includes('16:9') || aspectRatio.includes('3:2')

  if (isPortrait) return baseSize * 0.9 // Slightly smaller for portrait
  if (isLandscape) return baseSize * 1.1 // Slightly larger for landscape
  return baseSize
}

function calculateFallbackDecision(
  totalSpeakers: number,
  speakersWithPhotos: number,
  speakerDetails: Array<{ index: number; name: string; designation: string; hasPhoto: boolean }>,
  aspectRatio: string,
  _eventType?: string  // Prefix with _ to indicate intentionally unused (may be used for future enhancements)
): SpeakerLayoutDecision {
  const layoutStrategy = calculateFallbackLayout(totalSpeakers, speakersWithPhotos)
  const photoSizePercent = calculateFallbackPhotoSize(totalSpeakers, aspectRatio)

  // Determine text-only style based on event type
  let textOnlySpeakerStyle: SpeakerLayoutDecision['textOnlySpeakerStyle'] = 'clean_layout'
  if (speakersWithPhotos > 0 && speakersWithPhotos < totalSpeakers) {
    // Mixed mode - match layout with photo speakers
    textOnlySpeakerStyle = 'clean_layout'
  } else if (speakersWithPhotos === 0) {
    // All text-only - enhance text
    textOnlySpeakerStyle = 'enhanced_text'
  }

  // Calculate zones based on layout
  const photoZones: SpeakerLayoutDecision['photoZones'] = []
  const textOnlyZones: SpeakerLayoutDecision['textOnlyZones'] = []

  // Calculate X positions based on total speakers (not just those with photos)
  const spacing = 100 / (totalSpeakers + 1)

  speakerDetails.forEach((speaker, i) => {
    const xPercent = spacing * (i + 1)
    const yPercent = 65 // Default Y position

    if (speaker.hasPhoto) {
      photoZones.push({
        speakerIndex: speaker.index,
        xPercent,
        yPercent,
        sizePercent: photoSizePercent,
      })
    } else {
      textOnlyZones.push({
        speakerIndex: speaker.index,
        xPercent,
        yPercent,
      })
    }
  })

  const decision: SpeakerLayoutDecision = {
    layoutStrategy,
    photoSizePercent,
    speakerTextZone: { start: 55, end: 75 },
    photoZones,
    textOnlyZones,
    textOnlySpeakerStyle,
    totalSpeakers,
    speakersWithPhotos,
    reasoning: `Fallback logic: ${totalSpeakers} speakers, ${speakersWithPhotos} photos, ${layoutStrategy} layout`,
    promptContext: '',
  }

  decision.promptContext = generatePromptContext(decision, speakerDetails)

  return decision
}

function createEmptyDecision(): SpeakerLayoutDecision {
  return {
    layoutStrategy: 'text-only',
    photoSizePercent: 0,
    speakerTextZone: { start: 55, end: 75 },
    photoZones: [],
    textOnlyZones: [],
    textOnlySpeakerStyle: 'clean_layout',
    totalSpeakers: 0,
    speakersWithPhotos: 0,
    reasoning: 'No speakers configured',
    promptContext: '',
  }
}

// ============================================================================
// Prompt Context Generation
// ============================================================================

/**
 * Generates natural language context for Gemini prompt injection.
 */
function generatePromptContext(
  decision: SpeakerLayoutDecision,
  speakerDetails: Array<{ index: number; name: string; designation: string; hasPhoto: boolean }>
): string {
  if (decision.totalSpeakers === 0) {
    return ''
  }

  const layoutDesc = {
    'single': 'single centered speaker',
    'side-by-side': 'horizontal row',
    'stacked': 'vertical stack',
    'grid': 'grid arrangement',
    'text-only': 'text-only (no photos)',
  }[decision.layoutStrategy]

  const lines: string[] = [
    `SPEAKER LAYOUT CONTEXT:`,
    `This poster features ${decision.totalSpeakers} speaker${decision.totalSpeakers > 1 ? 's' : ''} in a ${layoutDesc} layout.`,
    '',
  ]

  // List each speaker
  speakerDetails.forEach((speaker, i) => {
    const fullIdentity = speaker.designation
      ? `${speaker.name}, ${speaker.designation}`
      : speaker.name
    const photoStatus = speaker.hasPhoto
      ? 'Has photo - will be overlaid in post-processing'
      : 'Text only - render name and designation prominently'
    lines.push(`- Speaker ${i + 1} (${fullIdentity}): ${photoStatus}`)
  })

  lines.push('')
  lines.push('LAYOUT GUIDANCE:')

  if (decision.speakersWithPhotos === 0) {
    // All text-only
    lines.push(`- Create a ${decision.totalSpeakers > 1 ? `${decision.totalSpeakers}-column` : 'centered'} text layout for speakers`)
    lines.push(`- NO photo zones needed - maximize text prominence`)
    lines.push(`- Speaker names should be larger since photos are not competing for attention`)
    if (decision.textOnlySpeakerStyle === 'enhanced_text') {
      lines.push(`- Use enhanced typography with decorative elements around speaker text`)
    }
  } else if (decision.speakersWithPhotos === decision.totalSpeakers) {
    // All have photos
    lines.push(`- Divide the speaker zone into ${decision.totalSpeakers} equal section${decision.totalSpeakers > 1 ? 's' : ''}`)
    lines.push(`- Leave clean background in all positions for balanced composition`)
    lines.push(`- Photos will be overlaid in post-processing`)
    lines.push(`- All speaker names MUST be rendered below their respective photo zones`)
  } else {
    // Mixed - some have photos, some don't
    lines.push(`- Divide the speaker zone into ${decision.totalSpeakers} equal sections (based on TOTAL speakers)`)
    lines.push(`- Leave clean background in ALL ${decision.totalSpeakers} positions for balanced composition`)
    lines.push(`- Photo${decision.speakersWithPhotos > 1 ? 's' : ''} will be overlaid on ${decision.speakersWithPhotos} position${decision.speakersWithPhotos > 1 ? 's' : ''} only`)
    lines.push(`- Text-only speakers should have slightly larger name typography to compensate for missing photo`)
    lines.push(`- CRITICAL: Size all zones for ${decision.totalSpeakers}-speaker layout, not just ${decision.speakersWithPhotos}`)
  }

  return lines.join('\n')
}

// ============================================================================
// Usage Tracking
// ============================================================================

async function trackSpeakerLayoutUsage(params: {
  organizationId: string
  userId: string
  creativeId?: string
  inputTokens: number
  outputTokens: number
  durationMs: number
  totalSpeakers: number
  speakersWithPhotos: number
  layoutStrategy: string
  reasoning: string
}): Promise<void> {
  try {
    const costUsd = calculateTokenCost(
      'claude',
      CLAUDE_MODEL,
      params.inputTokens,
      params.outputTokens,
      0
    )

    const record: ApiUsageRecord = {
      organizationId: params.organizationId,
      userId: params.userId,
      creativeId: params.creativeId,
      requestType: 'speaker_layout_analysis',
      provider: 'claude',
      model: CLAUDE_MODEL,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      estimatedCostUsd: costUsd,
      durationMs: params.durationMs,
      success: true,
      metadata: {
        totalSpeakers: params.totalSpeakers,
        speakersWithPhotos: params.speakersWithPhotos,
        layoutStrategy: params.layoutStrategy,
        reasoning: params.reasoning,
      },
    }

    await trackApiUsage(record)
  } catch (error) {
    console.warn('[Speaker Layout Agent] Failed to track usage:', error)
    // Non-blocking - don't fail the main operation
  }
}

// ============================================================================
// Exports
// ============================================================================

export {
  generatePromptContext,
  calculateFallbackPhotoSize,
  calculateFallbackLayout,
}
