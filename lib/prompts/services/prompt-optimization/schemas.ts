/**
 * Zod Schemas for AI Output Validation
 *
 * Provides strict type validation for AI-generated outputs:
 * - Design Context from Design Intelligence
 * - Ultra-Pro Prompt structure
 * - Feedback patterns
 */

import { z } from 'zod'

// ============================================================
// DESIGN CONTEXT SCHEMA
// ============================================================

/**
 * Typography guidance from AI design analysis
 */
export const TypographyGuidanceSchema = z.object({
  headlineStyle: z.string().min(1).describe('Headline font style and weight'),
  bodyStyle: z.string().min(1).describe('Body text style'),
  hierarchy: z.string().min(1).describe('Size/weight hierarchy description'),
})

/**
 * Decorative elements from AI design analysis
 */
export const DecorativeElementsSchema = z.object({
  corners: z.string().min(1).describe('Corner treatment description'),
  patterns: z.string().min(1).describe('Pattern overlay description'),
  accents: z.string().min(1).describe('Accent elements description'),
})

/**
 * Complete Design Context from Design Intelligence stage
 */
export const DesignContextSchema = z.object({
  corePurpose: z.string().min(10).describe('Emotional job this design must accomplish'),
  desiredAction: z.string().min(5).describe('What viewers should do after seeing this'),
  emotionalJob: z.string().min(5).describe('How viewers should feel'),
  visualElements: z.array(z.string().min(3)).min(3).max(10).describe('Visual elements that belong in this design'),
  backgroundSetting: z.string().min(10).describe('Environment/backdrop description'),
  iconicImagery: z.array(z.string().min(3)).min(1).max(5).describe('Iconic imagery that reinforces message'),
  colorMood: z.string().min(5).describe('Color psychology guidance'),
  designStrategy: z.string().min(10).describe('Strategic visual approach'),
  successMetric: z.string().min(5).describe('How to know the design worked'),
  layoutGuidance: z.string().optional().describe('Specific layout guidance'),
  typographyGuidance: TypographyGuidanceSchema.optional(),
  decorativeElements: DecorativeElementsSchema.optional(),
  creativeTwist: z.string().optional().describe('Unique visual element for memorability'),
})

export type DesignContextValidated = z.infer<typeof DesignContextSchema>

// ============================================================
// ULTRA-PRO PROMPT SCHEMA
// ============================================================

/**
 * Ultra-Pro Prompt structure from prompt optimization stage
 */
export const UltraProPromptSchema = z.object({
  primaryText: z.string().min(1).describe('Main headline text'),
  secondaryText: z.array(z.string()).describe('Secondary text elements'),
  visualScene: z.string().min(10).describe('Visual scene/background description'),
  designGuidance: z.string().min(10).describe('Creative direction for layout'),
  textPlacementHints: z.string().min(5).describe('Where text should be positioned'),
  colorPaletteHints: z.string().min(5).describe('Color suggestions'),
  mustIncludeElements: z.array(z.string()).describe('Required visual elements'),
  enhancedPrompt: z.string().min(50).describe('Complete enhanced prompt'),
})

export type UltraProPromptValidated = z.infer<typeof UltraProPromptSchema>

// ============================================================
// FEEDBACK PATTERN SCHEMA
// ============================================================

/**
 * Learned pattern from feedback system
 */
export const FeedbackPatternSchema = z.object({
  patternId: z.string().describe('Unique pattern identifier'),
  formatId: z.string().describe('Format this pattern applies to'),
  patternType: z.enum(['prompt_enhancement', 'constraint_addition', 'style_modifier']),
  trigger: z.object({
    fieldName: z.string().optional(),
    fieldValue: z.string().optional(),
    eventType: z.string().optional(),
    condition: z.string().optional(),
  }),
  modification: z.object({
    action: z.enum(['prepend', 'append', 'replace', 'inject']),
    target: z.enum(['visualElements', 'backgroundSetting', 'colorMood', 'designStrategy', 'constraints']),
    content: z.string().min(5),
  }),
  confidence: z.number().min(0).max(1).describe('Confidence score 0-1'),
  successCount: z.number().int().min(0).describe('Number of successful applications'),
  failureCount: z.number().int().min(0).describe('Number of failed applications'),
  lastApplied: z.string().datetime().optional(),
})

export type FeedbackPattern = z.infer<typeof FeedbackPatternSchema>

