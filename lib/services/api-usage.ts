/**
 * API Usage Tracking Service
 *
 * Tracks AI API usage (tokens, costs) for analytics and cost control.
 * Logs to the api_usage table in Supabase.
 */

import { createClient } from '@/lib/supabase/server'
import {
  calculateTokenCost,
  calculateImageCost,
  getModelPricing,
  type AIProvider,
  type RequestType,
} from '@/lib/config/ai-pricing'
import { convertToINR, formatDualCurrency } from './currency'
import type { Database, Json } from '@/types/database.types'

// Type alias for api_usage table row
type ApiUsageRow = Database['public']['Tables']['api_usage']['Row']
type ApiUsageInsert = Database['public']['Tables']['api_usage']['Insert']

// ============================================================
// HELPERS
// ============================================================

/**
 * Safely convert a value to a number, returning 0 for NaN, null, undefined
 * This is safer than `Number(x) || 0` because NaN || 0 still returns NaN
 */
function safeNumber(value: unknown): number {
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

// ============================================================
// TYPES
// ============================================================

export interface TokenUsage {
  inputTokens: number
  outputTokens: number
  cachedTokens?: number
  totalTokens: number
}

export interface ApiUsageRecord {
  organizationId: string
  userId: string
  creativeId?: string | null
  requestType: RequestType
  provider: AIProvider
  model: string
  inputTokens: number
  outputTokens: number
  cachedTokens?: number
  imageCount?: number
  estimatedCostUsd: number
  durationMs?: number
  success: boolean
  errorMessage?: string | null
  promptLength?: number
  metadata?: Json
}

export interface UsageAnalytics {
  totalCostUsd: number
  totalCostInr: number
  totalInputTokens: number
  totalOutputTokens: number
  totalCachedTokens: number
  totalImages: number
  byProvider: Record<AIProvider, {
    costUsd: number
    inputTokens: number
    outputTokens: number
    requestCount: number
  }>
  byRequestType: Record<string, {
    costUsd: number
    inputTokens: number
    outputTokens: number
    requestCount: number
  }>
  byModel: Record<string, {
    costUsd: number
    inputTokens: number
    outputTokens: number
    requestCount: number
  }>
  dailyTrend: Array<{
    date: string
    costUsd: number
    requestCount: number
    inputTokens: number
    outputTokens: number
  }>
  recentRecords: Array<{
    id: string
    createdAt: string
    requestType: string
    provider: string
    model: string
    costUsd: number
    inputTokens: number
    outputTokens: number
  }>
}

// ============================================================
// TRACKING FUNCTIONS
// ============================================================

/**
 * Retry with exponential backoff
 * @param fn Function to retry
 * @param maxRetries Maximum retry attempts (default: 3)
 * @param baseDelay Base delay in ms (default: 1000)
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T | null> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1

      if (isLastAttempt) {
        console.error(`[Retry] All ${maxRetries} attempts failed:`, error)
        return null
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt)
      console.warn(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  return null
}

/**
 * Track API usage - logs to the api_usage table with retry logic
 */
export async function trackApiUsage(record: ApiUsageRecord): Promise<void> {
  try {
    const result = await retryWithBackoff(async () => {
      const supabase = await createClient()

      const insertData: ApiUsageInsert = {
        organization_id: record.organizationId,
        user_id: record.userId,
        creative_id: record.creativeId,
        request_type: record.requestType,
        provider: record.provider,
        model: record.model,
        input_tokens: record.inputTokens,
        output_tokens: record.outputTokens,
        cached_tokens: record.cachedTokens || 0,
        image_count: record.imageCount || 0,
        estimated_cost_usd: record.estimatedCostUsd,
        duration_ms: record.durationMs,
        success: record.success,
        error_message: record.errorMessage,
        prompt_length: record.promptLength,
        metadata: record.metadata || {},
      }

      const { error } = await supabase.from('api_usage').insert(insertData)

      if (error) throw error

      console.log(
        `[API Usage] Tracked: ${record.requestType} | ${record.provider}/${record.model} | ` +
        `${record.inputTokens + record.outputTokens} tokens | $${record.estimatedCostUsd.toFixed(4)}`
      )
      return true
    }, 3, 1000) // 3 retries with 1s base delay

    if (!result) {
      console.error('[API Usage] Failed to track after 3 retries (non-blocking)')
    }
  } catch (err) {
    console.error('[API Usage] Unexpected error:', err)
  }
}

/**
 * Create a usage tracker for a specific request
 * Returns functions to log token usage throughout the request lifecycle
 */
export function createUsageTracker(params: {
  organizationId: string
  userId: string
  creativeId?: string
}) {
  const records: ApiUsageRecord[] = []

  return {
    /**
     * Track a single API call
     */
    track: async (
      requestType: RequestType,
      provider: AIProvider,
      model: string,
      usage: {
        inputTokens: number
        outputTokens: number
        cachedTokens?: number
        imageCount?: number
        durationMs?: number
        promptLength?: number
        success?: boolean
        errorMessage?: string
        resolution?: '512px' | '1K' | '2K' | '4K'  // For resolution-based pricing (Gemini 3 Pro / NB2)
        imageQuality?: 'low' | 'medium' | 'high'     // For OpenAI GPT-image-1 quality-tier pricing
      }
    ) => {
      // Calculate cost based on whether this is image or text generation
      let costUsd = 0
      const pricing = getModelPricing(provider, model)

      if (usage.imageCount && usage.imageCount > 0 && pricing?.imageGeneration) {
        // IMAGE GENERATION: Calculate input cost + image cost (not text output cost)
        // The imageGeneration flat rate already accounts for output tokens at image rate
        // (e.g., $0.039 = 1290 tokens @ $30/1M for gemini-2.5-flash-image)
        const inputCost = pricing
          ? (usage.inputTokens / 1_000_000) * pricing.inputPerMillion
          : 0
        const cachedCost = pricing?.cachedInputPerMillion
          ? (usage.cachedTokens || 0) / 1_000_000 * pricing.cachedInputPerMillion
          : 0
        const imageCost = calculateImageCost(provider, model, usage.imageCount, usage.resolution, usage.imageQuality)

        costUsd = inputCost + cachedCost + imageCost
      } else {
        // TEXT GENERATION: Use standard token calculation
        costUsd = calculateTokenCost(
          provider,
          model,
          usage.inputTokens,
          usage.outputTokens,
          usage.cachedTokens || 0
        )
      }

      const record: ApiUsageRecord = {
        ...params,
        requestType,
        provider,
        model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cachedTokens: usage.cachedTokens,
        imageCount: usage.imageCount,
        estimatedCostUsd: costUsd,
        durationMs: usage.durationMs,
        promptLength: usage.promptLength,
        success: usage.success ?? true,
        errorMessage: usage.errorMessage,
      }

      records.push(record)

      // Log to database
      await trackApiUsage(record)

      return record
    },

    /**
     * Get total cost for all tracked calls
     */
    getTotalCost: () => {
      return records.reduce((sum, r) => sum + r.estimatedCostUsd, 0)
    },

    /**
     * Get summary of all tracked calls
     */
    getSummary: () => {
      const totalCost = records.reduce((sum, r) => sum + r.estimatedCostUsd, 0)
      const totalInputTokens = records.reduce((sum, r) => sum + r.inputTokens, 0)
      const totalOutputTokens = records.reduce((sum, r) => sum + r.outputTokens, 0)

      return {
        totalCostUsd: totalCost,
        totalCostInr: convertToINR(totalCost),
        totalInputTokens,
        totalOutputTokens,
        requestCount: records.length,
        records,
        formatted: formatDualCurrency(totalCost),
      }
    },
  }
}

// ============================================================
// ANALYTICS FUNCTIONS
// ============================================================

/**
 * Get usage analytics for an organization
 */
export async function getUsageAnalytics(
  organizationId: string,
  dateRange?: { start: Date; end: Date }
): Promise<UsageAnalytics> {
  const supabase = await createClient()

  // Default to last 30 days if no date range specified to prevent unbounded queries
  const defaultStart = new Date()
  defaultStart.setDate(defaultStart.getDate() - 30)

  const startDate = dateRange?.start || defaultStart
  const endDate = dateRange?.end || new Date()

  const { data: records, error } = await supabase
    .from('api_usage')
    .select('id, provider, request_type, model, estimated_cost_usd, input_tokens, output_tokens, cached_tokens, image_count, created_at, duration_ms, success')
    .eq('organization_id', organizationId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })
    .limit(1000) // Cap at 1000 records to prevent excessive IO

  if (error) {
    console.error('[API Usage] Failed to fetch analytics:', error)
    throw error
  }

  // Initialize analytics
  const analytics: UsageAnalytics = {
    totalCostUsd: 0,
    totalCostInr: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCachedTokens: 0,
    totalImages: 0,
    byProvider: {} as UsageAnalytics['byProvider'],
    byRequestType: {},
    byModel: {},
    dailyTrend: [],
    recentRecords: [],
  }

  if (!records || records.length === 0) {
    return analytics
  }

  // Process records
  const dailyMap = new Map<string, {
    costUsd: number
    requestCount: number
    inputTokens: number
    outputTokens: number
  }>()

  for (const record of records) {
    const cost = safeNumber(record.estimated_cost_usd)
    const inputTokens = record.input_tokens || 0
    const outputTokens = record.output_tokens || 0
    const cachedTokens = record.cached_tokens || 0
    const imageCount = record.image_count || 0

    // Totals
    analytics.totalCostUsd += cost
    analytics.totalInputTokens += inputTokens
    analytics.totalOutputTokens += outputTokens
    analytics.totalCachedTokens += cachedTokens
    analytics.totalImages += imageCount

    // By provider
    const provider = record.provider as AIProvider
    if (!analytics.byProvider[provider]) {
      analytics.byProvider[provider] = {
        costUsd: 0,
        inputTokens: 0,
        outputTokens: 0,
        requestCount: 0,
      }
    }
    analytics.byProvider[provider].costUsd += cost
    analytics.byProvider[provider].inputTokens += inputTokens
    analytics.byProvider[provider].outputTokens += outputTokens
    analytics.byProvider[provider].requestCount += 1

    // By request type
    const requestType = record.request_type
    if (!analytics.byRequestType[requestType]) {
      analytics.byRequestType[requestType] = {
        costUsd: 0,
        inputTokens: 0,
        outputTokens: 0,
        requestCount: 0,
      }
    }
    analytics.byRequestType[requestType].costUsd += cost
    analytics.byRequestType[requestType].inputTokens += inputTokens
    analytics.byRequestType[requestType].outputTokens += outputTokens
    analytics.byRequestType[requestType].requestCount += 1

    // By model
    const model = record.model
    if (!analytics.byModel[model]) {
      analytics.byModel[model] = {
        costUsd: 0,
        inputTokens: 0,
        outputTokens: 0,
        requestCount: 0,
      }
    }
    analytics.byModel[model].costUsd += cost
    analytics.byModel[model].inputTokens += inputTokens
    analytics.byModel[model].outputTokens += outputTokens
    analytics.byModel[model].requestCount += 1

    // Daily trend
    const date = new Date(record.created_at).toISOString().split('T')[0]
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        costUsd: 0,
        requestCount: 0,
        inputTokens: 0,
        outputTokens: 0,
      })
    }
    const daily = dailyMap.get(date)!
    daily.costUsd += cost
    daily.requestCount += 1
    daily.inputTokens += inputTokens
    daily.outputTokens += outputTokens
  }

  // Convert daily map to array sorted by date
  analytics.dailyTrend = Array.from(dailyMap.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Recent records (last 10)
  analytics.recentRecords = records.slice(0, 10).map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    requestType: r.request_type,
    provider: r.provider,
    model: r.model,
    costUsd: safeNumber(r.estimated_cost_usd),
    inputTokens: r.input_tokens || 0,
    outputTokens: r.output_tokens || 0,
  }))

  // Calculate INR total
  analytics.totalCostInr = convertToINR(analytics.totalCostUsd)

  return analytics
}

