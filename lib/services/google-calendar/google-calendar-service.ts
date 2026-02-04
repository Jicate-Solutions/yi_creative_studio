/**
 * Google Calendar Service
 *
 * Core service for interacting with Google Calendar API
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  GoogleCalendar,
  GoogleCalendarEvent,
  GoogleCalendarEventsListResponse,
  GoogleCalendarListResponse,
  GooglePushChannel,
  GetEventsParams,
  SyncResult,
  GoogleCalendarConnection,
  GOOGLE_CALENDAR_SCOPES,
  GOOGLE_CALENDAR_SOURCE_APP_ID,
  PUSH_CHANNEL_MAX_EXPIRY_MS,
} from '@/types/google-calendar.types'
import {
  ensureValidAccessToken,
  generatePushChannelToken,
} from './token-manager'
import { mapGoogleEventToExternalEvent } from './google-event-mapper'

// ============================================================================
// Configuration
// ============================================================================

const GOOGLE_CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI!
const WEBHOOK_URL = process.env.GOOGLE_CALENDAR_WEBHOOK_URL!

// ============================================================================
// OAuth URL Generation
// ============================================================================

/**
 * Generate Google OAuth authorization URL
 */
export function getAuthorizationUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: GOOGLE_CALENDAR_SCOPES.join(' '),
    access_type: 'offline', // Get refresh token
    prompt: 'consent', // Force consent to ensure refresh token
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

// ============================================================================
// Calendar List Operations
// ============================================================================

/**
 * List calendars accessible by the user
 */
export async function listCalendars(
  accessToken: string
): Promise<GoogleCalendar[]> {
  const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to list calendars: ${error.error?.message || response.statusText}`)
  }

  const data: GoogleCalendarListResponse = await response.json()

  // Filter to calendars user can at least read
  return data.items.filter(
    cal => ['reader', 'writer', 'owner'].includes(cal.accessRole)
  )
}

/**
 * Get a specific calendar
 */
export async function getCalendar(
  accessToken: string,
  calendarId: string
): Promise<GoogleCalendar> {
  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/users/me/calendarList/${encodeURIComponent(calendarId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to get calendar: ${error.error?.message || response.statusText}`)
  }

  return response.json()
}

// ============================================================================
// Events Operations
// ============================================================================

/**
 * Get events from a calendar
 */
