/**
 * Typography Intelligence Agent (Stage 1.5)
 *
 * Purpose: AI-powered typography selection that matches event concept
 *
 * This agent analyzes event characteristics and generates typography guidance:
 * - Headline font personality (bold, elegant, playful, rugged, etc.)
 * - Body font personality (readable, supportive, harmonious)
 * - Font pairing strategy
 * - Visual references for Gemini interpretation
 *
 * Integration: Called after Event Understanding (Stage 1), before prompt building
 * Cost: ~$0.004 per call (~600ms latency)
 */

import Anthropic from '@anthropic-ai/sdk'
import { trackApiUsage } from '@/lib/services/api-usage'
import type { EventProfile } from './event-understanding'

// ============================================================================
// Types
// ============================================================================

export interface TypographyAnalysisInput {
  // Event context
  eventName: string
  eventProfile?: EventProfile | null  // From Stage 1
  formatId: string

  // Design context
  formality?: 'casual' | 'professional' | 'premium' | 'exclusive'
  energyLevel?: 'calm' | 'moderate' | 'high' | 'explosive'
  emotionalTone?: string

  // Constraints
  brandFont?: {
    headline?: string
    body?: string
  }
  language?: string
}

export interface FontCharacteristics {
  weight: 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
  style: 'serif' | 'sans-serif' | 'slab-serif' | 'display' | 'script' | 'monospace'
  mood: string  // e.g., "confident, forward-moving, adventurous"
  personality: string  // Rich description for Gemini
}

export interface TypographyProfile {
  // Headline typography
  headline: {
    characteristics: FontCharacteristics
    styleGuidance: string  // e.g., "Bold geometric sans-serif inspired by compass engravings"
    visualReferences: string[]  // e.g., ["topographic map typography", "expedition posters"]
    avoidPatterns: string[]  // What NOT to do
  }

  // Body typography
  body: {
    characteristics: FontCharacteristics
    styleGuidance: string
    readabilityNotes: string
  }

  // Pairing strategy
  pairingStrategy: string  // How headline and body work together
  hierarchy: string  // Size/weight relationships

  // For prompt injection
  geminiInstructions: string  // Direct instructions for image generation
  xmlGuidance: string  // XML-formatted for Yi Prompt Builder

  // Metadata
  confidence: number  // 0-1
  reasoning: string  // Why these choices
}

// ============================================================================
// Typography Intelligence Prompt
// ============================================================================

