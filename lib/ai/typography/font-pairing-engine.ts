/**
 * AI-Powered Font Pairing Engine
 *
 * Uses Claude Haiku 4.5 to generate optimal font pairings based on:
 * 1. Fontjoy neural net principles (harmony + contrast)
 * 2. Monotype harmony principles (x-height, stroke structure)
 * 3. Event context and mood alignment
 * 4. Font metadata (formality scores, mood tags, pairing compatibility)
 *
 * @see https://fontjoy.com/ - Neural net font pairing
 * @see https://www.monotype.com/resources/articles/a-guide-to-font-pairing - Harmony principles
 */

import Anthropic from '@anthropic-ai/sdk'
import { FONT_METADATA } from '@/lib/config/design-constants'

export interface FontPairingInput {
  eventType: string
  eventName: string
  eventDescription?: string
  targetMood?: string
  formalityLevel?: number  // 0-100 (optional override)
}

export interface FontPair {
  heading: string
  body: string
}

export interface FontPairingResult {
  primary: FontPair & {
    reasoning: string
    harmonyScore: number      // 0-1 (how well fonts harmonize)
    contrastScore: number     // 0-1 (visual differentiation)
    moodAlignment: number     // 0-1 (matches event mood)
  }
  alternatives: Array<FontPair & {
    reason: string
    score: number             // Overall pairing quality (0-1)
  }>
  confidence: number          // 0-1 (AI confidence in recommendation)
  analysis: {
    eventMood: string
    recommendedFormality: number
    keyConsiderations: string[]
  }
}

/**
 * Generate optimal font pairing using AI analysis
 */
export async function generateOptimalFontPair(
  input: FontPairingInput
): Promise<FontPairingResult> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })

  // Build font metadata context for AI
  const fontContext = Object.values(FONT_METADATA).map(font => ({
    value: font.value,
    label: font.label,
    category: font.category,
    formality: font.formalityScore,
    mood: font.moodTags,
    metrics: {
      xHeight: font.xHeight,
      strokeContrast: font.strokeContrast,
      characterWidth: font.characterWidth,
    },
    bestFor: font.bestFor,
    pairsWellWith: font.pairsWellWith,
  }))

  const prompt = `You are an expert typography designer specializing in font pairing. Use the following principles to recommend optimal font combinations:

**FONT PAIRING PRINCIPLES:**

1. **Monotype Harmony**: Fonts should share similar characteristics
   - Similar x-height (visual baseline alignment)
   - Compatible stroke structure (low/medium/high contrast)
   - Complementary character width (avoid extreme mismatches)

2. **Fontjoy Neural Net Contrast**: Fonts must differ enough for visual interest
   - Different categories (e.g., serif + sans, display + serif)
   - Different weights/styles for hierarchy
   - Clear differentiation between heading and body

3. **Tone Alignment**: Font personality must match event mood
   - Formality score alignment with event type
   - Mood tags matching event atmosphere
   - Cultural appropriateness

4. **2-Font Maximum Rule**: Use only 2 fonts (heading + body)
   - More fonts = visual chaos
   - Simplicity = professionalism

5. **Readability Priority**: Body font MUST be highly readable
   - Prefer sans-serif or traditional serif for body
   - Avoid decorative/display fonts for body text
   - High x-height for body text improves readability

**EVENT CONTEXT:**
- Event Type: ${input.eventType}
- Event Name: "${input.eventName}"
- Description: ${input.eventDescription || 'N/A'}
- Target Mood: ${input.targetMood || 'Professional, appropriate for event type'}
${input.formalityLevel ? `- Formality Override: ${input.formalityLevel}/100` : ''}

**AVAILABLE FONTS (${fontContext.length} fonts):**
${JSON.stringify(fontContext, null, 2)}

**YOUR TASK:**
1. Analyze the event type, name, and description to determine:
   - Appropriate formality level (0-100)
   - Target mood/atmosphere
   - Key design considerations

2. Select PRIMARY font pair:
   - Heading font: Eye-catching, personality-driven
   - Body font: Readable, supportive
   - Explain harmony (x-height, stroke, width)
   - Explain contrast (category difference, visual differentiation)
   - Explain mood alignment (why fonts match event)

3. Suggest 2-3 ALTERNATIVE pairs with reasoning

4. Provide confidence score (0-1) for primary recommendation

**OUTPUT (JSON only, no markdown):**
{
  "primary": {
    "heading": "font_value",
    "body": "font_value",
    "reasoning": "Detailed explanation of why this pair works (mention x-height, stroke contrast, mood, formality)",
    "harmonyScore": 0.85,
    "contrastScore": 0.75,
    "moodAlignment": 0.90
  },
  "alternatives": [
    {
      "heading": "font_value",
      "body": "font_value",
      "reason": "Why this pair is a good alternative",
      "score": 0.80
    }
  ],
  "confidence": 0.92,
  "analysis": {
    "eventMood": "Professional, modern, tech-forward",
    "recommendedFormality": 75,
    "keyConsiderations": [
      "Tech events need modern, clean fonts",
      "High formality maintains credibility",
      "Sans-serif for body ensures readability"
    ]
  }
}

CRITICAL: Return ONLY valid JSON. No markdown code blocks, no explanations outside JSON.`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',  // Fixed: use valid model ID
      max_tokens: 2000,
      temperature: 0.3,  // Lower temperature for more consistent recommendations
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    const content = response.content[0]
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    // Extract JSON from response (handle potential markdown wrapping)
    let jsonText = content.text.trim()

    // Remove markdown code blocks if present
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    }

    // Parse JSON response
    const result: FontPairingResult = JSON.parse(jsonText)

    // Validate font values exist in metadata
    const validateFont = (fontValue: string) => {
      if (!FONT_METADATA[fontValue]) {
        console.warn(`[Font Pairing] Font not found in metadata: ${fontValue}`)
        return false
      }
      return true
    }

    validateFont(result.primary.heading)
    validateFont(result.primary.body)

    console.log('[Font Pairing Engine] Success', {
      primary: `${result.primary.heading} + ${result.primary.body}`,
      confidence: result.confidence,
      formality: result.analysis.recommendedFormality,
    })

    return result

  } catch (error) {
    console.error('[Font Pairing Engine] Error:', error)

    // Fallback to rule-based pairing
    return getFallbackPairing(input)
  }
}

