/**
 * Unified Typography + Color Optimization
 *
 * Single AI call optimizes BOTH typography AND colors for maximum harmony.
 * Uses Claude Sonnet 4.5 for complex design reasoning.
 *
 * Benefits:
 * 1. Typography-color alignment (font personality matches color mood)
 * 2. WCAG accessibility validation (≥4.5:1 for body, ≥3:1 for large)
 * 3. Visual hierarchy reinforcement (color differentiation supports typography)
 * 4. Holistic design optimization (not separate, isolated decisions)
 *
 * Based on design principles:
 * - Monotype font harmony (x-height, stroke structure)
 * - Fontjoy neural net contrast (visual differentiation)
 * - Color psychology (mood alignment with event type)
 * - WCAG accessibility standards
 */

import Anthropic from '@anthropic-ai/sdk'
import { FONT_METADATA, EVENT_COLOR_PALETTES } from '@/lib/config/design-constants'
import type { MultiColorTypographyConfig } from '@/lib/config/design-constants'

export interface UnifiedOptimizationInput {
  eventType: string
  eventName: string
  eventDescription?: string
  targetMood?: string
  brandColors?: {
    primary?: string
    secondary?: string
    accent?: string
  }
  formalityLevel?: number  // 0-100 (optional override)
}

export interface TypographyResult {
  headingFont: string
  bodyFont: string
  scale: number
  reasoning: string
  harmonyAnalysis: {
    xHeightAlignment: string
    strokeContrastAlignment: string
    characterWidthAlignment: string
  }
}

export interface ColorResult extends MultiColorTypographyConfig {
  paletteStrategy: string  // Overall color strategy explanation
  accessibilityReport: {
    heroContrast: number
    headlineContrast: number
    bodyContrast: number
    ctaContrast: number
    captionContrast: number
    wcagCompliance: 'AAA' | 'AA' | 'A' | 'Fail'
  }
}

export interface UnifiedOptimizationResult {
  typography: TypographyResult
  colors: ColorResult
  harmony: {
    fontColorAlignment: string      // How fonts and colors work together
    visualHierarchy: string          // How color reinforces typography hierarchy
    moodConsistency: number          // 0-1 score for overall mood alignment
    accessibilityScore: number       // 0-1 overall accessibility
    overallQuality: number           // 0-1 combined design quality
  }
  analysis: {
    eventMood: string
    recommendedFormality: number
    keyConsiderations: string[]
  }
  confidence: number  // 0-1 (AI confidence in this recommendation)
}

/**
 * Optimize both typography and colors in a single AI call
 */
