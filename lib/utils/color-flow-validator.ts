import type { ResolvedColors } from '@/lib/utils/resolve-color-config'

/**
 * Color Flow Validator
 *
 * Validates that user-selected colors flow correctly through the prompt generation pipeline
 * without being overridden by hardcoded values.
 *
 * Usage:
 * ```typescript
 * const validation = validateColorFlow(
 *   'buildColorPaletteIntent',
 *   resolvedColors,
 *   { primary: paletteIntent.colors.primary, secondary: paletteIntent.colors.secondary }
 * )
 * if (!validation.valid) {
 *   console.warn('Color override detected!', validation.warnings)
 * }
 * ```
 */

export interface ColorValidationResult {
  valid: boolean
  warnings: string[]
  stage: string
}

/**
 * Validates that colors match expected values throughout the pipeline
 *
 * @param stage - Pipeline stage name for logging (e.g., 'buildColorPaletteIntent', 'ultra-pro-prompt')
 * @param expectedColors - The resolved colors that should be preserved
 * @param receivedColors - The actual colors being used at this stage
 * @returns Validation result with warnings if colors don't match
 */
export function validateColorFlow(
  stage: string,
  expectedColors: ResolvedColors,
  receivedColors?: { primary?: string; secondary?: string; accent?: string }
): ColorValidationResult {
  const warnings: string[] = []

  // Skip validation for fallback colors (these are intentional defaults)
  if (expectedColors.source === 'fallback') {
    return { valid: true, warnings: [], stage }
  }

  // Skip validation if no colors received (might be early in pipeline)
  if (!receivedColors) {
    return { valid: true, warnings: [], stage }
  }

  // Check primary color
  if (receivedColors.primary && receivedColors.primary !== expectedColors.primaryColor) {
    const warning = `[${stage}] PRIMARY COLOR MISMATCH: Expected ${expectedColors.primaryColor} (${expectedColors.source}) but got ${receivedColors.primary}`
    warnings.push(warning)
    console.warn('🎨 ' + warning)
  }

  // Check secondary color
  if (receivedColors.secondary && receivedColors.secondary !== expectedColors.secondaryColor) {
    const warning = `[${stage}] SECONDARY COLOR MISMATCH: Expected ${expectedColors.secondaryColor} (${expectedColors.source}) but got ${receivedColors.secondary}`
    warnings.push(warning)
    console.warn('🎨 ' + warning)
  }

  // Check accent color
  if (receivedColors.accent && receivedColors.accent !== expectedColors.accentColor) {
    const warning = `[${stage}] ACCENT COLOR MISMATCH: Expected ${expectedColors.accentColor} (${expectedColors.source}) but got ${receivedColors.accent}`
    warnings.push(warning)
    console.warn('🎨 ' + warning)
  }

  const valid = warnings.length === 0

  // Log success for debugging
  if (valid && receivedColors.primary) {
    console.log(`✅ [${stage}] Color flow valid: ${expectedColors.source} colors preserved`)
  }

  return {
    valid,
    warnings,
    stage
  }
}

/**
 * Validates that a color is a valid hex color code
 *
 * @param color - Color string to validate
 * @returns True if color is valid hex format (#RRGGBB)
 */
export function isValidHexColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color)
}

/**
 * Logs a summary of color flow through the pipeline
 *
 * @param validations - Array of validation results from different stages
 */
export function logColorFlowSummary(validations: ColorValidationResult[]): void {
  const totalStages = validations.length
  const validStages = validations.filter(v => v.valid).length
  const invalidStages = validations.filter(v => !v.valid)

  console.log('\n🎨 ========== COLOR FLOW VALIDATION SUMMARY ==========')
  console.log(`Total Stages: ${totalStages}`)
  console.log(`Valid: ${validStages} ✅`)
  console.log(`Invalid: ${invalidStages.length} ❌`)

  if (invalidStages.length > 0) {
    console.log('\n⚠️  Stages with color overrides:')
    invalidStages.forEach(stage => {
      console.log(`  - ${stage.stage}:`)
      stage.warnings.forEach(warning => console.log(`    ${warning}`))
    })
  } else {
    console.log('\n✅ All stages preserved user colors correctly!')
  }

  console.log('==================================================\n')
}