function buildTypographyPrompt(input: TypographyAnalysisInput): string {
  const eventContext = input.eventProfile ? `
EVENT CONCEPT ANALYSIS (FROM STAGE 1):
- Event: "${input.eventName}"
- Selected Concept: ${input.eventProfile.selectedConcept}
- Literal Meaning: ${input.eventProfile.literalMeaning}
- Metaphorical Meanings: ${input.eventProfile.metaphoricalMeanings.join(', ')}
- Formality: ${input.eventProfile.formality}
- Energy Level: ${input.eventProfile.energyLevel}
- Emotional Tone: ${input.eventProfile.emotionalTone}
- Primary Visual Associations: ${input.eventProfile.visualAssociations.primary.slice(0, 5).join(', ')}
` : `
EVENT BASIC INFO:
- Event: "${input.eventName}"
- Formality: ${input.formality || 'professional'}
- Energy Level: ${input.energyLevel || 'moderate'}
- Emotional Tone: ${input.emotionalTone || 'professional'}
`

  const formatGuidance = getFormatTypographyGuidance(input.formatId)

  const brandConstraints = input.brandFont ? `
BRAND FONT CONSTRAINTS:
${input.brandFont.headline ? `- Headline Font: ${input.brandFont.headline}` : ''}
${input.brandFont.body ? `- Body Font: ${input.brandFont.body}` : ''}
Note: If brand fonts are specified, enhance them with personality guidance rather than suggesting replacements.
` : ''

  return `You are an expert typography designer and type director. Your task is to analyze an event concept and generate typography guidance for image generation.

${eventContext}

FORMAT: ${input.formatId}
${formatGuidance}

${brandConstraints}

YOUR TASK:

Analyze the event characteristics and return a JSON object with typography guidance:

{
  "headline": {
    "characteristics": {
      "weight": "bold" | "heavy" | "black" | etc,
      "style": "serif" | "sans-serif" | "slab-serif" | "display" | "script",
      "mood": "Brief mood description",
      "personality": "Rich personality description"
    },
    "styleGuidance": "Detailed style description for headline typography",
    "visualReferences": ["Visual reference 1", "Visual reference 2", "Visual reference 3"],
    "avoidPatterns": ["What NOT to do", "Patterns to avoid"]
  },
  "body": {
    "characteristics": {
      "weight": "regular" | "medium",
      "style": "serif" | "sans-serif",
      "mood": "Brief mood",
      "personality": "Personality description"
    },
    "styleGuidance": "Detailed style for body text",
    "readabilityNotes": "Readability requirements"
  },
  "pairingStrategy": "How headline and body fonts work together",
  "hierarchy": "Size and weight relationship guidance",
  "geminiInstructions": "Direct instructions for Gemini image generation",
  "xmlGuidance": "XML-formatted typography guidance",
  "confidence": 0.9,
  "reasoning": "Why these typography choices match the event"
}

TYPOGRAPHY ANALYSIS GUIDELINES:

1. MATCH TYPOGRAPHY TO CONCEPT
   - Typography is the voice of the visual
   - Font personality must align with event personality
   - "PATHFINDER" needs different typography than "Annual Leadership Summit"

2. HEADLINE FONT PERSONALITY
   - What emotional qualities should it convey?
   - Weight and character (bold/light, geometric/organic, modern/classic)
   - Visual references that anchor interpretation
   - Think: If this event were a font, what would it look like?

3. BODY FONT PERSONALITY
   - Must support headline without competing
   - Prioritize readability for event details
   - Harmonize with headline choices

4. VISUAL REFERENCES (CRITICAL)
   - Provide specific visual anchors for AI interpretation
   - Examples: "compass rose engravings", "trail marker lettering", "luxury brand packaging"
   - These help Gemini understand the typography style

5. FORMAT-SPECIFIC REQUIREMENTS
   - Posters: Bold display headlines, readable body at distance
   - Social Posts: Mobile-readable, clear hierarchy
   - Certificates: Elegant, formal, traditional
   - Banners: Large-scale readability

6. AVOID GENERIC DESCRIPTIONS
   - Bad: "Use a bold font"
   - Good: "Heavy geometric sans-serif with angular terminals, inspired by industrial signage and navigation instruments"

EXAMPLES:

Event: "PATHFINDER"
Concept: Navigation & Discovery
{
  "headline": {
    "characteristics": {
      "weight": "heavy",
      "style": "sans-serif",
      "mood": "confident, adventurous, directional",
      "personality": "Bold and angular with geometric precision, evoking compass instruments and trail markers"
    },
    "styleGuidance": "Heavy geometric sans-serif with strong vertical emphasis and angular terminals. Think compass rose typography, topographic map lettering, expedition poster headlines. Sharp, precise, forward-moving.",
    "visualReferences": [
      "topographic survey map typography",
      "vintage expedition poster headlines",
      "compass rose engraving lettering",
      "trail marker signage",
      "navigation instrument panels"
    ],
    "avoidPatterns": [
      "Generic corporate sans-serif (Helvetica, Arial)",
      "Overly decorative or script fonts",
      "Thin, delicate fonts that lack impact"
    ]
  },
  "body": {
    "characteristics": {
      "weight": "regular",
      "style": "sans-serif",
      "mood": "clean, readable, supportive",
      "personality": "Clear and legible with geometric harmony"
    },
    "styleGuidance": "Clean geometric sans-serif or subtle slab serif for supporting text. Medium weight, excellent legibility at smaller sizes. Complements headline precision without competing.",
    "readabilityNotes": "Must remain readable for date, time, venue details. Neutral enough to not distract from bold headline."
  },
  "pairingStrategy": "Geometric sans-serif family for consistency, with significant weight contrast (heavy headline vs regular body). Visual coherence through shared geometric construction.",
  "hierarchy": "Headline: 60-80pt bold/heavy. Subheading: 24-36pt medium. Body: 14-18pt regular. Strong size and weight differentiation for clear hierarchy.",
  "geminiInstructions": "For headline text, use bold geometric sans-serif typography inspired by compass engravings and navigation instruments. Heavy weight, angular terminals, strong vertical emphasis. Visual references: topographic map lettering, expedition posters, trail markers. For body text, use clean geometric sans-serif, regular weight, high legibility. Avoid generic corporate fonts.",
  "xmlGuidance": "<typography_guidance>\\n  <headline_font>Heavy geometric sans-serif with angular precision, inspired by compass rose typography and topographic survey lettering. Bold, directional, forward-moving feel.</headline_font>\\n  <body_font>Clean geometric sans-serif, regular weight, excellent legibility for event details.</body_font>\\n  <visual_references>expedition posters, trail marker signage, navigation instruments</visual_references>\\n  <avoid>Generic corporate sans-serif, overly decorative fonts</avoid>\\n</typography_guidance>",
  "confidence": 0.95,
  "reasoning": "The PATHFINDER event concept of navigation and discovery requires typography that feels directional, precise, and adventurous. Heavy geometric sans-serif evokes the precision of navigation instruments while maintaining strong visual impact. Visual references to topographic maps and expedition materials anchor the interpretation."
}

Event: "Annual Leadership Summit"
Concept: Summit Achievement, Professional Prestige
{
  "headline": {
    "characteristics": {
      "weight": "bold",
      "style": "serif",
      "mood": "authoritative, prestigious, refined",
      "personality": "Elegant serif with classical proportions and sophisticated presence"
    },
    "styleGuidance": "Bold serif with classical proportions, elegant stroke contrast, and refined details. Think high-end brand typography, luxury magazine mastheads, prestigious institution branding. Timeless, authoritative, sophisticated.",
    "visualReferences": [
      "luxury brand serif typography (Vogue, Harvard)",
      "classical monument inscriptions",
      "prestigious award certificates",
      "executive letterhead"
    ],
    "avoidPatterns": [
      "Casual sans-serif fonts",
      "Overly modern geometric fonts",
      "Script or decorative fonts that lack gravitas"
    ]
  },
  "confidence": 0.92
}

Now analyze the event provided above and return ONLY the JSON object (no additional text).`
}