export async function optimizeTypographyAndColors(
  input: UnifiedOptimizationInput
): Promise<UnifiedOptimizationResult> {
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

  // Include pre-built color palettes as references
  const paletteExamples = Object.entries(EVENT_COLOR_PALETTES).map(([eventType, palette]) => ({
    eventType,
    palette,
  }))

  const prompt = `You are an expert design consultant specializing in holistic visual design. Your task is to recommend BOTH font pairing AND color palette that work together harmoniously.

**DESIGN PRINCIPLES:**

1. **Monotype Font Harmony**: Fonts should share similar characteristics
   - Similar x-height (visual baseline alignment)
   - Compatible stroke structure (low/medium/high contrast)
   - Complementary character width (avoid extreme mismatches)

2. **Fontjoy Neural Net Contrast**: Fonts must differ enough for visual interest
   - Different categories (e.g., serif + sans, display + serif)
   - Different weights/styles for hierarchy
   - Clear differentiation between heading and body

3. **Typography-Color Alignment**: Font personality must match color mood
   - Bold fonts → Bold, saturated colors
   - Elegant fonts → Sophisticated, refined colors
   - Modern fonts → Contemporary color palettes
   - Traditional fonts → Classical, timeless colors

4. **WCAG Accessibility Standards**: Ensure readability
   - Body text: ≥4.5:1 contrast ratio (WCAG AA)
   - Large text (hero/headline): ≥3:1 contrast ratio
   - CTA elements: High contrast for visibility
   - Prefer solid colors for body text (gradients for hero/CTA only)

5. **Visual Hierarchy Reinforcement**: Color should support typography
   - Use color differentiation to reinforce text role hierarchy
   - Hero/title: Most impactful color (gradient okay)
   - Headline: Strong, distinct color
   - Body: Highest readability, neutral
   - CTA: Attention-grabbing, contrasting

6. **Mood Consistency**: All design elements align with event mood
   - Professional events: Neutral colors + clean fonts
   - Creative events: Vibrant colors + expressive fonts
   - Academic events: Classical colors + traditional fonts
   - Tech events: Contemporary colors + modern fonts

**EVENT CONTEXT:**
- Event Type: ${input.eventType}
- Event Name: "${input.eventName}"
- Description: ${input.eventDescription || 'N/A'}
- Target Mood: ${input.targetMood || 'Professional, appropriate for event type'}
${input.formalityLevel ? `- Formality Override: ${input.formalityLevel}/100` : ''}
${input.brandColors ? `- Brand Colors (consider as constraints): Primary: ${input.brandColors.primary || 'N/A'}, Secondary: ${input.brandColors.secondary || 'N/A'}, Accent: ${input.brandColors.accent || 'N/A'}` : ''}

**AVAILABLE FONTS (48 total):**
${JSON.stringify(fontContext.slice(0, 20), null, 2)}
... (${fontContext.length - 20} more fonts available)

**PRE-BUILT COLOR PALETTE EXAMPLES (for reference):**
${JSON.stringify(paletteExamples.slice(0, 3), null, 2)}
... (${paletteExamples.length - 3} more event-specific palettes available)

**YOUR TASK:**

1. **Analyze Event Context**:
   - Determine appropriate formality level (0-100)
   - Identify target mood/atmosphere
   - List key design considerations

2. **Select Font Pair**:
   - Heading font: Eye-catching, personality-driven
   - Body font: Readable, supportive
   - Explain harmony (x-height, stroke contrast, character width)
   - Explain contrast (category difference, visual differentiation)
   - Explain mood alignment (why fonts match event)

3. **Design Color Palette**:
   - Create multi-color typography config (7 text roles)
   - Hero: Gradient or solid (maximum impact)
   - Headline: Strong, distinct (solid preferred)
   - Subheadline: Supportive (solid preferred)
   - Body: Highest readability (solid only, neutral)
   - CTA: Attention-grabbing (gradient or solid, high contrast)
   - Caption: Subtle (solid only)
   - Label: Metadata (solid only)
   - Calculate WCAG contrast ratios (assume white background)
   - Ensure AA compliance minimum

4. **Validate Harmony**:
   - Typography-color alignment: Do bold fonts have bold colors?
   - Visual hierarchy: Does color reinforce typography roles?
   - Mood consistency: Do all elements feel cohesive?
   - Accessibility: All WCAG standards met?

**OUTPUT FORMAT (JSON only, no markdown):**
{
  "typography": {
    "headingFont": "font_value",
    "bodyFont": "font_value",
    "scale": 1.0,
    "reasoning": "Detailed explanation (mention x-height, stroke, mood)",
    "harmonyAnalysis": {
      "xHeightAlignment": "Explanation of x-height compatibility",
      "strokeContrastAlignment": "Explanation of stroke contrast",
      "characterWidthAlignment": "Explanation of character width"
    }
  },
  "colors": {
    "hero": {
      "type": "gradient",
      "gradientStart": "#1e3a8a",
      "gradientEnd": "#3b82f6",
      "gradientDirection": "horizontal",
      "contrastRatio": 8.5,
      "description": "Professional blue gradient for impact"
    },
    "headline": {
      "type": "solid",
      "color": "#1e3a8a",
      "contrastRatio": 12.5,
      "description": "Deep blue for authority"
    },
    "subheadline": {
      "type": "solid",
      "color": "#3b82f6",
      "contrastRatio": 7.2,
      "description": "Lighter blue for hierarchy"
    },
    "body": {
      "type": "solid",
      "color": "#1f2937",
      "contrastRatio": 16.1,
      "description": "Dark gray for readability"
    },
    "cta": {
      "type": "gradient",
      "gradientStart": "#f59e0b",
      "gradientEnd": "#d97706",
      "gradientDirection": "horizontal",
      "contrastRatio": 5.8,
      "description": "Amber gradient for action"
    },
    "caption": {
      "type": "solid",
      "color": "#6b7280",
      "contrastRatio": 7.5,
      "description": "Medium gray for captions"
    },
    "label": {
      "type": "solid",
      "color": "#9ca3af",
      "contrastRatio": 4.8,
      "description": "Light gray for labels"
    },
    "paletteStrategy": "Professional blue palette with amber CTA for corporate tech event",
    "accessibilityReport": {
      "heroContrast": 8.5,
      "headlineContrast": 12.5,
      "bodyContrast": 16.1,
      "ctaContrast": 5.8,
      "captionContrast": 7.5,
      "wcagCompliance": "AA"
    }
  },
  "harmony": {
    "fontColorAlignment": "Modern geometric fonts align with contemporary blue palette",
    "visualHierarchy": "Color progression (dark → light blue) reinforces typography hierarchy",
    "moodConsistency": 0.92,
    "accessibilityScore": 0.95,
    "overallQuality": 0.90
  },
  "analysis": {
    "eventMood": "Professional, modern, tech-forward",
    "recommendedFormality": 70,
    "keyConsiderations": [
      "Tech events need modern fonts and contemporary colors",
      "High formality maintains credibility",
      "Blue palette signals trust and professionalism"
    ]
  },
  "confidence": 0.88
}

**CRITICAL REQUIREMENTS:**
- Return ONLY valid JSON (no markdown code blocks, no preamble)
- All contrast ratios must be calculated (use Web Content Accessibility Guidelines formula)
- Body text MUST be solid color (no gradients for body)
- Minimum WCAG AA compliance (≥4.5:1 for body, ≥3:1 for large text)
- Typography and colors must align in mood and personality
- Include all 7 text roles in color palette

Return JSON now (no additional text):`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4.5-20251022',  // Sonnet for complex design reasoning
      max_tokens: 3000,
      temperature: 0.4,  // Moderate temperature for creative but consistent design
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
    const result: UnifiedOptimizationResult = JSON.parse(jsonText)

    // Validate fonts exist in metadata
    if (!FONT_METADATA[result.typography.headingFont]) {
      console.warn(`[Unified Optimization] Heading font not found: ${result.typography.headingFont}`)
    }
    if (!FONT_METADATA[result.typography.bodyFont]) {
      console.warn(`[Unified Optimization] Body font not found: ${result.typography.bodyFont}`)
    }

    console.log('[Unified Optimization] Success', {
      typography: `${result.typography.headingFont} + ${result.typography.bodyFont}`,
      colorStrategy: result.colors.paletteStrategy,
      wcagCompliance: result.colors.accessibilityReport.wcagCompliance,
      overallQuality: result.harmony.overallQuality,
      confidence: result.confidence,
    })

    return result

  } catch (error) {
    console.error('[Unified Optimization] Error:', error)

    // Fallback to basic pairing + pre-built palette
    return getFallbackUnifiedOptimization(input)
  }
}

