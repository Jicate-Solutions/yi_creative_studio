/**
 * Typography Mapper
 * Converts style archetypes to concrete typography configurations
 */

import { STYLE_ARCHETYPES, type StyleArchetype, type ArchetypeDefinition } from './style-archetypes'
import { getScriptForLanguage, mapFontStyleToFont, type Script } from './language-utils'

export interface TypographyConfig {
  headline: {
    font: string
    size: number
    weight: string
    letterSpacing: string
    textTransform: string
    alignment: string
  }
  body: {
    font: string
    size: number
    weight: string
    lineHeight: number
  }
  accent: {
    font: string
    size: number
    weight: string
    style?: string
  }
}

export interface TypographyGuidance {
  config: TypographyConfig
  promptGuidance: string
  reasoning: string
  styleArchetype: StyleArchetype
  script: Script
}

/**
 * Base font sizes (in pixels)
 */
const BASE_SIZES = {
  headline: 72,
  body: 24,
  accent: 18
}

/**
 * Audience-based size adjustments
 */
const AUDIENCE_MULTIPLIERS = {
  children: 1.2,      // Larger for kids
  youth: 1.1,        // Slightly larger for youth
  general: 1.0,      // Standard
  academic: 0.95,     // Slightly smaller for text-heavy
  corporate: 1.0     // Standard
}

/**
 * Map style archetype to typography configuration
 */
export function mapStyleToTypography(
  styleArchetype: StyleArchetype,
  languageCode: string,
  audienceProfile: 'corporate' | 'youth' | 'academic' | 'general' | 'children' = 'general',
  primaryEmphasis?: string
): TypographyGuidance {
  const definition = STYLE_ARCHETYPES[styleArchetype]
  const script = getScriptForLanguage(languageCode)
  const audienceMultiplier = AUDIENCE_MULTIPLIERS[audienceProfile]

  // Get archetype size multipliers
  const { sizeMultipliers } = definition
  const typography = definition.typography

  // Get script-appropriate fonts
  const scriptKey = script as keyof typeof typography.fonts
  const scriptFonts = typography.fonts[scriptKey] || typography.fonts.latin

  // Parse font recommendations
  const headlineFont = mapFontStyleToFont(typography.headlineStyle, script)
  const bodyFont = mapFontStyleToFont(typography.bodyStyle, script)
  const accentFont = bodyFont // Use body font for accent text

  // Calculate final sizes
  const headlineSize = Math.round(
    BASE_SIZES.headline * sizeMultipliers.headline * audienceMultiplier
  )
  const bodySize = Math.round(
    BASE_SIZES.body * sizeMultipliers.body * audienceMultiplier
  )
  const accentSize = Math.round(
    BASE_SIZES.accent * sizeMultipliers.accent * audienceMultiplier
  )

  // Build typography config
  const config: TypographyConfig = {
    headline: {
      font: headlineFont,
      size: headlineSize,
      weight: typography.headlineWeight,
      letterSpacing: typography.letterSpacing,
      textTransform: typography.textTransform,
      alignment: typography.alignment
    },
    body: {
      font: bodyFont,
      size: bodySize,
      weight: typography.bodyWeight,
      lineHeight: 1.5
    },
    accent: {
      font: accentFont,
      size: accentSize,
      weight: typography.bodyWeight,
      style: typography.headlineWeight === 'bold' ? 'italic' : 'normal'
    }
  }

  // Build prompt guidance for Gemini
  const promptGuidance = buildPromptGuidance(config, typography, primaryEmphasis)

  // Build reasoning
  const reasoning = `Selected ${definition.name} typography: ${definition.description}. ` +
    `Using ${headlineFont} for headlines (${headlineSize}px, ${typography.headlineWeight}) ` +
    `and ${bodyFont} for body text (${bodySize}px). ` +
    `Optimized for ${audienceProfile} audience in ${languageCode.toUpperCase()}.`

  return {
    config,
    promptGuidance,
    reasoning,
    styleArchetype,
    script
  }
}

/**
 * Build prompt guidance for AI image generation
 */
