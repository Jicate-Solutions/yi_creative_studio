/**
 * Logo Presets Types
 * Types for saved logo configuration presets
 */

import type { LogoPosition } from '@/lib/config/constants'
import type { LogoSizePreset, LogoBackgroundShape, LogoBackgroundStyle } from '@/lib/constants/logoConstants'

/**
 * Individual logo placement within a preset
 * Stores the essential info needed to recreate a placement
 */
export interface LogoPresetPlacement {
  logoId: string           // UUID of organization_logos record
  logoName: string         // Cached name for display (in case logo deleted)
  position: LogoPosition   // Grid position ('top-1' through 'bottom-6')
  size: LogoSizePreset     // Size preset ('small' | 'medium' | 'large' | 'xlarge')
  // Background options (optional for backward compatibility)
  backgroundShape?: LogoBackgroundShape   // 'none' | 'rectangle' | 'rounded' | 'circle'
  backgroundStyle?: LogoBackgroundStyle   // { shadow: boolean, border: boolean }
}

/**
 * Complete logo preset as stored in database
 */
export interface LogoPreset {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_default: boolean
  placements: LogoPresetPlacement[]
  created_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Input for creating a new logo preset
 */
export interface CreateLogoPresetInput {
  name: string
  description?: string
  is_default?: boolean
  placements: LogoPresetPlacement[]
}

/**
 * Input for updating an existing logo preset
 */
export interface UpdateLogoPresetInput {
  name?: string
  description?: string
  is_default?: boolean
  placements?: LogoPresetPlacement[]
}

/**
 * Database row type (matches Supabase schema)
 */
export interface LogoPresetRow {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_default: boolean
  placements: LogoPresetPlacement[] // JSONB column
  created_by: string | null
  created_at: string
  updated_at: string
}
