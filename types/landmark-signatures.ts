/**
 * Landmark Signatures Types
 * Types for footer signature images (local landmark illustrations)
 * These are watercolor/sketch style illustrations of local landmarks
 * e.g., Gateway of India for Mumbai, Periyar Statue for Erode
 */

/**
 * Database row type for landmark_signatures table
 * Matches the Supabase schema exactly
 */
export interface LandmarkSignature {
  id: string
  organization_id: string
  name: string
  description: string | null
  city: string | null
  region: string | null
  file_url: string
  thumbnail_url: string | null
  file_size_bytes: number | null
  width: number | null
  height: number | null
  is_default: boolean | null
  created_by: string | null
  created_at: string | null
  updated_at: string | null
}

/**
 * Input for creating a new landmark signature
 */
export interface CreateLandmarkSignatureInput {
  name: string
  description?: string
  city?: string
  region?: string
  is_default?: boolean
}

/**
 * Input for updating an existing landmark signature
 */
export interface UpdateLandmarkSignatureInput {
  name?: string
  description?: string
  city?: string
  region?: string
  is_default?: boolean
}