// ============================================================
// VALIDATION UTILITIES
// ============================================================

/**
 * Validate Design Context with detailed error reporting
 */
export function validateDesignContext(data: unknown): {
  success: boolean
  data?: DesignContextValidated
  errors?: z.ZodIssue[]
} {
  const result = DesignContextSchema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  console.warn('[Schema Validation] Design Context validation failed:', result.error.issues)
  return { success: false, errors: result.error.issues }
}

/**
 * Validate Ultra-Pro Prompt with detailed error reporting
 */
export function validateUltraProPrompt(data: unknown): {
  success: boolean
  data?: UltraProPromptValidated
  errors?: z.ZodIssue[]
} {
  const result = UltraProPromptSchema.safeParse(data)

  if (result.success) {
    return { success: true, data: result.data }
  }

  console.warn('[Schema Validation] Ultra-Pro Prompt validation failed:', result.error.issues)
  return { success: false, errors: result.error.issues }
}

/**
 * Validate and fix common AI output issues
 * Returns fixed data or null if unfixable
 */
export function validateAndFixDesignContext(data: unknown): DesignContextValidated | null {
  // First try direct validation
  const directResult = DesignContextSchema.safeParse(data)
  if (directResult.success) {
    return directResult.data
  }

  // Try to fix common issues
  if (typeof data !== 'object' || data === null) {
    return null
  }

  const fixed = { ...data } as Record<string, unknown>

  // Fix: Ensure arrays are arrays
  if (fixed.visualElements && !Array.isArray(fixed.visualElements)) {
    fixed.visualElements = [String(fixed.visualElements)]
  }
  if (fixed.iconicImagery && !Array.isArray(fixed.iconicImagery)) {
    fixed.iconicImagery = [String(fixed.iconicImagery)]
  }

  // Fix: Ensure minimum array lengths
  if (Array.isArray(fixed.visualElements) && fixed.visualElements.length < 3) {
    while (fixed.visualElements.length < 3) {
      fixed.visualElements.push('professional design element')
    }
  }
  if (Array.isArray(fixed.iconicImagery) && fixed.iconicImagery.length < 1) {
    fixed.iconicImagery = ['thematic icon']
  }

  // Fix: Ensure string minimums
  const stringFields = ['corePurpose', 'backgroundSetting', 'designStrategy']
  for (const field of stringFields) {
    if (typeof fixed[field] === 'string' && (fixed[field] as string).length < 10) {
      fixed[field] = `${fixed[field]} - professional design approach`
    }
  }

  // Re-validate after fixes
  const fixedResult = DesignContextSchema.safeParse(fixed)
  if (fixedResult.success) {
    console.log('[Schema Validation] Design Context fixed and validated')
    return fixedResult.data
  }

  console.warn('[Schema Validation] Could not fix Design Context:', fixedResult.error.issues)
  return null
}

/**
 * Validate and fix Ultra-Pro Prompt
 */
export function validateAndFixUltraProPrompt(data: unknown): UltraProPromptValidated | null {
  const directResult = UltraProPromptSchema.safeParse(data)
  if (directResult.success) {
    return directResult.data
  }

  if (typeof data !== 'object' || data === null) {
    return null
  }

  const fixed = { ...data } as Record<string, unknown>

  // Fix: Ensure arrays
  if (!Array.isArray(fixed.secondaryText)) {
    fixed.secondaryText = fixed.secondaryText ? [String(fixed.secondaryText)] : []
  }
  if (!Array.isArray(fixed.mustIncludeElements)) {
    fixed.mustIncludeElements = fixed.mustIncludeElements ? [String(fixed.mustIncludeElements)] : []
  }

  // Fix: Ensure primary text
  if (!fixed.primaryText || typeof fixed.primaryText !== 'string') {
    fixed.primaryText = 'Event'
  }

  // Fix: Ensure enhanced prompt minimum length
  if (typeof fixed.enhancedPrompt === 'string' && fixed.enhancedPrompt.length < 50) {
    fixed.enhancedPrompt = `Professional design for ${fixed.primaryText}. ${fixed.enhancedPrompt}. Modern, clean aesthetic with clear typography.`
  }

  const fixedResult = UltraProPromptSchema.safeParse(fixed)
  if (fixedResult.success) {
    console.log('[Schema Validation] Ultra-Pro Prompt fixed and validated')
    return fixedResult.data
  }

  return null
}