export async function getCalendarEvents(
  params: GetEventsParams
): Promise<GoogleCalendarEventsListResponse> {
  const url = new URL(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(params.calendarId)}/events`
  )

  // Add query parameters
  if (params.syncToken) {
    url.searchParams.set('syncToken', params.syncToken)
  } else {
    if (params.timeMin) url.searchParams.set('timeMin', params.timeMin)
    if (params.timeMax) url.searchParams.set('timeMax', params.timeMax)
  }

  if (params.pageToken) url.searchParams.set('pageToken', params.pageToken)
  if (params.maxResults) url.searchParams.set('maxResults', params.maxResults.toString())
  if (params.singleEvents !== undefined) {
    url.searchParams.set('singleEvents', params.singleEvents.toString())
  }
  if (params.orderBy) url.searchParams.set('orderBy', params.orderBy)

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  })

  if (!response.ok) {
    const error = await response.json()

    // Handle sync token invalidation
    if (response.status === 410) {
      throw new Error('SYNC_TOKEN_INVALID')
    }

    throw new Error(`Failed to get events: ${error.error?.message || response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch all events with pagination
 */
export async function fetchAllEvents(
  connectionId: string,
  calendarId: string,
  options: {
    syncToken?: string
    pastDays?: number
    futureDays?: number
  } = {}
): Promise<{
  events: GoogleCalendarEvent[]
  nextSyncToken: string | null
}> {
  const accessToken = await ensureValidAccessToken(connectionId)
  const allEvents: GoogleCalendarEvent[] = []
  let pageToken: string | undefined
  let nextSyncToken: string | null = null

  // Calculate time range if no sync token
  const now = new Date()
  const timeMin = options.syncToken
    ? undefined
    : new Date(now.getTime() - (options.pastDays || 30) * 24 * 60 * 60 * 1000).toISOString()
  const timeMax = options.syncToken
    ? undefined
    : new Date(now.getTime() + (options.futureDays || 90) * 24 * 60 * 60 * 1000).toISOString()

  do {
    try {
      const response = await getCalendarEvents({
        calendarId,
        accessToken,
        syncToken: options.syncToken,
        timeMin,
        timeMax,
        pageToken,
        maxResults: 250, // Max allowed by Google
        singleEvents: true, // Expand recurring events
        orderBy: options.syncToken ? undefined : 'startTime',
      })

      allEvents.push(...response.items)
      pageToken = response.nextPageToken
      nextSyncToken = response.nextSyncToken || null
    } catch (error) {
      if (error instanceof Error && error.message === 'SYNC_TOKEN_INVALID') {
        // Sync token expired, need full sync
        console.log('Sync token invalid, performing full sync')
        return fetchAllEvents(connectionId, calendarId, {
          pastDays: options.pastDays,
          futureDays: options.futureDays,
        })
      }
      throw error
    }
  } while (pageToken)

  return { events: allEvents, nextSyncToken }
}

// ============================================================================
// Push Notifications (Webhooks)
// ============================================================================

/**
 * Create a push notification channel for a calendar
 */
export async function createPushChannel(
  connectionId: string,
  calendarId: string,
  organizationId: string
): Promise<GooglePushChannel> {
  const accessToken = await ensureValidAccessToken(connectionId)
  const channelId = crypto.randomUUID()
  const token = await generatePushChannelToken(organizationId)

  // Calculate expiration (max 7 days from now)
  const expiration = Date.now() + PUSH_CHANNEL_MAX_EXPIRY_MS

  const response = await fetch(
    `${GOOGLE_CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/watch`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address: WEBHOOK_URL,
        token,
        expiration: expiration.toString(),
      }),
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to create push channel: ${error.error?.message || response.statusText}`)
  }

  const channel = await response.json()

  // Store channel info in database
  const supabase = await createClient()
  await supabase
    .from('google_calendar_connections' as any)
    .update({
      push_channel_id: channel.id,
      push_resource_id: channel.resourceId,
      push_channel_expiry: new Date(parseInt(channel.expiration)).toISOString(),
      push_channel_token: token,
    })
    .eq('id', connectionId)

  // Log channel creation
  await supabase.from('google_calendar_push_logs' as any).insert({
    connection_id: connectionId,
    organization_id: organizationId,
    event_type: 'channel_created',
    channel_id: channel.id,
    resource_id: channel.resourceId,
    success: true,
  })

  return channel
}

/**
 * Stop a push notification channel
 */
export async function stopPushChannel(
  connectionId: string,
  channelId: string,
  resourceId: string
): Promise<void> {
  const accessToken = await ensureValidAccessToken(connectionId)

  const response = await fetch(`${GOOGLE_CALENDAR_API_BASE}/channels/stop`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: channelId,
      resourceId,
    }),
  })

  if (!response.ok && response.status !== 404) {
    // 404 means channel already stopped
    const error = await response.json()
    console.warn(`Failed to stop push channel: ${error.error?.message}`)
  }

  // Clear channel info from database
  const supabase = await createClient()
  await supabase
    .from('google_calendar_connections' as any)
    .update({
      push_channel_id: null,
      push_resource_id: null,
      push_channel_expiry: null,
      push_channel_token: null,
    })
    .eq('id', connectionId)
}

/**
 * Renew a push notification channel before expiry
 */
export async function renewPushChannel(
  connection: GoogleCalendarConnection
): Promise<GooglePushChannel | null> {
  if (!connection.push_channel_id || !connection.push_resource_id) {
    // No existing channel, create new one
    return createPushChannel(
      connection.id,
      connection.calendar_id,
      connection.organization_id
    )
  }

  // Stop old channel first
  try {
    await stopPushChannel(
      connection.id,
      connection.push_channel_id,
      connection.push_resource_id
    )
  } catch (error) {
    console.warn('Failed to stop old channel during renewal:', error)
  }

  // Create new channel
  return createPushChannel(
    connection.id,
    connection.calendar_id,
    connection.organization_id
  )
}

// ============================================================================
// Sync Operations
// ============================================================================

/**
 * Sync events from Google Calendar to synced_events table
 */
export async function syncEvents(
  connection: GoogleCalendarConnection,
  fullSync: boolean = false
): Promise<SyncResult> {
  // Use admin client for background sync operations (bypasses RLS)
  // User permissions were verified during OAuth connection
  const supabase = createAdminClient()
  const startTime = Date.now()

  try {
    // Update status to syncing
    await supabase
      .from('google_calendar_connections' as any)
      .update({ sync_status: 'syncing' })
      .eq('id', connection.id)

    // Fetch events from Google
    const { events, nextSyncToken } = await fetchAllEvents(
      connection.id,
      connection.calendar_id,
      {
        syncToken: fullSync ? undefined : connection.sync_token || undefined,
        pastDays: connection.sync_past_days,
        futureDays: connection.sync_future_days,
      }
    )

    let eventsAdded = 0
    let eventsUpdated = 0
    let eventsDeleted = 0

    // Process each event
    for (const googleEvent of events) {
      if (googleEvent.status === 'cancelled') {
        // Delete cancelled events
        const { count } = await supabase
          .from('synced_events' as any)
          .delete()
          .eq('external_id', googleEvent.id)
          .eq('source_app_id', GOOGLE_CALENDAR_SOURCE_APP_ID)
          .eq('organization_id', connection.organization_id)

        if (count && count > 0) eventsDeleted++
      } else {
        // Map to ExternalEvent format
        const externalEvent = mapGoogleEventToExternalEvent(googleEvent)

        // Upsert to synced_events
        const { data: existing } = await supabase
          .from('synced_events' as any)
          .select('id')
          .eq('external_id', googleEvent.id)
          .eq('source_app_id', GOOGLE_CALENDAR_SOURCE_APP_ID)
          .eq('organization_id', connection.organization_id)
          .single()

        const { error: upsertError } = await supabase
          .from('synced_events' as any)
          .upsert(
            {
              external_id: googleEvent.id,
              source_app_id: GOOGLE_CALENDAR_SOURCE_APP_ID,
              organization_id: connection.organization_id,
              event_name: externalEvent.name,
              event_date: externalEvent.date,
              event_time: externalEvent.startTime,
              end_time: externalEvent.endTime,
              venue: externalEvent.venue,
              venue_address: externalEvent.venueAddress,
              description: externalEvent.description,
              is_virtual: externalEvent.isVirtual,
              virtual_meeting_link: externalEvent.virtualMeetingLink,
              status: externalEvent.status,
              source_created_at: googleEvent.created,
              source_updated_at: googleEvent.updated,
              synced_at: new Date().toISOString(),
            },
            {
              onConflict: 'external_id,source_app_id',
            }
          )

        if (upsertError) {
          console.error('Failed to upsert event:', upsertError)
        } else {
          if (existing) eventsUpdated++
          else eventsAdded++
        }
      }
    }

    // Update connection with new sync token and stats
    await supabase
      .from('google_calendar_connections' as any)
      .update({
        sync_token: nextSyncToken,
        last_sync_at: new Date().toISOString(),
        sync_status: 'synced',
        sync_error: null,
        total_syncs: connection.total_syncs + 1,
        total_events_synced: connection.total_events_synced + eventsAdded,
      })
      .eq('id', connection.id)

    // Log successful sync
    await supabase.from('google_calendar_push_logs' as any).insert({
      connection_id: connection.id,
      organization_id: connection.organization_id,
      event_type: 'sync_completed',
      events_added: eventsAdded,
      events_updated: eventsUpdated,
      events_deleted: eventsDeleted,
      success: true,
      duration_ms: Date.now() - startTime,
    })

    return {
      success: true,
      eventsAdded,
      eventsUpdated,
      eventsDeleted,
      nextSyncToken,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Update connection with error
    await supabase
      .from('google_calendar_connections' as any)
      .update({
        sync_status: 'error',
        sync_error: errorMessage,
        error_count: connection.error_count + 1,
      })
      .eq('id', connection.id)

    // Log failed sync
    await supabase.from('google_calendar_push_logs' as any).insert({
      connection_id: connection.id,
      organization_id: connection.organization_id,
      event_type: 'sync_failed',
      success: false,
      error_message: errorMessage,
      duration_ms: Date.now() - startTime,
    })

    return {
      success: false,
      eventsAdded: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      nextSyncToken: null,
      error: errorMessage,
    }
  }
}

// ============================================================================
// Connection Management
// ============================================================================

/**
 * Get connection for an organization
 */
export async function getConnection(
  organizationId: string
): Promise<GoogleCalendarConnection | null> {
  const supabase = await createClient()

  const { data, error } = (await supabase
    .from('google_calendar_connections' as any)
    .select('*')
    .eq('organization_id', organizationId)
    .single()) as { data: any; error: any }

  if (error || !data) {
    return null
  }

  return data as GoogleCalendarConnection
}

/**
 * Get connection by ID
 */
export async function getConnectionById(
  connectionId: string
): Promise<GoogleCalendarConnection | null> {
  const supabase = await createClient()

  const { data, error } = (await supabase
    .from('google_calendar_connections' as any)
    .select('*')
    .eq('id', connectionId)
    .single()) as { data: any; error: any }

  if (error || !data) {
    return null
  }

  return data as GoogleCalendarConnection
}

/**
 * Delete a connection and optionally its synced events
 */
export async function deleteConnection(
  connectionId: string,
  deleteEvents: boolean = false
): Promise<void> {
  const supabase = await createClient()

  // Get connection first
  const connection = await getConnectionById(connectionId)
  if (!connection) return

  // Stop push channel if exists
  if (connection.push_channel_id && connection.push_resource_id) {
    try {
      await stopPushChannel(
        connectionId,
        connection.push_channel_id,
        connection.push_resource_id
      )
    } catch (error) {
      console.warn('Failed to stop push channel during deletion:', error)
    }
  }

  // Delete synced events if requested
  if (deleteEvents) {
    await supabase
      .from('synced_events' as any)
      .delete()
      .eq('source_app_id', GOOGLE_CALENDAR_SOURCE_APP_ID)
      .eq('organization_id', connection.organization_id)
  }

  // Delete the connection
  await supabase
    .from('google_calendar_connections' as any)
    .delete()
    .eq('id', connectionId)
}

/**
 * Get connections with expiring push channels
 */
export async function getConnectionsWithExpiringChannels(): Promise<
  GoogleCalendarConnection[]
> {
  const supabase = await createClient()

  // Find connections where push channel expires within 1 day
  const expiryThreshold = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = (await supabase
    .from('google_calendar_connections' as any)
    .select('*')
    .eq('is_active', true)
    .not('push_channel_id', 'is', null)
    .lt('push_channel_expiry', expiryThreshold)) as { data: any; error: any }

  if (error) {
    console.error('Failed to get expiring connections:', error)
    return []
  }

  return (data || []) as GoogleCalendarConnection[]
}

/**
 * Get connections that need polling sync
 */
export async function getConnectionsNeedingSync(): Promise<
  GoogleCalendarConnection[]
> {
  const supabase = await createClient()

  // Find connections that haven't synced in the last hour
  const syncThreshold = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data, error } = (await supabase
    .from('google_calendar_connections' as any)
    .select('*')
    .eq('is_active', true)
    .or(`last_sync_at.is.null,last_sync_at.lt.${syncThreshold}`)) as { data: any; error: any }

  if (error) {
    console.error('Failed to get connections needing sync:', error)
    return []
  }

  return (data || []) as GoogleCalendarConnection[]
}
