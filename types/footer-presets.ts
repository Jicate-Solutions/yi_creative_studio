/**
 * Footer Preset Type Definitions
 *
 * Enables saving and loading footer configurations (hashtag, website, social,
 * digital partner, styling) as reusable presets to reduce typing time.
 *
 * Follows the same pattern as logo-presets.ts for consistency.
 */

import type { FooterRowConfig } from '@/lib/config/design-constants'

/**
 * Database row type for footer_presets table
 */
export interface FooterPresetRow {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_default: boolean
  config: FooterRowConfig
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Input type for creating a new footer preset
 */
export interface FooterPresetInput {
  name: string
  description?: string | null
  is_default?: boolean
  config: FooterRowConfig
}

/**
 * Input type for updating an existing footer preset
 */
export interface FooterPresetUpdateInput {
  name?: string
  description?: string | null
  is_default?: boolean
  config?: FooterRowConfig
}

/**
 * Preset summary for dropdown display (lighter than full row)
 */
export interface FooterPresetSummary {
  id: string
  name: string
  description: string | null
  is_default: boolean
  updated_at: string
}
