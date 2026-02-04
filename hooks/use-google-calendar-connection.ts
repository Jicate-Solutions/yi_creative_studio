/**
 * useGoogleCalendarConnection Hook
 *
 * Manages Google Calendar connection state and actions
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ConnectionStatusResponse,
  GoogleCalendar,
} from '@/types/google-calendar.types'
import { toast } from 'sonner'

interface UseGoogleCalendarConnectionOptions {
  organizationId: string
  autoFetch?: boolean
}

interface UseGoogleCalendarConnectionReturn {
  // Status
  status: ConnectionStatusResponse | null
  isLoading: boolean
  error: string | null

  // Calendars
  calendars: GoogleCalendar[]
  isLoadingCalendars: boolean

  // Actions
  connect: () => void
  disconnect: (deleteEvents?: boolean) => Promise<void>
  syncNow: () => Promise<void>
  selectCalendar: (calendarId: string) => Promise<void>
  refreshStatus: () => Promise<void>
  loadCalendars: () => Promise<void>
}

export function useGoogleCalendarConnection(
  options: UseGoogleCalendarConnectionOptions
): UseGoogleCalendarConnectionReturn {
  const { organizationId, autoFetch = true } = options

  const [status, setStatus] = useState<ConnectionStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [calendars, setCalendars] = useState<GoogleCalendar[]>([])
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(false)

  // Fetch connection status
  const refreshStatus = useCallback(async () => {
    if (!organizationId) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(
        `/api/google-calendar/status?organization_id=${organizationId}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch connection status')
      }

      const data = await response.json()
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status')
    } finally {
      setIsLoading(false)
    }
  }, [organizationId])

  // Load calendars list
  const loadCalendars = useCallback(async () => {
    if (!organizationId || !status?.connected) return

    try {
      setIsLoadingCalendars(true)

      const response = await fetch(
        `/api/google-calendar/calendars?organization_id=${organizationId}`
      )

      if (!response.ok) {
        throw new Error('Failed to load calendars')
      }

      const data = await response.json()
      setCalendars(data.calendars || [])
    } catch (err) {
      console.error('Failed to load calendars:', err)
    } finally {
      setIsLoadingCalendars(false)
    }
  }, [organizationId, status?.connected])

  // Connect to Google Calendar (redirect to OAuth)
  const connect = useCallback(() => {
    if (!organizationId) return

    const currentUrl = window.location.pathname
    window.location.href = `/api/auth/google-calendar/authorize?organization_id=${organizationId}&redirect_url=${encodeURIComponent(currentUrl)}`
  }, [organizationId])

  // Disconnect from Google Calendar
  const disconnect = useCallback(
    async (deleteEvents = false) => {
      if (!organizationId) return

      try {
        const response = await fetch('/api/google-calendar/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: organizationId,
            delete_events: deleteEvents,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to disconnect')
        }

        toast.success('Google Calendar disconnected')
        await refreshStatus()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to disconnect'
        toast.error(message)
        throw err
      }
    },
    [organizationId, refreshStatus]
  )

  // Trigger manual sync
  const syncNow = useCallback(async () => {
    if (!organizationId) return

    try {
      toast.loading('Syncing calendar...', { id: 'sync' })

      const response = await fetch('/api/google-calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organization_id: organizationId }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Sync failed')
      }

      const data = await response.json()
      toast.success(
        `Sync complete! +${data.events_added} ~${data.events_updated} -${data.events_deleted}`,
        { id: 'sync' }
      )

      await refreshStatus()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed'
      toast.error(message, { id: 'sync' })
      throw err
    }
  }, [organizationId, refreshStatus])

  // Select a different calendar
  const selectCalendar = useCallback(
    async (calendarId: string) => {
      if (!organizationId) return

      try {
        toast.loading('Switching calendar...', { id: 'select-calendar' })

        const response = await fetch('/api/google-calendar/select-calendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: organizationId,
            calendar_id: calendarId,
          }),
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to select calendar')
        }

        const data = await response.json()
        toast.success(`Now syncing: ${data.calendar_name}`, {
          id: 'select-calendar',
        })

        await refreshStatus()
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to select calendar'
        toast.error(message, { id: 'select-calendar' })
        throw err
      }
    },
    [organizationId, refreshStatus]
  )

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && organizationId) {
      refreshStatus()
    }
  }, [autoFetch, organizationId, refreshStatus])

  // Check URL params for OAuth result on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const googleResult = params.get('google')
    const message = params.get('message')
    const calendarName = params.get('calendar')

    if (googleResult === 'success') {
      toast.success(
        calendarName
          ? `Connected to ${calendarName}! Syncing events...`
          : 'Google Calendar connected!'
      )
      // Clean URL
      const url = new URL(window.location.href)
      url.searchParams.delete('google')
      url.searchParams.delete('message')
      url.searchParams.delete('calendar')
      window.history.replaceState({}, '', url.toString())
      // Refresh status
      refreshStatus()
    } else if (googleResult === 'error') {
      toast.error(message || 'Failed to connect Google Calendar')
      // Clean URL
      const url = new URL(window.location.href)
      url.searchParams.delete('google')
      url.searchParams.delete('message')
      window.history.replaceState({}, '', url.toString())
    } else if (googleResult === 'already_connected') {
      toast.info('Google Calendar is already connected')
      // Clean URL
      const url = new URL(window.location.href)
      url.searchParams.delete('google')
      window.history.replaceState({}, '', url.toString())
    }
  }, [refreshStatus])

  return {
    status,
    isLoading,
    error,
    calendars,
    isLoadingCalendars,
    connect,
    disconnect,
    syncNow,
    selectCalendar,
    refreshStatus,
    loadCalendars,
  }
}
