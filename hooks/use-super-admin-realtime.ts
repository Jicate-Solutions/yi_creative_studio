'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

/**
 * Super Admin Realtime Hook
 * Subscribes to multiple platform-wide database changes for real-time dashboard updates
 */

// Event types for realtime updates
export type RealtimeEventType =
  | 'organization_created'
  | 'organization_updated'
  | 'user_joined'
  | 'user_updated'
  | 'credit_transaction'
  | 'subscription_change'
  | 'creative_generated'
  | 'audit_log'

export interface RealtimeEvent {
  id: string
  type: RealtimeEventType
  timestamp: string
  data: Record<string, any>
  table: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
}

export interface PlatformStats {
  orgCount: number
  userCount: number
  activeSubsCount: number
  totalCreditsAllocated: number
  todayCreditsUsed: number
  todayGenerations: number
}

interface UseSuperAdminRealtimeOptions {
  enabled?: boolean
  onEvent?: (event: RealtimeEvent) => void
  maxEvents?: number // Max events to keep in history
}

interface UseSuperAdminRealtimeReturn {
  // Connection status
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'

  // Stats (updated in realtime)
  stats: PlatformStats

  // Recent events feed
  events: RealtimeEvent[]
  clearEvents: () => void

  // Counters for today
  todayNewOrgs: number
  todayNewUsers: number
  todayTransactions: number
  todayGenerations: number

  // Manual refresh
  refreshStats: () => Promise<void>
}

/**
 * Hook for real-time Super Admin dashboard monitoring
 * Subscribes to: organizations, organization_members, credit_transactions, creatives, super_admin_audit_logs
 *
 * @example
 * ```tsx
 * const {
 *   isConnected,
 *   stats,
 *   events,
 *   todayNewOrgs,
 * } = useSuperAdminRealtime({ enabled: true })
 * ```
 */
