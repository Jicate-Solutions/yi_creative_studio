'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
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
  sort = { field: 'created_at', direction: 'desc' },
  enabled = true,
}: UseRealtimeFeedbackOptions): UseRealtimeFeedbackReturn {
  const [feedback, setFeedback] = useState<CreativeFeedbackWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<FeedbackStats | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const supabase = createClient()

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

  // Fetch feedback data
  const fetchFeedback = useCallback(async () => {
    if (!organizationId || !enabled) return

    setIsLoading(true)
    setError(null)

    try {
      // Build query with type assertion for creative_feedback table
      let query = (supabase.from as Function)('creative_feedback')
        .select(`
          *,
          creatives:creative_id (id, title, thumbnail_url, image_url)
        `)
        .eq('organization_id', organizationId)

      // Apply filters
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters?.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority)
      }

      if (filters?.creativeType) {
        query = query.eq('creative_type', filters.creativeType)
      }

      if (filters?.vertical) {
        query = query.eq('vertical', filters.vertical)
      }

      if (filters?.ratingMin) {
        query = query.gte('rating', filters.ratingMin)
      }

      if (filters?.ratingMax) {
        query = query.lte('rating', filters.ratingMax)
      }

      if (filters?.dateRange?.from) {
        query = query.gte('created_at', filters.dateRange.from.toISOString())
      }

      if (filters?.dateRange?.to) {
        query = query.lte('created_at', filters.dateRange.to.toISOString())
      }

      // Apply sorting
      query = query.order(sort.field, { ascending: sort.direction === 'asc' })

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      const feedbackData = (data || []) as CreativeFeedbackWithDetails[]
      setFeedback(feedbackData)
      setStats(calculateStats(feedbackData))
    } catch (err) {
      console.error('Failed to fetch feedback:', err)
      setError('Failed to load feedback data')
    } finally {
      setIsLoading(false)
    }
  }, [organizationId, filters, sort, enabled, supabase, calculateStats])

  // Set up real-time subscription
  useEffect(() => {
    if (!organizationId || !enabled) return

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
              // Check if it passes current filters
              if (filters?.status && filters.status !== 'all' && newFeedback.status !== filters.status) {
                return prev
              }
              if (filters?.priority && filters.priority !== 'all' && newFeedback.priority !== filters.priority) {
                return prev
              }
              // Add to beginning (most recent)
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
              // Check if it should still be in the filtered list
              if (filters?.status && filters.status !== 'all' && updatedFeedback.status !== filters.status) {
                const filtered = updated.filter((f) => f.id !== updatedFeedback.id)
                setStats(calculateStats(filtered))
                return filtered
              }
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
        setIsConnected(status === 'SUBSCRIBED')
        if (status === 'CHANNEL_ERROR') {
          setError('Real-time connection error. Retrying...')
        }
      })

    channelRef.current = channel

    // Initial fetch
    fetchFeedback()

    // Cleanup on unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [organizationId, enabled, supabase, fetchFeedback, filters, calculateStats])

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
