/**
 * Server-Sent Events (SSE) Streaming Image Generation API
 *
 * Phase 2: Progressive UI Updates
 * Streams generation progress in real-time instead of binary loading state
 *
 * Expected UX Improvement:
 * - Time to first feedback: 16s → 0.5s (-97%)
 * - Progress visibility: 1 update → 8-12 updates
 * - Perceived speed: -30-40%
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  StreamEvent,
  StreamStage,
  StreamStatus,
  DesignIntelligenceData,
  UltraProData,
  ImageGenerationData,
  LogoOverlayData,
  SpeakerOverlayData,
  UploadData,
  ErrorData,
} from '@/types/streaming.types'

// Feature flag: Enable/disable streaming
const STREAMING_ENABLED = process.env.NEXT_PUBLIC_ENABLE_STREAMING === 'true'

/**
 * POST /api/generate-stream
 *
 * Server-Sent Events endpoint for progressive image generation
 * Falls back to /api/generate if streaming disabled
 */
export async function POST(request: NextRequest) {
  // Feature flag check
  if (!STREAMING_ENABLED) {
    return NextResponse.json(
      { error: 'Streaming is not enabled. Use /api/generate instead.' },
      { status: 501 }
    )
  }

  // Verify authentication
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Parse request body
  let requestBody: any
  try {
    requestBody = await request.json()
  } catch (e) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  // Create SSE stream
  const encoder = new TextEncoder()
  let heartbeatInterval: NodeJS.Timeout | null = null

  const stream = new ReadableStream({
    async start(controller) {
      /**
       * Send SSE event helper
       * Format: data: {json}\n\n
       */
      const sendEvent = (event: StreamEvent) => {
        const sseData = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(encoder.encode(sseData))
      }

      /**
       * Send error event and close stream
       */
      const sendError = (stage: StreamStage, error: ErrorData) => {
        sendEvent({
          stage,
          status: 'error',
          progress: 0,
          timestamp: Date.now(),
          error,
        })
        controller.close()
      }

      try {
        // ============================================================
        // Stage 1: Design Intelligence (2-3s)
        // ============================================================
        sendEvent({
          stage: 'design_intelligence',
          status: 'started',
          progress: 0,
          timestamp: Date.now(),
        })

        const designStartTime = Date.now()

        // TODO: Call actual design intelligence function
        // For now, simulate with delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        const designIntelligenceData: DesignIntelligenceData = {
          visualElements: ['professional setting', 'modern design'],
          colorMood: 'Corporate blue with vibrant accents',
          backgroundSetting: 'Sleek office environment',
          preview: 'Found 5 visual elements',
        }

        sendEvent({
          stage: 'design_intelligence',
          status: 'complete',
          progress: 20,
          timestamp: Date.now(),
          data: designIntelligenceData,
        })

        console.log('[SSE Stream] Design Intelligence completed:', Date.now() - designStartTime, 'ms')

        // ============================================================
        // Stage 2: Ultra-Pro Prompt (1-2s)
        // ============================================================
        sendEvent({
          stage: 'ultra_pro',
          status: 'started',
          progress: 20,
          timestamp: Date.now(),
        })

        const ultraProStartTime = Date.now()

        // TODO: Call actual ultra-pro prompt function
        await new Promise(resolve => setTimeout(resolve, 1500))

        const ultraProData: UltraProData = {
          primaryText: requestBody.formData?.eventName || 'EVENT TITLE',
          headlineStrategy: 'Bold, uppercase, high contrast',
          preview: 'Optimized prompt for AI generation',
        }

        sendEvent({
          stage: 'ultra_pro',
          status: 'complete',
          progress: 35,
          timestamp: Date.now(),
          data: ultraProData,
        })

        console.log('[SSE Stream] Ultra-Pro completed:', Date.now() - ultraProStartTime, 'ms')

        // ============================================================
        // Stage 3: Image Generation (5-15s) with heartbeat
        // ============================================================
        sendEvent({
          stage: 'image_generation',
          status: 'started',
          progress: 35,
          timestamp: Date.now(),
        })

        const imageGenStartTime = Date.now()
        const estimatedImageGenTime = 10000 // 10 seconds estimate

        // Heartbeat: Send progress updates every 2s during image generation
        let imageGenElapsed = 0
        heartbeatInterval = setInterval(() => {
          imageGenElapsed = Date.now() - imageGenStartTime

          // Calculate progress within 35-70 range
          const ratio = Math.min(imageGenElapsed / estimatedImageGenTime, 1)
          const progress = 35 + (70 - 35) * ratio

          const heartbeatData: ImageGenerationData = {
            elapsedMs: imageGenElapsed,
            estimatedMs: estimatedImageGenTime,
            provider: 'gemini',
            model: 'gemini-2.5-flash-image',
          }

          sendEvent({
            stage: 'image_generation',
            status: 'in_progress',
            progress: Math.floor(progress),
            timestamp: Date.now(),
            data: heartbeatData,
          })

          console.log('[SSE Stream] Image generation heartbeat:', imageGenElapsed, 'ms')
        }, 2000)

        // TODO: Call actual image generation function
        await new Promise(resolve => setTimeout(resolve, 8000))

        // Clear heartbeat
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval)
          heartbeatInterval = null
        }

        sendEvent({
          stage: 'image_generation',
          status: 'complete',
          progress: 70,
          timestamp: Date.now(),
          data: {
            elapsedMs: Date.now() - imageGenStartTime,
            provider: 'gemini',
            model: 'gemini-2.5-flash-image',
          },
        })

        console.log('[SSE Stream] Image Generation completed:', Date.now() - imageGenStartTime, 'ms')

        // ============================================================
        // Stage 4: Logo Overlay (1-2s)
        // ============================================================
        sendEvent({
          stage: 'logo_overlay',
          status: 'started',
          progress: 70,
          timestamp: Date.now(),
        })

        const logoStartTime = Date.now()

        // TODO: Call actual logo overlay function
        await new Promise(resolve => setTimeout(resolve, 1500))

        const logoOverlayData: LogoOverlayData = {
          logosApplied: 2,
          positions: ['top-left', 'top-right'],
          preview: 'Added Yi + CII logos',
        }

        sendEvent({
          stage: 'logo_overlay',
          status: 'complete',
          progress: 85,
          timestamp: Date.now(),
          data: logoOverlayData,
        })

        console.log('[SSE Stream] Logo Overlay completed:', Date.now() - logoStartTime, 'ms')

        // ============================================================
        // Stage 5: Speaker Overlay (0.5-1s) - Optional
        // ============================================================
        const hasSpeakerPhoto = requestBody.formData?.speakerPhoto

        if (hasSpeakerPhoto) {
          sendEvent({
            stage: 'speaker_overlay',
            status: 'started',
            progress: 85,
            timestamp: Date.now(),
          })

          const speakerStartTime = Date.now()

          // TODO: Call actual speaker overlay function
          await new Promise(resolve => setTimeout(resolve, 750))

          const speakerOverlayData: SpeakerOverlayData = {
            speakerCount: 1,
            shape: 'circle',
          }

          sendEvent({
            stage: 'speaker_overlay',
            status: 'complete',
            progress: 92,
            timestamp: Date.now(),
            data: speakerOverlayData,
          })

          console.log('[SSE Stream] Speaker Overlay completed:', Date.now() - speakerStartTime, 'ms')
        } else {
          // Skip speaker overlay if no photo
          sendEvent({
            stage: 'speaker_overlay',
            status: 'complete',
            progress: 92,
            timestamp: Date.now(),
            data: {
              speakerCount: 0,
            },
          })
        }

        // ============================================================
        // Stage 6: Upload & Finalize (1-2s)
        // ============================================================
        sendEvent({
          stage: 'upload',
          status: 'started',
          progress: 92,
          timestamp: Date.now(),
        })

        const uploadStartTime = Date.now()

        // TODO: Call actual upload function
        await new Promise(resolve => setTimeout(resolve, 1500))

        const uploadData: UploadData = {
          finalImageUrl: 'https://example.com/final.jpg',
          thumbnailUrl: 'https://example.com/thumb.jpg',
          creativeId: 'creative-uuid-here',
          colorVerification: {
            allMatched: true,
            matchRate: 0.95,
          },
        }

        sendEvent({
          stage: 'upload',
          status: 'complete',
          progress: 100,
          timestamp: Date.now(),
          data: uploadData,
        })

        console.log('[SSE Stream] Upload completed:', Date.now() - uploadStartTime, 'ms')
        console.log('[SSE Stream] 🎉 Generation complete - Total time:', Date.now() - designStartTime, 'ms')

        // Close stream successfully
        controller.close()

      } catch (error) {
        console.error('[SSE Stream] Error during generation:', error)

        // Clear heartbeat if active
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval)
        }

        // Send error event
        const errorData: ErrorData = {
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'GENERATION_ERROR',
          stage: 'image_generation', // Default to image_generation
          recoverable: false,
        }

        sendError('image_generation', errorData)
      }
    },

    // Handle client disconnect
    cancel() {
      console.log('[SSE Stream] Client disconnected - cleaning up')
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
      }
    },
  })

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  })
}
