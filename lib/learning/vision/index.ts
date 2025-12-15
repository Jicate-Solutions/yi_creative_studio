/**
 * Vision Analysis Module Exports
 */

export {
  analyzeImage,
  saveVisionAnalysis,
  analyzeAndSave,
  quickQualityCheck,
} from './image-analyzer'

// Re-export types for convenience
export type {
  VisionAnalysis,
  VisionAnalysisRequest,
  DetectedIssue,
  CategoryScores,
} from '@/types/learning.types'
