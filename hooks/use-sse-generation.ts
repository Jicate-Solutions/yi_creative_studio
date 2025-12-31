/**
 * SSE Generation Hook
 *
 * Client-side hook for consuming Server-Sent Events from /api/generate-stream
 * Provides real-time progress updates during image generation
 *
 * Usage:
 * ```tsx
 * const { isGenerating, currentStage, progress, stageData, finalResult, startGeneration } = useSSEGeneration()
 *
 * async function handleGenerate() {
 *   await startGeneration({ formData, model, provider })
 * }
 * ```
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import type {
  StreamEvent,
  StreamStage,
  StreamEventData,
  UploadData,
  ErrorData,
  StreamingState,
} from '@/types/streaming.types'

interface UseSSEGenerationOptions {
  onStageComplete?: (stage: StreamStage, data?: StreamEventData) => void
  onProgress?: (progress: number, stage: StreamStage) => void
  onComplete?: (result: UploadData) => void
  onError?: (error: ErrorData) => void
}

interface GenerationPayload {
  formData: Record<string, any>
  model?: string
  provider?: string
  organizationId?: string
}

export function useSSEGeneration(options: UseSSEGenerationOptions = {}) {
  const [state, setState] = useState<StreamingState>({
    isGenerating: false,
    currentStage: null,
    progress: 0,
    stageData: {},
    finalResult: null,
    error: null,
    startedAt: null,
    completedAt: null,
  })

  // Ref to track EventSource for cleanup
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Start SSE generation
   */
  const startGeneration = useCallback(async (payload: GenerationPayload) => {
    // Reset state
    setState({
      isGenerating: true,
      currentStage: null,
      progress: 0,
      stageData: {},
      finalResult: null,
      error: null,
      startedAt: Date.now(),
      completedAt: null,
    })

    // Create AbortController for cancellation
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    try {
      // Make POST request to SSE endpoint
      const response = await fetch('/api/generate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      // Get reader from ReadableStream
      const reader = response.body.getReader()
      readerRef.current = reader
      const decoder = new TextDecoder()

      let buffer = ''

      // Read stream chunks
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log('[SSE Client] Stream closed')
          break
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete SSE messages (split by \n\n)
        const lines = buffer.split('\n\n')

        // Keep incomplete message in buffer
        buffer = lines.pop() || ''

        // Process each complete message
        for (const line of lines) {
          if (line.trim() === '') continue

          // Parse SSE message (format: "data: {json}")
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6) // Remove "data: " prefix
              const event: StreamEvent = JSON.parse(jsonStr)

              // Update state based on event
              handleStreamEvent(event)
            } catch (parseError) {
              console.error('[SSE Client] Failed to parse event:', parseError, line)
            }
          }
        }
      }

      // Mark as complete
      setState(prev => ({
        ...prev,
        isGenerating: false,
        completedAt: Date.now(),
      }))

    } catch (error) {
      console.error('[SSE Client] Stream error:', error)

      // Handle AbortError (user cancellation) silently
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[SSE Client] Generation cancelled by user')
      } else {
        // Other errors
        const errorData: ErrorData = {
          message: error instanceof Error ? error.message : 'Connection failed',
          code: 'STREAM_ERROR',
          stage: state.currentStage || 'design_intelligence',
          recoverable: true,
        }

        setState(prev => ({
          ...prev,
          isGenerating: false,
          error: errorData,
          completedAt: Date.now(),
        }))

        options.onError?.(errorData)
      }
    } finally {
      // Cleanup
      readerRef.current = null
      abortControllerRef.current = null
    }
  }, [options, state.currentStage])

  /**
   * Handle incoming stream event
   */
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    const { stage, status, progress, data, error } = event

    console.log('[SSE Client] Event:', stage, status, progress)

    setState(prev => {
      const newState = { ...prev }

      // Update current stage
      newState.currentStage = stage

      // Update progress
      newState.progress = progress

      // Store stage data
      if (data) {
        newState.stageData = {
          ...prev.stageData,
          [stage]: data,
        }
      }

      // Handle stage completion
      if (status === 'complete') {
        // If final stage (upload), store result
        if (stage === 'upload' && data) {
          newState.finalResult = data as UploadData
          newState.isGenerating = false
          newState.completedAt = Date.now()

          // Call completion callback
          options.onComplete?.(data as UploadData)
        }

        // Call stage completion callback
        options.onStageComplete?.(stage, data)
      }

      // Handle errors
      if (status === 'error' && error) {
        newState.error = error
        newState.isGenerating = false
        newState.completedAt = Date.now()

        options.onError?.(error)
      }

      // Call progress callback
      if (status === 'in_progress' || status === 'complete') {
        options.onProgress?.(progress, stage)
      }

      return newState
    })
  }, [options])

  /**
   * Cancel ongoing generation
   */
  const cancelGeneration = useCallback(() => {
    console.log('[SSE Client] Cancelling generation...')

    // Abort fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Close reader
    if (readerRef.current) {
      readerRef.current.cancel()
    }

    setState(prev => ({
      ...prev,
      isGenerating: false,
      completedAt: Date.now(),
    }))
  }, [])

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isGenerating: false,
      currentStage: null,
      progress: 0,
      stageData: {},
      finalResult: null,
      error: null,
      startedAt: null,
      completedAt: null,
    })
  }, [])

  return {
    // State
    isGenerating: state.isGenerating,
    currentStage: state.currentStage,
    progress: state.progress,
    stageData: state.stageData,
    finalResult: state.finalResult,
    error: state.error,
    startedAt: state.startedAt,
    completedAt: state.completedAt,

    // Computed
    duration: state.startedAt && state.completedAt
      ? state.completedAt - state.startedAt
      : state.startedAt
      ? Date.now() - state.startedAt
      : 0,

    // Actions
    startGeneration,
    cancelGeneration,
    reset,
  }
}
