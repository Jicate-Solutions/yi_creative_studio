/**
 * Google Calendar Status
 *
 * GET /api/google-calendar/status?organization_id=xxx
 *
 * Returns the connection status and health information.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getConnection } from '@/lib/services/google-calendar'
import {
  ConnectionStatusResponse,
  GOOGLE_CALENDAR_SOURCE_APP_ID,
} from '@/types/google-calendar.types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated and member of organization
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is member of the organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organizationId)
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership) {
      return NextResponse.json(
        { error: 'Not a member of this organization' },
        { status: 403 }
      )
    }

    // Get the connection
    const connection = await getConnection(organizationId)

    if (!connection) {
      const response: ConnectionStatusResponse = {
        connected: false,
        calendarName: null,
        calendarId: null,
        googleAccountEmail: null,
        lastSyncAt: null,
        syncStatus: 'disconnected',
        syncError: null,
        eventsCount: 0,
        pushChannelActive: false,
        pushChannelExpiry: null,
        isExpiringSoon: false,
      }
      return NextResponse.json(response)
    }

    // Get events count (handle case where synced_events table doesn't exist yet)
    let eventsCount = 0
    try {
      const result = await supabase
        .from('synced_events' as any)
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId)
        .eq('source_app_id', GOOGLE_CALENDAR_SOURCE_APP_ID)
      eventsCount = result.count || 0
    } catch (error) {
      console.warn('[Google Calendar Status] synced_events table not found:', error)
      eventsCount = 0
    }

    // Check if push channel is expiring soon (within 1 day)
    const pushChannelExpiry = connection.push_channel_expiry
      ? new Date(connection.push_channel_expiry)
      : null
    const isExpiringSoon = pushChannelExpiry
      ? pushChannelExpiry.getTime() < Date.now() + 24 * 60 * 60 * 1000
      : false

    const response: ConnectionStatusResponse = {
      connected: connection.is_active,
      calendarName: connection.calendar_name,
      calendarId: connection.calendar_id,
      googleAccountEmail: connection.google_account_email,
      lastSyncAt: connection.last_sync_at,
      syncStatus: connection.sync_status,
      syncError: connection.sync_error,
      eventsCount: eventsCount || 0,
      pushChannelActive: !!connection.push_channel_id,
      pushChannelExpiry: connection.push_channel_expiry,
      isExpiringSoon,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Status error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get status' },
      { status: 500 }
    )
  }
}
