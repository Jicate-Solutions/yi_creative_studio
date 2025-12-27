/**
 * Text Readability Validator
 * Validates typography settings for accessibility and readability
 *
 * Guidelines:
 * - Body text: Minimum 16px (1rem)
 * - Heading text: Minimum 18px (1.125rem)
 * - Line height: Minimum 1.5× font size for body text
 * - Large text: ≥18pt (24px) or ≥14pt (18.67px) bold
 *
 * References:
 * - WCAG 2.1 SC 1.4.8 Visual Presentation
 * - WCAG 2.1 SC 1.4.12 Text Spacing
 */

export interface TextProperties {
  fontSize: number // in pixels
  fontWeight?: number | string // 100-900 or 'normal'|'bold'
  lineHeight?: number // unitless multiplier (e.g., 1.5)
  textType?: 'body' | 'heading' | 'caption' | 'label'
}

export interface ReadabilityResult {
  passes: boolean
  issues: ReadabilityIssue[]
  suggestions: string[]
}

export interface ReadabilityIssue {
  severity: 'critical' | 'serious' | 'moderate' | 'minor'
  message: string
  currentValue: number | string
  recommendedValue: number | string
}

/**
 * Minimum font sizes for different text types (in pixels)
 */
const MIN_FONT_SIZES = {
  body: 16,
  heading: 18,
  caption: 14,
  label: 14,
} as const

/**
 * Minimum line height multiplier
 */
const MIN_LINE_HEIGHT = 1.5

/**
 * Convert font weight string to numeric value
 */
function normalizeFontWeight(weight: number | string | undefined): number {
  if (typeof weight === 'number') return weight
  if (!weight) return 400 // Default to normal

  const weightMap: Record<string, number> = {
    thin: 100,
    hairline: 100,
    extralight: 200,
    ultralight: 200,
    light: 300,
    normal: 400,
    regular: 400,
    medium: 500,
    semibold: 600,
    demibold: 600,
    bold: 700,
    extrabold: 800,
    ultrabold: 800,
    black: 900,
    heavy: 900,
  }

  const normalized = weight.toString().toLowerCase()
  return weightMap[normalized] || 400
}

/**
 * Check if text qualifies as "large text" per WCAG
 * Large text: ≥18pt (24px) or ≥14pt (18.67px) bold
 *
 * @param fontSize - Font size in pixels
 * @param fontWeight - Font weight (100-900 or string)
 * @returns true if text is considered large
 */
export function isLargeText(fontSize: number, fontWeight?: number | string): boolean {
  const weight = normalizeFontWeight(fontWeight)

  // ≥18pt (24px) regular text
  if (fontSize >= 24) return true

  // ≥14pt (18.67px) bold text (weight ≥ 700)
  if (fontSize >= 18.67 && weight >= 700) return true

  return false
}

/**
 * Validate font size for accessibility
 *
 * @param fontSize - Font size in pixels
 * @param textType - Type of text (body, heading, caption, label)
 * @returns Validation result
 */
export function validateFontSize(
  fontSize: number,
  textType: TextProperties['textType'] = 'body'
): { passes: boolean; issue?: ReadabilityIssue } {
  const minSize = MIN_FONT_SIZES[textType]

  if (fontSize < minSize) {
    return {
      passes: false,
      issue: {
        severity: fontSize < minSize - 4 ? 'critical' : 'serious',
        message: `Font size too small for ${textType} text`,
        currentValue: `${fontSize}px`,
        recommendedValue: `${minSize}px or larger`,
      },
    }
  }

  return { passes: true }
}

/**
 * Validate line height for readability
 *
 * @param lineHeight - Line height as unitless multiplier (e.g., 1.5)
 * @param fontSize - Font size in pixels (for context)
 * @returns Validation result
 */
