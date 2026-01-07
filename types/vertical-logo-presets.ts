/**
 * Vertical Logo Preset Type Definitions
 *
 * Enables saving and loading ROW 2 (Program Logos) configurations
 * as reusable presets for quick selection across creatives.
 *
 * Follows the same pattern as footer-presets.ts for consistency.
 */

/**
 * Database row type for vertical_logo_presets table
 */
export interface VerticalLogoPresetRow {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_default: boolean
  logo_ids: string[] // Array of logo UUIDs
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Input type for creating a new vertical logo preset
 */
export interface VerticalLogoPresetInput {
  name: string
  description?: string | null
  is_default?: boolean
  logo_ids: string[]
}

/**
 * Input type for updating an existing vertical logo preset
 */
export interface VerticalLogoPresetUpdateInput {
  name?: string
  description?: string | null
  is_default?: boolean
  logo_ids?: string[]
}

/**
 * Preset summary for dropdown display (lighter than full row)
 */
export interface VerticalLogoPresetSummary {
  id: string
  name: string
  description: string | null
  is_default: boolean
  logo_count: number
  updated_at: string
}