function buildPromptGuidance(
  config: TypographyConfig,
  typographyStyle: any,
  primaryEmphasis?: string
): string {
  return `
<typography_guidance>
  <style_approach>${typographyStyle.headlineStyle} for headlines, ${typographyStyle.bodyStyle} for body text</style_approach>

  <headline_treatment>
    - Font style: ${config.headline.font}-style ${typographyStyle.headlineStyle}
    - Weight: ${config.headline.weight}
    - Size: Approximately ${config.headline.size}px equivalent (large and impactful)
    - Letter spacing: ${config.headline.letterSpacing}
    - Text transform: ${config.headline.textTransform}
    - Alignment: ${config.headline.alignment}
  </headline_treatment>

  <body_treatment>
    - Font style: ${config.body.font}-style ${typographyStyle.bodyStyle}
    - Weight: ${config.body.weight}
    - Size: Approximately ${config.body.size}px equivalent (readable and clear)
    - Line height: ${config.body.lineHeight}
  </body_treatment>

  <accent_treatment>
    - Font: ${config.accent.font}-style
    - Size: Approximately ${config.accent.size}px equivalent (smaller, supporting text)
    - Weight: ${config.accent.weight}
  </accent_treatment>

  ${primaryEmphasis ? `<text_emphasis>Primary focus on "${primaryEmphasis}" - make this the strongest visual element</text_emphasis>` : ''}

  <general_guidance>
    - Ensure high contrast between text and background for readability
    - Use consistent font hierarchy throughout the design
    - Maintain adequate spacing between text elements
    - Text should be the primary focus, not decorative elements
  </general_guidance>
</typography_guidance>
  `.trim()
}

/**
 * Generate typography configuration from analysis result
 */
export interface AnalysisResult {
  styleArchetype: StyleArchetype
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
}

export function generateTypographyFromAnalysis(
  analysis: AnalysisResult,
  languageCode: string
): TypographyGuidance {
  return mapStyleToTypography(
    analysis.styleArchetype,
    languageCode,
    analysis.audienceProfile,
    analysis.textHierarchy.primaryEmphasis
  )
}

/**
 * Get typography preview text for UI display
 */
export function getTypographyPreview(guidance: TypographyGuidance): string {
  const { config, styleArchetype } = guidance
  const definition = STYLE_ARCHETYPES[styleArchetype]

  return `${definition.name}: ${config.headline.font} headlines (${config.headline.weight}, ${config.headline.size}px), ${config.body.font} body text (${config.body.size}px)`
}

/**
 * Convert typography config to CSS-like object for preview rendering
 */
export function typographyToCSS(config: TypographyConfig): {
  headline: React.CSSProperties
  body: React.CSSProperties
  accent: React.CSSProperties
} {
  return {
    headline: {
      fontFamily: config.headline.font,
      fontSize: `${config.headline.size}px`,
      fontWeight: config.headline.weight === 'bold' ? 700 : config.headline.weight === 'extra-bold' ? 800 : config.headline.weight === 'medium' ? 500 : 400,
      letterSpacing: config.headline.letterSpacing === 'tight' ? '-0.02em' : config.headline.letterSpacing === 'wide' ? '0.05em' : 'normal',
      textTransform: config.headline.textTransform.includes('uppercase') ? 'uppercase' : config.headline.textTransform.includes('title') ? 'capitalize' : 'none',
      textAlign: config.headline.alignment.includes('center') ? 'center' : config.headline.alignment.includes('left') ? 'left' : 'center'
    },
    body: {
      fontFamily: config.body.font,
      fontSize: `${config.body.size}px`,
      fontWeight: config.body.weight === 'bold' ? 700 : config.body.weight === 'light' ? 300 : 400,
      lineHeight: config.body.lineHeight
    },
    accent: {
      fontFamily: config.accent.font,
      fontSize: `${config.accent.size}px`,
      fontWeight: config.accent.weight === 'bold' ? 700 : config.accent.weight === 'medium' ? 500 : 400,
      fontStyle: config.accent.style || 'normal'
    }
  }
}