export function validateLineHeight(
  lineHeight: number | undefined,
  fontSize: number
): { passes: boolean; issue?: ReadabilityIssue } {
  if (!lineHeight) {
    return {
      passes: false,
      issue: {
        severity: 'moderate',
        message: 'No line height specified',
        currentValue: 'undefined',
        recommendedValue: `${MIN_LINE_HEIGHT} or greater`,
      },
    }
  }

  if (lineHeight < MIN_LINE_HEIGHT) {
    return {
      passes: false,
      issue: {
        severity: lineHeight < 1.2 ? 'serious' : 'moderate',
        message: 'Line height too tight for comfortable reading',
        currentValue: lineHeight.toString(),
        recommendedValue: `${MIN_LINE_HEIGHT} or greater`,
      },
    }
  }

  return { passes: true }
}

/**
 * Check overall text readability
 *
 * @param props - Text properties to validate
 * @returns Comprehensive readability result
 */
export function checkTextReadability(props: TextProperties): ReadabilityResult {
  const issues: ReadabilityIssue[] = []
  const suggestions: string[] = []

  // Validate font size
  const fontSizeResult = validateFontSize(props.fontSize, props.textType)
  if (!fontSizeResult.passes && fontSizeResult.issue) {
    issues.push(fontSizeResult.issue)
    suggestions.push(
      `Increase font size to at least ${MIN_FONT_SIZES[props.textType || 'body']}px for better readability`
    )
  }

  // Validate line height
  const lineHeightResult = validateLineHeight(props.lineHeight, props.fontSize)
  if (!lineHeightResult.passes && lineHeightResult.issue) {
    issues.push(lineHeightResult.issue)
    suggestions.push(
      `Use line-height of ${MIN_LINE_HEIGHT} or greater for comfortable reading`
    )
  }

  // Check for very small text with low weight
  const weight = normalizeFontWeight(props.fontWeight)
  if (props.fontSize < 14 && weight < 500) {
    issues.push({
      severity: 'critical',
      message: 'Very small text with thin font weight is extremely hard to read',
      currentValue: `${props.fontSize}px, weight ${weight}`,
      recommendedValue: 'Increase size to 16px+ or use heavier weight (500+)',
    })
    suggestions.push('Consider using at least 16px font size with medium weight (500) or heavier')
  }

  // Provide positive feedback for good readability
  if (issues.length === 0) {
    if (props.fontSize >= 18 && (props.lineHeight || 1.5) >= 1.6) {
      suggestions.push('Excellent readability! Font size and line height are well optimized.')
    } else if (props.fontSize >= 16 && (props.lineHeight || 1.5) >= 1.5) {
      suggestions.push('Good readability settings. Meets accessibility standards.')
    }
  }

  return {
    passes: issues.length === 0,
    issues,
    suggestions,
  }
}

/**
 * Get recommended font size based on text type
 *
 * @param textType - Type of text
 * @returns Recommended font size in pixels
 */
export function getRecommendedFontSize(textType: TextProperties['textType'] = 'body'): number {
  return MIN_FONT_SIZES[textType]
}

/**
 * Get recommended line height based on font size
 *
 * @param fontSize - Font size in pixels
 * @returns Recommended line height as unitless multiplier
 */
export function getRecommendedLineHeight(fontSize: number): number {
  // Smaller text benefits from slightly larger line height
  if (fontSize < 16) return 1.6
  if (fontSize < 20) return 1.5
  // Larger text can use slightly tighter line height
  return 1.4
}

/**
 * Auto-fix text properties for accessibility
 *
 * @param props - Current text properties
 * @returns Fixed text properties
 */
export function autoFixTextReadability(props: TextProperties): TextProperties {
  const minSize = MIN_FONT_SIZES[props.textType || 'body']
  const recommendedLineHeight = getRecommendedLineHeight(props.fontSize)

  return {
    ...props,
    fontSize: Math.max(props.fontSize, minSize),
    lineHeight: props.lineHeight && props.lineHeight >= MIN_LINE_HEIGHT
      ? props.lineHeight
      : recommendedLineHeight,
  }
}