export function useSuperAdminRealtime({
  enabled = true,
  onEvent,
  maxEvents = 50,
}: UseSuperAdminRealtimeOptions = {}): UseSuperAdminRealtimeReturn {
  const supabase = createClient()

  // Connection state
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const isConnected = connectionStatus === 'connected'

  // Platform stats
  const [stats, setStats] = useState<PlatformStats>({
    orgCount: 0,
    userCount: 0,
    activeSubsCount: 0,
    totalCreditsAllocated: 0,
    todayCreditsUsed: 0,
    todayGenerations: 0,
  })

  // Events feed
  const [events, setEvents] = useState<RealtimeEvent[]>([])

  // Today's counters
  const [todayNewOrgs, setTodayNewOrgs] = useState(0)
  const [todayNewUsers, setTodayNewUsers] = useState(0)
  const [todayTransactions, setTodayTransactions] = useState(0)
  const [todayGenerations, setTodayGenerations] = useState(0)

  // Channel refs
  const channelsRef = useRef<RealtimeChannel[]>([])

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([])
  }, [])

  // Add event to feed
  const addEvent = useCallback((event: RealtimeEvent) => {
    setEvents((prev) => {
      const updated = [event, ...prev]
      return updated.slice(0, maxEvents)
    })
    onEvent?.(event)
  }, [maxEvents, onEvent])

  // Fetch initial stats
  const refreshStats = useCallback(async () => {
    try {
      const response = await fetch('/api/super-admin/dashboard/stats')
      const data = await response.json()

      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('[SuperAdminRealtime] Failed to fetch stats:', error)
    }
  }, [])

  // Handle organization changes
  const handleOrganizationChange = useCallback((
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>
  ) => {
    const { eventType, new: newRecord, old: oldRecord } = payload

    if (eventType === 'INSERT') {
      setStats((prev) => ({ ...prev, orgCount: prev.orgCount + 1 }))
      setTodayNewOrgs((prev) => prev + 1)
      addEvent({
        id: crypto.randomUUID(),
        type: 'organization_created',
        timestamp: new Date().toISOString(),
        data: { name: newRecord?.name, id: newRecord?.id },
        table: 'organizations',
        operation: 'INSERT',
      })
    } else if (eventType === 'UPDATE') {
      addEvent({
        id: crypto.randomUUID(),
        type: 'organization_updated',
        timestamp: new Date().toISOString(),
        data: {
          id: newRecord?.id,
          name: newRecord?.name,
          changes: Object.keys(newRecord || {}).filter(
            (k) => newRecord?.[k] !== oldRecord?.[k]
          ),
        },
        table: 'organizations',
        operation: 'UPDATE',
      })
    }
  }, [addEvent])

  // Handle member changes
  const handleMemberChange = useCallback((
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>
  ) => {
    const { eventType, new: newRecord } = payload

    if (eventType === 'INSERT') {
      setStats((prev) => ({ ...prev, userCount: prev.userCount + 1 }))
      setTodayNewUsers((prev) => prev + 1)
      addEvent({
        id: crypto.randomUUID(),
        type: 'user_joined',
        timestamp: new Date().toISOString(),
        data: {
          organizationId: newRecord?.organization_id,
          role: newRecord?.role,
        },
        table: 'organization_members',
        operation: 'INSERT',
      })
    } else if (eventType === 'UPDATE') {
      addEvent({
        id: crypto.randomUUID(),
        type: 'user_updated',
        timestamp: new Date().toISOString(),
        data: {
          organizationId: newRecord?.organization_id,
          role: newRecord?.role,
        },
        table: 'organization_members',
        operation: 'UPDATE',
      })
    }
  }, [addEvent])

  // Handle credit transactions
  const handleCreditTransaction = useCallback((
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>
  ) => {
    const { eventType, new: newRecord } = payload

    if (eventType === 'INSERT') {
      const amount = newRecord?.amount || 0
      const type = newRecord?.type || 'unknown'

      setTodayTransactions((prev) => prev + 1)

      if (type === 'purchase' || type === 'allocation') {
        setStats((prev) => ({
          ...prev,
          totalCreditsAllocated: prev.totalCreditsAllocated + amount,
        }))
      } else if (type === 'usage') {
        setStats((prev) => ({
          ...prev,
          todayCreditsUsed: prev.todayCreditsUsed + Math.abs(amount),
        }))
      }

      addEvent({
        id: crypto.randomUUID(),
        type: 'credit_transaction',
        timestamp: new Date().toISOString(),
        data: {
          organizationId: newRecord?.organization_id,
          amount,
          type,
          description: newRecord?.description,
        },
        table: 'credit_transactions',
        operation: 'INSERT',
      })
    }
  }, [addEvent])

  // Handle creative generation
  const handleCreativeChange = useCallback((
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>
  ) => {
    const { eventType, new: newRecord } = payload

    if (eventType === 'INSERT') {
      setTodayGenerations((prev) => prev + 1)
      setStats((prev) => ({
        ...prev,
        todayGenerations: prev.todayGenerations + 1,
      }))

      addEvent({
        id: crypto.randomUUID(),
        type: 'creative_generated',
        timestamp: new Date().toISOString(),
        data: {
          organizationId: newRecord?.organization_id,
          format: newRecord?.format_id,
          title: newRecord?.title,
        },
        table: 'creatives',
        operation: 'INSERT',
      })
    }
  }, [addEvent])

  // Handle audit logs
  const handleAuditLog = useCallback((
    payload: RealtimePostgresChangesPayload<{ [key: string]: any }>
  ) => {
    const { eventType, new: newRecord } = payload

    if (eventType === 'INSERT') {
      addEvent({
        id: crypto.randomUUID(),
        type: 'audit_log',
        timestamp: new Date().toISOString(),
        data: {
          action: newRecord?.action,
          resourceType: newRecord?.resource_type,
          adminEmail: newRecord?.super_admin_email,
        },
        table: 'super_admin_audit_logs',
        operation: 'INSERT',
      })
    }
  }, [addEvent])

  // Set up realtime subscriptions
  useEffect(() => {
    if (!enabled) {
      setConnectionStatus('disconnected')
      return
    }

    setConnectionStatus('connecting')

    // Fetch initial stats
    refreshStats()

    // Create channels for different tables
    const channelName = `super-admin-${Date.now()}`

    const channel = supabase
      .channel(channelName)
      // Organizations table
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organizations' },
        handleOrganizationChange
      )
      // Organization members table
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organization_members' },
        handleMemberChange
      )
      // Credit transactions table
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'credit_transactions' },
        handleCreditTransaction
      )
      // Creatives table (for generation tracking)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'creatives' },
        handleCreativeChange
      )
      // Audit logs table
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'super_admin_audit_logs' },
        handleAuditLog
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setConnectionStatus('connected')
          console.log('[SuperAdminRealtime] Connected to realtime channels')
        } else if (status === 'CHANNEL_ERROR') {
          setConnectionStatus('error')
          console.error('[SuperAdminRealtime] Channel error')
        } else if (status === 'TIMED_OUT') {
          setConnectionStatus('error')
          console.error('[SuperAdminRealtime] Connection timed out')
        }
      })

    channelsRef.current = [channel]

    // Cleanup on unmount
    return () => {
      console.log('[SuperAdminRealtime] Cleaning up channels')
      channelsRef.current.forEach((ch) => {
        supabase.removeChannel(ch)
      })
      channelsRef.current = []
      setConnectionStatus('disconnected')
    }
  }, [
    enabled,
    supabase,
    refreshStats,
    handleOrganizationChange,
    handleMemberChange,
    handleCreditTransaction,
    handleCreativeChange,
    handleAuditLog,
  ])

  return {
    isConnected,
    connectionStatus,
    stats,
    events,
    clearEvents,
    todayNewOrgs,
    todayNewUsers,
    todayTransactions,
    todayGenerations,
    refreshStats,
  }
}