function getFormatTypographyGuidance(formatId: string): string {
  const formatMap: Record<string, string> = {
    'event_poster': 'Posters need bold, impactful headline typography readable at distance. Body text must be clear for event details.',
    'workshop_flyer': 'Flyers need balanced typography - bold headlines for attention, very readable body for information.',
    'instagram_post': 'Social posts need clean, mobile-readable typography. Headlines must work at small sizes on phones.',
    'instagram_story': 'Story format needs large, bold typography optimized for vertical mobile viewing.',
    'certificate': 'Certificates require elegant, formal, traditional typography. Often serif for prestige.',
    'linkedin_post': 'Professional social format needs clean, corporate-friendly typography with strong hierarchy.',
    'youtube_thumbnail': 'Thumbnails need extremely bold, high-contrast typography readable at tiny sizes.',
    'web_banner': 'Banners need large-scale readability and clear focal hierarchy.'
  }

  return formatMap[formatId] || 'Typography should match format requirements for readability and impact.'
}

// ============================================================================
// Typography Intelligence Agent
// ============================================================================

export async function generateTypographyIntelligence(
  input: TypographyAnalysisInput,
  options?: {
    userId?: string
    organizationId?: string
    temperature?: number
  }
): Promise<TypographyProfile> {
  const startTime = Date.now()

  console.log('[Typography Intelligence] Starting analysis...')
  console.log('[Typography Intelligence] Event:', input.eventName)
  console.log('[Typography Intelligence] Format:', input.formatId)

  // Initialize Anthropic client
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const anthropic = new Anthropic({ apiKey })

  // Build prompt
  const prompt = buildTypographyPrompt(input)

  try {
    // Call Claude Haiku 4.5 for typography analysis
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2048,
      temperature: options?.temperature ?? 0.8,  // Creative but focused
      messages: [{
        role: 'user',
        content: prompt
      }]
    })

    const latency = Date.now() - startTime

    // Extract response text
    const contentBlock = response.content[0]
    if (contentBlock.type !== 'text') {
      throw new Error('Unexpected response type from Claude')
    }

    const responseText = contentBlock.text

    // Parse JSON response
    let typographyProfile: TypographyProfile
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }
      typographyProfile = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('[Typography Intelligence] Failed to parse JSON:', parseError)
      console.error('[Typography Intelligence] Response:', responseText)
      throw new Error('Failed to parse typography intelligence response')
    }

    // Validate response structure
    if (!typographyProfile.headline || !typographyProfile.body) {
      throw new Error('Invalid typography profile structure')
    }

    // Track API usage
    if (options?.userId && options?.organizationId) {
      await trackApiUsage({
        userId: options.userId,
        organizationId: options.organizationId,
        requestType: 'design_intelligence',
        provider: 'claude',
        model: 'claude-haiku-4-5',
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        estimatedCostUsd: (response.usage.input_tokens * 0.001 / 1000000) + (response.usage.output_tokens * 0.005 / 1000000),
        durationMs: latency,
        success: true,
        metadata: {
          operation: 'typography_intelligence',
          eventName: input.eventName,
          formatId: input.formatId,
          headlineStyle: typographyProfile.headline.characteristics.style,
          confidence: typographyProfile.confidence
        }
      })
    }

    console.log('[Typography Intelligence] ✅ Analysis complete')
    console.log('[Typography Intelligence] Headline:', typographyProfile.headline.characteristics.style, typographyProfile.headline.characteristics.weight)
    console.log('[Typography Intelligence] Body:', typographyProfile.body.characteristics.style, typographyProfile.body.characteristics.weight)
    console.log('[Typography Intelligence] Confidence:', typographyProfile.confidence)
    console.log('[Typography Intelligence] Latency:', latency, 'ms')
    console.log('[Typography Intelligence] Tokens:', response.usage.input_tokens, 'in /', response.usage.output_tokens, 'out')

    return typographyProfile

  } catch (error) {
    const latency = Date.now() - startTime
    console.error('[Typography Intelligence] ❌ Error:', error)

    // Track failed usage
    if (options?.userId && options?.organizationId) {
      await trackApiUsage({
        userId: options.userId,
        organizationId: options.organizationId,
        requestType: 'design_intelligence',
        provider: 'claude',
        model: 'claude-haiku-4-5',
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUsd: 0,
        durationMs: latency,
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          operation: 'typography_intelligence_error',
          eventName: input.eventName,
          formatId: input.formatId
        }
      })
    }

    throw error
  }
}

