/**
 * Server-Sent Events (SSE) Streaming Types
 * For progressive image generation updates
 *
 * Phase 2 of Image Generation Pipeline Optimization
 */

// ============================================================
// STREAMING STAGES
// ============================================================

export type StreamStage =
  | 'design_intelligence'  // Stage 1: Analyzing event context (2-3s)
  | 'ultra_pro'            // Stage 2: Optimizing prompt (1-2s)
  | 'image_generation'     // Stage 3: Creating design (5-15s)
  | 'logo_overlay'         // Stage 4: Adding logos (1-2s)
  | 'speaker_overlay'      // Stage 5: Adding speaker photo (0.5-1s)
  | 'upload'               // Stage 6: Finalizing & upload (1-2s)

export type StreamStatus = 'started' | 'in_progress' | 'complete' | 'error'

// ============================================================
// STREAM EVENT TYPES
// ============================================================

/**
 * Base stream event structure
 * Sent as SSE: data: {json}\n\n
 */
export interface BaseStreamEvent {
  stage: StreamStage
  status: StreamStatus
  progress: number // 0-100
  timestamp: number
}

/**
 * Stage-specific data payloads
 */
export interface DesignIntelligenceData {
  visualElements?: string[]
  colorMood?: string
  backgroundSetting?: string
  preview: string
}

export interface UltraProData {
  primaryText?: string
  headlineStrategy?: string
  preview: string
}

export interface ImageGenerationData {
  elapsedMs: number
  estimatedMs?: number
  provider?: string
  model?: string
}

export interface LogoOverlayData {
  logosApplied: number
  positions?: string[]
  preview: string
}

export interface SpeakerOverlayData {
  speakerCount: number
  shape?: string
}

export interface UploadData {
  finalImageUrl: string
  thumbnailUrl?: string
  creativeId: string
  colorVerification?: {
    allMatched: boolean
    matchRate: number
  }
}

export interface ErrorData {
  message: string
  code?: string
  stage: StreamStage
  recoverable: boolean
}

// ============================================================
// STREAM EVENT UNIONS
// ============================================================

export type StreamEventData =
  | DesignIntelligenceData
  | UltraProData
  | ImageGenerationData
  | LogoOverlayData
  | SpeakerOverlayData
  | UploadData
  | ErrorData

export interface StreamEvent extends BaseStreamEvent {
  data?: StreamEventData
  error?: ErrorData
}

// ============================================================
// STREAMING REQUEST/RESPONSE
// ============================================================

/**
 * Request body for /api/generate-stream
 * (same as /api/generate but with streaming response)
 */
export interface StreamGenerationRequest {
  // Form data
  formData: Record<string, any>

  // AI settings
  model?: string
  provider?: string

  // Organization context
  organizationId?: string
}

/**
 * SSE message format
 * Follows Server-Sent Events specification
 */
export interface SSEMessage {
  event?: string // Optional event type
  data: string   // JSON-stringified StreamEvent
  id?: string    // Optional event ID for reconnection
  retry?: number // Optional reconnection timeout
}

// ============================================================
// CLIENT-SIDE STATE
// ============================================================

/**
 * Client-side streaming state
 * Used by useSSEGeneration hook
 */
export interface StreamingState {
  isGenerating: boolean
  currentStage: StreamStage | null
  progress: number
  stageData: Partial<Record<StreamStage, StreamEventData>>
  finalResult: UploadData | null
  error: ErrorData | null
  startedAt: number | null
  completedAt: number | null
}

/**
 * Stage metadata for UI rendering
 */
export interface StageMetadata {
  stage: StreamStage
  label: string
  icon: string // Lucide icon name
  estimatedDuration: number // milliseconds
  description: string
}

// ============================================================
// STAGE METADATA CONSTANTS
// ============================================================

export const STAGE_METADATA: Record<StreamStage, StageMetadata> = {
  design_intelligence: {
    stage: 'design_intelligence',
    label: 'Analyzing Context',
    icon: 'Brain',
    estimatedDuration: 2500,
    description: 'Understanding event theme and visual elements',
  },
  ultra_pro: {
    stage: 'ultra_pro',
    label: 'Optimizing Prompt',
    icon: 'Wand2',
    estimatedDuration: 1500,
    description: 'Enhancing design instructions for AI',
  },
  image_generation: {
    stage: 'image_generation',
    label: 'Creating Design',
    icon: 'Image',
    estimatedDuration: 10000,
    description: 'Generating image with AI',
  },
  logo_overlay: {
    stage: 'logo_overlay',
    label: 'Adding Logos',
    icon: 'Layers',
    estimatedDuration: 1500,
    description: 'Overlaying organization logos',
  },
  speaker_overlay: {
    stage: 'speaker_overlay',
    label: 'Adding Speaker',
    icon: 'User',
    estimatedDuration: 750,
    description: 'Overlaying speaker photo',
  },
  upload: {
    stage: 'upload',
    label: 'Finalizing',
    icon: 'Upload',
    estimatedDuration: 1500,
    description: 'Uploading and processing final image',
  },
}

// ============================================================
// PROGRESS CALCULATION
// ============================================================

/**
 * Progress ranges for each stage (0-100)
 */
export const STAGE_PROGRESS_RANGES: Record<StreamStage, { start: number; end: number }> = {
  design_intelligence: { start: 0, end: 20 },
  ultra_pro: { start: 20, end: 35 },
  image_generation: { start: 35, end: 70 },
  logo_overlay: { start: 70, end: 85 },
  speaker_overlay: { start: 85, end: 92 },
  upload: { start: 92, end: 100 },
}

/**
 * Calculate progress within a stage
 */
export function calculateStageProgress(
  stage: StreamStage,
  elapsedMs: number,
  estimatedMs?: number
): number {
  const range = STAGE_PROGRESS_RANGES[stage]
  const metadata = STAGE_METADATA[stage]

  const duration = estimatedMs || metadata.estimatedDuration
  const progressRatio = Math.min(elapsedMs / duration, 1)

  return range.start + (range.end - range.start) * progressRatio
}
