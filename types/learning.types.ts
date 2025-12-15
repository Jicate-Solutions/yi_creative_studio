/**
 * Learning System Types
 *
 * Comprehensive type definitions for the 10/10 Learning Agent architecture:
 * - Pattern Cache
 * - Shadow Mode
 * - A/B Testing
 * - Multi-Layer Interventions
 * - Vision Analysis
 * - Success Patterns
 * - Rollback Safety
 * - Real-Time Learning
 */

// =============================================================================
// PATTERN TYPES
// =============================================================================

export type PatternCategory =
  | 'text_rendering'
  | 'layout'
  | 'colors'
  | 'logo'
  | 'style'
  | 'composition'
  | 'format_specific'

export type PatternSource = 'knowledge_base' | 'learned' | 'manual'

export type PatternStatus = 'active' | 'testing' | 'deprecated' | 'pending'

export interface IssueSignature {
  keywords: string[]
  conditions: SignatureCondition[]
  formatSpecific?: string[]
  excludeFormats?: string[]
  minConfidence?: number
}

export interface SignatureCondition {
  field: string
  operator: 'equals' | 'contains' | 'matches' | 'gt' | 'lt' | 'exists' | 'not_exists'
  value: string | number | boolean | string[]
  weight?: number
}

export interface FixMapping {
  layer: InterventionLayer
  targetStage: PipelineStage
  intervention: InterventionConfig
  fallbackLayers?: InterventionLayer[]
}

export interface InterventionConfig {
  type: InterventionType
  action: string
  parameters: Record<string, unknown>
  priority?: number
}

export type InterventionType =
  | 'field_modification'
  | 'prompt_injection'
  | 'design_context_override'
  | 'post_process_adjustment'
  | 'review_flag'
  | 'amplification'

export type InterventionLayer = 'L1_form_data' | 'L2_prompt' | 'L3_design_context' | 'L4_post_process' | 'L5_review_queue'

export type PipelineStage =
  | 'form_input'
  | 'field_generation'
  | 'form_compilation'
  | 'ultra_pro_prompt'
  | 'design_intelligence'
  | 'format_prompt_building'
  | 'image_generation'
  | 'logo_overlay'
  | 'post_processing'
  | 'delivery'

export interface SeededPattern {
  id: string
  patternKey: string
  category: PatternCategory
  name: string
  description: string
  issueSignature: IssueSignature
  fixMapping: FixMapping
  source: PatternSource
  confidence: number
  isActive: boolean
  version: number
  formatIds: string[]
  organizationId?: string
  timesApplied: number
  successRate: number
  lastAppliedAt?: string
  createdAt: string
  updatedAt: string
}

export interface PatternMatch {
  patternId: string
  patternKey: string
  confidence: number
  matchedConditions: string[]
  suggestedFix: FixMapping
  reasoning: string
}

// =============================================================================
// PATTERN CACHE TYPES
// =============================================================================

export interface PatternCacheState {
  id: string
  cacheVersion: number
  patternsHash: string
  totalPatterns: number
  patternsSnapshot: CachedPattern[]
  organizationId?: string
  scope: 'global' | 'organization'
  lastUpdated: string
  expiresAt: string
}

export interface CachedPattern {
  id: string
  patternKey: string
  category: PatternCategory
  issueSignature: IssueSignature
  fixMapping: FixMapping
  confidence: number
  formatIds: string[]
}

export interface PatternCacheConfig {
  maxPatterns: number
  ttlSeconds: number
  refreshIntervalMs: number
  enableHotReload: boolean
}

export interface CacheLookupResult {
  hit: boolean
  patterns: CachedPattern[]
  cacheVersion: number
  lookupTimeMs: number
}

// =============================================================================
// SHADOW MODE TYPES
// =============================================================================

export interface ShadowModeLog {
  id: string
  generationRequestId: string
  organizationId?: string
  userId?: string
  formatId: string
  matchedPatterns: PatternMatch[]
  wouldHaveAdjusted: boolean
  proposedAdjustments: ProposedAdjustment[]
  requestSnapshot: GenerationRequestSnapshot
  creativeId?: string
  feedbackId?: string
  feedbackRating?: number
  predictionAccurate?: boolean
  confidenceDelta?: number
  correlationNotes?: string
  createdAt: string
  correlatedAt?: string
}

