'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  CreativeFeedback,
  CreativeFeedbackWithDetails,
  FeedbackFilters,
  FeedbackSortOptions,
  FeedbackStats,
  FeedbackStatus,
  FeedbackPriority,
} from '@/types/feedback'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface UseRealtimeFeedbackOptions {
  organizationId: string
  filters?: FeedbackFilters
  sort?: FeedbackSortOptions
  enabled?: boolean
}

interface UseRealtimeFeedbackReturn {
  feedback: CreativeFeedbackWithDetails[]
  isLoading: boolean
  isConnected: boolean
  error: string | null
  stats: FeedbackStats | null
  refetch: () => Promise<void>
  updateFeedback: (id: string, updates: Partial<CreativeFeedback>) => Promise<boolean>
  bulkUpdate: (ids: string[], action: 'status' | 'priority' | 'archive', value: string) => Promise<boolean>
}

// Stable default sort to prevent infinite re-renders
// (inline default params create new object reference each call)
const DEFAULT_SORT: FeedbackSortOptions = { field: 'created_at', direction: 'desc' }

/**
 * Custom hook for real-time feedback management with Supabase subscriptions
 *
 * Features:
 * - Real-time INSERT, UPDATE, DELETE subscriptions
 * - Automatic reconnection on connection loss
 * - Optimistic updates for better UX
 * - Filter and sort support
 * - Statistics calculation
 */