// ============================================================================
// Fallback Typography Intelligence
// ============================================================================

export function generateFallbackTypography(input: TypographyAnalysisInput): TypographyProfile {
  console.log('[Typography Intelligence] Using fallback typography profile')

  const formality = input.eventProfile?.formality || input.formality || 'professional'
  const energyLevel = input.eventProfile?.energyLevel || input.energyLevel || 'moderate'

  // Basic typography based on formality
  const formalityMap: Record<string, Partial<TypographyProfile>> = {
    casual: {
      headline: {
        characteristics: {
          weight: 'bold',
          style: 'sans-serif',
          mood: 'friendly, approachable',
          personality: 'Clean, friendly sans-serif'
        },
        styleGuidance: 'Bold sans-serif with friendly, approachable feel',
        visualReferences: ['modern brand typography', 'friendly signage'],
        avoidPatterns: ['Overly formal serif', 'Corporate stiffness']
      },
      body: {
        characteristics: {
          weight: 'regular',
          style: 'sans-serif',
          mood: 'clean, readable',
          personality: 'Clear and accessible'
        },
        styleGuidance: 'Clean sans-serif for easy reading',
        readabilityNotes: 'High legibility for casual reading'
      }
    },
    professional: {
      headline: {
        characteristics: {
          weight: 'bold',
          style: 'sans-serif',
          mood: 'confident, professional',
          personality: 'Strong, professional typography'
        },
        styleGuidance: 'Bold sans-serif with professional confidence',
        visualReferences: ['corporate branding', 'business presentations'],
        avoidPatterns: ['Overly casual', 'Too decorative']
      },
      body: {
        characteristics: {
          weight: 'regular',
          style: 'sans-serif',
          mood: 'clean, professional',
          personality: 'Professional and readable'
        },
        styleGuidance: 'Clean, professional typography',
        readabilityNotes: 'Clear hierarchy and readability'
      }
    },
    premium: {
      headline: {
        characteristics: {
          weight: 'bold',
          style: 'serif',
          mood: 'elegant, sophisticated',
          personality: 'Refined serif typography'
        },
        styleGuidance: 'Elegant serif with sophisticated presence',
        visualReferences: ['luxury brands', 'premium publications'],
        avoidPatterns: ['Casual sans-serif', 'Overly modern']
      },
      body: {
        characteristics: {
          weight: 'regular',
          style: 'serif',
          mood: 'elegant, refined',
          personality: 'Sophisticated and readable'
        },
        styleGuidance: 'Elegant serif for refined reading',
        readabilityNotes: 'Classic readability with sophistication'
      }
    },
    exclusive: {
      headline: {
        characteristics: {
          weight: 'bold',
          style: 'serif',
          mood: 'prestigious, authoritative',
          personality: 'Prestigious serif typography'
        },
        styleGuidance: 'Prestigious serif with authoritative presence',
        visualReferences: ['luxury brands', 'exclusive institutions'],
        avoidPatterns: ['Casual typography', 'Modern sans-serif']
      },
      body: {
        characteristics: {
          weight: 'regular',
          style: 'serif',
          mood: 'refined, prestigious',
          personality: 'Prestigious and readable'
        },
        styleGuidance: 'Refined serif for prestigious communication',
        readabilityNotes: 'Classical readability with prestige'
      }
    }
  }

  const baseProfile = formalityMap[formality] || formalityMap.professional

  return {
    headline: baseProfile.headline as TypographyProfile['headline'],
    body: baseProfile.body as TypographyProfile['body'],
    pairingStrategy: `${baseProfile.headline!.characteristics.style} headline with ${baseProfile.body!.characteristics.style} body for ${formality} event`,
    hierarchy: 'Strong headline with clear size contrast to body text',
    geminiInstructions: `Use ${baseProfile.headline!.characteristics.weight} ${baseProfile.headline!.characteristics.style} for headlines with ${formality} feel. ${baseProfile.body!.characteristics.weight} ${baseProfile.body!.characteristics.style} for body text.`,
    xmlGuidance: `<typography_guidance><headline_font>${baseProfile.headline!.styleGuidance}</headline_font><body_font>${baseProfile.body!.styleGuidance}</body_font></typography_guidance>`,
    confidence: 0.5,
    reasoning: `Fallback typography profile based on ${formality} formality level`
  }
}

// ============================================================================
// Helper: Should Use Typography Intelligence?
// ============================================================================

export function shouldUseTypographyIntelligence(
  formatId: string,
  hasEventProfile: boolean
): boolean {
  // Use typography intelligence when:
  // 1. We have Event Understanding insights to leverage
  // 2. Format is visual/creative (not purely data-driven)

  const creativeFormats = [
    'event_poster',
    'workshop_flyer',
    'conference_poster',
    'instagram_post',
    'instagram_story',
    'linkedin_post',
    'facebook_event_cover',
    'youtube_thumbnail',
    'web_banner',
    'certificate'
  ]

  return creativeFormats.includes(formatId) && hasEventProfile
}
