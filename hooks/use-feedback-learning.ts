'use client'

/**
 * Feedback Learning Agent Admin Hook
 *
 * Provides admin controls for the Feedback Learning Agent:
 * - Trigger understand mode (build pipeline understanding)
 * - Trigger analyze mode (process feedback batch)
 * - View and manage pending patches
 * - View learned patterns and effectiveness stats
 */

import { useState, useCallback } from 'react'
import type {
  PipelineUnderstanding,
  LearnedPattern,
  KnowledgePatchRecord,
  UnderstandResponse,
  AnalyzeResponse,
  AnalyzeRequest,
} from '@/types/feedback-agent.types'

interface PatternEffectivenessStats {
  total: number
  active: number
  testing: number
  deprecated: number
  avgSuccessRate: number
  totalApplications: number
}

interface UseFeedbackLearningReturn {
  // State
  isUnderstanding: boolean
  isAnalyzing: boolean
  isLoadingPatches: boolean
  isLoadingPatterns: boolean
  pipelineUnderstanding: PipelineUnderstanding | null
  pendingPatches: KnowledgePatchRecord[]
  learnedPatterns: LearnedPattern[]
  effectivenessStats: PatternEffectivenessStats | null
  error: string | null

  // Actions
  triggerUnderstand: (forceRefresh?: boolean) => Promise<UnderstandResponse | null>
  triggerAnalysis: (options?: AnalyzeRequest) => Promise<AnalyzeResponse | null>
  loadPendingPatches: () => Promise<void>
  loadLearnedPatterns: () => Promise<void>
  loadEffectivenessStats: () => Promise<void>
  approvePatch: (patchId: string, reviewNotes?: string) => Promise<boolean>
  rejectPatch: (patchId: string, reviewNotes?: string) => Promise<boolean>
  applyPatch: (patchId: string) => Promise<boolean>
  clearError: () => void
}

export function useFeedbackLearning(): UseFeedbackLearningReturn {
  // Loading states
  const [isUnderstanding, setIsUnderstanding] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isLoadingPatches, setIsLoadingPatches] = useState(false)
  const [isLoadingPatterns, setIsLoadingPatterns] = useState(false)

  // Data states
  const [pipelineUnderstanding, setPipelineUnderstanding] = useState<PipelineUnderstanding | null>(null)
  const [pendingPatches, setPendingPatches] = useState<KnowledgePatchRecord[]>([])
  const [learnedPatterns, setLearnedPatterns] = useState<LearnedPattern[]>([])
  const [effectivenessStats, setEffectivenessStats] = useState<PatternEffectivenessStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  /**
   * Trigger understand mode to build pipeline understanding
   */
  const triggerUnderstand = useCallback(async (forceRefresh = false): Promise<UnderstandResponse | null> => {
    setIsUnderstanding(true)
    setError(null)

    try {
      const response = await fetch('/api/agents/feedback-learning/understand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRefresh }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run understand mode')
      }

      if (data.pipelineUnderstanding) {
        setPipelineUnderstanding(data.pipelineUnderstanding)
      }

      return data as UnderstandResponse
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setIsUnderstanding(false)
    }
  }, [])

  /**
   * Trigger analyze mode to process feedback batch
   */
  const triggerAnalysis = useCallback(async (options?: AnalyzeRequest): Promise<AnalyzeResponse | null> => {
    setIsAnalyzing(true)
    setError(null)

    try {
      const response = await fetch('/api/agents/feedback-learning/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options || {}),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run analyze mode')
      }

      // Refresh patches list after analysis
      if (data.patchesCreated?.length > 0) {
        await loadPendingPatches()
      }

      return data as AnalyzeResponse
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return null
    } finally {
      setIsAnalyzing(false)
    }
  }, [])

  /**
   * Load pending patches
   */
  const loadPendingPatches = useCallback(async (): Promise<void> => {
    setIsLoadingPatches(true)
    setError(null)

    try {
      const response = await fetch('/api/agents/feedback-learning/patches?status=pending')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load patches')
      }

      setPendingPatches(data.patches || [])
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setIsLoadingPatches(false)
    }
  }, [])

  /**
   * Load learned patterns
   */
  const loadLearnedPatterns = useCallback(async (): Promise<void> => {
    setIsLoadingPatterns(true)
    setError(null)

    try {
      // Note: This would need a separate endpoint or we can reuse from patches
      // For now, patterns are loaded with patches via the join
      const response = await fetch('/api/agents/feedback-learning/patches?status=pending')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load patterns')
      }

      // Extract unique patterns from patches
      const patterns = data.patches
        ?.filter((p: KnowledgePatchRecord & { learned_patterns?: LearnedPattern }) => p.learned_patterns)
        .map((p: KnowledgePatchRecord & { learned_patterns?: LearnedPattern }) => p.learned_patterns)
        .filter((p: LearnedPattern | undefined, i: number, arr: (LearnedPattern | undefined)[]) =>
          p && arr.findIndex(x => x?.id === p.id) === i
        ) || []

      setLearnedPatterns(patterns)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
    } finally {
      setIsLoadingPatterns(false)
    }
  }, [])

  /**
   * Load effectiveness stats
   */
  const loadEffectivenessStats = useCallback(async (): Promise<void> => {
    // This would need a dedicated endpoint
    // For now, set mock data or skip
    setEffectivenessStats({
      total: 0,
      active: 0,
      testing: 0,
      deprecated: 0,
      avgSuccessRate: 0,
      totalApplications: 0,
    })
  }, [])

  /**
   * Approve a pending patch
   */
  const approvePatch = useCallback(async (patchId: string, reviewNotes?: string): Promise<boolean> => {
    setError(null)

    try {
      const response = await fetch(`/api/agents/feedback-learning/patches/${patchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', reviewNotes }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve patch')
      }

      // Refresh patches list
      await loadPendingPatches()

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return false
    }
  }, [loadPendingPatches])

  /**
   * Reject a pending patch
   */
  const rejectPatch = useCallback(async (patchId: string, reviewNotes?: string): Promise<boolean> => {
    setError(null)

    try {
      const response = await fetch(`/api/agents/feedback-learning/patches/${patchId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reviewNotes }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject patch')
      }

      // Refresh patches list
      await loadPendingPatches()

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return false
    }
  }, [loadPendingPatches])

  /**
   * Apply an approved patch
   */
  const applyPatch = useCallback(async (patchId: string): Promise<boolean> => {
    setError(null)

    try {
      const response = await fetch(`/api/agents/feedback-learning/patches/${patchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to apply patch')
      }

      // Refresh patches list
      await loadPendingPatches()

      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      return false
    }
  }, [loadPendingPatches])

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    isUnderstanding,
    isAnalyzing,
    isLoadingPatches,
    isLoadingPatterns,
    pipelineUnderstanding,
    pendingPatches,
    learnedPatterns,
    effectivenessStats,
    error,

    // Actions
    triggerUnderstand,
    triggerAnalysis,
    loadPendingPatches,
    loadLearnedPatterns,
    loadEffectivenessStats,
    approvePatch,
    rejectPatch,
    applyPatch,
    clearError,
  }
}
