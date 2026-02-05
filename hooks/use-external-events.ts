'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ExternalEvent, EventsCalendarState } from '@/types/external-event.types'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Re-export for convenience
export type { ExternalEvent }

// Cache duration: 5 minutes
const CACHE_DURATION_MS = 5 * 60 * 1000

// Cache is now keyed by organization ID + sourceFilter to prevent cross-org data leakage
// and ensure filter changes trigger fresh fetches
interface CacheEntry {
  events: ExternalEvent[]
  timestamp: number
  month: string
  sourceFilter: string
}
const eventCache = new Map<string, CacheEntry>()

interface UseExternalEventsOptions {
  /**
   * Initial month to load (YYYY-MM format)
   * Defaults to current month
   */
  initialMonth?: string
  /**
   * Filter by source app (myjkkn, yi-connect, etc.)
   */
  sourceFilter?: string
  /**
   * Whether to auto-fetch on mount
   */
  autoFetch?: boolean
  /**
   * Whether to enable Supabase Realtime subscription for live updates
   */
  enableRealtime?: boolean
}

export function useExternalEvents(options: UseExternalEventsOptions = {}) {
  const { currentOrganization } = useAuthStore()
  const {
    initialMonth = new Date().toISOString().slice(0, 7), // YYYY-MM
    sourceFilter,
    autoFetch = true,
    enableRealtime = true,
  } = options

  // Realtime channel ref
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Get cached events for current organization (if any)
  const orgId = currentOrganization?.id || ''
  const cachedEntry = eventCache.get(orgId)
  const initialEvents = cachedEntry?.month === initialMonth ? cachedEntry.events : []

  const [state, setState] = useState<EventsCalendarState>({
    events: initialEvents,
    isLoading: false,
    error: null,
    selectedDate: null,
    selectedEvent: null,
    viewMode: 'month',
    currentMonth: initialMonth,
  })

  /**
   * Fetch events from the API
   */
  const fetchEvents = useCallback(async (force = false) => {
    if (!currentOrganization?.id) {
      setState(prev => ({ ...prev, error: 'No organization selected' }))
      return
    }

    // Cache key includes sourceFilter to ensure filter changes trigger fresh fetches
    const filterKey = sourceFilter || 'all'
    const cacheKey = `${currentOrganization.id}|${filterKey}`
    const cached = eventCache.get(cacheKey)
    const now = Date.now()

    // Skip if cache is still valid for this org AND same month AND same filter (unless forced)
    if (!force && cached && cached.month === state.currentMonth && cached.sourceFilter === filterKey && cached.events.length > 0 && (now - cached.timestamp) < CACHE_DURATION_MS) {
      setState(prev => ({ ...prev, events: cached.events, isLoading: false }))
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const params = new URLSearchParams({
        organization_id: currentOrganization.id,
        month: state.currentMonth,
        limit: '100',
      })

      if (sourceFilter) {
        params.append('source', sourceFilter)
      }

      const response = await fetch(`/api/external-events?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch events')
      }

      const events = data.events || []

      // Cache by organization ID, month, and filter
      eventCache.set(cacheKey, {
        events,
        timestamp: Date.now(),
        month: state.currentMonth,
        sourceFilter: filterKey,
      })

      setState(prev => ({
        ...prev,
        events,
        isLoading: false,
        error: null,
      }))
    } catch (err) {
      console.error('[useExternalEvents] Fetch error:', err)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load events',
      }))
    }
  }, [currentOrganization?.id, state.currentMonth, sourceFilter])

  /**
   * Set current month and refetch
   */
  const setCurrentMonth = useCallback((month: string) => {
    setState(prev => ({ ...prev, currentMonth: month }))
  }, [])

  /**
   * Select a date in the calendar
   */
  const selectDate = useCallback((date: string | null) => {
    setState(prev => ({ ...prev, selectedDate: date, selectedEvent: null }))
  }, [])

  /**
   * Select an event to view details
   */
  const selectEvent = useCallback((event: ExternalEvent | null) => {
    setState(prev => ({ ...prev, selectedEvent: event }))
  }, [])

  /**
   * Toggle view mode (month/week)
   */
  const setViewMode = useCallback((mode: 'month' | 'week') => {
    setState(prev => ({ ...prev, viewMode: mode }))
  }, [])

  /**
   * Get events for a specific date
   */
  const getEventsForDate = useCallback((date: string): ExternalEvent[] => {
    return state.events.filter(event => event.date === date)
  }, [state.events])

  /**
   * Get events grouped by date for calendar rendering
   */
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, ExternalEvent[]> = {}
    state.events.forEach(event => {
      if (!grouped[event.date]) {
        grouped[event.date] = []
      }
      grouped[event.date].push(event)
    })
    return grouped
  }, [state.events])

  /**
   * Get unique event sources from current events
   */
  const eventSources = useMemo(() => {
    const sources = new Set<string>()
    state.events.forEach(event => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const source = (event as any)._sourceAppId
      if (source) sources.add(source)
    })
    return Array.from(sources)
  }, [state.events])

  /**
   * Refresh events
   */
  const refresh = useCallback(() => {
    fetchEvents(true)
  }, [fetchEvents])

  // Auto-fetch on mount and when month changes
  useEffect(() => {
    if (autoFetch && currentOrganization?.id) {
      fetchEvents()
    }
  }, [autoFetch, currentOrganization?.id, state.currentMonth, fetchEvents])

  // Supabase Realtime subscription for live event updates
  useEffect(() => {
    if (!enableRealtime || !currentOrganization?.id) return

    const supabase = createClient()
    const orgId = currentOrganization.id

    // Subscribe to changes in synced_events table for this organization
    const channel = supabase
      .channel(`synced-events-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'synced_events',
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          const newEvent = payload.new as ExternalEvent & { event_name: string }
          toast.success(`New event synced: ${newEvent.event_name || 'Untitled'}`)
          // Invalidate all cache entries for this org and refresh
          for (const key of eventCache.keys()) {
            if (key.startsWith(`${orgId}|`)) eventCache.delete(key)
          }
          fetchEvents(true)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'synced_events',
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          const updatedEvent = payload.new as ExternalEvent & { event_name: string }
          // Silently update without toast for updates
          for (const key of eventCache.keys()) {
            if (key.startsWith(`${orgId}|`)) eventCache.delete(key)
          }
          fetchEvents(true)
          console.log(`[Realtime] Event updated: ${updatedEvent.event_name}`)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'synced_events',
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          // Invalidate all cache entries for this org and refresh
          for (const key of eventCache.keys()) {
            if (key.startsWith(`${orgId}|`)) eventCache.delete(key)
          }
          fetchEvents(true)
          console.log('[Realtime] Event deleted')
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enableRealtime, currentOrganization?.id, fetchEvents])

  return {
    // State
    events: state.events,
    isLoading: state.isLoading,
    error: state.error,
    selectedDate: state.selectedDate,
    selectedEvent: state.selectedEvent,
    viewMode: state.viewMode,
    currentMonth: state.currentMonth,
    eventsByDate,
    eventSources,

    // Actions
    fetchEvents,
    refresh,
    setCurrentMonth,
    selectDate,
    selectEvent,
    setViewMode,
    getEventsForDate,
  }
}

/**
 * Hook to fetch a single event by ID
 * v3.1: Fixed race condition - resets state on eventId change, cancels stale requests
 */
export function useExternalEvent(eventId: string | null, source?: string) {
  const { currentOrganization } = useAuthStore()
  const [event, setEvent] = useState<ExternalEvent | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Reset state immediately when eventId changes - prevents stale data flash
  useEffect(() => {
    setEvent(null)
    setError(null)
    if (eventId) {
      setIsLoading(true)
    }
  }, [eventId])

  const fetchEvent = useCallback(async () => {
    if (!eventId || !currentOrganization?.id) {
      setIsLoading(false)
      return
    }

    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      const params = new URLSearchParams({
        organization_id: currentOrganization.id,
        external_id: eventId,
      })

      if (source) {
        params.append('source', source)
      }

      const response = await fetch(`/api/external-events?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Event not found')
      }

      setEvent(data.event || null)
    } catch (err) {
      // Ignore aborted requests - they're intentional
      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      console.error('[useExternalEvent] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load event')
    } finally {
      setIsLoading(false)
    }
  }, [eventId, source, currentOrganization?.id])

  useEffect(() => {
    if (eventId) {
      fetchEvent()
    }
    // Cleanup: cancel request on unmount or eventId change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [eventId, fetchEvent])

  return {
    event,
    isLoading,
    error,
    refetch: fetchEvent,
  }
}
