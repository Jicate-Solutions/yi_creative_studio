/**
 * Initiative Preset Type Definitions
 *
 * Enables saving and loading initiative/chapter name configurations (Row 3)
 * as reusable presets to reduce typing time.
 *
 * Follows the same pattern as footer-presets.ts for consistency.
 */

import type { InitiativeTextConfig } from '@/lib/config/design-constants'

/**
 * Database row type for initiative_presets table
 */
export interface InitiativePresetRow {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_default: boolean
  config: InitiativeTextConfig
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Input type for creating a new initiative preset
 */
export interface InitiativePresetInput {
  name: string
  description?: string | null
  is_default?: boolean
  config: InitiativeTextConfig
}

/**
 * Input type for updating an existing initiative preset
 */
export interface InitiativePresetUpdateInput {
  name?: string
  description?: string | null
  is_default?: boolean
  config?: InitiativeTextConfig
}

/**
 * Preset summary for dropdown display (lighter than full row)
 */
export interface InitiativePresetSummary {
  id: string
  name: string
  description: string | null
  is_default: boolean
  updated_at: string
}
