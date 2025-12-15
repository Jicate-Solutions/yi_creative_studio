/**
 * Feedback Learning Agent - Type Definitions
 *
 * Claude ADK agent for learning from user feedback and preventing issues
 * in creative generation. Three operational modes:
 * 1. UNDERSTAND: Build pipeline understanding
 * 2. ANALYZE: Process feedback and create patches
 * 3. PREVENT: Pre-check generation requests
 */

// ============================================================
// AGENT CORE TYPES
// ============================================================

export type AgentMode = 'understand' | 'analyze' | 'prevent'

export type AgentStage =
  | 'idle'
  | 'learning'
  | 'analyzing'
  | 'preventing'
  | 'complete'
  | 'error'

export interface AgentUsage {
  totalTokens: number
  inputTokens: number
  outputTokens: number
  totalDurationMs: number
  apiCalls: number
  estimatedCostUsd: number
}

export interface FeedbackLearningAgentState {
  stage: AgentStage
  mode: AgentMode
  sessionId: string | null
  pipelineUnderstanding: PipelineUnderstanding | null
  learnedPatterns: LearnedPattern[]
  currentAnalysis: AnalysisResult | null
  pendingPatches: KnowledgePatchRecord[]
  usage: AgentUsage
  error?: string
}

// ============================================================
// PIPELINE UNDERSTANDING TYPES
// ============================================================

export interface PipelineStage {
  id: string
  name: string
  order: number
  description: string
  inputType: string
  outputType: string
  filePath: string
  dependencies: string[]
  commonIssues: string[]
  modificationPoints: ModificationPoint[]
}

export interface ModificationPoint {
  name: string
  type: 'prompt_template' | 'config_value' | 'processing_logic' | 'validation'
  location: {
    file: string
    lineRange?: [number, number]
    functionName?: string
  }
  impactLevel: 'low' | 'medium' | 'high'
  rollbackable: boolean
}

export interface StageConnection {
  fromStage: string
  toStage: string
  dataFlow: string
  transformationType: string
}

export interface PipelineUnderstanding {
  version: number
  stages: PipelineStage[]
  interconnections: StageConnection[]
  formatSpecificPaths: Record<string, string[]>
  keyInsights: string[]
  totalFiles: number
  lastUpdated: string
}

// ============================================================
// LEARNED PATTERN TYPES
// ============================================================

export interface IssueSignature {
  categories: string[]
  keywords: string[]
  affectedFormats: string[]
  affectedStages: string[]
  minRating: number
  maxRating: number
}

export interface FixMapping {
  targetStage: string
  targetFile: string
  modificationPoint: string
  fixType: 'prompt_addition' | 'config_change' | 'logic_update' | 'prompt_injection'
  proposedChange: string
  reasoning: string
}

export interface PatternEffectiveness {
  timesApplied: number
  successRate: number
  feedbackImprovement: number
  lastEvaluated: string | null
}

export type PatternStatus = 'active' | 'deprecated' | 'testing'
export type PatternType = 'issue' | 'success' | 'configuration'

export interface LearnedPattern {
  id: string
  pattern_type: PatternType
  issue_signature: IssueSignature
  fix_mapping: FixMapping
  effectiveness: PatternEffectiveness
  confidence: number
  status: PatternStatus
  created_from_feedback_ids: string[]
  created_at: string
  updated_at: string
  /** v4.0: Semantic embedding for similarity matching */
  embedding?: number[]
}

// ============================================================
// ANALYSIS TYPES
// ============================================================

export interface AnalysisPattern {
  issue: string
  affectedFormats: string[]
  feedbackIds: string[]
  confidence: number
  suggestedFix: {
    targetFile: string
    targetStage: string
    patchType: 'addition' | 'modification'
    proposedChange: string
    reasoning: string
  }
}

export interface AnalysisResult {
  patterns: AnalysisPattern[]
  noActionNeeded: string[]
  feedbackAnalyzed: number
  patchesCreated: number
  tokensUsed: {
    input: number
    output: number
  }
}

export interface FeedbackSummary {
  id: string
  rating: number
  issues: string[]
  comment: string | null
  creativeType: string
  vertical: string | null
  promptExcerpt: string | null
}

// ============================================================
// PREVENTION TYPES
// ============================================================

export interface GenerationRequest {
  formatId: string
  formData: Record<string, unknown>
  designData?: Record<string, unknown>
  logosPlacements?: LogoPlacement[]
  organizationId: string
  userId?: string
}

export interface LogoPlacement {
  type: 'yi' | 'cii' | 'custom'
  position: string
  size: 'small' | 'medium' | 'large'
  url?: string
}

export interface PatternMatch {
  patternId: string
  pattern: LearnedPattern
  matchScore: number
  matchedKeywords: string[]
  matchedCategories: string[]
  /** v4.0: Semantic similarity score (0-1) if embeddings available */
  semanticScore?: number
}

export interface RequestAdjustment {
  id: string
  type: 'prompt_enhancement' | 'config_override' | 'warning' | 'field_modification'
  target: string
  originalValue: unknown
  suggestedValue: unknown
  reason: string
  patternId: string
  confidence: number
}

export interface PreventionResult {
  shouldAdjust: boolean
  confidence: number
  matchedPatterns: PatternMatch[]
  adjustments: RequestAdjustment[]
  reasoning: string
  sessionId?: string
}

// ============================================================
// KNOWLEDGE PATCH TYPES
// ============================================================

export type PatchStatus = 'pending_review' | 'approved' | 'rejected' | 'applied'
export type PatchType = 'addition' | 'modification' | 'removal'