export interface ProposedAdjustment {
  layer: InterventionLayer
  field: string
  originalValue: unknown
  proposedValue: unknown
  patternId: string
  reasoning: string
}

export interface GenerationRequestSnapshot {
  formatId: string
  formData: Record<string, unknown>
  designData?: Record<string, unknown>
  logosPlacements?: LogoPlacement[]
  organizationId?: string
  userId?: string
  timestamp: string
}

export interface LogoPlacement {
  type: 'yi' | 'cii' | 'custom'
  position: string
  size: 'small' | 'medium' | 'large'
}

export interface ShadowCorrelationResult {
  logId: string
  feedbackId: string
  feedbackRating: number
  predictionAccurate: boolean
  confidenceDelta: number
  patternsToAdjust: PatternConfidenceAdjustment[]
}

export interface PatternConfidenceAdjustment {
  patternId: string
  previousConfidence: number
  newConfidence: number
  reason: string
}

// =============================================================================
// A/B TESTING TYPES
// =============================================================================

export type ExperimentStatus = 'draft' | 'running' | 'paused' | 'completed' | 'promoted' | 'deprecated'

export type ExperimentVariant = 'control' | 'treatment'

export type ExperimentWinner = 'control' | 'treatment' | 'inconclusive'

export interface ABExperiment {
  id: string
  name: string
  description?: string
  patternId: string
  trafficPercentage: number
  status: ExperimentStatus
  minSamples: number
  confidenceLevel: number
  controlCount: number
  treatmentCount: number
  controlAvgRating: number
  treatmentAvgRating: number
  pValue?: number
  isSignificant: boolean
  winner?: ExperimentWinner
  results: ExperimentResults
  startedAt?: string
  completedAt?: string
  promotedAt?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface ExperimentResults {
  controlSamples: number
  treatmentSamples: number
  controlMean: number
  treatmentMean: number
  controlStdDev: number
  treatmentStdDev: number
  effectSize: number
  pValue: number
  confidenceInterval: [number, number]
  powerAnalysis?: PowerAnalysis
}

export interface PowerAnalysis {
  currentPower: number
  requiredSamples: number
  expectedDuration?: string
}

export interface ABAssignment {
  id: string
  experimentId: string
  creativeId?: string
  organizationId?: string
  userId?: string
  variant: ExperimentVariant
  patternApplied: boolean
  adjustmentsMade: ProposedAdjustment[]
  feedbackId?: string
  feedbackRating?: number
  feedbackReceivedAt?: string
  assignmentHash: string
  createdAt: string
}

export interface TrafficRoutingResult {
  experimentId: string
  variant: ExperimentVariant
  assignmentHash: string
  patternToApply?: SeededPattern
}

export interface StatisticalTestResult {
  testType: 'welch_t_test' | 'mann_whitney_u'
  pValue: number
  isSignificant: boolean
  effectSize: number
  confidenceInterval: [number, number]
  recommendation: 'promote' | 'deprecate' | 'continue' | 'inconclusive'
}

// =============================================================================
// INTERVENTION TYPES
// =============================================================================

export interface InterventionRequest {
  generationRequest: GenerationRequestSnapshot
  matchedPatterns: PatternMatch[]
  shadowMode: boolean
  experimentAssignment?: TrafficRoutingResult
}

export interface InterventionResult {
  applied: boolean
  layer: InterventionLayer
  adjustments: AppliedAdjustment[]
  modifiedRequest: GenerationRequestSnapshot
  processingTimeMs: number
  reasoning: string
}

export interface AppliedAdjustment {
  field: string
  originalValue: unknown
  newValue: unknown
  patternId: string
  layer: InterventionLayer
  confidence: number
}

export interface LayerInterventionResult {
  success: boolean
  adjustments: AppliedAdjustment[]
  skipped: boolean
  skipReason?: string
}

// =============================================================================
// VISION ANALYSIS TYPES
// =============================================================================

export interface VisionAnalysis {
  id: string
  creativeId: string
  organizationId?: string
  imageUrl: string
  formatId: string
  detectedIssues: DetectedIssue[]
  overallScore: number
  categoryScores: CategoryScores
  textReadabilityScore?: number
  logoPlacementScore?: number
  compositionScore?: number
  colorHarmonyScore?: number
  brandConsistencyScore?: number
  flagForReview: boolean
  reviewReasons: string[]
  reviewCompleted: boolean
  reviewNotes?: string
  reviewedBy?: string
  reviewedAt?: string
  modelUsed: string
  processingTimeMs: number
  rawResponse?: unknown
  createdAt: string
}

export interface DetectedIssue {
  category: PatternCategory
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location?: IssueLocation
  suggestedFix?: string
  confidence: number
  relatedPatternKey?: string
}

export interface IssueLocation {
  x: number
  y: number
  width: number
  height: number
  region: 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-center' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right'
}

export interface CategoryScores {
  textReadability: number
  logoPlacement: number
  composition: number
  colorHarmony: number
  brandConsistency: number
  overallQuality: number
}

export interface VisionAnalysisRequest {
  imageUrl: string
  formatId: string
  organizationId?: string
  creativeId?: string
  expectedElements?: ExpectedElement[]
}

export interface ExpectedElement {
  type: 'text' | 'logo' | 'image' | 'shape'
  description: string
  region?: string
  required: boolean
}

// =============================================================================
// SUCCESS PATTERNS TYPES
// =============================================================================

export interface SuccessPattern {
  id: string
  patternKey: string
  formatId: string
  organizationId?: string
  name: string
  description?: string
  successSignature: SuccessSignature
  amplificationHints: AmplificationHints
  sourceCreativeIds: string[]
  avgRating: number
  sampleCount: number
  confidence: number
  isActive: boolean
  timesApplied: number
  applicationSuccessRate: number
  lastAppliedAt?: string
  createdAt: string
  updatedAt: string
}

export interface SuccessSignature {
  formDataPatterns: Record<string, unknown>
  designContextPatterns: Record<string, unknown>
  commonKeywords: string[]
  colorSchemes?: string[]
  layoutPatterns?: string[]
  styleAttributes?: string[]
}

export interface AmplificationHints {
  promptEnhancements: string[]
  designSuggestions: string[]
  styleRecommendations: string[]
  colorPalette?: string[]
  layoutTips?: string[]
}

export interface SuccessExtractionResult {
  patternsFound: number
  newPatterns: SuccessPattern[]
  updatedPatterns: SuccessPattern[]
  sourceCreatives: string[]
}

// =============================================================================
// ROLLBACK TYPES
// =============================================================================

export type CheckpointType =
  | 'pattern_activation'
  | 'pattern_deprecation'
  | 'experiment_promotion'
  | 'bulk_update'
  | 'cache_refresh'

export type CheckpointEntityType = 'seeded_pattern' | 'success_pattern' | 'ab_experiment' | 'pattern_cache'

export interface RollbackCheckpoint {
  id: string
  checkpointType: CheckpointType
  entityType: CheckpointEntityType
  entityId?: string
  previousState: unknown
  newState: unknown
  changesSummary?: string
  reason?: string
  createdBy?: string
  organizationId?: string
  qualityScoreBefore?: number
  qualityScoreAfter?: number
  rolledBack: boolean
  rolledBackAt?: string
  rolledBackBy?: string
  rollbackReason?: string
  expiresAt: string
  createdAt: string
}

export interface RollbackRequest {
  checkpointId: string
  reason: string
  force?: boolean
}

export interface RollbackResult {
  success: boolean
  checkpointId: string
  restoredState: unknown
  affectedEntities: string[]
  message: string
}

export interface QualityGuardResult {
  passed: boolean
  scoreBefore: number
  scoreAfter: number
  threshold: number
  issues: string[]
  recommendation: 'proceed' | 'rollback' | 'review'
}

// =============================================================================
// GENERATION LINEAGE TYPES
// =============================================================================

export interface GenerationLineage {
  id: string
  creativeId?: string
  organizationId?: string
  userId?: string
  formatId: string
  pipelineTrace: PipelineTrace
  preventionActionId?: string
  patternsMatched: string[]
  adjustmentsApplied: AppliedAdjustment[]
  shadowMode: boolean
  abExperimentId?: string
  abVariant?: ExperimentVariant
  visionAnalysisId?: string
  feedbackId?: string
  feedbackRating?: number
  preventionHelped?: boolean
  processingTimeMs: number
  createdAt: string
  feedbackReceivedAt?: string
}

export interface PipelineTrace {
  stages: StageTrace[]
  totalDurationMs: number
  errors: StageError[]
  metadata: Record<string, unknown>
}

export interface StageTrace {
  stage: PipelineStage
  startTime: string
  endTime: string
  durationMs: number
  input: Record<string, unknown>
  output: Record<string, unknown>
  interventionsApplied: string[]
  success: boolean
  error?: string
}

export interface StageError {
  stage: PipelineStage
  error: string
  timestamp: string
  recoverable: boolean
}

// =============================================================================
// LEARNING QUEUE TYPES
// =============================================================================

export type LearningEventType =
  | 'feedback_received'
  | 'vision_issue_detected'
  | 'pattern_match_result'
  | 'ab_assignment'
  | 'shadow_correlation'
  | 'success_identified'
  | 'pattern_deprecation_candidate'

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'

export interface LearningQueueItem {
  id: string
  eventType: LearningEventType
  eventData: LearningEventData
  organizationId?: string
  creativeId?: string
  patternId?: string
  priority: number
  status: QueueStatus
  retryCount: number
  maxRetries: number
  errorMessage?: string
  processedAt?: string
  processedBy?: string
  result?: unknown
  createdAt: string
  scheduledFor: string
}

export type LearningEventData =
  | FeedbackReceivedEvent
  | VisionIssueEvent
  | PatternMatchEvent
  | ABAssignmentEvent
  | ShadowCorrelationEvent
  | SuccessIdentifiedEvent
  | PatternDeprecationEvent

export interface FeedbackReceivedEvent {
  type: 'feedback_received'
  feedbackId: string
  creativeId: string
  rating: number
  comment?: string
  preventionActionId?: string
  lineageId?: string
}

export interface VisionIssueEvent {
  type: 'vision_issue_detected'
  visionAnalysisId: string
  creativeId: string
  issues: DetectedIssue[]
  overallScore: number
}

export interface PatternMatchEvent {
  type: 'pattern_match_result'
  lineageId: string
  patternsMatched: PatternMatch[]
  adjustmentsApplied: AppliedAdjustment[]
  shadowMode: boolean
}

export interface ABAssignmentEvent {
  type: 'ab_assignment'
  assignmentId: string
  experimentId: string
  variant: ExperimentVariant
  creativeId?: string
}

export interface ShadowCorrelationEvent {
  type: 'shadow_correlation'
  shadowLogId: string
  feedbackId: string
  feedbackRating: number
  predictionAccurate: boolean
}

export interface SuccessIdentifiedEvent {
  type: 'success_identified'
  creativeId: string
  rating: number
  extractedSignature: SuccessSignature
}

export interface PatternDeprecationEvent {
  type: 'pattern_deprecation_candidate'
  patternId: string
  successRate: number
  timesApplied: number
  reason: string
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

export interface PreventionResponse {
  success: boolean
  shouldAdjust: boolean
  shadowMode: boolean
  matchedPatterns: PatternMatch[]
  adjustments: AppliedAdjustment[]
  modifiedRequest?: GenerationRequestSnapshot
  experimentAssignment?: TrafficRoutingResult
  lineageId?: string
  processingTimeMs: number
  cacheHit: boolean
  reasoning: string
}

export interface ShadowModeResponse {
  success: boolean
  logged: boolean
  logId: string
  matchedPatterns: PatternMatch[]
  wouldHaveAdjusted: boolean
  proposedAdjustments: ProposedAdjustment[]
}

export interface ExperimentResponse {
  success: boolean
  experiment: ABExperiment
  action?: 'created' | 'started' | 'paused' | 'completed' | 'promoted' | 'deprecated'
}

export interface VisionAnalysisResponse {
  success: boolean
  analysis: VisionAnalysis
  flaggedForReview: boolean
  suggestedPatterns: PatternMatch[]
}

export interface CacheRefreshResponse {
  success: boolean
  previousVersion: number
  newVersion: number
  patternsLoaded: number
  refreshTimeMs: number
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface LearningSystemConfig {
  shadowMode: {
    enabled: boolean
    correlationWindowHours: number
    minConfidenceForCorrelation: number
  }
  abTesting: {
    enabled: boolean
    defaultTrafficPercentage: number
    minSamplesForSignificance: number
    confidenceLevel: number
    autoPromoteThreshold: number
    autoDeprecateThreshold: number
  }
  patternCache: {
    enabled: boolean
    maxPatterns: number
    ttlSeconds: number
    refreshIntervalMs: number
    enableHotReload: boolean
  }
  interventions: {
    enabledLayers: InterventionLayer[]
    maxAdjustmentsPerRequest: number
    confidenceThreshold: number
  }
  visionAnalysis: {
    enabled: boolean
    autoAnalyze: boolean
    flagThreshold: number
    model: string
  }
  successPatterns: {
    enabled: boolean
    minRatingForSuccess: number
    minSamplesForPattern: number
    confidenceThreshold: number
  }
  rollback: {
    enabled: boolean
    checkpointRetentionDays: number
    qualityThreshold: number
    autoRollbackEnabled: boolean
  }
  realTime: {
    enabled: boolean
    queueProcessingIntervalMs: number
    maxRetries: number
    priorityBoostForHighRating: boolean
  }
}

export const DEFAULT_LEARNING_CONFIG: LearningSystemConfig = {
  shadowMode: {
    enabled: true,
    correlationWindowHours: 24,
    minConfidenceForCorrelation: 0.6,
  },
  abTesting: {
    enabled: true,
    defaultTrafficPercentage: 0.5,
    minSamplesForSignificance: 100,
    confidenceLevel: 0.95,
    autoPromoteThreshold: 0.05,
    autoDeprecateThreshold: 0.05,
  },
  patternCache: {
    enabled: true,
    maxPatterns: 500,
    ttlSeconds: 3600,
    refreshIntervalMs: 60000,
    enableHotReload: true,
  },
  interventions: {
    enabledLayers: ['L1_form_data', 'L2_prompt', 'L3_design_context', 'L4_post_process', 'L5_review_queue'],
    maxAdjustmentsPerRequest: 5,
    confidenceThreshold: 0.7,
  },
  visionAnalysis: {
    enabled: true,
    autoAnalyze: true,
    flagThreshold: 60,
    model: 'gemini-2.0-flash',
  },
  successPatterns: {
    enabled: true,
    minRatingForSuccess: 4,
    minSamplesForPattern: 3,
    confidenceThreshold: 0.7,
  },
  rollback: {
    enabled: true,
    checkpointRetentionDays: 30,
    qualityThreshold: 0.8,
    autoRollbackEnabled: false,
  },
  realTime: {
    enabled: true,
    queueProcessingIntervalMs: 5000,
    maxRetries: 3,
    priorityBoostForHighRating: true,
  },
}

// =============================================================================
// CONSTANTS
// =============================================================================

export const PATTERN_CACHE_VERSION = 1
export const SHADOW_CORRELATION_WINDOW_HOURS = 24
export const AB_MIN_SAMPLES_DEFAULT = 100
export const AB_CONFIDENCE_LEVEL_DEFAULT = 0.95
export const VISION_FLAG_THRESHOLD = 60
export const SUCCESS_PATTERN_MIN_RATING = 4
export const SUCCESS_PATTERN_MIN_SAMPLES = 3
export const ROLLBACK_RETENTION_DAYS = 30
export const QUEUE_MAX_RETRIES = 3
export const INTERVENTION_CONFIDENCE_THRESHOLD = 0.7
export const PATTERN_DEPRECATION_THRESHOLD = 0.3
export const MIN_APPLICATIONS_FOR_EVALUATION = 10