export function useRealtimeFeedback({
  organizationId,
  filters,
  sort = DEFAULT_SORT,
  enabled = true,
}: UseRealtimeFeedbackOptions): UseRealtimeFeedbackReturn {
  const [feedback, setFeedback] = useState<CreativeFeedbackWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<FeedbackStats | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  // Memoize supabase client to prevent infinite re-renders
  // (createClient() returns a new reference each call, triggering useCallback/useEffect cycles)
  const supabase = useMemo(() => createClient(), [])

  // Refs for stable filter/sort tracking (prevents re-render loops)
  const filtersRef = useRef(filters)
  const sortRef = useRef(sort)

  // Track if a fetch is in progress (prevents duplicate simultaneous requests)
  const fetchInProgressRef = useRef(false)
  // Track if channel setup has completed initial fetch
  const channelSetupCompleteRef = useRef(false)
  // Track mount state for cleanup
  const isMountedRef = useRef(true)

  // Calculate statistics from feedback data
  const calculateStats = useCallback((feedbackData: CreativeFeedbackWithDetails[]): FeedbackStats => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const byStatus: Record<FeedbackStatus, number> = {
      new: 0,
      reviewed: 0,
      acknowledged: 0,
      resolved: 0,
      archived: 0,
    }

    const byPriority: Record<FeedbackPriority, number> = {
      low: 0,
      normal: 0,
      high: 0,
      urgent: 0,
    }

    let totalRating = 0
    let newToday = 0
    let resolvedToday = 0

    feedbackData.forEach((item) => {
      byStatus[item.status]++
      byPriority[item.priority]++
      totalRating += item.rating

      const createdDate = new Date(item.created_at)
      if (createdDate >= today) {
        newToday++
        if (item.status === 'resolved') {
          resolvedToday++
        }
      }
    })

    return {
      total: feedbackData.length,
      byStatus,
      byPriority,
      averageRating: feedbackData.length > 0 ? totalRating / feedbackData.length : 0,
      newToday,
      resolvedToday,
    }
  }, [])

  // Fetch feedback data - uses refs for filters/sort to prevent infinite loops
  const fetchFeedback = useCallback(async () => {
    // Guard: prevent concurrent fetches and check mount state
    if (!organizationId || !enabled || fetchInProgressRef.current || !isMountedRef.current) {
      return
    }

    fetchInProgressRef.current = true
    setIsLoading(true)
    setError(null)

    // Use refs for current filter/sort values (avoids stale closure issues)
    const currentFilters = filtersRef.current
    const currentSort = sortRef.current

    try {
      // Build query with type assertion for creative_feedback table
      let query = (supabase.from as Function)('creative_feedback')
        .select(`
          *,
          creatives:creative_id (id, title, thumbnail_url, image_url)
        `)
        .eq('organization_id', organizationId)

      // Apply filters
      if (currentFilters?.status && currentFilters.status !== 'all') {
        query = query.eq('status', currentFilters.status)
      }

      if (currentFilters?.priority && currentFilters.priority !== 'all') {
        query = query.eq('priority', currentFilters.priority)
      }

      if (currentFilters?.creativeType) {
        query = query.eq('creative_type', currentFilters.creativeType)
      }

      if (currentFilters?.vertical) {
        query = query.eq('vertical', currentFilters.vertical)
      }

      if (currentFilters?.ratingMin) {
        query = query.gte('rating', currentFilters.ratingMin)
      }

      if (currentFilters?.ratingMax) {
        query = query.lte('rating', currentFilters.ratingMax)
      }

      if (currentFilters?.dateRange?.from) {
        query = query.gte('created_at', currentFilters.dateRange.from.toISOString())
      }

      if (currentFilters?.dateRange?.to) {
        query = query.lte('created_at', currentFilters.dateRange.to.toISOString())
      }

      // Apply sorting
      query = query.order(currentSort.field, { ascending: currentSort.direction === 'asc' })

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      // Only update state if still mounted
      if (isMountedRef.current) {
        const feedbackData = (data || []) as CreativeFeedbackWithDetails[]
        setFeedback(feedbackData)
        setStats(calculateStats(feedbackData))
      }
    } catch (err) {
      console.error('Failed to fetch feedback:', err)
      if (isMountedRef.current) {
        setError('Failed to load feedback data')
      }
    } finally {
      fetchInProgressRef.current = false
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [organizationId, enabled, supabase, calculateStats])

  // Update filter/sort refs when they change (but don't trigger re-fetch from here)
  useEffect(() => {
    filtersRef.current = filters
    sortRef.current = sort
  }, [filters, sort])

  // Set up real-time subscription - runs ONCE per organizationId change
  useEffect(() => {
    if (!organizationId || !enabled) return

    // Reset refs on mount/remount
    isMountedRef.current = true
    channelSetupCompleteRef.current = false
    fetchInProgressRef.current = false

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    // Create new channel for real-time updates
    const channel = supabase
      .channel(`feedback:${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'creative_feedback',
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload

          if (eventType === 'INSERT') {
            const newFeedback = newRecord as CreativeFeedbackWithDetails
            setFeedback((prev) => {
              // Add to beginning (most recent) - filter checks happen at query level
              const updated = [newFeedback, ...prev]
              setStats(calculateStats(updated))
              return updated
            })
          } else if (eventType === 'UPDATE') {
            const updatedFeedback = newRecord as CreativeFeedbackWithDetails
            setFeedback((prev) => {
              const updated = prev.map((f) =>
                f.id === updatedFeedback.id ? { ...f, ...updatedFeedback } : f
              )
              setStats(calculateStats(updated))
              return updated
            })
          } else if (eventType === 'DELETE') {
            const deletedId = (oldRecord as { id: string })?.id
            if (deletedId) {
              setFeedback((prev) => {
                const updated = prev.filter((f) => f.id !== deletedId)
                setStats(calculateStats(updated))
                return updated
              })
            }
          }
        }
      )
      .subscribe((status) => {
        if (isMountedRef.current) {
          setIsConnected(status === 'SUBSCRIBED')
          if (status === 'CHANNEL_ERROR') {
            setError('Real-time connection error. Retrying...')
          }
        }
      })

    channelRef.current = channel

    // Initial fetch
    fetchFeedback().then(() => {
      channelSetupCompleteRef.current = true
    })

    // Cleanup on unmount
    return () => {
      isMountedRef.current = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [organizationId, enabled, supabase, calculateStats, fetchFeedback])

  // Separate effect to refetch when filters/sort ACTUALLY change (using JSON comparison)
  const prevFiltersJson = useRef<string>('')
  const prevSortJson = useRef<string>('')

  useEffect(() => {
    // Skip if channel setup hasn't completed initial fetch
    if (!organizationId || !enabled || !channelSetupCompleteRef.current) return

    // Serialize current filters/sort for comparison
    const filtersJson = JSON.stringify(filters || {})
    const sortJson = JSON.stringify(sort)

    // Only refetch if filters or sort ACTUALLY changed (deep comparison)
    if (filtersJson !== prevFiltersJson.current || sortJson !== prevSortJson.current) {
      prevFiltersJson.current = filtersJson
      prevSortJson.current = sortJson

      // Small debounce to prevent rapid successive fetches
      const timeoutId = setTimeout(() => {
        fetchFeedback()
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [organizationId, enabled, filters, sort, fetchFeedback])

  // Update single feedback item (optimistic update)
  const updateFeedback = useCallback(
    async (id: string, updates: Partial<CreativeFeedback>): Promise<boolean> => {
      // Optimistic update
      setFeedback((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
      )

      try {
        const response = await fetch(`/api/feedback/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          throw new Error('Failed to update feedback')
        }

        return true
      } catch (err) {
        console.error('Update feedback error:', err)
        // Revert optimistic update
        await fetchFeedback()
        setError('Failed to update feedback')
        return false
      }
    },
    [fetchFeedback]
  )

  // Bulk update feedback items
  const bulkUpdate = useCallback(
    async (ids: string[], action: 'status' | 'priority' | 'archive', value: string): Promise<boolean> => {
      // Optimistic update
      setFeedback((prev) =>
        prev.map((f) => {
          if (!ids.includes(f.id)) return f
          if (action === 'status' || action === 'archive') {
            return { ...f, status: (action === 'archive' ? 'archived' : value) as FeedbackStatus }
          }
          if (action === 'priority') {
            return { ...f, priority: value as FeedbackPriority }
          }
          return f
        })
      )

      try {
        const response = await fetch('/api/feedback/bulk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedbackIds: ids, action, value }),
        })

        if (!response.ok) {
          throw new Error('Failed to bulk update feedback')
        }

        return true
      } catch (err) {
        console.error('Bulk update error:', err)
        // Revert optimistic update
        await fetchFeedback()
        setError('Failed to update feedback items')
        return false
      }
    },
    [fetchFeedback]
  )

  return {
    feedback,
    isLoading,
    isConnected,
    error,
    stats,
    refetch: fetchFeedback,
    updateFeedback,
    bulkUpdate,
  }
}
