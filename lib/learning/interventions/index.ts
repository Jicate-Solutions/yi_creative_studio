/**
 * Multi-Layer Interventions Module Exports
 */

// Orchestrator
export {
  orchestrateInterventions,
  getInterventionStats,
  validateIntervention,
  createRollbackPoint,
} from './intervention-orchestrator'

// Layer 1: Form Data
export { applyFormDataIntervention } from './layer-1-form-data'

// Layer 2: Prompt
export {
  applyPromptIntervention,
  getPendingPromptInjections,
  clearPendingPromptInjections,
  formatInjectionsForPrompt,
  hasHighPriorityInjections,
} from './layer-2-prompt'

// Layer 3: Design Context
export {
  applyDesignContextIntervention,
  getPendingDesignOverrides,
  applyDesignOverrides,
  clearPendingDesignOverrides,
} from './layer-3-design-context'

// Layer 4: Post-Process
export {
  applyPostProcessIntervention,
  getPendingPostProcessAdjustments,
  applyToLogoOverlayOptions,
  getColorCorrectionParams,
  clearPendingPostProcessAdjustments,
} from './layer-4-post-process'

// Layer 5: Review Queue
export {
  applyReviewQueueIntervention,
  shouldFlagForReview,
  getReviewFlags,
  getHighestSeverityFlag,
  hasCriticalFlags,
  addToReviewQueue,
  resolveReviewItem,
  getPendingReviewItems,
  clearPendingReviewFlags,
} from './layer-5-review-queue'