export interface KnowledgePatchRecord {
  id: string
  target_file: string
  patch_type: PatchType
  original_content?: string
  proposed_content: string
  reasoning: string
  status: PatchStatus
  learned_pattern_id?: string
  auto_generated: boolean
  feedback_ids: string[]
  feedback_count: number
  pattern_confidence: number
  admin_reviewed_at?: string
  admin_reviewed_by?: string
  review_notes?: string
  created_at: string
  applied_at?: string
}

// ============================================================
// SESSION & AUDIT TYPES
// ============================================================

export interface AgentSession {
  id: string
  mode: AgentMode
  organization_id: string
  user_id: string
  state_snapshot?: FeedbackLearningAgentState
  input_summary?: Record<string, unknown>
  output_summary?: Record<string, unknown>
  patterns_matched: number
  patches_created: number
  adjustments_suggested: number
  started_at: string
  completed_at?: string
  duration_ms?: number
  total_tokens: number
  estimated_cost_usd: number
}

export interface PreventionAction {
  id: string
  session_id?: string
  creative_id?: string
  organization_id: string
  matched_patterns: string[]
  adjustments_applied: RequestAdjustment[]
  was_effective?: boolean
  feedback_rating?: number
  created_at: string
}

// ============================================================
// API REQUEST/RESPONSE TYPES
// ============================================================

// Understand Mode
export interface UnderstandRequest {
  forceRefresh?: boolean
  targetStages?: number[]
}

export interface UnderstandResponse {
  success: boolean
  pipelineUnderstanding: PipelineUnderstanding
  newInsights: string[]
  filesAnalyzed: number
  duration: number
  usage: AgentUsage
}

// Analyze Mode
export interface AnalyzeRequest {
  feedbackFilters?: {
    maxRating?: number
    minRating?: number
    creativeTypes?: string[]
    verticals?: string[]
    dateFrom?: string
    dateTo?: string
  }
  maxFeedback?: number
  minConfidence?: number
}

export interface AnalyzeResponse {
  success: boolean
  analyzed: number
  patternsFound: AnalysisPattern[]
  patchesCreated: KnowledgePatchRecord[]
  noActionItems: string[]
  usage: AgentUsage
}

// Prevent Mode
export interface PreventRequest {
  generationRequest: GenerationRequest
}

export interface PreventResponse {
  success: boolean
  shouldAdjust: boolean
  adjustments: RequestAdjustment[]
  matchedPatterns: PatternMatch[]
  confidence: number
  reasoning: string
  preventionActionId?: string
  usage: AgentUsage
}

// Patch Management
export interface PatchApprovalRequest {
  patchId: string
  action: 'approve' | 'reject'
  reviewNotes?: string
}

export interface PatchApplyRequest {
  patchId: string
}

// ============================================================
// CONSTANTS
// ============================================================

/** Confidence threshold for prevention adjustments */
export const PREVENTION_CONFIDENCE_THRESHOLD = 0.70

/** Confidence threshold for creating patches */
export const PATCH_CREATION_CONFIDENCE_THRESHOLD = 0.60

/** Success rate threshold for deprecating patterns */
export const PATTERN_DEPRECATION_THRESHOLD = 0.40

/** Minimum applications before evaluating pattern effectiveness */
export const MIN_APPLICATIONS_FOR_EVALUATION = 10

/** Maximum feedback items per analysis batch */
export const MAX_FEEDBACK_BATCH_SIZE = 50

/** Models for each agent mode */
export const AGENT_MODELS = {
  understand: 'claude-sonnet-4-20250514',
  analyze: 'claude-haiku-4-5-20251001',
  prevent: 'claude-haiku-4-5-20251001',
} as const

/** Pipeline stage definitions for understanding mode */
export const PIPELINE_STAGES = [
  {
    id: 'form_data_compilation',
    name: 'Form Data Compilation',
    order: 1,
    file: 'lib/prompts/services/form-data-compiler.ts',
  },
  {
    id: 'ultra_pro_prompt',
    name: 'Ultra-Pro Prompt Generation',
    order: 2,
    file: 'lib/prompts/services/ultra-pro-prompt.ts',
  },
  {
    id: 'design_intelligence',
    name: 'Design Intelligence',
    order: 3,
    file: 'lib/prompts/services/design-intelligence.ts',
  },
  {
    id: 'logo_awareness',
    name: 'Logo Awareness',
    order: 4,
    file: 'lib/prompts/helpers/logo-awareness.ts',
  },
  {
    id: 'theme_inference',
    name: 'Theme Inference',
    order: 5,
    file: 'lib/services/theme-inference.ts',
  },
  {
    id: 'prompt_building',
    name: 'Prompt Building',
    order: 6,
    file: 'lib/prompts/services/yi-prompt-builder/',
  },
  {
    id: 'image_generation',
    name: 'Image Generation',
    order: 7,
    file: 'app/api/generate/route.ts',
  },
  {
    id: 'post_processing',
    name: 'Post-Processing',
    order: 8,
    file: 'lib/sharp/logo-overlay.ts',
  },
  {
    id: 'storage_upload',
    name: 'Storage Upload',
    order: 9,
    file: 'app/api/generate/route.ts',
  },
  {
    id: 'cost_tracking',
    name: 'Cost Tracking',
    order: 10,
    file: 'lib/services/api-usage.ts',
  },
] as const

/** Issue categories that map to pipeline stages */
export const ISSUE_CATEGORY_STAGE_MAP: Record<string, string[]> = {
  text_rendering: ['ultra_pro_prompt', 'prompt_building', 'image_generation'],
  layout: ['design_intelligence', 'prompt_building', 'logo_awareness'],
  colors: ['design_intelligence', 'prompt_building'],
  logo: ['logo_awareness', 'post_processing'],
  style: ['design_intelligence', 'ultra_pro_prompt', 'prompt_building'],
  other: ['form_data_compilation', 'prompt_building'],
}