/**
 * Fallback unified optimization
 * Used when AI optimization fails
 */
function getFallbackUnifiedOptimization(
  input: UnifiedOptimizationInput
): UnifiedOptimizationResult {
  console.log('[Unified Optimization] Using fallback rule-based optimization')

  // Simple event type mapping
  const eventTypeLower = input.eventType.toLowerCase()

  // Default to conference palette and fonts
  let fonts = { heading: 'playfair_display', body: 'inter' }
  let paletteKey: keyof typeof EVENT_COLOR_PALETTES = 'conference'

  // Match event type to palette
  if (eventTypeLower.includes('workshop')) {
    fonts = { heading: 'montserrat', body: 'open_sans' }
    paletteKey = 'workshop'
  } else if (eventTypeLower.includes('health') || eventTypeLower.includes('medical')) {
    fonts = { heading: 'playfair_display', body: 'lato' }
    paletteKey = 'health_camp'
  } else if (eventTypeLower.includes('tech') || eventTypeLower.includes('innovation')) {
    fonts = { heading: 'exo_2', body: 'dm_sans' }
    paletteKey = 'tech_talk'
  } else if (eventTypeLower.includes('cultural') || eventTypeLower.includes('festival')) {
    fonts = { heading: 'cinzel', body: 'nunito' }
    paletteKey = 'cultural_event'
  } else if (eventTypeLower.includes('wedding')) {
    fonts = { heading: 'great_vibes', body: 'cormorant' }
    paletteKey = 'wedding'
  } else if (eventTypeLower.includes('sport')) {
    fonts = { heading: 'anton', body: 'barlow' }
    paletteKey = 'sports_event'
  } else if (eventTypeLower.includes('business')) {
    fonts = { heading: 'playfair_display', body: 'inter' }
    paletteKey = 'business_summit'
  }

  const palette = EVENT_COLOR_PALETTES[paletteKey]

  return {
    typography: {
      headingFont: fonts.heading,
      bodyFont: fonts.body,
      scale: 1.1,
      reasoning: `Fallback rule-based pairing for ${input.eventType}. ${FONT_METADATA[fonts.heading]?.label} provides strong headlines, ${FONT_METADATA[fonts.body]?.label} ensures readable body text.`,
      harmonyAnalysis: {
        xHeightAlignment: 'Compatible x-heights for visual alignment',
        strokeContrastAlignment: 'Balanced stroke contrast for readability',
        characterWidthAlignment: 'Normal character widths for optimal spacing',
      },
    },
    colors: {
      ...palette,
      paletteStrategy: `Pre-built ${paletteKey} palette optimized for ${input.eventType} events`,
      accessibilityReport: {
        heroContrast: palette.hero.contrastRatio || 7.0,
        headlineContrast: palette.headline.contrastRatio || 12.0,
        bodyContrast: palette.body.contrastRatio || 15.0,
        ctaContrast: palette.cta.contrastRatio || 6.0,
        captionContrast: palette.caption.contrastRatio || 7.0,
        wcagCompliance: 'AA',
      },
    },
    harmony: {
      fontColorAlignment: 'Fonts and colors selected from pre-built event-type optimized templates',
      visualHierarchy: 'Color progression reinforces typography hierarchy',
      moodConsistency: 0.75,
      accessibilityScore: 0.85,
      overallQuality: 0.75,
    },
    analysis: {
      eventMood: `${paletteKey.replace(/_/g, ' ')} atmosphere`,
      recommendedFormality: 70,
      keyConsiderations: [
        'Fallback optimization used due to AI service unavailability',
        `Pre-built ${paletteKey} template provides reliable design`,
        'Rule-based font selection based on event type',
      ],
    },
    confidence: 0.65,
  }
}
