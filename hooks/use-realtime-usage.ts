'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'

/**
 * API Usage record from Supabase real-time subscription
 */
interface ApiUsageRecord {
  id: string
  created_at: string
  request_type: string
  provider: string
  model: string
  input_tokens: number
  output_tokens: number
  cached_tokens: number
  image_count: number
  estimated_cost_usd: number
  duration_ms: number
  success: boolean
}

interface UseRealtimeUsageOptions {
  organizationId: string
  enabled?: boolean
}

interface UseRealtimeUsageReturn {
  /** Most recent usage record received */
  latestRecord: ApiUsageRecord | null
  /** Whether the real-time connection is active */
  isConnected: boolean
  /** Running total cost for today (accumulates from real-time updates) */
  todayCost: number
  /** Running total input tokens for today */
  todayInputTokens: number
  /** Running total output tokens for today */
  todayOutputTokens: number
  /** Number of generations today */
  todayGenerations: number
  /** Reset today's totals (e.g., at midnight) */
  resetTodayTotals: () => void
}

/**
 * Hook for real-time API usage monitoring via Supabase postgres_changes subscription.
 *
 * Subscribes to INSERT events on the api_usage table filtered by organization_id.
 * Updates running totals and provides the latest usage record.
 *
 * @example
 * ```tsx
 * const { latestRecord, isConnected, todayCost, todayGenerations } = useRealtimeUsage({
 *   organizationId: currentOrganization.id,
 *   enabled: true,
 * })
 *
 * // Display real-time cost in UI
 * <div>Today's cost: ${todayCost.toFixed(4)}</div>
 * <div>Generations: {todayGenerations}</div>
 * ```
 */
export function useRealtimeUsage({
  organizationId,
  enabled = true,
}: UseRealtimeUsageOptions): UseRealtimeUsageReturn {
  const [latestRecord, setLatestRecord] = useState<ApiUsageRecord | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [todayCost, setTodayCost] = useState(0)
  const [todayInputTokens, setTodayInputTokens] = useState(0)
  const [todayOutputTokens, setTodayOutputTokens] = useState(0)
  const [todayGenerations, setTodayGenerations] = useState(0)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

  const resetTodayTotals = () => {
    setTodayCost(0)
    setTodayInputTokens(0)
    setTodayOutputTokens(0)
    setTodayGenerations(0)
  }

  useEffect(() => {
    if (!organizationId || !enabled) {
      return
    }

    // Create unique channel name for this organization
    const channelName = `api_usage:${organizationId}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'api_usage',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const record = payload.new as ApiUsageRecord

          // Update latest record
          setLatestRecord(record)

          // Accumulate totals
          if (record.estimated_cost_usd) {
            setTodayCost((prev) => prev + Number(record.estimated_cost_usd))
          }
          if (record.input_tokens) {
            setTodayInputTokens((prev) => prev + record.input_tokens)
          }
          if (record.output_tokens) {
            setTodayOutputTokens((prev) => prev + record.output_tokens)
          }
          if (record.request_type === 'image_generation') {
            setTodayGenerations((prev) => prev + 1)
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
        if (status === 'SUBSCRIBED') {
          console.log('[useRealtimeUsage] Connected to real-time channel:', channelName)
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useRealtimeUsage] Channel error:', channelName)
        }
      })

    channelRef.current = channel

    // Cleanup on unmount or dependency change
    return () => {
      if (channelRef.current) {
        console.log('[useRealtimeUsage] Unsubscribing from channel:', channelName)
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [organizationId, enabled, supabase])

  return {
    latestRecord,
    isConnected,
    todayCost,
    todayInputTokens,
    todayOutputTokens,
    todayGenerations,
    resetTodayTotals,
  }
}