/**
 * Fallback rule-based font pairing
 * Used when AI pairing fails
 */
function getFallbackPairing(input: FontPairingInput): FontPairingResult {
  console.log('[Font Pairing Engine] Using fallback rule-based pairing')

  // Simple rule-based mapping
  const eventTypePairings: Record<string, FontPair> = {
    conference: { heading: 'exo_2', body: 'inter' },
    workshop: { heading: 'montserrat', body: 'open_sans' },
    tech: { heading: 'exo_2', body: 'inter' },
    health: { heading: 'nunito', body: 'source_sans_pro' },
    cultural: { heading: 'cinzel', body: 'lora' },
    wedding: { heading: 'great_vibes', body: 'cormorant' },
    sports: { heading: 'anton', body: 'barlow' },
    business: { heading: 'playfair_display', body: 'inter' },
    music: { heading: 'righteous', body: 'nunito' },
    educational: { heading: 'merriweather', body: 'source_sans_pro' },
  }

  // Find matching event type or use default
  const normalizedType = input.eventType.toLowerCase()
  let pair = eventTypePairings[normalizedType]

  if (!pair) {
    // Try partial matches
    for (const [key, value] of Object.entries(eventTypePairings)) {
      if (normalizedType.includes(key) || key.includes(normalizedType)) {
        pair = value
        break
      }
    }
  }

  // Final fallback
  if (!pair) {
    pair = { heading: 'playfair_display', body: 'inter' }
  }

  return {
    primary: {
      ...pair,
      reasoning: `Fallback rule-based pairing for ${input.eventType}. ${FONT_METADATA[pair.heading]?.label} provides strong headlines, ${FONT_METADATA[pair.body]?.label} ensures readable body text.`,
      harmonyScore: 0.7,
      contrastScore: 0.7,
      moodAlignment: 0.7,
    },
    alternatives: [
      {
        heading: 'montserrat',
        body: 'open_sans',
        reason: 'Versatile modern pairing suitable for most event types',
        score: 0.75,
      },
      {
        heading: 'merriweather',
        body: 'source_sans_pro',
        reason: 'Traditional serif + clean sans combination',
        score: 0.72,
      },
    ],
    confidence: 0.6,
    analysis: {
      eventMood: 'General professional event',
      recommendedFormality: 70,
      keyConsiderations: [
        'Fallback pairing used due to AI service unavailability',
        'Rule-based selection based on event type',
        'Prioritized readability and versatility',
      ],
    },
  }
}

/**
 * Quick font pairing validation
 * Checks if two fonts work well together based on metadata
 */
export function validateFontPairing(
  headingFont: string,
  bodyFont: string
): {
  valid: boolean
  harmonyScore: number
  contrastScore: number
  issues: string[]
  suggestions: string[]
} {
  const heading = FONT_METADATA[headingFont]
  const body = FONT_METADATA[bodyFont]

  if (!heading || !body) {
    return {
      valid: false,
      harmonyScore: 0,
      contrastScore: 0,
      issues: ['One or both fonts not found in metadata'],
      suggestions: ['Use fonts from the available library'],
    }
  }

  const issues: string[] = []
  const suggestions: string[] = []

  // Check harmony (should be similar)
  const harmonyFactors = {
    xHeight: heading.xHeight === body.xHeight ? 1 : 0.5,
    strokeContrast: heading.strokeContrast === body.strokeContrast ? 1 : 0.7,
    characterWidth: heading.characterWidth === body.characterWidth ? 1 : 0.8,
  }

  const harmonyScore =
    (harmonyFactors.xHeight + harmonyFactors.strokeContrast + harmonyFactors.characterWidth) / 3

  // Check contrast (should be different)
  const contrastFactors = {
    category: heading.category !== body.category ? 1 : 0.3,
    formality: Math.abs(heading.formalityScore - body.formalityScore) < 20 ? 0.8 : 0.5,
  }

  const contrastScore = (contrastFactors.category + contrastFactors.formality) / 2

  // Identify issues
  if (harmonyScore < 0.6) {
    issues.push('Fonts have low harmony (differing x-height, stroke, or width)')
    suggestions.push(`Consider pairing ${headingFont} with: ${heading.pairsWellWith.join(', ')}`)
  }

  if (contrastScore < 0.5) {
    issues.push('Fonts have low contrast (too similar)')
    suggestions.push('Try pairing fonts from different categories (e.g., serif + sans)')
  }

  if (body.category === 'display' || body.category === 'handwriting') {
    issues.push('Body font should be sans-serif or serif for readability')
    suggestions.push('Use display/handwriting fonts only for headings')
  }

  const valid = issues.length === 0 && harmonyScore >= 0.6 && contrastScore >= 0.5

  return {
    valid,
    harmonyScore,
    contrastScore,
    issues,
    suggestions,
  }
}