/**
 * Get daily cost for budget checking
 */
export async function getDailyCost(organizationId: string): Promise<number> {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('api_usage')
    .select('estimated_cost_usd')
    .eq('organization_id', organizationId)
    .gte('created_at', today.toISOString())
    .limit(500) // Daily limit - cap to prevent excessive IO

  if (error) {
    console.error('[API Usage] Failed to get daily cost:', error)
    return 0
  }

  return data?.reduce((sum, r) => sum + safeNumber(r.estimated_cost_usd), 0) || 0
}

/**
 * Get cost for a specific creative
 */
export async function getCreativeCost(creativeId: string): Promise<{
  totalCostUsd: number
  totalCostInr: number
  breakdown: Array<{
    requestType: string
    provider: string
    model: string
    costUsd: number
  }>
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('api_usage')
    .select('request_type, provider, model, estimated_cost_usd')
    .eq('creative_id', creativeId)
    .limit(20) // A single creative typically has 3-5 API calls max

  if (error) {
    console.error('[API Usage] Failed to get creative cost:', error)
    return { totalCostUsd: 0, totalCostInr: 0, breakdown: [] }
  }

  const totalCostUsd = data?.reduce((sum, r) => sum + safeNumber(r.estimated_cost_usd), 0) || 0

  return {
    totalCostUsd,
    totalCostInr: convertToINR(totalCostUsd),
    breakdown: data?.map((r) => ({
      requestType: r.request_type,
      provider: r.provider,
      model: r.model,
      costUsd: safeNumber(r.estimated_cost_usd),
    })) || [],
  }
}
