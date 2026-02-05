/**
 * Google Calendar Select
 *
 * POST /api/google-calendar/select-calendar
 *
 * Changes which calendar to sync events from.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getConnection,
  getCalendar,
  renewPushChannel,
  syncEvents,
} from '@/lib/services/google-calendar'
import { ensureValidAccessToken } from '@/lib/services/google-calendar/token-manager'
import { GOOGLE_CALENDAR_SOURCE_APP_ID } from '@/types/google-calendar.types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, calendar_id } = body

    if (!organization_id || !calendar_id) {
      return NextResponse.json(
        { error: 'organization_id and calendar_id are required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated and is admin
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin of the organization
    const { data: membership, error: memberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', organization_id)
      .eq('user_id', user.id)
      .single()

    if (memberError || !membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only organization admins can change calendar' },
        { status: 403 }
      )
    }

    // Get the connection
    const connection = await getConnection(organization_id)

    if (!connection) {
      return NextResponse.json(
        { error: 'No Google Calendar connection found' },
        { status: 404 }
      )
    }

    // Get valid access token
    const accessToken = await ensureValidAccessToken(connection.id)

    // Verify the calendar exists and is accessible
    const calendar = await getCalendar(accessToken, calendar_id)

    // Delete existing synced events for this source
    await supabase
      .from('synced_events')
      .delete()
      .eq('organization_id', organization_id)
      .eq('source_app_id', GOOGLE_CALENDAR_SOURCE_APP_ID)

    // Update connection with new calendar
    const { error: updateError } = await supabase
      .from('google_calendar_connections')
      .update({
        calendar_id: calendar_id,
        calendar_name: calendar.summary,
        calendar_timezone: calendar.timeZone,
        sync_token: null, // Reset sync token for full re-sync
        last_sync_at: null,
        sync_status: 'pending',
      })
      .eq('id', connection.id)

    if (updateError) {
      throw new Error('Failed to update calendar selection')
    }

    // Renew push channel for new calendar
    renewPushChannel({
      ...connection,
      calendar_id: calendar_id,
    }).catch(err => {
      console.error('Failed to renew push channel:', err)
    })

    // Trigger full sync for new calendar
    const updatedConnection = await getConnection(organization_id)
    if (updatedConnection) {
      syncEvents(updatedConnection, true).catch(err => {
        console.error('Failed to sync new calendar:', err)
      })
    }

    return NextResponse.json({
      success: true,
      calendar_id: calendar_id,
      calendar_name: calendar.summary,
    })
  } catch (error) {
    console.error('Select calendar error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to select calendar',
      },
      { status: 500 }
    )
  }
}
