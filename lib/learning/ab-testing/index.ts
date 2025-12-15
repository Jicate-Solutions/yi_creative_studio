/**
 * A/B Testing Module Exports
 */

// Experiment Manager
export {
  createExperiment,
  startExperiment,
  pauseExperiment,
  resumeExperiment,
  completeExperiment,
  promoteExperimentPattern,
  deprecateExperimentPattern,
  getExperiment,
  getRunningExperiments,
  getExperimentsForPattern,
  updateExperimentMetrics,
} from './experiment-manager'

// Traffic Router
export {
  routeToExperiment,
  routeRequestToExperiments,
  recordAssignment,
  recordAssignmentFeedback,
  findAssignmentByCreative,
  getAssignmentStats,
} from './traffic-router'

// Statistical Analyzer
export {
  analyzeExperiment,
  getTestResult,
  checkSignificance,
} from './statistical-analyzer'

// Auto Promoter
export {
  processRunningExperiments,
  manuallyPromote,
  manuallyDeprecate,
  getExperimentsReadyForDecision,
  getExperimentsSummary,
} from './auto-promoter'
