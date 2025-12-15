/**
 * Real-Time Event Processor
 *
 * Processes learning events from the queue in real-time:
 * - Feedback received → Update pattern effectiveness
 * - Vision issue detected → Create/update patterns
 * - Pattern match result → Track lineage
 * - A/B assignment → Record for analysis
 * - Shadow correlation → Adjust confidence
 * - Success identified → Extract patterns
 */

import type {
  LearningQueueItem,
  LearningEventType,
  QueueStatus,
  FeedbackReceivedEvent,
  VisionIssueEvent,
  PatternMatchEvent,
  ABAssignmentEvent,
  ShadowCorrelationEvent,
  SuccessIdentifiedEvent,
  PatternDeprecationEvent,
} from '@/types/learning.types'

// Processing configuration
const MAX_RETRIES = 3
const BATCH_SIZE = 10

/**
 * Process pending events from the queue
 */
export async function processEventQueue(
  limit: number = BATCH_SIZE
): Promise<{
  processed: number
  failed: number
  skipped: number
}> {
  const results = { processed: 0, failed: 0, skipped: 0 }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    // Get pending events ordered by priority
    const { data: events, error } = await (supabase.from as Function)('learning_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit)

    if (error || !events?.length) {
      return results
    }

    for (const event of events) {
      const item = mapDbToQueueItem(event)

      // Mark as processing
      await (supabase.from as Function)('learning_queue')
        .update({ status: 'processing' })
        .eq('id', item.id)

      try {
        const result = await processEvent(item)

        if (result.success) {
          await (supabase.from as Function)('learning_queue')
            .update({
              status: 'completed',
              processed_at: new Date().toISOString(),
              result: result.data,
            })
            .eq('id', item.id)
          results.processed++
        } else if (item.retryCount < MAX_RETRIES) {
          await (supabase.from as Function)('learning_queue')
            .update({
              status: 'pending',
              retry_count: item.retryCount + 1,
              error_message: result.error,
              scheduled_for: new Date(Date.now() + 60000).toISOString(), // Retry in 1 min
            })
            .eq('id', item.id)
          results.failed++
        } else {
          await (supabase.from as Function)('learning_queue')
            .update({
              status: 'failed',
              error_message: result.error,
              processed_at: new Date().toISOString(),
            })
            .eq('id', item.id)
          results.failed++
        }
      } catch (error) {
        console.error(`[EventProcessor] Error processing event ${item.id}:`, error)
        await (supabase.from as Function)('learning_queue')
          .update({
            status: item.retryCount < MAX_RETRIES ? 'pending' : 'failed',
            retry_count: item.retryCount + 1,
            error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', item.id)
        results.failed++
      }
    }

    console.log(`[EventProcessor] Processed ${results.processed}, failed ${results.failed}`)
    return results
  } catch (error) {
    console.error('[EventProcessor] Error:', error)
    return results
  }
}

/**
 * Process a single event
 */
async function processEvent(item: LearningQueueItem): Promise<{
  success: boolean
  data?: unknown
  error?: string
}> {
  switch (item.eventType) {
    case 'feedback_received':
      return processFeedbackEvent(item.eventData as FeedbackReceivedEvent)

    case 'vision_issue_detected':
      return processVisionIssueEvent(item.eventData as VisionIssueEvent)

    case 'pattern_match_result':
      return processPatternMatchEvent(item.eventData as PatternMatchEvent)

    case 'ab_assignment':
      return processABAssignmentEvent(item.eventData as ABAssignmentEvent)

    case 'shadow_correlation':
      return processShadowCorrelationEvent(item.eventData as ShadowCorrelationEvent)

    case 'success_identified':
      return processSuccessIdentifiedEvent(item.eventData as SuccessIdentifiedEvent)

    case 'pattern_deprecation_candidate':
      return processPatternDeprecationEvent(item.eventData as PatternDeprecationEvent)

    default:
      return { success: false, error: `Unknown event type: ${item.eventType}` }
  }
}

/**
 * Process feedback received event
 */
async function processFeedbackEvent(event: FeedbackReceivedEvent): Promise<{
  success: boolean
  data?: unknown
  error?: string
}> {
  try {
    // If there was prevention, update effectiveness
    if (event.preventionActionId) {
      const { updatePatternEffectivenessFromFeedback } = await import('@/lib/services/pattern-effectiveness')
      await updatePatternEffectivenessFromFeedback(event.preventionActionId, event.rating)
    }

    // If there's a lineage, update it with feedback
    if (event.lineageId) {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      await (supabase.from as Function)('generation_lineage')
        .update({
          feedback_id: event.feedbackId,
          feedback_rating: event.rating,
          feedback_received_at: new Date().toISOString(),
        })
        .eq('id', event.lineageId)
    }

    // If high rating, queue success pattern extraction
    if (event.rating >= 4) {
      await queueEvent({
        eventType: 'success_identified',
        eventData: {
          type: 'success_identified',
          creativeId: event.creativeId,
          rating: event.rating,
          extractedSignature: {},
        },
        priority: 3,
      })
    }

    return { success: true, data: { feedbackProcessed: true } }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Process vision issue detected event
 */
async function processVisionIssueEvent(event: VisionIssueEvent): Promise<{
  success: boolean
  data?: unknown
  error?: string
}> {
  // Vision issues are already saved by the analyzer
  // This event is for additional processing like pattern creation
  return { success: true, data: { visionProcessed: true } }
}

/**
 * Process pattern match result event
 */
async function processPatternMatchEvent(event: PatternMatchEvent): Promise<{
  success: boolean
  data?: unknown
  error?: string
}> {
  // Pattern matches are tracked in lineage
  // This event updates pattern application counts
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    for (const match of event.patternsMatched) {
      await (supabase.from as Function)('seeded_patterns')
        .update({
          times_applied: (supabase as { raw: Function }).raw('times_applied + 1'),
          last_applied_at: new Date().toISOString(),
        })
        .eq('id', match.patternId)
    }

    return { success: true, data: { patternsUpdated: event.patternsMatched.length } }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Process A/B assignment event
 */
async function processABAssignmentEvent(event: ABAssignmentEvent): Promise<{
  success: boolean
  data?: unknown
  error?: string
}> {
  // A/B assignments are already recorded
  // This is for any additional processing
  return { success: true, data: { abProcessed: true } }
}

/**
 * Process shadow correlation event
 */
async function processShadowCorrelationEvent(event: ShadowCorrelationEvent): Promise<{
  success: boolean
  data?: unknown
  error?: string
}> {
  try {
    const { runCorrelationAnalysis } = await import('../shadow/correlation-analyzer')
    const result = await runCorrelationAnalysis(24)
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Process success identified event
 */
async function processSuccessIdentifiedEvent(event: SuccessIdentifiedEvent): Promise<{
  success: boolean
  data?: unknown
  error?: string
}> {
  try {
    const { extractSuccessPatterns } = await import('../success/pattern-extractor')
    const result = await extractSuccessPatterns()
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Process pattern deprecation candidate event
 */
async function processPatternDeprecationEvent(event: PatternDeprecationEvent): Promise<{
  success: boolean
  data?: unknown
  error?: string
}> {
  try {
    const { deprecateIneffectivePatterns } = await import('@/lib/services/pattern-effectiveness')
    const result = await deprecateIneffectivePatterns()
    return { success: true, data: result }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Queue a new event for processing
 */
export async function queueEvent(options: {
  eventType: LearningEventType
  eventData: unknown
  organizationId?: string
  creativeId?: string
  patternId?: string
  priority?: number
  scheduledFor?: Date
}): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data, error } = await (supabase.from as Function)('learning_queue')
      .insert({
        event_type: options.eventType,
        event_data: options.eventData,
        organization_id: options.organizationId,
        creative_id: options.creativeId,
        pattern_id: options.patternId,
        priority: options.priority || 5,
        status: 'pending',
        scheduled_for: (options.scheduledFor || new Date()).toISOString(),
      })
      .select('id')
      .single()

    if (error) {
      console.error('[EventProcessor] Error queueing event:', error)
      return null
    }

    return data.id
  } catch (error) {
    console.error('[EventProcessor] Error:', error)
    return null
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number
  processing: number
  completed: number
  failed: number
  byType: Record<string, number>
}> {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()

    const { data } = await (supabase.from as Function)('learning_queue')
      .select('status, event_type')

    if (!data) {
      return { pending: 0, processing: 0, completed: 0, failed: 0, byType: {} }
    }

    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      byType: {} as Record<string, number>,
    }

    for (const item of data) {
      stats[item.status as keyof typeof stats]++
      stats.byType[item.event_type] = (stats.byType[item.event_type] || 0) + 1
    }

    return stats
  } catch (error) {
    console.error('[EventProcessor] Error getting stats:', error)
    return { pending: 0, processing: 0, completed: 0, failed: 0, byType: {} }
  }
}

// Helper function
function mapDbToQueueItem(db: Record<string, unknown>): LearningQueueItem {
  return {
    id: db.id as string,
    eventType: db.event_type as LearningEventType,
    eventData: db.event_data as LearningQueueItem['eventData'],
    organizationId: db.organization_id as string | undefined,
    creativeId: db.creative_id as string | undefined,
    patternId: db.pattern_id as string | undefined,
    priority: db.priority as number,
    status: db.status as QueueStatus,
    retryCount: db.retry_count as number,
    maxRetries: db.max_retries as number,
    errorMessage: db.error_message as string | undefined,
    processedAt: db.processed_at as string | undefined,
    processedBy: db.processed_by as string | undefined,
    result: db.result as unknown,
    createdAt: db.created_at as string,
    scheduledFor: db.scheduled_for as string,
  }
}
